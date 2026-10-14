// ── weapon.js (v3) ────────────────────────────────────────────────────────────
// Camera-attached FPS gun with smooth weapon sway, recoil, muzzle flash,
// and a pooled laser tracer from muzzle to impact point.

import * as THREE from 'three';

// Shared geometry – created once
const BODY_GEO   = new THREE.BoxGeometry(0.065, 0.082, 0.34);
const BARREL_GEO = new THREE.CylinderGeometry(0.019, 0.019, 0.28, 7);
const STRIP_GEO  = new THREE.BoxGeometry(0.068, 0.013, 0.30);
const HANDLE_GEO = new THREE.BoxGeometry(0.052, 0.14, 0.065);
const RING_GEO   = new THREE.TorusGeometry(0.024, 0.009, 7, 16);
const FLASH_GEO  = new THREE.SphereGeometry(0.065, 7, 7);

// Tracer spans 0..1 along +Z so mesh.lookAt() + scale.z stretches it
// from the muzzle to any world point (unit geometry, scaled per shot).
const TRACER_GEO = new THREE.CylinderGeometry(0.016, 0.016, 1, 6, 1, true);
TRACER_GEO.translate(0, 0.5, 0);
TRACER_GEO.rotateX(Math.PI / 2);

const BODY_MAT  = new THREE.MeshStandardMaterial({ color: 0x52647b, roughness: 0.48, metalness: 0.45 });
const NEON_MAT  = new THREE.MeshStandardMaterial({
  color: 0x65d7db, emissive: 0x00ffe7, emissiveIntensity: 1.25, roughness: 0.35
});
const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0x00ffe7, transparent: true, opacity: 0 });

export class WeaponFX {
  constructor(scene, camera) {
    this.scene  = scene;
    this.camera = camera;

    // Target position for sway (lerped each frame)
    this.swayX = 0;
    this.swayY = 0;

    // Recoil state
    this.recoilZ  = 0;   // extra z offset
    this.recoilT  = 0;   // time remaining

    // Flash state
    this.flashT = 0;

    // Tracer state
    this.tracerT = 0;

    // Idle bob time
    this.bobT = 0;

    // Scratch vectors (never re-created)
    this._muzzle = new THREE.Vector3();
    this._end    = new THREE.Vector3();

    this._build();
  }

  _build() {
    this.group = new THREE.Group();

    // Body
    this.group.add(this._mesh(BODY_GEO, BODY_MAT));

    // Barrel
    const barrel = this._mesh(BARREL_GEO, BODY_MAT);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.022, -0.16);
    this.group.add(barrel);

    // Neon strip
    const strip = this._mesh(STRIP_GEO, NEON_MAT);
    strip.position.set(0, -0.038, 0);
    this.group.add(strip);

    // Handle
    const handle = this._mesh(HANDLE_GEO, BODY_MAT);
    handle.position.set(0, -0.11, 0.065);
    this.group.add(handle);

    // Muzzle ring
    const ring = this._mesh(RING_GEO, NEON_MAT);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.022, -0.30);
    this.group.add(ring);

    // Muzzle flash sphere
    this.flash = this._mesh(FLASH_GEO, FLASH_MAT.clone());
    this.flash.position.set(0, 0.022, -0.36);
    this.group.add(this.flash);

    // Muzzle point light
    this.muzzleLight = new THREE.PointLight(0x00ffe7, 0, 3.5);
    this.muzzleLight.position.set(0, 0.022, -0.36);
    this.group.add(this.muzzleLight);

    // Default resting position (relative to camera)
    this.restPos  = new THREE.Vector3( 0.21, -0.20, -0.38);
    this.group.position.copy(this.restPos);
    this.group.rotation.y = 0.06;

    // Attach to camera
    this.camera.add(this.group);

    // Laser tracer: one pooled beam mesh, added to the SCENE (it spans world
    // space from muzzle to impact, so it cannot live under the camera).
    this.tracerMat = new THREE.MeshBasicMaterial({
      color: 0x9dfff4, transparent: true, opacity: 0, depthWrite: false
    });
    this.tracer = new THREE.Mesh(TRACER_GEO, this.tracerMat);
    this.tracer.visible = false;
    this.tracer.frustumCulled = false;
    this.scene.add(this.tracer);

    // Tracer impact glow (small sphere at the hit point)
    this.impactMat = new THREE.MeshBasicMaterial({
      color: 0x00ffe7, transparent: true, opacity: 0, depthWrite: false
    });
    this.impact = new THREE.Mesh(FLASH_GEO, this.impactMat);
    this.impact.visible = false;
    this.impact.frustumCulled = false;
    this.scene.add(this.impact);
  }

  _mesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  fire() {
    // Recoil
    this.recoilZ = 0.055;
    this.recoilT = 0.14;

    // Muzzle flash
    this.flash.material.opacity = 1;
    this.muzzleLight.intensity  = 9;
    this.flashT = 0.07;
  }

  // Draw the laser beam from the muzzle to the impact point (world space).
  spawnTracer(endX, endY, endZ) {
    // Muzzle world position (gun group is camera-attached)
    this.flash.getWorldPosition(this._muzzle);
    this._end.set(endX, endY, endZ);

    // Orient the unit-length beam and stretch it to span muzzle→end
    this.tracer.position.copy(this._muzzle);
    this.tracer.lookAt(this._end);
    this.tracer.scale.set(1, 1, this._muzzle.distanceTo(this._end));

    this.tracer.visible = true;
    this.tracerMat.opacity = 0.95;

    this.impact.position.copy(this._end);
    this.impact.visible = true;
    this.impactMat.opacity = 0.9;
    this.impact.scale.setScalar(0.7);

    this.tracerT = 0.12;
  }

  update(dt) {
    this.bobT += dt;

    // Flash decay
    if (this.flashT > 0) {
      this.flashT = Math.max(0, this.flashT - dt);
      const t = this.flashT / 0.07;
      this.flash.material.opacity   = t;
      this.muzzleLight.intensity    = t * 9;
    }

    // Tracer fade (beam + impact glow shrink together)
    if (this.tracerT > 0) {
      this.tracerT = Math.max(0, this.tracerT - dt);
      const t = this.tracerT / 0.12;
      this.tracerMat.opacity = t * 0.95;
      this.tracer.scale.x = this.tracer.scale.y = 0.4 + t * 0.6;
      this.impactMat.opacity = t * 0.9;
      this.impact.scale.setScalar(0.25 + t * 0.45);
      if (this.tracerT === 0) {
        this.tracer.visible = false;
        this.impact.visible = false;
      }
    }

    // Recoil spring-back
    if (this.recoilT > 0) {
      this.recoilT = Math.max(0, this.recoilT - dt);
      const t = this.recoilT / 0.14;
      this.recoilZ = t * 0.055;
    } else {
      this.recoilZ = 0;
    }

    // Idle bob
    const bobX = Math.sin(this.bobT * 1.3) * 0.004;
    const bobY = Math.sin(this.bobT * 0.85) * 0.006;

    // Lerp weapon position smoothly
    const lf = 1 - Math.pow(0.02, dt);
    this.group.position.x += (this.restPos.x + bobX  - this.group.position.x) * lf * 12;
    this.group.position.y += (this.restPos.y + bobY  - this.group.position.y) * lf * 12;
    this.group.position.z += (this.restPos.z + this.recoilZ - this.group.position.z) * lf * 14;

    // Subtle weapon tilt sway
    this.group.rotation.z = Math.sin(this.bobT * 0.7) * 0.012;
  }
}
