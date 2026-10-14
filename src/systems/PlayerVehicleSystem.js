import * as THREE from 'three';
import { createFamilyCar } from './visuals/FamilyCarModel.js';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export const PLAYER_CAR_ID = 'family_car_01';

// Arcade handling (metres, seconds)
const MAX_SPEED = 13;      // ~47 km/h: city driving
const MAX_REVERSE = 4.5;
const ACCEL = 5.5;
const BRAKE = 12;
const HANDBRAKE = 18;
const DRAG = 1.4;
const WHEELBASE = 2.56;
const MAX_STEER = 0.6;
const EXIT_SPEED = 1.2;    // must be (almost) stopped to get out
const STEP = 0.25;         // collision sub-step length (no tunnelling at speed)

/**
 * The player's one personal family car: enter / exit with E, arcade driving, collision against the
 * city, the boundary, traffic and people, a chase camera that avoids buildings, and a speed readout.
 * Other vehicles stay non-drivable traffic. The car stays wherever it was parked (and is saved).
 */
export class PlayerVehicleSystem {
  constructor(engine, collisionSystem, player, input, ui, spot) {
    this.engine = engine;
    this.collision = collisionSystem;
    this.player = player;
    this.input = input;
    this.ui = ui;

    const car = createFamilyCar(0x2e86c1);
    this.wheels = car.wheels;
    this.mesh = car.group;
    this.mesh.userData.vehicleId = PLAYER_CAR_ID;
    this.mesh.traverse(m => { if (m.isMesh) m.receiveShadow = true; });
    engine.scene.add(this.mesh);

    this.state = { x: spot.x, z: spot.z, heading: spot.heading, y: 0, pitch: 0, speed: 0, steer: 0 };
    this.footprint = { id: PLAYER_CAR_ID, x: spot.x, z: spot.z, heading: spot.heading, hw: car.halfWidth, hl: car.halfLength };
    this.driving = false;
    this.lastHint = null;
    this.camLook = new THREE.Vector3();
    this.firstDrive = true;

    // Hooks set by the game
    this.peopleProvider = () => [];
    this.canUse = () => true; // false inside buildings / during transitions

    // The parked or moving car is solid for people and traffic checks
    const prev = collisionSystem.vehicleProvider;
    collisionSystem.vehicleProvider = () => (prev ? [...prev(), this.footprint] : [this.footprint]);

    this.createHud();
    this.state.y = collisionSystem.getGroundHeight(spot.x, spot.z);
    this.syncMesh(0);
  }

  createHud() {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:22px', 'transform:translateX(-50%)', 'display:none', 'z-index:60',
      'background:rgba(15,23,42,0.72)', 'color:#fff', 'border-radius:14px', 'padding:8px 18px',
      'font:700 18px Cairo, Tajawal, sans-serif', 'direction:rtl', 'box-shadow:0 4px 14px rgba(0,0,0,.25)', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(el);
    this.hud = el;
    this.hudText = '';
  }

  // ─────────────────────────────────────────────────────────────
  // Geometry helpers
  // ─────────────────────────────────────────────────────────────
  /** Local (lateral x, forward z) offset to world for a car pose */
  toWorld(lx, lz, x = this.state.x, z = this.state.z, h = this.state.heading) {
    const c = Math.cos(h), s = Math.sin(h);
    return new THREE.Vector3(x + lx * c + lz * s, 0, z - lx * s + lz * c);
  }

  /** Would the car overlap anything solid at this pose? Three circles cover the body. */
  blockedAt(x, z, h) {
    const fp = this.footprint;
    const r = fp.hw;
    const off = fp.hl - fp.hw;
    for (const lz of [-off, 0, off]) {
      const p = this.toWorld(0, lz, x, z, h);
      if (this.collision.checkCollision(p, r, fp)) return 'solid';
    }
    // Never drive into people: they are checked against the real (oriented) footprint
    const test = { ...fp, x, z, heading: h };
    for (const q of this.peopleProvider()) {
      if (this.collision.vehiclePenetration(test, q.x, q.z, 0.3)) return 'person';
    }
    return null;
  }

  playerNear() {
    const p = this.player.position;
    return Math.hypot(p.x - this.state.x, p.z - this.state.z) < this.footprint.hl + 1.3;
  }

  // ─────────────────────────────────────────────────────────────
  // Enter / exit
  // ─────────────────────────────────────────────────────────────
  /** E pressed: returns true when the car consumed it */
  handleInteract() {
    if (this.driving) { this.tryExit(); return true; }
    if (this.canUse() && this.playerNear() && this.player.isGrounded) { this.enter(); return true; }
    return false;
  }

  enter() {
    this.driving = true;
    this.state.speed = 0;
    this.player.group.visible = false;
    this.camLook.set(this.state.x, this.state.y + 1, this.state.z);
    this.hud.style.display = 'block';
    audio.playClick();
    events.emit('VEHICLE_ENTERED', { id: PLAYER_CAR_ID });
    if (this.firstDrive) {
      this.firstDrive = false;
      events.emit('TOAST', '🚗 W/S: تقدّم ورجوع • A/D: انعطاف • المسافة: فرملة • E: النزول. احترم الراجلين والإشارات!');
    }
  }

  tryExit() {
    if (Math.abs(this.state.speed) > EXIT_SPEED) {
      events.emit('TOAST', '🛑 أوقف السيارة أولاً (اضغط المسافة للفرملة) ثم انزل.');
      return false;
    }
    const fp = this.footprint;
    // Driver's door first (left side), then passenger side, behind, in front, then wider spots
    const offsets = [[fp.hw + 0.7, 0.4], [-(fp.hw + 0.7), 0.4], [0, -(fp.hl + 0.8)], [0, fp.hl + 0.8],
      [fp.hw + 1.4, -1.0], [-(fp.hw + 1.4), -1.0], [fp.hw + 1.4, 1.4], [-(fp.hw + 1.4), 1.4]];
    const people = this.peopleProvider();
    for (const [lx, lz] of offsets) {
      const p = this.toWorld(lx, lz);
      if (this.collision.checkCollision(p, 0.42)) continue;
      if (people.some(q => Math.hypot(q.x - p.x, q.z - p.z) < 0.9)) continue;
      this.exitTo(p);
      return true;
    }
    events.emit('TOAST', '🚧 لا يوجد مكان آمن للنزول هنا. حرّك السيارة قليلاً.');
    return false;
  }

  exitTo(p) {
    this.driving = false;
    this.state.speed = 0;
    this.state.steer = 0;
    const pl = this.player;
    pl.position.set(p.x, this.collision.getGroundHeight(p.x, p.z), p.z);
    pl.group.position.copy(pl.position);
    pl.heading = this.state.heading;
    pl.group.rotation.y = pl.heading;
    pl.group.visible = true;
    this.input.yaw = this.state.heading + Math.PI; // camera behind the character, same view direction
    this.hud.style.display = 'none';
    audio.playClick();
    events.emit('VEHICLE_EXITED', { id: PLAYER_CAR_ID });
  }

  // ─────────────────────────────────────────────────────────────
  // Per frame
  // ─────────────────────────────────────────────────────────────
  update(dt) {
    dt = Math.min(dt, 0.05);
    if (this.driving) this.drive(dt);
    this.updateHint();
  }

  drive(dt) {
    const st = this.state;
    const { fwd, right, isJumping } = this.input.getMovementVector();
    let s = st.speed;

    // Throttle / brake / reverse
    if (fwd > 0) s = s < -0.05 ? Math.min(0, s + BRAKE * dt) : Math.min(MAX_SPEED, s + ACCEL * (1 - 0.5 * s / MAX_SPEED) * dt);
    else if (fwd < 0) s = s > 0.05 ? Math.max(0, s - BRAKE * dt) : Math.max(-MAX_REVERSE, s - ACCEL * 0.6 * dt);
    else s -= Math.sign(s) * Math.min(Math.abs(s), (DRAG + 0.02 * s * s) * dt);
    if (isJumping) s -= Math.sign(s) * Math.min(Math.abs(s), HANDBRAKE * dt);

    // Steering eases in and is gentler at speed; yaw follows the bicycle model (no turning on the spot)
    const target = -right * MAX_STEER * (1 - 0.55 * Math.min(1, Math.abs(s) / MAX_SPEED));
    st.steer += (target - st.steer) * Math.min(1, dt * 6);
    const yawRate = (s / WHEELBASE) * Math.tan(st.steer);

    // Move in short sub-steps; stop on contact
    const total = s * dt;
    const n = Math.max(1, Math.ceil(Math.abs(total) / STEP));
    for (let i = 0; i < n; i++) {
      const h = st.heading + yawRate * dt / n;
      const x = st.x + Math.sin(h) * total / n;
      const z = st.z + Math.cos(h) * total / n;
      const hit = this.blockedAt(x, z, h);
      if (hit) {
        if (Math.abs(s) > 3) {
          audio.playTone(110, 0.15, 'square');
          if (hit === 'person') events.emit('TOAST', '⚠️ انتبه! راجل أمام السيارة.');
        }
        s = -s * 0.12;
        break;
      }
      st.x = x; st.z = z; st.heading = h;
    }
    st.speed = s;

    // Follow the ground (curbs, courtyard) with a little pitch
    const f = this.toWorld(0, 1.3), b = this.toWorld(0, -1.3);
    const gy = Math.max(this.collision.getGroundHeight(st.x, st.z), 0);
    st.y += (gy - st.y) * Math.min(1, dt * 10);
    const pitch = Math.atan2(this.collision.getGroundHeight(f.x, f.z) - this.collision.getGroundHeight(b.x, b.z), 2.6);
    st.pitch += (pitch - st.pitch) * Math.min(1, dt * 8);
    this.syncMesh(dt);

    // The (hidden) player rides along so missions, map, traffic and pedestrians see where they are
    const pl = this.player;
    pl.position.set(st.x, st.y, st.z);
    pl.group.position.copy(pl.position);
    pl.heading = st.heading;

    this.updateCamera(dt);
    const kmh = Math.round(Math.abs(s) * 3.6);
    const text = `🚗 ${kmh} كم/سا${s < -0.3 ? ' • رجوع' : ''}`;
    if (text !== this.hudText) { this.hudText = text; this.hud.textContent = text; }
  }

  syncMesh(dt) {
    const st = this.state;
    const fp = this.footprint;
    fp.x = st.x; fp.z = st.z; fp.heading = st.heading;
    this.mesh.position.set(st.x, st.y, st.z);
    this.mesh.rotation.set(0, st.heading, 0);
    this.mesh.rotateX(-st.pitch);
    for (const w of this.wheels) {
      w.spin.rotation.x += (st.speed * dt) / 0.42;
      if (w.front) w.steer.rotation.y = st.steer;
    }
  }

  /** Chase camera behind and above the car, pulled in front of buildings that would block the view */
  updateCamera(dt) {
    const st = this.state;
    const fx = Math.sin(st.heading), fz = Math.cos(st.heading);
    const back = st.speed < -0.5 ? -5.5 : 7.0; // reversing: look from the front
    const from = new THREE.Vector3(st.x, st.y + 1.6, st.z);
    const desired = new THREE.Vector3(st.x - fx * back, st.y + 3.0, st.z - fz * back);
    const t = this.rayHitsBuilding(from, desired);
    if (t < 1) desired.lerpVectors(from, desired, Math.max(0.2, t - 0.08));
    const k = 1 - Math.exp(-dt * 6);
    const cam = this.engine.camera;
    cam.position.lerp(desired, k);
    this.camLook.lerp(new THREE.Vector3(st.x + fx * 2.5, st.y + 1.0, st.z + fz * 2.5), 1 - Math.exp(-dt * 10));
    cam.lookAt(this.camLook);
  }

  /** Fraction (0..1) along from->to where it first enters a tall static box, 1 if clear */
  rayHitsBuilding(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    let best = 1;
    for (const b of this.collision.staticBoxes) {
      if (b.max.y < 2.5) continue;
      let t0 = 0, t1 = best;
      const axes = [[from.x, dx, b.min.x, b.max.x], [from.y, dy, b.min.y, b.max.y], [from.z, dz, b.min.z, b.max.z]];
      let hit = true;
      for (const [o, d, lo, hi] of axes) {
        if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { hit = false; break; } continue; }
        let a = (lo - o) / d, c = (hi - o) / d;
        if (a > c) [a, c] = [c, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, c);
        if (t0 > t1) { hit = false; break; }
      }
      if (hit && t0 < best) best = t0;
    }
    return best;
  }

  updateHint() {
    let hint = null;
    if (this.driving) {
      hint = Math.abs(this.state.speed) <= EXIT_SPEED ? '🚗 اضغط <b>E</b> للنزول من السيارة' : null;
    } else if (this.canUse() && this.playerNear()) {
      hint = '🚗 اضغط <b>E</b> لركوب سيارة العائلة';
    }
    if (hint !== this.lastHint) {
      this.lastHint = hint;
      this.ui.setCustomHint(hint, 'vehicle');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Save / load (the car stays where it was parked)
  // ─────────────────────────────────────────────────────────────
  getState() {
    return { id: PLAYER_CAR_ID, x: +this.state.x.toFixed(2), z: +this.state.z.toFixed(2), heading: +this.state.heading.toFixed(3) };
  }

  loadState(saved) {
    if (!saved || saved.id !== PLAYER_CAR_ID || this.driving) return;
    if (this.blockedAt(saved.x, saved.z, saved.heading) === 'solid') return; // keep the driveway spot if the save is invalid
    Object.assign(this.state, { x: saved.x, z: saved.z, heading: saved.heading, speed: 0, steer: 0 });
    this.state.y = this.collision.getGroundHeight(saved.x, saved.z);
    this.syncMesh(0);
  }
}
