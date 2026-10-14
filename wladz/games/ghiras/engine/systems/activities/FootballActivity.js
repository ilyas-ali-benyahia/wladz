import * as THREE from 'three';
import { events } from '../../core/EventBus.js';
import { audio } from '../AudioSystem.js';
import { CharacterModel } from '../CharacterModel.js';
import { COAST_ORIGIN, PITCH } from '../coast/CoastDistrict.js';

const R = 0.11;             // ball radius (size 5 football)
const G = 9.81;
const SUBSTEPS = 4;
const MAX_KICK = 22;        // m/s at full power

/** Pitch-local (x along the pitch towards the attacked goal at +x, z across) -> district-local */
const PX = (x) => PITCH.cx + x;
const PZ = (z) => PITCH.cz + z;

function makeBallMesh() {
  // Truncated-icosahedron look: white sphere with black pentagon patches (vertex colours, smooth normals)
  const geo = new THREE.IcosahedronGeometry(R, 3);
  const base = new THREE.IcosahedronGeometry(1, 0).attributes.position;
  const dirs = [];
  for (let i = 0; i < base.count; i++) {
    const v = new THREE.Vector3(base.getX(i), base.getY(i), base.getZ(i)).normalize();
    if (!dirs.some(d => d.distanceTo(v) < 1e-3)) dirs.push(v);
  }
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    // colour per face (face centre direction)
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k++) v.add(new THREE.Vector3(p.getX(i + k), p.getY(i + k), p.getZ(i + k)));
    v.normalize();
    const black = dirs.some(d => d.angleTo(v) < 0.3);
    for (let k = 0; k < 3; k++) { const c = black ? 0.08 : 0.96; col[(i + k) * 3] = c; col[(i + k) * 3 + 1] = c; col[(i + k) * 3 + 2] = c; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const nrm = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); nrm[i * 3] = v.x; nrm[i * 3 + 1] = v.y; nrm[i * 3 + 2] = v.z; }
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }));
  mesh.castShadow = true;
  return mesh;
}

/**
 * Football: one reusable ball with simple, stable physics in district-local coordinates, player control
 * (dribble by running into it, hold F / left mouse to charge a pass or shot, R to fetch the ball) and
 * helpers used by the training stages (cones, rings, targets, NPC keeper / defender / teammate).
 */
export class Football {
  constructor(coast, game) {
    this.coast = coast;
    this.game = game;
    this.mesh = makeBallMesh();
    this.mesh.visible = false;
    coast.group.add(this.mesh);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.active = false;
    this.cones = [];
    this.npcBodies = [];
    this.charge = 0;
    this.wasHeld = false;
    this.allowReset = true;
    this.lastPlayer = null;
    this.playerSpeed = 0;
    this.onGoal = null;
    this.onKick = null;
    this.events = []; // per-frame: goals / cone knocks for stages
    const meter = document.createElement('div');
    meter.id = 'kick-meter';
    meter.innerHTML = '<div></div>';
    document.body.appendChild(meter);
    this.meter = meter;
    this.goals = [-1, 1].map(s => ({ s, x: PX(s * PITCH.halfL) }));
  }

  /** Put the ball at a pitch-local spot, at rest */
  place(x, z) {
    this.pos.set(PX(x), R, PZ(z));
    this.vel.set(0, 0, 0);
    this.active = true;
    this.mesh.visible = true;
    this.syncMesh();
  }

  hide() {
    this.active = false;
    this.mesh.visible = false;
    this.meter.classList.remove('show');
    this.charge = 0;
  }

  /** Ball position in pitch-local coordinates */
  local() { return { x: this.pos.x - PITCH.cx, z: this.pos.z - PITCH.cz, y: this.pos.y }; }
  speed() { return Math.hypot(this.vel.x, this.vel.z); }

  playerLocal() {
    const p = this.game.player.position;
    return { x: p.x - COAST_ORIGIN.x, z: p.z - COAST_ORIGIN.z, heading: this.game.player.heading };
  }

  /** Kick in a horizontal direction (dx, dz) with power 0..1 */
  kick(dx, dz, power) {
    const l = Math.hypot(dx, dz) || 1;
    // Non-linear: short taps give controllable passes, a full charge a real shot
    const speed = 4 + (MAX_KICK - 4) * Math.pow(power, 1.5);
    const lift = power > 0.55 ? (power - 0.45) * 7.5 : 0.4 + power;
    this.vel.set(dx / l * speed, lift, dz / l * speed);
    audio.playKick(power);
    if (this.onKick) this.onKick(power);
  }

  // ─────────────────────────────────────────────────────────────
  update(dt) {
    if (!this.active) return;
    this.events.length = 0;
    this.handlePlayer(dt);
    const h = Math.min(dt, 0.05) / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) this.step(h);
    this.syncMesh(Math.min(dt, 0.05));
  }

  handlePlayer(dt) {
    const pl = this.game.player;
    const p = this.playerLocal();
    if (this.lastPlayer) this.playerSpeed = Math.hypot(p.x - this.lastPlayer.x, p.z - this.lastPlayer.z) / Math.max(dt, 1e-3);
    this.lastPlayer = p;
    if (pl.swimming) return;
    const fx = Math.sin(p.heading), fz = Math.cos(p.heading);
    const dx = this.pos.x - p.x, dz = this.pos.z - p.z;
    const dist = Math.hypot(dx, dz);
    const onGround = this.pos.y < R + 0.06;

    // Dribble: running into the ball keeps it rolling just ahead of the feet
    if (onGround && dist < 0.95 && this.playerSpeed > 1.0 && (dx * fx + dz * fz) > 0.3 * dist) {
      const tx = p.x + fx * 0.75, tz = p.z + fz * 0.75;
      const sp = Math.min(this.playerSpeed * 1.05, 9);
      this.vel.x = fx * sp + (tx - this.pos.x) * 5;
      this.vel.z = fz * sp + (tz - this.pos.z) * 5;
    }

    // Charge while F / left mouse is held, kick on release
    const held = this.game.input.isActionHeld();
    if (held) {
      this.charge = Math.min(1, this.charge + dt / 0.9);
      this.meter.classList.add('show');
      this.meter.firstChild.style.width = `${Math.round(this.charge * 100)}%`;
    } else if (this.wasHeld) {
      if (dist < 1.4) {
        // Mostly where the player faces; a ball off to the side is poked where it is
        const side = dist > 0.05 ? (dx * fx + dz * fz) / dist : 1;
        const kx = side > 0.5 ? fx : dx, kz = side > 0.5 ? fz : dz;
        this.kick(kx, kz, Math.max(0.15, this.charge));
        pl.triggerAction('kick', 1.0);
      }
      this.charge = 0;
      this.meter.classList.remove('show');
    }
    this.wasHeld = held;

    // R: fetch the ball to your feet
    const r = !!this.game.input.keys.KeyR;
    if (r && !this.wasR && this.allowReset) this.place(p.x - PITCH.cx + fx * 0.8, p.z - PITCH.cz + fz * 0.8);
    this.wasR = r;
  }

  step(h) {
    const p = this.pos, v = this.vel;
    const prevX = p.x;
    v.y -= G * h;
    const onGround = p.y <= R + 1e-3 && v.y <= 0.01;
    const sp = Math.hypot(v.x, v.z);
    if (onGround && sp > 0) {
      // Rolling resistance grows a little with speed; the ball always comes to rest
      const ns = Math.max(0, sp - (1.0 + 0.22 * sp) * h);
      v.x *= ns / sp; v.z *= ns / sp;
    }
    v.multiplyScalar(1 - 0.02 * h);
    p.addScaledVector(v, h);

    // Ground with damped bounce
    if (p.y < R) {
      p.y = R;
      if (v.y < -1.0) { v.y = -v.y * 0.5; v.x *= 0.92; v.z *= 0.92; } else v.y = 0;
    }

    // Fence around the pitch
    const w = this.coast.pitchWalls;
    if (p.x < w.minX + R) { p.x = w.minX + R; v.x = Math.abs(v.x) * 0.5; }
    if (p.x > w.maxX - R) { p.x = w.maxX - R; v.x = -Math.abs(v.x) * 0.5; }
    if (p.z < w.minZ + R) { p.z = w.minZ + R; v.z = Math.abs(v.z) * 0.5; }
    if (p.z > w.maxZ - R) { p.z = w.maxZ - R; v.z = -Math.abs(v.z) * 0.5; }

    for (const g of this.goals) {
      // Posts (vertical cylinders)
      for (const t of [-1, 1]) {
        if (p.y > PITCH.goalH + R) continue;
        this.bounceCircle(g.x, PITCH.cz + t * PITCH.goalHalfW, 0.06 + R, 0.6);
      }
      // Crossbar (horizontal cylinder along z)
      if (Math.abs(p.z - PITCH.cz) < PITCH.goalHalfW) {
        const dx = p.x - g.x, dy = p.y - PITCH.goalH;
        const d = Math.hypot(dx, dy);
        if (d < 0.06 + R && d > 1e-6) {
          const nx = dx / d, ny = dy / d;
          p.x = g.x + nx * (0.06 + R); p.y = PITCH.goalH + ny * (0.06 + R);
          const vn = v.x * nx + v.y * ny;
          if (vn < 0) { v.x -= 1.6 * vn * nx; v.y -= 1.6 * vn * ny; }
        }
      }
      // Net: once over the line inside the frame the ball is caught by back / side / roof netting
      const behind = g.s * (p.x - g.x);
      if (behind > 0 && behind < PITCH.goalDepth + 0.5 && Math.abs(p.z - PITCH.cz) < PITCH.goalHalfW + 0.05 && p.y < PITCH.goalH + 0.05) {
        // Netting absorbs the ball: it drops and stays in the goal instead of bouncing back out
        v.multiplyScalar(1 - Math.min(1, 3 * h));
        const back = g.x + g.s * (PITCH.goalDepth - R);
        if (g.s * (p.x - back) > 0) { p.x = back; v.x = -g.s * Math.min(Math.abs(v.x) * 0.08, 0.4); v.z *= 0.5; }
        const side = PITCH.goalHalfW - R;
        if (Math.abs(p.z - PITCH.cz) > side) { p.z = PITCH.cz + Math.sign(p.z - PITCH.cz) * side; v.z *= -0.15; }
        if (p.y > PITCH.goalH - R) { p.y = PITCH.goalH - R; v.y *= -0.15; }
      }
      // Goal: the whole ball crosses the line between the posts and under the bar
      if (g.s * (prevX - g.x) <= 0 && g.s * (p.x - g.x) > 0 && Math.abs(p.z - PITCH.cz) < PITCH.goalHalfW - R && p.y < PITCH.goalH - R) {
        this.events.push({ type: 'goal', side: g.s, z: p.z - PITCH.cz, y: p.y });
        audio.playGoal();
        if (this.onGoal) this.onGoal(g.s, p.z - PITCH.cz);
      }
    }

    // Player and NPC bodies push the ball away (soft bounce)
    const pl = this.playerLocal();
    if (p.y < 1.2) this.bounceCircle(pl.x, pl.z, 0.35 + R, 0.3);
    for (const b of this.npcBodies) if (p.y < (b.h || 1.8)) this.bounceCircle(b.x, b.z, b.r + R, b.e ?? 0.3, b);

    // Training cones fall over when touched
    for (const c of this.cones) {
      if (c.fallen || p.y > 0.5) continue;
      if (Math.hypot(p.x - c.x, p.z - c.z) < 0.13 + R) this.knockCone(c, v.x, v.z);
    }
  }

  /** Circle obstacle in the ground plane: push out and reflect the normal velocity */
  bounceCircle(cx, cz, rr, e, body = null) {
    const p = this.pos, v = this.vel;
    const dx = p.x - cx, dz = p.z - cz;
    const d = Math.hypot(dx, dz);
    if (d >= rr || d < 1e-6) return false;
    const nx = dx / d, nz = dz / d;
    p.x = cx + nx * rr; p.z = cz + nz * rr;
    const vn = v.x * nx + v.z * nz;
    if (vn < 0) { v.x -= (1 + e) * vn * nx; v.z -= (1 + e) * vn * nz; }
    if (body) body.touched = true;
    return true;
  }

  addCone(x, z) {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.6 }));
    cone.position.y = 0.2;
    cone.castShadow = true;
    g.add(cone);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    stripe.position.y = 0.22;
    g.add(stripe);
    g.position.set(PX(x), 0.02, PZ(z));
    this.coast.group.add(g);
    const c = { x: PX(x), z: PZ(z), mesh: g, fallen: false, tip: 0 };
    this.cones.push(c);
    return c;
  }

  knockCone(c, vx, vz) {
    c.fallen = true;
    c.dir = Math.atan2(vx, vz);
    this.events.push({ type: 'cone', cone: c });
    audio.playTone(320, 0.12, 'triangle');
  }

  clearCones() {
    this.cones.forEach(c => this.coast.group.remove(c.mesh));
    this.cones = [];
  }

  syncMesh(dt = 0) {
    this.mesh.position.copy(this.pos);
    const sp = this.speed();
    if (sp > 0.01 && dt) {
      const axis = new THREE.Vector3(this.vel.z, 0, -this.vel.x).normalize();
      this.mesh.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, sp * dt / R));
    }
    // Knocked cones tip over
    this.cones.forEach(c => {
      if (!c.fallen || c.tip >= 1) return;
      c.tip = Math.min(1, c.tip + dt * 4);
      c.mesh.rotation.set(Math.cos(c.dir) * c.tip * 1.45, 0, -Math.sin(c.dir) * c.tip * 1.45);
    });
    // The player cannot walk through cones either: touching one knocks it over
    const pl = this.playerLocal();
    this.cones.forEach(c => { if (!c.fallen && Math.hypot(pl.x - c.x, pl.z - c.z) < 0.4) this.knockCone(c, Math.sin(pl.heading), Math.cos(pl.heading)); });
  }
}

// ─────────────────────────────────────────────────────────────
// Stage helpers
// ─────────────────────────────────────────────────────────────
function ring(ctx, x, z, r = 1.2, color = 0xf1c40f) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.15, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(PX(x), 0.05, PZ(z));
  ctx.coast.group.add(m);
  ctx.data.objs.push(m);
  return { x: PX(x), z: PZ(z), r, mesh: m };
}

function poleFrame(ctx, x, z, angle, width = 1.8, color = 0x2e86c1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  [-1, 1].forEach(s => { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 10), mat); pole.position.set(s * width / 2, 0.5, 0); g.add(pole); });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, width, 10), mat);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 1.0;
  g.add(bar);
  g.position.set(PX(x), 0, PZ(z));
  g.rotation.y = angle;
  ctx.coast.group.add(g);
  ctx.data.objs.push(g);
  // posts in world for crossing test: along the frame's local x axis
  const c = Math.cos(angle), s = Math.sin(angle);
  return { a: { x: PX(x) - c * width / 2, z: PZ(z) + s * width / 2 }, b: { x: PX(x) + c * width / 2, z: PZ(z) - s * width / 2 }, mat, group: g };
}

/** Did the ball's path from prev to now cross segment a-b (2D)? */
function crossed(prev, now, a, b) {
  const d = (p, q, r) => (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x);
  return d(a, b, prev) * d(a, b, now) < 0 && d(prev, now, a) * d(prev, now, b) < 0;
}

function npc(ctx, kitColor, x, z, rotY) {
  const m = new CharacterModel('npc_adult', { isNPC: true, npcRole: 'citizen', primaryColor: kitColor, secondaryColor: 0xffffff, build: 1, height: 0.95 });
  m.group.position.set(PX(x), 0, PZ(z));
  m.group.rotation.y = rotY;
  ctx.coast.group.add(m.group);
  ctx.data.objs.push(m.group);
  const body = { x: PX(x), z: PZ(z), r: 0.42, h: 1.9, e: 0.35, model: m };
  ctx.football.npcBodies.push(body);
  return body;
}

function moveBody(b, tx, tz, speed, dt) {
  const dx = tx - b.x, dz = tz - b.z;
  const d = Math.hypot(dx, dz);
  const moving = d > 0.15;
  if (moving) {
    const st = Math.min(d, speed * dt);
    b.x += dx / d * st; b.z += dz / d * st;
    b.model.group.rotation.y = Math.atan2(dx, dz);
  }
  b.model.group.position.set(b.x, 0, b.z);
  b.model.update(dt, { isMoving: moving, speedRatio: speed / 3 });
}

/** Start every drill from the same spot, facing the attacked goal */
function startAt(ctx, x, z, heading = Math.PI / 2) {
  const g = ctx.game;
  g.interiors.teleport(new THREE.Vector3(COAST_ORIGIN.x + PX(x), 0, COAST_ORIGIN.z + PZ(z)), heading, heading + Math.PI);
  ctx.football.lastPlayer = null;
}

function setupCommon(ctx, ballX, ballZ, playerX, playerZ) {
  ctx.data.objs = [];
  ctx.football.clearCones();
  ctx.football.npcBodies.length = 0;
  ctx.football.allowReset = true;
  ctx.football.place(ballX, ballZ);
  startAt(ctx, playerX, playerZ);
  audio.playWhistle();
}

function cleanupCommon(ctx) {
  (ctx.data.objs || []).forEach(o => ctx.coast.group.remove(o));
  ctx.football.clearCones();
  ctx.football.npcBodies.length = 0;
  ctx.football.hide();
}

const pulse = (mesh, t, on) => { mesh.material.opacity = on ? 0.55 + Math.sin(t * 6) * 0.3 : 0.25; };

// ─────────────────────────────────────────────────────────────
// The coach's progressive training
// ─────────────────────────────────────────────────────────────
export function createFootballActivity(coast, football) {
  // Stage hooks are setup(ctx), update(dt, ctx), cleanup(ctx): attach the shared objects to ctx either way
  const withCtx = (fn) => (...args) => { const ctx = typeof args[0] === 'number' ? args[1] : args[0]; ctx.coast = coast; ctx.football = football; return fn(...args); };
  const B = () => football.local();

  const stages = [
    {
      id: 'control', title: 'السيطرة على الكرة', reward: { xp: 40, coins: 15 },
      brief: 'امشِ نحو الكرة لتدفعها أمامك، وقُدها إلى الدوائر المضيئة بالترتيب.',
      objective: 'قُد الكرة إلى الدائرة المضيئة',
      setup: withCtx((ctx) => {
        setupCommon(ctx, -14, 0, -16, 0);
        ctx.data.rings = [[-10, -5], [-3, 5], [4, -4]].map(([x, z]) => ring(ctx, x, z));
        ctx.data.k = 0;
      }),
      update: withCtx((dt, ctx) => {
        const rs = ctx.data.rings;
        rs.forEach((r, i) => pulse(r.mesh, ctx.time, i === ctx.data.k));
        const cur = rs[ctx.data.k];
        if (Math.hypot(football.pos.x - cur.x, football.pos.z - cur.z) < cur.r - 0.1) {
          cur.mesh.material.color.setHex(0x2ecc71);
          ctx.data.k++;
          audio.playCorrectAnswer();
        }
        return { progress: ctx.data.k / rs.length, text: `قُد الكرة إلى الدائرة المضيئة (${ctx.data.k}/${rs.length})`, done: ctx.data.k >= rs.length };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'cones', title: 'المراوغة بين الأقماع', reward: { xp: 60, coins: 20 },
      brief: 'راوغ بالكرة يميناً ويساراً بين الأقماع عبر الدوائر، دون أن تُسقط أي قمع.',
      objective: 'مرّ بالكرة عبر الدوائر بين الأقماع',
      setup: withCtx((ctx) => {
        setupCommon(ctx, -16, 0, -18, 0);
        [-12, -8, -4, 0, 4, 8].forEach(x => football.addCone(x, 0));
        ctx.data.rings = [-12, -8, -4, 0, 4, 8].map((x, i) => ring(ctx, x, i % 2 ? -1.7 : 1.7, 0.9));
        ctx.data.k = 0;
      }),
      update: withCtx((dt, ctx) => {
        if (football.cones.some(c => c.fallen)) return { failed: '🟠 سقط قمع!' };
        const rs = ctx.data.rings;
        rs.forEach((r, i) => pulse(r.mesh, ctx.time, i === ctx.data.k));
        const cur = rs[ctx.data.k];
        if (Math.hypot(football.pos.x - cur.x, football.pos.z - cur.z) < cur.r) {
          cur.mesh.material.color.setHex(0x2ecc71);
          ctx.data.k++;
          audio.playCorrectAnswer();
        }
        return { progress: ctx.data.k / rs.length, text: `راوغ عبر الدوائر دون إسقاط الأقماع (${ctx.data.k}/${rs.length})`, done: ctx.data.k >= rs.length };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'passing', title: 'التمرير الدقيق', reward: { xp: 60, coins: 20 },
      brief: 'مرّر الكرة عبر الإطارات الزرقاء واحداً بعد الآخر. اضغط F قليلاً لتمريرة قصيرة، وR لاسترجاع الكرة.',
      objective: 'مرّر الكرة عبر الإطار المضيء',
      setup: withCtx((ctx) => {
        setupCommon(ctx, -10, 0, -11.2, 0);
        ctx.data.frames = [[-2, -6], [4, 5], [10, -2]].map(([x, z]) => poleFrame(ctx, x, z, Math.atan2(x + 10, z)))  // frame faces the passing spot;
        ctx.data.k = 0;
        ctx.data.prev = { x: football.pos.x, z: football.pos.z };
      }),
      update: withCtx((dt, ctx) => {
        const fr = ctx.data.frames;
        fr.forEach((f, i) => f.mat.color.setHex(i < ctx.data.k ? 0x2ecc71 : i === ctx.data.k ? (Math.sin(ctx.time * 6) > 0 ? 0xf1c40f : 0x2e86c1) : 0x2e86c1));
        const now = { x: football.pos.x, z: football.pos.z };
        const cur = fr[ctx.data.k];
        if (football.pos.y < 1.0 && crossed(ctx.data.prev, now, cur.a, cur.b)) { ctx.data.k++; audio.playCorrectAnswer(); }
        ctx.data.prev = now;
        return { progress: ctx.data.k / fr.length, text: `مرّر الكرة عبر الإطار المضيء (${ctx.data.k}/${fr.length}) • R لاسترجاع الكرة`, done: ctx.data.k >= fr.length };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'shooting', title: 'التسديد الموجّه', reward: { xp: 80, coins: 25 },
      brief: 'سدّد في الجهة المضيئة من المرمى: أولاً الزاوية اليسرى ثم الزاوية اليمنى. اضغط F مطولاً لتسديدة قوية.',
      objective: 'سدّد في الجهة المضيئة من المرمى',
      setup: withCtx((ctx) => {
        setupCommon(ctx, 8, 0, 6.8, 0);
        // Highlight panels in the two halves of the goal mouth (player faces +x: left = +z)
        ctx.data.targets = [1, -1].map(side => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(PITCH.goalHalfW - 0.1, PITCH.goalH - 0.1), new THREE.MeshBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
          m.rotation.y = Math.PI / 2;
          m.position.set(PX(PITCH.halfL) + 0.05, PITCH.goalH / 2, PZ(side * PITCH.goalHalfW / 2));
          coast.group.add(m);
          ctx.data.objs.push(m);
          return { side, mesh: m };
        });
        ctx.data.k = 0;
        ctx.data.resetAt = null;
      }),
      update: withCtx((dt, ctx) => {
        const t = ctx.data.targets;
        t.forEach((x, i) => { x.mesh.visible = i >= ctx.data.k; x.mesh.material.opacity = i === ctx.data.k ? 0.3 + Math.sin(ctx.time * 6) * 0.15 : 0.08; });
        for (const e of football.events) {
          if (e.type !== 'goal' || e.side !== 1) continue;
          const want = t[ctx.data.k];
          if (want && Math.sign(e.z) === want.side) { ctx.data.k++; audio.playCorrectAnswer(); }
          else events.emit('TOAST', '⚽ هدف، لكن ليس في الجهة المطلوبة. حاول مجدداً!');
          ctx.data.resetAt = ctx.time + 1.5;
        }
        // Reset the ball for the next attempt once it has stopped or gone wide
        const b = B();
        if (!ctx.data.resetAt && football.speed() < 0.3 && b.x > 9) ctx.data.resetAt = ctx.time + 1.0;
        if (ctx.data.resetAt && ctx.time > ctx.data.resetAt) { ctx.data.resetAt = null; football.place(8, 0); }
        return { progress: ctx.data.k / t.length, text: ctx.data.k === 0 ? 'سدّد في الزاوية اليسرى المضيئة من المرمى' : 'الآن سدّد في الزاوية اليمنى المضيئة', done: ctx.data.k >= t.length };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'penalties', title: 'ضربات الجزاء', reward: { xp: 90, coins: 30 }, best: { label: 'أفضل نتيجة', better: 'higher', unit: '/5' },
      brief: 'خمس ضربات جزاء أمام الحارس. سجّل ثلاثة أهداف على الأقل.',
      objective: 'سجّل 3 أهداف من 5 ضربات',
      setup: withCtx((ctx) => {
        setupCommon(ctx, PITCH.halfL - 8, 0, PITCH.halfL - 9.3, 0);
        football.allowReset = false;
        ctx.data.keeper = npc(ctx, 0xf1c40f, PITCH.halfL - 0.4, 0, -Math.PI / 2);
        Object.assign(ctx.data, { taken: 0, goals: 0, phase: 'ready', t: 0 });
        football.onKick = () => {
          if (ctx.data.phase !== 'ready') return;
          ctx.data.phase = 'flight'; ctx.data.t = 0;
          // The keeper guesses a side: right about 45% of the time
          const ballSide = Math.sign(football.vel.z) || 1;
          ctx.data.dive = Math.random() < 0.45 ? ballSide : -ballSide;
        };
      }),
      update: withCtx((dt, ctx) => {
        const d = ctx.data, k = d.keeper;
        if (d.phase === 'flight') {
          d.t += dt;
          if (d.t > 0.18) moveBody(k, PX(PITCH.halfL - 0.4), PZ(d.dive * 1.7), 6.5, dt); else moveBody(k, k.x, k.z, 0, dt);
          const scored = football.events.some(e => e.type === 'goal' && e.side === 1);
          if (scored) { d.goals++; d.phase = 'result'; d.t = 0; events.emit('TOAST', '⚽ هدف!'); }
          else if (k.touched || d.t > 4 || (d.t > 0.6 && football.speed() < 0.3)) { d.phase = 'result'; d.t = 0; events.emit('TOAST', k.touched ? '🧤 تصدّى الحارس!' : '❌ ضاعت الفرصة'); }
        } else if (d.phase === 'result') {
          d.t += dt;
          if (d.t > 1.4) {
            d.taken++;
            k.touched = false;
            k.x = PX(PITCH.halfL - 0.4); k.z = PZ(0);
            football.place(PITCH.halfL - 8, 0);
            d.phase = 'ready';
          }
        } else {
          moveBody(k, PX(PITCH.halfL - 0.4), PZ(Math.sin(ctx.time * 1.5) * 0.6), 1.2, dt);
        }
        const left = 5 - d.taken;
        if (d.goals >= 3 && d.phase === 'ready') return { done: true, score: d.goals, progress: 1 };
        if (d.goals + left < 3 && d.phase === 'ready') return { failed: `🧤 سجّلت ${d.goals} من 5 فقط.` };
        if (d.taken >= 5 && d.phase === 'ready') return d.goals >= 3 ? { done: true, score: d.goals } : { failed: `🧤 سجّلت ${d.goals} من 5 فقط.` };
        return { progress: d.goals / 3, text: `ضربة ${Math.min(5, d.taken + 1)} من 5 • الأهداف: ${d.goals} (المطلوب 3)` };
      }),
      cleanup: withCtx((ctx) => { football.onKick = null; cleanupCommon(ctx); })
    },
    {
      id: 'course', title: 'مسار المهارات المؤقت', reward: { xp: 90, coins: 30 }, timeLimit: 60, best: { label: 'أفضل زمن', better: 'lower', unit: 's' },
      brief: 'قُد الكرة عبر خمس دوائر في أرجاء الملعب قبل انتهاء 60 ثانية.',
      objective: 'قُد الكرة عبر الدوائر بالترتيب',
      setup: withCtx((ctx) => {
        setupCommon(ctx, -14, 0, -16, 0);
        ctx.data.rings = [[-8, 8], [2, -8], [10, 7], [15, -5], [4, 0]].map(([x, z]) => ring(ctx, x, z, 1.3, 0x5dade2));
        [[-3, 4], [6, -3], [12, 2]].forEach(([x, z]) => football.addCone(x, z));
        ctx.data.k = 0;
      }),
      update: withCtx((dt, ctx) => {
        const rs = ctx.data.rings;
        rs.forEach((r, i) => pulse(r.mesh, ctx.time, i === ctx.data.k));
        const cur = rs[ctx.data.k];
        if (Math.hypot(football.pos.x - cur.x, football.pos.z - cur.z) < cur.r - 0.1) { cur.mesh.material.color.setHex(0x2ecc71); ctx.data.k++; audio.playCorrectAnswer(); }
        const done = ctx.data.k >= rs.length;
        return { progress: ctx.data.k / rs.length, text: `الدائرة ${Math.min(rs.length, ctx.data.k + 1)} من ${rs.length} • تجنّب الأقماع`, done, score: done ? Math.round(ctx.time * 10) / 10 : undefined };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'match', title: 'مباراة قصيرة مع الفريق', reward: { xp: 120, coins: 50 }, timeLimit: 150, best: { label: 'أسرع فوز', better: 'lower', unit: 's' },
      brief: 'مع زميلك في الفريق، سجّل هدفين أمام المدافع والحارس قبل نهاية الوقت. اللعب النظيف أولاً!',
      objective: 'سجّل هدفين',
      setup: withCtx((ctx) => {
        setupCommon(ctx, 0, 0, -2.5, 0);
        football.allowReset = false;
        const d = ctx.data;
        d.keeper = npc(ctx, 0xf1c40f, PITCH.halfL - 0.5, 0, -Math.PI / 2);
        d.defender = npc(ctx, 0xc0392b, 8, 0, -Math.PI / 2);
        d.mate = npc(ctx, 0x1e8449, 4, 5, Math.PI / 2);
        Object.assign(d, { goals: 0, cooldown: 0, mateCd: 0, pause: 0 });
      }),
      update: withCtx((dt, ctx) => {
        const d = ctx.data;
        const b = football.pos;
        d.cooldown -= dt; d.mateCd -= dt;
        if (d.pause > 0) {
          d.pause -= dt;
          if (d.pause <= 0) { football.place(0, 0); d.defender.x = PX(8); d.defender.z = PZ(0); }
          [d.keeper, d.defender, d.mate].forEach(n => moveBody(n, n.x, n.z, 0, dt));
          return { progress: d.goals / 2, text: `⚽ الأهداف: ${d.goals} / 2` };
        }
        // Defender: chases the ball and clears it upfield
        moveBody(d.defender, b.x, b.z, 3.1, dt);
        if (d.cooldown <= 0 && Math.hypot(b.x - d.defender.x, b.z - d.defender.z) < 0.75 && b.y < 0.5) {
          football.kick(-1, (Math.random() - 0.5) * 1.2, 0.45);
          d.cooldown = 1.4;
        }
        // Keeper: follows the ball across the goal mouth
        moveBody(d.keeper, PX(PITCH.halfL - 0.5), PZ(THREE.MathUtils.clamp(b.z - PITCH.cz, -PITCH.goalHalfW + 0.5, PITCH.goalHalfW - 0.5)), 2.6, dt);
        // Teammate: finds space ahead and passes back when the ball reaches them
        const side = (b.z - PITCH.cz) > 0 ? -5 : 5;
        moveBody(d.mate, Math.min(b.x + 6, PX(PITCH.halfL - 4)), PZ(side), 3.4, dt);
        if (d.mateCd <= 0 && Math.hypot(b.x - d.mate.x, b.z - d.mate.z) < 0.8 && b.y < 0.5) {
          const p = football.playerLocal();
          const dx = p.x - b.x, dz = p.z - b.z;
          football.kick(dx, dz, Math.min(0.55, 0.12 + Math.hypot(dx, dz) * 0.03));
          d.mateCd = 1.5;
        }
        if (football.events.some(e => e.type === 'goal' && e.side === 1)) { d.goals++; d.pause = 2; events.emit('TOAST', `⚽ هدف! (${d.goals}/2)`); }
        if (football.events.some(e => e.type === 'goal' && e.side === -1)) { d.pause = 2; events.emit('TOAST', '😅 الكرة دخلت مرماكم، لا بأس، استمر!'); }
        const done = d.goals >= 2;
        return { progress: d.goals / 2, text: `⚽ الأهداف: ${d.goals} / 2 • تعاون مع زميلك (الأخضر)`, done, score: done ? Math.round(ctx.time * 10) / 10 : undefined };
      }),
      cleanup: withCtx(cleanupCommon)
    }
  ];

  return {
    id: 'football', title: 'تدريب كرة القدم', icon: '⚽', giver: 'المدرب كريم',
    intro: 'أهلاً بك في ملعب الأمل! الرياضة تعلّمنا الانضباط واحترام الزملاء والخصم. نبدأ بالسيطرة على الكرة، وكلما أتقنت مهارة فتحتُ لك التدريب التالي. التحكم: امشِ نحو الكرة لتدفعها، واضغط F (أو زر الفأرة الأيسر) مطولاً ثم أفلته للتمرير أو التسديد.',
    finale: 'صرت لاعباً متكاملاً، والروح الرياضية أهم من الفوز!',
    stages,
    freePlay: {
      title: '⚽ لعب حر', brief: 'العب بالكرة كما تشاء. R لاسترجاعها، وF للتسديد.',
      setup: withCtx((ctx) => { setupCommon(ctx, 0, 0, -2, 0); }),
      update: withCtx(() => ({ text: 'لعب حر: سدّد في أي مرمى • R لاسترجاع الكرة • تحدّث مع المدرب للإنهاء', progress: 0 })),
      cleanup: withCtx(cleanupCommon)
    }
  };
}
