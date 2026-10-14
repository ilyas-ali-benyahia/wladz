/**
 * Headless city-facilities test: encyclopedia, museum discovery, first aid, recycling (sorting with real key
 * input, clean-up campaign -> park blooms, persisted), driving school (gates, speed limit, collision, stopping
 * at the crossing, parking), station interaction and interior action points.
 * Usage: npm run test:facilities
 */
import * as THREE from 'three';

const ctx2d = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 100 }) : (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = () => {
  const el = { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, firstChild: { style: {} },
    getContext: () => ctx2d, appendChild() {}, addEventListener() {}, querySelectorAll: () => [], remove() {}, textContent: '', width: 0, height: 0 };
  el.querySelector = () => mkEl();
  Object.defineProperty(el, 'innerHTML', { set() {}, get() { return ''; } });
  return el;
};
const keyListeners = new Set();
globalThis.document = { createElement: mkEl, body: { appendChild() {} }, getElementById: () => mkEl(), fonts: null };
globalThis.window = { innerWidth: 1, innerHeight: 1, addEventListener: (t, f) => { if (t === 'keydown') keyListeners.add(f); }, removeEventListener: (t, f) => keyListeners.delete(f) };
const press = (code) => [...keyListeners].forEach(f => f({ code }));
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const { audio } = await import('../src/systems/AudioSystem.js');
Object.keys(Object.getPrototypeOf(audio)).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(audio))).forEach(k => { if (k.startsWith('play') || k === 'setBeachAmbience') audio[k] = () => {}; });
const { events } = await import('../src/core/EventBus.js');
const { CollisionSystem } = await import('../src/systems/CollisionSystem.js');
const { WorldBuilder } = await import('../src/systems/WorldBuilder.js');
const { InteriorSystem } = await import('../src/systems/InteriorSystem.js');
const { PlayerVehicleSystem } = await import('../src/systems/PlayerVehicleSystem.js');
const { ProgressionSystem } = await import('../src/systems/ProgressionSystem.js');
const { ActivitySystem } = await import('../src/systems/activities/ActivitySystem.js');
const { EncyclopediaSystem } = await import('../src/systems/EncyclopediaSystem.js');
const { CityFacilities } = await import('../src/systems/CityFacilities.js');
const A = await import('../src/systems/activities/CityActivities.js');

let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', msg); };

const scene = new THREE.Scene();
const engine = { scene, camera: new THREE.PerspectiveCamera(), renderer: { capabilities: {} } };
const cs = new CollisionSystem();
const wb = new WorldBuilder(engine, cs);
cs.buildWalkables(scene);
const input = { keys: {}, yaw: 0, enabled: true, setEnabled(v) { this.enabled = v; }, isActionHeld: () => false, getMovementVector: () => ({ fwd: 0, right: 0, isRunning: false, isJumping: false }) };
const player = { position: new THREE.Vector3(), group: new THREE.Group(), heading: 0, isGrounded: true, input };
const ui = { setCustomHint() {} };
const game = { engine, collisionSystem: cs, worldBuilder: wb, player, input, ui, progression: new ProgressionSystem(), isGameActive: true, saveCurrentGame() {} };
game.interiors = new InteriorSystem(engine, cs, player, ui);
game.vehicle = new PlayerVehicleSystem(engine, cs, player, input, ui, wb.playerHome.carSpot);
game.activities = new ActivitySystem(game);
game.encyclopedia = new EncyclopediaSystem(game);
game.facilities = new CityFacilities(game);
const act = game.activities;
act.register(A.createFirstAidActivity());
act.register(A.createMuseumActivity(game));
act.register(A.createRecyclingActivity(game, game.facilities));
act.register(A.createDrivingSchoolActivity(game, game.facilities));
const tick = (sec, fn) => { for (let i = 0; i < Math.round(sec * 60); i++) { fn && fn(i); act.update(1 / 60); } };
const read = (id, title, text = 'نص') => events.emit('INTERIOR_POI_READ', { id, title, text, building: id });

// 1. Interior action points exist where the activities start
const poiActions = (id) => game.interiors.interiors[id].pois.map(p => p.action).filter(Boolean);
check(poiActions('museum').includes('museum_quiz') && poiActions('clinic').includes('firstaid'), 'museum guide desk and clinic first-aid corner are interactive points');

// 2. Encyclopedia
const total = game.encyclopedia.totalKnown();
check(total >= 12, `encyclopedia knows ${total} information points in the city`);
read('library', 'ركن القراءة', 'القراءة اليومية تنمّي الخيال.');
read('library', 'ركن القراءة', 'القراءة اليومية تنمّي الخيال.');
check(game.encyclopedia.count() === 1, 'reading a panel adds one entry (re-reading does not duplicate)');

// 3. Museum: tour, memory quiz, explorer
act.start('museum', 0);
['1 نوفمبر 1954', '5 جويلية 1962', 'الأمير عبد القادر'].forEach(t => read('museum', t));
read('library', 'السبورة');
tick(0.1);
check(act.active && act.active.ctx.data.read.size === 3, 'museum tour counts only the museum panels (3/4 so far)');
read('museum', 'التراث الفخاري'); tick(0.1);
check(act.isDone('museum', 'tour'), 'museum tour complete after the 4 panels');
act.start('museum', 1);
act.closeQuiz(); act.active.ctx.data.quizDone = true; tick(0.1);
check(act.isDone('museum', 'memory'), 'memory quiz complete');
act.start('museum', 2);
['المسجد|آداب المسجد', 'casbah|قصبة الجزائر', 'townhall|البلدية'].forEach(s => { const [id, t] = s.split('|'); read(id, t); });
tick(0.1);
check(act.isDone('museum', 'explorer'), 'explorer stage: 3 panels in other landmarks');

// 4. First aid: all four decision stages
for (let i = 0; i < 4; i++) { act.state.firstaid.unlocked = i; act.start('firstaid', i); act.closeQuiz(); act.active.ctx.data.quizDone = true; tick(0.1); }
check(['call', 'cut', 'burn', 'safety'].every(s => act.isDone('firstaid', s)), 'first-aid scenarios completed in order');

// 5. Recycling: sorting with key presses (1-4), right and wrong answers
const BIN_KEYS = { paper: 'Digit1', plastic: 'Digit2', metal: 'Digit3', general: 'Digit4' };
const sortRun = async (wrongEvery = 0) => {
  const d = act.active.ctx.data;
  let n = 0;
  while (d.answered < d.total) {
    const it = d.pool[d.i % d.pool.length];
    const right = BIN_KEYS[it.bin];
    const wrong = Object.values(BIN_KEYS).find(k => k !== right);
    press(wrongEvery && ++n % wrongEvery === 0 ? wrong : right);
    await wait(it.bin && wrongEvery && n % wrongEvery === 0 ? 1350 : 380);
  }
  await wait(50);
  tick(0.05);
};
act.start('recycling', 0);
check(!input.enabled, 'sorting panel takes the keyboard (walking paused)');
await sortRun(4);
check(act.isDone('recycling', 'learn') && input.enabled, 'learn stage: 6+ of 8 sorted correctly (2 deliberate mistakes) passes; controls restored');
act.start('recycling', 1);
await sortRun(2);
check(!act.isDone('recycling', 'speed') && !act.active && input.enabled, 'speed stage with half the answers wrong fails cleanly');
act.start('recycling', 1);
await sortRun(0);
check(act.isDone('recycling', 'speed') && act.state.recycling.best.speed === 12, 'speed stage retried: 12/12, personal best saved');

// 6. Clean-up campaign: collect around the park, return -> the park blooms (and stays after load)
act.start('recycling', 2);
const items = act.active.ctx.data.items;
for (const it of items) { player.position.set(it.x, 0, it.z); tick(0.05); }
const st = game.facilities.station('recycling');
player.position.set(st.pos.x, 0, st.pos.z); tick(0.1);
const flowerCount = () => { let n = 0; scene.traverse(o => { if (o.isInstancedMesh && o.count > 100 && o.geometry.type === 'IcosahedronGeometry') n += o.count; }); return n; };
check(act.isDone('recycling', 'campaign') && game.facilities.flags.parkBloom && flowerCount() > 100, `campaign done: the central park blooms (${flowerCount()} flowers)`);
const saved = game.facilities.getState();
const scene2Count = scene.children.length;
game.facilities.loadState(saved);
check(scene.children.length === scene2Count, 'loading the saved world state does not duplicate the flower beds');

// 7. Station interaction
player.position.set(st.pos.x, 0, st.pos.z);
check(game.facilities.tryInteract() && act.menuOpen, 'E at the recycling centre opens its activity menu');
act.closeMenu();

// 8. Driving school
const car = game.vehicle;
act.state.driving.unlocked = 3;
act.start('driving', 1);
tick(0.2);
check(act.active && /اركب/.test(act.hud ? 'اركب' : ''), 'driving stages ask the player to get in the car first');
car.place(60, 43.8, -Math.PI / 2); car.enter();
for (const g of act.active.ctx.data.gates) { car.state.x = g.x + 1; car.state.z = g.z; car.state.speed = 5; tick(0.1); }
check(act.isDone('driving', 'calm'), 'calm driving: all four gates passed under 30 km/h');
act.start('driving', 1);
car.state.speed = 12; tick(7.5);
check(!act.active && act.state.driving.done.calm, 'speeding (43 km/h) three times fails the stage cleanly');
act.start('driving', 1);
car.state.speed = 4;
events.emit('VEHICLE_BUMP', { type: 'solid', speed: 4 }); tick(0.1);
check(!act.active, 'a collision fails the calm-driving stage');
act.start('driving', 2);
car.state.x = 25; car.state.z = 43.8; car.state.speed = 6; tick(0.1);
car.state.x = 16.5; tick(0.1);
check(!act.active && !act.isDone('driving', 'crossing'), 'driving over the crossing without stopping fails');
act.start('driving', 2);
car.state.x = 21.4; car.state.speed = 0; tick(2.3);
car.state.x = 12; car.state.speed = 4; tick(0.1);
check(act.isDone('driving', 'crossing'), 'full stop before the crossing, then continue: stage complete');
act.start('driving', 3);
car.place(wb.playerHome.carSpot.x + 0.3, wb.playerHome.carSpot.z, wb.playerHome.carSpot.heading + 0.1); car.driving = true;
tick(2);
check(act.isDone('driving', 'parking'), 'parked inside the driveway frame and stopped: parking complete');
car.tryExit();

console.log(failed ? `\n${failed} check(s) failed` : '\nAll facility checks passed');
process.exit(failed ? 1 : 0);
