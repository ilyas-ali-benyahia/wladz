import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Soft matte fabric / painted surfaces (lit, no plastic sheen)
function clothMat(params) {
  return new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...params });
}

// Small surface details (face, badges, stripes): lit like the body and offset to avoid z-fighting
function decalMat(params) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.6, metalness: 0, ...params,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
}

/**
 * CharacterModel: Premium Stylized Cartoon 3D Characters
 * - Completely natural, cute cartoon children (5-7 years old) WITHOUT helmets or skateboards!
 * - Beautiful styled 3D hair for each hero (Amin, Rayan, Sara)
 * - Clear, bright, open cartoon face with big glossy eyes, cheerful smile & rosy cheeks
 * - Soft rounded limbs & classic cute cartoon sneakers
 * - Natural walking and running child animations
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

    // ─────────────────────────────────────────────────────────────
    // 1. Color Palettes (Rich, harmonious, child-friendly colors)
    // ─────────────────────────────────────────────────────────────
    let skinColor = 0xf3c7a5;        // Warm North African glowing child skin
    let hairColor = 0x3d2314;        // Dark chocolate brown
    let shirtColor = 0x7c3aed;       // Vibrant purple jacket
    let pantsColor = 0x242b35;       // Navy pants
    let shoeColor = 0x0984e3;        // Bright blue sneakers
    let eyeColor = 0x4a2e18;         // Chocolate brown eyes
    let collarColor = 0xffffff;

    if (type === 'girl_yellow' || type === 'sara') {
      skinColor = 0xf5cbab;
      hairColor = 0x4a2c1d;         // Rich chestnut brown
      shirtColor = 0xf1c40f;        // Sunny yellow polo
      collarColor = 0xe67e22;       // Orange collar
      pantsColor = 0x34495e;        // Denim navy
      shoeColor = 0xe84393;         // Pink sneakers
      eyeColor = 0x3e2723;          // Hazel brown eyes
    } else if (type === 'girl_green' || type === 'rayan') {
      skinColor = 0xf2c3a0;
      hairColor = 0x8b3a1a;         // Warm auburn
      shirtColor = 0x27ae60;        // Nature green shirt
      collarColor = 0xffffff;
      pantsColor = 0x2980b9;        // Bright blue pants
      shoeColor = 0xf39c12;         // Yellow/orange sneakers
      eyeColor = 0x1b5e20;          // Forest green eyes
    } else if (isNPC) {
      skinColor = this.options.skinColor || 0xf0cbb0;
      shirtColor = this.options.primaryColor || 0x27ae60;
      pantsColor = this.options.secondaryColor || 0x2c3e50;
      hairColor = this.options.hairColor || 0x2c1d11;
      eyeColor = 0x2d1f14;
    }

    // Smooth PBR materials: satin skin, soft hair sheen, matte fabrics
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.62, metalness: 0 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5, metalness: 0 });
    const shirtMat = clothMat({ color: shirtColor });
    const pantsMat = clothMat({ color: pantsColor });
    const shoeMat = clothMat({ color: shoeColor, roughness: 0.55 });
    const whiteMat = clothMat({ color: 0xffffff });
    const darkMat = clothMat({ color: 0x1a1a1a });
    const cheekMat = decalMat({ color: 0xff8a80, transparent: true, opacity: 0.35, depthWrite: false });
    const eyeIrisMat = decalMat({ color: eyeColor, roughness: 0.25 });

    // ─────────────────────────────────────────────────────────────
    // 2. Hip / Root Pivot (Soft rounded chibi proportions)
    // ─────────────────────────────────────────────────────────────
    const hips = new THREE.Group();
    const hipHeight = isNPC ? 1.05 : 0.82;
    hips.position.y = hipHeight;
    this.hipHeight = hipHeight;
    this.group.add(hips);
    this.bones.hips = hips;

    // Pelvis (smooth tapered waistband)
    const pelvis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.19, 0.18, 24),
      pantsMat
    );
    pelvis.castShadow = true;
    hips.add(pelvis);

    // Belt / Waistband
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.04, 24),
      darkMat
    );
    belt.position.y = 0.08;
    hips.add(belt);

    // ─────────────────────────────────────────────────────────────
    // 3. Torso (Soft rounded chest & cute child shirt/jacket)
    // ─────────────────────────────────────────────────────────────
    const torso = new THREE.Group();
    torso.position.y = 0.10;
    hips.add(torso);
    this.bones.torso = torso;

    const torsoH = isNPC ? 0.65 : 0.46;
    const torsoMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, torsoH, 24),
      shirtMat
    );
    torsoMesh.position.y = torsoH / 2;
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Rounded shoulder curves
    const shoulderCaps = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 18),
      shirtMat
    );
    shoulderCaps.scale.set(1.05, 0.4, 0.85);
    shoulderCaps.position.y = torsoH - 0.04;
    torso.add(shoulderCaps);

    // Collar / Neckline detail
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.035, 10, 24),
      clothMat({ color: collarColor })
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, torsoH + 0.02, 0);
    torso.add(collar);

    // Sporty zipper for Boy
    if (type === 'boy_purple' || type === 'boy') {
      const zip = new THREE.Mesh(
        new THREE.PlaneGeometry(0.035, torsoH - 0.06),
        decalMat({ color: 0xffffff })
      );
      zip.position.set(0, torsoH / 2, 0.23);
      torso.add(zip);

      [-0.23, 0.23].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.025, torsoH * 0.7), decalMat({ color: 0xffffff }));
        stripe.position.set(sx, torsoH / 2 + 0.03, 0.06);
        stripe.rotation.y = sx > 0 ? Math.PI / 3 : -Math.PI / 3;
        torso.add(stripe);
      });
    }

    // Algerian Flag Pin Badge on chest
    const flagBadge = this.createAlgerianFlagPin(whiteMat);
    flagBadge.position.set(0.11, torsoH * 0.72, 0.22);
    flagBadge.rotation.y = 0.2;
    torso.add(flagBadge);

    // Cute student backpack for player heroes
    if (!isNPC) {
      const backpack = this.createBackpack(type === 'girl_yellow' ? 0xe74c3c : 0xd35400);
      backpack.position.set(0, torsoH * 0.52, -0.19);
      torso.add(backpack);
    } else {
      // NPC Role Uniform Accessories
      const role = this.options.npcRole;
      if (role === 'police_officer') {
        // Gold Shield Badge
        const badge = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 5), decalMat({ color: 0xf1c40f }));
        badge.position.set(-0.11, torsoH * 0.72, 0.22);
        badge.rotation.x = Math.PI;
        torso.add(badge);

        // Black necktie
        const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.28), darkMat);
        tie.position.set(0, torsoH * 0.58, 0.23);
        torso.add(tie);

        // Shoulder Radio Mic
        const radio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), darkMat);
        radio.position.set(-0.20, torsoH * 0.88, 0.05);
        torso.add(radio);
      } else if (role === 'firefighter') {
        // High-vis reflective safety bands
        const hiVisMat = decalMat({ color: 0xf1c40f });
        const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 24), hiVisMat);
        band1.position.set(0, torsoH * 0.65, 0);
        torso.add(band1);

        const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 24), hiVisMat);
        band2.position.set(0, torsoH * 0.28, 0);
        torso.add(band2);
      } else if (role === 'doctor') {
        // Stethoscope around neck
        const stethMat = clothMat({ color: 0x34495e });
        const stethRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 10, 26, Math.PI * 1.3), stethMat);
        stethRing.rotation.x = Math.PI / 2.3;
        stethRing.position.set(0, torsoH * 0.88, 0.06);
        torso.add(stethRing);

        const stethDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 8), decalMat({ color: 0xbdc3c7 }));
        stethDisc.position.set(0.06, torsoH * 0.45, 0.23);
        torso.add(stethDisc);
      } else if (role === 'artisan') {
        // Traditional Embroidered Vest Buttons
        const goldDot = decalMat({ color: 0xf1c40f });
        for (let b = 0; b < 3; b++) {
          const button = new THREE.Mesh(new THREE.CircleGeometry(0.02, 6), goldDot);
          button.position.set(0, torsoH * (0.35 + b * 0.18), 0.23);
          torso.add(button);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Head & Face (Clean, Open, Smiling, Beautiful!)
    // ─────────────────────────────────────────────────────────────
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.10, 0.12, 20),
      skinMat
    );
    neck.position.y = torsoH + 0.04;
    torso.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, torsoH + 0.32, 0);
    torso.add(headGroup);
    this.bones.head = headGroup;

    // Main Stylized Head (Chibi cute soft egg-sphere)
    const headRadius = isNPC ? 0.30 : 0.35;
    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius, 40, 32),
      skinMat
    );
    headMesh.scale.set(1.0, 1.05, 0.98);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Soft Cute Ears
    [-headRadius * 0.94, headRadius * 0.94].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 14), skinMat);
      ear.scale.set(0.35, 0.85, 0.65);
      ear.position.set(ex, -0.01, -0.02);
      headGroup.add(ear);
    });

    // Rosy Blushing Cheeks
    [-0.18, 0.18].forEach(cx => {
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.060, 16), cheekMat);
      cheek.position.set(cx, -0.05, headRadius * 0.88);
      cheek.rotation.y = cx > 0 ? 0.35 : -0.35;
      headGroup.add(cheek);
    });

    // ── Expressive Big Glossy Cartoon Eyes ──
    [-0.11, 0.11].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, 0.04, headRadius * 0.86);
      eyeGroup.rotation.y = ex > 0 ? 0.22 : -0.22;

      // Sclera (White eye background - smooth oval)
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 18), whiteMat);
      eyeWhite.scale.set(1.0, 1.22, 0.25);
      eyeGroup.add(eyeWhite);

      // Upper Eyelash / Lid Line
      const lashGeo = new THREE.TorusGeometry(0.065, 0.011, 10, 22, Math.PI * 0.65);
      const lash = new THREE.Mesh(lashGeo, darkMat);
      lash.position.set(0, 0.035, 0.016);
      lash.rotation.z = ex > 0 ? -0.15 : Math.PI - 0.15;
      eyeGroup.add(lash);

      // Colorful Iris
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.046, 16), eyeIrisMat);
      iris.position.set(0, -0.005, 0.022);
      eyeGroup.add(iris);

      // Deep Black Pupil
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), darkMat);
      pupil.position.set(0, -0.005, 0.025);
      eyeGroup.add(pupil);

      // Primary Specular Catchlight (Large glossy gleam)
      const shine1 = new THREE.Mesh(new THREE.CircleGeometry(0.014, 10), whiteMat);
      shine1.position.set(-0.014, 0.014, 0.028);
      eyeGroup.add(shine1);

      // Secondary Specular Sparkle (Small playful twinkle)
      const shine2 = new THREE.Mesh(new THREE.CircleGeometry(0.007, 8), whiteMat);
      shine2.position.set(0.012, -0.015, 0.028);
      eyeGroup.add(shine2);

      headGroup.add(eyeGroup);

      // Friendly Eyebrows (HIGH on the forehead)
      const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.01, 0.06, 4, 8).rotateZ(Math.PI / 2),
        decalMat({ color: hairColor })
      );
      brow.position.set(ex, 0.165, headRadius * 0.89);
      brow.rotation.z = ex > 0 ? -0.12 : 0.12;
      headGroup.add(brow);
    });

    // Cute Tiny Button Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.030, 18, 14), skinMat);
    nose.position.set(0, -0.025, headRadius + 0.01);
    headGroup.add(nose);

    // Warm Happy Smile
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.13, headRadius * 0.91);

    const cavityMat = decalMat({ color: 0x5a1018 });
    const mouthCavity = new THREE.Mesh(new THREE.CircleGeometry(0.060, 16, 0, Math.PI), cavityMat);
    mouthCavity.rotation.z = Math.PI;
    mouthGroup.add(mouthCavity);

    const teeth = new THREE.Mesh(new THREE.PlaneGeometry(0.070, 0.020), whiteMat);
    teeth.position.set(0, -0.010, 0.002);
    mouthGroup.add(teeth);

    const tongue = new THREE.Mesh(
      new THREE.CircleGeometry(0.035, 12, 0, Math.PI),
      decalMat({ color: 0xe84393 })
    );
    tongue.position.set(0, -0.055, 0.002);
    mouthGroup.add(tongue);

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.010, 10, 24, Math.PI),
      decalMat({ color: 0xc44569 })
    );
    lip.rotation.x = Math.PI / 2;
    lip.rotation.z = Math.PI;
    lip.position.set(0, 0.002, 0.004);
    mouthGroup.add(lip);

    headGroup.add(mouthGroup);

    // ─────────────────────────────────────────────────────────────
    // 5. NATURAL STYLIZED HAIR (NO HELMETS! 100% CLEAN FACE!)
    // ─────────────────────────────────────────────────────────────
    if (type === 'girl_yellow' || type === 'sara') {
      this.buildSaraHair(headGroup, headRadius, hairMat);
    } else if (type === 'girl_green' || type === 'rayan') {
      this.buildRayanHair(headGroup, headRadius, hairMat);
    } else if (type === 'boy_purple' || type === 'boy') {
      this.buildAminHair(headGroup, headRadius, hairMat);
    } else if (isNPC) {
      this.buildNPCHeadwear(headGroup, headRadius, whiteMat, shirtMat, hairMat);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Smooth Rounded Arms & Cute Hands
    // ─────────────────────────────────────────────────────────────
    this.bones.leftArm = this.createArm(-1, skinMat, shirtMat);
    this.bones.rightArm = this.createArm(1, skinMat, shirtMat);
    torso.add(this.bones.leftArm);
    torso.add(this.bones.rightArm);

    // ─────────────────────────────────────────────────────────────
    // 7. Natural Legs & Cute Cartoon Sneakers (NO SKATES!)
    // ─────────────────────────────────────────────────────────────
    this.bones.leftLeg = this.createLeg(-1, pantsMat, shoeMat, whiteMat, darkMat);
    this.bones.rightLeg = this.createLeg(1, pantsMat, shoeMat, whiteMat, darkMat);
    hips.add(this.bones.leftLeg);
    hips.add(this.bones.rightLeg);

    // Enable shadows across all meshes
    this.group.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
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
    // 1. Soft hair cap covering top, back, and temples
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius + 0.025, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairCap.position.set(0, 0.07, -0.04);
    hairCap.rotation.x = -0.30;
    headGroup.add(hairCap);

    // 2. Layered fluffy top tufts creating cool modern boy haircut
    const zOffsets = [-0.02, 0.03, -0.01, 0.02, -0.03];
    for (let t = -2; t <= 2; t++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 18, 14),
        hairMat
      );
      puff.position.set(t * 0.065, headRadius * 0.88 + 0.06, zOffsets[t + 2]);
      headGroup.add(puff);
    }

    // 3. Neat front fringe resting high above the eyebrows
    for (let i = -2; i <= 2; i++) {
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 0.11, 14),
        hairMat
      );
      strand.position.set(i * 0.065, 0.22, headRadius * 0.86);
      strand.rotation.z = i * 0.15;
      strand.rotation.x = 0.45;
      headGroup.add(strand);
    }

    // 4. Sideburns in front of ears
    [-0.32, 0.32].forEach(sx => {
      const sideburn = new THREE.Mesh(
        new RoundedBoxGeometry(0.04, 0.14, 0.08, 2, 0.018),
        hairMat
      );
      sideburn.position.set(sx, 0.02, 0.02);
      headGroup.add(sideburn);
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
      const hair = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.025, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
      hair.position.set(0, headRadius * 0.45, -0.02);
      headGroup.add(hair);
    }
  }

  /**
   * Smooth Rounded Arm with Short Sleeve & Cute Hand
   */
  createArm(side, skinMat, shirtMat) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.30, 0.36, 0);

    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.078, 0.18, 20),
      shirtMat
    );
    sleeve.position.y = -0.09;
    shoulder.add(sleeve);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(0.080, 0.012, 10, 22),
      clothMat({ color: 0xffffff })
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = -0.18;
    shoulder.add(trim);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.060, 0.22, 18),
      skinMat
    );
    forearm.position.y = -0.28;
    shoulder.add(forearm);

    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.41, 0);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.060, 18, 14), skinMat);
    palm.scale.set(0.9, 1.1, 0.6);
    handGroup.add(palm);

    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 6), skinMat);
    thumb.position.set(side * 0.045, 0.01, 0.02);
    thumb.rotation.z = side * -0.5;
    handGroup.add(thumb);

    shoulder.add(handGroup);
    return shoulder;
  }

  /**
   * Smooth Rounded Legs & Cute Cartoon Sneakers (NO SKATES!)
   */
  createLeg(side, pantsMat, shoeMat, whiteMat, darkMat) {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.12, -0.05, 0);

    // Upper Thigh
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.092, 0.082, 0.24, 20),
      pantsMat
    );
    thigh.position.y = -0.12;
    hipJoint.add(thigh);

    // Soft Smooth Knee Joint
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.080, 18, 14), pantsMat);
    knee.position.set(0, -0.24, 0.01);
    hipJoint.add(knee);

    // Lower Calf
    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.080, 0.072, 0.22, 20),
      pantsMat
    );
    calf.position.y = -0.35;
    hipJoint.add(calf);

    // ── Cute Cartoon Sneaker (No skates, completely natural cute shoes!) ──
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.48, 0.03);

    // Thick White Rubber Sole
    const sole = new THREE.Mesh(
      new RoundedBoxGeometry(0.15, 0.05, 0.28, 2, 0.02),
      whiteMat
    );
    sole.position.y = -0.06;
    sole.castShadow = true;
    shoeGroup.add(sole);

    // Colorful Sneaker Upper Canvas
    const upper = new THREE.Mesh(
      new RoundedBoxGeometry(0.14, 0.10, 0.24, 3, 0.04),
      shoeMat
    );
    upper.position.y = 0.01;
    shoeGroup.add(upper);

    // Rounded White Rubber Toe Cap (Classic cartoon sneaker style!)
    const toeCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.072, 20, 16),
      whiteMat
    );
    toeCap.scale.set(1.0, 0.85, 1.15);
    toeCap.position.set(0, -0.01, 0.10);
    shoeGroup.add(toeCap);

    // White Tongue & Clean Laces on top
    const laces = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, 0.09),
      whiteMat
    );
    laces.rotation.x = -Math.PI / 3;
    laces.position.set(0, 0.07, 0.03);
    shoeGroup.add(laces);

    // White Heel Stripe detail
    const heelStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, 0.08),
      whiteMat
    );
    heelStripe.position.set(0, 0.02, -0.125);
    shoeGroup.add(heelStripe);

    hipJoint.add(shoeGroup);
    return hipJoint;
  }

  createAlgerianFlagPin(whiteMat) {
    const badge = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.05), whiteMat);
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

    const pack = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.32, 0.14, 3, 0.05), packMat);
    pack.castShadow = true;
    packGroup.add(pack);

    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.15, 0.06, 2, 0.025), clothMat({ color: 0x2c3e50 }));
    pocket.position.set(0, -0.06, -0.09);
    packGroup.add(pocket);

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

    const joints = this.animJoints || (this.animJoints = ['hips', 'torso', 'head', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']
      .map(k => this.bones[k]).filter(Boolean));
    const prev = this.prevPose || (this.prevPose = joints.map(() => ({ rot: new THREE.Euler(), y: 0, init: false })));
    joints.forEach((b, i) => { prev[i].rot.copy(b.rotation); prev[i].y = b.position.y; });

    if (isJumping) {
      this.animateJump();
    } else if (isMoving) {
      this.animateRun(speedRatio);
    } else {
      this.animateIdle();
    }

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

  animateIdle() {
    const t = this.animTime * 2.8;
    this.bones.torso.position.y = 0.10 + Math.sin(t) * 0.012;
    this.bones.torso.rotation.x = Math.sin(t) * 0.012;
    this.bones.head.rotation.y = Math.sin(t * 0.5) * 0.06;
    this.bones.head.rotation.x = -Math.sin(t) * 0.012;

    this.bones.leftArm.rotation.x = Math.sin(t) * 0.04;
    this.bones.leftArm.rotation.z = -0.16;
    this.bones.rightArm.rotation.x = -Math.sin(t) * 0.04;
    this.bones.rightArm.rotation.z = 0.16;

    this.bones.leftLeg.rotation.x = 0;
    this.bones.rightLeg.rotation.x = 0;
    this.bones.hips.position.y = this.hipHeight;
    this.bones.torso.rotation.y = 0;
    this.bones.head.rotation.z = 0;
  }

  animateRun(speedRatio) {
    const isSprint = speedRatio > 1.2;
    const freq = isSprint ? 12 : 9;
    const t = this.animTime * freq;
    const strideAmp = isSprint ? 0.70 : 0.48;

    // Torso gentle bounce & counter-twist
    this.bones.torso.rotation.y = Math.sin(t) * (isSprint ? 0.16 : 0.10);
    this.bones.torso.rotation.x = isSprint ? 0.18 : 0.08;
    this.bones.torso.position.y = 0.10 + Math.abs(Math.sin(t * 2)) * 0.04;

    // Natural child run/walk strides
    this.bones.leftLeg.rotation.x = Math.sin(t) * strideAmp;
    this.bones.leftLeg.rotation.z = 0;
    this.bones.rightLeg.rotation.x = -Math.sin(t) * strideAmp;
    this.bones.rightLeg.rotation.z = 0;

    // Counter-balancing natural arm swings
    this.bones.leftArm.rotation.x = -Math.sin(t) * (strideAmp * 1.15);
    this.bones.leftArm.rotation.z = -0.22;
    this.bones.rightArm.rotation.x = Math.sin(t) * (strideAmp * 1.15);
    this.bones.rightArm.rotation.z = 0.22;

    this.bones.head.rotation.x = isSprint ? -0.08 : -0.02;
    this.bones.head.rotation.y = -this.bones.torso.rotation.y * 0.35;
  }

  animateJump() {
    this.bones.torso.rotation.x = -0.12;
    this.bones.leftArm.rotation.x = -1.4;
    this.bones.leftArm.rotation.z = -0.5;
    this.bones.rightArm.rotation.x = -1.4;
    this.bones.rightArm.rotation.z = 0.5;
    this.bones.leftLeg.rotation.x = 0.55;
    this.bones.rightLeg.rotation.x = -0.35;
  }
}
