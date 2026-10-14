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
        new THREE.Vector3(-6.8, 0, 6.8),
        new THREE.Vector3(-6.8, 0, 16), // Around the roundabout via the boulevard zebra
        new THREE.Vector3(6.8, 0, 16),
        new THREE.Vector3(6.8, 0, 6.8),
        new THREE.Vector3(16, 0, 6.8),
        new THREE.Vector3(16, 0, -6.8), // Cross back
        new THREE.Vector3(55, 0, -6.8)
      ],
      // Avenue Promenade South
      [
        new THREE.Vector3(55, 0, 6.8),
        new THREE.Vector3(16, 0, 6.8),
        new THREE.Vector3(6.8, 0, 6.8),
        new THREE.Vector3(6.8, 0, 16),
        new THREE.Vector3(-6.8, 0, 16),
        new THREE.Vector3(-6.8, 0, 6.8),
        new THREE.Vector3(-16, 0, 6.8),
        new THREE.Vector3(-55, 0, 6.8)
      ],
      // Boulevard Promenade West
      [
        new THREE.Vector3(-6.8, 0, -55),
        new THREE.Vector3(-6.8, 0, -6.8),
        new THREE.Vector3(-16, 0, -6.8),
        new THREE.Vector3(-16, 0, 6.8), // Cross the avenue at the zebra
        new THREE.Vector3(-6.8, 0, 6.8),
        new THREE.Vector3(-6.8, 0, 55)
      ],
      // Boulevard Promenade East
      [
        new THREE.Vector3(6.8, 0, 55),
        new THREE.Vector3(6.8, 0, 6.8),
        new THREE.Vector3(16, 0, 6.8),
        new THREE.Vector3(16, 0, -6.8), // Cross the avenue at the zebra
        new THREE.Vector3(6.8, 0, -6.8),
        new THREE.Vector3(6.8, 0, -55)
      ]
    ];
  }

  spawnPedestrians() {
    const crowd = [
      { type: 'girl_green', routeIdx: 0, startWp: 0, speed: 2.1, role: 'student_girl', options: { primaryColor: 0xe67e22, secondaryColor: 0x34495e, shoeColor: 0xecf0f1 } },
      { type: 'boy_purple', routeIdx: 1, startWp: 1, speed: 2.2, role: 'student_boy', options: { primaryColor: 0x2e86c1, secondaryColor: 0x2d3436, shoeColor: 0xe74c3c } },
      { type: 'npc_adult', routeIdx: 1, startWp: 4, speed: 1.5, role: 'citizen_woman', options: { isNPC: true, gender: 'female', primaryColor: 0x6d4c7d, hijabColor: 0xe8dcc8, npcRole: 'citizen' } },
      { type: 'npc_adult', routeIdx: 3, startWp: 3, speed: 1.6, role: 'citizen_woman', options: { isNPC: true, gender: 'female', primaryColor: 0x2f5d62, hijabColor: 0x1f2a36, skinColor: 0xdcae8c, npcRole: 'citizen' } },
      { type: 'npc_adult', routeIdx: 2, startWp: 4, speed: 1.75, role: 'citizen', options: { isNPC: true, primaryColor: 0xf0ece2, secondaryColor: 0x5d4037, skinColor: 0xc99872, npcRole: 'citizen' } },
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

  setObstacleProvider(fn) {
    this.obstacleProvider = fn;
  }

  update(dt, playerPos) {
    // Everyone a pedestrian must walk around this frame
    const obstacles = this.pedestrians.map(p => ({ pos: p.group.position, radius: 0.35, moving: true, ped: p }));
    if (this.obstacleProvider) this.obstacleProvider().forEach(pos => obstacles.push({ pos, radius: 0.45, moving: false }));
    if (playerPos) obstacles.push({ pos: playerPos, radius: 0.4, moving: true });
    this.frameObstacles = obstacles;

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

    // A. Waypoint navigation
    if (currentPos.distanceTo(targetWp) < 1.4) {
      ped.wpIdx += ped.forwardDir;
      if (ped.wpIdx >= ped.route.length) {
        ped.forwardDir = -1;
        ped.wpIdx = ped.route.length - 2;
      } else if (ped.wpIdx < 0) {
        ped.forwardDir = 1;
        ped.wpIdx = 1;
      }
    }
    const target = ped.route[ped.wpIdx];
    const dir = target.clone().sub(currentPos);
    dir.y = 0;
    if (dir.lengthSq() < 1e-4) dir.set(Math.sin(ped.heading), 0, Math.cos(ped.heading));
    dir.normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);

    // B. Look-ahead steering: pass people on the side away from them (keep right when head-on),
    //    plus a small personal-space push so bodies never overlap
    const steer = new THREE.Vector3();
    let speedMult = 1.0;
    for (const o of this.frameObstacles || []) {
      if (o.ped === ped) continue;
      const rx = o.pos.x - currentPos.x;
      const rz = o.pos.z - currentPos.z;
      const d = Math.hypot(rx, rz);
      if (d > 3.2 || d < 1e-4) continue;
      const clearance = 0.75 + o.radius;
      if (d < clearance) {
        const push = (clearance - d) * 3.0 * dt / d;
        currentPos.x -= rx * push;
        currentPos.z -= rz * push;
      }
      const ahead = rx * dir.x + rz * dir.z;
      const lat = rx * right.x + rz * right.z;
      if (ahead > -0.2 && ahead < 3.0 && Math.abs(lat) < clearance) {
        const side = Math.abs(lat) < 0.15 ? 1 : -Math.sign(lat);
        const strength = (1 - ahead / 3.0) * (1 - Math.abs(lat) / clearance) + 0.25;
        steer.addScaledVector(right, side * strength * 1.6);
        if (ahead < 1.0) speedMult = Math.min(speedMult, o.moving ? 0.6 : 0.8);
      }
    }
    const moveDir = dir.clone().add(steer).normalize();

    // C. Turn smoothly and walk, sliding along buildings if blocked
    {
      const targetHeading = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetHeading - ped.heading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      ped.heading += diff * Math.min(1.0, dt * 6.0);
      group.rotation.y = ped.heading;

      const step = ped.speed * speedMult * dt;
      const nextPos = currentPos.clone().addScaledVector(moveDir, step);
      if (!this.collisionSystem.checkCollision(nextPos, 0.35)) {
        currentPos.copy(nextPos);
      } else {
        for (const s of [1, -1]) {
          const slide = currentPos.clone().addScaledVector(dir, step * 0.5).addScaledVector(right, s * step);
          if (!this.collisionSystem.checkCollision(slide, 0.35)) { currentPos.copy(slide); break; }
        }
      }
    }

    this.collisionSystem.pushOutOfVehicles(currentPos, 0.35);

    // Feet on the sidewalk surface (smoothed when stepping off curbs onto crossings)
    const groundY = this.collisionSystem.getGroundHeight(currentPos.x, currentPos.z);
    currentPos.y += (groundY - currentPos.y) * Math.min(1, dt * 15);

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
