import { DEFAULT_PRACTICE } from '../data/prayerPractice.js';

export const POSE_KEYS = Object.freeze(['takbir', 'qiyam', 'ruku', 'itidal', 'sujud1', 'jalsa', 'sujud2', 'qada', 'salam']);
const clone = value => structuredClone(value);
const floorPose = key => ['sujud1', 'sujud2', 'jalsa', 'qada', 'salam'].includes(key);
const sittingPose = key => ['jalsa', 'qada', 'salam'].includes(key);
const TRANSITION_KEYS = ['lower', 'support', 'raised', 'kneel'];

/** +Z is the qibla / character's forward direction. Anatomical right is -X.
 * Targets are in model space; IK keeps limb lengths constant during blending.
 * Distinct action IDs are deliberately retained even when endpoints coincide.
 */
export function poseFor(key, settings = DEFAULT_PRACTICE) {
  if (!POSE_KEYS.includes(key) && !TRANSITION_KEYS.includes(key)) throw new Error(`Unknown prayer pose: ${key}`);
  // Carpet surface is y=.025. Joint targets include the thickness of the
  // palms, knees and toes; joint centres themselves must not touch the mat.
  const p = {
    hip: [0, 1.055, 0], pitch: 0, headPitch: 0.035, headYaw: 0,
    footL: [0.17, 0.105, 0], footR: [-0.17, 0.105, 0],
    footPitchL: 0, footPitchR: 0, footYawL: 0, footYawR: 0,
    kneeL: [0.17, 0.575, 0.003], kneeR: [-0.17, 0.575, 0.003],
    handL: [0.385, 0.94, 0.055], handR: [-0.385, 0.94, 0.055],
    palmL: 0, palmR: 0, handYawL: 0, handYawR: 0, rollL: 0, rollR: 0,
    finger: 0, armSpread: 1, grounded: 0,
  };
  if ((key === 'qiyam' || key === 'takbir') && settings.hands === 'qabd') {
    // Qabḍ (Bukhārī 740: right hand on the left forearm). The left hand lies across the upper
    // abdomen, palm to the body, fingers to the right; the right palm covers the left wrist
    // and forearm, fingers to the left. Rolls keep both thumbs up (see Character3D.applyPose).
    p.handL = [0.13, 1.30, 0.25]; p.handR = [-0.01, 1.31, 0.33];
    p.palmL = p.palmR = -Math.PI / 2;
    p.handYawL = -Math.PI / 2; p.handYawR = Math.PI / 2;
    p.rollL = Math.PI / 2; p.rollR = -Math.PI / 2;
    p.armSpread = 0.2;
  }
  if (key === 'raised') {
    // Opening takbīr. Shoulder joints are at y≈1.63 (shoulder caps reach ≈1.74); ear centres ≈2.0.
    const raise = settings.raise || 'shoulders';
    if (raise === 'ears') {
      // Muslim 391b: "حتى يحاذي بهما أذنيه" — palms to the qibla, hands level with the ears.
      p.handL = [0.44, 1.86, 0.16]; p.handR = [-0.44, 1.86, 0.16];
      p.palmL = p.palmR = Math.PI;
    } else if (raise === 'shoulders-qibla') {
      // Bukhārī 735: "حذو منكبيه" — palms to the qibla, fingertips at shoulder height.
      p.handL = [0.38, 1.58, 0.16]; p.handR = [-0.38, 1.58, 0.16];
      p.palmL = p.palmR = Math.PI;
    } else {
      // Mālikī default (Risāla 10.1c with commentary): beside the shoulders, at shoulder level,
      // backs of the hands to the sky and palms to the earth.
      p.handL = [0.36, 1.68, 0.22]; p.handR = [-0.36, 1.68, 0.22];
      p.palmL = p.palmR = -Math.PI / 2;
    }
    p.armSpread = 0.35;
  }
  if (key === 'ruku') {
    p.pitch = Math.PI / 2; p.headPitch = 0;
    // Palms rest on the front of the knees, outside the robe (z≈0.22 at knee height).
    p.handL = [0.18, 0.70, 0.25]; p.handR = [-0.18, 0.70, 0.25];
    p.palmL = p.palmR = -0.12; p.armSpread = 0.35;
  }
  if (key === 'lower' || key === 'support') {
    p.hip = [0, key === 'support' ? 0.77 : 0.86, -0.22];
    p.pitch = key === 'support' ? 1.65 : 0.8; p.headPitch = -0.12;
    p.handL = [0.37, key === 'support' ? 0.060 : 0.65, key === 'support' ? 0.61 : 0.38];
    p.handR = [-0.37, p.handL[1], p.handL[2]];
    p.palmL = p.palmR = -Math.PI / 2;
    p.kneeL = [0.17, 0.28, 0.3]; p.kneeR = [-0.17, 0.28, 0.3];
  }
  if (floorPose(key)) {
    p.hip = [0, 0.575, 0.013];
    p.kneeL = [0.17, 0.125, 0.18003293]; p.kneeR = [-0.17, 0.125, 0.18003293];
    p.footL = [0.17, 0.237, -0.27642627]; p.footR = [-0.17, 0.237, -0.27642627];
    p.footPitchL = p.footPitchR = 1.15;
    // Forehead and nose meet the mat while the neck remains aligned. The head
    // shape and these angles are calibrated together in Character3D.
    p.pitch = 1.858; p.headPitch = -0.038;
    p.handL = [0.37, 0.060, 0.70]; p.handR = [-0.37, 0.060, 0.70];
    p.palmL = p.palmR = -Math.PI / 2; p.grounded = 1;
    if (!key.startsWith('sujud')) {
      const tawarruk = settings.sitting === 'tawarruk';
      // Tawarruk sits on the left buttock on the ground (Risāla 10.3a): the pelvis drops until the
      // thighs rest on the mat. Iftirāsh sits on the left foot, so the pelvis stays higher.
      p.hip = [tawarruk ? 0.10 : 0, tawarruk ? 0.135 : 0.235, -0.10];
      const kneeZ = -0.10 + Math.sqrt(0.48 ** 2 - (p.hip[1] - 0.125) ** 2);
      p.kneeL = [p.hip[0] + 0.17, 0.125, kneeZ];
      p.kneeR = [p.hip[0] - 0.17, 0.125, kneeZ];
      const leftX = tawarruk ? -0.035 : 0.17;
      const rightX = tawarruk ? -0.19 : -0.17;
      p.footL = [leftX, 0.105, kneeZ - Math.sqrt(0.47 ** 2 - (leftX - p.kneeL[0]) ** 2 - 0.02 ** 2)];
      p.footR = [rightX, 0.237, kneeZ - Math.sqrt(0.47 ** 2 - (rightX - p.kneeR[0]) ** 2 - 0.112 ** 2)];
      p.footPitchL = 0; p.footYawL = tawarruk ? -Math.PI / 2 : Math.PI;
      p.pitch = 0; p.headPitch = 0.04;
      // Hands rest on the thighs near the knees (10.1o), on top of the robe.
      // Calibrated so the palms rest on the draped robe over the thighs (Character3D.updateGarment).
      const handY = tawarruk ? 0.312 : 0.31;
      p.handL = [p.kneeL[0], handY, 0.27]; p.handR = [p.kneeR[0], handY + (tawarruk ? 0.012 : 0), 0.27]; // tawarruk: right thigh lies higher
      p.palmL = p.palmR = -Math.PI / 2; p.armSpread = 0.45;
      p.finger = key === 'qada' ? 1 : 0;
      if (key === 'qada') {
        // Risāla 10.3i: right-hand fingers clenched except the forefinger, which is extended
        // "with its side uppermost" (not its underside to the floor): the fist rests on its edge.
        p.rollR = -Math.PI / 2; p.handR = [p.handR[0], handY + 0.03, p.handR[2]];
      }
      if (key === 'salam') p.headYaw = settings.taslim === 'single' ? -0.45 : 0.95;
    }
  }
  if (key === 'kneel') {
    // Upright kneeling on the prostration knees/toes: the bridge between standing and
    // sitting, so out-of-order lesson picks never detour through a prostration.
    Object.assign(p, poseFor('sujud1', settings));
    p.hip = [0, 0.585, 0.06]; p.pitch = 0.18; p.headPitch = 0.02;
    p.handL = [0.2, 0.42, 0.27]; p.handR = [-0.2, 0.42, 0.27];
    p.palmL = p.palmR = -Math.PI / 2; p.armSpread = 0.45; p.grounded = 1;
  }
  return p;
}

export function blendPose(a, b, t) {
  const out = {};
  for (const key of Object.keys(b)) out[key] = Array.isArray(b[key])
    ? b[key].map((v, i) => a[key][i] + (v - a[key][i]) * t)
    : a[key] + (b[key] - a[key]) * t;
  return out;
}

/** A single cancellable animation clock. No detached GSAP tweens or timeouts. */
export class PrayerAnimator {
  constructor(settings = DEFAULT_PRACTICE) {
    this.settings = { ...settings }; this.pose = poseFor('qiyam', settings);
    this.action = 'qiyam'; this.queue = []; this.elapsed = 0; this.onResolve = null;
  }
  get busy() { return this.queue.length > 0; }
  cancel() { this.queue = []; this.onResolve?.(false); this.onResolve = null; }
  play(action, duration = 1.15, reducedMotion = false) {
    const previous = this.action;
    const target = poseFor(action, this.settings); // validate before cancelling
    this.cancel(); this.action = action;
    if (duration === 0 || reducedMotion) {
      this.pose = target; return Promise.resolve(true);
    }
    const frames = [];
    const add = (pose, seconds) => frames.push({ pose: clone(pose), duration: seconds });
    if (floorPose(previous) && !floorPose(action)) {
      // Risāla 10.1q: rise directly from sujūd pushing up with the hands. From a sitting
      // pose (out-of-order lesson pick) come up onto the knees first, not into sujūd.
      add(poseFor(sittingPose(previous) ? 'kneel' : 'sujud1', this.settings), duration * 0.4);
      add(poseFor('support', this.settings), duration * 0.65);
      add(poseFor('lower', this.settings), duration * 0.5);
      add(poseFor('itidal', this.settings), duration * 0.6);
    }
    if (!floorPose(previous) && floorPose(action)) {
      add(poseFor('itidal', this.settings), duration * 0.3);
      add(poseFor('lower', this.settings), duration * 0.6);
      if (this.settings.descent === 'hands-first') add(poseFor('support', this.settings), duration * 0.55);
      add(poseFor(sittingPose(action) ? 'kneel' : 'sujud1', this.settings), duration * 0.8);
    }
    if (action === 'takbir') {
      const raised = poseFor('raised', this.settings);
      add(raised, duration * 0.7); add(raised, duration * 0.45);
      add(target, duration * 0.7);
    } else if (action === 'salam') {
      add(poseFor('jalsa', this.settings), duration * 0.35);
      const right = { ...target, headYaw: this.settings.taslim === 'single' ? -0.45 : -0.95 };
      add(right, duration * 0.7); add(right, duration * 0.4);
      if (this.settings.taslim === 'double') {
        add({ ...target, headYaw: 0 }, duration * 0.45); add(target, duration * 0.7);
      }
    } else add(target, duration);
    this.queue = frames; this.from = clone(this.pose); this.elapsed = 0;
    return new Promise(resolve => { this.onResolve = resolve; });
  }
  update(delta) {
    if (!this.busy) return false;
    this.elapsed += delta;
    while (this.queue.length && this.elapsed >= this.queue[0].duration) {
      this.elapsed -= this.queue[0].duration;
      this.pose = this.queue.shift().pose; this.from = clone(this.pose);
    }
    if (!this.queue.length) { this.onResolve?.(true); this.onResolve = null; return true; }
    const t = this.elapsed / this.queue[0].duration;
    this.pose = blendPose(this.from, this.queue[0].pose, t * t * (3 - 2 * t));
    return true;
  }
}
