import * as THREE from 'three';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';
import { CharacterModel } from './CharacterModel.js';

/**
 * Facility stations in the city (driving school instructor, recycling centre) and persistent world changes
 * unlocked by activities (the central park blooms after the recycling campaign).
 * Museum and first-aid activities open from action points inside their buildings (InteriorSystem).
 */
export class CityFacilities {
  constructor(game) {
    this.game = game;
    this.flags = {};
    this.lastHint = null;
    this.stations = [
      { id: 'driving', activity: 'driving', pos: new THREE.Vector3(66.6, 0, 49.6), r: 2.6, label: '🚦 اضغط <b>E</b> للتحدث مع مدرّب السياقة رضا' },
      { id: 'recycling', activity: 'recycling', pos: new THREE.Vector3(24, 0, 6.2), r: 2.4, label: '♻️ اضغط <b>E</b>: مركز الفرز وإعادة التدوير' }
    ];
    this.buildInstructor();
    this.buildRecyclingSign();
  }

  station(id) { return this.stations.find(s => s.id === id); }

  buildInstructor() {
    const s = this.station('driving');
    const m = new CharacterModel('npc_adult', { isNPC: true, npcRole: 'teacher', primaryColor: 0xf39c12, secondaryColor: 0x2c3e50, skinColor: 0xc99872, build: 1, height: 1 });
    m.group.position.set(s.pos.x, this.game.collisionSystem.getGroundHeight(s.pos.x, s.pos.z), s.pos.z);
    m.group.rotation.y = Math.PI; // facing the road
    this.game.engine.scene.add(m.group);
    this.game.collisionSystem.addBox(s.pos.x - 0.35, s.pos.z - 0.35, s.pos.x + 0.35, s.pos.z + 0.35, 2);
    this.instructor = m;
    this.addSign('🚦 مدرسة السياقة', 'تعلّم قواعد المرور', s.pos.x + 2.2, s.pos.z + 0.6, Math.PI, '#d35400');
  }

  buildRecyclingSign() {
    const s = this.station('recycling');
    this.addSign('♻️ مركز الفرز', 'ورق • بلاستيك • معادن', s.pos.x + 2.6, s.pos.z + 1.2, Math.PI, '#1e8449');
  }

  addSign(title, sub, x, z, rotY, bg) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 300;
    const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      g.fillStyle = bg; g.fillRect(0, 0, 1024, 300);
      g.strokeStyle = '#fff'; g.lineWidth = 12; g.strokeRect(10, 10, 1004, 280);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.direction = 'rtl';
      g.font = '800 100px Cairo, Tajawal, sans-serif'; g.fillText(title, 512, 130, 960);
      g.font = '600 54px Cairo, Tajawal, sans-serif'; g.fillText(sub, 512, 228, 960);
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    const grp = new THREE.Group();
    grp.position.set(x, this.game.collisionSystem.getGroundHeight(x, z), z);
    grp.rotation.y = rotY;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.6), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, side: THREE.DoubleSide }));
    board.position.y = 2.2;
    grp.add(board);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x2c2c2c }));
    post.position.y = 1.1;
    grp.add(post);
    this.game.engine.scene.add(grp);
    this.game.collisionSystem.addBox(x - 0.12, z - 0.12, x + 0.12, z + 0.12, 2.2);
  }

  near(s) {
    const p = this.game.player.position;
    return Math.hypot(p.x - s.pos.x, p.z - s.pos.z) < s.r;
  }

  tryInteract() {
    const g = this.game;
    if (g.vehicle.driving || g.interiors.isInside() || (g.coast && g.coast.inCoast)) return false;
    const s = this.stations.find(st => this.near(st));
    if (!s) return false;
    audio.playClick();
    g.activities.openMenu(s.activity);
    return true;
  }

  update(dt) {
    const g = this.game;
    let hint = null;
    if (!g.vehicle.driving && !g.interiors.isInside() && !(g.coast && g.coast.inCoast)) {
      const s = this.stations.find(st => this.near(st));
      if (s) hint = s.label;
    }
    if (hint !== this.lastHint) { this.lastHint = hint; g.ui.setCustomHint(hint, 'zone2'); }
    const p = g.player.position, s = this.station('driving');
    if (Math.hypot(p.x - s.pos.x, p.z - s.pos.z) < 40) this.instructor.update(dt, { isMoving: false });
  }

  // ─────────────────────────────────────────────────────────────
  // Persistent world changes
  // ─────────────────────────────────────────────────────────────
  setWorldFlag(key, value) {
    if (this.flags[key] === value) return;
    this.flags[key] = value;
    this.applyFlags(true);
  }

  applyFlags(announce = false) {
    if (this.flags.parkBloom && !this.bloom) {
      this.bloom = this.buildFlowerBeds();
      if (announce) {
        audio.playMissionComplete();
        events.emit('TOAST', '🌸 بفضل حملة التنظيف والفرز أزهرت الحديقة المركزية! انظر إلى أحواض الزهور الجديدة.');
      }
    }
  }

  /** Flower beds along the park's edges (instanced: two draw calls) */
  buildFlowerBeds() {
    const pts = [];
    const add = (x, z) => pts.push([x + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5]);
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const a = 10.6 + t * 21.3;
      add(a, 10.4); add(a, 32.1); add(10.4, a); add(32.1, a);
    }
    for (let i = 0; i < 40; i++) { const ang = (i / 40) * Math.PI * 2; add(21.25 + Math.cos(ang) * 4.4, 21.25 + Math.sin(ang) * 4.4); }
    const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.02, 0.32, 5).translate(0, 0.16, 0), new THREE.MeshStandardMaterial({ color: 0x2e7d32 }), pts.length);
    const head = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 1).scale(1, 0.6, 1).translate(0, 0.34, 0), new THREE.MeshStandardMaterial({ roughness: 0.6 }), pts.length);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    const palette = [0xe74c3c, 0xf1c40f, 0xff7eb6, 0xffffff, 0x9b59b6, 0xff9f43];
    pts.forEach(([x, z], i) => {
      const y = this.game.collisionSystem.getGroundHeight(x, z);
      const s = 0.8 + Math.random() * 0.5;
      m.makeScale(s, s, s).setPosition(x, y, z);
      stem.setMatrixAt(i, m);
      head.setMatrixAt(i, m);
      head.setColorAt(i, c.setHex(palette[i % palette.length]));
    });
    this.game.engine.scene.add(stem, head);
    return [stem, head];
  }

  getState() { return { flags: { ...this.flags } }; }
  loadState(s) { if (s && s.flags) { this.flags = { ...s.flags }; this.applyFlags(false); } }
}
