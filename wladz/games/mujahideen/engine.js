// Repris de index.html (« المجاهدون الستة »). Modifications WLADZ : three 0.128 du projet
// (three-r128, rendu identique à l'original), sauvegardes par enfant, police Cairo de
// l'application, événements « mujahideen:win » / « mujahideen:exit » pour les points et la sortie.
import * as THREE from 'three-r128';

/* =====================================================================
   DATA
   ===================================================================== */
const LEADERS = [
  { name:'مصطفى بن بولعيد', short:'بن بولعيد', title:'أسد الأوراس · قائد المنطقة الأولى', icon:'🦁', color:'#e0533f',
    obstacle:'صخرة عملاقة تسدّ الممر',
    questions:[
      { q:'أيّ منطقة قادها مصطفى بن بولعيد عند اندلاع الثورة؟', a:['الأوراس (المنطقة الأولى)','القبائل (المنطقة الثالثة)','وهران (المنطقة الخامسة)','الجزائر العاصمة (المنطقة الرابعة)'] },
      { q:'في أيّ سنة استُشهد مصطفى بن بولعيد؟', a:['1956','1954','1958','1962'] } ],
    fact:'لُقّب بـ«أسد الأوراس»، قاد المنطقة الأولى، واستُشهد في مارس 1956 بانفجار جهاز إرسال مفخّخ.' },
  { name:'ديدوش مراد', short:'ديدوش', title:'قائد المنطقة الثانية · الشمال القسنطيني', icon:'⚡', color:'#3d8fe0',
    obstacle:'جذع شجرة ضخم',
    questions:[
      { q:'أيّ منطقة قادها ديدوش مراد عند اندلاع الثورة؟', a:['الشمال القسنطيني (المنطقة الثانية)','الأوراس (المنطقة الأولى)','وهران (المنطقة الخامسة)','القبائل (المنطقة الثالثة)'] },
      { q:'ما الذي ميّز ديدوش مراد بين القادة الستة التاريخيين؟', a:['كان أصغرهم سنّاً','كان أكبرهم سنّاً','كان سفير الثورة في القاهرة','ترأّس الحكومة المؤقتة'] } ],
    fact:'أصغر الستة سنّاً، وأول قائد منطقة يسقط شهيداً، في 18 جانفي 1955 بمعركة وادي بوكركر.' },
  { name:'كريم بلقاسم', short:'كريم', title:'قائد المنطقة الثالثة · القبائل', icon:'🏔️', color:'#2fb36a',
    obstacle:'ركام صخري متساقط',
    questions:[
      { q:'أيّ منطقة قادها كريم بلقاسم عند اندلاع الثورة؟', a:['القبائل (المنطقة الثالثة)','وهران (المنطقة الخامسة)','الأوراس (المنطقة الأولى)','الشمال القسنطيني (المنطقة الثانية)'] },
      { q:'ما الاتفاقيات التي وقّعها كريم بلقاسم باسم الجزائر سنة 1962؟', a:['اتفاقيات إيفيان','معاهدة تافنة','معاهدة فرساي','اتفاقية سايكس بيكو'] } ],
    fact:'قاد المنطقة الثالثة (القبائل)، وترأّس الوفد الجزائري الذي وقّع اتفاقيات إيفيان في 18 مارس 1962.' },
  { name:'رابح بيطاط', short:'بيطاط', title:'قائد المنطقة الرابعة · الجزائر العاصمة', icon:'🌙', color:'#9b59d0',
    obstacle:'أسلاك شائكة',
    questions:[
      { q:'أيّ منطقة قادها رابح بيطاط عند اندلاع الثورة؟', a:['الجزائر العاصمة (المنطقة الرابعة)','الأوراس (المنطقة الأولى)','القبائل (المنطقة الثالثة)','وهران (المنطقة الخامسة)'] },
      { q:'ما المنصب الذي تولّاه رابح بيطاط بعد وفاة الرئيس هواري بومدين سنة 1978؟', a:['رئيس الدولة بالنيابة','وزير الخارجية','قائد الأركان','سفير في باريس'] } ],
    fact:'قاد المنطقة الرابعة، واعتُقل سنة 1955 وبقي سجيناً حتى 1962، ثم تولّى رئاسة الدولة بالنيابة أواخر 1978.' },
  { name:'محمد بوضياف', short:'بوضياف', title:'منسّق التحضير للثورة', icon:'⭐', color:'#f1c40f',
    obstacle:'متراس من أكياس الرمل',
    questions:[
      { q:'ما اسم اللجنة التي كان محمد بوضياف من أبرز مؤسسيها سنة 1954 تمهيداً للثورة؟', a:['اللجنة الثورية للوحدة والعمل','الحكومة المؤقتة','جمعية العلماء المسلمين','المجلس الوطني للثورة'] },
      { q:'في أيّ مدينة اغتيل محمد بوضياف سنة 1992؟', a:['عنابة','وهران','قسنطينة','تلمسان'] } ],
    fact:'لُقّب بـ«سي الطيب الوطني»، نسّق التحضير لثورة نوفمبر، وعاد سنة 1992 رئيساً للمجلس الأعلى للدولة قبل اغتياله في عنابة.' },
  { name:'العربي بن مهيدي', short:'بن مهيدي', title:'قائد المنطقة الخامسة · وهران', icon:'🕊️', color:'#1fb39a',
    obstacle:'جدار حجري',
    questions:[
      { q:'أيّ منطقة قادها العربي بن مهيدي عند اندلاع الثورة؟', a:['وهران (المنطقة الخامسة)','الأوراس (المنطقة الأولى)','القبائل (المنطقة الثالثة)','الشمال القسنطيني (المنطقة الثانية)'] },
      { q:'من صاحب المقولة الشهيرة: «ألقوا بالثورة إلى الشارع يحتضنها الشعب»؟', a:['العربي بن مهيدي','فرحات عباس','مصالي الحاج','أحمد بن بلة'] } ],
    fact:'قاد المنطقة الخامسة ثم معركة الجزائر، واستُشهد تحت التعذيب في مارس 1957 دون أن يبوح بسرّ.' }
];
// the first answer in each question is the correct one (options are shuffled at display time)

const FACTS = [
  'اندلعت الثورة التحريرية ليلة الفاتح من نوفمبر 1954.',
  'دعا بيان أول نوفمبر إلى إقامة دولة جزائرية ديمقراطية ذات سيادة.',
  'قُسّمت الجزائر عند اندلاع الثورة إلى خمس مناطق عسكرية.',
  'جيش التحرير الوطني هو الجناح المسلّح لجبهة التحرير الوطني.',
  'وقعت هجومات الشمال القسنطيني في 20 أوت 1955 بقيادة زيغود يوسف.',
  'انعقد مؤتمر الصومام في 20 أوت 1956 لتنظيم الثورة.',
  'تأسست الحكومة المؤقتة للجمهورية الجزائرية في 19 سبتمبر 1958.',
  'خرج الجزائريون في مظاهرات 11 ديسمبر 1960 دعماً للاستقلال.',
  'دخل وقف إطلاق النار حيّز التنفيذ في 19 مارس 1962.',
  'استقلت الجزائر في 5 جويلية 1962 بعد 132 سنة من الاستعمار.'
];

/* =====================================================================
   HELPERS
   ===================================================================== */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const damp = (k, dt) => 1 - Math.exp(-k * dt);
function lerpAngle(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// WLADZ : une sauvegarde (meilleur score, son) par enfant connecté.
const PLAYER_KEY = window.__WLADZ_PLAYER__ ? ':' + window.__WLADZ_PLAYER__.id : '';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k + PLAYER_KEY); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k + PLAYER_KEY, JSON.stringify(v)); } catch {} }
};
// WLADZ : police Cairo de l'application (next/font) pour les étiquettes dessinées dans le canvas.
const GAME_FONT = getComputedStyle(document.documentElement).getPropertyValue('--font-cairo').trim() || 'Cairo, sans-serif';
const wladzWin = (id) => window.dispatchEvent(new CustomEvent('mujahideen:win', { detail: { id } }));
const hex = s => parseInt(s.slice(1), 16);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

/* =====================================================================
   WORLD LAYOUT
   ===================================================================== */
const START_Z = 6, CAVE_Z = -172, PATH_HALF = 2.5, PATH_W = 2.9;
const OBST_Z = [-24, -51, -78, -105, -131, -154];
const LEAFLET_Z = [-10, -17, -34, -42, -60, -70, -88, -96, -114, -121, -140, -146, -163];
const MED_Z = [-65, -117, -159];
const BLAST = 2.5, BOMB_T = 1.55, TRAIL_STEP = 0.3, SPACING = 1.35;

function pathX(z) { return Math.sin(z * 0.032) * 5 + Math.sin(z * 0.011 + 1.3) * 3 - Math.sin(1.3) * 3; }
function dPathX(z) { return 0.16 * Math.cos(z * 0.032) + 0.033 * Math.cos(z * 0.011 + 1.3); }
function hills(x, z) { return Math.sin(x * 0.13 + z * 0.05) * 1.6 + Math.sin(x * 0.05 - z * 0.09) * 2.4 + Math.sin(x * 0.29 + z * 0.21) * 0.6 + Math.cos(z * 0.03 + x * 0.02) * 1.5; }
function terrainH(x, z) {
  const d = Math.abs(x - pathX(z));
  const t = smooth(3.3, 13, d);
  let h = t * (5 + hills(x, z) * 1.4 + Math.max(0, d - 10) * 0.45);
  h += smooth(CAVE_Z - 3, CAVE_Z - 13, z) * 20;     // mountain face behind the cave
  return h;
}

/* =====================================================================
   SOUND (procedural WebAudio)
   ===================================================================== */
const Sound = {
  ctx: null, master: null, muted: store.get('six-muted', false),
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const ctx = this.ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.8; this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // wind ambience
    const w = ctx.createBufferSource(); w.buffer = buf; w.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 380; wf.Q.value = 0.7;
    const wg = ctx.createGain(); wg.gain.value = 0.06;
    w.connect(wf).connect(wg).connect(this.master); w.start();
    this.wind = wf;
    // aircraft drone
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0;
    [[58, 'sawtooth', .5], [61.5, 'sawtooth', .5], [117, 'square', .1]].forEach(([f, type, v]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = v; o.connect(g).connect(lp); o.start();
    });
    lp.connect(this.droneGain).connect(this.master);
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setMuted(m) { this.muted = m; store.set('six-muted', m); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05); },
  drone(v) { if (this.droneGain) this.droneGain.gain.setTargetAtTime(v * 0.16, this.ctx.currentTime, 0.2); },
  tone(f, dur, type = 'sine', vol = 0.2, when = 0, f2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, vol, f1, f2, when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when, s = this.ctx.createBufferSource(), fl = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f1, t); fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  explosion(dist) { const v = clamp(1.25 - dist / 45, 0.15, 1); this.burst(1.7, 0.9 * v, 1500, 50); this.tone(75, 0.9, 'sine', 0.7 * v, 0, 28); },
  whistle(dur) { this.tone(1500, dur, 'sine', 0.03, 0, 320); },
  correct() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.18, i * 0.09)); },
  wrong() { this.tone(240, 0.5, 'sawtooth', 0.1, 0, 110); this.tone(170, 0.7, 'sawtooth', 0.09, 0.18, 70); },
  pickup() { this.tone(880, 0.12, 'square', 0.06); this.tone(1320, 0.2, 'square', 0.06, 0.07); },
  hurt() { this.burst(0.3, 0.45, 900, 200); this.tone(160, 0.3, 'sawtooth', 0.14, 0, 70); },
  toll() { this.tone(196, 2.4, 'sine', 0.22); this.tone(392, 1.8, 'sine', 0.06); this.tone(147, 2.6, 'sine', 0.12, 0.6); },
  jump() { this.tone(280, 0.14, 'sine', 0.05, 0, 520); },
  click() { this.tone(700, 0.05, 'square', 0.04); },
  victory() { [[392, 0], [523, .18], [659, .36], [784, .54], [1046, .8]].forEach(([f, w]) => { this.tone(f, 0.7, 'triangle', 0.16, w); this.tone(f / 2, 0.7, 'sine', 0.08, w); }); },
  lose() { [[392, 0], [349, .35], [311, .7], [262, 1.1]].forEach(([f, w]) => this.tone(f, 0.9, 'triangle', 0.14, w)); }
};

/* =====================================================================
   RENDERER / SCENE
   ===================================================================== */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const FOG = 0x101e31;
const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG);
scene.fog = new THREE.FogExp2(FOG, 0.0085);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 520);

const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.95, flatShading: true }, extra));
const UP = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
const softTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function glowSprite(color, scale, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(scale); return s;
}

/* ---------- lights ---------- */
const MOON_DIR = new THREE.Vector3(-0.42, 0.6, -0.68).normalize();
scene.add(new THREE.HemisphereLight(0xa3b8e6, 0x3a3020, 0.85));
scene.add(new THREE.AmbientLight(0x2a3a58, 0.45));
const moonLight = new THREE.DirectionalLight(0xc3d0ff, 1.0);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
Object.assign(moonLight.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 140 });
moonLight.shadow.bias = -0.0006;
scene.add(moonLight, moonLight.target);
const boomLights = [0, 1].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 30, 2); scene.add(l); return l; });
let boomIdx = 0;

/* ---------- sky ---------- */
const skyGroup = new THREE.Group(); scene.add(skyGroup);
skyGroup.add(new THREE.Mesh(new THREE.SphereGeometry(440, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x02040c) }, mid: { value: new THREE.Color(FOG) }, bot: { value: new THREE.Color(0x0c1420) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top, mid, bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.55, h)) : mix(mid, bot, smoothstep(0.0, -0.25, h)); gl_FragColor = vec4(c, 1.0); }'
})));
{
  const p = [];
  for (let i = 0; i < 2200; i++) { const v = new THREE.Vector3(rand(-1, 1), rand(0.06, 1), rand(-1, 1)).normalize().multiplyScalar(420); p.push(v.x, v.y, v.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  skyGroup.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf6f1da, fog: false }));
  moon.position.copy(MOON_DIR).multiplyScalar(400); skyGroup.add(moon);
  const halo = glowSprite(0x9fb4ff, 110, 0.45); halo.material.fog = false; halo.position.copy(moon.position); skyGroup.add(halo);
}

/* ---------- terrain ---------- */
function buildTerrain() {
  const geo = new THREE.PlaneGeometry(180, 280, 180, 280);
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -88);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const cPath = new THREE.Color(0x6a563c), cG1 = new THREE.Color(0x2c3a24), cG2 = new THREE.Color(0x3e4a2b), cRock = new THREE.Color(0x58524b), cHigh = new THREE.Color(0x9a978f);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = terrainH(x, z);
    p.setY(i, h);
    const d = Math.abs(x - pathX(z));
    if (d < PATH_W + 0.4 && h < 0.5) c.copy(cPath);
    else {
      c.copy(cG1).lerp(cG2, (Math.sin(x * 0.4) * Math.cos(z * 0.3) + 1) / 2);
      c.lerp(cRock, smooth(4, 11, h)); c.lerp(cHigh, smooth(15, 26, h));
    }
    const j = 0.9 + Math.random() * 0.2;
    col[i * 3] = c.r * j; col[i * 3 + 1] = c.g * j; col[i * 3 + 2] = c.b * j;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  mesh.receiveShadow = true; scene.add(mesh);
}

function buildPath() {
  const pos = [], col = [], idx = [], c = new THREE.Color(), cs = [-1, -0.55, 0, 0.55, 1];
  let rows = 0;
  for (let z = START_Z + 40; z >= CAVE_Z - 4; z -= 0.6, rows++) {
    const cx = pathX(z);
    cs.forEach(s => {
      pos.push(cx + s * PATH_W, 0.025 + (s === 0 ? 0.01 : 0), z);
      const e = Math.abs(s);
      c.setHex(e > 0.9 ? 0x5a4832 : (e > 0.3 ? 0x8a7150 : 0x7c6646));
      const j = 0.9 + Math.random() * 0.18; col.push(c.r * j, c.g * j, c.b * j);
    });
  }
  for (let r = 0; r < rows - 1; r++) for (let k = 0; k < 4; k++) {
    const a = r * 5 + k, b = a + 1, d = a + 5, e = d + 1;
    idx.push(a, b, d, b, e, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.receiveShadow = true; scene.add(m);
}

const rockGeo = new THREE.DodecahedronGeometry(1, 0);
function buildScatter() {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), col = new THREE.Color();
  // trees
  const N = 560;
  const trunkG = new THREE.CylinderGeometry(0.1, 0.16, 1, 5); trunkG.translate(0, 0.5, 0);
  const coneG = new THREE.ConeGeometry(1, 1, 7); coneG.translate(0, 0.5, 0);
  const trunks = new THREE.InstancedMesh(trunkG, std(0x3b2a1c), N);
  const cones = new THREE.InstancedMesh(coneG, std(0xffffff), N * 2);
  let ti = 0, ci = 0;
  for (let i = 0; i < N * 4 && ti < N; i++) {
    const z = rand(CAVE_Z - 30, START_Z + 34), side = Math.random() < 0.5 ? -1 : 1, d = 4.8 + Math.pow(Math.random(), 1.5) * 48;
    const x = pathX(z) + side * d;
    if (z < CAVE_Z + 8 && d < 12) continue;
    const h = terrainH(x, z); if (h > 24) continue;
    const sc = rand(0.75, 1.6);
    q.setFromAxisAngle(UP, Math.random() * 6.28);
    m.compose(v.set(x, h - 0.1, z), q, s.set(sc, sc * 0.9, sc)); trunks.setMatrixAt(ti++, m);
    col.setHSL(0.36 + rand(-0.04, 0.03), 0.38, 0.13 + rand(0, 0.06));
    m.compose(v.set(x, h + 0.55 * sc, z), q, s.set(1.15 * sc, 1.9 * sc, 1.15 * sc)); cones.setMatrixAt(ci, m); cones.setColorAt(ci++, col);
    m.compose(v.set(x, h + 1.6 * sc, z), q, s.set(0.8 * sc, 1.5 * sc, 0.8 * sc)); cones.setMatrixAt(ci, m); cones.setColorAt(ci++, col);
  }
  trunks.count = ti; cones.count = ci;
  trunks.castShadow = cones.castShadow = true; cones.receiveShadow = true;
  scene.add(trunks, cones);
  // rocks
  const R = 340, rocks = new THREE.InstancedMesh(rockGeo, std(0xffffff), R);
  for (let i = 0; i < R; i++) {
    const z = rand(CAVE_Z - 20, START_Z + 30), side = Math.random() < 0.5 ? -1 : 1, d = 3.4 + Math.pow(Math.random(), 2) * 40;
    const x = pathX(z) + side * d, h = terrainH(x, z), sc = d < 6 ? rand(0.2, 0.6) : rand(0.4, 2.2);
    q.setFromEuler(new THREE.Euler(rand(0, 3), rand(0, 3), rand(0, 3)));
    m.compose(v.set(x, h + sc * 0.2, z), q, s.set(sc, sc * rand(0.5, 0.9), sc)); rocks.setMatrixAt(i, m);
    col.setHSL(0.08, 0.06, rand(0.22, 0.36)); rocks.setColorAt(i, col);
  }
  rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
  // bushes
  const B = 300, bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 0), std(0xffffff), B);
  for (let i = 0; i < B; i++) {
    const z = rand(CAVE_Z, START_Z + 30), side = Math.random() < 0.5 ? -1 : 1, d = 3.3 + Math.random() * 6;
    const x = pathX(z) + side * d, h = terrainH(x, z), sc = rand(0.5, 1.2);
    m.compose(v.set(x, h + 0.15, z), q.setFromAxisAngle(UP, rand(0, 6)), s.set(sc, sc * 0.7, sc)); bushes.setMatrixAt(i, m);
    col.setHSL(0.3 + rand(-0.05, 0.05), 0.35, rand(0.12, 0.2)); bushes.setColorAt(i, col);
  }
  bushes.castShadow = true; scene.add(bushes);
  // distant peaks
  const peakMat = std(0x262d3b), snowMat = std(0xcfd6e2);
  for (let i = 0; i < 34; i++) {
    let x, z;
    if (i < 22) { x = (i % 2 ? 1 : -1) * rand(85, 160); z = rand(-260, 40); } else { x = rand(-160, 160); z = rand(-250, -310); }
    const h = rand(40, 85), r = rand(30, 55);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), peakMat); peak.position.set(x, h / 2 - 4, z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.28, h * 0.28, 7), snowMat); cap.position.y = h * 0.36 + 0.4;
    peak.add(cap); peak.rotation.y = rand(0, 6); scene.add(peak);
  }
}

/* ---------- Algerian flag ---------- */
function starPts(cx, cy, R, r, start) { const a = []; for (let k = 0; k < 10; k++) { const ang = start + k * Math.PI / 5, rr = k % 2 ? r : R; a.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]); } return a; }
function flagSVG() {
  const pts = starPts(17.4, 10, 2.6, 1.05, Math.PI).map(p => p.map(n => n.toFixed(2)).join(',')).join(' ');
  return `<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="15" height="20" fill="#006233"/><rect x="15" width="15" height="20" fill="#fff"/>
  <mask id="cm"><rect width="30" height="20" fill="#fff"/><circle cx="16.3" cy="10" r="4.1" fill="#000"/></mask>
  <circle cx="15" cy="10" r="5" fill="#D21034" mask="url(#cm)"/><polygon points="${pts}" fill="#D21034"/></svg>`;
}
const flagTex = canvasTex(300, 200, (x) => {
  x.fillStyle = '#006233'; x.fillRect(0, 0, 150, 200); x.fillStyle = '#fff'; x.fillRect(150, 0, 150, 200);
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const y = c.getContext('2d');
  y.fillStyle = '#D21034'; y.beginPath(); y.arc(150, 100, 50, 0, 7); y.fill();
  y.globalCompositeOperation = 'destination-out'; y.beginPath(); y.arc(163, 100, 41, 0, 7); y.fill();
  y.globalCompositeOperation = 'source-over'; y.beginPath(); starPts(174, 100, 26, 10.5, Math.PI).forEach(([a, b], i) => i ? y.lineTo(a, b) : y.moveTo(a, b)); y.closePath(); y.fill();
  x.drawImage(c, 0, 0);
});

/* ---------- cave ---------- */
let fireLight, flames = [], flag;
function buildCave() {
  const cx = pathX(CAVE_Z), g = new THREE.Group();
  g.position.set(cx, 0, CAVE_Z - 3); g.rotation.y = Math.atan(dPathX(CAVE_Z));
  const hole = new THREE.Mesh(new THREE.CircleGeometry(3.3, 28, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x030201 }));
  g.add(hole);
  const inner = glowSprite(0xff7a2a, 5, 0.5); inner.position.set(0, 1, 0.1); g.add(inner);
  const rMat = std(0x5f574d);
  for (let a = -0.15; a <= Math.PI + 0.15; a += Math.PI / 10) {
    const r = new THREE.Mesh(rockGeo, rMat); r.position.set(Math.cos(a) * 4, Math.max(0.3, Math.sin(a) * 3.9), 0.3);
    r.scale.setScalar(rand(1.1, 1.6)); r.rotation.set(rand(0, 3), rand(0, 3), 0); r.castShadow = true; g.add(r);
  }
  for (let i = 0; i < 9; i++) {
    const r = new THREE.Mesh(rockGeo, rMat); r.position.set(rand(-7, 7), rand(5, 10), rand(-3, 0));
    r.scale.set(rand(2.5, 4.5), rand(2, 3.5), rand(2.5, 4)); r.rotation.set(rand(0, 3), rand(0, 3), 0); g.add(r);
  }
  // torches
  [-2.7, 2.7].forEach(x => {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), std(0x3b2a1c)); stick.position.set(x, 0.9, 1.4); g.add(stick);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffa23a })); flame.position.set(x, 2.0, 1.4); g.add(flame);
    const glow = glowSprite(0xff8a2a, 2.4, 0.9); glow.position.set(x, 2.0, 1.4); g.add(glow);
    flames.push({ flame, glow, seed: Math.random() * 10 });
  });
  // flag
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 5, 6), std(0xb9b9b9, { metalness: 0.6, roughness: 0.4 })); pole.position.set(-4.4, 2.5, 3.2); g.add(pole);
  const fg = new THREE.PlaneGeometry(2.4, 1.6, 16, 8); fg.translate(1.2, 0, 0);
  flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 }));
  flag.position.set(-4.4, 4.1, 3.2); flag.castShadow = true; flag.userData.base = fg.attributes.position.array.slice(); g.add(flag);
  scene.add(g);
  fireLight = new THREE.PointLight(0xff7a2a, 2.2, 28, 2); fireLight.position.set(cx, 2, CAVE_Z - 0.5); scene.add(fireLight);
}

/* ---------- snow ---------- */
const SNOW_N = 900, snowBox = { w: 60, h: 26, d: 60 };
const snow = (() => {
  const p = new Float32Array(SNOW_N * 3);
  for (let i = 0; i < SNOW_N; i++) { p[i * 3] = rand(-30, 30); p[i * 3 + 1] = rand(0, 26); p[i * 3 + 2] = rand(-30, 30); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xe8eeff, size: 0.09, transparent: true, opacity: 0.75, depthWrite: false }));
  pts.frustumCulled = false; scene.add(pts); return pts;
})();

/* =====================================================================
   CHARACTERS
   ===================================================================== */
function makeFighter({ jacket = 0x4f5a34, pants = 0x3a3826, scarf = 0xc0392b, skin = 0xc99a6b, hat = 'cheche', rifle = true, scale = 1 } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mJ = std(jacket), mP = std(pants), mS = std(skin), mB = std(0x1c1610), mSc = std(scarf), mH = std(hat === 'cheche' ? 0xddcfa6 : 0x2e3b25);
  const legG = new THREE.BoxGeometry(0.22, 0.78, 0.26); legG.translate(0, -0.39, 0);
  const bootG = new THREE.BoxGeometry(0.25, 0.18, 0.34); bootG.translate(0, -0.78, 0.04);
  const mkLeg = x => { const l = new THREE.Group(); l.position.set(x, 0.86, 0); l.add(new THREE.Mesh(legG, mP), new THREE.Mesh(bootG, mB)); body.add(l); return l; };
  const legL = mkLeg(-0.14), legR = mkLeg(0.14);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.72, 0.38), mJ); torso.position.y = 1.22; body.add(torso);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.4), mB); belt.position.y = 0.92; body.add(belt);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.4), mB); strap.position.set(0, 1.22, 0.005); strap.rotation.z = 0.7; body.add(strap);
  const armG = new THREE.BoxGeometry(0.17, 0.66, 0.2); armG.translate(0, -0.31, 0);
  const handG = new THREE.BoxGeometry(0.15, 0.14, 0.16); handG.translate(0, -0.68, 0);
  const mkArm = x => { const a = new THREE.Group(); a.position.set(x, 1.52, 0); a.add(new THREE.Mesh(armG, mJ), new THREE.Mesh(handG, mS)); body.add(a); return a; };
  const armL = mkArm(-0.42), armR = mkArm(0.42);
  const sc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.07, 6, 12), mSc); sc.rotation.x = Math.PI / 2; sc.position.y = 1.6; body.add(sc);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), mS); head.position.y = 1.82; body.add(head);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x111111 });
  [-0.08, 0.08].forEach(x => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), eyeM); e.position.set(x, 1.86, 0.215); body.add(e); });
  const mus = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.04), mB); mus.position.set(0, 1.76, 0.22); body.add(mus);
  if (hat === 'cheche') {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.09, 6, 14), mH); t.rotation.x = Math.PI / 2; t.position.y = 1.97; body.add(t);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), mH); top.scale.y = 0.6; top.position.y = 2.01; body.add(top);
  } else {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.17, 10), mH); cap.position.y = 2.0; body.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.16), mH); brim.position.set(0, 1.93, 0.24); body.add(brim);
  }
  if (rifle) {
    const r = new THREE.Group();
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.1), std(0x5a3b22)); stock.position.y = -0.3;
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), std(0x2a2a2a, { metalness: 0.5 })); barrel.position.y = 0.3;
    r.add(stock, barrel); r.position.set(0, 1.25, -0.24); r.rotation.z = 0.65; body.add(r);
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  root.scale.setScalar(scale);
  root.userData = { body, legL, legR, armL, armR, mats: [mJ, mP, mS, mSc, mH] };
  return root;
}
function animateFighter(ud, phase, amt) {
  const s = Math.sin(phase);
  ud.legL.rotation.x = s * 0.75 * amt; ud.legR.rotation.x = -s * 0.75 * amt;
  ud.armL.rotation.x = -s * 0.6 * amt; ud.armR.rotation.x = s * 0.6 * amt;
  ud.body.position.y = Math.abs(Math.cos(phase)) * 0.06 * amt;
}
function setEmissive(ud, hexv) { ud.mats.forEach(m => m.emissive.setHex(hexv)); }

function makeLabel(text, color) {
  const tex = canvasTex(256, 72, (x) => {
    x.font = `700 30px ${GAME_FONT}`; x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const w = Math.min(244, x.measureText(text).width + 40);
    roundRect(x, (256 - w) / 2, 10, w, 52, 26); x.fillStyle = 'rgba(8,12,6,.72)'; x.fill();
    x.lineWidth = 3; x.strokeStyle = color; x.stroke();
    x.fillStyle = '#FFF3D6'; x.fillText(text, 128, 38);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(1.35, 0.38, 1); s.position.y = 2.5; return s;
}
function iconTex(icon, ring) {
  return canvasTex(128, 128, (x) => {
    const g = x.createRadialGradient(64, 64, 10, 64, 64, 62); g.addColorStop(0, 'rgba(40,30,10,.95)'); g.addColorStop(1, 'rgba(20,14,4,.9)');
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill();
    x.lineWidth = 6; x.strokeStyle = ring; x.stroke();
    x.font = '58px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(icon, 64, 70);
  });
}

/* =====================================================================
   BUILD WORLD
   ===================================================================== */
try { await Promise.race([document.fonts.load(`700 30px ${GAME_FONT}`), new Promise(r => setTimeout(r, 1500))]); } catch {}

buildTerrain(); buildPath(); buildScatter(); buildCave();

const player = makeFighter({ jacket: 0x55603a, scarf: 0xe8c35a, hat: 'cheche', scale: 1.08 });
scene.add(player);
const lantern = new THREE.PointLight(0xffb35c, 1.2, 13, 2); lantern.position.set(0.45, 1.2, 0.35); player.add(lantern);

const JACKETS = [0x4f5a34, 0x6e6444, 0x47533a, 0x5d5a3c, 0x4a4f3a, 0x676045];
const followers = LEADERS.map((L, i) => {
  const root = makeFighter({ jacket: JACKETS[i], scarf: hex(L.color), hat: i % 2 ? 'cap' : 'cheche', skin: [0xc99a6b, 0xb98a5e, 0xd2a77a][i % 3] });
  const label = makeLabel(L.icon + ' ' + L.short, L.color); root.add(label);
  scene.add(root);
  return { i, root, ud: root.userData, label, hp: 3, alive: true, dying: false, dieT: 0, hurtT: 0, x: 0, z: 0, yaw: Math.PI, phase: Math.random() * 6 };
});

/* ---------- obstacles ---------- */
function buildObstacle(i) {
  const g = new THREE.Group(), rock = std(0x6d6458), wood = std(0x5a3b22), metal = std(0x8a8f94, { metalness: 0.5, roughness: 0.5 }), sand = std(0xa89468), stone = std(0x7d766a);
  if (i === 0) {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 0), rock); b.scale.set(1.55, 1, 1); b.position.y = 1.2; g.add(b);
    [[-2.4, 0.5, 0.6, 0.8], [2.3, 0.4, -0.3, 0.7], [1.3, 0.3, 1, 0.5]].forEach(([x, y, z, s]) => { const r = new THREE.Mesh(rockGeo, rock); r.scale.setScalar(s); r.position.set(x, y, z); g.add(r); });
  } else if (i === 1) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 6.8, 9), wood); log.rotation.z = Math.PI / 2; log.position.y = 0.6; g.add(log);
    const ringM = std(0xb08a5a);
    [-3.4, 3.4].forEach(x => { const r = new THREE.Mesh(new THREE.CircleGeometry(0.57, 9), ringM); r.position.set(x, 0.6, 0); r.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(r); });
    for (let k = 0; k < 4; k++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5), wood); br.position.set(-2 + k * 1.3, 1.1, rand(-0.3, 0.3)); br.rotation.set(rand(-0.6, 0.6), 0, rand(-0.8, 0.8)); g.add(br); }
    const leaves = std(0x24402a);
    for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), leaves); l.position.set(2.6 + rand(-0.6, 0.6), 1 + rand(0, 0.6), rand(-0.6, 0.6)); g.add(l); }
  } else if (i === 2) {
    for (let k = 0; k < 11; k++) { const r = new THREE.Mesh(rockGeo, k % 3 ? rock : stone); const s = rand(0.5, 0.95); r.scale.set(s, s * 0.8, s); r.position.set(rand(-2.7, 2.7), k < 7 ? s * 0.6 : 1.2 + rand(0, 0.4), rand(-0.6, 0.6)); r.rotation.set(rand(0, 3), rand(0, 3), 0); g.add(r); }
  } else if (i === 3) {
    [-2.8, -0.95, 0.95, 2.8].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.7, 6), wood); p.position.set(x, 0.85, 0); p.rotation.z = rand(-0.08, 0.08); g.add(p); });
    [0.4, 0.85, 1.3].forEach(y => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 5.8, 4), metal); w.rotation.z = Math.PI / 2; w.position.y = y; g.add(w);
      for (let x = -2.7; x <= 2.7; x += 0.32) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), metal); b.position.set(x, y, 0); b.rotation.set(0.8, 0, 0.8); g.add(b); }
    });
    for (let k = 0; k < 5; k++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 4, 14), metal); coil.position.set(-2.4 + k * 1.2, 0.42, 0.45); coil.rotation.y = 1.3; g.add(coil); }
  } else if (i === 4) {
    const bagG = new THREE.SphereGeometry(0.5, 8, 6);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6 - (row === 2 ? 1 : 0); k++) {
      const b = new THREE.Mesh(bagG, sand); b.scale.set(1, 0.45, 0.62);
      b.position.set(-2.6 + k * 1.02 + (row % 2) * 0.5, 0.24 + row * 0.42, rand(-0.05, 0.05)); b.rotation.y = rand(-0.1, 0.1); g.add(b);
    }
  } else {
    const brickG = new THREE.BoxGeometry(0.8, 0.42, 0.7);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 7; k++) {
      const b = new THREE.Mesh(brickG, row % 2 ? stone : rock); b.position.set(-2.75 + k * 0.84 + (row % 2) * 0.32, 0.21 + row * 0.43, rand(-0.06, 0.06));
      b.rotation.y = rand(-0.05, 0.05); if (row === 3 && Math.random() < 0.3) continue; g.add(b);
    }
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
const obstacles = OBST_Z.map((z, i) => {
  const holder = new THREE.Group(), mesh = buildObstacle(i);
  holder.add(mesh); holder.position.set(pathX(z), 0, z); holder.rotation.y = Math.atan(dPathX(z));
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(LEADERS[i].icon, LEADERS[i].color), transparent: true, depthWrite: false }));
  marker.scale.setScalar(1.5); marker.position.y = 3.4; holder.add(marker);
  const mglow = glowSprite(hex(LEADERS[i].color), 3.6, 0.55); mglow.position.y = 3.4; holder.add(mglow);
  scene.add(holder);
  return { i, z, holder, mesh, marker, mglow, cleared: false, triggered: false, clearT: 0 };
});

/* ---------- pickups ---------- */
const pickups = [];
function makeLeaflet() {
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.62, 12), std(0xf0e2bd, { flatShading: false }));
  paper.rotation.z = Math.PI / 2; g.add(paper);
  const rib = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 14), std(0xc0392b)); rib.rotation.y = Math.PI / 2; g.add(rib);
  const glow = glowSprite(0xffd36a, 1.8, 0.75); g.add(glow);
  return g;
}
function makeMedkit() {
  const g = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: 0xd62c1f });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.42), std(0xeeeae0)));
  [[0.24, 0.07, 0.43], [0.07, 0.24, 0.43]].forEach(([w, h, d]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d + 0.01), red); g.add(c); });
  const glow = glowSprite(0xff6050, 1.9, 0.6); g.add(glow);
  return g;
}
LEAFLET_Z.forEach(z => pickups.push({ type: 'leaflet', z, x: pathX(z) + rand(-1.9, 1.9), mesh: makeLeaflet() }));
MED_Z.forEach(z => pickups.push({ type: 'med', z, x: pathX(z) + rand(-1.5, 1.5), mesh: makeMedkit() }));
pickups.forEach(p => { p.mesh.position.set(p.x, 1, p.z); p.mesh.traverse(o => { if (o.isMesh) o.castShadow = true; }); p.seed = Math.random() * 6; scene.add(p.mesh); });

/* =====================================================================
   GAME STATE
   ===================================================================== */
const S = {
  state: 'title', score: 0, lost: 0, hp: 100, stamina: 100, elapsed: 0,
  px: 0, py: 0, pz: START_Z, vx: 0, vz: 0, vy: 0, grounded: true, yaw: Math.PI, phase: 0, running: false,
  planeTimer: 0, shake: 0, hurtFlash: 0, leaflets: 0, closeCalls: 0, factIdx: 0, firstPlane: true,
  endTimer: 0, pending: null, dead: false, deadT: 0
};
const results = LEADERS.map(() => ({ answered: false, correct: false }));
let trail = [], planes = [], bombs = [], fx = [];
const K = { f: false, b: false, l: false, r: false, run: false, jump: false };
const joy = { x: 0, y: 0, id: null };
let quiz = null, squadDirty = true, time = 0;
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();

/* =====================================================================
   UI
   ===================================================================== */
$('flagSvg').innerHTML = flagSVG();
$('chips').innerHTML = LEADERS.map(L => `<span class="chip" style="--c:${L.color}">${L.icon} ${L.name}</span>`).join('');
const bestScore = () => store.get('six-best', 0);
function refreshBest() { const b = bestScore(); $('bestTitle').textContent = b ? `🏆 أفضل نتيجة: ${b}` : ''; }
refreshBest();
if (isTouch) document.body.classList.add('touch');
$('muteBtn').textContent = Sound.muted ? '🔇' : '🔊';

const track = $('track');
OBST_Z.forEach((z, i) => { const m = document.createElement('span'); m.className = 'mk'; m.id = 'mk' + i; m.style.right = progressOf(z) * 100 + '%'; track.appendChild(m); });
{ const c = document.createElement('span'); c.className = 'mk cave'; c.textContent = '⛰'; c.style.right = '100%'; track.appendChild(c); }
function progressOf(z) { return clamp((START_Z - z) / (START_Z - CAVE_Z), 0, 1); }

function toast(msg, type = 'good', dur = 3200) {
  const box = $('toasts'); while (box.children.length > 2) box.firstChild.remove();
  const t = document.createElement('div'); t.className = 'toast ' + type; t.style.setProperty('--d', dur + 'ms'); t.innerHTML = msg;
  box.appendChild(t); setTimeout(() => t.remove(), dur);
}
function popScore(text) { const p = document.createElement('div'); p.className = 'pop'; p.textContent = text; document.body.appendChild(p); setTimeout(() => p.remove(), 1100); }
function addScore(n, text) { S.score += n; if (text) popScore(text); }

function renderSquad() {
  $('squad').innerHTML = followers.map(f => {
    const L = LEADERS[f.i];
    return `<div class="mate ${f.alive ? '' : 'dead'}" id="mate${f.i}" style="--c:${L.color}"><span class="ic">${f.alive ? L.icon : '🕊️'}</span><span class="nm">${L.short}</span>
      <span class="hp">${[0, 1, 2].map(k => `<i class="${k < f.hp ? '' : 'off'}"></i>`).join('')}</span></div>`;
  }).join('');
  squadDirty = false;
}
function flashMate(i) { const el = $('mate' + i); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); } }

const hudCache = {};
function setHud(key, fn, val) { if (hudCache[key] !== val) { hudCache[key] = val; fn(val); } }
function updateHUD() {
  setHud('score', v => $('score').textContent = v, Math.floor(S.score));
  setHud('lost', v => $('lost').textContent = v, S.lost);
  setHud('hp', v => { $('hpFill').style.width = v + '%'; $('hpFill').classList.toggle('low', v < 35); }, Math.round(S.hp));
  setHud('st', v => $('stFill').style.width = v + '%', Math.round(S.stamina));
  const pr = progressOf(S.pz) * 100;
  setHud('pr', v => { $('progFill').style.width = v + '%'; $('progDot').style.right = v + '%'; }, Math.round(pr * 2) / 2);
  setHud('air', v => $('airAlert').classList.toggle('on', v), planes.length > 0 && S.state === 'playing');
  if (squadDirty) renderSquad();
  const low = S.hp < 35 && S.state === 'playing' ? 0.25 + 0.15 * Math.sin(time * 6) : 0;
  $('vignette').style.opacity = Math.max(S.hurtFlash, low).toFixed(3);
}

/* =====================================================================
   EFFECTS
   ===================================================================== */
const sphereG = new THREE.SphereGeometry(1, 14, 10), debrisG = new THREE.BoxGeometry(0.16, 0.16, 0.16), circleG = new THREE.CircleGeometry(1, 32), ringG = new THREE.RingGeometry(0.9, 1, 48);
const debrisMats = [std(0x3a3128), std(0x6a563c), new THREE.MeshBasicMaterial({ color: 0xffb040 })];
function addFx(mesh, o) {
  scene.add(mesh);
  fx.push(Object.assign({ mesh, t: 0, life: 1, vel: null, grav: 0, grow: 0, fade: true, spin: 0, base: mesh.material.opacity ?? 1, scale0: mesh.scale.x }, o));
}
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t += dt; const k = f.t / f.life;
    if (k >= 1) { scene.remove(f.mesh); if (f.own) f.mesh.material.dispose(); fx.splice(i, 1); continue; }
    if (f.vel) {
      f.vel.y -= f.grav * dt; f.mesh.position.addScaledVector(f.vel, dt);
      if (f.floor !== undefined && f.mesh.position.y < f.floor) { f.mesh.position.y = f.floor; f.vel.y *= -0.3; f.vel.x *= 0.6; f.vel.z *= 0.6; }
    }
    if (f.grow) f.mesh.scale.setScalar(f.scale0 * (1 + f.grow * (1 - Math.pow(1 - k, 2))));
    if (f.spin) { f.mesh.rotation.x += f.spin * dt; f.mesh.rotation.y += f.spin * dt; }
    if (f.fade) f.mesh.material.opacity = f.base * (1 - k);
  }
}
function smoke(x, y, z, color, n, size, life) {
  for (let k = 0; k < n; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, opacity: 0.7, depthWrite: false }));
    s.position.set(x + rand(-1, 1), y + rand(0, 0.6), z + rand(-1, 1)); s.scale.setScalar(size * rand(0.7, 1.2));
    addFx(s, { life: life * rand(0.7, 1.2), vel: new THREE.Vector3(rand(-0.6, 0.6), rand(1, 2.6), rand(-0.6, 0.6)), grow: 2.2, own: true });
  }
}
function explode(x, z) {
  const dCam = camera.position.distanceTo(tmpV.set(x, 0, z)), dP = Math.hypot(S.px - x, S.pz - z);
  Sound.explosion(dCam);
  S.shake = Math.max(S.shake, clamp(1.3 - dP / 12, 0.12, 1.2));
  const L = boomLights[boomIdx++ % 2]; L.position.set(x, 2, z); L.intensity = 5;
  const fb = new THREE.Mesh(sphereG, new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  fb.position.set(x, 0.6, z); fb.scale.setScalar(0.6); addFx(fb, { life: 0.45, grow: 4.2, own: true });
  const fb2 = new THREE.Mesh(sphereG, new THREE.MeshBasicMaterial({ color: 0xff3a10, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  fb2.position.set(x, 1, z); fb2.scale.setScalar(0.4); addFx(fb2, { life: 0.7, grow: 5, own: true });
  for (let k = 0; k < 18; k++) {
    const d = new THREE.Mesh(debrisG, debrisMats[k % 3]); d.position.set(x, 0.4, z); d.scale.setScalar(rand(0.6, 1.8)); d.castShadow = true;
    addFx(d, { life: rand(0.9, 1.5), vel: new THREE.Vector3(rand(-5, 5), rand(5, 12), rand(-5, 5)), grav: 26, floor: 0.06, spin: 9, fade: false });
  }
  smoke(x, 0.6, z, 0x2c2a28, 9, 2.2, 2.4);
  const sc = new THREE.Mesh(circleG, new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  sc.rotation.x = -Math.PI / 2; sc.position.set(x, 0.05, z); sc.scale.setScalar(rand(1.9, 2.5)); addFx(sc, { life: 12, own: true });

  if (S.state !== 'playing') return;
  if (dP < BLAST) hurtPlayer(Math.round(40 * (1 - (dP / BLAST) * 0.5) * (S.py > 1 ? 0.6 : 1)));
  else if (dP < BLAST + 2) { S.closeCalls++; addScore(15, 'نجاة بأعجوبة! +15'); }
  followers.forEach(f => { if (f.alive && Math.hypot(f.x - x, f.z - z) < BLAST - 0.2) hurtFollower(f); });
}

/* =====================================================================
   PLANES & BOMBS
   ===================================================================== */
const planeMetal = std(0x6f7672, { metalness: 0.35, roughness: 0.6 }), planeDark = std(0x34393a);
function makePlane() {
  const g = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 4.6, 10), planeMetal); fus.rotation.z = Math.PI / 2; g.add(fus);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 10), planeDark); nose.rotation.z = -Math.PI / 2; nose.position.x = 2.65; g.add(nose);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x1d2b3a, { metalness: 0.7, roughness: 0.2 })); canopy.scale.set(1.7, 1, 1); canopy.position.set(0.6, 0.3, 0); g.add(canopy);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 7.8), planeMetal); wing.position.x = 0.4; g.add(wing);
  const tw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 2.6), planeMetal); tw.position.x = -2; g.add(tw);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.08), planeMetal); fin.position.set(-2.05, 0.5, 0); g.add(fin);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2, 0.16), planeDark); prop.position.x = 3.02; g.add(prop);
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2020 })); navR.position.set(0.4, 0, -3.9);
  const navG = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0x20ff40 })); navG.position.set(0.4, 0, 3.9);
  const blink = glowSprite(0xffffff, 1.4, 1); blink.position.set(-2.3, 0.2, 0);
  g.add(navR, navG, blink, glowSprite(0xff3030, 0.9, 0.9).translateX(0.4).translateZ(-3.9), glowSprite(0x30ff50, 0.9, 0.9).translateX(0.4).translateZ(3.9));
  g.userData = { prop, blink };
  g.scale.setScalar(1.25);
  return g;
}
function spawnPlane() {
  const prog = progressOf(S.pz), dir = Math.random() < 0.5 ? 1 : -1;
  const z = S.pz - rand(4, 14), mesh = makePlane();
  mesh.position.set(-dir * 80 + pathX(z), rand(17, 22), z);
  mesh.rotation.y = dir === 1 ? 0 : Math.PI;
  scene.add(mesh);
  planes.push({ mesh, dir, speed: rand(22, 27), bombs: 1 + Math.round(prog * 2.2 + Math.random() * 0.6), cool: 0 });
  if (S.firstPlane) { S.firstPlane = false; toast('✈️ طائرة معادية! الدائرة الحمراء تُظهر مكان سقوط القنبلة — ابتعد عنها بسرعة <kbd>Shift</kbd>', 'bad', 4500); }
}
const bombBody = new THREE.CylinderGeometry(0.16, 0.16, 0.7, 8), bombNose = new THREE.ConeGeometry(0.16, 0.3, 8), bombMat = std(0x262626, { metalness: 0.4 });
function dropBomb(p) {
  let tx = S.px + S.vx * BOMB_T * 0.85 + rand(-1.8, 1.8), tz = S.pz + S.vz * BOMB_T * 0.85 + rand(-2.4, 1.4);
  tz = clamp(tz, CAVE_Z + 4, START_Z + 2); const c = pathX(tz); tx = c + clamp(tx - c, -2.7, 2.7);
  const b = new THREE.Group();
  b.add(new THREE.Mesh(bombBody, bombMat)); const n = new THREE.Mesh(bombNose, bombMat); n.position.y = -0.5; n.rotation.x = Math.PI; b.add(n);
  b.position.copy(p.mesh.position); scene.add(b);
  const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(tx, 0.08, tz); scene.add(ring);
  const disc = new THREE.Mesh(circleG, new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.1, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.set(tx, 0.07, tz); disc.scale.setScalar(BLAST); scene.add(disc);
  bombs.push({ mesh: b, ring, disc, sx: b.position.x, sy: b.position.y, sz: b.position.z, tx, tz, t: 0 });
  Sound.whistle(BOMB_T);
}
function updatePlanes(dt) {
  const prog = progressOf(S.pz);
  if (S.state === 'playing') {
    S.planeTimer -= dt;
    if (S.planeTimer <= 0) { spawnPlane(); S.planeTimer = lerp(8, 4.2, prog) + rand(-1, 1.2); }
  }
  let nearest = 1e9;
  for (let i = planes.length - 1; i >= 0; i--) {
    const p = planes[i], m = p.mesh;
    m.position.x += p.dir * p.speed * dt;
    m.rotation.x = Math.sin(time * 1.5 + i) * 0.08;
    m.userData.prop.rotation.x += dt * 45;
    m.userData.blink.material.opacity = (time * 2 % 1) < 0.15 ? 1 : 0;
    const rel = (m.position.x - S.px) * p.dir;   // negative = still approaching
    p.cool -= dt;
    if (S.state === 'playing' && p.bombs > 0 && rel > -16 && rel < 10 && p.cool <= 0) { dropBomb(p); p.bombs--; p.cool = 0.45; }
    nearest = Math.min(nearest, m.position.distanceTo(player.position));
    if (rel > 95) { scene.remove(m); planes.splice(i, 1); }
  }
  Sound.drone(S.state === 'playing' ? clamp(1.3 - nearest / 70, 0, 1) : 0);
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; b.t += dt; const k = Math.min(1, b.t / BOMB_T);
    b.mesh.position.set(lerp(b.sx, b.tx, k), b.sy * (1 - k * k) + 0.3, lerp(b.sz, b.tz, k));
    b.ring.scale.setScalar(BLAST * (1 + (1 - k) * 1.3));
    b.ring.material.opacity = 0.55 + 0.45 * Math.sin(b.t * 18);
    b.disc.material.opacity = 0.06 + 0.3 * k;
    if (k >= 1) { scene.remove(b.mesh, b.ring, b.disc); b.ring.material.dispose(); b.disc.material.dispose(); bombs.splice(i, 1); explode(b.tx, b.tz); }
  }
}

/* =====================================================================
   DAMAGE / LOSSES
   ===================================================================== */
function hurtPlayer(dmg) {
  S.hp = Math.max(0, S.hp - dmg); S.hurtFlash = 0.85; Sound.hurt(); setEmissive(player.userData, 0x880000);
  setTimeout(() => setEmissive(player.userData, 0), 180);
  if (S.hp <= 0 && !S.dead) { S.dead = true; S.deadT = 0; endGame(false, '💥 أصابتك قنبلة مباشرة وسقطت شهيداً قبل بلوغ المغارة.'); }
}
function hurtFollower(f) {
  f.hp--; f.hurtT = 0.3; setEmissive(f.ud, 0x880000); squadDirty = true;
  requestAnimationFrame(() => flashMate(f.i));
  if (f.hp <= 0) martyr(f, 'bomb');
}
function martyr(f, cause) {
  if (!f.alive) return;
  f.alive = false; f.hp = 0; f.dying = true; f.dieT = 0; S.lost++; squadDirty = true;
  f.label.material.opacity = 0.45;
  toast(`🕊️ استشهد ${LEADERS[f.i].name} ${cause === 'bomb' ? 'في القصف' : ''} — (${S.lost}/3)`, 'bad', 3600);
  Sound.toll();
  if (S.lost >= 3) endGame(false, '💔 استشهد ثلاثة من القادة الستة، ولم تعد المهمة ممكنة.');
}

/* =====================================================================
   QUIZ
   ===================================================================== */
function openQuiz(o) {
  S.state = 'quiz'; S.vx = S.vz = 0; Object.keys(K).forEach(k => K[k] = false); resetJoy();
  const L = LEADERS[o.i], q = L.questions[Math.floor(Math.random() * L.questions.length)];
  quiz = { o, L, q, order: shuffle([0, 1, 2, 3]), answered: false, correct: false };
  $('quizPanel').style.setProperty('--c', L.color);
  $('qIcon').textContent = L.icon; $('qName').textContent = L.name; $('qTitle').textContent = L.title;
  $('qType').textContent = `🚧 ${L.obstacle} يسدّ الطريق — أجب لتفتحه`;
  $('qText').textContent = q.q;
  $('qOpts').innerHTML = '';
  quiz.order.forEach((ai, k) => {
    const b = document.createElement('button'); b.className = 'opt';
    b.innerHTML = `<span class="n">${k + 1}</span><span></span>`; b.lastChild.textContent = q.a[ai];
    b.onclick = () => answerQuiz(k); $('qOpts').appendChild(b);
  });
  $('qFeedback').className = 'feedback hidden'; $('qNext').classList.add('hidden');
  $('quizModal').classList.remove('hidden');
  Sound.drone(0);
}
function answerQuiz(k) {
  if (!quiz || quiz.answered) return;
  quiz.answered = true;
  const correct = quiz.order[k] === 0; quiz.correct = correct;
  results[quiz.o.i] = { answered: true, correct };
  [...$('qOpts').children].forEach((b, j) => { b.disabled = true; if (quiz.order[j] === 0) b.classList.add('ok'); else if (j === k) b.classList.add('bad'); });
  const fb = $('qFeedback');
  if (correct) {
    fb.className = 'feedback ok'; fb.innerHTML = `✅ أحسنت! +200 نقطة<br>${quiz.L.fact}`;
    S.score += 200; Sound.correct();
    wladzWin(`q:${quiz.o.i}-${quiz.L.questions.indexOf(quiz.q)}`);
  } else {
    fb.className = 'feedback bad'; fb.innerHTML = `❌ إجابة خاطئة — الصحيح: <b>${quiz.q.a[0]}</b><br>${quiz.L.fact}<br>سيُفتح الطريق، لكن أحد رفاقك سيسقط شهيداً.`;
    Sound.wrong();
  }
  $('qNext').classList.remove('hidden'); $('qNext').focus({ preventScroll: true });
}
function closeQuiz() {
  if (S.state !== 'quiz' || !quiz || !quiz.answered) return;
  $('quizModal').classList.add('hidden'); document.activeElement?.blur();
  S.state = 'playing';
  clearObstacle(quiz.o);
  if (!quiz.correct) {
    const alive = followers.filter(f => f.alive);
    if (alive.length) martyr(alive[Math.floor(Math.random() * alive.length)], 'quiz');
  } else toast(`🌟 فُتح الطريق بفضل معرفتك بـ${quiz.L.name}`, 'good');
  quiz = null;
}
function clearObstacle(o) {
  o.cleared = true; o.clearT = 0; o.marker.visible = false; o.mglow.visible = false;
  smoke(o.holder.position.x, 0.5, o.z, 0x8a7a62, 10, 2, 2);
  $('mk' + o.i).classList.add('done');
}

/* =====================================================================
   FLOW
   ===================================================================== */
function resetJoy() { joy.x = joy.y = 0; joy.id = null; $('knob').style.transform = ''; $('tRun').classList.remove('on'); }
function clearDynamic() {
  planes.forEach(p => scene.remove(p.mesh));
  bombs.forEach(b => { scene.remove(b.mesh, b.ring, b.disc); });
  fx.forEach(f => scene.remove(f.mesh));
  planes = []; bombs = []; fx = [];
  boomLights.forEach(l => l.intensity = 0);
}
function resetGame() {
  clearDynamic();
  Object.assign(S, { score: 0, lost: 0, hp: 100, stamina: 100, elapsed: 0, px: pathX(START_Z), py: 0, pz: START_Z, vx: 0, vz: 0, vy: 0, grounded: true, yaw: Math.PI,
    planeTimer: 11, shake: 0, hurtFlash: 0, leaflets: 0, closeCalls: 0, factIdx: Math.floor(Math.random() * FACTS.length), firstPlane: true, endTimer: 0, pending: null, dead: false, deadT: 0 });
  results.forEach((r, i) => results[i] = { answered: false, correct: false });
  trail = []; for (let i = 0; i < 240; i++) { const z = START_Z + i * TRAIL_STEP; trail.push({ x: pathX(z), z }); }
  followers.forEach((f, k) => {
    const t = trail[Math.round((k + 1) * SPACING / TRAIL_STEP)];
    Object.assign(f, { hp: 3, alive: true, dying: false, dieT: 0, hurtT: 0, x: t.x, z: t.z, yaw: Math.PI });
    f.root.visible = true; f.root.position.set(f.x, 0, f.z); f.ud.body.rotation.set(0, 0, 0); f.label.material.opacity = 1; setEmissive(f.ud, 0);
  });
  player.userData.body.rotation.set(0, 0, 0); setEmissive(player.userData, 0);
  obstacles.forEach(o => { Object.assign(o, { cleared: false, triggered: false, clearT: 0 }); o.mesh.visible = true; o.mesh.position.y = 0; o.mesh.scale.setScalar(1); o.marker.visible = o.mglow.visible = true; $('mk' + o.i).classList.remove('done'); });
  pickups.forEach(p => { p.taken = false; p.mesh.visible = true; });
  squadDirty = true;
  player.position.set(S.px, 0, S.pz);
  camPos.set(S.px, 8.6, S.pz + 9); camLook.set(S.px, 0.6, S.pz - 9);
}
function startGame() {
  Sound.init(); Sound.resume(); Sound.click();
  resetGame();
  ['titleScreen', 'endScreen', 'pauseModal', 'quizModal'].forEach(id => $(id).classList.add('hidden'));
  $('hud').classList.remove('hidden');
  $('touch').classList.toggle('hidden', !isTouch);
  document.activeElement?.blur();
  S.state = 'playing';
  toast('🧭 قُد رفاقك نحو المغارة في آخر الممر — كل عائق يحمل سؤالاً عن أحد القادة', 'info', 4200);
}
function endGame(win, reason) {
  if (S.state === 'ending' || S.state === 'over') return;
  S.state = 'ending'; S.pending = { win, reason }; S.endTimer = win ? 2.6 : 2.2;
  Sound.drone(0);
  if (win) { Sound.victory(); toast('⛰️ وصلتم إلى المغارة الآمنة!', 'good'); } else Sound.lose();
  $('touch').classList.add('hidden');
}
function showEnd() {
  S.state = 'over';
  const { win, reason } = S.pending, survivors = 6 - S.lost, allCorrect = results.every(r => r.correct);
  let total = Math.floor(S.score);
  const rows = [['نقاط المهمة', total]];
  if (win) {
    const sb = survivors * 250, hb = Math.round(S.hp) * 3, tb = Math.max(0, Math.round(300 - S.elapsed)) * 2;
    rows.push(['مكافأة الناجين (' + survivors + ' × 250)', sb], ['مكافأة الصحة', hb], ['مكافأة السرعة', tb]);
    if (allCorrect) rows.push(['كل الإجابات صحيحة', 500]);
    total += sb + hb + tb + (allCorrect ? 500 : 0);
  }
  rows.push(['مناشير مجمّعة', `${S.leaflets} / ${LEAFLET_Z.length}`], ['الوقت', `${Math.floor(S.elapsed / 60)}:${String(Math.floor(S.elapsed % 60)).padStart(2, '0')}`]);
  const prevBest = bestScore(), isBest = total > prevBest;
  if (isBest) store.set('six-best', total);
  const stars = win ? (S.lost === 0 && allCorrect ? 3 : S.lost <= 1 ? 2 : 1) : 0;
  if (win) wladzWin('win');
  if (stars === 3) wladzWin('legend');
  $('endIcon').textContent = win ? '🌙⭐' : '💔';
  $('endTitle').textContent = win ? (stars === 3 ? 'الله أكبر! مهمة أسطورية' : 'الله أكبر! وصلتم بسلام') : 'فشلت المهمة';
  $('endSub').textContent = win ? (stars === 3 ? 'أوصلت القادة الستة جميعاً وأجبت عن كل الأسئلة. المجد والخلود لشهدائنا الأبرار.' : `وصل ${survivors} من القادة إلى المغارة. ذكرى الشهداء خالدة في التاريخ.`) : reason;
  $('stars').innerHTML = win ? [0, 1, 2].map(k => `<span class="${k < stars ? '' : 'off'}">⭐</span>`).join('') : '';
  $('endScore').textContent = total;
  $('endBest').textContent = isBest ? '🏆 رقم قياسي جديد!' : `🏆 أفضل نتيجة: ${prevBest}`;
  $('breakdown').innerHTML = rows.map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('');
  $('cards').innerHTML = LEADERS.map((L, i) => {
    const f = followers[i], r = results[i];
    const st = (f.alive ? (win ? '✅ وصل إلى المغارة' : '🛡️ صامد') : '🕊️ استشهد') + ' · ' + (r.answered ? (r.correct ? '✔ إجابة صحيحة' : '✘ إجابة خاطئة') : '— لم يُطرح السؤال');
    return `<div class="lcard" style="--c:${L.color}"><h4>${L.icon} ${L.name}</h4><div class="st">${st}</div><p>${L.fact}</p></div>`;
  }).join('');
  $('hud').classList.add('hidden');
  $('endScreen').classList.remove('hidden');
  refreshBest();
}
function togglePause(force) {
  if (S.state === 'playing' && force !== false) {
    S.state = 'paused'; $('pauseModal').classList.remove('hidden'); Sound.drone(0); Object.keys(K).forEach(k => K[k] = false); resetJoy();
  } else if (S.state === 'paused' && force !== true) {
    S.state = 'playing'; $('pauseModal').classList.add('hidden'); document.activeElement?.blur();
  }
}
function toggleMute() { Sound.init(); Sound.setMuted(!Sound.muted); $('muteBtn').textContent = Sound.muted ? '🔇' : '🔊'; }

/* =====================================================================
   UPDATE
   ===================================================================== */
function updatePlayer(dt) {
  let ix = 0, iz = 0;
  if (S.state === 'playing') { if (K.f) iz += 1; if (K.b) iz -= 1; if (K.l) ix -= 1; if (K.r) ix += 1; ix += joy.x; iz += joy.y; }
  else if (S.state === 'ending' && S.pending.win) iz = 0.55;
  if (S.dead) { ix = iz = 0; }
  const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
  const moving = len > 0.08;
  S.running = K.run && moving && iz > -0.2 && S.stamina > 2 && S.state === 'playing';
  S.stamina = S.running ? Math.max(0, S.stamina - 30 * dt) : Math.min(100, S.stamina + (moving ? 14 : 24) * dt);
  const sp = (S.running ? 10.5 : 6.4) * (iz < 0 ? 0.65 : 1);
  const slope = dPathX(S.pz), fl = Math.hypot(slope, 1), fx_ = -slope / fl, fz_ = -1 / fl, rx = -fz_, rz = fx_;
  const tvx = (fx_ * iz + rx * ix) * sp, tvz = (fz_ * iz + rz * ix) * sp, a = damp(10, dt);
  S.vx = lerp(S.vx, tvx, a); S.vz = lerp(S.vz, tvz, a);
  S.px += S.vx * dt; S.pz += S.vz * dt;
  S.pz = clamp(S.pz, CAVE_Z - 1.5, START_Z + 1);
  for (const o of obstacles) {
    if (!o.cleared && S.pz < o.z + 1.9) {
      S.pz = o.z + 1.9; if (S.vz < 0) S.vz = 0;
      if (!o.triggered && S.state === 'playing') { o.triggered = true; openQuiz(o); }
    }
  }
  const c = pathX(S.pz), rel = S.px - c;
  if (Math.abs(rel) > PATH_HALF) { S.px = c + Math.sign(rel) * PATH_HALF; }
  if (K.jump && S.grounded && S.state === 'playing') { S.vy = 6.8; S.grounded = false; Sound.jump(); }
  K.jump = false;
  if (!S.grounded) { S.vy -= 20 * dt; S.py += S.vy * dt; if (S.py <= 0) { S.py = 0; S.vy = 0; S.grounded = true; } }
  const hs = Math.hypot(S.vx, S.vz);
  if (hs > 0.4) S.yaw = lerpAngle(S.yaw, Math.atan2(S.vx, S.vz), damp(12, dt));
  S.phase += hs * dt * 2.2;
  animateFighter(player.userData, S.phase, S.grounded ? clamp(hs / 6, 0, 1.2) : 0.35);
  if (S.dead) { S.deadT += dt; player.userData.body.rotation.x = -Math.min(1, S.deadT / 0.6) * Math.PI / 2; }
  player.position.set(S.px, S.py, S.pz); player.rotation.y = S.yaw;
  // breadcrumb trail for the column of followers
  const head = trail[0];
  if (Math.hypot(S.px - head.x, S.pz - head.z) >= TRAIL_STEP) {
    if (S.pz <= head.z + 0.05) { trail.unshift({ x: S.px, z: S.pz }); if (trail.length > 240) trail.pop(); }
    else if (trail.length > 60) trail.shift();
    else trail[0] = { x: S.px, z: S.pz };
  }
}
function updateFollowers(dt) {
  let slot = 0;
  for (const f of followers) {
    if (f.hurtT > 0) { f.hurtT -= dt; if (f.hurtT <= 0) setEmissive(f.ud, 0); }
    if (f.dying) {
      f.dieT += dt;
      f.ud.body.rotation.x = -Math.min(1, f.dieT / 0.7) * Math.PI / 2;
      if (f.dieT > 3) f.root.position.y -= dt * 0.5;
      if (f.dieT > 6) { f.root.visible = false; f.dying = false; }
      continue;
    }
    if (!f.alive) continue;
    slot++;
    const t = trail[Math.min(trail.length - 1, Math.round(slot * SPACING / TRAIL_STEP))];
    const dx = t.x - f.x, dz = t.z - f.z, k = damp(6, dt);
    const nx = f.x + dx * k, nz = f.z + dz * k, sp = Math.hypot(nx - f.x, nz - f.z) / Math.max(dt, 1e-4);
    f.x = nx; f.z = nz;
    if (sp > 0.3) f.yaw = lerpAngle(f.yaw, Math.atan2(dx, dz), damp(8, dt));
    f.phase += sp * dt * 2.3;
    animateFighter(f.ud, f.phase, clamp(sp / 5, 0, 1.1));
    f.root.position.set(f.x, 0, f.z); f.root.rotation.y = f.yaw;
  }
}
function updatePickups(dt) {
  for (const p of pickups) {
    if (p.taken) continue;
    p.mesh.position.y = 1 + Math.sin(time * 2.4 + p.seed) * 0.15;
    p.mesh.rotation.y += dt * 1.8;
    if (S.state === 'playing' && Math.hypot(S.px - p.x, S.pz - p.z) < 1.35) {
      p.taken = true; p.mesh.visible = false; Sound.pickup();
      const g = glowSprite(p.type === 'med' ? 0xff6050 : 0xffd36a, 2, 1); g.position.copy(p.mesh.position); addFx(g, { life: 0.5, grow: 2.5 });
      if (p.type === 'leaflet') {
        S.leaflets++; addScore(50, '📜 +50');
        toast('📜 ' + FACTS[S.factIdx++ % FACTS.length], 'info', 4200);
      } else {
        S.hp = Math.min(100, S.hp + 40);
        const hurt = followers.filter(f => f.alive && f.hp < 3).sort((a, b) => a.hp - b.hp)[0];
        if (hurt) { hurt.hp++; squadDirty = true; }
        addScore(20, '🩹 +40 صحة');
        toast(hurt ? `🩹 حقيبة إسعاف — ضُمّدت جراحك وجراح ${LEADERS[hurt.i].short}` : '🩹 حقيبة إسعاف — استعدت صحتك', 'good');
      }
    }
  }
}
function updateCamera(dt) {
  if (S.state === 'title') {
    const z = START_Z - 13 + Math.sin(time * 0.15) * 2.5;
    camera.position.set(pathX(z) + Math.sin(time * 0.1) * 1.4, 3.6, z);
    camera.lookAt(pathX(START_Z) , 1.5, START_Z + 3);
    return;
  }
  const slope = dPathX(S.pz + 4), fl = Math.hypot(slope, 1), fx_ = -slope / fl, fz_ = -1 / fl;
  const back = S.state === 'ending' && S.pending?.win ? 13 : 9;
  tmpV.set(S.px - fx_ * back, 8.6 + S.py * 0.35, S.pz - fz_ * back);
  tmpV.y = Math.max(tmpV.y, terrainH(tmpV.x, tmpV.z) + 2);
  camPos.lerp(tmpV, damp(3.5, dt));
  camLook.lerp(tmpV2.set(S.px + fx_ * 9, 0.6 + S.py * 0.4, S.pz + fz_ * 9), damp(5, dt));
  camera.position.copy(camPos);
  if (S.shake > 0.002) { camera.position.x += (Math.random() - 0.5) * S.shake; camera.position.y += (Math.random() - 0.5) * S.shake; S.shake *= Math.exp(-dt * 5); }
  camera.lookAt(camLook);
}
function updateAmbient(dt) {
  skyGroup.position.copy(camera.position);
  moonLight.position.set(S.px + MOON_DIR.x * 60, MOON_DIR.y * 60, S.pz + MOON_DIR.z * 60);
  moonLight.target.position.set(S.px, 0, S.pz);
  fireLight.intensity = 2 + Math.sin(time * 13) * 0.25 + Math.sin(time * 31) * 0.15;
  flames.forEach(f => { const s = 1 + Math.sin(time * 18 + f.seed) * 0.15 + Math.sin(time * 7 + f.seed) * 0.1; f.flame.scale.set(s, s * 1.2, s); f.glow.material.opacity = 0.7 + 0.25 * Math.sin(time * 15 + f.seed); });
  boomLights.forEach(l => { l.intensity *= Math.exp(-dt * 7); });
  // flag wave
  const fp = flag.geometry.attributes.position, base = flag.userData.base;
  for (let i = 0; i < fp.count; i++) { const x = base[i * 3]; fp.setZ(i, Math.sin(x * 2.6 - time * 4.5) * 0.14 * x + Math.sin(base[i * 3 + 1] * 3 + time * 3) * 0.03 * x); }
  fp.needsUpdate = true; flag.geometry.computeVertexNormals();
  // obstacle markers + clearing animation
  obstacles.forEach(o => {
    if (!o.cleared) { o.marker.position.y = o.mglow.position.y = 3.4 + Math.sin(time * 2 + o.i) * 0.2; o.mglow.material.opacity = 0.4 + 0.2 * Math.sin(time * 3 + o.i); }
    else if (o.mesh.visible) { o.clearT += dt * 1.1; o.mesh.position.y = -o.clearT * 2.6; o.mesh.scale.setScalar(1 - o.clearT * 0.3); if (o.clearT >= 1) o.mesh.visible = false; }
  });
  // snow follows camera
  const sp = snow.geometry.attributes.position, a = sp.array, cx = camera.position.x, cz = camera.position.z;
  snow.position.set(0, 0, 0);
  for (let i = 0; i < SNOW_N; i++) {
    let x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
    y -= dt * (1.2 + (i % 5) * 0.25); x += Math.sin(time + i) * dt * 0.4;
    if (y < 0) y += snowBox.h;
    x = cx + ((((x - cx) + 30) % 60 + 60) % 60) - 30; z = cz + ((((z - cz) + 30) % 60 + 60) % 60) - 30;
    a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
  }
  sp.needsUpdate = true;
  S.hurtFlash = Math.max(0, S.hurtFlash - dt * 1.8);
}

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const live = S.state === 'playing' || S.state === 'ending';
  if (S.state !== 'paused') time += dt;
  if (live) {
    if (S.state === 'playing') S.elapsed += dt;
    updatePlayer(dt); updateFollowers(dt); updatePickups(dt); updatePlanes(dt); updateFx(dt);
    if (S.state === 'playing' && S.pz <= CAVE_Z + 2.5) endGame(true);
    if (S.state === 'ending') { S.endTimer -= dt; if (S.endTimer <= 0) showEnd(); }
  } else if (S.state === 'over') { updateFollowers(dt); updateFx(dt); }
  else if (S.state === 'title') {
    followers.forEach((f, k) => animateFighter(f.ud, time * 2 + k, 0.08));
  }
  if (S.state !== 'paused' && S.state !== 'quiz') updateAmbient(dt);
  updateCamera(dt);
  if (S.state !== 'title') updateHUD();
  renderer.render(scene, camera);
}

/* =====================================================================
   INPUT
   ===================================================================== */
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run', Space: 'jump' };
addEventListener('keydown', e => {
  if (S.state === 'quiz') {
    const m = e.code.match(/^(Digit|Numpad)([1-4])$/);
    if (m) { answerQuiz(+m[2] - 1); e.preventDefault(); }
    else if (['Enter', 'NumpadEnter', 'Space'].includes(e.code)) { e.preventDefault(); closeQuiz(); }
    return;
  }
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (e.code === 'KeyM') { toggleMute(); return; }
  if ((S.state === 'title' || S.state === 'over') && e.code === 'Enter') { e.preventDefault(); startGame(); return; }
  if (S.state === 'paused' && e.code === 'Enter') { togglePause(false); return; }
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (k === 'jump') { if (!e.repeat) K.jump = true; } else K[k] = true; }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k && k !== 'jump') K[k] = false; });
addEventListener('blur', () => { Object.keys(K).forEach(k => K[k] = false); resetJoy(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) togglePause(true); });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

$('startBtn').onclick = startGame;
$('againBtn').onclick = startGame;
$('qNext').onclick = closeQuiz;
$('pauseBtn').onclick = () => togglePause();
$('resumeBtn').onclick = () => togglePause(false);
$('restartBtn').onclick = startGame;
$('muteBtn').onclick = toggleMute;
document.querySelectorAll('.wladz-exit').forEach(b => { b.onclick = () => window.dispatchEvent(new CustomEvent('mujahideen:exit')); });

// touch
const joyEl = $('joy'), knob = $('knob');
function moveJoy(e) {
  const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const max = r.width / 2 - 12, l = Math.hypot(dx, dy); if (l > max) { dx *= max / l; dy *= max / l; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / max; joy.y = -dy / max;
}
joyEl.addEventListener('pointerdown', e => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); moveJoy(e); e.preventDefault(); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joy.id) moveJoy(e); });
['pointerup', 'pointercancel'].forEach(ev => joyEl.addEventListener(ev, e => { if (e.pointerId === joy.id) resetJoy(); }));
$('tJump').addEventListener('pointerdown', e => { K.jump = true; e.preventDefault(); });
const tRun = $('tRun');
tRun.addEventListener('pointerdown', e => { K.run = !K.run; tRun.classList.toggle('on', K.run); e.preventDefault(); });

/* =====================================================================
   GO
   ===================================================================== */
resetGame();
loop();
