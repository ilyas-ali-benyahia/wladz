import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';

/**
 * PedestrianSystem: Dynamic Sidewalk Pedestrians & Safe Crossings
 * - Walk along designated pedestrian sidewalks
 * - Cross strictly at zebra crosswalks
 * - Collision avoidance with player, buildings, and vehicles
 * - Anti-stuck recovery with waypoint redirection
 */
export class PedestrianSystem {
  constructor(engine, collisionSystem) {
    this.engine = engine;
    this.scene = engine.scene;
    this.collisionSystem = collisionSystem;

    this.pedestrians = [];
    this.initSidewalkRoutes();
    this.spawnPedestrians();
  }

  initSidewalkRoutes() {
    // Grand Spacious Sidewalk Corridors (width 5.5 units, center line at 6.8 / -6.8):
    // Route 0: North Sidewalk East-West (z = -6.8)
    // Route 1: South Sidewalk East-West (z = 6.8)
    // Route 2: West Sidewalk North-South (x = -6.8)
    // Route 3: East Sidewalk North-South (x = 6.8)
    // Zebra Crosswalks at: (16, 0), (-16, 0), (0, 16), (0, -16)
    this.routes = [
      // Avenue Promenade North
      [
        new THREE.Vector3(-55, 0, -6.8),
        new THREE.Vector3(-16, 0, -6.8),
        new THREE.Vector3(-16, 0, 6.8), // Cross to south sidewalk at zebra
        new THREE.Vector3(16, 0, 6.8),
        new THREE.Vector3(16, 0, -6.8), // Cross back
        new THREE.Vector3(55, 0, -6.8)
      ],
      // Avenue Promenade South
      [
        new THREE.Vector3(55, 0, 6.8),
        new THREE.Vector3(16, 0, 6.8),
        new THREE.Vector3(-16, 0, 6.8),
        new THREE.Vector3(-55, 0, 6.8)
      ],
      // Boulevard Promenade West
      [
        new THREE.Vector3(-6.8, 0, -55),
        new THREE.Vector3(-6.8, 0, -16),
        new THREE.Vector3(6.8, 0, -16), // Cross at zebra
        new THREE.Vector3(6.8, 0, 16),
        new THREE.Vector3(-6.8, 0, 16), // Cross back
        new THREE.Vector3(-6.8, 0, 55)
      ],
      // Boulevard Promenade East
      [
        new THREE.Vector3(6.8, 0, 55),
        new THREE.Vector3(6.8, 0, 16),
        new THREE.Vector3(-6.8, 0, 16),
        new THREE.Vector3(-6.8, 0, -16),
        new THREE.Vector3(6.8, 0, -16),
        new THREE.Vector3(6.8, 0, -55)
      ]
    ];
  }

  spawnPedestrians() {
    const crowd = [
      { type: 'girl_green', routeIdx: 0, startWp: 0, speed: 2.1, role: 'student_girl' },
      { type: 'boy_purple', routeIdx: 1, startWp: 1, speed: 2.2, role: 'student_boy' },
      { type: 'npc_adult', routeIdx: 0, startWp: 3, speed: 1.7, role: 'citizen', options: { isNPC: true, primaryColor: 0x27ae60, npcRole: 'citizen' } },
      { type: 'npc_adult', routeIdx: 2, startWp: 0, speed: 1.8, role: 'citizen_worker', options: { isNPC: true, primaryColor: 0x2980b9, npcRole: 'citizen' } },
      { type: 'npc_adult', routeIdx: 3, startWp: 1, speed: 1.4, role: 'elderly_citizen', options: { isNPC: true, primaryColor: 0xf5f6fa, secondaryColor: 0x7f8c8d, npcRole: 'elderly_citizen' } }
    ];

    crowd.forEach((c, idx) => {
      const group = new THREE.Group();
      const route = this.routes[c.routeIdx];
      const startPos = route[c.startWp].clone();
      group.position.copy(startPos);

      const model = new CharacterModel(c.type, c.options || {});
      group.add(model.group);
      this.scene.add(group);

      this.pedestrians.push({
        id: `ped_${idx}`,
        group,
        mesh: group,
        model,
        role: c.role,
        route,
        wpIdx: c.startWp,
        forwardDir: 1,
        speed: c.speed,
        baseSpeed: c.speed,
        heading: 0,
        isCrossing: false,
        stuckTimer: 0,
        lastPos: startPos.clone()
      });
    });
  }

  update(dt, playerPos) {
    for (let i = 0; i < this.pedestrians.length; i++) {
      this.updatePedestrian(this.pedestrians[i], dt, playerPos, i);
    }
  }

  updatePedestrian(ped, dt, playerPos, index) {
    const group = ped.group;
    const currentPos = group.position;
    const targetWp = ped.route[ped.wpIdx];

    // Check if on a crosswalk segment
    const isCrossingRoad = (Math.abs(currentPos.z) < 5.0 && (Math.abs(currentPos.x - 16) < 4 || Math.abs(currentPos.x + 16) < 4)) ||
                           (Math.abs(currentPos.x) < 5.0 && (Math.abs(currentPos.z - 16) < 4 || Math.abs(currentPos.z + 16) < 4));
    ped.isCrossing = isCrossingRoad;

    // A. Player avoidance: Yield and step aside if player is nearby
    let speedMult = 1.0;
    if (playerPos) {
      const distToPlayer = currentPos.distanceTo(playerPos);
      if (distToPlayer < 2.4) {
        speedMult = 0.3;
        // Gentle sidestep away from player
        const awayPlayer = currentPos.clone().sub(playerPos);
        awayPlayer.y = 0;
        if (awayPlayer.lengthSq() > 0.01) {
          awayPlayer.normalize().multiplyScalar((2.4 - distToPlayer) * 0.8 * dt);
          currentPos.add(awayPlayer);
        }
      }
    }

    // B. Other pedestrian avoidance: Active social distancing & gentle lateral evasion
    for (let j = 0; j < this.pedestrians.length; j++) {
      if (j === index) continue;
      const other = this.pedestrians[j];
      const dist = currentPos.distanceTo(other.group.position);
      if (dist < 2.0) {
        speedMult = 0.4;
        const away = currentPos.clone().sub(other.group.position);
        away.y = 0;
        if (away.lengthSq() > 0.01) {
          away.normalize().multiplyScalar((2.0 - dist) * 1.0 * dt);
          currentPos.add(away);
        }
        break;
      }
    }

    // C. Waypoint Navigation
    const distToWp = currentPos.distanceTo(targetWp);
    if (distToWp < 1.4) {
      ped.wpIdx += ped.forwardDir;
      if (ped.wpIdx >= ped.route.length) {
        ped.forwardDir = -1;
        ped.wpIdx = ped.route.length - 2;
      } else if (ped.wpIdx < 0) {
        ped.forwardDir = 1;
        ped.wpIdx = 1;
      }
    }

    // Steer towards target waypoint
    const dir = targetWp.clone().sub(currentPos);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      dir.normalize();
      const targetHeading = Math.atan2(dir.x, dir.z);

      let diff = targetHeading - ped.heading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      ped.heading += diff * Math.min(1.0, dt * 6.0);
      group.rotation.y = ped.heading;

      // Move forward along sidewalk
      const moveVec = dir.multiplyScalar(ped.speed * speedMult * dt);
      const nextPos = currentPos.clone().add(moveVec);

      // Check collision with static world buildings
      if (!this.collisionSystem.checkCollision(nextPos, 0.35)) {
        currentPos.copy(nextPos);
      } else {
        // Minor side deviation to slide around obstacles
        const slide = currentPos.clone().add(new THREE.Vector3(-dir.z * 0.1, 0, dir.x * 0.1));
        if (!this.collisionSystem.checkCollision(slide, 0.35)) {
          currentPos.copy(slide);
        }
      }
    }

    // D. Animate character walking model
    ped.model.update(dt, {
      isMoving: speedMult > 0.1,
      speedRatio: ped.speed / 2.0,
      isJumping: false
    });

    // E. Anti-stuck Recovery
    const moved = currentPos.distanceTo(ped.lastPos);
    if (moved < 0.05 * dt) {
      ped.stuckTimer += dt;
      if (ped.stuckTimer > 2.5) {
        // Reverse waypoint direction or nudge away from blockage
        ped.forwardDir = -ped.forwardDir;
        ped.wpIdx = Math.max(0, Math.min(ped.route.length - 1, ped.wpIdx + ped.forwardDir));
        ped.stuckTimer = 0;
      }
    } else {
      ped.stuckTimer = 0;
    }
    ped.lastPos.copy(currentPos);
  }
}
