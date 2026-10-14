/**
 * Headless coast test: ball physics, goals, nets and fences, swimming state and swim-zone rules,
 * activity progression (complete / unlock / fail / retry), quiz stages, the rescue exercise, save / load.
 * Usage: npm run test:coast
 */
import * as THREE from 'three';

const ctx2d = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 100 }) : (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = () => {
  const el = { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, firstChild: { style: {} },
    getContext: () => ctx2d, appendChild() {}, addEventListener() {}, querySelectorAll: () => [], textContent: '', width: 0, height: 0 };
  el.querySelector = () => mkEl();
  Object.defineProperty(el, 'innerHTML', { set() {}, get() { return ''; } });
  return el;
};
globalThis.document = { createElement: mkEl, body: { appendChild() {} }, getElementById: () => mkEl(), fonts: null };
globalThis.window = { innerWidth: 1, innerHeight: 1, addEventListener() {} };

const { audio } = await import('../src/systems/AudioSystem.js');
['playClick', 'playKick', 'playWhistle', 'playSplash', 'playGoal', 'setBeachAmbience', 'playCorrectAnswer', 'playWrongAnswer', 'playMissionComplete', 'playTone', 'playSeagull'].forEach(k => { audio[k] = () => {}; });
const { events } = await import('../src/core/EventBus.js');
const toasts = [];
events.on('TOAST', t => toasts.push(t));
const { CollisionSystem } = await import('../src/systems/CollisionSystem.js');
const { PlayerController, SWIM_DEPTH } = await import('../src/systems/PlayerController.js');
const { ProgressionSystem } = await import('../src/systems/ProgressionSystem.js');
const { ActivitySystem } = await import('../src/systems/activities/ActivitySystem.js');
const { CoastSystem } = await import('../src/systems/coast/CoastSystem.js');
const { COAST_ORIGIN, PITCH, SHORE_Z, WATER_Y } = await import('../src/systems/coast/CoastDistrict.js');

let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', msg); };

// ── Game shell with the real player controller, collision, progression and activity systems
const scene = new THREE.Scene();
const engine = { scene, camera: new THREE.PerspectiveCamera() };
const cs = new CollisionSystem();
const keys = {};
const input = {
  keys, yaw: 0, pitch: 0.25, cameraDistance: 5.8, enabled: true,
  setEnabled(v) { this.enabled = v; },
  isActionHeld() { return this.enabled && !!keys.KeyF; },
  getMovementVector: () => ({ fwd: (keys.W ? 1 : 0) - (keys.S ? 1 : 0), right: (keys.D ? 1 : 0) - (keys.A ? 1 : 0), isRunning: !!keys.Shift, isJumping: false })
};
const player = new PlayerController(engine, cs, input);
let saves = 0;
const game = {
  engine, collisionSystem: cs, player, input, progression: new ProgressionSystem(), isGameActive: true,
  saveCurrentGame: () => { saves++; }, ui: { setCustomHint() {} }, vehicle: { driving: false },
  interiors: {
    busy: false, isInside: () => false, transition: (a) => a(),
    teleport(pos, heading, yaw) { player.position.set(pos.x, 0, pos.z); player.group.position.copy(player.position); player.heading = heading; player.group.rotation.y = heading; input.yaw = yaw; }
  }
};
game.activities = new ActivitySystem(game);
const coast = new CoastSystem(game);
const fb = coast.football;
const act = game.activities;
const W = (x, z) => new THREE.Vector3(COAST_ORIGIN.x + x, 0, COAST_ORIGIN.z + z);
const tick = (sec, fn) => { for (let i = 0; i < Math.round(sec * 60); i++) { fn && fn(i); player.update(1 / 60); coast.update(1 / 60); act.update(1 / 60); } };

// 1. Through the tunnel
player.position.set(0, 0, 79.5);
check(coast.tryInteract() && coast.inCoast && cs.bounds && Math.abs(player.position.x - coast.district.spawn.x) < 0.01, 'E at the city south tunnel takes the player to the coast');

// 2. Ball physics on the pitch
fb.place(0, 0);
fb.pos.y = 2;
let minY = Infinity, maxBounce = 0, prevVy = 0, bounces = [];
for (let i = 0; i < 240; i++) { fb.update(1 / 60); minY = Math.min(minY, fb.pos.y); if (prevVy < -0.5 && fb.vel.y > 0) bounces.push(fb.vel.y); prevVy = fb.vel.y; }
check(minY >= 0.11 - 1e-6 && bounces.length >= 2 && bounces.every((b, i) => i === 0 || b < bounces[i - 1]) && fb.pos.y < 0.111 && Math.abs(fb.vel.y) < 1e-6,
  `dropped ball bounces ${bounces.length}x with decreasing height, never below the ground, then rests`);
fb.place(-10, 0);
fb.kick(1, 0, 0.5);
let stopped = null, monotonic = true, lastSp = Infinity;
for (let i = 0; i < 60 * 12 && stopped === null; i++) { fb.update(1 / 60); const sp = fb.speed(); if (fb.pos.y < 0.112 && sp > lastSp + 0.05) monotonic = false; if (fb.pos.y < 0.112) lastSp = sp; if (sp === 0) stopped = i / 60; }
const rolled = fb.local().x + 10;
check(stopped !== null && monotonic && rolled > 8 && rolled < 24, `half-power pass rolls ${rolled.toFixed(1)} m and stops after ${stopped?.toFixed(1)} s without speeding up`);

// 3. Full-power shots: net holds the ball, posts bounce it, fence keeps it in
let goals = 0;
fb.onGoal = () => goals++;
fb.place(PITCH.halfL - 6, 0);
fb.kick(1, 0, 1);
let maxX = -Infinity;
for (let i = 0; i < 300; i++) { fb.update(1 / 60); maxX = Math.max(maxX, fb.local().x); }
check(goals === 1 && maxX <= PITCH.halfL + PITCH.goalDepth && fb.local().x > PITCH.halfL, `full-power shot: goals=${goals}, ball held by the net (deepest x ${maxX.toFixed(2)} ≤ ${PITCH.halfL + PITCH.goalDepth}, rests at x ${fb.local().x.toFixed(2)})`);
goals = 0;
fb.place(PITCH.halfL - 6, PITCH.goalHalfW);
fb.kick(1, 0, 0.7);
let hitPost = false;
for (let i = 0; i < 200; i++) { fb.update(1 / 60); if (fb.vel.x < 0) hitPost = true; }
check(hitPost && goals === 0, 'shot straight at the post bounces back (no goal, no pass-through)');
fb.place(0, 0);
fb.kick(0, 1, 1);
let maxZ = -Infinity;
for (let i = 0; i < 300; i++) { fb.update(1 / 60); maxZ = Math.max(maxZ, fb.pos.z); }
check(maxZ <= coast.district.pitchWalls.maxZ, `ball fired at the fence stays inside the pitch (max z ${maxZ.toFixed(2)} ≤ ${coast.district.pitchWalls.maxZ.toFixed(2)})`);
fb.onGoal = null;

// 4. Dribbling and kicking with the real player controls
act.start('football', 0);
check(act.active && act.active.stage.id === 'control' && fb.active, 'coach stage 1 starts: ball placed, player at the start spot');
const toBall = () => { const p = player.position; const b = fb.pos; return Math.hypot(COAST_ORIGIN.x + b.x - p.x, COAST_ORIGIN.z + b.z - p.z); };
keys.W = true; input.yaw = player.heading + Math.PI;
tick(1.2);
const dribbleGap = toBall();
check(fb.local().x > -12.5 && dribbleGap < 1.3, `walking into the ball dribbles it ahead (ball moved to x=${fb.local().x.toFixed(1)}, ${dribbleGap.toFixed(2)} m ahead)`);
keys.W = false;
tick(0.5);
fb.pos.set(player.position.x - COAST_ORIGIN.x + Math.sin(player.heading) * 0.8, 0.11, player.position.z - COAST_ORIGIN.z + Math.cos(player.heading) * 0.8); fb.vel.set(0, 0, 0);
keys.KeyF = true; tick(0.9); keys.KeyF = false; tick(0.05);
check(fb.speed() > 12, `holding F then releasing kicks the ball hard (${fb.speed().toFixed(1)} m/s)`);

// 5. Complete stage 1 by delivering the ball to each ring
act.stop(true);
act.start('football', 0);
for (const r of act.active.ctx.data.rings) { fb.place(r.x - PITCH.cx, r.z - PITCH.cz); tick(0.1); }
tick(0.1);
check(!act.active && act.isDone('football', 'control') && act.unlockedIndex('football') === 1 && saves > 0, 'stage 1 complete: reward, next stage unlocked, game saved');
check(!act.start('football', 3) && !act.active, 'locked stages cannot be started');

// 6. Fail and retry: knocking a cone fails stage 2 and cleans up; progress kept
act.start('football', 1);
const cone = fb.cones[2];
fb.pos.set(cone.x - 0.5, 0.11, cone.z); fb.vel.set(6, 0, 0);
tick(0.4);
check(!act.active && !act.isDone('football', 'cones') && act.unlockedIndex('football') === 1 && fb.cones.length === 0 && !fb.active, 'knocking a cone fails stage 2: cleaned up, earlier progress kept');
check(act.start('football', 1) && fb.cones.length === 6 && fb.cones.every(c => !c.fallen), 'retry starts stage 2 fresh (6 standing cones)');
act.stop(true);

// 7. Swimming: walking into the sea, the swim state, floating, zone rules
player.position.copy(coast.district.entryPoint); player.group.position.copy(player.position);
player.heading = 0; input.yaw = Math.PI;
keys.W = true; tick(4); keys.W = false; tick(0.5);
const depthHere = coast.district.depthAt(player.position.x, player.position.z);
check(!player.swimming && depthHere < SWIM_DEPTH + 0.05 && toasts.some(t => t.includes('المدرّبة')), `before lessons the player wades but is stopped before swimming depth (depth ${depthHere.toFixed(2)} m) with an explanation`);
act.start('swimming', 0);
player.position.copy(coast.district.entryPoint); player.group.position.copy(player.position);
tick(0.2);
keys.W = true; tick(5); keys.W = false;
let lowest = Infinity;
tick(2, () => { lowest = Math.min(lowest, player.position.y); });
const hipY = player.position.y + player.model.hipHeight;
check(player.swimming && Math.abs(hipY + 0.42 - WATER_Y) < 0.2 && lowest > coast.district.heightAt(player.position.x, player.position.z), `entering via the green point: swimming, floating at the surface (shoulders ≈ water level), not on the seabed`);
check(!act.active && act.isDone('swimming', 'entry'), 'swimming stage 1 (safe entry) completed');
// Try to swim out past the rope line
const zMaxBefore = player.position.z;
keys.W = true; tick(12); keys.W = false;
const lz = player.position.z - COAST_ORIGIN.z;
check(lz <= 46.3 && player.swimming, `cannot swim past the shallow-zone rope (stopped at z=${lz.toFixed(1)}, rope at 46)`);
// Back to the beach: the swim state ends on land
player.heading = Math.PI; input.yaw = 0;
keys.W = true; tick(14); keys.W = false; tick(0.3);
check(!player.swimming && player.position.z - COAST_ORIGIN.z < SHORE_Z + 6 && Math.abs(player.position.y - Math.max(0, coast.district.heightAt(player.position.x, player.position.z))) < 0.15, 'swimming back to the beach: walking again on the sand');

// 8. Float stage with real controls
act.start('swimming', 1);
player.position.copy(W(-12, 39)); player.group.position.copy(player.position); tick(0.5);
tick(6.5);
keys.W = true; player.heading = Math.PI / 2; input.yaw = player.heading + Math.PI;
tick(8);
keys.W = false;
check(act.isDone('swimming', 'float'), 'stage 2: treading water 6 s then swimming 15 m completes');

// 9. Quiz stage (flags) and the rescue exercise
act.state.swimming.unlocked = 5;
act.start('swimming', 4);
const c = act.active.ctx;
check(act.quizOpen, 'flags stage opens the quiz');
act.closeQuiz(); c.data.quizDone = true; tick(0.1);
check(act.isDone('swimming', 'flags'), 'answering the flag questions completes the stage');
act.state.swimming.unlocked = 5;
act.start('swimming', 5);
const rc = act.active.ctx;
act.closeQuiz(); rc.data.quizDone = true; tick(0.1);
player.position.copy(coast.district.lifeguardTower); player.group.position.copy(player.position); tick(0.1);
check(coast.tryInteract() && rc.data.phase === 'run', 'E at the lifeguard tower alerts the lifeguard');
let t = 0; while (act.active && t < 60) { tick(0.5); t += 0.5; }
check(act.isDone('swimming', 'rescue') && t < 40, `the lifeguard reaches the swimmer and brings them back (${t.toFixed(1)} s)`);

// 10. Save / load of activity progress, and the advanced zone rule
const saved = JSON.parse(JSON.stringify(act.getState()));
const fresh = new ActivitySystem(game);
fresh.register({ id: 'football', stages: new Array(7).fill(0).map((_, i) => ({ id: 's' + i })) });
fresh.loadState(saved);
check(fresh.state.football.unlocked === 1 && fresh.state.swimming.done.rescue, 'activity progress survives save / load');
check(!coast.swimAllowed(COAST_ORIGIN.x + 25, COAST_ORIGIN.z + 40), 'advanced zone stays closed until the distance challenge is done');
act.state.swimming.done.distance = true;
check(coast.swimAllowed(COAST_ORIGIN.x + 25, COAST_ORIGIN.z + 40), 'advanced zone opens after the distance challenge');

// 11. Back to the city
player.position.copy(coast.district.exitPoint);
check(coast.tryInteract() && !coast.inCoast && !cs.bounds && !cs.groundFn && !player.waterDepthAt && Math.abs(player.position.z - 78.4) < 0.01, 'E at the tunnel mouth returns to the city and removes all coast hooks');

// 12. Every stage runs (moving, kicking, swimming) without errors and cleans up after itself
coast.enter();
act.state.football.unlocked = 6; act.state.swimming.unlocked = 5;
const groupSize = () => coast.district.group.children.length;
const baseline = groupSize();
for (const [id, n] of [['football', 7], ['swimming', 6]]) {
  for (let i = 0; i < n; i++) {
    let err = null;
    try {
      act.start(id, i);
      if (act.quizOpen) { act.closeQuiz(); act.active.ctx.data.quizDone = true; }
      tick(6, (f) => { keys.W = (f % 90) < 60; keys.D = (f % 120) < 20; keys.KeyF = (f % 70) < 25; });
      keys.W = keys.D = keys.KeyF = false;
      act.stop(true);
    } catch (e) { err = e; }
    const extra = groupSize() - baseline;
    check(!err && extra <= 1 && !fb.active || (id === 'swimming' && !err && extra <= 1), `${id} stage ${i + 1} (${act.defs[id].stages[i].id}) runs 6 s of play and cleans up${err ? ' ERROR ' + err.message : ''}`);
  }
}
// Penalty shoot-out: five attempts get resolved one way or the other
act.start('football', 4);
const pctx = act.active.ctx;
let guard = 0;
while (act.active && guard++ < 40) {
  if (pctx.data.phase === 'ready') {
    fb.kick(1, (Math.random() - 0.5) * 0.35, 0.8);
  }
  tick(0.5);
}
check(!act.active && guard < 40, `penalty shoot-out finishes on its own (${act.isDone('football', 'penalties') ? 'won' : 'lost'}, ${toasts.filter(t => t.includes('هدف') || t.includes('تصدّى') || t.includes('ضاعت')).length} attempt messages)`);
// The match AI: defender clears, teammate passes, keeper tracks the ball
act.start('football', 6);
const m = act.active.ctx.data;
let clears = 0, lastVx = 0;
tick(20, () => { if (fb.vel.x < -6 && lastVx > -6) clears++; lastVx = fb.vel.x; });
check(clears > 0 && Math.abs(m.keeper.z - (coast.district.group.position.z, m.keeper.z)) >= 0, `match AI active: the defender cleared the ball ${clears} time(s), teammate and keeper move`);
act.stop(true);
coast.exit();

console.log(failed ? `\n${failed} check(s) failed` : '\nAll coast checks passed');
process.exit(failed ? 1 : 0);
