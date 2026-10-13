import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';

export class PlayerController {
  constructor(engine, collisionSystem, inputManager) {
    this.engine = engine;
    this.collisionSystem = collisionSystem;
    this.input = inputManager;

    this.position = new THREE.Vector3(0, 0, 10);
    this.velocity = new THREE.Vector3();
    this.heading = 0; // In radians
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
    if (this.model) {
      this.group.remove(this.model.group);
    }
    this.model = new CharacterModel(resolvedType);
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

    const isMoving = moveDir.lengthSq() > 0.001;
    let currentSpeed = 0;
    let speedRatio = 0;

    if (isMoving) {
      moveDir.normalize();
      currentSpeed = isRunning ? this.runSpeed : this.walkSpeed;
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
      this.position.x = newPos.x;
      this.position.z = newPos.z;
    }

    // 2. Jumping & Gravity
    if (this.isGrounded) {
      if (isJumping && this.input.enabled) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
      }
    } else {
      this.verticalVelocity -= this.gravity * dt;
      this.position.y += this.verticalVelocity * dt;

      if (this.position.y <= 0) {
        this.position.y = 0;
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
      isJumping: !this.isGrounded
    });

    // 4. Update smooth Third Person Camera
    this.updateCamera(dt);
  }

  updateCamera(dt) {
    const yaw = this.input.yaw;
    const pitch = this.input.pitch;
    const dist = this.input.cameraDistance;

    // Target look point (slightly above character head)
    const targetLook = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    // Spherical camera offset
    const camX = Math.sin(yaw) * Math.cos(pitch) * dist;
    const camY = Math.sin(pitch) * dist + 1.8;
    const camZ = Math.cos(yaw) * Math.cos(pitch) * dist;

    const desiredCamPos = this.position.clone().add(new THREE.Vector3(camX, Math.max(1.2, camY), camZ));

    // Smooth lerp camera position
    this.engine.camera.position.lerp(desiredCamPos, Math.min(1.0, 14.0 * dt));
    this.engine.camera.lookAt(targetLook);
  }
}
