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
      rootGroup.position.set(data.position.x, this.collisionSystem.getGroundHeight(data.position.x, data.position.z), data.position.z);
      rootGroup.userData = data;

      // Color materials parsing
      const primaryHex = parseInt((data.color || '#27ae60').replace('#', '0x'));
      const skinHex = parseInt((data.skinColor || '#f0cbb0').replace('#', '0x'));

      // Full 3D Stylized Character Model with Expressive Facial Features
      const charModel = new CharacterModel('npc_adult', {
        isNPC: true,
        npcRole: data.role,
        primaryColor: primaryHex,
        skinColor: skinHex,
        gender: data.gender,
        hijabColor: data.hijabColor ? parseInt(data.hijabColor.replace('#', '0x')) : undefined
      });
      rootGroup.add(charModel.group);

      // Attach Authentic 3D Hand Props based on role
      this.attachRoleProp(charModel, data.role);

      // Floating 3D Interaction Dialogue Indicator (Bubble with Icon)
      const indicator = this.createDialogueIndicator(data.badgeColor || '#2ecc71');
      indicator.position.set(0, 2.25, 0);
      rootGroup.add(indicator);

      this.scene.add(rootGroup);

      this.npcInstances.push({
        data,
        group: rootGroup,
        charModel,
        indicator,
        baseY: data.position.y,
        moveTarget: null,
        moveSpeed: 1.2,
        colBox: null
      });

      // Register collision box for NPC (moved along when the NPC walks)
      this.npcInstances[this.npcInstances.length - 1].colBox = this.collisionSystem.addBox(
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
      { type: 'girl_green', x: 23.3, z: 15.3, rot: -0.8 },
      { type: 'girl_yellow', x: 13.3, z: 22.3, rot: 1.2 }
    ];

    kids.forEach(k => {
      const group = new THREE.Group();
      group.position.set(k.x, this.collisionSystem.getGroundHeight(k.x, k.z), k.z);
      group.rotation.y = k.rot;

      const model = new CharacterModel(k.type);
      group.add(model.group);
      this.scene.add(group);

      this.childNPCs.push({ group, model });
      this.collisionSystem.addBox(k.x - 0.5, k.z - 0.5, k.x + 0.5, k.z + 0.5, 1.8);
    });
  }

  attachRoleProp(charModel, role) {
    // Props are held in the hand so they follow elbow/wrist animation
    const rightArm = charModel.bones.rightHand || charModel.bones.rightArm;
    if (!rightArm) return;

    const propGroup = new THREE.Group();
    propGroup.position.set(0, -0.08, 0.03);
    propGroup.scale.setScalar(0.8);

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
    charModel.propHand = 'right'; // wave with the free hand
    if (role === 'elderly_citizen') propGroup.position.y = 0.25; // cane reaches the ground
  }

  createDialogueIndicator(badgeColor) {
    // Slim floating diamond marker (classic open-world "talk here" marker) in the NPC's category colour
    const group = new THREE.Group();
    const color = new THREE.Color(badgeColor || '#f1c40f');
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.1 })
    );
    gem.scale.set(0.8, 1.6, 0.8);
    group.add(gem);

    // Soft halo so it reads against bright sky and white walls
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.21, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.3;
    group.add(halo);
    group.traverse(m => { m.castShadow = false; });
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

      // Walking NPC (escort missions): move toward its target, then stand still
      if (npc.moveTarget) {
        const p = npc.group.position;
        const dx = npc.moveTarget.x - p.x, dz = npc.moveTarget.z - p.z;
        const d = Math.hypot(dx, dz);
        const moving = d > 0.15;
        if (moving) {
          const step = Math.min(d, npc.moveSpeed * dt);
          p.x += dx / d * step;
          p.z += dz / d * step;
          let dA = Math.atan2(dx, dz) - npc.group.rotation.y;
          dA = Math.atan2(Math.sin(dA), Math.cos(dA));
          npc.group.rotation.y += dA * Math.min(1, dt * 6);
          const gy = this.collisionSystem.getGroundHeight(p.x, p.z);
          p.y += (gy - p.y) * Math.min(1, dt * 15);
          if (npc.colBox) {
            npc.colBox.min.set(p.x - 0.35, 0, p.z - 0.35);
            npc.colBox.max.set(p.x + 0.35, 2.2, p.z + 0.35);
          }
        }
        npc.charModel.update(dt, { isMoving: moving, speedRatio: npc.moveSpeed / 2.4 });
        npc.indicator.visible = false;
        if (dist < this.interactDistance && dist < nearestDist) { nearest = npc; nearestDist = dist; }
        return;
      }
      npc.indicator.visible = true;

      // Update character model animation
      npc.charModel.update(dt, { isMoving: false });

      // Indicator bounce & rotation
      npc.indicator.position.y = 2.25 + Math.sin(now * 2.5 + npc.group.position.x) * 0.06;
      npc.indicator.rotation.y += dt * 1.8;

      // When player is close, turn NPC gently towards player and wave
      if (dist < this.interactDistance + 2.5) {
        const dx = playerPosition.x - npc.group.position.x;
        const dz = playerPosition.z - npc.group.position.z;
        const targetAngle = Math.atan2(dx, dz);
        // Turn smoothly toward the player (shortest angle)
        let dA = targetAngle - npc.group.rotation.y;
        dA = Math.atan2(Math.sin(dA), Math.cos(dA));
        npc.group.rotation.y += dA * Math.min(1, dt * 5);

        // Wave once on approach, then keep a natural talking gesture while close
        if (dist < this.interactDistance) {
          if (!npc.hasGreeted) {
            npc.hasGreeted = true;
            npc.charModel.setAction('wave', 1.6);
          } else if (!npc.charModel.currentAction) {
            npc.charModel.setAction('talk', 2.5);
          }
        }
      } else {
        npc.hasGreeted = false;
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

  findNPC(id) {
    return this.npcInstances.find(n => n.data.id === id) || null;
  }

  /** Let an NPC walk toward a point (null = stop walking and resume normal idle behaviour) */
  setMoveTarget(id, target, speed = 1.2) {
    const npc = this.findNPC(id);
    if (!npc) return;
    npc.moveTarget = target ? target.clone() : null;
    npc.moveSpeed = speed;
  }

  /** Hand an item mesh to an NPC: held in front of the chest for a while with a thank-you wave */
  giveItem(id, mesh, seconds = 12) {
    const npc = this.findNPC(id);
    if (!npc || !mesh) return;
    if (npc.heldItem && npc.heldItem.parent) npc.heldItem.parent.remove(npc.heldItem);
    mesh.position.set(0, 1.05, 0.34);
    npc.group.add(mesh);
    npc.heldItem = mesh;
    npc.charModel.carrying = true;
    npc.charModel.setAction('wave', 1.6);
    clearTimeout(npc.heldTimer);
    npc.heldTimer = setTimeout(() => {
      if (mesh.parent) mesh.parent.remove(mesh);
      npc.charModel.carrying = false;
      npc.heldItem = null;
    }, seconds * 1000);
  }

  getNearNPC() {
    return this.closestNPC ? this.closestNPC.data : null;
  }
}
