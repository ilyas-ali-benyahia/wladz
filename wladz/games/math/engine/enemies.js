// ══════════════════════════════════════════════════════════════════
//  enemies.js  (v6)
//  • Hover robots: visor, antenna, chest core, thruster skirt
//  • Strafing approach (lateral drift → dodge-pressured aiming)
//  • Red danger telegraph when a robot closes to lunge range
//  • Expanding spawn portals (pooled, one per spawn slot)
//  • Unique IDs  • isDestroyed flag  • Cached number textures
//  • Billboard always face-camera  • Scale-in spawn / shrink destroy
//  • Pooled, dt-driven particles (no per-explosion allocations)
//  • No allocations inside update()
// ══════════════════════════════════════════════════════════════════
import * as THREE from 'three';

// ── Shared geometry pool (created once at module load) ────────────
const GEO = {
  torso:  new THREE.BoxGeometry(0.80, 1.05, 0.36),
  head:   new THREE.BoxGeometry(0.54, 0.54, 0.42),
  visor:  new THREE.BoxGeometry(0.40, 0.11, 0.05),
  ant:    new THREE.CylinderGeometry(0.015, 0.015, 0.30, 5),
  antTip: new THREE.SphereGeometry(0.035, 6, 5),
  core:   new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12),
  arm:    new THREE.CylinderGeometry(0.095, 0.075, 0.68, 6),
  shdr:   new THREE.SphereGeometry(0.16, 6, 5),
  pelvis: new THREE.BoxGeometry(0.52, 0.34, 0.30),
  skirt:  new THREE.CylinderGeometry(0.26, 0.12, 0.38, 8),
  thrus:  new THREE.CylinderGeometry(0.14, 0.22, 0.16, 8),
  // Keep the original aiming area; only the artwork inside it is smaller.
  panel:  new THREE.PlaneGeometry(1.6, 1.6),
  panelFrame: new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([
    -0.66, 0.45, 0.002, 0.66, 0.45, 0.002, 0.66, -0.45, 0.002, -0.66, -0.45, 0.002,
  ], 3)),
  shadow: new THREE.PlaneGeometry(2.5, 2.1),
  spark:  new THREE.SphereGeometry(0.07, 4, 4),
};

// ── Shared base materials (created once) ─────────────────────────
const MAT = {
  body:    new THREE.MeshStandardMaterial({ color: 0x526780, roughness: 0.52, metalness: 0.4 }),
  acc:     new THREE.MeshStandardMaterial({ color: 0x2d4e63, emissive: 0x06424b, emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.35 }),
  eye:     new THREE.MeshStandardMaterial({ color: 0x65d7db, emissive: 0x00ffe7, emissiveIntensity: 1.35 }),
  thruster: new THREE.MeshStandardMaterial({ color: 0x287fba, emissive: 0x00b8ff, emissiveIntensity: 1.15 }),
  aimFrame: new THREE.LineBasicMaterial({ color: 0x75ede5, depthTest: false, depthWrite: false }),
  revealFrame: new THREE.LineBasicMaterial({ color: 0x5dffa0, depthTest: false, depthWrite: false }),
  dangerFrame: new THREE.LineBasicMaterial({ color: 0xff667c, depthTest: false, depthWrite: false }),
};

// One small texture/material shared by the pooled shadows and idle preview.
// These are floor decals, outside the robot hierarchy and its hit-test list.
let shadowMaterial;
function createContactShadow() {
  if (!shadowMaterial) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 3, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(0.45, 'rgba(0,0,0,0.28)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    shadowMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false,
    });
  }
  const shadow = new THREE.Mesh(GEO.shadow, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.visible = false;
  return shadow;
}

// ── Unique enemy ID counter ───────────────────────────────────────
let _uid = 0;
function nextId() { return ++_uid; }

// ── Number texture cache (created once per distinct value) ────────
// Answers are small positive integers, so the cache stays naturally
// bounded; it is flushed if it ever exceeds a hard cap.
const NUM_TEX_CAP = 256;
const _numTexCache = new Map();

function numMaterial(num) {
  let mat = _numTexCache.get(num);
  if (!mat) {
    if (_numTexCache.size >= NUM_TEX_CAP) {
      for (const m of _numTexCache.values()) { m.map.dispose(); m.dispose(); }
      _numTexCache.clear();
    }
    mat = new THREE.MeshBasicMaterial({
      map:         makeNumTexture(num),
      transparent: true,
      depthTest:   false, // Ensure it draws over the robot body
      depthWrite:  false,
      side:        THREE.DoubleSide,
    });
    _numTexCache.set(num, mat);
  }
  return mat;
}

// ── Canvas texture for number (synchronous, no web font dependency) ──────────
function makeNumTexture(num) {
  const S   = 512;
  const cv  = document.createElement('canvas');
  cv.width  = S;
  cv.height = S;
  const ctx = cv.getContext('2d');

  // A compact chest display within the unchanged transparent hit plane.
  // The shorter face leaves the visor, shoulders and lower body exposed.
  ctx.fillStyle = '#091923';
  ctx.fillRect(44, 112, 424, 288);
  ctx.strokeStyle = '#4c9caa';
  ctx.lineWidth = 3;
  ctx.strokeRect(45.5, 113.5, 421, 285);
  // Small cyan corner accents, without a glowing frame around the digits.
  ctx.strokeStyle = '#84dfdf';
  ctx.lineWidth = 5;
  for (const [x, y, dx, dy] of [[46,114,1,1],[466,114,-1,1],[46,398,1,-1],[466,398,-1,-1]]) {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 22); ctx.lineTo(x, y); ctx.lineTo(x + dx * 22, y);
    ctx.stroke();
  }

  // Retain the original digit height, with a clean system font and no blur.
  const label = String(num);
  const fs    = label.length > 2 ? 194 : 250;
  ctx.font         = `700 ${fs}px Arial, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#eefaff';
  ctx.fillText(label, S / 2, S / 2 + 14);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ── Robot body builder ────────────────────────────────────────────
// Hover droid: visor head with antenna, chest reactor core, and a
// tapered skirt with a glowing thruster (no legs — they strafe).
function buildRobotBody() {
  const root = new THREE.Group();
  const acc  = MAT.acc;
  const eye  = MAT.eye;

  const torso = new THREE.Mesh(GEO.torso, MAT.body);
  torso.position.y = 1.0; root.add(torso);

  // Chest reactor (emissive disc)
  const core = new THREE.Mesh(GEO.core, eye);
  core.rotation.x = Math.PI / 2;
  core.position.set(0, 1.18, 0.19); root.add(core);

  const head = new THREE.Mesh(GEO.head, MAT.body);
  head.position.y = 1.78; root.add(head);

  // Single wide visor — a cleaner read at distance than two eyes
  const visor = new THREE.Mesh(GEO.visor, eye);
  visor.position.set(0, 1.80, 0.22); root.add(visor);

  // Antenna with beacon tip
  const ant = new THREE.Mesh(GEO.ant, MAT.body);
  ant.position.set(0.18, 2.16, 0); root.add(ant);
  const tip = new THREE.Mesh(GEO.antTip, eye);
  tip.position.set(0.18, 2.32, 0); root.add(tip);

  [-0.60, 0.60].forEach(x => {
    const s = new THREE.Mesh(GEO.shdr, acc);
    s.position.set(x, 1.32, 0); root.add(s);
  });
  [-0.73, 0.73].forEach(x => {
    const a = new THREE.Mesh(GEO.arm, MAT.body);
    a.position.set(x, 0.84, 0); root.add(a);
  });

  // Hover lower body: pelvis block + tapered skirt + thruster glow
  const pelvis = new THREE.Mesh(GEO.pelvis, MAT.body);
  pelvis.position.y = 0.36; root.add(pelvis);
  const skirt = new THREE.Mesh(GEO.skirt, acc);
  skirt.position.y = 0.06; root.add(skirt);
  const thrus = new THREE.Mesh(GEO.thrus, MAT.thruster);
  thrus.position.y = -0.14; root.add(thrus);

  return root;
}

// A presentation-only droid: shares the live robot's assets, never enters the
// enemy pool, never requests a math question and cannot be targeted.
export function createRobotPreview(scene) {
  const root = new THREE.Group();
  root.add(buildRobotBody());
  const panel = new THREE.Mesh(GEO.panel, numMaterial(12));
  panel.position.set(0, 1.1, 0.45);
  panel.renderOrder = 10;
  root.add(panel);
  scene.add(root);
  const shadow = createContactShadow();
  scene.add(shadow);
  return { root, shadow };
}

// ── Arc formation positions (z = close!) ─────────────────────────
function arcPos() {
  return [
    new THREE.Vector3(-4.4, 0, -7.5),
    new THREE.Vector3( 0.0, 0, -8.8),
    new THREE.Vector3( 4.4, 0, -7.5),
  ];
}

// ── Pooled particle system ────────────────────────────────────────
// One shared geometry + a handful of shared materials. Particles
// shrink-fade (no per-particle material), so bursts allocate nothing.
const SPARK_MATS = {
  correct: [0x00ffe7, 0x2aff7a, 0xffffff, 0xffcc00].map(c => new THREE.MeshBasicMaterial({ color: c })),
  wrong:   [0xff4466, 0x7b2fff, 0xff8866, 0xffffff].map(c => new THREE.MeshBasicMaterial({ color: c })),
};
const SPARK_POOL_SIZE = 72;

class SparkPool {
  constructor(scene) {
    this.scene = scene;
    this.items = new Array(SPARK_POOL_SIZE);
    this.cursor = 0;
    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(GEO.spark, SPARK_MATS.correct[0]);
      mesh.visible = false;
      scene.add(mesh);
      this.items[i] = { mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, scale: 1 };
    }
  }

  burst(pos, isCorrect) {
    const palette = isCorrect ? SPARK_MATS.correct : SPARK_MATS.wrong;
    for (let i = 0; i < 18; i++) {
      const it = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % SPARK_POOL_SIZE;
      it.mesh.material = palette[i % palette.length];
      it.mesh.position.copy(pos);
      it.mesh.visible = true;
      it.vx = (Math.random() - 0.5) * 5.5;
      it.vy = Math.random() * 5;
      it.vz = (Math.random() - 0.5) * 5.5;
      it.maxLife = 0.5 + Math.random() * 0.35;
      it.life = it.maxLife;
      it.scale = 0.6 + Math.random() * 0.7;
    }
  }

  update(dt) {
    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      const it = this.items[i];
      if (it.life <= 0) continue;
      it.life -= dt;
      if (it.life <= 0) { it.mesh.visible = false; continue; }
      it.mesh.position.x += it.vx * dt;
      it.mesh.position.y += it.vy * dt;
      it.mesh.position.z += it.vz * dt;
      it.vy -= 8.5 * dt;
      it.mesh.scale.setScalar(it.scale * (it.life / it.maxLife));
    }
  }
}

// ── EnemyManager ─────────────────────────────────────────────────
const PORTAL_T = 0.7;   // spawn-portal lifetime (seconds)
const DANGER_R2 = 3.5 * 3.5;  // danger-telegraph radius² (gameplay hit at 1.5)

export class EnemyManager {
  constructor(scene, camera) {
    this.scene  = scene;
    this.camera = camera;
    this.pool   = [];     // array of enemy objects
    this.sparks = new SparkPool(scene);
    this._highlighted = null;

    this.shadows = Array.from({ length: 3 }, () => {
      const shadow = createContactShadow();
      scene.add(shadow);
      return shadow;
    });
    this.outlines = Array.from({ length: 3 }, () => {
      const outline = new THREE.LineLoop(GEO.panelFrame, MAT.aimFrame);
      outline.renderOrder = 11;
      outline.visible = false;
      return outline;
    });

    // Spawn portals — 3 reusable expanding rings (one per spawn slot)
    this.portals = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ffe7, transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.78, 28), mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      ring.visible = false;
      scene.add(ring);
      this.portals.push({ mesh: ring, mat, life: 0 });
    }
  }

  // Spawn exactly 3 enemies; one correct answer + two unique decoys
  // (generated by MathEngine; validated here as a safety net)
  spawnWave(answer, decoys, speed) {
    this.clearAll();

    const safe = sanitizeDecoys(answer, decoys);
    const entries = shuffle([
      { number: answer,  isCorrect: true  },
      { number: safe[0], isCorrect: false },
      { number: safe[1], isCorrect: false },
    ]);

    const positions = arcPos();
    for (let i = 0; i < entries.length; i++) {
      this._spawnOne(entries[i].number, entries[i].isCorrect, positions[i], speed);
      // Spawn portal flash under each robot
      const p = this.portals[i];
      p.mesh.position.set(positions[i].x, 0.02, positions[i].z);
      p.mesh.scale.setScalar(0.5);
      p.mesh.visible = true;
      p.life = PORTAL_T;
    }
  }

  _spawnOne(number, isCorrect, position, speed) {
    const id   = nextId();
    const root = new THREE.Group();
    root.position.copy(position);
    root.scale.setScalar(0.01);   // start tiny → grows in update

    // Body
    const body = buildRobotBody();
    root.add(body);

    // Crisp chest display; its full plane retains the original hit area.
    const panel = new THREE.Mesh(GEO.panel, numMaterial(number));
    panel.position.set(0, 1.1, 0.45); // Float well in front of chest
    // Higher renderOrder ensures it renders after opaque objects
    panel.renderOrder = 10;
    root.add(panel);
    // Status outlines remain legible without relying on bloom. Lines are not
    // meshes, so they never enter the existing hit-test list below.
    const outline = this.outlines[this.pool.length];
    outline.visible = false;
    panel.add(outline);

    // Glow light
    const glow = new THREE.PointLight(0x00ffe7, 1.4, 3);
    glow.position.set(0, 1.2, 0.35);
    root.add(glow);

    this.scene.add(root);
    const shadow = this.shadows[this.pool.length];
    shadow.position.set(position.x, 0.012, position.z);
    shadow.scale.setScalar(0.01);
    shadow.visible = true;

    // Precompute the hit-test mesh list once (no per-frame traversal)
    const hitMeshes = [];
    root.traverse(c => { if (c.isMesh) hitMeshes.push(c); });

    this.pool.push({
      id, root, body, panel, glow, hitMeshes, shadow, outline,
      number, isCorrect, speed,
      bob:        Math.random() * Math.PI * 2,
      spawnT:     0,      // 0 → 1, grow
      destroyT:   -1,     // -1 = alive, 0→1 = shrinking
      shakeT:     0,      // wrong-answer shake, seconds remaining
      revealed:   false,  // correct-answer reveal (educational feedback)
      isDestroyed: false,
      highlighted: false,
      danger:      false, // inside lunge range → red telegraph
      // Lateral strafe (desynchronized per robot so the arc breathes)
      swayT: 0,
      swayPhase: Math.random() * Math.PI * 2,
      swayFreq:  1.3 + Math.random() * 0.6,
      swayAmp:   0.35 + speed * 0.35,
    });
  }

  update(dt, playerPos) {
    const toRemove = [];

    for (const e of this.pool) {
      if (e.isDestroyed) continue;

      // Spawn grow-in
      if (e.spawnT < 1) {
        e.spawnT = Math.min(1, e.spawnT + dt * 5.5);
        const sc = easeOut(e.spawnT);
        e.root.scale.setScalar(sc);
      }

      // Destroy shrink-out
      if (e.destroyT >= 0) {
        e.destroyT = Math.min(1, e.destroyT + dt * 7);
        const sc = easeOut(1 - e.destroyT);
        e.root.scale.setScalar(sc);
        e.shadow.scale.setScalar(sc);
        if (e.destroyT >= 1) {
          this.scene.remove(e.root);
          e.shadow.visible = false;
          e.isDestroyed = true;
          toRemove.push(e);
        }
        continue;
      }

      // Movement toward player (XZ) + lateral strafe drift
      const dx = playerPos.x - e.root.position.x;
      const dz = playerPos.z - e.root.position.z;
      const lenSq = dx * dx + dz * dz;
      if (lenSq > 0.01) {
        const len = Math.sqrt(lenSq);
        const inv = 1 / len;
        e.root.position.x += dx * inv * e.speed * dt;
        e.root.position.z += dz * inv * e.speed * dt;
        // Strafe perpendicular to the approach vector — the arc
        // slides sideways instead of a straight march, so aiming
        // stays a skill rather than a formality.
        e.swayT += dt;
        const lat = Math.sin(e.swayT * e.swayFreq + e.swayPhase);
        e.root.position.x += -dz * inv * lat * e.swayAmp * dt;
        e.root.position.z +=  dx * inv * lat * e.swayAmp * dt;
      }

      // Danger telegraph: closing to lunge range (before the 1.5
      // proximity-damage radius) shifts the glow to urgent red
      e.danger = lenSq < DANGER_R2;

      // Hover bob (slightly deeper than the old walk bob — hover feel)
      e.bob += dt * 2.4;
      e.root.position.y = Math.sin(e.bob) * 0.09 + 0.05;

      // Face player
      e.root.lookAt(playerPos.x, 0, playerPos.z);

      // Billboard always faces camera
      e.panel.lookAt(this.camera.position);

      // Wrong-answer shake (dt-driven, applied to body so the walk
      // path itself is never corrupted)
      if (e.shakeT > 0) {
        e.shakeT = Math.max(0, e.shakeT - dt);
        e.body.position.x = Math.sin(e.bob * 20) * 0.09 * (e.shakeT / 0.45);
      } else {
        e.body.position.x = 0;
      }

      // Highlight glow pulse & scale up / correct-answer reveal /
      // danger telegraph (priority: reveal > danger > highlight > idle)
      if (e.revealed) {
        e.glow.color.setHex(0x2aff7a);
        e.glow.intensity = 3.4 + Math.sin(e.bob * 12) * 1.0;
        e.root.scale.setScalar(e.spawnT * 1.18);
      } else if (e.danger) {
        e.glow.color.setHex(0xff3344);
        e.glow.intensity = 2.6 + Math.sin(e.bob * 10) * 1.3;
        if (e.spawnT >= 1) e.root.scale.setScalar(1);
      } else if (e.highlighted) {
        e.glow.color.setHex(0x00ffe7);
        e.glow.intensity = 2.8 + Math.sin(e.bob * 8) * 0.7;
        e.root.scale.setScalar(e.spawnT * 1.12);
      } else {
        e.glow.color.setHex(0x00ffe7);
        e.glow.intensity = 1.4;
        if (e.spawnT >= 1) e.root.scale.setScalar(1);
      }
      e.shadow.position.set(e.root.position.x, 0.012, e.root.position.z);
      e.shadow.scale.setScalar(e.root.scale.x);
      e.outline.visible = e.revealed || e.danger || e.highlighted;
      e.outline.material = e.revealed ? MAT.revealFrame : e.danger ? MAT.dangerFrame : MAT.aimFrame;
    }

    // Spawn portals: expand + fade out (pooled, no allocation)
    for (let i = 0; i < this.portals.length; i++) {
      const p = this.portals[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.mesh.visible = false; continue; }
      const t = 1 - p.life / PORTAL_T;
      p.mesh.scale.setScalar(0.5 + easeOut(t) * 2.1);
      p.mat.opacity = (1 - t) * 0.9;
    }

    // Clean destroyed from pool (in-place, no closure allocation)
    if (toRemove.length) {
      let w = 0;
      for (let i = 0; i < this.pool.length; i++) {
        if (!toRemove.includes(this.pool[i])) this.pool[w++] = this.pool[i];
      }
      this.pool.length = w;
    }

    this.sparks.update(dt);
  }

  // Raycast – never hits destroyed enemies
  raycast(raycaster) {
    for (const e of this.pool) {
      if (e.isDestroyed || e.destroyT >= 0 || e.spawnT < 0.5) continue;
      if (raycaster.intersectObjects(e.hitMeshes, false).length > 0) return e;
    }
    return null;
  }

  setHighlight(enemy) {
    for (const e of this.pool) {
      e.highlighted = (e === enemy && !e.isDestroyed);
    }
    this._highlighted = enemy;
  }

  // Educational feedback: glow the correct robot green (after a wrong
  // answer or a timeout, before the wave despawns)
  revealCorrect() {
    for (const e of this.pool) {
      if (!e.isDestroyed && e.destroyT < 0 && e.isCorrect) {
        e.revealed = true;
        e.highlighted = false;
      }
    }
  }

  checkProximity(playerPos, dist) {
    const d2 = dist * dist;
    for (const e of this.pool) {
      if (e.isDestroyed || e.destroyT >= 0) continue;
      const dx = e.root.position.x - playerPos.x;
      const dz = e.root.position.z - playerPos.z;
      if (dx * dx + dz * dz < d2) return e;
    }
    return null;
  }

  destroyEnemy(e) {
    if (!e || e.isDestroyed || e.destroyT >= 0) return;
    e.highlighted  = false;
    e.destroyT     = 0;      // start shrink
    _burstPos.set(e.root.position.x, e.root.position.y + 1.1, e.root.position.z);
    this.sparks.burst(_burstPos, e.isCorrect);
  }

  // Gentle shrink-out for the robots left standing after a wave ends
  despawnAll() {
    for (const e of this.pool) {
      if (!e.isDestroyed && e.destroyT < 0) {
        e.highlighted = false;
        e.destroyT = 0;
      }
    }
    this._highlighted = null;
  }

  shakeEnemy(e) {
    if (!e || e.isDestroyed) return;
    e.shakeT = 0.45;
  }

  clearAll() {
    for (const e of this.pool) {
      if (e.root.parent) this.scene.remove(e.root);
    }
    this.pool.length = 0;
    this._highlighted = null;
    for (const shadow of this.shadows) shadow.visible = false;
    // Hide any live sparks without disposing the pool
    for (let i = 0; i < this.sparks.items.length; i++) {
      this.sparks.items[i].life = 0;
      this.sparks.items[i].mesh.visible = false;
    }
    // Retire any live spawn portals
    for (let i = 0; i < this.portals.length; i++) {
      this.portals[i].life = 0;
      this.portals[i].mesh.visible = false;
    }
  }
}

// ── Utilities ─────────────────────────────────────────────────────
const _burstPos = new THREE.Vector3();   // scratch (event handlers only)

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Guarantee two unique decoys (no match with answer, no match with each
// other). MathEngine already ensures this; this is the last-resort net.
function sanitizeDecoys(answer, decoys) {
  const used = new Set([answer]);
  const out = [];
  if (Array.isArray(decoys)) {
    for (const d of decoys) {
      if (out.length >= 2) break;
      if (Number.isInteger(d) && d > 0 && !used.has(d)) { used.add(d); out.push(d); }
    }
  }
  let guard = 0;
  while (out.length < 2 && guard++ < 50) {
    const c = answer + (out.length === 0 ? 1 : 2) + out.length;
    if (!used.has(c)) { used.add(c); out.push(c); }
  }
  return out;
}
