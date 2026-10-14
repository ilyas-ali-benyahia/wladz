import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Shared GPU resources: every character with the same proportions / colours reuses the same geometry and materials
const GEO_CACHE = new Map();
const MAT_CACHE = new Map();
function cachedGeo(key, build) {
  if (!GEO_CACHE.has(key)) GEO_CACHE.set(key, build());
  return GEO_CACHE.get(key);
}
function cachedMat(params, build) {
  const key = JSON.stringify(params);
  if (!MAT_CACHE.has(key)) MAT_CACHE.set(key, build());
  return MAT_CACHE.get(key);
}

// Soft matte fabric / painted surfaces (lit, no plastic sheen)
function clothMat(params) {
  return cachedMat({ k: 'cloth', ...params }, () => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...params }));
}

// Small surface details (badges, stripes): lit like the body and offset to avoid z-fighting
function decalMat(params) {
  return cachedMat({ k: 'decal', ...params }, () => new THREE.MeshStandardMaterial({
    roughness: 0.6, metalness: 0, ...params,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  }));
}

// Capsule limb segment hanging down from its joint (origin at the top joint)
function limbGeo(radiusTop, radiusBottom, length) {
  return cachedGeo(`limb:${radiusTop.toFixed(4)}:${radiusBottom.toFixed(4)}:${length.toFixed(4)}`, () => buildLimbGeo(radiusTop, radiusBottom, length));
}
function buildLimbGeo(radiusTop, radiusBottom, length) {
  const geo = new THREE.CapsuleGeometry(1, length, 3, 12);
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
  return cachedGeo(`ball:${radius.toFixed(4)}`, () => new THREE.SphereGeometry(radius, 12, 8));
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
/**
 * Point on the head surface for the unit direction n: tapered jaw, flatter face and restrained features
 * (soft nose, gentle brow, shallow eye sockets). No drawn eyes or mouth: the INSIDE-like calm face.
 */
function headPoint(r, nx, ny, nz, out) {
  const t = jawTaper(ny);
  let z = nz * r * t * (nz > 0 ? FACE_FLAT : 1);
  if (nz > 0) {
    const g = (cx, cy, sx, sy) => Math.exp(-(((nx - cx) / sx) ** 2 + ((ny - cy) / sy) ** 2));
    const f = smooth(0.55, 0.95, nz);
    z += r * f * (0.075 * g(0, -0.12, 0.11, 0.17) + 0.022 * g(0, 0.2, 0.5, 0.07)
      - 0.014 * (g(-0.3, 0.08, 0.18, 0.11) + g(0.3, 0.08, 0.18, 0.11)));
  }
  return out.set(nx * r * t, ny * r, z);
}

/**
 * Sphere-topology surface around the head. offsetFn(nx, ny, nz, azimuth) returns how far (in head radii) the
 * surface sits outside the skin; negative values tuck it under the skin and those triangles are dropped.
 * Used for the head itself, sculpted hairstyles, hijab hoods and beards: everything follows the same skull.
 */
function makeHeadShell(r, key, offsetFn) {
  return cachedGeo(`shell:${key}:${r}`, () => {
    let geo = offsetFn ? new THREE.SphereGeometry(r, 72, 54) : new THREE.SphereGeometry(r, 44, 32);
    geo.deleteAttribute('uv');
    geo.deleteAttribute('normal');
    geo = mergeVertices(geo); // weld the UV seam and poles so shading stays smooth
    const p = geo.attributes.position;
    const P = new THREE.Vector3();
    const dirs = [];
    const offs = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const d = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).divideScalar(r);
      dirs.push(d);
      offs[i] = offsetFn ? offsetFn(d.x, d.y, d.z, Math.atan2(d.x, d.z)) : 0;
    }
    const place = (i, d, off) => {
      headPoint(r, d.x, d.y, d.z, P);
      p.setXYZ(i, P.x + d.x * off * r, P.y + d.y * off * r, P.z + d.z * off * r);
    };

    if (!offsetFn) {
      dirs.forEach((d, i) => place(i, d, 0));
    } else {
      // Clean edges: every outside vertex next to the surface is slid onto the exact contour (offset = 0),
      // so hairlines, the face opening and beard lines are smooth curves instead of torn intersections.
      const src = geo.index.array;
      const nbr = Array.from({ length: p.count }, () => new Set());
      for (let i = 0; i < src.length; i += 3) {
        const a = src[i], b = src[i + 1], c = src[i + 2];
        nbr[a].add(b).add(c); nbr[b].add(a).add(c); nbr[c].add(a).add(b);
      }
      const inside = (i) => offs[i] > 0;
      const keep = new Uint8Array(p.count);
      const tmp = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        if (inside(i)) { keep[i] = 1; place(i, dirs[i], offs[i]); continue; }
        let best = -1;
        nbr[i].forEach(j => { if (inside(j) && (best < 0 || offs[j] > offs[best])) best = j; });
        if (best < 0) { place(i, dirs[i], 0); continue; }
        // Bisect along the arc towards the inside neighbour to find where the surface leaves the skin
        let lo = 0, hi = 1;
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          tmp.copy(dirs[i]).lerp(dirs[best], mid).normalize();
          if (offsetFn(tmp.x, tmp.y, tmp.z, Math.atan2(tmp.x, tmp.z)) > 0) hi = mid; else lo = mid;
        }
        tmp.copy(dirs[i]).lerp(dirs[best], hi).normalize();
        dirs[i].copy(tmp);
        place(i, tmp, 0.004);
        keep[i] = 2;
      }
      const idx = [];
      for (let i = 0; i < src.length; i += 3) {
        const a = src[i], b = src[i + 1], c = src[i + 2];
        if (keep[a] && keep[b] && keep[c] && (keep[a] === 1 || keep[b] === 1 || keep[c] === 1)) idx.push(a, b, c);
      }
      geo.setIndex(idx);
    }
    geo.computeVertexNormals();
    return geo;
  });
}
function makeHeadGeometry(r) {
  return makeHeadShell(r, 'skin', null);
}

// Hairline height (unit-sphere y) around the head, by |azimuth| from the forehead (0) to the nape (PI)
const HAIRLINE = [[0, 0.46], [0.8, 0.4], [1.25, 0.22], [1.6, 0.24], [2.0, 0.04], [2.5, -0.38], [Math.PI, -0.5]];
function hairlineAt(a) {
  for (let i = 1; i < HAIRLINE.length; i++) {
    const [a1, y1] = HAIRLINE[i];
    if (a <= a1) {
      const [a0, y0] = HAIRLINE[i - 1];
      const t = (a - a0) / (a1 - a0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return HAIRLINE[HAIRLINE.length - 1][1];
}

// Modelled hairstyles: volume (head radii) on top of the scalp, with a soft natural hairline
const HAIR_STYLES = {
  crop: { base: 0.035, top: 0.04 },      // uniformed staff
  short: { base: 0.05, top: 0.07 },      // everyday
  sidepart: { base: 0.055, top: 0.1 },   // swept fringe
  wavy: { base: 0.065, top: 0.13 },      // fuller, soft waves
  receding: { base: 0.045, top: 0.03 }   // elders: sides and back only
};
function hairOffset(style) {
  const S = HAIR_STYLES[style] || HAIR_STYLES.short;
  return (nx, ny, nz, a) => {
    const A = Math.abs(a);
    let yh = hairlineAt(A);
    if (style === 'receding') yh += 0.2 * smooth(1.3, 0, A);
    let m = smooth(yh - 0.07, yh + 0.07, ny);
    if (style === 'receding') m *= smooth(0.95, 1.45, A) * (1 - smooth(0.42, 0.66, ny));
    if (m < 0.02) return -0.04;
    const top = smooth(0.2, 1, ny);
    let t = S.base + S.top * top;
    if (style === 'sidepart') t += 0.085 * smooth(0.25, 0.75, nz) * smooth(0.15, 0.6, ny) * (0.55 + 0.45 * Math.tanh(nx * 3));
    if (style === 'wavy') t += 0.02 * Math.sin(a * 9) * Math.sin(ny * 7) * top;
    return t * m - 0.04 * (1 - m);
  };
}

// Hijab hood: closed around head, ears, chin and neck; soft oval opening for the face
function hijabOffset(nx, ny, nz) {
  const fx = nx / 0.6, fy = (ny + 0.06) / 0.72;
  const d = Math.sqrt(fx * fx + fy * fy);
  const open = smooth(0.0, 0.35, nz) * (1 - smooth(0.88, 1.06, d));
  if (open > 0.98) return -0.05;
  const t = 0.05 + 0.07 * smooth(1.0, 1.3, d) + 0.04 * smooth(0.3, 1, ny);
  return t * (1 - open) - 0.05 * open;
}

// Full beard following the jaw (respected elders)
const BEARD_LINE = [[0, -0.56], [0.7, -0.52], [1.2, -0.32], [1.5, -0.08], [Math.PI, -0.08]];
function beardOffset(nx, ny, nz) {
  const A = Math.abs(Math.atan2(nx, nz));
  let yb = BEARD_LINE[BEARD_LINE.length - 1][1];
  for (let i = 1; i < BEARD_LINE.length; i++) {
    if (A <= BEARD_LINE[i][0]) { const [a0, y0] = BEARD_LINE[i - 1], [a1, y1] = BEARD_LINE[i]; yb = y0 + (y1 - y0) * smooth(a0, a1, A); break; }
  }
  const m = smooth(yb + 0.06, yb - 0.06, ny) * smooth(1.75, 1.45, A);
  if (m < 0.02) return -0.04;
  const t = 0.025 + 0.025 * smooth(0.2, 0.9, nz) + 0.045 * smooth(-0.65, -0.95, ny) * smooth(0.3, 0.9, nz);
  return t * m - 0.04 * (1 - m);
}

/** Sculpted shoe: capsule stretched along the foot, flat sole, slightly narrower toe */
function shoeGeo(W, H, L) {
  return cachedGeo(`shoe:${W.toFixed(4)}:${H.toFixed(4)}:${L.toFixed(4)}`, () => {
    const g = new THREE.CapsuleGeometry(0.5, 1, 4, 12);
    g.rotateX(Math.PI / 2); // length along z, z in [-1, 1]
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i);
      let y = p.getY(i) * H;
      if (y < -0.32 * H) y = -0.32 * H; // flat sole
      const toe = 1 - 0.14 * Math.max(0, z) ** 2;
      p.setXYZ(i, p.getX(i) * W * toe, y, z * L / 2);
    }
    g.computeVertexNormals();
    return g;
  });
}

const LONG_SLEEVE_ROLES = ['police_officer', 'police_inspector', 'firefighter', 'imam', 'elderly_citizen', 'historian', 'artisan', 'doctor', 'librarian'];
const ROBE_ROLES = { imam: 0.95, elderly_citizen: 0.95, doctor: 0.62 };
// Hijab colours for the girl heroes (matched to their outfits)
const HERO_HIJAB = { girl_yellow: 0xd9667a, sara: 0xd9667a, girl_green: 0x1f7a5a, rayan: 0x1f7a5a };

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

    const isFemale = (isNPC && this.options.gender === 'female') || /^girl|^sara|^rayan/.test(type);
    if (isNPC && !isFemale && (role === 'elderly_citizen' || role === 'imam')) hairColor = role === 'imam' ? 0x8f8f8f : 0xb8b8b8;
    if (isNPC && !isFemale && role === 'historian') hairColor = 0x5e5a56;

    const skinMat = cachedMat({ k: 'skin', skinColor }, () => new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.78, metalness: 0 }));
    const hairMat = cachedMat({ k: 'hair', hairColor }, () => new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.62, metalness: 0 }));
    const shirtMat = clothMat({ color: shirtColor });
    const pantsMat = clothMat({ color: pantsColor });
    const shoeMat = clothMat({ color: shoeColor, roughness: 0.55 });
    const whiteMat = clothMat({ color: 0xffffff });
    const darkMat = clothMat({ color: 0x1a1a1a });

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
    const neck = new THREE.Mesh(cachedGeo(`neck:${D.neck}`, () => new THREE.CylinderGeometry(D.neck * 0.62, D.neck * 0.72, D.neck + 0.05, 16)), skinMat);
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
    const shellOnHead = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(1.0, SY, 1.0);
      headGroup.add(m);
      return m;
    };
    shellOnHead(makeHeadGeometry(headRadius), skinMat);

    // Ears (hidden under the hijab for women and girls)
    if (!isFemale) {
      const earGeo = cachedGeo('ear', () => new THREE.SphereGeometry(0.06, 14, 10));
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(earGeo, skinMat);
        ear.scale.set(0.35, 0.85, 0.6);
        ear.position.set(s * headRadius * 0.95, -0.01, -0.02);
        headGroup.add(ear);
      });
    }

    // Hair, hijab and beards are sculpted shells that follow the same skull (no hats, no loose primitives)
    if (isFemale) {
      const hijabColor = this.options.hijabColor ?? HERO_HIJAB[type] ?? 0x7a5c7e;
      this.buildHijab(headGroup, headRadius, clothMat({ color: hijabColor }), torso, SY);
    } else {
      shellOnHead(makeHeadShell(headRadius, `hair-${this.chooseHairStyle(type, role)}`, hairOffset(this.chooseHairStyle(type, role))), hairMat);
      if (isNPC && (role === 'imam' || role === 'elderly_citizen')) {
        const beardColor = role === 'imam' ? 0x8f8f8f : 0xaaaaaa;
        shellOnHead(makeHeadShell(headRadius, 'beard', beardOffset), cachedMat({ k: 'hair', hairColor: beardColor }, () => new THREE.MeshStandardMaterial({ color: beardColor, roughness: 0.7 })));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Arms & legs
    // ─────────────────────────────────────────────────────────────
    const longSleeves = type === 'boy_purple' || LONG_SLEEVE_ROLES.includes(role) || isFemale;
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

    // Soles exactly on the ground: measure the shoes in the rest pose and lift the hips by the gap
    this.group.updateMatrixWorld(true);
    const soleBox = new THREE.Box3();
    [this.bones.leftFoot, this.bones.rightFoot].forEach(f => soleBox.expandByObject(f, true));
    if (isFinite(soleBox.min.y)) {
      this.hipHeight -= soleBox.min.y;
      hips.position.y = this.hipHeight;
    }

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

  /**
   * Hijab: one smooth hood that follows the skull (covers hair, ears, chin and neck, oval face opening),
   * plus a soft drape that falls from under the chin over the shoulders. The drape belongs to the torso,
   * so head turns never tear it away from the body.
   */
  buildHijab(headGroup, headRadius, mat, torso, SY) {
    const hood = new THREE.Mesh(makeHeadShell(headRadius, 'hijab', hijabOffset), mat);
    hood.scale.set(1.0, SY, 1.0);
    headGroup.add(hood);

    const D = this.dims;
    const H = D.torso;
    const headY = H + D.neck * 0.8 + D.headR * 0.95;
    const edge = D.shoulderX + D.upperR * 1.1;
    const drapeGeo = cachedGeo(`drape:${D.headR}:${H}:${edge.toFixed(4)}`, () => new THREE.LatheGeometry([
      new THREE.Vector2(D.headR * 0.55, headY - D.headR * 0.72),
      new THREE.Vector2(D.headR * 0.7, headY - D.headR * 1.05),
      new THREE.Vector2(D.headR * 0.86, H + D.neck * 0.3),
      new THREE.Vector2(edge * 0.66, H * 0.98),
      new THREE.Vector2(edge * 0.86, H * 0.9),
      new THREE.Vector2(edge * 0.96, H * 0.8),
      new THREE.Vector2(edge * 1.0, H * 0.68),
      new THREE.Vector2(edge * 1.02, H * 0.64)
    ], 40));
    const drape = new THREE.Mesh(drapeGeo, clothMat({ color: mat.color.getHex(), side: THREE.DoubleSide }));
    drape.scale.z = (D.chestD * 1.35) / edge;
    torso.add(drape);
  }

  /** Hairstyle per character: uniforms keep it short, elders recede, everyone else varies but stays stable */
  chooseHairStyle(type, role) {
    if (type === 'boy_purple' || type === 'boy') return 'sidepart';
    if (['police_officer', 'police_inspector', 'firefighter', 'imam'].includes(role)) return 'crop';
    if (role === 'elderly_citizen' || role === 'historian') return 'receding';
    if (role === 'artisan') return 'wavy';
    const seed = ((this.options.primaryColor || 0) + (this.options.skinColor || 0)) >>> 0;
    return ['short', 'sidepart', 'wavy', 'short'][seed % 4];
  }

  /**
   * Arm: shoulder → upper arm → elbow → forearm → hand (palm, fingers, thumb)
   */
  createArm(side, skinMat, shirtMat, longSleeves) {
    const D = this.dims;
    const shoulder = new THREE.Group();

    const deltoid = new THREE.Mesh(jointBall(D.upperR * 1.0), shirtMat);
    deltoid.scale.set(0.95, 0.85, 1.0);
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

    const mitten = new THREE.Mesh(cachedGeo('mitten', () => new THREE.CapsuleGeometry(0.03, 0.07, 3, 10)), skinMat);
    mitten.scale.set(0.75, 1, 1.15);
    mitten.position.y = -0.06;
    hand.add(mitten);
    const thumb = new THREE.Mesh(cachedGeo('thumb', () => new THREE.CapsuleGeometry(0.012, 0.03, 2, 6)), skinMat);
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
    const upper = new THREE.Mesh(shoeGeo(W, D.foot * 1.05, L), shoeMat);
    upper.position.set(0, -D.foot * 0.45, L * 0.22);
    foot.add(upper);
    const sole = new THREE.Mesh(shoeGeo(W * 1.06, D.foot * 0.36, L * 1.03), whiteMat);
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
