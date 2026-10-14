import * as THREE from 'three';
import { PrayerAnimator } from './PrayerAnimator.js';
import { disposeTree } from './resources.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);
const v = a => new THREE.Vector3(...a);

/** Fixed-length, two-bone IK with a stable pole; no scaling/stretching of bones. */
export function solveTwoBone(start, target, pole, upper, lower) {
  const axis = target.clone().sub(start);
  const distance = THREE.MathUtils.clamp(axis.length(), Math.abs(upper - lower) + 1e-5, upper + lower - 1e-5);
  axis.normalize();
  const bend = pole.clone().sub(start);
  bend.addScaledVector(axis, -bend.dot(axis));
  if (bend.lengthSq() < 1e-8) bend.set(0, 0, 1).addScaledVector(axis, -axis.z);
  bend.normalize();
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const joint = start.clone().addScaledVector(axis, along).addScaledVector(bend, height);
  return { joint, end: start.clone().addScaledVector(axis, distance) };
}

/** Original procedural mascots, modelled from ref_img. Every visible part is 3D.
 * Pelvis -> spine/head/shoulders and pelvis -> hips/knees/ankles are independent.
 * Garment is a small deforming surface following the rig rather than rigid cones
 * intersecting the legs. A single animator survives character appearance changes.
 */
export class Character3D {
  constructor(scene, { gender = 'boy', settings, reducedMotion = false } = {}) {
    this.scene = scene; this.gender = gender; this.reducedMotion = reducedMotion;
    this.animator = new PrayerAnimator(settings); this.model = new THREE.Group();
    this.model.name = 'SalathMascot'; this.scene.add(this.model);
    this.build(); this.applyPose(this.animator.pose);
  }
  build() {
    this.joints = {}; this.eyes = []; this.fingers = []; this.landmarks = {};
    this.materials = {
      cloth: new THREE.MeshStandardMaterial({ color: this.gender === 'girl' ? 0xcf8f9f : 0xf8f4eb, roughness: 0.91 }),
      trim: new THREE.MeshStandardMaterial({ color: this.gender === 'girl' ? 0xefc5cf : 0xe4dac7, roughness: 0.8 }),
      white: new THREE.MeshStandardMaterial({ color: 0xfff8ed, roughness: 0.84 }),
      skin: new THREE.MeshStandardMaterial({ color: 0xd99b72, roughness: 0.85 }),
      blush: new THREE.MeshStandardMaterial({ color: 0xd98678, roughness: 0.9 }),
      hair: new THREE.MeshStandardMaterial({ color: 0x302016, roughness: 0.96 }),
      eyes: new THREE.MeshStandardMaterial({ color: 0x321d12, roughness: 0.35 }),
      pupil: new THREE.MeshStandardMaterial({ color: 0x130f0c, roughness: 0.24 }),
      light: new THREE.MeshBasicMaterial({ color: 0xffffff })
    };
    this.sphere = new THREE.SphereGeometry(1, 24, 18);
    const pelvis = this.joints.root = new THREE.Group(); this.model.add(pelvis);
    const torso = this.joints.torso = new THREE.Group(); pelvis.add(torso);
    // A tailored, rounded torso joins the skirt at the pelvis. The shoulders
    // overlap the sleeve caps so bending never opens a disconnected elbow seam.
    const bodyProfile = [[0.255, -0.045], [0.26, 0.02], [0.267, 0.24], [0.287, 0.48], [0.28, 0.60], [0.22, 0.68], [0.11, 0.71]];
    this.mesh(torso, new THREE.LatheGeometry(bodyProfile.map(([r, y]) => new THREE.Vector2(r, y)), 32), 'cloth', [0, 0, 0], [1, 1, 0.76]);
    for (const side of [-1, 1]) this.ellipsoid(torso, 'cloth', [side * 0.245, 0.57, 0], [0.10, 0.12, 0.15]);
    if (this.gender === 'boy') {
      this.mesh(torso, new THREE.CylinderGeometry(0.11, 0.12, 0.105, 18), 'white', [0, 0.72, 0]);
      this.mesh(torso, new THREE.BoxGeometry(0.022, 0.42, 0.008), 'trim', [0, 0.40, 0.214]);
      for (let i = 0; i < 4; i++) this.ellipsoid(torso, 'trim', [0, 0.54 - i * 0.095, 0.226], [0.013, 0.013, 0.008]);
    }
    const head = this.joints.head = new THREE.Group(); head.position.y = 0.73; torso.add(head);
    this.face = this.ellipsoid(head, 'skin', [0, 0.255, 0], [0.285, 0.335, 0.26]);
    this.ellipsoid(torso, 'skin', [0, 0.715, 0], [0.088, 0.13, 0.087]);
    if (this.gender === 'boy') {
      for (const side of [-1, 1]) {
        this.ellipsoid(head, 'skin', [side * 0.295, 0.24, 0], [0.065, 0.10, 0.055]);
        this.ellipsoid(head, 'blush', [side * 0.325, 0.24, 0.036], [0.026, 0.06, 0.021]);
      }
      this.mesh(head, new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, 1.33), 'hair', [0, 0.275, -0.015], [0.292, 0.34, 0.255]);
      for (let i = 0; i < 6; i++) {
        const tuft = this.ellipsoid(head, 'hair', [-0.205 + i * 0.076, 0.48 - Math.sin(i * 0.75) * 0.038, 0.17], [0.075, 0.087, 0.040]);
        tuft.rotation.z = -0.58;
      }
      const capProfile = [[0, 0.66], [0.18, 0.659], [0.224, 0.63], [0.239, 0.515], [0.234, 0.49]];
      this.mesh(head, new THREE.LatheGeometry(capProfile.slice().reverse().map(([r, y]) => new THREE.Vector2(r, y)), 40), 'white', [0, 0, -0.018], [1, 1, 0.79]);
      for (const y of [0.506, 0.613]) {
        const seam = this.mesh(head, new THREE.TorusGeometry(0.235, 0.004, 5, 40), 'trim', [0, y, -0.018], [1, 0.79, 1]);
        seam.rotation.x = Math.PI / 2;
      }
      for (let i = 0; i < 28; i++) {
        const a = i / 28 * Math.PI * 2;
        const detail = this.mesh(head, new THREE.TorusGeometry(0.019, 0.003, 4, 4), 'trim', [Math.sin(a) * 0.238, 0.563, Math.cos(a) * 0.189 - 0.018]);
        detail.rotation.y = a;
      }
    } else {
      // An actual open hood, parameterised around +Z. A closed sphere placed
      // behind a face leaks through cheeks; this surface has a real face opening.
      const points = [], faces = [], rings = 17, segments = 40;
      for (let r = 0; r <= rings; r++) {
        const alpha = 1.04 + (Math.PI - 1.04) * r / rings;
        for (let j = 0; j <= segments; j++) {
          const a = j / segments * Math.PI * 2;
          const fold = 1 + 0.012 * Math.cos(a * 8) * Math.sin(alpha);
          points.push(Math.cos(a) * Math.sin(alpha) * 0.327 * fold,
            0.26 + Math.sin(a) * Math.sin(alpha) * 0.369,
            Math.cos(alpha) * 0.293 - 0.013);
          if (r < rings && j < segments) {
            const k = r * (segments + 1) + j;
            faces.push(k, k + segments + 1, k + 1, k + 1, k + segments + 1, k + segments + 2);
          }
        }
      }
      const hoodGeometry = new THREE.BufferGeometry();
      hoodGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); hoodGeometry.setIndex(faces); hoodGeometry.computeVertexNormals();
      this.materials.white.side = THREE.DoubleSide;
      this.mesh(head, hoodGeometry, 'white');
      const edge = [];
      for (let i = 0; i <= 48; i++) {
        const a = i / 48 * Math.PI * 2;
        edge.push(new THREE.Vector3(Math.cos(a) * 0.282, 0.26 + Math.sin(a) * 0.318, 0.14));
      }
      this.mesh(head, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true), 48, 0.013, 5, true), 'white');
      // Rose under-cap appears only as a slim band above the forehead.
      const band = [];
      for (let i = 0; i <= 20; i++) {
        const a = 0.22 + i / 20 * (Math.PI - 0.44);
        band.push(new THREE.Vector3(Math.cos(a) * 0.258, 0.265 + Math.sin(a) * 0.292, 0.153));
      }
      this.mesh(head, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(band), 24, 0.019, 6, false), 'trim');
      const mantle = [], mantleIndices = [], nr = 12, ns = 40;
      for (let r = 0; r <= nr; r++) for (let j = 0; j <= ns; j++) {
        const t = r / nr, a = j / ns * Math.PI * 2;
        const front = (Math.cos(a) + 1) / 2;
        const width = t < 0.40 ? THREE.MathUtils.lerp(0.105, 0.34, t / 0.40) : THREE.MathUtils.lerp(0.34, 0.29, (t - 0.40) / 0.60);
        const y = 0.79 - t * (0.43 + front * 0.075) + 0.010 * Math.sin(a * 6) * t;
        const depth = t < 0.40 ? 0.11 + t * 0.36 : 0.254 + 0.01 * Math.sin(t * Math.PI * 6);
        mantle.push(Math.sin(a) * width, y, Math.cos(a) * depth);
        if (r < nr && j < ns) { const k = r * (ns + 1) + j; mantleIndices.push(k, k + 1, k + ns + 1, k + 1, k + ns + 2, k + ns + 1); }
      }
      const mantleGeometry = new THREE.BufferGeometry(); mantleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(mantle, 3)); mantleGeometry.setIndex(mantleIndices); mantleGeometry.computeVertexNormals();
      this.mesh(torso, mantleGeometry, 'white');
    }
    for (const side of [-1, 1]) {
      const eye = new THREE.Group(); eye.position.set(side * 0.111, 0.285, 0.225); head.add(eye);
      this.ellipsoid(eye, 'hair', [0, 0, -0.009], [0.076, 0.089, 0.022]);
      this.ellipsoid(eye, 'white', [0, -0.002, 0], [0.069, 0.079, 0.024]);
      this.ellipsoid(eye, 'eyes', [-side * 0.006, -0.003, 0.021], [0.046, 0.056, 0.011]);
      this.ellipsoid(eye, 'pupil', [-side * 0.006, -0.003, 0.030], [0.025, 0.036, 0.006]);
      this.ellipsoid(eye, 'light', [-0.017, 0.020, 0.036], [0.010, 0.012, 0.004]);
      this.ellipsoid(eye, 'light', [0.014, -0.020, 0.036], [0.004, 0.005, 0.003]);
      this.eyes.push(eye);
      const brow = this.ellipsoid(head, 'hair', [side * 0.117, 0.402, 0.223], [0.071, 0.016, 0.012]);
      brow.rotation.z = -side * 0.12;
      this.ellipsoid(head, 'blush', [side * 0.181, 0.174, 0.204], [0.044, 0.022, 0.006]);
    }
    this.nose = this.ellipsoid(head, 'skin', [0, 0.215, 0.26], [0.040, 0.029, 0.038]);
    const smile = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.076, 0.110, 0.239), new THREE.Vector3(0, 0.064, 0.263), new THREE.Vector3(0.076, 0.110, 0.239));
    this.mesh(head, new THREE.TubeGeometry(smile, 14, 0.005, 5, false), 'hair');
    for (const side of [-1, 1]) {
      const name = side === 1 ? 'L' : 'R';
      const arm = this.buildLimb(torso, [side * 0.29, 0.57, 0], 0.38, 0.35, 0.095, 'cloth');
      this.joints['arm' + name] = arm;
      arm.hand = new THREE.Group(); arm.hand.position.y = -0.35; arm.joint.add(arm.hand);
      this.ellipsoid(arm.hand, 'skin', [0, -0.054, 0], [0.057, 0.073, 0.035]);
      this.mesh(arm.joint, new THREE.CylinderGeometry(0.059, 0.057, 0.044, 14), 'trim', [0, -0.282, 0]);
      arm.fingers = [];
      for (let i = 0; i < 4; i++) {
        const finger = new THREE.Group(); finger.position.set((i - 1.5) * 0.027, -0.109, 0); arm.hand.add(finger);
        this.ellipsoid(finger, 'skin', [0, -0.027, 0], [0.013, i === 0 || i === 3 ? 0.029 : 0.034, 0.015]);
        arm.fingers.push(finger);
      }
      const thumb = this.ellipsoid(arm.hand, 'skin', [-side * 0.064, -0.050, 0.010], [0.023, 0.051, 0.024]); thumb.rotation.z = -side * 0.40;
      const leg = this.buildLimb(pelvis, [side * 0.17, 0, 0], 0.48, 0.47, 0.105, 'cloth');
      this.joints['leg' + name] = leg;
      leg.foot = new THREE.Group(); leg.foot.position.y = -0.47; leg.joint.add(leg.foot);
      this.ellipsoid(leg.foot, 'skin', [0, -0.030, 0.042], [0.083, 0.050, 0.135]);
      this.ellipsoid(leg.foot, 'skin', [0, -0.011, -0.030], [0.063, 0.069, 0.071]);
      leg.toes = new THREE.Group(); leg.toes.position.set(0, -0.055, 0.178); leg.foot.add(leg.toes);
      for (let i = 0; i < 5; i++) this.ellipsoid(leg.toes, 'skin', [(i - 2) * 0.029, 0, 0.014 - i * 0.006], [0.018, 0.025, 0.039 - i * 0.003]);
    }
    // 13 rings x 32 vertices, deforming at pose changes only.
    const rings = 19, sides = 48, positions = [], indices = [];
    for (let i = 0; i < rings; i++) for (let j = 0; j <= sides; j++) positions.push(0, 0, 0);
    for (let i = 0; i < rings - 1; i++) for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j, b = a + sides + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
    this.garmentGeometry = new THREE.BufferGeometry();
    this.garmentGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.garmentGeometry.setIndex(indices);
    const garmentMat = this.materials.cloth.clone(); garmentMat.side = THREE.DoubleSide;
    this.garment = new THREE.Mesh(this.garmentGeometry, garmentMat); this.garment.castShadow = true; this.garment.receiveShadow = true;
    this.garment.frustumCulled = false; this.model.add(this.garment);
    this.model.userData.gender = this.gender;
    // Merge only static siblings. Joint groups and eyes remain independently
    // articulated while embroidered details share a small number of draw calls.
    this.model.traverse(object => { if (object.isGroup) this.mergeStatic(object); });
  }
  mergeStatic(parent) {
    const batches = new Map();
    for (const child of parent.children) if (child.isMesh && child !== this.garment) {
      const group = batches.get(child.material) || []; group.push(child); batches.set(child.material, group);
    }
    for (const [material, meshes] of batches) if (meshes.length > 1) {
      const parts = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().deleteAttribute('uv').applyMatrix4(mesh.matrix); });
      const geometry = mergeGeometries(parts, false); parts.forEach(part => part.dispose());
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true;
      parent.add(mesh); meshes.forEach(old => parent.remove(old));
    }
  }
  mesh(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(geometry, this.materials[material]);
    mesh.position.fromArray(position); mesh.scale.fromArray(scale); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  ellipsoid(parent, material, position, scale) { return this.mesh(parent, this.sphere, material, position, scale); }
  buildLimb(parent, position, upper, lower, radius, material) {
    const root = new THREE.Group(); root.position.fromArray(position); parent.add(root);
    this.mesh(root, new THREE.CapsuleGeometry(radius, upper - radius * 1.6, 6, 14), material, [0, -upper / 2, 0]);
    const joint = new THREE.Group(); joint.position.y = -upper; root.add(joint);
    const sleeveLength = lower - 0.065;
    this.mesh(joint, new THREE.CylinderGeometry(radius * 0.92, radius * 0.59, sleeveLength, 16), material, [0, -sleeveLength / 2, 0]);
    this.ellipsoid(joint, material, [0, 0, 0], [radius * 0.95238, radius * 0.95238, radius * 0.95238]);
    this.ellipsoid(joint, 'skin', [0, -lower + 0.033, 0], [radius * 0.42, 0.063, radius * 0.42]);
    return { root, joint, upper, lower };
  }
  solve(limb, target, pole) {
    this.model.updateMatrixWorld(true);
    const start = limb.root.getWorldPosition(new THREE.Vector3());
    const solved = solveTwoBone(start, target, pole, limb.upper, limb.lower);
    const parentQ = limb.root.parent.getWorldQuaternion(new THREE.Quaternion());
    const upperQ = new THREE.Quaternion().setFromUnitVectors(DOWN, solved.joint.clone().sub(start).normalize());
    limb.root.quaternion.copy(parentQ.invert().multiply(upperQ));
    const lowerQ = new THREE.Quaternion().setFromUnitVectors(DOWN, solved.end.clone().sub(solved.joint).normalize());
    limb.joint.quaternion.copy(upperQ.clone().invert().multiply(lowerQ));
    return { ...solved, start, lowerQ };
  }
  applyPose(p) {
    this.joints.root.position.fromArray(p.hip); this.joints.torso.rotation.x = p.pitch;
    this.joints.head.rotation.set(p.headPitch, p.headYaw, 0, 'YXZ');
    for (const side of [-1, 1]) {
      const name = side === 1 ? 'L' : 'R';
      const leg = this.joints['leg' + name];
      const legResult = this.solve(leg, v(p['foot' + name]), v(p['knee' + name]));
      leg.foot.quaternion.copy(legResult.lowerQ.clone().invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(p['footPitch' + name], p['footYaw' + name], 0, 'YXZ'))));
      leg.toes.rotation.x = -p['footPitch' + name];
      const arm = this.joints['arm' + name];
      const armResult = this.solve(arm, v(p['hand' + name]), new THREE.Vector3(p.hip[0] + side * (0.6 + p.armSpread * 0.35), p.hip[1] + 0.18, 0.13));
      const angle = p['palm' + name];
      const handQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, p['handYaw' + name], 0, 'YXZ'));
      // Optional roll about the finger axis (tashahhud fist on its edge); 0 leaves every other pose unchanged.
      if (p['roll' + name]) handQ.multiply(new THREE.Quaternion().setFromAxisAngle(UP, p['roll' + name]));
      arm.hand.quaternion.copy(armResult.lowerQ.clone().invert().multiply(handQ));
      // z is the tashahhud forefinger movement (set in update); reset it so it never carries into other poses.
      // Tashahhud (p.finger = 1): the three fingers fold back into the palm (≈150°) so only the forefinger
      // (index 3, beside the thumb) stays extended and reads clearly as pointing.
      arm.fingers.forEach((finger, index) => { finger.rotation.x = name === 'R' && index !== 3 ? p.finger * 2.6 : 0; finger.rotation.z = 0; });
      this.landmarks['knee' + name] = legResult.joint;
      this.landmarks['ankle' + name] = legResult.end;
      this.landmarks['wrist' + name] = armResult.end;
      this.landmarks['elbow' + name] = armResult.joint;
    }
    this.updateGarment(p); this.model.updateMatrixWorld(true);
  }
  updateGarment(p) {
    const pos = this.garmentGeometry.attributes.position;
    const hip = v(p.hip);
    const folded = THREE.MathUtils.smoothstep(1.055 - hip.y, 0.08, 0.60);
    // Seated (jalsa / qa'da / salam, pelvis below ~0.45): the robe drapes from the waist over the
    // lap. Standing, ruku' and sujud keep seated = 0, i.e. exactly the original wall-shaped robe.
    const seated = THREE.MathUtils.smoothstep(0.45 - hip.y, 0, 0.2);
    // A loose robe hangs around the *envelope* of both folded legs. Following
    // hip->knee->ankle as a tube folds it into itself in sitting; horizontal
    // cloth sections instead retain one outward-facing surface and a free hem.
    const hemY = THREE.MathUtils.lerp(0.175, 0.058, folded);
    const samples = [];
    for (const side of ['L', 'R']) {
      const start = new THREE.Vector3(hip.x + (side === 'L' ? 0.17 : -0.17), hip.y, hip.z);
      const k = this.landmarks['knee' + side], a = this.landmarks['ankle' + side];
      for (let i = 0; i <= 12; i++) {
        samples.push(start.clone().lerp(k, i / 12));
        samples.push(k.clone().lerp(a, i / 12));
      }
    }
    // Feet join the envelope only while seated (their reach fades in), so a folded foot is
    // covered by the hem instead of poking through it; the standing robe is unaffected.
    const feet = [];
    if (seated > 0) {
      this.model.updateMatrixWorld(true);
      for (const side of ['L', 'R']) for (const local of [[0, -0.03, 0.15], [0, -0.025, 0.03], [0, -0.01, -0.08]]) {
        feet.push(this.joints['leg' + side].foot.localToWorld(v(local)));
      }
    }
    const envelope = (y, all) => {
      let xMin = hip.x - 0.25, xMax = hip.x + 0.25, zMin = hip.z - 0.19, zMax = hip.z + 0.19;
      const grow = (sample, rad) => {
        const dy = all ? 0 : Math.abs(y - sample.y);
        if (dy > rad) return;
        const radius = Math.sqrt(Math.max(0, rad ** 2 - dy ** 2));
        xMin = Math.min(xMin, sample.x - radius); xMax = Math.max(xMax, sample.x + radius);
        zMin = Math.min(zMin, sample.z - radius); zMax = Math.max(zMax, sample.z + radius);
      };
      for (const sample of samples) grow(sample, 0.125);
      for (const foot of feet) grow(foot, 0.11 * seated);
      return { xMin, xMax, zMin, zMax };
    };
    // Height of the top of the legs (and feet) under a point of the lap.
    const legTop = (x, z) => {
      let top = -Infinity;
      for (const sample of samples) {
        const d2 = (x - sample.x) ** 2 + (z - sample.z) ** 2;
        if (d2 < 0.125 ** 2) top = Math.max(top, sample.y + Math.sqrt(0.125 ** 2 - d2));
      }
      for (const foot of feet) {
        const d2 = (x - foot.x) ** 2 + (z - foot.z) ** 2;
        if (d2 < 0.09 ** 2) top = Math.max(top, foot.y + Math.sqrt(0.09 ** 2 - d2));
      }
      return top;
    };
    const outer = seated > 0 ? envelope(0, true) : null;
    const lapRows = 7;
    const out = new THREE.Vector3(), lap = new THREE.Vector3();
    const lapTops = [];
    for (let r = 0; r < 19; r++) {
      const t = r / 18, y = THREE.MathUtils.lerp(hip.y - 0.025, hemY, t);
      const { xMin, xMax, zMin, zMax } = envelope(y, false);
      const centerX = (xMin + xMax) / 2, centerZ = (zMin + zMax) / 2;
      const width = Math.max(0.257 + 0.089 * t, (xMax - xMin) / 2 + 0.025 * folded);
      const depth = Math.max(0.195 + 0.053 * t, (zMax - zMin) / 2 + 0.025 * folded);
      // Lap shape: rows 0..lapRows widen from the waist to the outline of legs and feet,
      // lying on the legs; the remaining rows fall from that outline to the hem.
      let lc = null;
      if (seated > 0) {
        const s = Math.min(1, r / lapRows), ease = 1 - (1 - s) ** 2;
        const ox = (outer.xMin + outer.xMax) / 2, oz = (outer.zMin + outer.zMax) / 2;
        const ow = (outer.xMax - outer.xMin) / 2 + 0.03, od = (outer.zMax - outer.zMin) / 2 + 0.03;
        lc = {
          cx: THREE.MathUtils.lerp(hip.x, ox, ease), cz: THREE.MathUtils.lerp(hip.z + 0.01, oz, ease),
          w: THREE.MathUtils.lerp(0.25, ow, ease), d: THREE.MathUtils.lerp(0.19, od, ease), s,
          fall: r <= lapRows ? 0 : (r - lapRows) / (18 - lapRows)
        };
      }
      for (let j = 0; j <= 48; j++) {
        const a = j / 48 * Math.PI * 2;
        const pleat = 1 + (0.020 * t) * Math.cos(a * 12 + t * 0.35);
        // Rounded-square sections cover both knees without a balloon-sized
        // ellipse; gentle pleats provide highlights instead of painted stripes.
        const c = Math.cos(a), sn = Math.sin(a), power = 1 - folded * 0.36;
        const sx = Math.sign(c) * Math.abs(c) ** power, sz = Math.sign(sn) * Math.abs(sn) ** power;
        out.set(centerX + sx * width * pleat, y + 0.004 * Math.sin(a * 12) * t, centerZ + sz * depth * pleat);
        if (lc) {
          lap.set(lc.cx + sx * lc.w * pleat, 0, lc.cz + sz * lc.d * pleat);
          if (r <= lapRows) {
            // Rest on the legs; between and behind them the cloth sags gently toward the hem.
            const base = THREE.MathUtils.lerp(hip.y + 0.05, hemY + 0.05, lc.s);
            lap.y = Math.max(base, legTop(lap.x, lap.z) + 0.02);
            if (r === lapRows) lapTops[j] = lap.y;
          } else {
            lap.y = THREE.MathUtils.lerp(lapTops[j], hemY, lc.fall) + 0.004 * Math.sin(a * 12) * lc.fall;
          }
          out.lerp(lap, seated);
        }
        pos.setXYZ(r * 49 + j, out.x, out.y, out.z);
      }
    }
    pos.needsUpdate = true; this.garmentGeometry.computeVertexNormals();
  }
  setGender(gender) {
    if (!['boy', 'girl'].includes(gender) || gender === this.gender) return;
    disposeTree(this.model); this.model.clear(); this.gender = gender;
    this.build(); this.applyPose(this.animator.pose);
  }
  setSettings(settings) { this.animator.settings = { ...settings }; return this.transitionTo(this.animator.action, 0.65); }
  setPose(key, duration = 0) { return this.transitionTo(key, duration); }
  transitionTo(key, duration = 1.15) {
    const promise = this.animator.play(key, duration, this.reducedMotion);
    this.applyPose(this.animator.pose); return promise;
  }
  /** Advances the animation; returns true when something visible changed (the caller renders only then). */
  update(delta, time) {
    let changed = false;
    if (this.animator.update(delta)) { this.applyPose(this.animator.pose); changed = true; }
    if (!this.reducedMotion) {
      const phase = time % 5.7;
      const blink = phase > 5.48 ? 1 - Math.sin((phase - 5.48) / 0.22 * Math.PI) * 0.92 : 1;
      if (blink !== this.eyes[0].scale.y) { this.eyes.forEach(eye => { eye.scale.y = blink; }); changed = true; }
      // Forefinger movement during the tashahhud only when the practice setting asks for it.
      if (this.animator.action === 'qada' && !this.animator.busy && this.animator.settings.tahrik !== 'still') { this.joints.armR.fingers[3].rotation.z = Math.sin(time * 3.5) * 0.08; changed = true; }
    }
    return changed;
  }
  destroy() { this.animator.cancel(); disposeTree(this.model); this.scene.remove(this.model); }
}
