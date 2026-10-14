/**
 * Headless driving test (no browser): real world, collision, traffic and the player's car.
 * Covers home start, walking out, entering, driving to the road, steering, braking, wall and barrier
 * collisions at speed, stopping for a person, safe exit, the car staying parked, and save/load.
 * Usage: npm run test:vehicle   (exit code 1 when a check fails)
 */
import * as THREE from 'three';

const ctx = new Proxy({}, {
  get: (t, k) => k === 'measureText' ? () => ({ width: 100 }) : (k in t ? t[k] : () => ({ addColorStop() {} })),
  set: (t, k, v) => { t[k] = v; return true; }
});
const el = () => ({ style: {}, getContext: () => ctx, width: 0, height: 0, appendChild() {}, set textContent(v) { this._t = v; }, get textContent() { return this._t; } });
globalThis.document = { createElement: el, body: { appendChild() {} }, fonts: null };
globalThis.window = { innerWidth: 1, innerHeight: 1, addEventListener() {} };

const { CollisionSystem } = await import('../src/systems/CollisionSystem.js');
const { WorldBuilder } = await import('../src/systems/WorldBuilder.js');
const { TrafficSystem } = await import('../src/systems/TrafficSystem.js');
const { InteriorSystem } = await import('../src/systems/InteriorSystem.js');
const { PlayerVehicleSystem, PLAYER_CAR_ID } = await import('../src/systems/PlayerVehicleSystem.js');
const { audio } = await import('../src/systems/AudioSystem.js');
let horns = 0;
audio.playTone = audio.playClick = () => {};
audio.playHorn = () => { horns++; };

let failed = 0;
const check = (ok, msg) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', msg); };

const scene = new THREE.Scene();
const engine = { scene, camera: new THREE.PerspectiveCamera(), renderer: { capabilities: {} } };
const cs = new CollisionSystem();
const wb = new WorldBuilder(engine, cs);
cs.buildWalkables(scene);
const traffic = new TrafficSystem(engine, cs, wb);
const trafficStart = traffic.vehicles.map(v => ({ p: v.mesh.position.clone(), h: v.heading, wp: v.waypointIdx, sp: v.speed }));
traffic.vehicles.forEach(v => v.mesh.position.set(-500, 0, -500)); // park traffic far away (isolated test area)
traffic.syncFootprints();

const keys = {};
const input = {
  keys, yaw: 0, pitch: 0.25, cameraDistance: 5.8, enabled: true,
  getMovementVector: () => ({ fwd: (keys.W ? 1 : 0) - (keys.S ? 1 : 0), right: (keys.D ? 1 : 0) - (keys.A ? 1 : 0), isRunning: false, isJumping: !!keys.Space })
};
const player = { position: new THREE.Vector3(), group: new THREE.Group(), heading: 0, isGrounded: true, input };
scene.add(player.group);
const hints = {};
const ui = { setCustomHint: (h, src) => { hints[src] = h; } };
const interiors = new InteriorSystem(engine, cs, player, ui);
const car = new PlayerVehicleSystem(engine, cs, player, input, ui, wb.playerHome.carSpot);
const people = [];
car.peopleProvider = () => people;
car.canUse = () => !interiors.isInside();
// Same wiring as main.js: traffic sees the player car as a vehicle
traffic.extraVehicles = () => [car.footprint];
traffic.playerIsVehicle = () => car.driving;
const run = (sec, fn) => { for (let i = 0; i < sec * 60; i++) { fn && fn(i); car.update(1 / 60); } };
const walk = (to, steps = 900) => {
  for (let i = 0; i < steps; i++) {
    const d = to.clone().sub(player.position).setY(0);
    if (d.length() < 0.2) return true;
    player.position.copy(cs.resolveMovement(player.position, d.normalize().multiplyScalar(0.08), 0.42));
  }
  return false;
};
const overlapsSolid = () => car.blockedAt(car.state.x, car.state.z, car.state.heading) === 'solid';

// 1. Game start inside the home; walk to the exit and out of the door
interiors.startInside('home');
const home = interiors.current;
check(home && home.id === 'home' && !cs.checkCollision(player.position, 0.42), 'game starts inside the home on free floor');
check(walk(home.exit), 'walk from the living room to the front door without hitting furniture');
interiors.exit = interiors.exit.bind(interiors);
interiors.transition = (a) => a();
interiors.tryInteract.call(Object.assign(interiors, { nearExit: true }));
check(!interiors.isInside() && !cs.checkCollision(player.position, 0.42), `stepped out in front of the house at (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`);

// 2. Walk to the car and get in
const spot = wb.playerHome.carSpot;
check(!overlapsSolid(), 'car parked in the driveway without touching the house, apartment or anything solid');
check(walk(new THREE.Vector3(72.0, 0, 53.8)), 'walk across the courtyard to the car');
car.update(1 / 60);
check(hints.vehicle && hints.vehicle.includes('E'), 'prompt shown near the car: ' + (hints.vehicle || '').replace(/<[^>]+>/g, ''));
check(car.handleInteract() && car.driving && !player.group.visible, 'E enters the car, character hidden, car in control');

// 3. Drive out of the driveway to the ring road (car faces the road)
keys.W = true;
let worstOverlap = false, maxSpeed = 0;
run(4, () => { if (overlapsSolid()) worstOverlap = true; maxSpeed = Math.max(maxSpeed, car.state.speed); });
keys.W = false;
check(car.state.z < 47 && !worstOverlap, `drove down the driveway onto the road (z=${car.state.z.toFixed(1)}), never inside anything`);
check(maxSpeed <= 13.01, `speed capped (${(maxSpeed * 3.6).toFixed(0)} km/h after 4 s)`);
check(Math.abs(player.position.x - car.state.x) < 1e-6 && Math.abs(player.position.z - car.state.z) < 1e-6, 'hidden player rides with the car (missions and map see the car position)');

// 4. Steering on the open ring road: turning needs speed and is progressive
car.place(60, 42, -Math.PI / 2);
keys.W = true; run(1.2);
keys.D = true;
const h0 = car.state.heading;
let maxRate = 0, prevH = h0;
run(1.6, () => { const dh = Math.abs(car.state.heading - prevH) * 60; maxRate = Math.max(maxRate, dh); prevH = car.state.heading; });
keys.D = false; keys.W = false;
const turned = Math.atan2(Math.sin(car.state.heading - h0), Math.cos(car.state.heading - h0));
check(Math.abs(turned) > 0.9 && maxRate < 3 && !overlapsSolid(), `steering turns the car progressively (${(turned * 180 / Math.PI).toFixed(0)}° in 1.6 s, max ${(maxRate * 180 / Math.PI).toFixed(0)}°/s)`);
car.state.speed = 0; car.state.heading = h0; car.update(1 / 60);
keys.D = true; run(0.5); keys.D = false;
check(Math.abs(car.state.heading - h0) < 1e-6, 'no rotation while stopped (needs speed to turn)');

// 5. Braking: from speed, Space stops quickly
car.place(30, 42, -Math.PI / 2);
keys.W = true; run(3); keys.W = false;
const v0 = car.state.speed;
let t = 0; keys.Space = true; run(3, () => { if (car.state.speed > 0.05) t++; }); keys.Space = false;
check(v0 > 9 && t / 60 < 1.0, `handbrake from ${(v0 * 3.6).toFixed(0)} km/h to stop in ${(t / 60).toFixed(2)} s`);
keys.S = true; run(2); keys.S = false;
check(car.state.speed < 0 && car.state.speed >= -4.51, `S reverses slowly when stopped (${(car.state.speed * 3.6).toFixed(0)} km/h)`);

// 6. Full speed into the road-end barrier: stops before it (no tunnelling)
car.place(50, -2, Math.PI / 2);
keys.W = true; run(5); keys.W = false;
check(car.state.x + car.footprint.hl < 81.0 && !overlapsSolid(), `top-speed run east is stopped by the tunnel barrier (front at x=${(car.state.x + car.footprint.hl).toFixed(2)})`);

// 7. Into a building wall (the house front from the courtyard)
car.place(76.5, 50.2, 0);
car.update(1 / 60);
keys.W = true; run(3); keys.W = false;
check(car.state.z + car.footprint.hl < wb.playerHome.house.minZ && !overlapsSolid(), `drives up to the house wall and stops (front z=${(car.state.z + car.footprint.hl).toFixed(2)} < ${wb.playerHome.house.minZ})`);

// 8. A pedestrian in the lane: the car stops instead of driving through
car.place(10, -42, -Math.PI / 2);
car.update(1 / 60);
people.push(new THREE.Vector3(-2, 0, -42));
keys.W = true; run(4); keys.W = false;
const gap = (car.state.x - car.footprint.hl) - (-2);
check(gap > 0 && gap < 2, `stops for a person standing in the road (bumper gap ${gap.toFixed(2)} m)`);
people.length = 0;

// 9. Exit: refused while moving, then a safe spot beside the car
keys.W = true; run(1); keys.W = false;
check(car.state.speed > 2 && !car.tryExit() && car.driving, 'cannot get out while the car is moving');
keys.Space = true; run(1.5); keys.Space = false;
const parked = { x: car.state.x, z: car.state.z, h: car.state.heading };
check(car.handleInteract() && !car.driving && player.group.visible, 'E exits once stopped; character visible again');
check(!cs.checkCollision(player.position, 0.42), `character placed on free ground beside the car (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`);
run(2);
check(car.state.x === parked.x && car.state.z === parked.z && car.state.heading === parked.h, 'car stays exactly where it was parked');
check(cs.checkCollision(new THREE.Vector3(parked.x, 0, parked.z), 0.42), 'the parked car is solid for people');

// 10. Exit next to a wall uses the free side; blocked in on both sides refuses
car.place(70.45, 56.5, Math.PI);
car.enter(); car.tryExit();
check(!car.driving && !cs.checkCollision(player.position, 0.42), `exit in the narrow driveway lands at (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`);

// 11. Single car, re-entering, save / load
const count = () => { let n = 0; scene.traverse(o => { if (o.userData && o.userData.vehicleId === PLAYER_CAR_ID) n++; }); return n; };
walk(new THREE.Vector3(72.6, 0, 54));
check(car.handleInteract() && car.driving, 'walk back and re-enter the same car');
car.tryExit();
check(count() === 1, 'exactly one personal car in the scene after enter / exit cycles');
const saved = car.getState();
Object.assign(car.state, { x: 0, z: 30 }); car.loadState(saved);
check(car.state.x === saved.x && car.state.z === saved.z && saved.id === PLAYER_CAR_ID, `save / load restores the parked car (${JSON.stringify(saved)})`);

// 12. Horn: H while driving, nothing on foot
horns = 0;
check(!car.honk() && horns === 0, 'horn does nothing on foot');
car.place(30, 42, -Math.PI / 2);
car.enter();
car.honk(); car.honk(); // second press inside the cooldown is merged
check(horns === 1, 'H sounds the horn while driving (rapid repeats merged)');

// 13. Tangled with a traffic car (it cut in): the player can still drive out
const taxi = traffic.vehicles[2];
taxi.mesh.position.set(30, 0, 41.2); taxi.heading = -Math.PI / 2 + 0.4; traffic.syncFootprints();
check(cs.obbOverlap(traffic.footprints[2], car.footprint, 0), 'set-up: a traffic car overlaps the player car');
keys.S = true; run(1.5); keys.S = false;
const moved = Math.hypot(car.state.x - 30, car.state.z - 42);
check(moved > 2, `player car drives out of the overlap (moved ${moved.toFixed(1)} m)`);
taxi.mesh.position.set(-500, 0, -500); traffic.syncFootprints();
keys.Space = true; run(1); keys.Space = false;
car.tryExit();

// 14. Real traffic for 60 s with the player's car parked across a lane on its route
traffic.vehicles.forEach((v, i) => { v.mesh.position.copy(trafficStart[i].p); v.heading = trafficStart[i].h; v.waypointIdx = trafficStart[i].wp; v.speed = trafficStart[i].sp; v.mesh.rotation.y = v.heading; });
traffic.syncFootprints();
car.place(-2.2, 26, Math.PI / 2); // across the N-S boulevard
let carHits = 0, trafficHits = 0, minMoved = Infinity;
const startPos = traffic.vehicles.map(v => v.mesh.position.clone());
for (let f = 0; f < 60 * 60; f++) {
  traffic.update(1 / 60, f / 60, player.position);
  if (f % 6) continue;
  traffic.footprints.forEach((a, i) => {
    if (cs.obbOverlap(a, car.footprint, 0)) carHits++;
    for (let j = i + 1; j < traffic.footprints.length; j++) if (cs.obbOverlap(a, traffic.footprints[j], 0)) trafficHits++;
  });
}
const stuckOnes = traffic.vehicles.filter((v, i) => v.mesh.position.distanceTo(startPos[i]) < 1).length;
check(carHits === 0, `60 s of traffic: no car ever overlaps the player's car (samples with overlap: ${carHits})`);
check(trafficHits === 0, `60 s of traffic: traffic cars never overlap each other (samples with overlap: ${trafficHits})`);

// 15. Move the car away: the blocked lane flows again
car.place(70.45, 56.5, Math.PI);
const travelled = traffic.vehicles.map(() => 0), lastPos = traffic.vehicles.map(v => v.mesh.position.clone());
for (let f = 0; f < 20 * 60; f++) {
  traffic.update(1 / 60, f / 60, player.position);
  traffic.vehicles.forEach((v, i) => { travelled[i] += v.mesh.position.distanceTo(lastPos[i]); lastPos[i].copy(v.mesh.position); });
}
const minMove = Math.min(...travelled);
check(minMove > 20, `after the car is moved away every traffic car keeps going (shortest distance driven in 20 s: ${minMove.toFixed(0)} m)`);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll vehicle checks passed');
process.exit(failed ? 1 : 0);
