import * as THREE from 'three';
import npcsData from '../data/npcs.json';
import { CharacterModel } from './CharacterModel.js';
import { events } from '../core/EventBus.js';

export class NPCSystem {
  constructor(engine, collisionSystem) {
    this.engine = engine;
    this.collisionSystem = collisionSystem;
    this.scene = engine.scene;

    this.npcInstances = [];
    this.childNPCs = [];
    this.closestNPC = null;
    this.interactDistance = 3.6;

    this.spawnNPCs();
    this.spawnChildNPCs();
  }

  spawnNPCs() {
    npcsData.npcs.forEach(data => {
      const rootGroup = new THREE.Group();
      rootGroup.position.set(data.position.x, data.position.y, data.position.z);
      rootGroup.userData = data;

      // Color materials parsing
      const primaryHex = parseInt((data.color || '#27ae60').replace('#', '0x'));
      const skinHex = parseInt((data.skinColor || '#f0cbb0').replace('#', '0x'));

      // Full 3D Stylized Character Model with Expressive Facial Features
      const charModel = new CharacterModel('npc_adult', {
        isNPC: true,
        npcRole: data.role,
        primaryColor: primaryHex,
        skinColor: skinHex
      });
      rootGroup.add(charModel.group);

      // Attach Authentic 3D Hand Props based on role
      this.attachRoleProp(charModel, data.role);

      // Floating 3D Interaction Dialogue Indicator (Bubble with Icon)
      const indicator = this.createDialogueIndicator(data.badgeColor || '#2ecc71');
      indicator.position.set(0, 2.45, 0);
      rootGroup.add(indicator);

      this.scene.add(rootGroup);

      this.npcInstances.push({
        data,
        group: rootGroup,
        charModel,
        indicator,
        baseY: data.position.y
      });

      // Register collision box for NPC
      this.collisionSystem.addBox(
        data.position.x - 0.7,
        data.position.z - 0.7,
        data.position.x + 0.7,
        data.position.z + 0.7,
        2.2
      );
    });
  }

  spawnChildNPCs() {
    // 2 Happy child NPCs hanging out in Central Park (spacious and clear of all obstacles)
    const kids = [
      { type: 'girl_green', x: 24, z: 10, rot: -0.8 },
      { type: 'girl_yellow', x: 18, z: 22, rot: 1.2 }
    ];

    kids.forEach(k => {
      const group = new THREE.Group();
      group.position.set(k.x, 0, k.z);
      group.rotation.y = k.rot;

      const model = new CharacterModel(k.type);
      group.add(model.group);
      this.scene.add(group);

      this.childNPCs.push({ group, model });
      this.collisionSystem.addBox(k.x - 0.5, k.z - 0.5, k.x + 0.5, k.z + 0.5, 1.8);
    });
  }

  attachRoleProp(charModel, role) {
    const rightArm = charModel.bones.rightArm;
    if (!rightArm) return;

    const propGroup = new THREE.Group();
    propGroup.position.set(0, -0.42, 0.08);

    if (role === 'cleaner') {
      // 3D Broom prop
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
      handle.position.y = 0.2;
      propGroup.add(handle);

      const brush = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.08), new THREE.MeshLambertMaterial({ color: 0xf39c12 }));
      brush.position.y = -0.38;
      propGroup.add(brush);
    } else if (role === 'gardener') {
      // Small plant pot with green sprout
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 8), new THREE.MeshLambertMaterial({ color: 0xd35400 }));
      pot.position.y = -0.05;
      propGroup.add(pot);

      const sprout = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshLambertMaterial({ color: 0x2ecc71 }));
      sprout.position.y = 0.05;
      propGroup.add(sprout);
    } else if (role === 'historian' || role === 'librarian') {
      // Ancient scroll / leather book
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.06), new THREE.MeshLambertMaterial({ color: 0x8e44ad }));
      book.rotation.x = 0.4;
      propGroup.add(book);
    } else if (role === 'doctor') {
      // Medical clipboard
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.02), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      board.rotation.x = 0.4;
      propGroup.add(board);
    } else if (role === 'police_officer') {
      // Police handheld radio / walkie-talkie
      const walkie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.05), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      walkie.position.y = -0.05;
      propGroup.add(walkie);

      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), new THREE.MeshBasicMaterial({ color: 0x222222 }));
      ant.position.set(0.02, 0.09, 0);
      propGroup.add(ant);
    } else if (role === 'police_inspector') {
      // Confidential investigation file / dossier
      const dossier = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.26, 0.03), new THREE.MeshLambertMaterial({ color: 0xd35400 }));
      dossier.rotation.x = 0.45;
      propGroup.add(dossier);
    } else if (role === 'firefighter') {
      // Fire Extinguisher (مطفأة حريق)
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 10), new THREE.MeshLambertMaterial({ color: 0xe74c3c }));
      cylinder.position.y = -0.08;
      propGroup.add(cylinder);

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      nozzle.position.set(0, 0.08, 0);
      propGroup.add(nozzle);
    } else if (role === 'artisan') {
      // Traditional Algerian terracotta vase / pot
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.22, 10), new THREE.MeshLambertMaterial({ color: 0xd35400 }));
      vase.position.y = -0.06;
      propGroup.add(vase);
    } else if (role === 'elderly_citizen') {
      // Traditional polished wooden walking stick / cane (عكاز خشبي)
      const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 8), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
      cane.position.set(0, -0.35, 0.05);
      propGroup.add(cane);

      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 6, 12, Math.PI), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
      handle.position.set(0, 0.12, 0.05);
      handle.rotation.z = Math.PI / 2;
      propGroup.add(handle);
    }

    rightArm.add(propGroup);
  }

  createDialogueIndicator(badgeColor) {
    const group = new THREE.Group();

    // Golden speech bubble / badge background
    const bg = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xf1c40f })
    );
    group.add(bg);

    // Glowing rim ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.03, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    group.add(ring);

    // Exclamation mark icon
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.02, 0.18, 8),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    stem.position.set(0, 0.04, 0.18);
    group.add(stem);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    dot.position.set(0, -0.10, 0.18);
    group.add(dot);

    return group;
  }

  update(dt, playerPosition) {
    let nearest = null;
    let nearestDist = Infinity;
    const now = Date.now() * 0.003;

    // Update child NPCs idle animations
    this.childNPCs.forEach((k, i) => {
      k.model.update(dt, { isMoving: false });
    });

    this.npcInstances.forEach(npc => {
      const dist = npc.group.position.distanceTo(playerPosition);

      // Update character model animation
      npc.charModel.update(dt, { isMoving: false });

      // Indicator bounce & rotation
      npc.indicator.position.y = 2.45 + Math.sin(now * 2.5 + npc.group.position.x) * 0.08;
      npc.indicator.rotation.y += dt * 1.8;

      // When player is close, turn NPC gently towards player and wave
      if (dist < this.interactDistance + 2.5) {
        const dx = playerPosition.x - npc.group.position.x;
        const dz = playerPosition.z - npc.group.position.z;
        const targetAngle = Math.atan2(dx, dz);
        npc.group.rotation.y = targetAngle;

        // Friendly wave when close
        if (dist < this.interactDistance) {
          npc.charModel.setAction('wave', 0.5);
        }
      }

      if (dist < this.interactDistance && dist < nearestDist) {
        nearest = npc;
        nearestDist = dist;
      }
    });

    if (nearest !== this.closestNPC) {
      this.closestNPC = nearest;
      events.emit('NEAR_NPC_CHANGED', nearest ? nearest.data : null);
    }
  }

  getNearNPC() {
    return this.closestNPC ? this.closestNPC.data : null;
  }
}
