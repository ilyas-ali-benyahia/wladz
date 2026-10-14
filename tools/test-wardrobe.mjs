/**
 * Headless wardrobe test: appearance, outfit purchase / ownership / equip / try-on, persistence,
 * and that every outfit builds on both characters with the full rig, soles on the ground, and the
 * garment shapes it promises (shorts, robe, vest, scarf, bands).
 * Usage: npm run test:wardrobe
 */
import * as THREE from 'three';

const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = () => {
  const el = { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, hidden: false, dataset: {}, children: [],
    getContext: () => ctx, appendChild() {}, addEventListener() {}, querySelectorAll: () => [], set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; }, textContent: '' };
  el.querySelector = () => mkEl();
  return el;
};
globalThis.document = { createElement: mkEl, body: { appendChild() {} }, getElementById: () => mkEl() };
globalThis.window = { addEventListener() {} };

const { CharacterModel } = await import('../src/systems/CharacterModel.js');
const { WardrobeSystem } = await import('../src/systems/WardrobeSystem.js');
const { OUTFITS } = await import('../src/data/outfits.js');
const { ProgressionSystem } = await import('../src/systems/ProgressionSystem.js');
const { audio } = await import('../src/systems/AudioSystem.js');
audio.playClick = audio.playMissionComplete = audio.playWrongAnswer = () => {};

let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', msg); };

// Minimal game shell around the real wardrobe + progression
let saves = 0;
const player = {
  gender: 'boy_purple', model: null,
  switchGender(type) { this.gender = type; this.model = new CharacterModel(type, this.lookFor ? this.lookFor(type) : {}); }
};
const game = { player, progression: new ProgressionSystem(), input: { setEnabled() {} }, isGameActive: true, saveCurrentGame: () => { saves++; } };
const wd = new WardrobeSystem(game);
player.switchGender('boy_purple');

// 1. Starting state
check(wd.owned.has('casual') && wd.owned.size === 1 && wd.look().outfit === 'casual', 'new player owns only the everyday outfit');

// 2. Purchases
game.progression.coins = 50;
check(wd.buy('traditional') === 'poor' && !wd.owned.has('traditional') && game.progression.coins === 50, 'cannot buy a 120-coin outfit with 50 coins (nothing deducted)');
check(wd.buy('sport') === 'poor', 'cannot buy the 60-coin kit with 50 coins');
game.progression.coins = 200;
const before = saves;
check(wd.buy('sport') === 'bought' && game.progression.coins === 140 && wd.look().outfit === 'sport' && saves > before, 'buying the kit costs 60 coins, equips it and autosaves');
check(wd.buy('sport') === 'owned' && game.progression.coins === 140, 'buying an owned outfit again costs nothing');

// 3. Equip / try-on
check(!wd.equip('work'), 'cannot wear an outfit that is not owned');
wd.tryOn = 'traditional'; wd.refresh();
const robeWhileTrying = (() => { let n = 0; player.model.group.traverse(o => { if (o.isMesh && o.geometry.type === 'LatheGeometry' && o.parent === player.model.bones.hips && o.material.side === THREE.DoubleSide) n++; }); return n; })();
check(robeWhileTrying === 1 && wd.look().outfit === 'sport', 'trying on the gandoura shows it on the character without buying it');
wd.tryOn = null; wd.refresh();
check(wd.equip('casual') && wd.look().outfit === 'casual', 'switch back to an owned outfit');

// 4. Appearance
wd.setLook({ skin: 0x9a6545, hair: 0x1c140f, hairStyle: 'wavy' });
let skinOk = false; player.model.group.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9a6545) skinOk = true; });
check(skinOk && player.model.chooseHairStyle('boy_purple') === 'wavy', 'skin tone and hairstyle applied to the live model');

// 5. Persistence round trip (and robustness to bad data)
const saved = JSON.parse(JSON.stringify(wd.getState()));
const wd2 = new WardrobeSystem({ ...game, player: { ...player, switchGender() {} } });
wd2.loadState(saved);
check(wd2.owned.has('sport') && wd2.look('boy_purple').skin === 0x9a6545 && wd2.look('boy_purple').hairStyle === 'wavy', 'save / load keeps owned outfits and appearance');
const wd3 = new WardrobeSystem({ ...game, player: { ...player, switchGender() {} } });
wd3.loadState({ owned: ['hacked_item'], looks: { boy_purple: { outfit: 'traditional' } } });
check(!wd3.owned.has('hacked_item') && wd3.look('boy_purple').outfit === 'casual', 'unknown or unowned outfits in a save fall back safely');

// 6. Every outfit on both characters: full rig, soles on the ground, garment shapes present
const BONES = ['hips', 'torso', 'head', 'leftArm', 'rightArm', 'leftElbow', 'rightElbow', 'leftHand', 'rightHand', 'leftLeg', 'rightLeg', 'leftKnee', 'rightKnee', 'leftFoot', 'rightFoot'];
for (const o of OUTFITS) {
  for (const type of ['boy_purple', 'girl_green']) {
    const variant = o[type.startsWith('girl') ? 'girl' : 'boy'];
    const m = new CharacterModel(type, { appearance: { skin: 0xe3ad85, hair: 0x3d2314, hairStyle: 'short', hijab: 0x2e86c1 }, outfit: variant });
    for (let i = 0; i < 20; i++) m.update(1 / 30, { isMoving: i > 8, speedRatio: 1 });
    for (let i = 0; i < 20; i++) m.update(1 / 30, { isMoving: false });
    m.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m.group, true);
    const missing = BONES.filter(b => !m.bones[b]);
    const has = { robe: false, vest: false, scarf: false, shorts: false };
    m.group.traverse(n => {
      if (!n.isMesh) return;
      if (n.geometry.type === 'LatheGeometry' && n.parent === m.bones.hips && n.material.side === THREE.DoubleSide) has.robe = true;
      if (n.geometry.type === 'LatheGeometry' && n.parent === m.bones.torso && n.material.color.getHex() === variant.vest) has.vest = true;
      if (n.geometry.type === 'TorusGeometry' && variant.scarf && n.material.color.getHex() === variant.scarf[0]) has.scarf = true;
    });
    const shin = m.bones.leftKnee.children.find(c => c.isMesh && c.geometry.type === 'CapsuleGeometry');
    has.shorts = !!(shin && shin.material === m.bones.head.children[0].material);
    const expect = (flag, want) => !want || flag;
    const ok = !missing.length && Math.abs(box.min.y) < 0.01 &&
      (variant.robe ? has.robe : !has.robe) && expect(has.vest, variant.vest !== undefined) && expect(has.scarf, !!variant.scarf) &&
      (variant.shorts && type === 'boy_purple' ? has.shorts : !has.shorts);
    check(ok, `${o.id.padEnd(11)} on ${type.padEnd(10)} rig ok, feet ${box.min.y.toFixed(3)} m, ${['robe', 'vest', 'scarf', 'shorts'].filter(k => has[k]).join('+') || 'plain'}`);
  }
}

console.log(failed ? `\n${failed} check(s) failed` : '\nAll wardrobe checks passed');
process.exit(failed ? 1 : 0);
