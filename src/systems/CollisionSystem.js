import * as THREE from 'three';

export class CollisionSystem {
  constructor() {
    this.staticBoxes = []; // Array of THREE.Box3
    this.cityMin = new THREE.Vector2(-82, -82);
    this.cityMax = new THREE.Vector2(82, 82);
    this.bounds = null; // set by InteriorSystem while the player is inside a building
    this.walkables = []; // low, flat static surfaces people stand on (sidewalks, park lawns, courtyards, steps)
    this.groundRay = new THREE.Raycaster();
    this.groundRay.ray.direction.set(0, -1, 0);
  }

  addBox(minX, minZ, maxX, maxZ, height = 15) {
    const box = new THREE.Box3(
      new THREE.Vector3(Math.min(minX, maxX), 0, Math.min(minZ, maxZ)),
      new THREE.Vector3(Math.max(minX, maxX), height, Math.max(minZ, maxZ))
    );
    this.staticBoxes.push(box);
    return box;
  }

  addMeshObstacle(mesh, padding = 0.25) {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    box.min.x -= padding;
    box.min.z -= padding;
    box.max.x += padding;
    box.max.z += padding;
    this.staticBoxes.push(box);
    return box;
  }

  /**
   * Scan the static world once and register every low, wide surface as walkable.
   * Axis-aligned boxes/planes use their exact top; other shapes (curved corners, discs, steps) are raycast.
   */
  buildWalkables(root) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    root.traverse(m => {
      if (!m.isMesh || !m.geometry || (m.material && m.material.transparent)) return;
      box.setFromObject(m);
      const sx = box.max.x - box.min.x;
      const sz = box.max.z - box.min.z;
      const top = box.max.y;
      if (top < 0.05 || top > 1.2 || box.max.y - box.min.y > 1.3 || sx * sz < 4) return;
      const e = m.matrixWorld.elements;
      const axisAligned = Math.abs(e[0]) < 1e-3 || Math.abs(e[2]) < 1e-3;
      const t = m.geometry.type;
      const exact = axisAligned && (t === 'BoxGeometry' || t === 'RoundedBoxGeometry' || t === 'PlaneGeometry');
      this.walkables.push({ mesh: m, exact, top, minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
    });
  }

  /** Height of the walkable surface under (x, z); 0 on plain ground and roads */
  getGroundHeight(x, z) {
    // A separate area (e.g. the coast with its seabed) can provide its own ground model
    if (this.groundFn) {
      const g = this.groundFn(x, z);
      if (g !== null) return g;
    }
    let h = 0;
    for (let i = 0; i < this.walkables.length; i++) {
      const w = this.walkables[i];
      if (w.top <= h || x < w.minX || x > w.maxX || z < w.minZ || z > w.maxZ) continue;
      if (w.exact) { h = w.top; continue; }
      this.groundRay.ray.origin.set(x, w.top + 0.5, z);
      const hit = this.groundRay.intersectObject(w.mesh, false)[0];
      if (hit && hit.point.y > h) h = hit.point.y;
    }
    return h;
  }

  checkCollision(pos, radius = 0.45, ignoreVehicle = null) {
    // 1. Boundary check
    const b = this.bounds;
    const minX = b ? b.minX : this.cityMin.x, maxX = b ? b.maxX : this.cityMax.x;
    const minZ = b ? b.minZ : this.cityMin.y, maxZ = b ? b.maxZ : this.cityMax.y;
    if (pos.x - radius < minX || pos.x + radius > maxX || pos.z - radius < minZ || pos.z + radius > maxZ) {
      return true;
    }
    // Outdoors the mountain foot is the real boundary (rounded corners of the city square)
    if (!b && this.edgeDistance && this.edgeDistance(pos.x, pos.z) + radius > -0.3) {
      return true;
    }

    // 2. Obstacles check
    const playerBox = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, 0.1, pos.z - radius),
      new THREE.Vector3(pos.x + radius, 1.8, pos.z + radius)
    );

    for (let i = 0; i < this.staticBoxes.length; i++) {
      if (playerBox.intersectsBox(this.staticBoxes[i])) {
        return true;
      }
    }

    // 3. Moving vehicles (oriented boxes)
    if (!b && this.vehicleProvider && ignoreVehicle !== 'all') {
      for (const v of this.vehicleProvider()) {
        if (v !== ignoreVehicle && this.vehiclePenetration(v, pos.x, pos.z, radius)) return true;
      }
    }

    return false;
  }

  /** Oriented box vs oriented box (separating axis test). Footprints: {x, z, heading, hw, hl} */
  obbOverlap(a, b, pad = 0) {
    const axes = [a.heading, a.heading + Math.PI / 2, b.heading, b.heading + Math.PI / 2];
    const dx = b.x - a.x, dz = b.z - a.z;
    const radius = (f, ax, az) => {
      const s = Math.sin(f.heading), c = Math.cos(f.heading);
      // forward (s, c) * hl, right (c, -s) * hw projected on the axis
      return Math.abs((s * ax + c * az) * f.hl) + Math.abs((c * ax - s * az) * f.hw);
    };
    for (const h of axes) {
      const ax = Math.sin(h), az = Math.cos(h);
      if (Math.abs(dx * ax + dz * az) > radius(a, ax, az) + radius(b, ax, az) + pad) return false;
    }
    return true;
  }

  /** Circle vs vehicle footprint (oriented box). Returns the push-out vector {x, z} or null */
  vehiclePenetration(v, x, z, radius) {
    const s = Math.sin(v.heading), c = Math.cos(v.heading);
    const dx = x - v.x, dz = z - v.z;
    // Local frame: 'l' along the vehicle, 'w' across it
    const l = dx * s + dz * c;
    const w = dx * c - dz * s;
    const cl = Math.max(-v.hl, Math.min(v.hl, l));
    const cw = Math.max(-v.hw, Math.min(v.hw, w));
    let ol = l - cl, ow = w - cw;
    const d = Math.hypot(ol, ow);
    if (d >= radius - 1e-3) return null;
    let push;
    if (d > 1e-4) {
      push = radius - d + 2e-3;
      ol /= d; ow /= d;
    } else {
      // Centre inside the box: leave through the nearest side
      const pl = v.hl - Math.abs(l), pw = v.hw - Math.abs(w);
      if (pw < pl) { ow = Math.sign(w) || 1; ol = 0; push = pw + radius; }
      else { ol = Math.sign(l) || 1; ow = 0; push = pl + radius; }
    }
    return { x: (ol * s + ow * c) * push, z: (ol * c - ow * s) * push };
  }

  /** Moves a character out of any vehicle overlapping it (cars nudging people), capped per frame so nobody gets launched */
  pushOutOfVehicles(pos, radius = 0.42, maxStep = 0.25) {
    if (this.bounds || !this.vehicleProvider) return false;
    let moved = false;
    for (const v of this.vehicleProvider()) {
      const p = this.vehiclePenetration(v, pos.x, pos.z, radius);
      if (!p) continue;
      const len = Math.hypot(p.x, p.z);
      const k = len > maxStep ? maxStep / len : 1;
      const nx = pos.x + p.x * k, nz = pos.z + p.z * k;
      // Never push someone into a wall
      if (!this.staticBoxes.some(bx => nx + radius > bx.min.x && nx - radius < bx.max.x && nz + radius > bx.min.z && nz - radius < bx.max.z)) {
        pos.x = nx;
        pos.z = nz;
        moved = true;
      }
    }
    return moved;
  }

  // Resolve movement with smooth wall-sliding
  resolveMovement(currentPos, intendedMove, radius = 0.45) {
    // Try full move
    const targetPos = currentPos.clone().add(intendedMove);
    if (!this.checkCollision(targetPos, radius)) {
      return targetPos;
    }

    // Try sliding on X axis only
    const xOnly = currentPos.clone().add(new THREE.Vector3(intendedMove.x, 0, 0));
    if (!this.checkCollision(xOnly, radius)) {
      return xOnly;
    }

    // Try sliding on Z axis only
    const zOnly = currentPos.clone().add(new THREE.Vector3(0, 0, intendedMove.z));
    if (!this.checkCollision(zOnly, radius)) {
      return zOnly;
    }

    // Blocked completely
    return currentPos;
  }
}
