import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { InputManager } from './core/InputManager.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { WorldBuilder } from './systems/WorldBuilder.js';
import { PlayerController } from './systems/PlayerController.js';
import { NPCSystem } from './systems/NPCSystem.js';
import { ProgressionSystem } from './systems/ProgressionSystem.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { QuestionSystem } from './systems/QuestionSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { EnvironmentSystem } from './systems/EnvironmentSystem.js';
import { MapSystem } from './systems/MapSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { UISystem } from './systems/UISystem.js';
import { DialogueSystem } from './systems/DialogueSystem.js';
import { TrafficSystem } from './systems/TrafficSystem.js';
import { PedestrianSystem } from './systems/PedestrianSystem.js';
import { InteriorSystem } from './systems/InteriorSystem.js';

class GhirassGameApp {
  constructor() {
    this.isGameActive = false;

    // 1. Core Engine & Input
    this.engine = new Engine('game-canvas');
    this.input = new InputManager();
    this.input.setEnabled(false); // Disabled until character is confirmed

    // 2. Systems
    this.collisionSystem = new CollisionSystem();
    this.worldBuilder = new WorldBuilder(this.engine, this.collisionSystem);
    this.collisionSystem.buildWalkables(this.engine.scene);
    this.player = new PlayerController(this.engine, this.collisionSystem, this.input);
    this.npcSystem = new NPCSystem(this.engine, this.collisionSystem);

    this.progression = new ProgressionSystem();
    this.missionSystem = new MissionSystem(this.engine, this.worldBuilder, this.progression, this.player);
    this.dialogueSystem = new DialogueSystem(this.missionSystem);
    this.trafficSystem = new TrafficSystem(this.engine, this.collisionSystem, this.worldBuilder);
    this.pedestrianSystem = new PedestrianSystem(this.engine, this.collisionSystem);
    this.trafficSystem.setPedestrianSystem(this.pedestrianSystem);

    this.questionSystem = new QuestionSystem(this.progression);
    this.achievementSystem = new AchievementSystem();
    this.environment = new EnvironmentSystem(this.engine, this.worldBuilder);
    this.mapSystem = new MapSystem(this.engine);
    this.saveSystem = new SaveSystem();

    // 3. UI
    this.ui = new UISystem(this);
    this.interiors = new InteriorSystem(this.engine, this.collisionSystem, this.player, this.ui);

    // Mission objectives can point at NPCs and building entrances
    this.missionSystem.npcLookup = (id) => {
      const n = this.npcSystem.npcInstances.find(n => n.data.id === id);
      return n ? n.group.position : null;
    };
    this.missionSystem.doorLookup = (id) => {
      const l = this.interiors.landmarks.find(l => l.id === id);
      return l ? l.door : null;
    };
    this.missionSystem.isInside = () => this.interiors.isInside();
    this.missionSystem.npcSystem = this.npcSystem;
    this.missionSystem.lightPhase = () => this.trafficSystem.currentLightPhase;
    this.missionSystem.setHint = (html) => this.ui.setCustomHint(html, 'mission');
    this.trafficSystem.extraCrossers = () => this.missionSystem.getEscortPositions();
    this.missionSystem.emitUpdate();

    // Pedestrians steer around NPCs who stand still on the sidewalks
    this.pedestrianSystem.setObstacleProvider(() => [
      ...this.npcSystem.npcInstances.map(n => n.group.position),
      ...this.npcSystem.childNPCs.map(k => k.group.position)
    ]);

    this.setupInputHandlers();

    // 4. Register updatables
    this.engine.addUpdatable(this);

    // 5. Start engine loop
    this.engine.start();
  }

  setupInputHandlers() {
    // E to interact
    this.input.onInteract = () => {
      if (this.interiors.tryInteract()) return;
      const nearNPC = this.npcSystem.getNearNPC();
      if (nearNPC) {
        // Mission givers (association) and "talk to" objectives are handled by the mission system
        if (this.missionSystem.handleNPCInteraction(nearNPC)) return;
        this.ui.openDialogue(nearNPC);
      }
    };

    // M to toggle full map
    this.input.onMapToggle = () => {
      this.mapSystem.toggleFullMap();
    };

    // Escape for pause menu
    this.input.onEscape = () => {
      if (this.ui.dialogOverlay.classList.contains('show')) {
        this.ui.closeDialogue();
      } else if (this.ui.questionOverlay.classList.contains('show')) {
        this.ui.closeQuestion();
      } else if (this.mapSystem.isFullMapOpen) {
        this.mapSystem.toggleFullMap();
      } else if (this.ui.achievementsModal.classList.contains('show')) {
        this.ui.achievementsModal.classList.remove('show');
        this.input.setEnabled(true);
      } else if (this.isGameActive) {
        if (this.ui.pauseModal.classList.contains('show')) {
          this.ui.closePauseModal();
        } else {
          this.ui.openPauseModal();
        }
      }
    };
  }

  update(dt, elapsed) {
    // Animate city props & water
    this.worldBuilder.update(dt, elapsed);

    // Update dynamic vehicles and pedestrian crowd
    this.trafficSystem.update(dt, elapsed, this.player ? this.player.position : null);
    this.pedestrianSystem.update(dt, this.player ? this.player.position : null);

    if (this.isGameActive) {
      // Update player
      this.player.update(dt);

      // Update NPCs
      this.npcSystem.update(dt, this.player.position);

      this.interiors.update();

      // Update Missions
      this.missionSystem.update(dt, this.player.position);

      // Update Maps
      this.mapSystem.update(this.player.position, this.player.heading);
    } else {
      // In character select / menus: showcase character in center
      if (this.player && this.player.group) {
        this.player.group.rotation.y = Math.sin(elapsed * 1.1) * 0.45;
        this.player.model.update(dt, { isMoving: false, speedRatio: 0, isJumping: false });

        // Frame camera right on player for 3D character showcase
        const charLookAt = this.player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const previewCamPos = this.player.position.clone().add(new THREE.Vector3(0, 1.15, 2.6));
        this.engine.camera.position.lerp(previewCamPos, Math.min(1.0, 10.0 * dt));
        this.engine.camera.lookAt(charLookAt);
      }
    }
  }

  saveCurrentGame() {
    const data = {
      gender: this.ui.selectedGender,
      progression: this.progression.getState(),
      missionIndex: this.missionSystem.currentMissionIndex,
      missionProgress: this.missionSystem.currentProgress,
      achievements: this.achievementSystem.getState(),
      timeOfDay: this.environment.timeOfDay
    };
    this.saveSystem.saveGame(data);
  }

  loadSavedGame() {
    const data = this.saveSystem.loadGame();
    if (!data) return;

    if (data.gender) {
      this.ui.selectedGender = data.gender;
      this.player.switchGender(data.gender);
    }
    if (data.progression) {
      this.progression.loadState(data.progression);
    }
    if (typeof data.missionIndex === 'number') {
      this.missionSystem.loadState({
        missionIndex: data.missionIndex,
        missionProgress: data.missionProgress
      });
    }
    if (data.achievements) {
      this.achievementSystem.loadState(data.achievements);
    }
    if (typeof data.timeOfDay === 'number') {
      this.environment.setTimeOfDay(data.timeOfDay);
    }

    this.ui.startGameSession();
    this.ui.showToast('📂 تم استرجاع تقدمك السابق بنجاح!');
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GhirassGameApp();
});
