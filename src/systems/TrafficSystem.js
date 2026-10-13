import * as THREE from 'three';
import { CartoonVehicleGenerator } from './visuals/CartoonVehicleGenerator.js';

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
        new THREE.Vector3(18, 0, 2.2),
        new THREE.Vector3(62, 0, 2.2),
        // Turn around loop
        new THREE.Vector3(62, 0, -2.2),
        new THREE.Vector3(18, 0, -2.2),
        new THREE.Vector3(-18, 0, -2.2),
        new THREE.Vector3(-62, 0, -2.2)
      ],
      // Loop 2: North-South Boulevard Circuit
      northSouth: [
        new THREE.Vector3(2.2, 0, -62),
        new THREE.Vector3(2.2, 0, -18),
        new THREE.Vector3(2.2, 0, 18),
        new THREE.Vector3(2.2, 0, 62),
        // Turn around loop
        new THREE.Vector3(-2.2, 0, 62),
        new THREE.Vector3(-2.2, 0, 18),
        new THREE.Vector3(-2.2, 0, -18),
        new THREE.Vector3(-2.2, 0, -62)
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
      waypointIdx: 0,
      speed: 4.8,
      baseSpeed: 4.8,
      heading: Math.PI / 2,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });

    // 2. Civil Protection Fire Truck (drives on Perimeter / NS)
    const fireMesh = this.vehicleGen.createFireTruck(2.2, -40, 0);
    this.vehicles.push({
      id: 'fire_truck',
      type: 'fire',
      mesh: fireMesh,
      circuit: this.circuits.northSouth,
      waypointIdx: 0,
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
      waypointIdx: 5,
      speed: 4.5,
      baseSpeed: 4.5,
      heading: -Math.PI / 2,
      stuckTimer: 0,
      lastPos: new THREE.Vector3()
    });

    // 4. City Bus
    const busMesh = this.vehicleGen.createCartoonBus(-2.2, 35, Math.PI);
    this.vehicles.push({
      id: 'bus_1',
      type: 'bus',
      mesh: busMesh,
      circuit: this.circuits.northSouth,
      waypointIdx: 5,
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

    // B. Check Traffic Light Obstacle
    let shouldStopForLight = false;
    for (const tl of this.trafficLights) {
      const isRed = (tl.orientation === 'NS' && this.currentLightPhase !== 'NS_GREEN') ||
                    (tl.orientation === 'EW' && this.currentLightPhase !== 'EW_GREEN');

      if (isRed) {
        const distToLight = currentPos.distanceTo(tl.pos);
        if (distToLight < 8.5) {
          // If approaching stop line
          const toLightVec = tl.pos.clone().sub(currentPos);
          const fwdVec = new THREE.Vector3(Math.sin(veh.heading), 0, Math.cos(veh.heading));
          if (toLightVec.dot(fwdVec) > 0) {
            shouldStopForLight = true;
            break;
          }
        }
      }
    }

    // C. Check Pedestrians Crossing
    let shouldStopForPedestrian = false;
    if (this.pedestriansRef && this.pedestriansRef.pedestrians) {
      for (const ped of this.pedestriansRef.pedestrians) {
        if (ped.isCrossing) {
          const pedPos = ped.group ? ped.group.position : (ped.mesh ? ped.mesh.position : null);
          if (pedPos) {
            const distToPed = currentPos.distanceTo(pedPos);
            if (distToPed < 6.5) {
              shouldStopForPedestrian = true;
              break;
            }
          }
        }
      }
    }

    // D. Check Player in Road Path
    let shouldStopForPlayer = false;
    if (playerPos) {
      const distToPlayer = currentPos.distanceTo(playerPos);
      if (distToPlayer < 4.5) {
        const toPlayerVec = playerPos.clone().sub(currentPos);
        const fwdVec = new THREE.Vector3(Math.sin(veh.heading), 0, Math.cos(veh.heading));
        if (toPlayerVec.dot(fwdVec) > 0.5) {
          shouldStopForPlayer = true;
        }
      }
    }

    // E. Check Safe Distance to Leading Vehicle
    let shouldStopForLeadingCar = false;
    for (let j = 0; j < this.vehicles.length; j++) {
      if (j === index) continue;
      const other = this.vehicles[j];
      const distToOther = currentPos.distanceTo(other.mesh.position);
      if (distToOther < 6.0) {
        const toOtherVec = other.mesh.position.clone().sub(currentPos);
        const fwdVec = new THREE.Vector3(Math.sin(veh.heading), 0, Math.cos(veh.heading));
        if (toOtherVec.dot(fwdVec) > 0.6) {
          shouldStopForLeadingCar = true;
          break;
        }
      }
    }

    // Determine target speed
    let targetSpeed = veh.baseSpeed;
    if (shouldStopForLight || shouldStopForPedestrian || shouldStopForPlayer || shouldStopForLeadingCar) {
      targetSpeed = 0;
    }

    // Smooth acceleration / deceleration
    veh.speed = THREE.MathUtils.lerp(veh.speed, targetSpeed, Math.min(1.0, dt * 5.0));

    // F. Navigation along waypoints
    const distToWp = currentPos.distanceTo(targetWp);
    if (distToWp < 2.5) {
      // Advance to next waypoint in circuit
      veh.waypointIdx = (veh.waypointIdx + 1) % veh.circuit.length;
    }

    // Steer towards target waypoint
    const dir = targetWp.clone().sub(currentPos).normalize();
    const targetHeading = Math.atan2(dir.x, dir.z);

    let angleDiff = targetHeading - veh.heading;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    veh.heading += angleDiff * Math.min(1.0, dt * 4.0);
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
