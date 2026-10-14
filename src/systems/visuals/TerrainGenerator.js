import * as THREE from 'three';
import { addSurfaceDetail } from '../../core/MaterialUpgrader.js';

/**
 * City terrain plus the mountain range that closes the map.
 * One continuous mesh: flat lawn inside the city square, then foothills, a ridged range and hazy far peaks.
 * Main roads end in closed mountain tunnels; the ring roads end in barriers.
 */

const EDGE = 84;      // mountain foot (rounded-square distance from the city centre)
const EXTENT = 260;   // terrain half size (fog hides the rim)
const PORTAL = 89.2;  // tunnel portal distance on the main road axes

// ── Small deterministic value noise ─────────────────────────────
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; }
  return s / 0.9375;
}
function ridged(x, z) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { const n = 1 - Math.abs(vnoise(x * f, z * f) * 2 - 1); s += a * n * n; f *= 2.1; a *= 0.5; }
  return s / 0.9375;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Distance outside the city square (rounded corners); <= 0 inside the playable city */
export function edgeDistance(x, z) {
  const p = 12;
  return Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(z), p), 1 / p) - EDGE;
}

/** Terrain height at (x, z) */
export function terrainHeight(x, z) {
  const e = edgeDistance(x, z);
  if (e <= 0) return 0;
  const foot = smooth(0, 16, e) * (4 + 7 * fbm(x * 0.03, z * 0.03));
  const range = smooth(6, 52, e) * (16 + 36 * ridged(x * 0.012 + 3.1, z * 0.012 - 7.3) + 8 * fbm(x * 0.05, z * 0.05));
  const far = smooth(70, 150, e) * 28 * fbm(x * 0.006 + 11, z * 0.006 + 5);
  let h = foot + range + far;

  // Steep rock faces where the four main roads meet the range (tunnel portals)
  const along = Math.max(Math.abs(x), Math.abs(z));
  const lat = Math.abs(x) > Math.abs(z) ? Math.abs(z) : Math.abs(x);
  if (lat < 16 && along > EDGE - 2) {
    // Road cutting: flat up to the tunnel mouth, rock walls either side, cliff above the portal
    if (lat < 6.5 && along <= PORTAL + 1.3) return 0;
    if (lat < 6.5) return Math.max(h, 15 + 4 * fbm(x * 0.2, z * 0.2)) + fbm(x * 0.15, z * 0.15) * 1.8;
    const cliff = smooth(0.4, 4.5, e) * (15 + 4 * fbm(x * 0.2, z * 0.2)) * (1 - smooth(10, 16, lat));
    h = Math.max(h, cliff);
  }
  return h + fbm(x * 0.15, z * 0.15) * 1.8 * smooth(2, 10, e);
}

function buildAxis() {
  const pos = [0];
  let c = 0;
  while (c < EXTENT) { c += c < 160 ? 2.5 : 7; pos.push(Math.min(c, EXTENT)); }
  return [...pos.slice(1).reverse().map(v => -v), ...pos];
}

export class TerrainGenerator {
  constructor(scene) {
    this.scene = scene;
    this.solids = []; // world boxes for collision (barriers, portal piers)
  }

  build() {
    this.createTerrainMesh();
    this.scatterVegetation();
    return this;
  }

  createTerrainMesh() {
    const axis = buildAxis();
    const n = axis.length;
    const positions = new Float32Array(n * n * 3);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = (j * n + i) * 3;
        const x = axis[i], z = axis[j];
        positions[k] = x;
        positions[k + 1] = terrainHeight(x, z);
        positions[k + 2] = z;
      }
    }
    const index = [];
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i, b = (j + 1) * n + i, c = a + 1, d = b + 1;
        index.push(a, b, c, b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();

    // Colours: lawn in the city, dry grass on the foothills, soil and rock on slopes, pale stone on the crests
    const nrm = geo.attributes.normal;
    const col = new Float32Array(n * n * 3);
    const lush = new THREE.Color(0x4f8a3a), dry = new THREE.Color(0x7d8f45), deep = new THREE.Color(0x3e7433);
    const straw = new THREE.Color(0x9c9650), soil = new THREE.Color(0xa1825a);
    const rockA = new THREE.Color(0x8c7f72), rockB = new THREE.Color(0x675d55), crest = new THREE.Color(0xc4b8a6);
    const tmp = new THREE.Color(), rock = new THREE.Color();
    for (let v = 0; v < n * n; v++) {
      const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
      const e = edgeDistance(x, z);
      const n1 = Math.sin(x * 0.07) * Math.cos(z * 0.09) * 0.5 + 0.5;
      const n2 = Math.sin(x * 0.23 + 1.7) * Math.sin(z * 0.19 + 0.4) * 0.5 + 0.5;
      tmp.copy(lush).lerp(dry, n1 * 0.55).lerp(deep, n2 * 0.35);
      if (e > 0) {
        const steep = 1 - nrm.getY(v);
        const grain = fbm(x * 0.25, z * 0.25);
        tmp.lerp(straw, smooth(0, 10, e) * 0.85);
        tmp.lerp(soil, smooth(0.08, 0.3, steep) * 0.6 * smooth(1, 8, e));
        rock.copy(rockA).lerp(rockB, grain);
        tmp.lerp(rock, Math.min(1, smooth(0.25, 0.55, steep) + smooth(14, 40, y) * 0.7));
        tmp.lerp(crest, smooth(45, 75, y) * 0.6);
        tmp.multiplyScalar(0.9 + grain * 0.2);
      }
      col[v * 3] = tmp.r; col[v * 3 + 1] = tmp.g; col[v * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.97, metalness: 0 }), 0.07);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -0.01;
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    this.scene.add(mesh);
    this.mesh = mesh;
  }

  /** Instanced Aleppo pines, shrubs and boulders on the foothills (3 draw calls) */
  scatterVegetation() {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pines = [], rocks = [], shrubs = [];
    for (let tries = 0; tries < 9000 && (pines.length < 260 || rocks.length < 170 || shrubs.length < 200); tries++) {
      const x = (rnd() * 2 - 1) * 200, z = (rnd() * 2 - 1) * 200;
      const e = edgeDistance(x, z);
      if (e < 2 || e > 70) continue;
      const lat = Math.abs(x) > Math.abs(z) ? Math.abs(z) : Math.abs(x);
      if (lat < 14 && e < 12) continue; // keep the tunnel mouths clear
      const h = terrainHeight(x, z);
      const slope = Math.max(Math.abs(terrainHeight(x + 1.5, z) - h), Math.abs(terrainHeight(x, z + 1.5) - h)) / 1.5;
      if (slope < 0.55 && h < 30 && pines.length < 260 && rnd() < 0.7) pines.push([x, h, z, 0.8 + rnd() * 0.9]);
      else if (slope < 0.4 && e < 25 && shrubs.length < 200) shrubs.push([x, h, z, 0.5 + rnd() * 0.7]);
      else if (rocks.length < 170) rocks.push([x, h, z, 0.6 + rnd() * (e < 15 ? 1.6 : 3.2)]);
    }

    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const make = (geo, mat, list, place) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => { place(it, i); im.setMatrixAt(i, m); });
      im.instanceMatrix.needsUpdate = true;
      im.receiveShadow = true;
      this.scene.add(im);
      return im;
    };

    // Aleppo pine: short trunk + layered umbrella crown, merged into one geometry
    const trunk = new THREE.CylinderGeometry(0.16, 0.28, 3, 6).translate(0, 1.5, 0);
    const crownA = new THREE.IcosahedronGeometry(1.6, 1).scale(1.35, 0.6, 1.35).translate(0, 3.6, 0);
    const crownB = new THREE.IcosahedronGeometry(1.1, 1).scale(1.3, 0.55, 1.2).translate(0.5, 4.5, -0.3);
    const pineGeo = mergeColored([[trunk, 0x5b4636], [crownA, 0x3f6b35], [crownB, 0x4b7a3c]]);
    const pineMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
    make(pineGeo, pineMat, pines, ([x, y, z, sc], i) => {
      q.setFromAxisAngle(up, i * 2.39);
      m.compose(p.set(x, y - 0.2, z), q, s.set(sc, sc * (0.9 + (i % 5) * 0.06), sc));
    });

    const shrubGeo = new THREE.IcosahedronGeometry(0.9, 1).scale(1.2, 0.7, 1);
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x5f7a3a, roughness: 1, flatShading: true });
    make(shrubGeo, shrubMat, shrubs, ([x, y, z, sc], i) => {
      q.setFromAxisAngle(up, i);
      m.compose(p.set(x, y + 0.2 * sc, z), q, s.set(sc, sc, sc));
    });

    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rp = rockGeo.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const k = 0.8 + hash(Math.round(rp.getX(i) * 50), Math.round(rp.getZ(i) * 50 + rp.getY(i) * 31)) * 0.4;
      rp.setXYZ(i, rp.getX(i) * k, rp.getY(i) * k * 0.7, rp.getZ(i) * k);
    }
    rockGeo.computeVertexNormals();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7e72, roughness: 0.95, flatShading: true });
    make(rockGeo, rockMat, rocks, ([x, y, z, sc], i) => {
      q.setFromEuler(new THREE.Euler(i * 0.7, i * 1.3, i * 0.4));
      m.compose(p.set(x, y + 0.1 * sc, z), q, s.set(sc, sc, sc));
    });
  }

  /** Closed mountain tunnels at the four main road ends, barriers at the ring-road ends */
  buildRoadEnds(roadMat) {
    const stone = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xb8a58a, roughness: 0.9 }), 0.08, 0.5);
    const dark = new THREE.MeshBasicMaterial({ color: 0x0b0b0d });
    const sign = makeSignTexture('⛰️ النفق مغلق للصيانة', 'Tunnel fermé');

    // Main avenue / boulevard: along +x, -x, +z, -z
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
      const g = new THREE.Group();
      g.rotation.y = Math.atan2(dx, dz); // local +z points out of the city
      this.scene.add(g);
      const at = (lx, y, lz) => new THREE.Vector3(lx, y, lz);

      // Asphalt continues into the tunnel
      const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.copy(at(0, 0.01, 86.5));
      road.receiveShadow = true;
      g.add(road);

      // Portal: two piers, lintel, arch and a dark mouth set into the cliff
      const pierGeo = new THREE.BoxGeometry(1.6, 7, 3);
      [-5.2, 5.2].forEach(lx => {
        const pier = new THREE.Mesh(pierGeo, stone);
        pier.position.copy(at(lx, 3.5, PORTAL));
        pier.castShadow = true;
        g.add(pier);
        g.updateMatrixWorld(true);
        this.solids.push(new THREE.Box3().setFromObject(pier));
      });
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(12.4, 2.2, 3.2), stone);
      lintel.position.copy(at(0, 8.1, PORTAL));
      g.add(lintel);
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 3.1, 24, 1, true, -Math.PI / 2, Math.PI), stone);
      arch.rotation.x = -Math.PI / 2;
      arch.position.copy(at(0, 5.0, PORTAL));
      arch.material = stone;
      g.add(arch);
      const mouth = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 9.6), dark);
      mouth.position.copy(at(0, 4.8, PORTAL + 1.2));
      mouth.rotation.y = Math.PI;
      g.add(mouth);

      // Sign above the portal and a row of barriers in front of it
      const board = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: sign }));
      board.position.copy(at(0, 8.1, PORTAL - 1.65));
      board.rotation.y = Math.PI;
      g.add(board);
      this.addBarrierRow(g, at(0, 0, 81.2), 9);
    });

    // Ring roads (±42) end before the foothills
    [[42, 75, 0], [-42, 75, 0], [42, -75, Math.PI], [-42, -75, Math.PI]].forEach(([x, z, r]) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = r;
      this.scene.add(g);
      this.addBarrierRow(g, new THREE.Vector3(0, 0, 0.6), 8);
    });
    [[75, 42], [75, -42], [-75, 42], [-75, -42]].forEach(([x, z]) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = Math.sign(x) * Math.PI / 2;
      this.scene.add(g);
      this.addBarrierRow(g, new THREE.Vector3(0, 0, 0.6), 8);
    });
  }

  addBarrierRow(parent, center, width) {
    if (!this.barrierMats) {
      this.barrierMats = [0xd8d4cc, 0xc0392b].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
      // Jersey barrier profile (wide foot, narrow top)
      const shape = new THREE.Shape();
      shape.moveTo(-0.3, 0); shape.lineTo(0.3, 0); shape.lineTo(0.18, 0.28); shape.lineTo(0.1, 0.8); shape.lineTo(-0.1, 0.8); shape.lineTo(-0.18, 0.28); shape.closePath();
      this.barrierGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.9, bevelEnabled: false }).translate(0, 0, -0.95);
      this.barrierGeo.rotateY(Math.PI / 2);
    }
    const count = Math.ceil(width / 2);
    for (let i = 0; i < count; i++) {
      const b = new THREE.Mesh(this.barrierGeo, this.barrierMats[i % 2]);
      b.position.set(center.x + (i - (count - 1) / 2) * 2.0, 0, center.z);
      b.castShadow = true;
      b.receiveShadow = true;
      parent.add(b);
      parent.updateMatrixWorld(true);
      this.solids.push(new THREE.Box3().setFromObject(b));
    }
  }
}

function mergeColored(parts) {
  const geos = parts.map(([g, c]) => {
    const geo = g.index ? g.toNonIndexed() : g;
    const color = new THREE.Color(c);
    const arr = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < arr.length; i += 3) { arr[i] = color.r; arr[i + 1] = color.g; arr[i + 2] = color.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geo.deleteAttribute('uv');
    return geo;
  });
  const total = geos.reduce((s, g) => s + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3), nrm = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  geos.forEach(g => {
    pos.set(g.attributes.position.array, o);
    nrm.set(g.attributes.normal.array, o);
    col.set(g.attributes.color.array, o);
    o += g.attributes.position.count * 3;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

function makeSignTexture(ar, fr) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 102;
  const g = c.getContext('2d');
  g.fillStyle = '#1f5f8b';
  g.fillRect(0, 0, 512, 102);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 5;
  g.strokeRect(6, 6, 500, 90);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.direction = 'rtl';
  g.font = 'bold 40px Cairo, Tajawal, sans-serif';
  g.fillText(ar, 256, 50);
  g.direction = 'ltr';
  g.font = '22px sans-serif';
  g.fillText(fr, 256, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
