/**
 * Headless world audit (no browser): builds the city with Three.js in Node and checks
 *  - building / prop footprints at ground level against roads, sidewalks and the roundabout
 *  - solid collision boxes inside traffic lanes
 *  - clear walking width left on every sidewalk
 *  - the mountain boundary: flat playable ground, continuous ridge, nobody can walk out
 * Usage: npm run audit:world   (exit code 1 when a check fails)
 */
import * as THREE from 'three';

const ctx = new Proxy({}, {
  get: (t, k) => k === 'measureText' ? () => ({ width: 100 }) : (k in t ? t[k] : () => ({ addColorStop() {} })),
  set: (t, k, v) => { t[k] = v; return true; }
});
globalThis.document = { createElement: () => ({ getContext: () => ctx, width: 0, height: 0, style: {} }) };
globalThis.window = { innerWidth: 1, innerHeight: 1, addEventListener() {} };

const { CollisionSystem } = await import('../src/systems/CollisionSystem.js');
const { WorldBuilder } = await import('../src/systems/WorldBuilder.js');
const { terrainHeight, edgeDistance } = await import('../src/systems/visuals/TerrainGenerator.js');

const scene = new THREE.Scene();
const cs = new CollisionSystem();
const wb = new WorldBuilder({ scene, renderer: { capabilities: {} }, camera: new THREE.PerspectiveCamera() }, cs);
scene.updateMatrixWorld(true);

let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', msg); };

const roads = wb.roadDefs.map(r => ({ minX: r.cx - r.w / 2, maxX: r.cx + r.w / 2, minZ: r.cz - r.d / 2, maxZ: r.cz + r.d / 2, h: r.h }));
const SW = 5.5;
const sidewalks = roads.flatMap(q => q.h
  ? [{ minX: q.minX, maxX: q.maxX, minZ: q.maxZ, maxZ: q.maxZ + SW, road: q }, { minX: q.minX, maxX: q.maxX, minZ: q.minZ - SW, maxZ: q.minZ, road: q }]
  : [{ minX: q.maxX, maxX: q.maxX + SW, minZ: q.minZ, maxZ: q.maxZ, road: q }, { minX: q.minX - SW, maxX: q.minX, minZ: q.minZ, maxZ: q.maxZ, road: q }]);
const overlaps = (b, q, pad = 0) => b.max.x > q.minX - pad && b.min.x < q.maxX + pad && b.max.z > q.minZ - pad && b.min.z < q.maxZ + pad;

// Street furniture that legitimately stands on a sidewalk (checked by the clear-width test instead)
const SIDEWALK_FURNITURE = [[-9.2, 21]]; // bus stop shelter

// 1. Ground-level footprints
const box = new THREE.Box3(), mb = new THREE.Box3(), size = new THREE.Vector3(), c = new THREE.Vector3();
const roadHits = [], sidewalkHits = [];
scene.children.forEach(o => {
  if (o.isInstancedMesh || o.name === 'terrain' || o.isLight) return;
  box.setFromObject(o);
  if (box.isEmpty()) return;
  box.getSize(size); box.getCenter(c);
  if (size.x > 60 || size.z > 60 || box.max.y < 1.3 || Math.max(Math.abs(c.x), Math.abs(c.z)) > 83) return;
  const base = new THREE.Box3();
  o.traverse(m => { if (!m.isMesh) return; mb.setFromObject(m, true); if (mb.min.y < 0.8 && mb.max.y - mb.min.y > 0.9) base.union(mb); });
  if (base.isEmpty()) return;
  const bs = base.getSize(new THREE.Vector3());
  const label = `(${c.x.toFixed(1)}, ${c.z.toFixed(1)}) ${bs.x.toFixed(1)}x${bs.z.toFixed(1)} m`;
  const r = Math.hypot(c.x, c.z);
  if (roads.some(q => overlaps(base, q, -0.05)) || (r < 9.5 && r > 0.5)) roadHits.push(label);
  else if (bs.x * bs.z > 4 && sidewalks.some(s => overlaps(base, s, -0.05)) &&
    !SIDEWALK_FURNITURE.some(([x, z]) => Math.hypot(x - c.x, z - c.z) < 0.5)) sidewalkHits.push(label);
});
check(roadHits.length === 0, `no building or prop stands on a road or the roundabout ${roadHits.join('; ')}`);
check(sidewalkHits.length === 0, `no building footprint intrudes on a sidewalk ${sidewalkHits.join('; ')}`);

// 2. Solid obstacles in lanes (road-end barriers excluded)
const laneBlocks = cs.staticBoxes.filter(b => {
  const x = (b.min.x + b.max.x) / 2, z = (b.min.z + b.max.z) / 2;
  return Math.max(Math.abs(x), Math.abs(z)) < 80 && Math.hypot(x, z) > 4.8 && roads.some(q => overlaps(b, q, -0.05));
}).map(b => `(${((b.min.x + b.max.x) / 2).toFixed(1)}, ${((b.min.z + b.max.z) / 2).toFixed(1)})`);
check(laneBlocks.length === 0, `no solid obstacle inside a traffic lane ${laneBlocks.join('; ')}`);

// 3. Clear sidewalk width
let narrowest = Infinity, where = '';
sidewalks.forEach(s => {
  const H = s.road.h;
  const lo = H ? s.minZ : s.minX, hi = H ? s.maxZ : s.maxX;
  for (let t = (H ? s.minX : s.minZ) + 1; t < (H ? s.maxX : s.maxZ) - 1; t += 0.5) {
    const px = H ? t : (lo + hi) / 2, pz = H ? (lo + hi) / 2 : t;
    if (Math.max(Math.abs(px), Math.abs(pz)) > 79 || Math.hypot(px, pz) < 16) continue;
    if (roads.some(q => q !== s.road && px > q.minX - 0.5 && px < q.maxX + 0.5 && pz > q.minZ - 0.5 && pz < q.maxZ + 0.5)) continue;
    const blocked = [];
    cs.staticBoxes.forEach(b => {
      const a0 = H ? b.min.x : b.min.z, a1 = H ? b.max.x : b.max.z;
      if (t < a0 || t > a1) return;
      const c0 = H ? b.min.z : b.min.x, c1 = H ? b.max.z : b.max.x;
      if (c1 > lo && c0 < hi) blocked.push([Math.max(lo, c0), Math.min(hi, c1)]);
    });
    blocked.sort((u, v) => u[0] - v[0]);
    let cur = lo, gap = 0;
    blocked.forEach(([u, v]) => { gap = Math.max(gap, u - cur); cur = Math.max(cur, v); });
    gap = Math.max(gap, hi - cur);
    if (gap < narrowest) { narrowest = gap; where = `${H ? 'x' : 'z'}=${t.toFixed(1)}`; }
  }
});
check(narrowest >= 1.8, `narrowest clear sidewalk width ${narrowest.toFixed(2)} m (at ${where}); minimum 1.8 m`);

// 4. Mountain boundary
let maxStand = 0;
for (let x = -82; x <= 82; x += 0.5) for (let z = -82; z <= 82; z += 0.5) if (!cs.checkCollision({ x, z }, 0.42)) maxStand = Math.max(maxStand, terrainHeight(x, z));
check(maxStand === 0, `playable ground is flat (max terrain height where the player can stand: ${maxStand.toFixed(2)} m)`);
let minRidge = Infinity;
for (let a = 0; a < 360; a += 0.5) {
  const r = a * Math.PI / 180;
  let d = 80; while (edgeDistance(Math.cos(r) * d, Math.sin(r) * d) < 30) d += 0.2;
  minRidge = Math.min(minRidge, terrainHeight(Math.cos(r) * d, Math.sin(r) * d));
}
check(minRidge > 12, `continuous range: lowest point 30 m past the foot is ${minRidge.toFixed(1)} m high`);
let escape = -Infinity, walkers = 0;
for (let a = 0; a < 360; a += 1) {
  const r = a * Math.PI / 180, dir = new THREE.Vector3(Math.cos(r), 0, Math.sin(r));
  // start on free ground a few metres inside the foot, then keep walking outward
  let d = 60; while (edgeDistance(dir.x * d, dir.z * d) < -6) d += 0.2;
  const p = dir.clone().multiplyScalar(d);
  if (cs.checkCollision(p, 0.42)) continue;
  walkers++;
  for (let i = 0; i < 400; i++) p.copy(cs.resolveMovement(p, dir.clone().multiplyScalar(0.12), 0.42));
  escape = Math.max(escape, edgeDistance(p.x, p.z));
}
check(walkers > 200 && escape < 0, `${walkers} walkers pushing outward never pass the mountain foot (closest ${(-escape).toFixed(2)} m)`);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll world checks passed');
process.exit(failed ? 1 : 0);
