import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';

// Water deeper than this (metres) floats the player: swimming instead of walking on the seabed
export const SWIM_DEPTH = 0.9;

export class PlayerController {
  constructor(engine, collisionSystem, inputManager) {
    this.engine = engine;
    this.collisionSystem = collisionSystem;
    this.input = inputManager;

    // Start on the stone path of the central park, facing the fountain
    this.position = new THREE.Vector3(21.25, 0, 27);
    this.velocity = new THREE.Vector3();
    this.heading = Math.PI; // In radians
    this.gender = 'boy';

    // Physics parameters
    this.walkSpeed = 5.2;
    this.runSpeed = 9.2;
    this.turnSpeed = 12.0;
    this.jumpForce = 8.5;
    this.gravity = 22.0;
    this.verticalVelocity = 0;
    this.isGrounded = true;

    // Model
    this.model = null;
    this.group = new THREE.Group();
    this.engine.scene.add(this.group);

    this.initModel('boy');
  }

  initModel(charType = 'boy_purple') {
    let resolvedType = charType;
    if (charType === 'boy') resolvedType = 'boy_purple';
    if (charType === 'girl') resolvedType = 'girl_green';
    this.gender = resolvedType;
    const carrying = this.model ? this.model.carrying : false; // keep a carried item pose across outfit changes
    if (this.model) {
      this.group.remove(this.model.group);
    }
    // Appearance and outfit come from the wardrobe (character selection / clothing shop)
    this.model = new CharacterModel(resolvedType, this.lookFor ? this.lookFor(resolvedType) : {});
    this.model.carrying = carrying;
    this.group.add(this.model.group);
    this.group.position.copy(this.position);
  }

  switchGender(charType) {
    this.initModel(charType);
  }

  triggerAction(actionName, duration = 1.8) {
    if (this.model) {
      this.model.setAction(actionName, duration);
    }
  }

  update(dt) {
    if (!this.model) return;

    const { fwd, right, isRunning, isJumping } = this.input.getMovementVector();

    // 1. Calculate direction vector relative to camera yaw
    const cameraYaw = this.input.yaw;
    const forwardVec = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const rightVec = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    const moveDir = new THREE.Vector3();
    if (fwd !== 0) moveDir.add(forwardVec.clone().multiplyScalar(fwd));
    if (right !== 0) moveDir.add(rightVec.clone().multiplyScalar(right));

    // Water state: deep enough to float -> swim (slower, no jumping, body kept at the surface)
    const depth = this.waterDepthAt ? this.waterDepthAt(this.position.x, this.position.z) : 0;
    const wasSwimming = this.swimming;
    this.swimming = depth > SWIM_DEPTH;
    if (this.swimming !== !!wasSwimming && this.onWaterChange) this.onWaterChange(this.swimming);

    const isMoving = moveDir.lengthSq() > 0.001;
    let currentSpeed = 0;
    let speedRatio = 0;

    if (isMoving) {
      moveDir.normalize();
      currentSpeed = this.swimming ? (isRunning ? 3.4 : 2.3) : (isRunning ? this.runSpeed : this.walkSpeed);
      speedRatio = isRunning ? 1.5 : 1.0;

      // Smooth rotate towards movement direction
      const targetHeading = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetHeading - this.heading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.heading += diff * Math.min(1.0, this.turnSpeed * dt);
      this.group.rotation.y = this.heading;

      // Move using collision resolution
      const moveDelta = moveDir.clone().multiplyScalar(currentSpeed * dt);
      const newPos = this.collisionSystem.resolveMovement(this.position, moveDelta, 0.42);
      // Swimming is only allowed inside the supervised zones the player has unlocked
      const deepAhead = this.waterDepthAt && this.waterDepthAt(newPos.x, newPos.z) > SWIM_DEPTH;
      if (deepAhead && this.swimAllowed && !this.swimAllowed(newPos.x, newPos.z)) {
        if (this.onSwimBlocked) this.onSwimBlocked();
      } else {
        this.position.x = newPos.x;
        this.position.z = newPos.z;
      }
    }

    // A car that nudges into the player pushes them aside gently instead of driving through
    this.collisionSystem.pushOutOfVehicles(this.position, 0.42);

    // 2. Jumping & Gravity (feet rest on the surface underneath: sidewalk, lawn, steps...)
    const groundY = this.collisionSystem.getGroundHeight(this.position.x, this.position.z);
    if (this.swimming) {
      // Float: hips at the surface while stroking, shoulders at the surface while treading water
      const hip = this.model.hipHeight || 0.9;
      const targetY = (this.waterSurfaceY ?? 0.05) - hip - (isMoving ? 0.08 : 0.42);
      this.position.y += (targetY - this.position.y) * Math.min(1, dt * 6);
      this.verticalVelocity = 0;
      this.isGrounded = true;
    } else if (this.isGrounded) {
      // Step smoothly up/down curbs
      this.position.y += (groundY - this.position.y) * Math.min(1, dt * 18);
      if (isJumping && this.input.enabled) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
      }
    } else {
      this.verticalVelocity -= this.gravity * dt;
      this.position.y += this.verticalVelocity * dt;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Update 3D group position
    this.group.position.copy(this.position);

    // 3. Update character model animations
    this.model.update(dt, {
      isMoving,
      speedRatio,
      isJumping: !this.isGrounded && !this.swimming,
      swimming: this.swimming
    });

    // 4. Update smooth Third Person Camera (unless another view owns it, e.g. the clothing panel)
    if (!(this.cameraHold && this.cameraHold())) this.updateCamera(dt);
  }

  updateCamera(dt) {
    const yaw = this.input.yaw;
    const pitch = this.input.pitch;
    // Indoors the camera stays close so it never ends up pressed against a wall
    const dist = this.cameraBounds ? Math.min(3.4, this.input.cameraDistance) : this.input.cameraDistance;

    // Target look point (slightly above character head)
    const targetLook = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    // Spherical camera offset
    const camX = Math.sin(yaw) * Math.cos(pitch) * dist;
    const camY = Math.sin(pitch) * dist + 1.8;
    const camZ = Math.cos(yaw) * Math.cos(pitch) * dist;

    const desiredCamPos = this.position.clone().add(new THREE.Vector3(camX, Math.max(1.2, camY), camZ));

    // Indoors: keep the camera inside the room (no looking through walls)
    if (this.cameraBounds) {
      const b = this.cameraBounds;
      desiredCamPos.x = THREE.MathUtils.clamp(desiredCamPos.x, b.minX, b.maxX);
      desiredCamPos.z = THREE.MathUtils.clamp(desiredCamPos.z, b.minZ, b.maxZ);
      desiredCamPos.y = Math.min(desiredCamPos.y, b.maxY);
    }

    // Smooth lerp camera position
    this.engine.camera.position.lerp(desiredCamPos, Math.min(1.0, 14.0 * dt));
    this.engine.camera.lookAt(targetLook);
  }
}
