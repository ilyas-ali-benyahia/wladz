export class MapSystem {
  constructor(engine) {
    this.engine = engine;
    this.miniCanvas = document.getElementById('minimap-canvas');
    this.miniCtx = this.miniCanvas ? this.miniCanvas.getContext('2d') : null;

    this.fullCanvas = document.getElementById('fullmap-canvas');
    this.fullCtx = this.fullCanvas ? this.fullCanvas.getContext('2d') : null;

    this.landmarks = [
      { name: 'المسجد الكبير', icon: '🕌', x: -62, z: 22, color: '#16a085' },
      { name: 'المتحف الوطني', icon: '🏛️', x: 21, z: -23, color: '#8e44ad' },
      { name: 'المكتبة العامة', icon: '📚', x: -18, z: -22, color: '#00b894' },
      { name: 'المدرسة', icon: '🏫', x: -63, z: -21, color: '#2980b9' },
      { name: 'السوق الشعبي', icon: '🛒', x: 21, z: 63, color: '#e67e22' },
      { name: 'المركز الصحي', icon: '🏥', x: 63, z: -21, color: '#e74c3c' },
      { name: 'الحديقة المركزية', icon: '🌳', x: 21, z: 21, color: '#27ae60' },
      { name: 'ساحة الاستقلال', icon: '⭐', x: 0, z: 0, color: '#f1c40f' },
      { name: 'مقر الأمن الوطني', icon: '👮‍♂️', x: -21, z: 63, color: '#1b3b6f' },
      { name: 'الحماية المدنية', icon: '🚒', x: -21, z: -63, color: '#c0392b' },
      { name: 'مقر البلدية', icon: '🏛️', x: 21, z: -69, color: '#16a085' },
      { name: 'حي القصبة العتيق', icon: '🏺', x: 63, z: 21, color: '#d35400' },
      { name: 'جمعية شباب التطوع', icon: '🤝', x: -21, z: 15, color: '#1e8449' }
    ];

    this.isFullMapOpen = false;
  }

  update(playerPos, playerHeading) {
    if (this.miniCtx) {
      this.drawMiniMap(playerPos, playerHeading);
    }
    if (this.isFullMapOpen && this.fullCtx) {
      this.drawFullMap(playerPos, playerHeading);
    }
  }

  drawMiniMap(playerPos, playerHeading) {
    const ctx = this.miniCtx;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Dark circular background with border
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, w, h);

    // World scale: 1 world unit = 1.4 canvas pixels
    const scale = 1.5;

    ctx.save();
    // Center on player
    ctx.translate(cx, cy);

    // Draw main roads relative to player
    ctx.fillStyle = '#34495e';
    // East-West road (z=0)
    ctx.fillRect(-80 * scale - playerPos.x * scale, -4 * scale - playerPos.z * scale, 160 * scale, 8 * scale);
    // North-South road (x=0)
    ctx.fillRect(-4 * scale - playerPos.x * scale, -80 * scale - playerPos.z * scale, 8 * scale, 160 * scale);

    // Draw Central Park green patch
    ctx.fillStyle = '#27ae60';
    ctx.fillRect((24 - 14 - playerPos.x) * scale, (10 - 11 - playerPos.z) * scale, 28 * scale, 22 * scale);

    // Draw Landmarks icons
    this.landmarks.forEach(lm => {
      const lx = (lm.x - playerPos.x) * scale;
      const lz = (lm.z - playerPos.z) * scale;

      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lm.icon, lx, lz);
    });

    ctx.restore();

    // Draw Player in the center with orientation arrow
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Direction arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerHeading);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawFullMap(playerPos, playerHeading) {
    const ctx = this.fullCtx;
    const w = this.fullCanvas.width;
    const h = this.fullCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, w, h);

    // Map bounds: -65 to +65
    const toScreenX = (wx) => ((wx + 65) / 130) * w;
    const toScreenZ = (wz) => ((wz + 65) / 130) * h;

    // Draw roads
    ctx.fillStyle = '#34495e';
    // Main horizontal road
    ctx.fillRect(0, toScreenZ(-4.5), w, (9 / 130) * h);
    // Main vertical road
    ctx.fillRect(toScreenX(-4.5), 0, (9 / 130) * w, h);

    // Park area
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(toScreenX(24 - 14), toScreenZ(10 - 11), (28 / 130) * w, (22 / 130) * h);

    // Landmarks
    this.landmarks.forEach(lm => {
      const sx = toScreenX(lm.x);
      const sz = toScreenZ(lm.z);

      // Icon & badge
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(sx, sz, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lm.icon, sx, sz);

      // Arabic Label
      ctx.font = 'bold 12px "Tajawal", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(lm.name, sx, sz + 24);
    });

    // Player position on full map
    const px = toScreenX(playerPos.x);
    const pz = toScreenZ(playerPos.z);

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(px, pz, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 12px "Tajawal", sans-serif';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('أنت هنا 📍', px, pz - 16);
  }

  toggleFullMap() {
    this.isFullMapOpen = !this.isFullMapOpen;
    const modal = document.getElementById('fullmap-modal');
    if (modal) {
      if (this.isFullMapOpen) {
        modal.classList.add('show');
      } else {
        modal.classList.remove('show');
      }
    }
  }
}
