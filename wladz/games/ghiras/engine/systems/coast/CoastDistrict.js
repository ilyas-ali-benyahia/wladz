import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { addSurfaceDetail } from '../../core/MaterialUpgrader.js';
import { CartoonNatureGenerator } from '../visuals/CartoonNatureGenerator.js';
import { CharacterModel } from '../CharacterModel.js';

/**
 * Coastal district (شاطئ غِراس): a separate playable area reached through the city's south tunnel,
 * built far from the city like the interiors. Holds the beach, the supervised swimming school and the
 * football ground. Exposes heightAt / waterAt so walking, swimming and the ball share one ground model.
 *
 * Local layout (x west-east, z south-north, the sea is to +z):
 *   tunnel z = -50 · promenade · football pitch (x -50..-10, z -33..-7) · beach z 4..30 · sea z > 30
 */
export const COAST_ORIGIN = new THREE.Vector3(1000, 0, 0);
export const SHORE_Z = 30;
export const WATER_Y = 0.05;
export const PITCH = { cx: -30, cz: -20, halfL: 20, halfW: 13, goalHalfW: 2.6, goalH: 2.0, goalDepth: 1.6 };
export const SWIM_ZONES = {
  shallow: { minX: -14, maxX: 14, minZ: SHORE_Z - 2, maxZ: 46 },
  advanced: { minX: 16, maxX: 40, minZ: SHORE_Z - 2, maxZ: 56 }
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Ground height in local coordinates: flat land, hills at the sides and behind the tunnel, seabed under the sea */
export function coastHeight(x, z) {
  let h = 0;
  if (z > SHORE_Z) h = -Math.min(4.5, (z - SHORE_Z) * 0.12 + Math.max(0, z - 42) * 0.08);
  const side = Math.max(0, Math.abs(x) - 54);
  const back = Math.max(0, -48 - z);
  if (side > 0 || back > 0) h = Math.max(h, (side + back) * 1.1 + Math.sin(x * 0.3 + z * 0.2) * 0.8 * smooth(0, 4, side + back));
  return h;
}

export class CoastDistrict {
  constructor(engine, collisionSystem) {
    this.engine = engine;
    this.collision = collisionSystem;
    this.group = new THREE.Group();
    this.group.position.copy(COAST_ORIGIN);
    this.group.visible = false;
    engine.scene.add(this.group);
    this.nature = new CartoonNatureGenerator(this.group);
    this.time = { value: 0 };
    this.npcs = {};
    this.flag = 'green';

    this.buildTerrain();
    this.buildWater();
    this.buildArrival();
    this.buildPitch();
    this.buildBeach();
    this.buildPeople();

    // Bounds while in the district (sea included; swimming is limited by the rope zones)
    this.bounds = { minX: COAST_ORIGIN.x - 55, maxX: COAST_ORIGIN.x + 55, minZ: COAST_ORIGIN.z - 47.5, maxZ: COAST_ORIGIN.z + 60 };
    // The arrival point (just out of the tunnel) and the tunnel mouth used to go back
    this.spawn = this.world(0, -43);
    this.exitPoint = this.world(0, -47);
  }

  world(x, z, y = 0) { return new THREE.Vector3(COAST_ORIGIN.x + x, y, COAST_ORIGIN.z + z); }
  local(p) { return { x: p.x - COAST_ORIGIN.x, z: p.z - COAST_ORIGIN.z }; }
  contains(p) { return p.x > COAST_ORIGIN.x - 200 && p.x < COAST_ORIGIN.x + 200 && Math.abs(p.z - COAST_ORIGIN.z) < 200; }

  /** Ground (or seabed) height at a world point, or null outside the district */
  heightAt(x, z) {
    if (!this.contains({ x, z })) return null;
    const lx = x - COAST_ORIGIN.x, lz = z - COAST_ORIGIN.z;
    for (const s of this.walkSlabs || []) if (lx >= s.minX && lx <= s.maxX && lz >= s.minZ && lz <= s.maxZ) return s.y;
    return coastHeight(lx, lz);
  }

  /** Water depth at a world point (0 on land) */
  depthAt(x, z) {
    const h = this.heightAt(x, z);
    return h === null ? 0 : Math.max(0, WATER_Y - h);
  }

  /** Swim zone containing the local point (or null) */
  swimZoneAt(x, z) {
    const l = this.local({ x, z });
    for (const [id, zn] of Object.entries(SWIM_ZONES)) {
      if (l.x >= zn.minX && l.x <= zn.maxX && l.z >= zn.minZ && l.z <= zn.maxZ) return id;
    }
    return null;
  }

  box(x, z, sx, sz, h = 2) {
    const c = this.world(x, z);
    this.collision.addBox(c.x - sx / 2, c.z - sz / 2, c.x + sx / 2, c.z + sz / 2, h);
  }

  add(mesh, x, y, z, shadow = true) {
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  // ─────────────────────────────────────────────────────────────
  buildTerrain() {
    const W = 260, D = 200, segX = 130, segZ = 100;
    const geo = new THREE.PlaneGeometry(W, D, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, 10);
    const p = geo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const grass = new THREE.Color(0x5b9a3f), dry = new THREE.Color(0x8e9a4c), sand = new THREE.Color(0xe8d6a8),
      wet = new THREE.Color(0xc9b483), seabed = new THREE.Color(0xb59e6c), rock = new THREE.Color(0x8c7f72), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const h = coastHeight(x, z);
      p.setY(i, h);
      const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.5 + 0.5;
      c.copy(grass).lerp(dry, n * 0.4);
      c.lerp(sand, smooth(2, 7, z));
      c.lerp(wet, smooth(SHORE_Z - 3, SHORE_Z, z));
      c.lerp(seabed, smooth(SHORE_Z, SHORE_Z + 3, z));
      c.lerp(rock, smooth(1, 6, h));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, addSurfaceDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), 0.06));
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    this.group.add(mesh);

    // Pine-covered hills at the sides (instanced, 2 draw calls)
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.6, 6).translate(0, 1.3, 0);
    const crownGeo = new THREE.IcosahedronGeometry(1.5, 1).scale(1.3, 0.65, 1.3).translate(0, 3.2, 0);
    const spots = [];
    for (let i = 0; i < 90; i++) {
      const side = i % 3;
      const x = side === 0 ? -58 - (i * 7.3 % 14) : side === 1 ? 58 + (i * 5.1 % 14) : -50 + (i * 11.7 % 100);
      const z = side === 2 ? -52 - (i * 3.3 % 10) : -45 + (i * 13.9 % 70);
      spots.push([x, coastHeight(x, z), z, 0.8 + (i % 5) * 0.12]);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
    [[trunkGeo, 0x5b4636], [crownGeo, 0x3f6b35]].forEach(([g, color]) => {
      const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true }), spots.length);
      spots.forEach(([x, y, z, sc], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i); im.setMatrixAt(i, m4.compose(v.set(x, y - 0.2, z), q, s.set(sc, sc, sc))); });
      this.group.add(im);
    });
  }

  buildWater() {
    const geo = new THREE.PlaneGeometry(300, 140, 150, 70);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, WATER_Y, SHORE_Z - 2 + 70);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a9fc4, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.78, envMapIntensity: 1.4 });
    const time = this.time;
    // Gentle waves in the vertex shader (no CPU work per frame)
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float w1 = sin(position.x * 0.35 + uTime * 1.1) * 0.06;
          float w2 = sin(position.z * 0.5 - uTime * 1.6) * 0.07;
          transformed.y += w1 + w2;`);
    };
    mat.customProgramCacheKey = () => 'coastWater';
    const water = new THREE.Mesh(geo, mat);
    water.receiveShadow = true;
    water.renderOrder = 2;
    this.group.add(water);
    // Foam line along the shore
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(300, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(0, WATER_Y + 0.03, SHORE_Z + 0.3);
    this.group.add(foam);
    this.foam = foam;
  }

  buildArrival() {
    const stone = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xb8a58a, roughness: 0.9 }), 0.08, 0.5);
    const pave = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xd8ccb8, roughness: 0.85 }), 0.06, 0.8);
    // Tunnel portal back to the city
    [-5.2, 5.2].forEach(x => { this.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 7, 3), stone), x, 3.5, -50); this.box(x, -50, 1.8, 3.2, 7); });
    this.add(new THREE.Mesh(new THREE.BoxGeometry(12.4, 2.2, 3.2), stone), 0, 8.1, -50);
    this.add(new THREE.Mesh(new THREE.PlaneGeometry(8.8, 9.6), new THREE.MeshBasicMaterial({ color: 0x0b0b0d })), 0, 4.8, -51.4, false);
    // Promenade from the tunnel to the beach, with a branch to the pitch
    this.add(new THREE.Mesh(new RoundedBoxGeometry(6, 0.16, 56, 2, 0.04), pave), 0, 0.08, -22, false);
    this.add(new THREE.Mesh(new RoundedBoxGeometry(6, 0.16, 4, 2, 0.04), pave), -7, 0.08, -10, false);
    this.walkSlabs = [
      { minX: -3, maxX: 3, minZ: -50, maxZ: 6, y: 0.16 },
      { minX: -10, maxX: -4, minZ: -12, maxZ: -8, y: 0.16 }
    ];
    this.signs = [];
  }

  buildPitch() {
    const P = PITCH;
    const grass = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0x3f9b4a, roughness: 0.9 }), 0.05);
    const turf = new THREE.Mesh(new THREE.PlaneGeometry(P.halfL * 2 + 4, P.halfW * 2 + 4), grass);
    turf.rotation.x = -Math.PI / 2;
    this.add(turf, P.cx, 0.02, P.cz, false);
    // Mowing stripes and white markings (decals)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x48a853, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    for (let i = 0; i < 8; i += 2) {
      const st = new THREE.Mesh(new THREE.PlaneGeometry(P.halfL * 2 / 8, P.halfW * 2), stripeMat);
      st.rotation.x = -Math.PI / 2;
      this.add(st, P.cx - P.halfL + (i + 0.5) * (P.halfL * 2 / 8), 0.025, P.cz, false);
    }
    const line = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat); m.rotation.x = -Math.PI / 2; this.add(m, x, 0.03, z, false); };
    line(P.cx, P.cz - P.halfW, P.halfL * 2, 0.12); line(P.cx, P.cz + P.halfW, P.halfL * 2, 0.12);
    line(P.cx - P.halfL, P.cz, 0.12, P.halfW * 2); line(P.cx + P.halfL, P.cz, 0.12, P.halfW * 2);
    line(P.cx, P.cz, 0.12, P.halfW * 2);
    const circle = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.52, 48), lineMat);
    circle.rotation.x = -Math.PI / 2;
    this.add(circle, P.cx, 0.03, P.cz, false);
    [-1, 1].forEach(s => {
      const gx = P.cx + s * P.halfL;
      line(gx - s * 4.5, P.cz, 0.12, 12); line(gx - s * 2.25, P.cz - 6, 4.5, 0.12); line(gx - s * 2.25, P.cz + 6, 4.5, 0.12);
      const spot = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), lineMat);
      spot.rotation.x = -Math.PI / 2;
      this.add(spot, gx - s * 8, 0.03, P.cz, false);
    });
    // Goals: posts, crossbar and a net box
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, wireframe: true, depthWrite: false });
    this.goals = [];
    [-1, 1].forEach(s => {
      const gx = P.cx + s * P.halfL;
      [-1, 1].forEach(t => {
        this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, P.goalH, 12), postMat), gx, P.goalH / 2, P.cz + t * P.goalHalfW);
        this.box(gx + s * 0.05, P.cz + t * P.goalHalfW, 0.25, 0.25, P.goalH);
      });
      const bar = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, P.goalHalfW * 2 + 0.12, 12), postMat), gx, P.goalH, P.cz);
      bar.rotation.x = Math.PI / 2;
      const net = new THREE.Mesh(new THREE.BoxGeometry(P.goalDepth, P.goalH, P.goalHalfW * 2, 4, 6, 10), netMat);
      this.add(net, gx + s * P.goalDepth / 2, P.goalH / 2, P.cz, false);
      // Players cannot walk into the net (back and sides)
      this.box(gx + s * (P.goalDepth + 0.05), P.cz, 0.2, P.goalHalfW * 2, P.goalH);
      this.goals.push({ x: gx, dir: s });
    });
    // Low perimeter fence with an opening on the beach side
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1e8449, roughness: 0.6 });
    const fx0 = P.cx - P.halfL - 3, fx1 = P.cx + P.halfL + 3, fz0 = P.cz - P.halfW - 3, fz1 = P.cz + P.halfW + 3;
    const fence = (x, z, w, d) => { this.add(new THREE.Mesh(new RoundedBoxGeometry(w, 0.9, d, 2, 0.04), fenceMat), x, 0.45, z); this.box(x, z, w, d, 1); };
    fence(P.cx, fz0, fx1 - fx0, 0.12);
    fence(fx0, P.cz, 0.12, fz1 - fz0);
    fence(fx1, P.cz, 0.12, fz1 - fz0);
    fence(P.cx - 10, fz1, (fx1 - fx0) / 2 - 6, 0.12);
    fence(P.cx + 10, fz1, (fx1 - fx0) / 2 - 6, 0.12);
    this.pitchWalls = { minX: fx0 + 0.15, maxX: fx1 - 0.15, minZ: fz0 + 0.15, maxZ: fz1 - 0.15 };
    // Benches and the coach's spot
    [-8, 8].forEach(dx => {
      this.add(new THREE.Mesh(new RoundedBoxGeometry(3, 0.45, 0.6, 2, 0.06), new THREE.MeshStandardMaterial({ color: 0x2e86c1, roughness: 0.6 })), P.cx + dx, 0.25, fz1 + 1.2);
      this.box(P.cx + dx, fz1 + 1.2, 3, 0.6, 0.5);
    });
    this.addSign('⚽ ملعب الأمل للشباب', 'تدريب كرة القدم مع المدرب', P.cx, fz1 + 2.6, 0, '#1e8449');
  }

  buildBeach() {
    // Lifeguard tower
    const wood = new THREE.MeshStandardMaterial({ color: 0xb08a62, roughness: 0.7 });
    const red = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 });
    const tx = 9, tz = 24;
    [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([dx, dz]) => this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3, 8), wood), tx + dx, 1.5, tz + dz));
    this.add(new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.15, 2.4, 2, 0.04), wood), tx, 3.0, tz);
    this.add(new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.2, 2.4, 2, 0.08), red), tx, 3.8, tz).material = red;
    this.add(new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.9, 4), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6 })), tx, 4.85, tz).rotation.y = Math.PI / 4;
    this.box(tx, tz, 2.2, 2.2, 3);
    this.lifeguardTower = this.world(tx, tz - 1.8);
    // Lifebuoy on the tower
    const ring = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 10, 24), new THREE.MeshStandardMaterial({ color: 0xff7043, roughness: 0.5 })), tx, 1.6, tz - 1.0);
    this.lifebuoy = ring;

    // Safety flag pole (colour changes with the lesson: green / yellow / red)
    this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5, 8), new THREE.MeshStandardMaterial({ color: 0xdddddd })), -6, 2.5, 24);
    this.flagMesh = this.add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshStandardMaterial({ color: 0x27ae60, side: THREE.DoubleSide })), -5.3, 4.4, 24);
    this.box(-6, 24, 0.3, 0.3, 5);

    // Rope lines with buoys around the swim zones
    const buoyGeo = new THREE.SphereGeometry(0.22, 12, 10);
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xf4d03f });
    this.zoneBuoys = [];
    Object.entries(SWIM_ZONES).forEach(([id, zn]) => {
      const bMat = new THREE.MeshStandardMaterial({ color: id === 'shallow' ? 0xf39c12 : 0xc0392b, roughness: 0.4 });
      const edges = [[zn.minX, SHORE_Z + 1, zn.minX, zn.maxZ], [zn.minX, zn.maxZ, zn.maxX, zn.maxZ], [zn.maxX, zn.maxZ, zn.maxX, SHORE_Z + 1]];
      edges.forEach(([x0, z0, x1, z1]) => {
        const len = Math.hypot(x1 - x0, z1 - z0);
        const n = Math.max(2, Math.round(len / 3));
        for (let i = 0; i <= n; i++) {
          const b = this.add(new THREE.Mesh(buoyGeo, bMat), x0 + (x1 - x0) * i / n, WATER_Y + 0.05, z0 + (z1 - z0) * i / n, false);
          this.zoneBuoys.push(b);
        }
        const rope = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 6), ropeMat), (x0 + x1) / 2, WATER_Y + 0.08, (z0 + z1) / 2, false);
        rope.rotation.set(Math.PI / 2, 0, -Math.atan2(x1 - x0, z1 - z0));
      });
    });
    // Entry steps marker for safe water entry
    const entry = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 32), new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    entry.rotation.x = -Math.PI / 2;
    this.add(entry, 0, 0.05, SHORE_Z - 1.2, false);
    this.entryPoint = this.world(0, SHORE_Z - 1.2);

    // Beach life: umbrellas, towels, palms
    const umbColors = [0xe74c3c, 0x2e86c1, 0xf1c40f, 0x27ae60];
    [[-22, 18], [-16, 22], [18, 16], [26, 21], [-30, 25], [32, 13]].forEach(([x, z], i) => {
      this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xeeeeee })), x, 1.2, z);
      this.add(new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 12, 1, true), new THREE.MeshStandardMaterial({ color: umbColors[i % 4], side: THREE.DoubleSide, roughness: 0.7 })), x, 2.35, z);
      const towel = this.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshStandardMaterial({ color: umbColors[(i + 1) % 4], polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })), x + 1.2, 0.03, z + 0.4, false);
      towel.rotation.x = -Math.PI / 2;
      this.box(x, z, 0.3, 0.3, 2.4);
    });
    [[-40, 8], [-34, 4], [36, 6], [44, 10], [-46, 14], [48, 3]].forEach(([x, z]) => { this.nature.createAlgerianPalm(x, z, 0.9); this.box(x, z, 0.8, 0.8, 6); });

    this.addSign('🏖️ شاطئ غِراس', 'السباحة تحت حراسة المنقذ فقط', -2, 20, 0, '#1f618d');
    this.addSign('⛔ منطقة متقدمة', 'لمن أتمّ دروس السباحة', 20, SHORE_Z - 3.5, 0, '#922b21');
  }

  /** Bilingual-style Arabic sign on two posts (canvas texture) */
  addSign(title, sub, x, z, rotY, bg) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 300;
    const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      g.fillStyle = bg; g.fillRect(0, 0, 1024, 300);
      g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.strokeRect(10, 10, 1004, 280);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.direction = 'rtl';
      g.font = '800 104px Cairo, Tajawal, sans-serif'; g.fillText(title, 512, 130, 960);
      g.font = '600 56px Cairo, Tajawal, sans-serif'; g.fillText(sub, 512, 230, 960);
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    const s = new THREE.Group();
    s.position.set(x, 0, z);
    s.rotation.y = rotY;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, side: THREE.DoubleSide }));
    board.position.y = 2.6;
    s.add(board);
    [-1.6, 1.6].forEach(px => { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.1, 8), new THREE.MeshStandardMaterial({ color: 0x2c2c2c })); post.position.set(px, 1.55, 0); s.add(post); });
    this.group.add(s);
    this.box(x, z, 3.6, 0.3, 3);
  }

  buildPeople() {
    const make = (key, opts, x, z, rotY, label) => {
      const m = new CharacterModel('npc_adult', { isNPC: true, build: 1, height: 1, ...opts });
      m.group.position.set(x, 0, z);
      m.group.rotation.y = rotY;
      this.group.add(m.group);
      this.box(x, z, 0.8, 0.8, 2);
      this.npcs[key] = { model: m, pos: this.world(x, z), label };
    };
    make('coach', { npcRole: 'teacher', primaryColor: 0x1e8449, secondaryColor: 0xffffff, skinColor: 0xc99872 }, PITCH.cx - 3, PITCH.cz + PITCH.halfW + 1.6, Math.PI, 'المدرب كريم');
    make('instructor', { npcRole: 'citizen', gender: 'female', primaryColor: 0x1f618d, hijabColor: 0x2e86c1, skinColor: 0xe3ad85 }, 3, SHORE_Z - 4, Math.PI, 'المدرّبة نسرين');
    make('lifeguard', { npcRole: 'firefighter', primaryColor: 0xc0392b, secondaryColor: 0xc0392b, skinColor: 0xb98260 }, 9, 21.6, 0, 'المنقذ سفيان');
  }

  setFlag(color) {
    this.flag = color;
    this.flagMesh.material.color.setHex({ green: 0x27ae60, yellow: 0xf1c40f, red: 0xc0392b }[color]);
  }

  update(dt) {
    if (!this.group.visible) return;
    this.time.value += dt;
    this.foam.material.opacity = 0.4 + Math.sin(this.time.value * 1.3) * 0.15;
    this.flagMesh.rotation.y = Math.sin(this.time.value * 2.2) * 0.25;
    this.zoneBuoys.forEach((b, i) => { b.position.y = WATER_Y + 0.05 + Math.sin(this.time.value * 1.6 + i) * 0.05; });
    Object.values(this.npcs).forEach(n => n.model.update(dt, { isMoving: false }));
  }
}
