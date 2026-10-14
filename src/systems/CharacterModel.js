import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Soft matte fabric / painted surfaces (lit, no plastic sheen)
function clothMat(params) {
  return new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...params });
}

// Small surface details (face, badges, stripes): lit like the body and offset to avoid z-fighting
function decalMat(params) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.6, metalness: 0, ...params,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
}

// Capsule limb segment hanging down from its joint (origin at the top joint)
function limbGeo(radiusTop, radiusBottom, length) {
  const geo = new THREE.CapsuleGeometry(1, length, 8, 18);
  const p = geo.attributes.position;
  const half = length / 2;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let r;
    if (y > half) { r = radiusTop; y = half + (y - half) * radiusTop; }
    else if (y < -half) { r = radiusBottom; y = -half + (y + half) * radiusBottom; }
    else { r = radiusTop + (radiusBottom - radiusTop) * ((half - y) / length); }
    p.setXYZ(i, x * r, y - half, z * r);
  }
  geo.computeVertexNormals();
  return geo;
}

function jointBall(radius) {
  return new THREE.SphereGeometry(radius, 16, 12);
}

const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Head shape: sphere with a tapered jaw/chin and slightly flattened face (no "ball head")
const JAW = 0.24;
const FACE_FLAT = 0.94;
function jawTaper(ny) {
  return 1 - JAW * smooth(0.1, -1.0, ny);
}
function makeHeadGeometry(r) {
  const geo = new THREE.SphereGeometry(r, 40, 32);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = jawTaper(y / r);
    p.setXYZ(i, x * t, y, z * t * (z > 0 ? FACE_FLAT : 1));
  }
  geo.computeVertexNormals();
  return geo;
}
// Front surface depth of the deformed head at (x, y) in head space (before mesh scale.y)
function headSurfaceZ(r, x, y, sy = 1) {
  const yy = y / sy;
  const t = jawTaper(yy / r);
  const xx = x / t;
  return Math.sqrt(Math.max(0, r * r - xx * xx - yy * yy)) * t * FACE_FLAT;
}

const LONG_SLEEVE_ROLES = ['police_officer', 'police_inspector', 'firefighter', 'imam', 'elderly_citizen', 'historian', 'artisan', 'doctor', 'librarian'];
const ROBE_ROLES = { imam: 0.95, elderly_citizen: 0.95, doctor: 0.62 };
const MOUSTACHE_ROLES = ['grocer', 'artisan', 'gardener', 'police_inspector', 'historian', 'cleaner'];

/**
 * CharacterModel: human-proportioned stylized characters
 * - Realistic proportions (adults ~1.78 m / 7 heads, young heroes ~1.5 m / 6 heads)
 * - Articulated rig: hips, torso, head, shoulders, elbows, hands, hips, knees, feet
 * - Tapered jaw head, natural-size eyes, closed smile, real hands with thumbs
 * - Role clothing: uniforms, lab coat, traditional gandoura/qamis, hijab, moustaches
 * - Blended walk/run/idle/jump cycles with knee and elbow flex, plus wave/talk gestures
 */
export class CharacterModel {
  constructor(charType = 'boy_purple', options = {}) {
    this.charType = charType;
    this.options = options;
    this.group = new THREE.Group();

    this.animTime = 0;
    this.actionTime = 0;
    this.currentAction = null;

    // References to animated joints
    this.bones = {};
    this.wheels = []; // Kept for compatibility if referenced

    this.buildCharacter();
  }

  buildCharacter() {
    let type = this.charType;
    if (type === 'boy') type = 'boy_purple';
    if (type === 'girl') type = 'girl_yellow'; // Default girl is Sara!
    const isNPC = type === 'npc_adult' || this.options.isNPC;
    const role = this.options.npcRole;

    // ─────────────────────────────────────────────────────────────
    // 1. Color palettes
    // ─────────────────────────────────────────────────────────────
    let skinColor = 0xf3c7a5;
    let hairColor = 0x3d2314;
    let shirtColor = 0x7c3aed;
    let pantsColor = 0x242b35;
    let shoeColor = 0x0984e3;
    let eyeColor = 0x4a2e18;
    let collarColor = 0xffffff;

    if (type === 'girl_yellow' || type === 'sara') {
      skinColor = 0xf5cbab;
      hairColor = 0x4a2c1d;
      shirtColor = 0xf1c40f;
      collarColor = 0xe67e22;
      pantsColor = 0x34495e;
      shoeColor = 0xe84393;
      eyeColor = 0x3e2723;
    } else if (type === 'girl_green' || type === 'rayan') {
      skinColor = 0xf2c3a0;
      hairColor = 0x8b3a1a;
      shirtColor = 0x27ae60;
      collarColor = 0xffffff;
      pantsColor = 0x2980b9;
      shoeColor = 0xf39c12;
      eyeColor = 0x1b5e20;
    }
    if (!isNPC && this.options.primaryColor !== undefined) {
      shirtColor = this.options.primaryColor;
      if (this.options.secondaryColor !== undefined) pantsColor = this.options.secondaryColor;
      if (this.options.shoeColor !== undefined) shoeColor = this.options.shoeColor;
    }
    if (isNPC) {
      skinColor = this.options.skinColor || 0xe8bd9c;
      shirtColor = this.options.primaryColor || 0x27ae60;
      pantsColor = this.options.secondaryColor || 0x2c3e50;
      hairColor = this.options.hairColor || 0x2c1d11;
      shoeColor = 0x3b2a20;
      if (this.options.npcRole === 'doctor') shirtColor = 0xf4f6f7;
      // Legs under a jilbab take the dress colour so the stride never shows trousers
      if (this.options.gender === 'female') {
        pantsColor = shirtColor;
        shoeColor = 0x2b2b2b;
      }
      eyeColor = 0x2d1f14;
    }

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.92, metalness: 0 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85, metalness: 0, flatShading: true });
    const shirtMat = clothMat({ color: shirtColor });
    const pantsMat = clothMat({ color: pantsColor });
    const shoeMat = clothMat({ color: shoeColor, roughness: 0.55 });
    const whiteMat = clothMat({ color: 0xffffff });
    const darkMat = clothMat({ color: 0x1a1a1a });
    const cheekMat = decalMat({ color: 0xff8a80, transparent: true, opacity: 0.18, depthWrite: false });
    const eyeIrisMat = decalMat({ color: eyeColor, roughness: 0.25 });

    // ─────────────────────────────────────────────────────────────
    // 2. Body dimensions (metres)
    // ─────────────────────────────────────────────────────────────
    const D = isNPC
      ? { thigh: 0.44, shin: 0.42, foot: 0.07, torso: 0.54, neck: 0.08, headR: 0.114, chestW: 0.185, chestD: 0.12,
          hipW: 0.16, shoulderX: 0.2, upper: 0.29, fore: 0.26, upperR: 0.056, foreR: 0.046, thighR: 0.092, shinR: 0.066, hand: 1.18, shoeL: 0.27 }
      : { thigh: 0.37, shin: 0.35, foot: 0.06, torso: 0.44, neck: 0.07, headR: 0.12, chestW: 0.15, chestD: 0.1,
          hipW: 0.135, shoulderX: 0.163, upper: 0.235, fore: 0.215, upperR: 0.047, foreR: 0.039, thighR: 0.078, shinR: 0.056, hand: 1.0, shoeL: 0.23 };
    this.dims = D;
    this.role = role;
    this.isNPC = isNPC;
    const isFemaleNPC = isNPC && this.options.gender === 'female';
    const robeLen = ROBE_ROLES[role] ?? (isFemaleNPC ? 0.97 : 0);
    this.strideScale = robeLen > 0.9 ? (isFemaleNPC ? 0.7 : 0.6) : 1.0;

    // ─────────────────────────────────────────────────────────────
    // 3. Hips / pelvis
    // ─────────────────────────────────────────────────────────────
    const hips = new THREE.Group();
    const hipHeight = D.thigh + D.shin + D.foot;
    hips.position.y = hipHeight;
    this.hipHeight = hipHeight;
    this.group.add(hips);
    this.bones.hips = hips;

    const pelvis = new THREE.Mesh(
      new THREE.LatheGeometry([
        new THREE.Vector2(0.001, -0.1), new THREE.Vector2(D.hipW * 0.55, -0.095),
        new THREE.Vector2(D.hipW * 0.93, -0.05), new THREE.Vector2(D.hipW, 0.0), new THREE.Vector2(D.hipW * 0.97, 0.04)
      ], 24),
      pantsMat
    );
    pelvis.scale.z = 0.78;
    hips.add(pelvis);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(D.hipW * 1.0, D.hipW * 1.0, 0.03, 24, 1, true), darkMat);
    belt.scale.z = 0.8;
    belt.position.y = 0.03;
    hips.add(belt);

    // ─────────────────────────────────────────────────────────────
    // 4. Torso (lathe-sculpted chest, waist and shoulder slope)
    // ─────────────────────────────────────────────────────────────
    const torso = new THREE.Group();
    this.torsoBaseY = 0.02;
    torso.position.y = this.torsoBaseY;
    hips.add(torso);
    this.bones.torso = torso;

    const H = D.torso;
    const W = D.chestW;
    const profile = [
      [0, W * 0.9], [0.3, W * 0.85], [0.62, W * 1.0], [0.8, W * 1.04], [0.9, W * 1.0], [0.97, W * 0.72], [1.0, W * 0.4], [1.02, 0.001]
    ];
    const torsoMesh = new THREE.Mesh(
      new THREE.LatheGeometry(profile.map(([h, r]) => new THREE.Vector2(r, h * H)), 28),
      shirtMat
    );
    torsoMesh.scale.z = D.chestD / W;
    torso.add(torsoMesh);

    // Front surface depth of the torso at height h (for placing details)
    const frontZ = (h) => {
      const f = h / H;
      for (let i = 1; i < profile.length; i++) {
        if (f <= profile[i][0]) {
          const [h0, r0] = profile[i - 1];
          const [h1, r1] = profile[i];
          return (r0 + (r1 - r0) * ((f - h0) / (h1 - h0))) * (D.chestD / W);
        }
      }
      return 0;
    };

    // Collar
    const collar = new THREE.Mesh(new THREE.TorusGeometry(D.neck * 0.62 + 0.012, 0.012, 10, 24), clothMat({ color: collarColor }));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = H * 0.99;
    torso.add(collar);

    // Jacket zip / stripes for Amin
    if (type === 'boy_purple' || type === 'boy') {
      const zip = new THREE.Mesh(new THREE.PlaneGeometry(0.012, H * 0.85), decalMat({ color: 0xffffff }));
      zip.position.set(0, H * 0.47, frontZ(H * 0.47) + 0.002);
      torso.add(zip);
    }

    // Algerian flag pin on chest
    const flagBadge = this.createAlgerianFlagPin(whiteMat);
    flagBadge.scale.setScalar(0.6);
    flagBadge.position.set(W * 0.5, H * 0.74, frontZ(H * 0.74) + 0.004);
    flagBadge.rotation.y = 0.35;
    torso.add(flagBadge);

    if (!isNPC) {
      const backpack = this.createBackpack(type === 'girl_yellow' ? 0xe74c3c : 0xd35400);
      backpack.scale.setScalar(0.72);
      backpack.position.set(0, H * 0.58, -D.chestD - 0.045);
      torso.add(backpack);
    } else if (role === 'police_officer' || role === 'police_inspector') {
      const badge = new THREE.Mesh(new THREE.CircleGeometry(0.018, 5), decalMat({ color: 0xf1c40f, roughness: 0.35 }));
      badge.position.set(-W * 0.5, H * 0.74, frontZ(H * 0.74) + 0.002);
      badge.rotation.y = -0.35;
      torso.add(badge);
      const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.03, H * 0.42), darkMat);
      tie.material = decalMat({ color: 0x111827 });
      tie.position.set(0, H * 0.7, frontZ(H * 0.7) + 0.003);
      torso.add(tie);
      if (role === 'police_officer') {
        const radio = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.07, 0.025, 2, 0.008), darkMat);
        radio.position.set(-W * 0.8, H * 0.86, D.chestD * 0.4);
        torso.add(radio);
      }
    } else if (role === 'firefighter') {
      const hiVisMat = clothMat({ color: 0xf1c40f, roughness: 0.5, emissive: 0x332800 });
      [0.62, 0.3].forEach(f => {
        const r = profile.reduce((acc, [h, rr]) => (h <= f ? rr : acc), W);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 0.03, 28, 1, true), hiVisMat);
        band.scale.z = D.chestD / W;
        band.position.y = H * f;
        torso.add(band);
      });
    } else if (role === 'doctor') {
      const stethMat = clothMat({ color: 0x34495e });
      const steth = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.007, 8, 24, Math.PI * 1.2), stethMat);
      steth.rotation.set(Math.PI / 2.2, 0, Math.PI * 0.9);
      steth.position.set(0, H * 0.9, D.chestD * 0.35);
      torso.add(steth);
    } else if (role === 'artisan') {
      // Embroidered traditional vest: gold buttons down the front
      const gold = decalMat({ color: 0xd4a017, roughness: 0.35 });
      for (let b = 0; b < 4; b++) {
        const h = H * (0.3 + b * 0.15);
        const button = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), gold);
        button.position.set(0, h, frontZ(h) + 0.002);
        torso.add(button);
      }
    }

    // Traditional gandoura / qamis or doctor's coat: flared robe hanging from the waist
    if (robeLen > 0) {
      const len = (D.thigh + D.shin) * robeLen;
      const robe = new THREE.Mesh(
        new THREE.LatheGeometry([
          new THREE.Vector2(D.hipW * 1.06, 0.05), new THREE.Vector2(D.hipW * 1.18, -len * 0.35),
          new THREE.Vector2(D.hipW * 1.45, -len), new THREE.Vector2(D.hipW * 1.4, -len - 0.01)
        ], 28),
        role === 'doctor' ? clothMat({ color: 0xf4f6f7, side: THREE.DoubleSide }) : clothMat({ color: shirtColor, side: THREE.DoubleSide })
      );
      robe.scale.z = 0.85;
      hips.add(robe);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Neck & head (head detailed at design scale, then scaled to real size)
    // ─────────────────────────────────────────────────────────────
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(D.neck * 0.62, D.neck * 0.72, D.neck + 0.05, 16), skinMat);
    neck.position.y = H + D.neck / 2 - 0.01;
    torso.add(neck);

    const headRadius = isNPC ? 0.30 : 0.35; // design radius used by hair/headwear builders
    const headScale = D.headR / headRadius;
    const headGroup = new THREE.Group();
    headGroup.position.set(0, H + D.neck * 0.8 + D.headR * 0.95, 0.01);
    headGroup.scale.setScalar(headScale);
    torso.add(headGroup);
    this.bones.head = headGroup;

    const SY = 1.1; // head is taller than wide
    const headMesh = new THREE.Mesh(makeHeadGeometry(headRadius), skinMat);
    headMesh.scale.set(1.0, SY, 1.0);
    headGroup.add(headMesh);
    const surf = (x, y) => headSurfaceZ(headRadius, x, y, SY);

    // Ears
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), skinMat);
      ear.scale.set(0.35, 0.85, 0.6);
      ear.position.set(s * headRadius * 0.95, -0.01, -0.02);
      headGroup.add(ear);
    });

    // Faceless head (INSIDE style): no eyes, brows, nose or mouth; ears and hair define the silhouette

    // Hair / headwear
    if (type === 'girl_yellow' || type === 'sara') {
      this.buildSaraHair(headGroup, headRadius, hairMat);
    } else if (type === 'girl_green' || type === 'rayan') {
      this.buildRayanHair(headGroup, headRadius, hairMat);
    } else if (type === 'boy_purple' || type === 'boy') {
      this.buildAminHair(headGroup, headRadius, hairMat);
    } else if (isNPC && this.options.gender === 'female') {
      this.buildHijab(headGroup, headRadius, clothMat({ color: this.options.hijabColor || 0x7a5c7e, side: THREE.DoubleSide }));
    } else if (isNPC) {
      this.buildNPCHeadwear(headGroup, headRadius, whiteMat, shirtMat, hairMat);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Arms & legs
    // ─────────────────────────────────────────────────────────────
    const longSleeves = type === 'boy_purple' || LONG_SLEEVE_ROLES.includes(role) || isFemaleNPC;
    ['left', 'right'].forEach((name, i) => {
      const side = i === 0 ? -1 : 1;
      const arm = this.createArm(side, skinMat, shirtMat, longSleeves);
      arm.position.set(side * D.shoulderX, H * 0.865, 0);
      torso.add(arm);
      this.bones[name + 'Arm'] = arm;

      const leg = this.createLeg(side, pantsMat, shoeMat, whiteMat);
      leg.position.set(side * D.hipW * 0.52, -0.05, 0);
      hips.add(leg);
      this.bones[name + 'Leg'] = leg;
      this.bones[name + 'Elbow'] = arm.userData.elbow;
      this.bones[name + 'Hand'] = arm.userData.hand;
      this.bones[name + 'Knee'] = leg.userData.knee;
      this.bones[name + 'Foot'] = leg.userData.foot;
    });

    // Natural build variation so crowds don't look cloned
    if (isNPC) {
      const w = this.options.build ?? (0.94 + Math.random() * 0.14);
      const h = this.options.height ?? (0.96 + Math.random() * 0.08);
      this.group.scale.set(w, h, w);
    }

    this.group.traverse(node => {
      if (node.isMesh) {
        node.castShadow = !node.material.transparent;
        node.receiveShadow = true;
      }
    });
  }

  /** Hijab: covers hair and neck, leaves the face open, drapes onto the shoulders */
  buildHijab(headGroup, headRadius, mat) {
    const r = headRadius;
    const open = Math.PI * 0.86;
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.08, 36, 24, Math.PI / 2 + open / 2, Math.PI * 2 - open, 0, Math.PI * 0.82),
      mat
    );
    shell.scale.y = 1.12;
    headGroup.add(shell);

    const frame = new THREE.Mesh(new THREE.TorusGeometry(r * 0.86, r * 0.07, 10, 28), mat);
    frame.scale.set(0.95, 1.22, 1);
    frame.position.set(0, -0.01, r * 0.42);
    headGroup.add(frame);

    const drape = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(r * 0.72, 0.5 * r), new THREE.Vector2(r * 0.8, 0), new THREE.Vector2(r * 1.2, -0.35 * r), new THREE.Vector2(r * 1.5, -0.55 * r)], 28), mat);
    drape.position.y = -r * 1.05;
    drape.scale.z = 0.85;
    headGroup.add(drape);
  }

  /**
   * SARA'S HAIRSTYLE: Natural, flowing, beautiful shoulder-length hair with cute flower clip
   */
  buildSaraHair(headGroup, headRadius, hairMat) {
    // 1. Hair Cap on top and back of head (Tilted backwards)
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius + 0.025, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairCap.position.set(0, 0.07, -0.04);
    hairCap.rotation.x = -0.32;
    headGroup.add(hairCap);

    // 2. High Wispy Bangs (Positioned HIGH above the eyebrows)
    for (let i = -2; i <= 2; i++) {
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.048, 0.12, 14),
        hairMat
      );
      strand.position.set(i * 0.065, 0.22, headRadius * 0.85);
      strand.rotation.z = i * 0.15;
      strand.rotation.x = 0.45;
      headGroup.add(strand);
    }

    // 3. Left & Right Curled Side Locks framing cheeks and flaring outwards
    [-1, 1].forEach(side => {
      const sideMass = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 20, 16),
        hairMat
      );
      sideMass.scale.set(0.7, 1.4, 0.8);
      sideMass.position.set(side * 0.32, 0.04, -0.02);
      headGroup.add(sideMass);

      const flipLock = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.040, 10, 22, Math.PI * 0.8),
        hairMat
      );
      flipLock.position.set(side * 0.35, -0.10, -0.03);
      flipLock.rotation.y = side * 0.3;
      flipLock.rotation.z = side > 0 ? -0.6 : 0.6;
      headGroup.add(flipLock);
    });

    // 4. Back Hair Volume
    const backHair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.32, 20),
      hairMat
    );
    backHair.position.set(0, -0.12, -0.16);
    backHair.rotation.x = -0.15;
    headGroup.add(backHair);

    // Cute decorative flower clip on the right side
    const clipMat = clothMat({ color: 0xe74c3c });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), clipMat);
    flower.position.set(0.24, 0.21, headRadius * 0.72);
    headGroup.add(flower);
  }

  /**
   * RAYAN'S HAIRSTYLE: Cute child hairstyle with perky high ponytail & green hair tie (NO HELMET!)
   */
  buildRayanHair(headGroup, headRadius, hairMat) {
    // 1. Soft hair cap covering top and back
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius + 0.025, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairCap.position.set(0, 0.07, -0.04);
    hairCap.rotation.x = -0.30;
    headGroup.add(hairCap);

    // 2. Front fringe high above eyebrows
    for (let i = -2; i <= 2; i++) {
      const tuft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.046, 0.11, 14),
        hairMat
      );
      tuft.position.set(i * 0.06, 0.22, headRadius * 0.86);
      tuft.rotation.x = 0.45;
      tuft.rotation.z = i * -0.12;
      headGroup.add(tuft);
    }

    // 3. Cute high ponytail at the back with a colorful green tie
    const tieMat = clothMat({ color: 0x27ae60 });
    const hairTie = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.022, 10, 24),
      tieMat
    );
    hairTie.rotation.x = Math.PI / 3;
    hairTie.position.set(0, 0.20, -headRadius * 0.86);
    headGroup.add(hairTie);

    // Perky ponytail plume
    const ponytail = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 16),
      hairMat
    );
    ponytail.scale.set(0.8, 1.4, 1.1);
    ponytail.position.set(0, 0.18, -headRadius * 0.96);
    ponytail.rotation.x = -0.6;
    headGroup.add(ponytail);

    // Side framing locks
    [-0.30, 0.30].forEach(hx => {
      const sideLock = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.06, 0.22, 14), hairMat);
      sideLock.position.set(hx, -0.05, -0.02);
      sideLock.rotation.z = hx > 0 ? -0.22 : 0.22;
      headGroup.add(sideLock);
    });
  }

  /**
   * AMIN'S HAIRSTYLE: Modern stylish textured boy haircut (NO HELMET!)
   */
  buildAminHair(headGroup, headRadius, hairMat) {
    this.buildShardHair(headGroup, headRadius, hairMat, 0);
  }

  /**
   * Smooth hair cap plus angular fringe shards over the forehead and by the ears (INSIDE-like silhouette)
   */
  buildShardHair(headGroup, r, hairMat, seed = 0) {
    const wrap = new THREE.Group();
    wrap.scale.set(1, 1.1, 1);
    headGroup.add(wrap);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
    cap.rotation.x = -0.38;
    wrap.add(cap);

    // Fringe shards hanging over the forehead at uneven lengths
    const shards = [[-0.62, 0.42], [-0.3, 0.6], [0.02, 0.38], [0.3, 0.55], [0.6, 0.36]];
    shards.forEach(([ang, len], i) => {
      const L = r * len * (1 + ((i + seed) % 3) * 0.08);
      const shard = new THREE.Mesh(new THREE.ConeGeometry(r * 0.26, L, 4), hairMat);
      shard.rotation.set(Math.PI + 0.25, ang * 0.6, 0);
      shard.scale.z = 0.35;
      shard.position.set(Math.sin(ang) * r * 0.9, r * 0.5 - L * 0.32, Math.cos(ang) * r * 0.86);
      wrap.add(shard);
    });
    // Sideburn shards in front of the ears
    [-1, 1].forEach(sd => {
      const burn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 0.5, 4), hairMat);
      burn.rotation.set(Math.PI, 0, sd * 0.15);
      burn.scale.z = 0.5;
      burn.position.set(sd * r * 0.93, r * 0.12, r * 0.12);
      wrap.add(burn);
    });
  }

  /**
   * NPC Specific Headwear (Imam turban, Cleaner cap, Gardener hat, Historian fez)
   */
  buildNPCHeadwear(headGroup, headRadius, whiteMat, primaryMat, hairMat) {
    const role = this.options.npcRole || 'cleaner';

    if (role === 'imam') {
      const turban = new THREE.Mesh(new THREE.TorusGeometry(headRadius * 0.88, 0.09, 10, 24), whiteMat);
      turban.rotation.x = Math.PI / 2;
      turban.position.set(0, headRadius * 0.65, 0);
      headGroup.add(turban);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.02, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), whiteMat);
      cap.position.set(0, headRadius * 0.65, 0);
      headGroup.add(cap);

      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 20), whiteMat);
      beard.position.set(0, -headRadius * 0.82, headRadius * 0.62);
      beard.rotation.x = 0.28;
      headGroup.add(beard);
    } else if (role === 'police_officer') {
      // Algerian Police Peaked Cap (قبعة ضابط الأمن الوطني مع شارة ذهبية)
      const policeNavy = clothMat({ color: 0x111c2e });
      const goldMat = decalMat({ color: 0xf1c40f });
      const blackPatent = clothMat({ color: 0x111111 });

      const capBand = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 0.95, headRadius * 0.92, 0.16, 18), policeNavy);
      capBand.position.set(0, headRadius * 0.62, 0);
      headGroup.add(capBand);

      const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 1.15, headRadius * 0.95, 0.24, 18), policeNavy);
      capCrown.position.set(0, headRadius * 0.78, 0.04);
      headGroup.add(capCrown);

      const visor = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 1.05, headRadius * 1.05, 0.04, 16, 1, false, 0, Math.PI), blackPatent);
      visor.position.set(0, headRadius * 0.56, headRadius * 0.65);
      visor.rotation.x = 0.28;
      headGroup.add(visor);

      const goldBadge = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), goldMat);
      goldBadge.position.set(0, headRadius * 0.82, headRadius * 0.88);
      headGroup.add(goldBadge);
    } else if (role === 'firefighter') {
      // Civil Protection Firefighter Helmet (خوذة الحماية المدنية)
      const helmetMat = clothMat({ color: 0xf1c40f });
      const visorMat = clothMat({ color: 0x2d3436, transparent: true, opacity: 0.8 });

      const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.05, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), helmetMat);
      helmetDome.position.set(0, headRadius * 0.55, -0.02);
      headGroup.add(helmetDome);

      const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 1.15, headRadius * 1.15, 0.04, 18), helmetMat);
      helmetBrim.position.set(0, headRadius * 0.55, 0);
      headGroup.add(helmetBrim);

      const eyeVisor = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 1.02, headRadius * 1.02, 0.15, 14, 1, false, 0, Math.PI), visorMat);
      eyeVisor.position.set(0, headRadius * 0.40, headRadius * 0.65);
      eyeVisor.rotation.x = 0.15;
      headGroup.add(eyeVisor);
    } else if (role === 'artisan') {
      // Traditional Algerian Chechia / Tarboush (شاشية جزائرية أصيلة)
      const chechiaMat = clothMat({ color: 0x962d2d });
      const chechia = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 0.75, headRadius * 0.82, 0.22, 24), chechiaMat);
      chechia.position.set(0, headRadius + 0.08, 0);
      headGroup.add(chechia);

      const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.18, 6), decalMat({ color: 0x111111 }));
      tassel.position.set(0.12, headRadius + 0.02, -0.08);
      tassel.rotation.z = 0.4;
      headGroup.add(tassel);
    } else if (role === 'elderly_citizen') {
      // White prayer cap & respected grey beard (شيخ وقور)
      const cap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.02, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.46), whiteMat);
      cap.position.set(0, headRadius * 0.56, -0.02);
      headGroup.add(cap);

      const greyMat = clothMat({ color: 0xdcdde1 });
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 20), greyMat);
      beard.position.set(0, -headRadius * 0.85, headRadius * 0.55);
      beard.rotation.x = 0.25;
      headGroup.add(beard);
    } else if (role === 'cleaner') {
      const capMat = clothMat({ color: 0x27ae60 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.025, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.48), capMat);
      cap.position.set(0, headRadius * 0.48, -0.02);
      headGroup.add(cap);

      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.025, 14, 1, false, 0, Math.PI), capMat);
      visor.position.set(0, headRadius * 0.52, headRadius * 0.68);
      visor.rotation.x = 0.22;
      headGroup.add(visor);
    } else if (role === 'gardener') {
      const strawMat = clothMat({ color: 0xe67e22 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.03, 18), strawMat);
      brim.position.set(0, headRadius * 0.85, 0);
      headGroup.add(brim);

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 0.20, 14), strawMat);
      crown.position.set(0, headRadius * 0.85 + 0.10, 0);
      headGroup.add(crown);
    } else if (role === 'historian') {
      const fezMat = clothMat({ color: 0x962d2d });
      const fez = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.28, 14), fezMat);
      fez.position.set(0, headRadius + 0.14, 0);
      headGroup.add(fez);

      const goldMat = decalMat({ color: 0xf1c40f });
      [-0.11, 0.11].forEach(gx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 10, 24), goldMat);
        ring.position.set(gx, 0.04, headRadius * 0.94);
        headGroup.add(ring);
      });
    } else if (role === 'suspect_promoter') {
      // Discreet dark cap pulled low
      const darkCap = clothMat({ color: 0x2d3436 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.025, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.48), darkCap);
      cap.position.set(0, headRadius * 0.48, -0.02);
      headGroup.add(cap);

      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.025, 14, 1, false, 0, Math.PI), darkCap);
      visor.position.set(0, headRadius * 0.46, headRadius * 0.70);
      visor.rotation.x = 0.38;
      headGroup.add(visor);
    } else {
      this.buildCasualHair(headGroup, headRadius, hairMat);
    }
  }

  /**
   * Everyday adult hair: the same angular INSIDE-like style, varied per character
   */
  buildCasualHair(headGroup, r, hairMat) {
    this.buildShardHair(headGroup, r, hairMat, Math.floor(Math.random() * 3));
  }

  /**
   * Arm: shoulder → upper arm → elbow → forearm → hand (palm, fingers, thumb)
   */
  createArm(side, skinMat, shirtMat, longSleeves) {
    const D = this.dims;
    const shoulder = new THREE.Group();

    const deltoid = new THREE.Mesh(jointBall(D.upperR * 1.12), shirtMat);
    deltoid.scale.set(1.0, 0.9, 1.05);
    deltoid.position.y = -D.upperR * 0.25;
    shoulder.add(deltoid);

    const upper = new THREE.Mesh(limbGeo(D.upperR, D.upperR * 0.86, D.upper), longSleeves ? shirtMat : skinMat);
    shoulder.add(upper);
    if (!longSleeves) {
      // Short sleeve slightly wider than the arm
      const sleeve = new THREE.Mesh(limbGeo(D.upperR * 1.32, D.upperR * 1.22, D.upper * 0.5), shirtMat);
      shoulder.add(sleeve);
    }

    const elbow = new THREE.Group();
    elbow.position.y = -D.upper;
    shoulder.add(elbow);
    elbow.add(new THREE.Mesh(jointBall(D.upperR * 0.86), longSleeves ? shirtMat : skinMat));

    const fore = new THREE.Mesh(limbGeo(D.foreR * 1.05, D.foreR * 0.78, D.fore), longSleeves ? shirtMat : skinMat);
    elbow.add(fore);
    if (longSleeves) {
      const wrist = new THREE.Mesh(limbGeo(D.foreR * 0.8, D.foreR * 0.72, D.fore * 0.12), skinMat);
      wrist.position.y = -D.fore * 0.92;
      elbow.add(wrist);
    }

    const hand = new THREE.Group();
    hand.position.y = -D.fore - 0.01;
    hand.scale.setScalar(D.hand);
    elbow.add(hand);

    const mitten = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.07, 6, 12), skinMat);
    mitten.scale.set(0.75, 1, 1.15);
    mitten.position.y = -0.06;
    hand.add(mitten);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 8), skinMat);
    thumb.position.set(-side * 0.004, -0.04, 0.032);
    thumb.rotation.x = 0.5;
    hand.add(thumb);

    shoulder.userData.elbow = elbow;
    shoulder.userData.hand = hand;
    return shoulder;
  }

  /**
   * Leg: hip → thigh → knee → shin → ankle → shoe
   */
  createLeg(side, pantsMat, shoeMat, whiteMat) {
    const D = this.dims;
    const hipJoint = new THREE.Group();

    hipJoint.add(new THREE.Mesh(jointBall(D.thighR), pantsMat));
    hipJoint.add(new THREE.Mesh(limbGeo(D.thighR, D.shinR * 1.1, D.thigh), pantsMat));

    const knee = new THREE.Group();
    knee.position.y = -D.thigh;
    hipJoint.add(knee);
    knee.add(new THREE.Mesh(jointBall(D.shinR * 1.1), pantsMat));
    knee.add(new THREE.Mesh(limbGeo(D.shinR * 1.05, D.shinR * 0.9, D.shin), pantsMat));

    const foot = new THREE.Group();
    foot.position.y = -D.shin;
    knee.add(foot);

    const L = D.shoeL;
    const W = D.shinR * 1.9;
    const upper = new THREE.Mesh(new RoundedBoxGeometry(W, D.foot * 0.95, L, 3, Math.min(W, D.foot) * 0.45), shoeMat);
    upper.position.set(0, -D.foot * 0.45, L * 0.22);
    foot.add(upper);
    const sole = new THREE.Mesh(new RoundedBoxGeometry(W * 1.06, D.foot * 0.3, L * 1.03, 2, D.foot * 0.12), whiteMat);
    sole.position.set(0, -D.foot * 0.86, L * 0.22);
    foot.add(sole);
    const ankle = new THREE.Mesh(limbGeo(D.shinR * 0.95, W * 0.5, D.foot * 0.5), shoeMat);
    foot.add(ankle);

    hipJoint.userData.knee = knee;
    hipJoint.userData.foot = foot;
    return hipJoint;
  }

  createAlgerianFlagPin(whiteMat) {
    const badge = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.05), decalMat({ color: 0xffffff }));
    badge.add(bg);

    const greenPart = new THREE.Mesh(new THREE.PlaneGeometry(0.0375, 0.05), decalMat({ color: 0x27ae60 }));
    greenPart.position.set(-0.0187, 0, 0.001);
    badge.add(greenPart);

    const redStar = new THREE.Mesh(new THREE.CircleGeometry(0.010, 8), decalMat({ color: 0xe74c3c }));
    redStar.position.set(0, 0, 0.002);
    badge.add(redStar);

    return badge;
  }

  createBackpack(colorHex) {
    const packGroup = new THREE.Group();
    const packMat = clothMat({ color: colorHex });

    const pack = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.34, 0.13, 3, 0.05), packMat);
    packGroup.add(pack);

    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.15, 0.06, 2, 0.025), clothMat({ color: 0x2c3e50 }));
    pocket.position.set(0, -0.07, -0.08);
    packGroup.add(pocket);

    // Shoulder straps
    [-1, 1].forEach(s => {
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 16, Math.PI * 0.9), clothMat({ color: 0x2c3e50 }));
      strap.rotation.set(0, Math.PI / 2, Math.PI * 0.55);
      strap.position.set(s * 0.09, 0.13, 0.12);
      packGroup.add(strap);
    });

    return packGroup;
  }

  setAction(actionName, duration = 1.8) {
    this.currentAction = actionName;
    this.actionTime = duration;
  }

  update(dt, movement = {}) {
    this.animTime += dt;
    const { isMoving = false, speedRatio = 1.0, isJumping = false } = movement;

    if (this.currentAction) {
      this.actionTime -= dt;
      if (this.actionTime <= 0) {
        this.currentAction = null;
      }
    }

    const joints = this.animJoints || (this.animJoints = [
      'hips', 'torso', 'head', 'leftArm', 'rightArm', 'leftElbow', 'rightElbow',
      'leftLeg', 'rightLeg', 'leftKnee', 'rightKnee', 'leftFoot', 'rightFoot'
    ].map(k => this.bones[k]).filter(Boolean));
    const prev = this.prevPose || (this.prevPose = joints.map(() => ({ rot: new THREE.Euler(), y: 0, init: false })));
    joints.forEach((b, i) => { prev[i].rot.copy(b.rotation); prev[i].y = b.position.y; });

    if (isJumping) {
      this.animateJump();
    } else if (isMoving) {
      this.animateRun(speedRatio);
    } else {
      this.animateIdle();
    }
    if (this.carrying && !isJumping && !this.currentAction) this.applyCarryPose();
    if (this.currentAction && (!isMoving || this.currentAction === 'spray')) this.animateGesture(this.currentAction);

    // Exponential smoothing toward the target pose removes snapping between states
    const k = 1 - Math.exp(-dt * 18);
    joints.forEach((b, i) => {
      const p = prev[i];
      if (!p.init) { p.init = true; return; }
      b.rotation.x = p.rot.x + (b.rotation.x - p.rot.x) * k;
      b.rotation.y = p.rot.y + (b.rotation.y - p.rot.y) * k;
      b.rotation.z = p.rot.z + (b.rotation.z - p.rot.z) * k;
      b.position.y = p.y + (b.position.y - p.y) * k;
    });
  }

  setLimbs(armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR) {
    const b = this.bones;
    b.leftArm.rotation.x = armL; b.rightArm.rotation.x = armR;
    b.leftElbow.rotation.x = elbowL; b.rightElbow.rotation.x = elbowR;
    b.leftLeg.rotation.x = legL; b.rightLeg.rotation.x = legR;
    b.leftKnee.rotation.x = kneeL; b.rightKnee.rotation.x = kneeR;
    // Keep feet roughly parallel to the ground
    b.leftFoot.rotation.x = -(legL + kneeL) * 0.7;
    b.rightFoot.rotation.x = -(legR + kneeR) * 0.7;
  }

  animateIdle() {
    const b = this.bones;
    const t = this.animTime * 1.9;
    // Breathing & gentle weight shift
    b.torso.position.y = this.torsoBaseY + Math.sin(t) * 0.004;
    b.torso.rotation.set(Math.sin(t) * 0.01, 0, Math.sin(t * 0.37) * 0.015);
    b.head.rotation.set(-Math.sin(t) * 0.01, Math.sin(t * 0.45) * 0.12, 0);
    b.hips.position.y = this.hipHeight;
    b.hips.rotation.set(0, 0, -Math.sin(t * 0.37) * 0.012);

    const sway = Math.sin(t) * 0.03;
    this.setLimbs(sway, -sway, -0.14, -0.14, 0, 0, 0.03, 0.03);
    b.leftArm.rotation.z = -0.07;
    b.rightArm.rotation.z = 0.07;
    b.leftLeg.rotation.z = -0.02;
    b.rightLeg.rotation.z = 0.02;
  }

  animateRun(speedRatio) {
    const b = this.bones;
    const sprint = speedRatio > 1.2;
    const freq = sprint ? 10.5 : 7.5;
    const p = this.animTime * freq;
    const A = (sprint ? 0.75 : 0.48) * this.strideScale;
    const kneeAmp = sprint ? 1.35 : 0.85;
    const s = Math.sin(p);
    const c = Math.cos(p);

    // Leg swing (positive = back); knee flexes while the leg swings forward
    const legL = s * A;
    const legR = -s * A;
    const kneeL = 0.06 + Math.max(0, -c) * kneeAmp * this.strideScale;
    const kneeR = 0.06 + Math.max(0, c) * kneeAmp * this.strideScale;
    const elbow = sprint ? -1.35 : -0.32;
    this.setLimbs(-s * A * 1.05, s * A * 1.05, elbow - Math.max(0, s) * 0.2, elbow - Math.max(0, -s) * 0.2, legL, legR, kneeL, kneeR);
    b.leftArm.rotation.z = -0.1;
    b.rightArm.rotation.z = 0.1;
    b.leftLeg.rotation.z = 0;
    b.rightLeg.rotation.z = 0;

    // Body: lean, counter-twist, vertical bob (highest when legs pass)
    b.torso.rotation.set(sprint ? 0.2 : 0.06, s * (sprint ? 0.14 : 0.08), 0);
    b.torso.position.y = this.torsoBaseY;
    b.hips.rotation.set(0, -s * 0.08, 0);
    b.hips.position.y = this.hipHeight - (sprint ? 0.045 : 0.02) + Math.abs(c) * (sprint ? 0.05 : 0.025);
    b.head.rotation.set(sprint ? -0.12 : -0.03, -b.torso.rotation.y * 0.6, 0);
  }

  animateJump() {
    const b = this.bones;
    b.torso.rotation.set(-0.1, 0, 0);
    this.setLimbs(-1.2, -1.2, -0.5, -0.5, -0.6, 0.15, 1.1, 0.5);
    b.leftArm.rotation.z = -0.45;
    b.rightArm.rotation.z = 0.45;
  }

  /** Upper-body gestures layered over idle (triggered via setAction) */
  animateGesture(action) {
    const b = this.bones;
    const t = this.animTime;
    if (action === 'wave') {
      const left = this.propHand === 'right' || this.role === 'elderly_citizen';
      const arm = left ? b.leftArm : b.rightArm;
      const s = left ? -1 : 1;
      arm.rotation.set(0, 0, s * (2.5 + Math.sin(t * 9) * 0.25));
      (left ? b.leftElbow : b.rightElbow).rotation.x = -0.25;
    } else if (action === 'talk') {
      b.rightArm.rotation.x = -0.35 + Math.sin(t * 3.1) * 0.12;
      b.rightElbow.rotation.x = -1.0 + Math.sin(t * 4.3) * 0.2;
      b.leftElbow.rotation.x = -0.4 + Math.sin(t * 2.7 + 1) * 0.15;
      b.head.rotation.x = Math.sin(t * 5) * 0.04;
    } else if (action === 'work' || action === 'plant') {
      b.torso.rotation.x = 0.35 + Math.sin(t * 4) * 0.08;
      b.rightArm.rotation.x = -0.6 + Math.sin(t * 4) * 0.4;
      b.leftArm.rotation.x = -0.5 + Math.sin(t * 4 + 0.5) * 0.3;
      b.rightElbow.rotation.x = -0.6;
      b.leftElbow.rotation.x = -0.6;
    } else if (action === 'pickup') {
      b.torso.rotation.x = 0.55;
      b.rightArm.rotation.x = -0.7;
      b.leftArm.rotation.x = -0.7;
      b.rightElbow.rotation.x = -0.2;
      b.leftElbow.rotation.x = -0.2;
      b.leftKnee.rotation.x = 0.35;
      b.rightKnee.rotation.x = 0.35;
    } else if (action === 'spray' || action === 'water') {
      // Both hands forward on the hose / extinguisher, small recoil wobble
      const w = Math.sin(t * 22) * 0.03;
      b.torso.rotation.x = 0.08;
      b.rightArm.rotation.set(-1.15 + w, 0, -0.18);
      b.leftArm.rotation.set(-1.0 - w, 0, 0.3);
      b.rightElbow.rotation.x = -0.35;
      b.leftElbow.rotation.x = -0.55;
    } else if (action === 'celebrate') {
      const j = Math.abs(Math.sin(t * 6)) * 0.25;
      b.leftArm.rotation.set(0, 0, -2.6 - j);
      b.rightArm.rotation.set(0, 0, 2.6 + j);
      b.leftElbow.rotation.x = -0.2;
      b.rightElbow.rotation.x = -0.2;
    }
  }

  /** Arms held in front of the chest while carrying a box / basket */
  applyCarryPose() {
    const b = this.bones;
    b.rightArm.rotation.set(-0.95, 0, 0.32);
    b.leftArm.rotation.set(-0.95, 0, -0.32);
    b.rightElbow.rotation.x = -0.75;
    b.leftElbow.rotation.x = -0.75;
  }
}
