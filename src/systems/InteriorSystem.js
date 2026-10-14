import * as THREE from 'three';
import { events } from '../core/EventBus.js';
import { addSurfaceDetail } from '../core/MaterialUpgrader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * InteriorSystem: enterable landmarks with Arabic name signs.
 * - Each landmark has an exterior door point with a bilingual-ready Arabic gateway sign
 * - Pressing E at a door fades to a furnished interior (built once, far from the city) and back
 * - Interiors contain information points (E) with short, verified educational facts
 * - While inside, collision bounds and the camera are clamped to the room
 */

const FONT = '"Cairo", "Tajawal", "Segoe UI", Tahoma, sans-serif';

/** Canvas texture with right-to-left Arabic text (redrawn once web fonts finish loading) */
function makeTextTexture(text, { width = 1024, height = 256, bg = '#14532d', fg = '#ffffff', border = '#d4af37', size = 110, sub = null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const draw = () => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = Math.max(6, height * 0.04);
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, width - ctx.lineWidth * 2, height - ctx.lineWidth * 2);
    }
    ctx.fillStyle = fg;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.fillText(text, width / 2, sub ? height * 0.4 : height / 2, width * 0.92);
    if (sub) {
      ctx.font = `600 ${Math.round(size * 0.45)}px ${FONT}`;
      ctx.fillText(sub, width / 2, height * 0.76, width * 0.92);
    }
    tex.needsUpdate = true;
  };
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  return tex;
}

function textPanel(text, w, h, opts = {}) {
  const tex = makeTextTexture(text, { width: 1024, height: Math.round(1024 * (h / w)), ...opts });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18 })
  );
}

const mat = (color, roughness = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });

// Landmark definitions: exterior door (x, z), outward normal, name, interior type
const LANDMARKS = [
  { id: 'museum', name: 'المتحف الوطني', sub: 'تاريخ وذاكرة الجزائر', door: [21, -12.8], normal: [0, 1], color: '#4a235a' },
  { id: 'mosque', name: 'المسجد الكبير', sub: 'بيت من بيوت الله', door: [-64.5, 9.4], normal: [0, -1], color: '#0e6655' },
  { id: 'library', name: 'المكتبة العامة', sub: 'اقرأ وتعلّم', door: [-21, -15.3], normal: [0, 1], color: '#145a32' },
  { id: 'school', name: 'المدرسة الابتدائية', sub: 'العلم نور', door: [-65, -15.8], normal: [0, 1], color: '#1a5276' },
  { id: 'clinic', name: 'المركز الصحي', sub: 'صحتك أمانة', door: [60.5, -14.8], normal: [0, 1], color: '#922b21' },
  { id: 'police', name: 'مقر الأمن الوطني', sub: 'في خدمة المواطن', door: [-21, 54.8], normal: [0, -1], color: '#1b2a49' },
  { id: 'fire', name: 'مركز الحماية المدنية', sub: 'الإنقاذ والإسعاف', door: [-24, -54.8], normal: [0, 1], color: '#a93226' },
  { id: 'townhall', name: 'مقر البلدية', sub: 'المجلس الشعبي البلدي', door: [21, -60.5], normal: [0, 1], color: '#0b5345' },
  { id: 'casbah', name: 'دار القصبة العتيقة', sub: 'تراث عالمي', door: [54.8, 21], normal: [-1, 0], color: '#784212' },
  { id: 'association', name: 'جمعية شباب التطوع', sub: 'يد واحدة لا تصفق', door: [-21, 10.2], normal: [0, -1], color: '#1e8449' },
  { id: 'home', name: 'منزلي', sub: 'بيت العائلة', door: [75, 54.6], normal: [0, -1], color: '#7d5a3c' }
];

export class InteriorSystem {
  constructor(engine, collisionSystem, player, ui) {
    this.engine = engine;
    this.scene = engine.scene;
    this.collision = collisionSystem;
    this.player = player;
    this.ui = ui;

    this.landmarks = LANDMARKS.map(l => ({ ...l }));
    this.interiors = {};
    this.current = null; // active interior while inside
    this.nearDoor = null;
    this.nearExit = false;
    this.nearPOI = null;
    this.busy = false;

    // One shared interior light (moved to the active room; off outside)
    this.roomLight = new THREE.PointLight(0xfff1dc, 0, 40, 1.2);
    this.scene.add(this.roomLight);

    this.createFadeOverlay();
    this.landmarks.forEach((l, i) => {
      this.createEntranceSign(l);
      this.interiors[l.id] = this.buildInterior(l, i);
    });
  }

  createFadeOverlay() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .35s ease;z-index:900';
    document.body.appendChild(el);
    this.fadeEl = el;
  }

  /** Arabic name gateway sign in front of each entrance */
  createEntranceSign(l) {
    const [dx, dz] = l.door;
    const [nx, nz] = l.normal;
    const g = new THREE.Group();
    g.position.set(dx + nx * 0.3, 0, dz + nz * 0.3);
    g.rotation.y = Math.atan2(nx, nz);

    const postMat = mat(0x2c2c2c, 0.5, { metalness: 0.4 });
    [-1.7, 1.7].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.3, 10), postMat);
      post.position.set(px, 1.65, 0);
      post.castShadow = true;
      g.add(post);
      this.collision.addBox(dx + nx * 0.3 + px * nz - 0.12, dz + nz * 0.3 - px * nx - 0.12, dx + nx * 0.3 + px * nz + 0.12, dz + nz * 0.3 - px * nx + 0.12, 3.3);
    });
    const board = textPanel(l.name, 3.6, 0.9, { bg: l.color, sub: l.sub, size: 96 });
    board.position.set(0, 2.95, 0.04);
    g.add(board);
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.0, 0.06), mat(0x2c2c2c, 0.6));
    back.position.set(0, 2.95, 0);
    g.add(back);
    // Door mat marks the entrance spot
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), mat(0x7b241c, 0.95, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.215, -0.2);
    g.add(rug);
    this.scene.add(g);
  }

  // ─────────────────────────────────────────────────────────────
  // Interior construction
  // ─────────────────────────────────────────────────────────────
  buildInterior(l, index) {
    const sizes = {
      museum: [24, 18, 7], mosque: [22, 20, 8], library: [20, 16, 5.5], school: [18, 14, 4.5], clinic: [16, 14, 4.5],
      police: [18, 14, 4.5], fire: [22, 16, 7], townhall: [20, 16, 6], casbah: [16, 16, 7], association: [18, 14, 5], home: [14, 11, 3.6]
    };
    const [w, d, h] = sizes[l.id];
    const origin = new THREE.Vector3(500 + (index % 3) * 60, 0, -60 + Math.floor(index / 3) * 60);
    const room = new THREE.Group();
    room.position.copy(origin);
    this.scene.add(room);

    const palette = {
      museum: [0xf3ead8, 0xd9cdb6], mosque: [0xf7f3e8, 0x9c2a2a], library: [0xefe4cf, 0x8d6e53], school: [0xf2efe4, 0xc9b79a],
      clinic: [0xf4f8f8, 0xdfe7e6], police: [0xe8ecf1, 0xb9b3a7], fire: [0xe9e4dc, 0x8a8a8a], townhall: [0xf1ece0, 0xcbbd9f], casbah: [0xfbf6ec, 0x2e86c1], association: [0xf6efe0, 0xc9b79a], home: [0xf7efe1, 0xa47551]
    }[l.id];

    // Shell: inward-facing box (walls + ceiling), lit by the shared room light; does not block the sun
    const shell = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), addSurfaceDetail(mat(palette[0], 0.9, { side: THREE.BackSide }), 0.035));
    shell.position.y = h / 2;
    shell.receiveShadow = true;
    room.add(shell);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), addSurfaceDetail(mat(palette[1], 0.7), 0.05, l.id === 'mosque' ? 0 : 1.0));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    room.add(floor);
    // Skirting band
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.5, d - 0.02), mat(0x6e5a44, 0.8, { side: THREE.BackSide }));
    skirt.position.y = 0.25;
    room.add(skirt);

    // Exit door on the front wall (+z)
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.0, 0.2), mat(0x5d4037, 0.6));
    doorFrame.position.set(0, 1.5, d / 2 - 0.08);
    room.add(doorFrame);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.7, 0.1), mat(0x8d6e63, 0.55));
    door.position.set(0, 1.35, d / 2 - 0.2);
    room.add(door);
    const exitSign = textPanel('خروج', 1.4, 0.45, { bg: '#1e8449', size: 150, border: null });
    exitSign.position.set(0, 3.35, d / 2 - 0.12);
    exitSign.rotation.y = Math.PI;
    room.add(exitSign);

    // Big name panel on the back wall
    const title = textPanel(l.name, Math.min(8, w * 0.45), Math.min(2, w * 0.11), { bg: l.color, sub: l.sub, size: 100 });
    title.position.set(0, h - 1.4, -d / 2 + 0.05);
    room.add(title);

    // Ceiling lamps (emissive discs; actual light comes from the shared point light)
    for (let i = -1; i <= 1; i += 2) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), mat(0xfff6e0, 0.4, { emissive: 0xfff1d0, emissiveIntensity: 1.2 }));
      lamp.position.set(i * w * 0.22, h - 0.05, 0);
      room.add(lamp);
    }

    const interior = {
      id: l.id, name: l.name, room, origin, w, d, h,
      spawn: origin.clone().add(new THREE.Vector3(0, 0, d / 2 - 5)),
      exit: origin.clone().add(new THREE.Vector3(0, 0, d / 2 - 1.0)),
      pois: []
    };
    const addBox = (x, z, sx, sz, hh = 2) => {
      this.collision.addBox(origin.x + x - sx / 2, origin.z + z - sz / 2, origin.x + x + sx / 2, origin.z + z + sz / 2, hh);
    };
    const poi = (x, z, title, text) => interior.pois.push({ pos: origin.clone().add(new THREE.Vector3(x, 0, z)), title, text });

    this.furnish(l.id, room, interior, addBox, poi);

    room.traverse(m => { if (m.isMesh) m.castShadow = false; });
    room.visible = false; // only the room the player is in gets drawn
    return interior;
  }

  furnish(id, room, it, addBox, poi) {
    const { w, d, h } = it;
    const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = false; mesh.receiveShadow = true; room.add(mesh); return mesh; };
    const wallPanel = (text, sub, x, z, rotY, bg) => {
      const p = textPanel(text, 3.2, 1.6, { bg, sub, size: 92 });
      p.rotation.y = rotY;
      add(p, x, 2.3, z);
    };

    if (id === 'museum') {
      wallPanel('1 نوفمبر 1954', 'اندلاع الثورة التحريرية', -w / 2 + 0.06, -3, Math.PI / 2, '#7b241c');
      wallPanel('5 جويلية 1962', 'استقلال الجزائر', -w / 2 + 0.06, 3, Math.PI / 2, '#145a32');
      wallPanel('الأمير عبد القادر', '1808 – 1883', w / 2 - 0.06, -3, -Math.PI / 2, '#4a235a');
      wallPanel('التراث الفخاري', 'صناعة تقليدية جزائرية', w / 2 - 0.06, 3, -Math.PI / 2, '#784212');
      // Pedestals with exhibits
      [[-4, -2], [4, -2], [0, -5]].forEach(([x, z], i) => {
        add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), mat(0xffffff, 0.5)), x, 0.5, z);
        const vase = new THREE.Mesh(new THREE.LatheGeometry([
          new THREE.Vector2(0.01, 0), new THREE.Vector2(0.22, 0.05), new THREE.Vector2(0.32, 0.35), new THREE.Vector2(0.18, 0.7), new THREE.Vector2(0.24, 0.85)
        ], 24), mat([0xb5651d, 0x8e5b3a, 0xc0392b][i], 0.6));
        add(vase, x, 1.0, z);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), mat(0xddeeff, 0.05, { transparent: true, opacity: 0.18, depthWrite: false }));
        add(glass, x, 1.5, z);
        addBox(x, z, 1.3, 1.3);
      });
      poi(-w / 2 + 1.6, -3, '1 نوفمبر 1954', 'في الفاتح من نوفمبر 1954 اندلعت ثورة التحرير الجزائرية المجيدة.');
      poi(-w / 2 + 1.6, 3, '5 جويلية 1962', 'في 5 جويلية 1962 استرجعت الجزائر استقلالها بعد كفاح طويل.');
      poi(w / 2 - 1.6, -3, 'الأمير عبد القادر', 'الأمير عبد القادر (1808–1883) قاد المقاومة الشعبية ضد الاحتلال الفرنسي، ويُعدّ مؤسس الدولة الجزائرية الحديثة.');
      poi(w / 2 - 1.6, 3, 'التراث الفخاري', 'الفخار من أقدم الصناعات التقليدية في الجزائر، ويعكس ذوق وهوية كل منطقة.');
    } else if (id === 'mosque') {
      // Prayer carpet rows facing the mihrab
      for (let r = 0; r < 5; r++) {
        const rug = new THREE.Mesh(new THREE.PlaneGeometry(w - 3, 1.5), mat(r % 2 ? 0x1e8449 : 0x922b21, 0.95, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
        rug.rotation.x = -Math.PI / 2;
        add(rug, 0, 0.02, -d / 2 + 3 + r * 1.8);
      }
      // Mihrab: arch niche on the back wall
      // Semicircular arch on top of the niche, framed in gold
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32, 1, false, Math.PI / 2, Math.PI), mat(0x0e6655, 0.6));
      arch.rotation.x = Math.PI / 2;
      add(arch, 0, 3.2, -d / 2 + 0.15);
      add(new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.07, 8, 32, Math.PI), mat(0xd4ac0d, 0.35, { metalness: 0.5 })), 0, 3.2, -d / 2 + 0.32);
      [-1.22, 1.22].forEach(x => add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.14), mat(0xd4ac0d, 0.35, { metalness: 0.5 })), x, 1.6, -d / 2 + 0.32));
      add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.3), mat(0x0e6655, 0.6)), 0, 1.6, -d / 2 + 0.15);
      // Columns with arches
      [-w / 4, w / 4].forEach(x => [-2, 4].forEach(z => {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, h, 16), mat(0xffffff, 0.5)), x, h / 2, z);
        addBox(x, z, 0.9, 0.9, h);
      }));
      // Chandelier
      add(new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 8, 32), mat(0xd4ac0d, 0.3, { metalness: 0.6 })), 0, h - 1.5, 0).rotation.x = Math.PI / 2;
      poi(0, d / 2 - 3.5, 'آداب المسجد', 'في المسجد نحافظ على الهدوء والنظافة، ونخلع أحذيتنا، ونحترم المصلّين.');
    } else if (id === 'library') {
      const spines = makeBookTexture();
      for (let i = 0; i < 4; i++) {
        const x = -w / 2 + 3 + i * ((w - 6) / 3);
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.0, 0.6), [mat(0x6d4c41), mat(0x6d4c41), mat(0x6d4c41), mat(0x6d4c41), new THREE.MeshStandardMaterial({ map: spines, roughness: 0.8 }), mat(0x6d4c41)]);
        add(shelf, x, 1.5, -d / 2 + 0.6);
      }
      [[-3.5, 1], [3.5, 1]].forEach(([x, z]) => {
        add(new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.4), mat(0x8d6e63, 0.5)), x, 0.78, z);
        [-1.3, 1.3].forEach(o => add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.78, 1.2), mat(0x5d4037)), x + o, 0.39, z));
        add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.22), mat(0x2e86c1)), x - 0.5, 0.86, z);
        addBox(x, z, 3.2, 1.6, 1);
      });
      addBox(0, -d / 2 + 0.6, w, 1.0, 3);
      poi(0, -d / 2 + 2.2, 'ركن القراءة', 'القراءة اليومية تنمّي الخيال وتثري اللغة. استعر كتاباً وأعده في موعده!');
    } else if (id === 'school') {
      const board = textPanel('مرحباً بكم في مدرستنا', 6, 1.8, { bg: '#1d3b2a', border: '#8d6e63', size: 90, sub: 'العلم نور والجهل ظلام' });
      add(board, 0, 2.2, -d / 2 + 0.06);
      for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) {
        const x = c * 4, z = -2 + r * 2.6;
        add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.7), mat(0xd7b98e, 0.6)), x, 0.72, z);
        add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.06), mat(0x7f8c8d)), x, 0.36, z + 0.3);
        add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), mat(0x2e86c1)), x, 0.23, z + 0.75);
        addBox(x, z + 0.2, 1.5, 1.0, 1);
      }
      poi(0, -d / 2 + 2, 'السبورة', 'العلم نور: المواظبة على الدراسة واحترام المعلم طريق النجاح.');
    } else if (id === 'clinic' || id === 'police' || id === 'townhall') {
      // Service counter
      const counter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 1.1, 0.8), mat(id === 'clinic' ? 0xffffff : 0x8d6e63, 0.5));
      add(counter, 0, 0.55, -d / 2 + 3);
      addBox(0, -d / 2 + 3, w * 0.55, 1.0, 1.2);
      // Waiting chairs
      for (let i = -2; i <= 2; i++) {
        add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), mat(id === 'police' ? 0x1b2a49 : 0x2e86c1)), i * 1.2, 0.23, 2.5);
      }
      addBox(0, 2.5, 6.2, 0.8, 1);
      if (id === 'clinic') {
        [-w / 2 + 2, w / 2 - 2].forEach(x => {
          add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 2.0), mat(0xecf0f1)), x, 0.5, -1);
          add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), mat(0xffffff)), x, 0.86, -1.7);
          addBox(x, -1, 1.2, 2.2, 1);
        });
        poi(0, -d / 2 + 4.2, 'نظافة اليدين', 'اغسل يديك بالماء والصابون مدة 20 ثانية على الأقل، فذلك يحميك من كثير من الأمراض.');
      } else if (id === 'police') {
        poi(0, -d / 2 + 4.2, 'رقم الطوارئ', 'في حالة الخطر اتصل بالشرطة على الرقم 17، وأبلغ عن أي وضع مريب لشخص بالغ تثق به.');
      } else {
        const flag = textPanel('الجمهورية الجزائرية الديمقراطية الشعبية', 7, 1.0, { bg: '#0b5345', size: 64, border: '#d4af37' });
        add(flag, 0, 3.0, -d / 2 + 0.06);
        poi(0, -d / 2 + 4.2, 'البلدية', 'البلدية هي الجماعة الإقليمية القاعدية في الجزائر، تقدّم الخدمات اليومية للمواطنين.');
      }
    } else if (id === 'fire') {
      // Garage bay with equipment
      const truck = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 7), mat(0xc0392b, 0.5));
      add(truck, -4, 1.5, -2);
      [-2.8, 2.8].forEach(oz => [-1.35, 1.35].forEach(ox => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 20), mat(0x1c1c1c, 0.8));
        wheel.rotation.z = Math.PI / 2;
        add(wheel, -4 + ox, 0.55, -2 + oz);
      }));
      addBox(-4, -2, 3, 7.4, 3);
      for (let i = 0; i < 4; i++) {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16), mat(0xe74c3c, 0.4)), 4 + i * 0.6, 0.3, -d / 2 + 0.6);
      }
      poi(4.5, -d / 2 + 2, 'رقم الحماية المدنية', 'عند نشوب حريق ابتعد عن الخطر واتصل بالحماية المدنية على الرقم 14، ولا تقترب من النار.');
    } else if (id === 'association') {
      // Volunteer hall: sorting tables with donation boxes, posters and the mission board
      [[-4, -1], [4, -1]].forEach(([x, z]) => {
        add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.4), mat(0x8d6e63, 0.5)), x, 0.8, z);
        [-1.4, 1.4].forEach(o => add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.2), mat(0x5d4037)), x + o, 0.4, z));
        for (let i = 0; i < 3; i++) add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), mat(0xc8a165)), x - 1 + i, 1.08, z);
        addBox(x, z, 3.4, 1.6, 1.2);
      });
      const board = textPanel('لوحة المهام التطوعية', 5, 1.6, { bg: '#1e8449', sub: 'نظافة • تضامن • إطفاء • رفق بالحيوان • معرفة', size: 84 });
      add(board, 0, 2.3, -d / 2 + 0.06);
      const poster1 = textPanel('تطوّع معنا', 2.6, 1.3, { bg: '#c0392b', sub: 'خدمة الحي واجب الجميع', size: 110 });
      poster1.rotation.y = Math.PI / 2;
      add(poster1, -w / 2 + 0.06, 2.2, 1.5);
      const poster2 = textPanel('يد واحدة لا تصفق', 2.6, 1.3, { bg: '#1f618d', sub: 'معاً نبني حيّنا', size: 92 });
      poster2.rotation.y = -Math.PI / 2;
      add(poster2, w / 2 - 0.06, 2.2, 1.5);
      poi(0, -d / 2 + 2, 'لوحة المهام', 'التطوع يعني أن تقدّم وقتك وجهدك لخدمة الآخرين دون مقابل. تحدّث مع السيدة سميرة عند المدخل لاستلام مهمتك التطوعية.');
    } else if (id === 'home') {
      // Family home: living corner, kitchen and dining, bed corner; info points teach saving energy and water
      const wood = mat(0x8d6e4f, 0.6), fabric = mat(0x3f6e8c, 0.9), cushion = mat(0xe8d9b5, 0.9), white = mat(0xf4f4f0, 0.5);
      const rbox = (sx, sy, sz, m, r = 0.05) => new THREE.Mesh(new RoundedBoxGeometry(sx, sy, sz, 2, r), m);
      // Living corner: rug, sofa facing the TV on the back wall, round coffee table
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), mat(0x9c3d2e, 0.95, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
      rug.rotation.x = -Math.PI / 2;
      add(rug, -4, 0.02, -2.6);
      add(rbox(2.6, 0.45, 0.9, fabric, 0.12), -4, 0.32, -0.6);
      add(rbox(2.6, 0.75, 0.28, fabric, 0.12), -4, 0.62, -0.12);
      [-5.25, -2.75].forEach(x => add(rbox(0.26, 0.62, 0.9, fabric, 0.1), x, 0.4, -0.6));
      [-4.6, -3.4].forEach(x => add(rbox(1.1, 0.14, 0.75, cushion, 0.06), x, 0.6, -0.65));
      addBox(-4, -0.45, 2.9, 1.1, 1);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.06, 28), wood), -4, 0.45, -2.6);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 12), wood), -4, 0.21, -2.6);
      addBox(-4, -2.6, 1.2, 1.2, 0.5);
      add(rbox(2.6, 0.55, 0.5, wood), -4, 0.28, -5.2);
      add(rbox(1.9, 1.05, 0.08, mat(0x111316, 0.3), 0.03), -4, 1.25, -5.4);
      addBox(-4, -5.2, 2.7, 0.6, 1.5);
      // Bookshelf on the left wall
      add(rbox(0.4, 2.0, 1.6, wood, 0.03), -w / 2 + 0.25, 1.0, 2.6);
      [0.45, 0.95, 1.45].forEach((y, i) => add(rbox(0.3, 0.32, 1.3, mat([0x922b21, 0x1f618d, 0x196f3d][i], 0.7), 0.02), -w / 2 + 0.3, y + 0.16, 2.6));
      addBox(-w / 2 + 0.25, 2.6, 0.5, 1.7, 2);

      // Kitchen along the back wall: counter, sink, fridge
      add(rbox(4.4, 0.92, 0.7, white, 0.04), 4.0, 0.46, -5.1);
      add(rbox(4.5, 0.06, 0.76, mat(0x6d6d6d, 0.35), 0.02), 4.0, 0.95, -5.1);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 10), mat(0xc0c0c0, 0.2, { metalness: 0.8 })), 3.3, 1.12, -5.3);
      add(rbox(0.6, 0.06, 0.45, mat(0x9aa4ab, 0.25, { metalness: 0.6 }), 0.02), 3.3, 0.985, -5.05);
      add(rbox(0.85, 2.0, 0.75, mat(0xdfe3e6, 0.35), 0.08), 6.4, 1.0, -4.9);
      addBox(4.4, -5.0, 5.4, 0.9, 2);

      // Dining table with four chairs
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 32), wood), 4, 0.76, -1.4);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.74, 12), wood), 4, 0.37, -1.4);
      [[0, 1.05], [0, -1.05], [1.05, 0], [-1.05, 0]].forEach(([ox, oz]) => {
        const chair = rbox(0.45, 0.06, 0.45, wood, 0.02);
        add(chair, 4 + ox, 0.46, -1.4 + oz);
        const back = rbox(ox ? 0.06 : 0.45, 0.5, ox ? 0.45 : 0.06, wood, 0.02);
        add(back, 4 + ox * 1.24, 0.72, -1.4 + oz * 1.24);
      });
      addBox(4, -1.4, 2.6, 2.6, 1);

      // Bed corner by the right wall
      add(rbox(1.7, 0.45, 2.2, wood, 0.06), w / 2 - 1.05, 0.25, 3.3);
      add(rbox(1.6, 0.18, 2.0, mat(0xf1e9da, 0.9), 0.08), w / 2 - 1.05, 0.55, 3.3);
      add(rbox(1.62, 0.12, 1.3, mat(0x5b8c5a, 0.9), 0.06), w / 2 - 1.05, 0.66, 3.7);
      add(rbox(0.9, 0.16, 0.4, cushion, 0.07), w / 2 - 1.05, 0.72, 2.5);
      addBox(w / 2 - 1.05, 3.3, 1.9, 2.4, 1);

      // Family motto on the right wall
      const motto = textPanel('بيتي جنّتي', 2.4, 1.0, { bg: '#7d5a3c', sub: 'بيت العائلة', size: 120 });
      motto.rotation.y = -Math.PI / 2;
      add(motto, w / 2 - 0.06, 2.0, -1.4);

      // Light switch and key hook by the front door (information points)
      add(rbox(0.12, 0.18, 0.03, white, 0.01), -1.6, 1.3, d / 2 - 0.08);
      add(rbox(0.5, 0.08, 0.06, wood, 0.02), 1.6, 1.5, d / 2 - 0.08);
      add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16), mat(0xd4af37, 0.3, { metalness: 0.8 })), 1.6, 1.38, d / 2 - 0.1);
      poi(-1.6, d / 2 - 1.2, 'مفتاح الإنارة', 'أطفئ الأضواء والأجهزة عند خروجك من البيت: ترشيد الكهرباء يحمي البيئة ويخفّف فاتورة العائلة.');
      poi(1.6, d / 2 - 1.2, 'مفاتيح السيارة', 'سيارة العائلة متوقفة في الممر أمام المنزل. اقترب منها واضغط E للركوب. W/S للتقدم والرجوع، A/D للانعطاف، والمسافة للفرملة. احترم إشارات المرور والراجلين!');
      poi(3.3, -4.3, 'صنبور الماء', 'أغلق الصنبور جيداً بعد الاستعمال: الماء ثروة ثمينة يجب ترشيدها.');
    } else if (id === 'casbah') {
      // Courtyard house: central fountain, arches and zellige floor
      const zellige = new THREE.Mesh(new THREE.CircleGeometry(3.2, 8), mat(0x1f618d, 0.5, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
      zellige.rotation.x = -Math.PI / 2;
      add(zellige, 0, 0.02, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.6, 24), mat(0xffffff, 0.5)), 0, 0.3, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 24), mat(0x5dade2, 0.1)), 0, 0.58, 0);
      addBox(0, 0, 2.6, 2.6, 1);
      [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([x, z]) => {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, h, 12), mat(0xfdfefe, 0.5)), x, h / 2, z);
        addBox(x, z, 0.7, 0.7, h);
      });
      poi(0, 2.5, 'قصبة الجزائر', 'قصبة الجزائر مصنّفة تراثاً عالمياً من طرف اليونسكو منذ سنة 1992.');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Runtime
  // ─────────────────────────────────────────────────────────────
  update() {
    if (this.busy) return;
    const p = this.player.position;
    let hint = null;

    if (!this.current) {
      this.nearDoor = null;
      for (const l of this.landmarks) {
        if (Math.hypot(p.x - l.door[0], p.z - l.door[1]) < 1.9) { this.nearDoor = l; break; }
      }
      if (this.nearDoor) hint = `اضغط <b>E</b> للدخول إلى ${this.nearDoor.name}`;
    } else {
      const it = this.current;
      this.nearExit = p.distanceTo(it.exit) < 1.8;
      this.nearPOI = this.nearExit ? null : it.pois.find(q => p.distanceTo(q.pos) < 2.0) || null;
      if (this.nearExit) hint = `اضغط <b>E</b> للخروج من ${it.name}`;
      else if (this.nearPOI) hint = `اضغط <b>E</b> لقراءة: ${this.nearPOI.title}`;
    }
    if (hint !== this.lastHint) {
      this.lastHint = hint;
      this.ui.setCustomHint(hint);
    }
  }

  /** Returns true if E was consumed by a door / exit / info point */
  tryInteract() {
    if (this.busy) return false;
    if (!this.current && this.nearDoor) { this.enter(this.nearDoor); return true; }
    if (this.current && this.nearExit) { this.exit(); return true; }
    if (this.current && this.nearPOI) {
      events.emit('TOAST', `📖 ${this.nearPOI.text}`);
      events.emit('INTERIOR_POI_READ', { id: this.current.id, title: this.nearPOI.title });
      return true;
    }
    return false;
  }

  isInside() {
    return !!this.current;
  }

  transition(action) {
    this.busy = true;
    this.fadeEl.style.opacity = '1';
    setTimeout(() => {
      action();
      setTimeout(() => {
        this.fadeEl.style.opacity = '0';
        this.busy = false;
      }, 120);
    }, 360);
  }

  enter(l) {
    const it = this.interiors[l.id];
    this.transition(() => {
      this.returnPoint = new THREE.Vector3(l.door[0] + l.normal[0] * 1.6, 0, l.door[1] + l.normal[1] * 1.6);
      this.returnHeading = Math.atan2(l.normal[0], l.normal[1]);
      this.current = it;
      it.room.visible = true;
      this.collision.bounds = { minX: it.origin.x - it.w / 2 + 0.3, maxX: it.origin.x + it.w / 2 - 0.3, minZ: it.origin.z - it.d / 2 + 0.3, maxZ: it.origin.z + it.d / 2 - 0.3 };
      this.player.cameraBounds = { minX: it.origin.x - it.w / 2 + 0.4, maxX: it.origin.x + it.w / 2 - 0.4, minZ: it.origin.z - it.d / 2 + 0.4, maxZ: it.origin.z + it.d / 2 - 0.4, maxY: it.h - 0.4 };
      this.teleport(it.spawn, Math.PI, 0);
      this.roomLight.position.set(it.origin.x, it.h - 1, it.origin.z);
      this.roomLight.intensity = 60;
      events.emit('TOAST', `🚪 أهلاً بك في ${it.name}`);
      events.emit('INTERIOR_ENTERED', { id: it.id });
    });
  }

  /** Place the player inside an interior immediately (game start at home) */
  startInside(id) {
    const l = this.landmarks.find(x => x.id === id);
    if (!l || this.current) return;
    const it = this.interiors[id];
    this.returnPoint = new THREE.Vector3(l.door[0] + l.normal[0] * 1.6, 0, l.door[1] + l.normal[1] * 1.6);
    this.returnHeading = Math.atan2(l.normal[0], l.normal[1]);
    this.current = it;
    it.room.visible = true;
    this.collision.bounds = { minX: it.origin.x - it.w / 2 + 0.3, maxX: it.origin.x + it.w / 2 - 0.3, minZ: it.origin.z - it.d / 2 + 0.3, maxZ: it.origin.z + it.d / 2 - 0.3 };
    this.player.cameraBounds = { minX: it.origin.x - it.w / 2 + 0.4, maxX: it.origin.x + it.w / 2 - 0.4, minZ: it.origin.z - it.d / 2 + 0.4, maxZ: it.origin.z + it.d / 2 - 0.4, maxY: it.h - 0.4 };
    this.teleport(it.spawn, Math.PI, 0);
    this.roomLight.position.set(it.origin.x, it.h - 1, it.origin.z);
    this.roomLight.intensity = 60;
  }

  exit() {
    const back = this.returnPoint;
    this.transition(() => {
      if (this.current) this.current.room.visible = false;
      this.current = null;
      this.collision.bounds = null;
      this.player.cameraBounds = null;
      this.roomLight.intensity = 0;
      this.teleport(back, this.returnHeading, this.returnHeading + Math.PI);
    });
  }

  teleport(pos, heading, cameraYaw) {
    const pl = this.player;
    if (pl.input) pl.input.yaw = cameraYaw; // camera behind the player, looking the way they face
    pl.position.set(pos.x, 0, pos.z);
    pl.group.position.copy(pl.position);
    pl.heading = heading;
    pl.group.rotation.y = heading;
    // Snap the camera behind the player so it doesn't sweep across the map
    const cam = this.engine.camera;
    cam.position.set(pos.x + Math.sin(cameraYaw) * 3.4, 2.4, pos.z + Math.cos(cameraYaw) * 3.4);
    cam.lookAt(pos.x, 1.2, pos.z);
  }
}

/** Procedural book-spine texture for library shelves */
function makeBookTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(0, 0, 512, 512);
  const colors = ['#922b21', '#1f618d', '#196f3d', '#b7950b', '#6c3483', '#a04000', '#2e4053', '#c0392b'];
  for (let row = 0; row < 4; row++) {
    const y0 = row * 128 + 10;
    let x = 6;
    while (x < 500) {
      const bw = 10 + Math.random() * 16;
      const bh = 90 + Math.random() * 28;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(x, y0 + (118 - bh), bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 2, y0 + (118 - bh) + 12, bw - 4, 4);
      x += bw + 2;
    }
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, row * 128 + 120, 512, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
