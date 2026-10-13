import * as THREE from 'three';
import missionsData from '../data/missions.json';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export const MissionStatus = {
  NOT_STARTED: 'لم تبدأ',
  IN_PROGRESS: 'جارية',
  NEED_INFO: 'تحتاج لمعلومات إضافية',
  COMPLETED: 'اكتملت',
  FAILED: 'فشلت'
};

export class MissionSystem {
  constructor(engine, worldBuilder, progression, playerController) {
    this.engine = engine;
    this.worldBuilder = worldBuilder;
    this.progression = progression;
    this.player = playerController;

    this.currentMissionIndex = 0;
    this.currentProgress = 0;
    this.missionStatus = MissionStatus.NOT_STARTED;

    this.trashMeshes = [];
    this.fireMeshGroup = null;
    this.wateredTrees = new Set();
    this.plantedSpots = new Set();

    this.initMissions();
  }

  initMissions() {
    this.spawnTrash();
    this.createFireEmergencyVisual();
    this.setupListeners();
  }

  setupListeners() {
    events.on('NPC_QUESTION_SOLVED', (npcData) => {
      this.checkNPCMissionProgress(npcData);
    });

    events.on('MISSION_BRANCH_COMPLETED', ({ missionId }) => {
      const cur = this.getCurrentMission();
      if (cur.id === missionId) {
        this.currentProgress = cur.target;
        this.missionStatus = MissionStatus.COMPLETED;
        this.completeCurrentMission();
      }
    });

    events.on('STORY_ACTION_TRIGGERED', ({ action }) => {
      if (action === 'RECKLESS_UNDERCOVER') {
        this.missionStatus = MissionStatus.FAILED;
        events.emit('MISSION_FAILED', {
          mission: this.getCurrentMission(),
          reason: 'لقد كشفك المشتبه به! التظاهر بالطلب يعرضك للخطر والقانون يحذر منه. التحقيق من اختصاص الشرطة.'
        });
      } else if (action === 'GO_TO_POLICE') {
        this.missionStatus = MissionStatus.NEED_INFO;
      }
    });
  }

  getCurrentMission() {
    const list = missionsData.missions;
    return list[Math.min(this.currentMissionIndex, list.length - 1)];
  }

  spawnTrash() {
    const trashPositions = [
      [-6, 0, 4],
      [8, 0, 10],
      [-14, 0, -5],
      [16, 0, -4],
      [-18, 0, 16],
      [4, 0, -18],
      [-24, 0, 4]
    ];

    const colors = [0xe74c3c, 0xf39c12, 0x3498db, 0x9b59b6];

    trashPositions.forEach(([x, y, z]) => {
      const group = new THREE.Group();
      group.position.set(x, 0.18, z);

      // Stylized recycling soda can / cardboard box
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.36, 0.36),
        new THREE.MeshLambertMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
      );
      box.castShadow = true;
      group.add(box);

      // Green recycling icon badge
      const icon = new THREE.Mesh(
        new THREE.PlaneGeometry(0.26, 0.26),
        new THREE.MeshBasicMaterial({ color: 0x2ecc71, side: THREE.DoubleSide })
      );
      icon.rotation.x = -Math.PI / 2;
      icon.position.y = 0.2;
      group.add(icon);

      group.userData = { isTrash: true, collected: false };
      this.engine.scene.add(group);
      this.trashMeshes.push(group);
    });
  }

  createFireEmergencyVisual() {
    // Stylized controlled fire emergency indicator near bakery back alley
    const fireGroup = new THREE.Group();
    fireGroup.position.set(-24, 0.2, 28);
    fireGroup.visible = false; // Becomes visible when fire mission is active

    // Red warning hazard marker ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.4, 16),
      new THREE.MeshBasicMaterial({ color: 0xe74c3c, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    fireGroup.add(ring);

    // Stylized orange/yellow flame cluster
    const flameGeo = new THREE.ConeGeometry(0.35, 0.8, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf39c12 });
    for (let i = 0; i < 4; i++) {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(Math.cos(i * 1.5) * 0.3, 0.4, Math.sin(i * 1.5) * 0.3);
      fireGroup.add(flame);
    }

    // Smoke puff (soft grey sphere)
    const smokeMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, transparent: true, opacity: 0.7 });
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), smokeMat);
    smoke.position.set(0, 1.2, 0);
    fireGroup.add(smoke);

    this.engine.scene.add(fireGroup);
    this.fireMeshGroup = fireGroup;
  }

  update(dt, playerPosition) {
    const mission = this.getCurrentMission();
    const elapsed = Date.now() * 0.002;

    if (this.missionStatus === MissionStatus.NOT_STARTED) {
      this.missionStatus = MissionStatus.IN_PROGRESS;
    }

    // Toggle Fire Visuals
    if (this.fireMeshGroup) {
      if (mission.id === 'mission_5' && this.missionStatus !== MissionStatus.COMPLETED) {
        this.fireMeshGroup.visible = true;
        this.fireMeshGroup.rotation.y += dt * 1.5;
        this.fireMeshGroup.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.12);
      } else {
        this.fireMeshGroup.visible = false;
      }
    }

    // 1. Mission 1: Collect Trash
    if (mission.type === 'collect_trash') {
      this.trashMeshes.forEach((trash, i) => {
        if (!trash.userData.collected) {
          trash.rotation.y += dt * 2.0;
          trash.position.y = 0.22 + Math.sin(elapsed * 2 + i) * 0.08;

          if (playerPosition.distanceTo(trash.position) < 1.7) {
            this.collectTrash(trash);
          }
        }
      });
    }

    // 2. Mission 2: Plant Trees
    if (mission.type === 'plant_trees') {
      this.worldBuilder.plantSpots.forEach(spot => {
        if (!spot.isPlanted && playerPosition.distanceTo(spot.position) < 2.0) {
          this.plantTree(spot);
        }
      });
    }

    // 3. Mission 3: Water Trees
    if (mission.type === 'water_trees') {
      this.worldBuilder.plantSpots.forEach(spot => {
        if (spot.isPlanted && !spot.isWatered && playerPosition.distanceTo(spot.position) < 2.2) {
          this.waterTree(spot);
        }
      });
    }
  }

  collectTrash(trashMesh) {
    trashMesh.userData.collected = true;
    trashMesh.visible = false;
    audio.playTrashCollect();
    this.player.triggerAction('pickup', 0.8);

    this.currentProgress++;
    this.progression.addXP(15);
    this.progression.addCoins(5);

    events.emit('FLOAT_TEXT', {
      position: trashMesh.position,
      text: '+15 XP ♻️ تم جمع وفرز النفايات!',
      color: '#2ecc71'
    });

    const mission = this.getCurrentMission();
    events.emit('MISSION_UPDATED', {
      mission,
      progress: this.currentProgress,
      target: mission.target,
      status: this.missionStatus
    });

    if (this.currentProgress >= mission.target) {
      this.completeCurrentMission();
    }
  }

  plantTree(spot) {
    spot.isPlanted = true;
    audio.playPlantTree();
    this.player.triggerAction('plant', 1.2);

    const treeGroup = new THREE.Group();
    treeGroup.position.copy(spot.position);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 1.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x795548 })
    );
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2.2, 7),
      new THREE.MeshLambertMaterial({ color: 0x8b7d3b })
    );
    foliage.position.y = 2.4;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    spot.treeMesh = treeGroup;
    spot.foliageMesh = foliage;
    this.engine.scene.add(treeGroup);

    this.currentProgress++;
    this.progression.addXP(25);
    this.progression.addCoins(10);

    events.emit('FLOAT_TEXT', {
      position: spot.position,
      text: '🌱 تمت زراعة الشتلة!',
      color: '#27ae60'
    });

    const mission = this.getCurrentMission();
    events.emit('MISSION_UPDATED', {
      mission,
      progress: this.currentProgress,
      target: mission.target,
      status: this.missionStatus
    });

    if (this.currentProgress >= mission.target) {
      this.completeCurrentMission();
    }
  }

  waterTree(spot) {
    if (this.progression.water <= 0) {
      events.emit('TOAST', '💧 نفد الماء! يمكنك التزود من نافورة الحديقة أو المسجد.');
      return;
    }

    this.progression.consumeWater(1);
    spot.isWatered = true;
    audio.playWaterTree();
    this.player.triggerAction('water', 1.2);

    if (spot.foliageMesh) {
      spot.foliageMesh.material.color.setHex(0x2ecc71);
    }

    this.currentProgress++;
    this.progression.addXP(30);
    this.progression.addCoins(15);

    events.emit('FLOAT_TEXT', {
      position: spot.position,
      text: '💧 ارتوت الشجرة وازدهرت!',
      color: '#3498db'
    });

    const mission = this.getCurrentMission();
    events.emit('MISSION_UPDATED', {
      mission,
      progress: this.currentProgress,
      target: mission.target,
      status: this.missionStatus
    });

    if (this.currentProgress >= mission.target) {
      this.completeCurrentMission();
    }
  }

  checkNPCMissionProgress(npcData) {
    const mission = this.getCurrentMission();
    if ((mission.type === 'visit_npc' || mission.type === 'traffic_safety') && mission.targetNPC === npcData.id) {
      this.currentProgress = 1;
      this.missionStatus = MissionStatus.COMPLETED;
      events.emit('MISSION_UPDATED', {
        mission,
        progress: this.currentProgress,
        target: mission.target,
        status: this.missionStatus
      });
      this.completeCurrentMission();
    }
  }

  completeCurrentMission() {
    const mission = this.getCurrentMission();
    this.missionStatus = MissionStatus.COMPLETED;
    audio.playMissionComplete();
    this.player.triggerAction('celebrate', 2.0);

    this.progression.addXP(mission.rewardXP);
    this.progression.addCoins(mission.rewardCoins);
    this.progression.addWater(mission.rewardWater);

    events.emit('MISSION_COMPLETED', {
      mission,
      message: mission.completeMessage
    });

    if (mission.badgeUnlocked) {
      events.emit('UNLOCK_ACHIEVEMENT', mission.badgeUnlocked);
    }
  }

  advanceToNextMission() {
    this.currentMissionIndex = Math.min(this.currentMissionIndex + 1, missionsData.missions.length - 1);
    this.currentProgress = 0;
    this.missionStatus = MissionStatus.NOT_STARTED;

    const nextMission = this.getCurrentMission();
    events.emit('MISSION_UPDATED', {
      mission: nextMission,
      progress: 0,
      target: nextMission.target,
      status: this.missionStatus
    });

    events.emit('TOAST', `📋 بدأت المهمة: ${nextMission.title}`);
  }

  loadState(saved) {
    if (!saved) return;
    if (typeof saved.missionIndex === 'number') {
      this.currentMissionIndex = saved.missionIndex;
      this.currentProgress = saved.missionProgress || 0;
      this.missionStatus = saved.missionStatus || MissionStatus.IN_PROGRESS;
      const cur = this.getCurrentMission();
      events.emit('MISSION_UPDATED', {
        mission: cur,
        progress: this.currentProgress,
        target: cur.target,
        status: this.missionStatus
      });
    }
  }
}
