import * as THREE from 'three';
import { CartoonVehicleGenerator } from './visuals/CartoonVehicleGenerator.js';
import { audio } from './AudioSystem.js';

/**
 * TrafficSystem: Living, Organized Open-World Vehicle Traffic
 * - Cars navigate along designated road lanes
 * - Respect traffic light cycles and crosswalks
 * - Yield to pedestrians crossing the street
 * - Maintain safe stopping distances
 * - Collision avoidance and automatic stuck recovery
 */
export class TrafficSystem {
  constructor(engine, collisionSystem, worldBuilder) {
    this.engine = engine;
    this.scene = engine.scene;
    this.collisionSystem = collisionSystem;
    this.worldBuilder = worldBuilder;
    this.vehicleGen = new CartoonVehicleGenerator(this.scene);

    this.vehicles = [];
    this.trafficLights = [];
    this.lightCycleTimer = 0;
    this.currentLightPhase = 'NS_GREEN'; // 'NS_GREEN' or 'EW_GREEN'

    this.pedestriansRef = null; // Bound to PedestrianSystem

    this.initRoadWaypoints();
    this.initTrafficLights();
    this.spawnFleet();
    this.measureFleet();

    // Vehicles are solid for the player and pedestrians
    collisionSystem.vehicleProvider = () => this.footprints;
  }

  /** Real footprint of each vehicle (half width / half length in its own frame) from its mesh */
  measureFleet() {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    this.vehicles.forEach(v => {
      const rot = v.mesh.rotation.y;
      v.mesh.rotation.y = 0;
      v.mesh.updateMatrixWorld(true);
      box.setFromObject(v.mesh).getSize(size);
      v.mesh.rotation.y = rot;
      v.mesh.updateMatrixWorld(true);
      v.hw = Math.min(1.6, Math.min(size.x, size.z) / 2) * 0.95;
      v.hl = Math.min(6, Math.max(size.x, size.z) / 2) * 0.95;
      v.hornCooldown = 0;
      v.blockedTime = 0;
    });
    this.footprints = this.vehicles.map(v => ({ x: 0, z: 0, heading: 0, hw: v.hw, hl: v.hl }));
    this.syncFootprints();
  }

  syncFootprints() {
    this.vehicles.forEach((v, i) => {
      const f = this.footprints[i];
      f.x = v.mesh.position.x;
      f.z = v.mesh.position.z;
      f.heading = v.heading;
    });
  }

  setPedestrianSystem(pedestrianSystem) {
    this.pedestriansRef = pedestrianSystem;
  }

  initRoadWaypoints() {
    // Standard Road Circuits (East-West lane z = -2.2 [westbound] & z = 2.2 [eastbound])
    // North-South lane x = -2.2 [southbound] & x = 2.2 [northbound]
    this.circuits = {
      // Loop 1: Central Avenue East-West Circuit
      eastWest: [
        new THREE.Vector3(-62, 0, 2.2),
        new THREE.Vector3(-18, 0, 2.2),
        // Around the central roundabout (south side)
        new THREE.Vector3(-7.2, 0, 2.6),
        new THREE.Vector3(-5, 0, 5.3),
        new THREE.Vector3(0, 0, 7),
        new THREE.Vector3(5, 0, 5.3),
        new THREE.Vector3(7.2, 0, 2.6),
        new THREE.Vector3(18, 0, 2.2),
        new THREE.Vector3(62, 0, 2.2),
        // Turn around loop
        new THREE.Vector3(62, 0, -2.2),
        new THREE.Vector3(18, 0, -2.2),
        // Around the central roundabout (north side)
        new THREE.Vector3(7.2, 0, -2.6),
        new THREE.Vector3(5, 0, -5.3),
        new THREE.Vector3(0, 0, -7),
        new THREE.Vector3(-5, 0, -5.3),
        new THREE.Vector3(-7.2, 0, -2.6),
        new THREE.Vector3(-18, 0, -2.2),
        new THREE.Vector3(-62, 0, -2.2)
      ],
      // Loop 2: North-South Boulevard Circuit
      northSouth: [
        new THREE.Vector3(-2.2, 0, -62),
        new THREE.Vector3(-2.2, 0, -18),
        // Around the roundabout (west side)
        new THREE.Vector3(-2.6, 0, -7.2),
        new THREE.Vector3(-5.3, 0, -5),
        new THREE.Vector3(-7, 0, 0),
        new THREE.Vector3(-5.3, 0, 5),
        new THREE.Vector3(-2.6, 0, 7.2),
        new THREE.Vector3(-2.2, 0, 18),
        new THREE.Vector3(-2.2, 0, 62),
        // Turn around loop
        new THREE.Vector3(2.2, 0, 62),
        new THREE.Vector3(2.2, 0, 18),
        // Around the roundabout (east side)
        new THREE.Vector3(2.6, 0, 7.2),
        new THREE.Vector3(5.3, 0, 5),
        new THREE.Vector3(7, 0, 0),
        new THREE.Vector3(5.3, 0, -5),
        new THREE.Vector3(2.6, 0, -7.2),
        new THREE.Vector3(2.2, 0, -18),
        new THREE.Vector3(2.2, 0, -62)
      ],
      // Loop 3: Secondary Outer Perimeter Loop
      perimeter: [
        new THREE.Vector3(-42, 0, -42),
        new THREE.Vector3(42, 0, -42),
        new THREE.Vector3(42, 0, 42),
        new THREE.Vector3(-42, 0, 42)
      ]
    };
  }

  initTrafficLights() {
    // 4 Corner Traffic Signals around the Central Plaza
    this.trafficLights = [
      { id: 'TL_N', pos: new THREE.Vector3(0, 0, -14.5), orientation: 'NS', stopLineZ: -16.5 },
      { id: 'TL_S', pos: new THREE.Vector3(0, 0, 14.5), orientation: 'NS', stopLineZ: 16.5 },
      { id: 'TL_E', pos: new THREE.Vector3(14.5, 0, 0), orientation: 'EW', stopLineX: 16.5 },
      { id: 'TL_W', pos: new THREE.Vector3(-14.5, 0, 0), orientation: 'EW', stopLineX: -16.5 }
    ];
  }

  spawnFleet() {
    // 1. National Police Patrol Car (drives on East-West main avenue)
    const policeMesh = this.vehicleGen.createPolicePatrolCar(-30, 2.2, Math.PI / 2);
    this.vehicles.push({
      id: 'police_patrol',
      type: 'police',
      mesh: policeMesh,
      circuit: this.circuits.eastWest,
      waypointIdx: 1,
      speed: 4.8,
      baseSpeed: 4.8,
      heading: Math.PI / 2,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });

    // 2. Civil Protection Fire Truck (drives on Perimeter / NS)
    const fireMesh = this.vehicleGen.createFireTruck(-2.2, -40, 0);
    this.vehicles.push({
      id: 'fire_truck',
      type: 'fire',
      mesh: fireMesh,
      circuit: this.circuits.northSouth,
      waypointIdx: 1,
      speed: 4.2,
      baseSpeed: 4.2,
      heading: 0,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });

    // 3. Algerian Yellow Taxi
    const taxiMesh = this.vehicleGen.createCartoonCar(40, -2.2, -Math.PI / 2, 0xf1c40f, true);
    this.vehicles.push({
      id: 'taxi_1',
      type: 'taxi',
      mesh: taxiMesh,
      circuit: this.circuits.eastWest,
      waypointIdx: 10,
      speed: 4.5,
      baseSpeed: 4.5,
      heading: -Math.PI / 2,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });

    // 4. City Bus
    const busMesh = this.vehicleGen.createCartoonBus(2.2, 35, Math.PI);
    this.vehicles.push({
      id: 'bus_1',
      type: 'bus',
      mesh: busMesh,
      circuit: this.circuits.northSouth,
      waypointIdx: 10,
      speed: 3.8,
      baseSpeed: 3.8,
      heading: Math.PI,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });

    // 5. Citizen Compact Car (Cyan)
    const carMesh = this.vehicleGen.createCartoonCar(-42, -20, 0, 0x0984e3, false);
    this.vehicles.push({
      id: 'car_citizen',
      type: 'car',
      mesh: carMesh,
      circuit: this.circuits.perimeter,
      waypointIdx: 0,
      speed: 4.2,
      baseSpeed: 4.2,
      heading: 0,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });
  }

  update(dt, elapsed, playerPos) {
    // 1. Update Traffic Lights cycle (10 seconds NS green, 10 seconds EW green)
    this.lightCycleTimer += dt;
    if (this.lightCycleTimer > 12.0) {
      this.lightCycleTimer = 0;
      this.currentLightPhase = this.currentLightPhase === 'NS_GREEN' ? 'EW_GREEN' : 'NS_GREEN';
    }

    // 2. Update each vehicle in the traffic simulation
    for (let i = 0; i < this.vehicles.length; i++) {
      this.updateVehicle(this.vehicles[i], dt, elapsed, playerPos, i);
    }
    this.syncFootprints();
  }

  updateVehicle(veh, dt, elapsed, playerPos, index) {
    const mesh = veh.mesh;
    const targetWp = veh.circuit[veh.waypointIdx];
    const currentPos = mesh.position;

    // A. Emergency Siren Visual Flash for Police & Fire Truck
    if (mesh.userData.isPolice) {
      const flash = Math.sin(elapsed * 12) > 0;
      mesh.userData.redPod.material.color.setHex(flash ? 0xff0000 : 0x440000);
      mesh.userData.bluePod.material.color.setHex(!flash ? 0x0099ff : 0x001144);
    } else if (mesh.userData.isFireTruck) {
      const flash = Math.sin(elapsed * 10) > 0;
      mesh.userData.sirenL.material.color.setHex(flash ? 0x0099ff : 0x002255);
      mesh.userData.sirenR.material.color.setHex(!flash ? 0xffcc00 : 0x443300);
    }

    const fwd = new THREE.Vector3(Math.sin(veh.heading), 0, Math.cos(veh.heading));
    const lateralOf = (rx, rz) => Math.abs(rx * fwd.z - rz * fwd.x);
    let targetSpeed = veh.baseSpeed;
    // Highest speed that still stops 'gap' metres before something 'd' metres ahead (comfortable braking)
    const brakeFor = (d, gap) => { targetSpeed = Math.min(targetSpeed, Math.sqrt(Math.max(0, 2 * 4.5 * (d - gap)))); };

    // B. Red lights: stop before the crosswalk that the light protects (approaching or leaving the roundabout)
    for (const tl of this.trafficLights) {
      const isRed = (tl.orientation === 'NS' && this.currentLightPhase !== 'NS_GREEN') ||
                    (tl.orientation === 'EW' && this.currentLightPhase !== 'EW_GREEN');
      if (!isRed) continue;
      const ns = tl.orientation === 'NS';
      const along = ns ? fwd.z : fwd.x;
      if (Math.abs(along) < 0.7) continue;
      if ((ns ? Math.abs(currentPos.x) : Math.abs(currentPos.z)) > 5) continue;
      const s = Math.sign(along);
      const crossing = 16 * Math.sign(ns ? tl.stopLineZ : tl.stopLineX);
      const nearEdge = crossing - s * 1.5;
      const d = (nearEdge - (ns ? currentPos.z : currentPos.x)) * s;
      if (d > 1.5 && d < 25) brakeFor(d, 2.6);
    }

    // C/D. People ahead: anyone on a crossing near our path, or anyone standing in our lane (player,
    // pedestrians, escorted NPCs). Distances are measured from the bumper, so long vehicles stop in time.
    const front = veh.hl || 2;
    let personBlock = false;
    const checkPerson = (pp, crossing) => {
      const rx = pp.x - currentPos.x, rz = pp.z - currentPos.z;
      const ahead = rx * fwd.x + rz * fwd.z;
      if (ahead <= 0 || ahead > front + 16) return;
      const lat = lateralOf(rx, rz);
      if (lat < (crossing ? 3.5 : (veh.hw || 1) + 0.8)) {
        const before = targetSpeed;
        brakeFor(ahead, front + 1.6);
        if (targetSpeed < 0.5 && before >= 0.5 && ahead < front + 6) personBlock = true;
      }
    };
    if (this.pedestriansRef && this.pedestriansRef.pedestrians) {
      for (const ped of this.pedestriansRef.pedestrians) {
        checkPerson(ped.group ? ped.group.position : ped.mesh.position, ped.isCrossing);
      }
    }
    if (this.extraCrossers) for (const pp of this.extraCrossers()) checkPerson(pp, true);
    if (playerPos && !(this.playerIsVehicle && this.playerIsVehicle())) checkPerson(playerPos, false);

    // Short, polite horn if someone keeps blocking the lane (never repeated quickly)
    veh.hornCooldown = Math.max(0, (veh.hornCooldown || 0) - dt);
    veh.blockedTime = personBlock && veh.speed < 0.4 ? (veh.blockedTime || 0) + dt : 0;
    if (veh.blockedTime > 2.5 && veh.hornCooldown <= 0) {
      veh.hornCooldown = 10;
      veh.blockedTime = 0;
      const dist = playerPos ? playerPos.distanceTo(currentPos) : Infinity;
      if (dist < 40) audio.playHorn(Math.max(0.15, 1 - dist / 40), veh.type === 'bus' || veh.type === 'fire');
    }

    // E. Car following: keep a gap to vehicles ahead in our path; ignore oncoming cars in the other lane
    for (let j = 0; j < this.vehicles.length; j++) {
      if (j === index) continue;
      const other = this.vehicles[j];
      const op = other.mesh.position;
      const rx = op.x - currentPos.x, rz = op.z - currentPos.z;
      const ahead = rx * fwd.x + rz * fwd.z;
      if (ahead <= 0 || ahead > 22) continue;
      const lat = lateralOf(rx, rz);
      const sameDir = fwd.x * Math.sin(other.heading) + fwd.z * Math.cos(other.heading);
      if ((sameDir > -0.3 && lat < 1.9) || lat < 1.1) brakeFor(ahead, 5.5);
    }
    // ...including the player's own car (moving or parked on the road)
    if (this.extraVehicles) {
      for (const o of this.extraVehicles()) {
        const rx = o.x - currentPos.x, rz = o.z - currentPos.z;
        const ahead = rx * fwd.x + rz * fwd.z;
        if (ahead <= 0 || ahead > 22) continue;
        if (lateralOf(rx, rz) < (veh.hw || 1) + o.hw + 0.3) brakeFor(ahead, front + o.hl + 1.2);
      }
    }

    // F. Roundabout: give way to vehicles already circulating before entering
    const r = Math.hypot(currentPos.x, currentPos.z);
    if (r > 9.5 && r < 16) {
      const inward = -(currentPos.x * fwd.x + currentPos.z * fwd.z) / r;
      if (inward > 0.5) {
        for (let j = 0; j < this.vehicles.length; j++) {
          if (j === index) continue;
          const op = this.vehicles[j].mesh.position;
          if (Math.hypot(op.x, op.z) < 9.8 && op.distanceTo(currentPos) < 11) { brakeFor(r - 10.5, 0); break; }
        }
      }
    }

    // G0. Steering target and curve speed (slow down for bends and U-turns)
    if (currentPos.distanceTo(targetWp) < 2.5) {
      veh.waypointIdx = (veh.waypointIdx + 1) % veh.circuit.length;
    }
    const wp = veh.circuit[veh.waypointIdx];
    const dir = wp.clone().sub(currentPos);
    dir.y = 0;
    dir.normalize();
    const targetHeading = Math.atan2(dir.x, dir.z);
    let angleDiff = targetHeading - veh.heading;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    targetSpeed = Math.min(targetSpeed, veh.baseSpeed * (1 - Math.min(0.7, Math.abs(angleDiff) * 0.9)));

    // Physical acceleration / braking
    const rate = targetSpeed > veh.speed ? 2.4 : 7.5;
    veh.speed += THREE.MathUtils.clamp(targetSpeed - veh.speed, -rate * dt, rate * dt);

    // Turn rate limited like a real car (can still turn slowly when nearly stopped)
    const maxTurn = (0.7 + veh.speed * 0.3) * dt;
    veh.heading += THREE.MathUtils.clamp(angleDiff, -maxTurn, maxTurn);
    mesh.rotation.y = veh.heading;

    // Move forward
    const forwardVec = new THREE.Vector3(Math.sin(veh.heading), 0, Math.cos(veh.heading));
    mesh.position.add(forwardVec.multiplyScalar(veh.speed * dt));

    // G. Stuck Detection & Recovery
    if (veh.speed > 0.5) {
      const movedDist = currentPos.distanceTo(veh.lastPos);
      if (movedDist < 0.1 * dt) {
        veh.stuckTimer += dt;
        if (veh.stuckTimer > 3.0) {
          // Nudge forward or advance waypoint to unfreeze
          veh.waypointIdx = (veh.waypointIdx + 1) % veh.circuit.length;
          mesh.position.add(new THREE.Vector3(dir.x * 0.5, 0, dir.z * 0.5));
          veh.stuckTimer = 0;
        }
      } else {
        veh.stuckTimer = 0;
      }
    }
    veh.lastPos.copy(currentPos);
  }
}
