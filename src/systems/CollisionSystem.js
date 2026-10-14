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

  checkCollision(pos, radius = 0.45) {
    // 1. Boundary check
    const b = this.bounds;
    const minX = b ? b.minX : this.cityMin.x, maxX = b ? b.maxX : this.cityMax.x;
    const minZ = b ? b.minZ : this.cityMin.y, maxZ = b ? b.maxZ : this.cityMax.y;
    if (pos.x - radius < minX || pos.x + radius > maxX || pos.z - radius < minZ || pos.z + radius > maxZ) {
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

    return false;
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
