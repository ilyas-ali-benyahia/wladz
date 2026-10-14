// Independent pointer ownership lets one thumb aim while the other fires.
export class MobileControls {
  constructor({ root, stick, knob, fireButton, canvas, onAim, onFire }) {
    Object.assign(this, { root, stick, knob, fireButton, canvas, onAim, onFire });
    this.enabled = false;
    this.canFire = false;
    this.stickId = this.dragId = this.fireId = null;
    this.x = this.y = 0;

    stick.addEventListener('pointerdown', e => {
      if (!this.enabled || this.stickId !== null || e.button !== 0) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      const bounds = stick.getBoundingClientRect();
      this.cx = bounds.left + bounds.width / 2;
      this.cy = bounds.top + bounds.height / 2;
      this.radius = bounds.width * 0.3;
      stick.setPointerCapture(e.pointerId);
      this.moveStick(e);
    });
    stick.addEventListener('pointermove', e => {
      if (e.pointerId === this.stickId) this.moveStick(e);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      stick.addEventListener(name, e => {
        if (e.pointerId !== this.stickId) return;
        this.stickId = null;
        this.x = this.y = 0;
        knob.style.transform = 'translate(0px, 0px)';
        stick.classList.remove('engaged');
      });
    }
    stick.addEventListener('keydown', e => {
      if (!this.enabled) return;
      const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
      if (dx || dy) { e.preventDefault(); onAim(dx * 0.05, dy * 0.05); }
    });

    // Dragging the open arena is an optional direct-aim alternative. A tap
    // here never fires; only the dedicated fire control submits an answer.
    canvas.addEventListener('pointerdown', e => {
      if (!this.enabled || this.dragId !== null || e.pointerType === 'mouse') return;
      e.preventDefault();
      this.dragId = e.pointerId;
      this.lastX = e.clientX; this.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId !== this.dragId) return;
      onAim((e.clientX - this.lastX) * 0.0035, (e.clientY - this.lastY) * 0.0035);
      this.lastX = e.clientX; this.lastY = e.clientY;
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(name, e => {
        if (e.pointerId === this.dragId) this.dragId = null;
      });
    }

    fireButton.addEventListener('pointerdown', e => {
      if (!this.enabled || !this.canFire || this.fireId !== null || e.button !== 0) return;
      e.preventDefault();
      this.fireId = e.pointerId;
      fireButton.setPointerCapture(e.pointerId);
      fireButton.classList.add('pressed');
      onFire(); // One deliberate shot per press, with no repeat timer.
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      fireButton.addEventListener(name, e => {
        if (e.pointerId !== this.fireId) return;
        this.fireId = null;
        fireButton.classList.remove('pressed');
      });
    }
    // Keyboard and assistive-technology activation has no pointerdown.
    fireButton.addEventListener('click', e => {
      if (e.detail === 0 && this.enabled && this.canFire) onFire();
    });
  }

  moveStick(e) {
    let dx = e.clientX - this.cx, dy = e.clientY - this.cy;
    const distance = Math.hypot(dx, dy);
    const scale = distance > this.radius ? this.radius / distance : 1;
    dx *= scale; dy *= scale;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.stick.classList.add('engaged');
    const magnitude = Math.min(distance / this.radius, 1);
    const response = magnitude > 0.12 ? (magnitude - 0.12) / 0.88 : 0;
    this.x = distance > 0 ? (e.clientX - this.cx) / distance * response : 0;
    this.y = distance > 0 ? (e.clientY - this.cy) / distance * response : 0;
  }

  update(dt) {
    if (this.enabled && (this.x || this.y)) this.onAim(this.x * 1.8 * dt, this.y * 1.35 * dt);
  }

  setEnabled(enabled, canFire = enabled) {
    canFire = enabled && canFire;
    if (this.enabled !== enabled) {
      this.enabled = enabled;
      this.root.hidden = !enabled;
      if (!enabled) this.reset();
    }
    if (this.canFire !== canFire) {
      this.canFire = canFire;
      if (!canFire) {
        const id = this.fireId;
        this.fireId = null;
        if (id !== null && this.fireButton.hasPointerCapture(id)) this.fireButton.releasePointerCapture(id);
        this.fireButton.classList.remove('pressed');
      }
      this.fireButton.disabled = !canFire;
    }
  }

  reset() {
    for (const [element, key] of [[this.stick, 'stickId'], [this.canvas, 'dragId'], [this.fireButton, 'fireId']]) {
      const id = this[key];
      this[key] = null;
      if (id !== null && element.hasPointerCapture(id)) element.releasePointerCapture(id);
    }
    this.x = this.y = 0;
    this.knob.style.transform = 'translate(0px, 0px)';
    this.stick.classList.remove('engaged');
    this.fireButton.classList.remove('pressed');
  }
}
