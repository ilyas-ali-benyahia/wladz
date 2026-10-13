export class InputManager {
  constructor() {
    this.keys = {};
    this.isLocked = false;
    this.yaw = 0;
    this.pitch = 0.25;
    this.cameraDistance = 5.8;
    this.enabled = true;

    this.onInteract = null;
    this.onEscape = null;
    this.onMapToggle = null;

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (!this.enabled && e.code !== 'Escape') return;

      if (e.code === 'KeyE' && this.onInteract) {
        this.onInteract();
      }

      if (e.code === 'KeyM' && this.onMapToggle) {
        this.onMapToggle();
      }

      if (e.code === 'Escape' && this.onEscape) {
        this.onEscape();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer lock for 3D Camera Look
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('click', () => {
        if (this.enabled && !this.isLocked) {
          canvas.requestPointerLock();
        }
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === document.getElementById('game-canvas');
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || !this.enabled) return;
      const sensitivity = 0.0024;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Clamp vertical pitch to avoid flipping
      const minPitch = -0.45;
      const maxPitch = 0.60;
      this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
    });

    // Zoom camera with mouse wheel
    window.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      this.cameraDistance += e.deltaY * 0.005;
      this.cameraDistance = Math.max(4.5, Math.min(13.0, this.cameraDistance));
    }, { passive: true });
  }

  getMovementVector() {
    const fwd = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
                (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const right = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
                  (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
    const isRunning = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const isJumping = !!this.keys['Space'];

    return { fwd, right, isRunning, isJumping };
  }

  unlockPointer() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) {
      this.keys = {};
      this.unlockPointer();
    }
  }
}
