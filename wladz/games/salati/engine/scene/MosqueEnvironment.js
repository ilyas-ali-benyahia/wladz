import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Reference-inspired mosque, in metres. All decorative work is solid geometry.
 * Static geometry is merged by material to keep mobile draw calls low.
 */
export function buildMosque(scene) {
  const group = new THREE.Group(); group.name = 'Mosque';
  const materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0xd8c8ab, roughness: 0.95 }),
    light: new THREE.MeshStandardMaterial({ color: 0xeee0c5, roughness: 0.93 }),
    green: new THREE.MeshStandardMaterial({ color: 0x587c69, roughness: 0.91 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x294e3e, roughness: 0.9 }),
    carpet: new THREE.MeshStandardMaterial({ color: 0x367854, roughness: 1 }),
    border: new THREE.MeshStandardMaterial({ color: 0xa9a373, roughness: 0.85 }),
    recess: new THREE.MeshStandardMaterial({ color: 0x8e9278, roughness: 1 }),
    window: new THREE.MeshBasicMaterial({ color: 0xdbe6d8 })
  };
  const buckets = {};
  const add = (geometry, material, x, y, z, rotation = [0, 0, 0]) => {
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(1, 1, 1));
    geometry.applyMatrix4(matrix);
    const compatible = geometry.index ? geometry.toNonIndexed() : geometry;
    if (compatible !== geometry) geometry.dispose();
    (buckets[material] ||= []).push(compatible);
  };
  const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const pointed = (width, height) => {
    const s = new THREE.Shape(); const w = width / 2;
    s.moveTo(-w, 0); s.lineTo(-w, height * 0.57);
    s.bezierCurveTo(-w, height * 0.77, -w * 0.43, height * 0.84, 0, height);
    s.bezierCurveTo(w * 0.43, height * 0.84, w, height * 0.77, w, height * 0.57);
    s.lineTo(w, 0); s.closePath(); return s;
  };
  const arch = (x, z, w, h, material = 'green') => {
    const s = pointed(w, h); const inner = pointed(w - 0.23, h - 0.19);
    s.holes.push(new THREE.Path(inner.getPoints(24)));
    add(new THREE.ExtrudeGeometry(s, { depth: 0.15, bevelEnabled: false, curveSegments: 14 }), material, x, 0.05, z);
  };
  const star = (x, y, z, size = 0.14, material = 'light') => {
    const s = new THREE.Shape();
    for (let i = 0; i <= 16; i++) {
      const a = i * Math.PI / 8, r = i % 2 ? size * 0.69 : size;
      if (i) s.lineTo(Math.sin(a) * r, Math.cos(a) * r); else s.moveTo(0, r);
    }
    const hole = new THREE.Path();
    for (let i = 0; i <= 16; i++) {
      const a = -i * Math.PI / 8, r = i % 2 ? size * 0.46 : size * 0.72;
      if (i) hole.lineTo(Math.sin(a) * r, Math.cos(a) * r); else hole.moveTo(0, r);
    }
    s.holes.push(hole);
    add(new THREE.ExtrudeGeometry(s, { depth: 0.026, bevelEnabled: false }), material, x, y, z);
  };
  box(12, 0.12, 14, 'light', 0, -0.08, 0);
  box(3.8, 0.022, 8.5, 'dark', 0, 0, 0.4);
  box(3.55, 0.01, 8.28, 'carpet', 0, 0.015, 0.4);
  for (const x of [-1.61, 1.61]) box(0.025, 0.012, 8.0, 'border', x, 0.023, 0.4);
  for (const z of [-3.25, -1.6, 2.65, 4.25]) box(3.22, 0.009, 0.022, 'border', 0, 0.025, z);
  // Opposite arcade behind the subject. Qibla wall is in front of the subject,
  // behind the front camera: this prevents teaching a worshipper facing away from it.
  box(11, 5.8, 0.30, 'stone', 0, 2.9, -3.8);
  box(11, 0.22, 0.10, 'green', 0, 0.18, -3.59);
  box(11, 0.13, 0.12, 'green', 0, 4.85, -3.58);
  for (const x of [-3.4, 0, 3.4]) {
    add(new THREE.ExtrudeGeometry(pointed(x === 0 ? 2.18 : 1.45, x === 0 ? 3.95 : 3.5), { depth: 0.03, bevelEnabled: false, curveSegments: 16 }), x === 0 ? 'recess' : 'window', x, 0.035, -3.61);
    arch(x, -3.45, x === 0 ? 2.65 : 1.70, x === 0 ? 4.25 : 3.72);
    arch(x, -3.29, x === 0 ? 2.90 : 1.92, x === 0 ? 4.40 : 3.87, 'light');
    if (x !== 0) for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) star(x + (c - 1) * 0.36, 0.65 + r * 0.37, -3.27, 0.20);
  }
  for (const x of [-1.9, 1.9]) {
    box(0.44, 2.6, 0.12, 'green', x, 2.05, -3.46);
    for (let i = 0; i < 7; i++) star(x, 0.93 + i * 0.37, -3.35, 0.18);
  }
  box(3.5, 0.5, 0.15, 'green', 0, 4.85, -3.42);
  for (let i = 0; i < 9; i++) star((i - 4) * 0.37, 4.85, -3.30, 0.2);
  // Octagonal pillars and tiered capitals repeat down the hall.
  for (const x of [-2.7, 2.7]) for (const z of [-2.7, 1.7, 5.3]) {
    box(0.62, 0.45, 0.62, 'light', x, 0.225, z);
    add(new THREE.CylinderGeometry(0.21, 0.25, 3.7, 8), 'light', x, 2.2, z);
    box(0.49, 0.13, 0.49, 'green', x, 3.72, z);
    add(new THREE.CylinderGeometry(0.36, 0.22, 0.45, 8), 'light', x, 4.01, z);
    box(0.72, 0.24, 0.70, 'green', x, 4.31, z);
    box(0.85, 0.13, 0.81, 'light', x, 4.48, z);
  }
  // Actual recessed mihrab on the +Z qibla wall. Front camera is just inside it.
  box(4.2, 5.6, 0.3, 'stone', -3.45, 2.8, 5.7);
  box(4.2, 5.6, 0.3, 'stone', 3.45, 2.8, 5.7);
  box(2.7, 1.3, 0.3, 'stone', 0, 4.95, 5.7);
  box(2.7, 4.3, 0.20, 'recess', 0, 2.15, 6.12);
  for (const x of [-1.3, 1.3]) box(0.15, 4.3, 0.65, 'stone', x, 2.15, 5.85);
  arch(0, 5.5, 2.85, 4.4, 'green');
  // Side wall fragments leave the cameras unobstructed, like a cutaway model.
  for (const x of [-4.9, 4.9]) {
    box(0.2, 5.6, 10, 'stone', x, 2.8, 0.5);
    box(0.23, 0.2, 10, 'green', x, 0.2, 0.5);
  }
  for (const [material, geometries] of Object.entries(buckets)) {
    const merged = mergeGeometries(geometries);
    const mesh = new THREE.Mesh(merged, materials[material]);
    mesh.name = `Mosque_${material}`;
    mesh.receiveShadow = true;
    // Room casts no shadow into the cutaway; character supplies dynamic contact shadows.
    group.add(mesh); geometries.forEach(g => g.dispose());
  }
  scene.add(group); return group;
}
