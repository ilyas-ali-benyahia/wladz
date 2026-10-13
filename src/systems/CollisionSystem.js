import * as THREE from 'three';

export class CollisionSystem {
  constructor() {
    this.staticBoxes = []; // Array of THREE.Box3
    this.cityMin = new THREE.Vector2(-68, -68);
    this.cityMax = new THREE.Vector2(68, 68);
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

  checkCollision(pos, radius = 0.45) {
    // 1. Boundary check
    if (pos.x - radius < this.cityMin.x || pos.x + radius > this.cityMax.x ||
        pos.z - radius < this.cityMin.y || pos.z + radius > this.cityMax.y) {
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
