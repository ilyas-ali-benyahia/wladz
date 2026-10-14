import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * CartoonNatureGenerator: Creates rich Stylized Cartoon trees, palms, bushes and flowers
 * based on the reference art style (City Island 5 + stylized cartoon nature).
 * Foliage uses shared, organically displaced blob geometry with baked vertex shading
 * (darker underside, sunlit crown) instead of perfect spheres; palm fronds are curved,
 * folded, feathered ribbons instead of flat boxes.
 */

// Cheap deterministic smooth noise (sum of sines) for organic displacement
function blobNoise(x, y, z, seed) {
  return (
    Math.sin(x * 3.1 + seed) * Math.sin(y * 2.7 + seed * 1.7) * Math.sin(z * 3.3 + seed * 0.6) * 0.6 +
    Math.sin(x * 7.3 + seed * 2.1) * Math.sin(y * 6.1 + seed) * Math.sin(z * 6.7 + seed * 1.3) * 0.25
  );
}

/** Unit-radius lumpy foliage blob with baked AO-style vertex colors */
function createBlobGeometry(seed, detail = 3) {
  let geo = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = blobNoise(v.x, v.y, v.z, seed);
    const r = 1 + n * 0.16;
    // Slightly flattened bottom like real canopies
    const flatten = v.y < -0.3 ? 0.85 : 1;
    pos.setXYZ(i, v.x * r, v.y * r * flatten, v.z * r);

    // Underside darker (ambient occlusion), crown brighter, noise-based leaf clump variation
    const ao = THREE.MathUtils.clamp(0.62 + (v.y + 1) * 0.22, 0.6, 1.08);
    const tint = 1 + n * 0.18;
    colors[i * 3] = ao * tint;
    colors[i * 3 + 1] = ao * tint;
    colors[i * 3 + 2] = ao * (0.95 + n * 0.1);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Curved, V-folded, feathered palm frond (length along +X, droops downward) */
function createFrondGeometry() {
  const segs = 18;
  const length = 3.6;
  const positions = [];
  const colors = [];
  const indices = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = t * length;
    const y = Math.sin(t * Math.PI * 0.55) * 0.9 - t * t * 1.9; // arch up then droop
    const taper = Math.sin(Math.min(1, t * 1.15) * Math.PI) * 0.55 + 0.04;
    // Feathered leaflet edge: alternate width so the outline reads as separate leaflets
    const w = taper * (i % 2 === 0 ? 1.0 : 0.62);
    const fold = 0.16 * taper; // spine raised above edges (V cross-section)
    positions.push(x, y - fold, -w, x, y + fold, 0, x, y - fold, w);
    const shade = 0.75 + t * 0.3;
    colors.push(shade * 0.9, shade * 0.9, shade * 0.9, shade, shade, shade, shade * 0.9, shade * 0.9, shade * 0.9);
    if (i < segs) {
      const a = i * 3;
      const b = (i + 1) * 3;
      indices.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export class CartoonNatureGenerator {
  constructor(scene) {
    this.scene = scene;
    this.initMaterials();
    this.initGeometries();
  }

  initMaterials() {
    const leaf = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, vertexColors: true });

    // Foliage palettes: natural, slightly muted greens (no neon) + warm autumn
    this.foliageGreen = leaf(0x5a9e3a);
    this.foliageLight = leaf(0x86b84e);
    this.foliageDark = leaf(0x3f7d34);
    this.foliageAutumn = leaf(0xd9822b);
    this.foliageCyan = leaf(0x3fa58c);
    // Tonal variants so neighbouring trees never look copy-pasted
    this.foliageVariants = {
      green: [this.foliageGreen, leaf(0x4f9440), leaf(0x67a83f)],
      light: [this.foliageLight, leaf(0x7aae48), leaf(0x93c158)],
      dark: [this.foliageDark, leaf(0x47883a), leaf(0x37712f)],
      autumn: [this.foliageAutumn, leaf(0xc96f27), leaf(0xe0a03a)]
    };

    // Trunks
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c3d, roughness: 0.95, metalness: 0 });
    this.palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e58, roughness: 0.95, metalness: 0 });
    this.palmLeafMat = new THREE.MeshStandardMaterial({
      color: 0x4f9a3c, roughness: 0.85, metalness: 0, vertexColors: true, side: THREE.DoubleSide
    });

    // Flowers
    this.flowerYellow = new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.7 });
    this.flowerPink = new THREE.MeshStandardMaterial({ color: 0xe86fb5, roughness: 0.7 });
    this.flowerWhite = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, roughness: 0.7 });
    this.potMat = new THREE.MeshStandardMaterial({ color: 0xb8582a, roughness: 0.9 });
  }

  initGeometries() {
    // Shared geometries (built once, reused by every tree/bush)
    this.blobGeos = [createBlobGeometry(1.3), createBlobGeometry(4.7), createBlobGeometry(8.1)];
    this.smallBlobGeo = createBlobGeometry(2.9, 2);
    this.frondGeo = createFrondGeometry();
    this.flowerGeo = new THREE.SphereGeometry(1, 8, 6);
  }

  pickBlob() {
    return this.blobGeos[Math.floor(Math.random() * this.blobGeos.length)];
  }

  /**
   * Creates a lush, multi-lobed fluffy cartoon tree
   */
  createCartoonTree(x, z, scale = 1.0, palette = 'green') {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    const variants = this.foliageVariants[palette] || this.foliageVariants.green;
    const foliageMat = variants[Math.floor(Math.random() * variants.length)];

    // 1. Sculpted trunk (thicker at base, gentle flare, warm wood)
    const trunkH = 3.2 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.46 * scale, trunkH, 14, 4), this.trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.08;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Root flare
    const roots = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.7 * scale, 0.4 * scale, 14), this.trunkMat);
    roots.position.y = 0.2 * scale;
    roots.receiveShadow = true;
    group.add(roots);

    // Branches reaching into the canopy (gives a real tree silhouette from below)
    for (let b = 0; b < 3; b++) {
      const ang = (b / 3) * Math.PI * 2 + Math.random() * 0.6;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.16 * scale, 1.6 * scale, 8), this.trunkMat);
      branch.position.set(Math.cos(ang) * 0.35 * scale, trunkH * 0.85, Math.sin(ang) * 0.35 * scale);
      branch.rotation.set(Math.sin(ang) * 0.7, 0, -Math.cos(ang) * 0.7);
      branch.castShadow = true;
      group.add(branch);
    }

    // 2. Organic canopy built from overlapping lumpy foliage clumps
    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = trunkH * 0.95;

    const clusters = [
      { r: 1.8, ox: 0,    oy: 1.2,  oz: 0 },
      { r: 1.5, ox: -1.0, oy: 0.4,  oz: 0.6 },
      { r: 1.6, ox: 1.1,  oy: 0.5,  oz: -0.5 },
      { r: 1.4, ox: 0.5,  oy: 0.3,  oz: 1.1 },
      { r: 1.5, ox: -0.6, oy: 0.4,  oz: -1.0 },
      { r: 1.2, ox: 0,    oy: 2.2,  oz: 0.2 } // Top crown
    ];

    clusters.forEach(c => {
      const puff = new THREE.Mesh(this.pickBlob(), foliageMat);
      const r = c.r * scale * (0.92 + Math.random() * 0.16);
      puff.scale.set(r, r * (0.88 + Math.random() * 0.12), r);
      puff.rotation.set(Math.random() * 6.28, Math.random() * 6.28, 0);
      puff.position.set(c.ox * scale, c.oy * scale, c.oz * scale);
      puff.castShadow = true;
      puff.receiveShadow = true;
      canopyGroup.add(puff);
    });

    group.add(canopyGroup);
    this.scene.add(group);
    return group;
  }

  /**
   * Creates an authentic Stylized Algerian Date Palm
   */
  createAlgerianPalm(x, z, scale = 1.0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    const palmHeight = 6.2 * scale;

    // Segmented / ribbed palm trunk with gentle organic lean
    const segments = 6;
    let currentY = 0;
    const segHeight = palmHeight / segments;
    let topX = 0;
    let topZ = 0;

    for (let s = 0; s < segments; s++) {
      const botR = (0.50 - s * 0.03) * scale;
      const topR = (0.44 - s * 0.03) * scale;
      const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(topR, botR, segHeight * 1.04, 14), this.palmTrunkMat);
      topX = Math.sin(s * 0.3) * 0.12 * scale;
      topZ = Math.cos(s * 0.3) * 0.08 * scale;
      segMesh.position.set(topX, currentY + segHeight / 2, topZ);
      segMesh.rotation.z = 0.04 * s;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      group.add(segMesh);

      // Bark collar between segments
      const ring = new THREE.Mesh(new THREE.TorusGeometry(botR * 1.02, 0.05 * scale, 8, 18), this.trunkMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(topX, currentY, topZ);
      group.add(ring);

      currentY += segHeight;
    }

    // Crown of arching, folded fronds in two tiers (lower ones droop more)
    const crownY = palmHeight;
    const numFronds = 12;
    for (let i = 0; i < numFronds; i++) {
      const lower = i % 2 === 1;
      const ang = (i / numFronds) * Math.PI * 2 + (lower ? 0.25 : 0);
      const frondGroup = new THREE.Group();
      frondGroup.position.set(topX, crownY - (lower ? 0.15 : 0), topZ);
      frondGroup.rotation.y = ang;

      const frond = new THREE.Mesh(this.frondGeo, this.palmLeafMat);
      const fs = scale * (0.85 + Math.random() * 0.25);
      frond.scale.set(fs, fs, fs);
      frond.rotation.z = lower ? -0.35 : 0.05;
      frond.rotation.x = (Math.random() - 0.5) * 0.3;
      frond.castShadow = true;
      frondGroup.add(frond);

      group.add(frondGroup);
    }

    // Crown heart (hides the frond roots)
    const heart = new THREE.Mesh(this.smallBlobGeo, this.palmLeafMat);
    heart.scale.setScalar(0.42 * scale);
    heart.position.set(topX, crownY + 0.05, topZ);
    group.add(heart);

    // Dates clusters hanging under the crown
    const dateMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.6 });
    for (let d = 0; d < 3; d++) {
      const dAng = (d / 3) * Math.PI * 2 + 0.4;
      const cluster = new THREE.Mesh(this.smallBlobGeo, dateMat);
      cluster.scale.set(0.3 * scale, 0.4 * scale, 0.3 * scale);
      cluster.position.set(topX + Math.cos(dAng) * 0.5 * scale, crownY - 0.45 * scale, topZ + Math.sin(dAng) * 0.5 * scale);
      group.add(cluster);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Creates round stylized flowering bushes (like around the monument in reference)
   */
  createCartoonBush(x, z, scale = 1.0, colorType = 'green') {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    let mat = this.foliageVariants.green[Math.floor(Math.random() * 3)];
    if (colorType === 'autumn') mat = this.foliageAutumn;
    if (colorType === 'cyan') mat = this.foliageCyan;

    const lobes = [
      { r: 0.75, x: 0, y: 0.6, z: 0 },
      { r: 0.55, x: -0.45, y: 0.45, z: 0.2 },
      { r: 0.55, x: 0.45, y: 0.43, z: -0.2 },
      { r: 0.45, x: 0.1, y: 0.4, z: 0.5 }
    ];
    lobes.forEach(l => {
      const p = new THREE.Mesh(this.pickBlob(), mat);
      p.scale.set(l.r * scale, l.r * scale * 0.9, l.r * scale);
      p.rotation.y = Math.random() * 6.28;
      p.position.set(l.x * scale, l.y * scale, l.z * scale);
      p.castShadow = true;
      p.receiveShadow = true;
      group.add(p);
    });

    // Small flowers sitting on the surface
    const flowerMats = [this.flowerYellow, this.flowerPink, this.flowerWhite];
    for (let f = 0; f < 7; f++) {
      const fl = new THREE.Mesh(this.flowerGeo, flowerMats[f % flowerMats.length]);
      fl.scale.setScalar(0.08 * scale);
      const fa = f * 0.9;
      fl.position.set(Math.cos(fa) * 0.68 * scale, 0.65 * scale + (f % 3) * 0.14 * scale, Math.sin(fa) * 0.68 * scale);
      group.add(fl);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Potted decorative plant for sidewalks and shop fronts
   */
  createPottedPlant(x, z, scale = 1.0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Terracotta plant pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.25 * scale, 0.6 * scale, 20), this.potMat);
    pot.position.y = 0.3 * scale;
    pot.castShadow = true;
    pot.receiveShadow = true;
    group.add(pot);

    // Rounded rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36 * scale, 0.045 * scale, 8, 24), this.potMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.58 * scale;
    group.add(rim);

    // Organic shrub ball
    const bush = new THREE.Mesh(this.pickBlob(), this.foliageLight);
    bush.scale.setScalar(0.44 * scale);
    bush.rotation.y = Math.random() * 6.28;
    bush.position.y = 0.92 * scale;
    bush.castShadow = true;
    group.add(bush);

    this.scene.add(group);
    return group;
  }
}
