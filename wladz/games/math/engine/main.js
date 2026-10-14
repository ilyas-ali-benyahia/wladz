// Copié du jeu « Solve & Shoot » (math_game). Modifications pour WLADZ :
// textes en arabe, événement `solve-and-shoot:correct` à chaque bonne réponse,
// boutons `.exit-game` qui demandent à la page hôte de fermer le jeu.
// ══════════════════════════════════════════════════════════════════
//  Solve & Shoot  ·  main.js  (v6)
//  State machine: IDLE → PLAYING → TRANSITION → DYING → GAMEOVER
//  Gameplay timers are driven by the render loop (never setTimeout),
//  so pausing freezes the game completely and correctly.
// ══════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MathEngine } from './math.js';
import { EnemyManager, createRobotPreview } from './enemies.js';
import { WeaponFX } from './weapon.js';
import { AudioFX } from './audio.js';
import { MobileControls } from './mobile-controls.js';

const isMobile = /Mobi|Android|iPad/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
document.body.classList.toggle('mobile', isMobile);
const REDUCED_MOTION = window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── DOM ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('c');
const hudEl = $('hud');
const flashEl = $('flash');
const dmgVig = $('dmg-vig');
const clickHint = $('click-hint');
const qText = $('q-text');
const feedbackEl = $('feedback');
const timerBar = $('timer-bar');
const waveValEl = $('wave-val');
const scoreValEl = $('score-val');
const hpBar = $('hp-bar');
const hpWrap = $('hp-wrap');
const hpTrack = $('hp-track');
const hpValEl = $('hp-val');
const comboValEl = $('combo-val');
const comboWrapEl = $('combo-wrap');
const waveAnn = $('wave-ann');
const scorePopEl = $('score-pop');
const xhair = $('xhair');
const aimDot = $('aim-dot');
const diffBadge = $('diff-badge');
const fadeOverlay = $('fade-overlay');
const startScreen = $('start-screen');
const overScreen = $('over-screen');
const pauseScreen = $('pause-screen');
const backBtn = $('back-btn');
const pauseHint = $('pause-hint');
const finalScore = $('final-score');
const finalWave = $('final-wave');
const finalStats = $('final-stats');
const finalBest = $('final-best');
const muteBtn = $('mute-btn');
const rotateScreen = $('rotate-screen');
const mobileSound = $('mobile-sound');
let mobilePortrait = false;
let renderDirty = true;

// ── State machine ─────────────────────────────────────────────────
// IDLE → PLAYING → TRANSITION → DYING → GAMEOVER → PAUSED → (back)
const S = Object.freeze({ IDLE: 'idle', PLAYING: 'playing', TRANSITION: 'transition', DYING: 'dying', GAMEOVER: 'gameover', PAUSED: 'paused' });
let gameState = S.IDLE;
let pausedFrom = S.PLAYING;   // state to return to when unpausing

// ── Difficulty config ─────────────────────────────────────────────
const DIFF = {
  easy:     { label: 'سهل',     timerMax: 28, baseSpeed: 0.50, speedScale: 0.07, dmg: 22 },
  advanced: { label: 'متقدّم', timerMax: 20, baseSpeed: 0.85, speedScale: 0.11, dmg: 28 },
  ultra:    { label: 'خارق',    timerMax: 14, baseSpeed: 1.20, speedScale: 0.18, dmg: 38 },
};
let currentDiff = 'easy';

// SURGE: every 5th wave is an assault round — enemies move 25% faster
// and the arena lighting shifts to a pulsing red. Purely a pressure
// modifier; the math difficulty curve is unchanged.
let surgeWave = false;

// Game-local best score per difficulty (SANAD will own progression;
// this is display-only convenience, see docs/SANAD-INTEGRATION.md)
function loadBest(d) {
  try { return Math.max(0, parseInt(localStorage.getItem('sns-best-' + d), 10) || 0); } catch { return 0; }
}
function saveBest(d, v) {
  try { localStorage.setItem('sns-best-' + d, String(v)); } catch { /* private mode */ }
}

// Difficulty button wiring (start screen + retry screen share logic)
function bindDiffButtons(attr) {
  document.querySelectorAll(`[data-${attr}]`).forEach(btn => {
    btn.addEventListener('click', () => {
      currentDiff = btn.dataset[attr];
      // Both screens present the same selected difficulty to eyes and AT.
      document.querySelectorAll('.diff-btn').forEach(b => {
        const selected = (b.dataset.diff || b.dataset.diff2) === currentDiff;
        b.className = selected ? `diff-btn active-${currentDiff}` : 'diff-btn';
        b.setAttribute('aria-pressed', String(selected));
      });
      audio.ui();
    });
  });
}
bindDiffButtons('diff');
bindDiffButtons('diff2');

// ── Renderer (with graceful failure if WebGL is unavailable) ──────
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, powerPreference: 'high-performance'
  });
} catch (err) {
  const el = $('webgl-error');
  if (el) el.style.display = 'flex';
  throw err;
}
function pixelRatio(w, h) {
  return isMobile ? Math.min(window.devicePixelRatio, 1, 1280 / Math.max(w, h))
    : Math.min(window.devicePixelRatio, 1.5);
}
renderer.setPixelRatio(pixelRatio(window.innerWidth, window.innerHeight));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = false;

// ── Scene ─────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020510);
scene.fog = new THREE.FogExp2(0x020510, 0.045);

// ── Camera ────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 1.7, 0);
scene.add(camera);

// ── Post-processing ───────────────────────────────────────────────
// Mobile uses a single render with the same tone mapping and emissive armor.
// Avoid allocating the bloom pyramid and its full-screen GPU passes there.
const composer = isMobile ? null : new EffectComposer(renderer);
if (composer) {
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.26, 0.4, 1.05));
  composer.addPass(new OutputPass());
}
function renderScene() {
  if (composer) composer.render();
  else renderer.render(scene, camera);
  renderDirty = false;
}

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(pixelRatio(w, h));
  renderer.setSize(w, h);
  composer?.setSize(w, h);
  renderDirty = true;
  syncOrientation();
});

// ── Environment ───────────────────────────────────────────────────
// Animated pieces (scrolling grid, rotating stars, surge light shift)
// are kept in module refs and driven by tickEnv() in the render loop.
let envGrid, envStars;
buildEnv();
function buildEnv() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x131d2c, roughness: 0.92, metalness: 0.12 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  envGrid = new THREE.GridHelper(60, 60, 0x00ffe7, 0x001414);
  envGrid.position.y = 0.004;
  envGrid.material.opacity = 0.14; envGrid.material.transparent = true;
  scene.add(envGrid);

  // Open sky: starfield dome (unaffected by fog — reads as true distance)
  {
    const N = 320;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 42 + Math.random() * 16;
      const y = 7 + Math.pow(Math.random(), 1.5) * 30;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    envStars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x9fd8ff, size: 0.34, transparent: true, opacity: 0.85, fog: false
    }));
    scene.add(envStars);
  }

  // Perimeter walls (tall, framing the open sky above)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x182033, roughness: 0.9 });
  const wallGeo = new THREE.PlaneGeometry(60, 9);
  [
    [0, 4.5, -30, 0], [0, 4.5, 30, Math.PI],
    [-30, 4.5, 0, Math.PI / 2], [30, 4.5, 0, -Math.PI / 2],
  ].forEach(([x, y, z, ry]) => {
    const w = new THREE.Mesh(wallGeo, wallMat);
    w.position.set(x, y, z); w.rotation.y = ry; scene.add(w);
  });

  // Neon strips (vertical pillars along the walls + horizontal rails)
  const cMat = new THREE.MeshStandardMaterial({ color: 0x00ffe7, emissive: 0x00ffe7, emissiveIntensity: 2.5 });
  const pMat = new THREE.MeshStandardMaterial({ color: 0x7b2fff, emissive: 0x7b2fff, emissiveIntensity: 2 });
  [0.7, 2.4, 4.1].forEach(y => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(28, 0.05, 0.05), cMat);
    s.position.set(0, y, -29.96); scene.add(s);
  });
  [-29.96, 29.96].forEach(x => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 26), pMat);
    s.position.set(x, 0.5, 0); scene.add(s);
  });
  // Wall-top rails — a bright horizon line under the stars
  const topMat = new THREE.MeshStandardMaterial({ color: 0x00ffe7, emissive: 0x00ffe7, emissiveIntensity: 1.6 });
  [
    [0, 8.9, -29.96, 0], [0, 8.9, 29.96, 0],
    [-29.96, 8.9, 0, Math.PI / 2], [29.96, 8.9, 0, Math.PI / 2],
  ].forEach(([x, y, z, ry]) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(30, 0.06, 0.06), topMat);
    s.position.set(x, y, z); s.rotation.y = ry; scene.add(s);
  });

  // Distant skyline towers peeking over the walls (fog-exempt silhouettes)
  {
    const towerMat = new THREE.MeshBasicMaterial({ color: 0x0c0a24, fog: false });
    const winMat = new THREE.MeshBasicMaterial({ color: 0x1b3a66, fog: false });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2;
      const r = 58 + Math.random() * 8;
      const h = 6 + Math.random() * 14;
      const w = 2.5 + Math.random() * 3.5;
      const tw = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), towerMat);
      tw.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      tw.rotation.y = Math.random() * Math.PI;
      scene.add(tw);
      // A single dim window band per tower
      const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, h * 0.16), winMat);
      win.position.set(0, h * 0.25, w / 2 + 0.02);
      tw.add(win);
    }
  }

  // Columns
  const colMat = new THREE.MeshStandardMaterial({ color: 0x34465e, metalness: 0.4, roughness: 0.55 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffe7, emissive: 0x00ffe7, emissiveIntensity: 3 });
  [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([x, z]) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5, 0.24), colMat);
    col.position.set(x, 2.5, z); scene.add(col);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 8, 24), ringMat);
    ring.position.set(x, 1.1, z); scene.add(ring);
  });

  // One far-wall landmark: a quiet, octagonal reactor gate above the targets.
  // Static geometry, no extra lights, particles or animated render passes.
  const gate = new THREE.Group();
  gate.position.set(0, 5.8, -25.5);
  const frame = new THREE.Mesh(new THREE.RingGeometry(2.65, 3.05, 8), colMat);
  gate.add(frame);
  const gateMat = new THREE.MeshStandardMaterial({
    color: 0x7162a8, emissive: 0x6742ba, emissiveIntensity: 1.5,
    roughness: 0.6, metalness: 0.2,
  });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(2.53, 2.6, 8), gateMat);
  innerRing.position.z = 0.02;
  gate.add(innerRing);
  const core = new THREE.Mesh(new THREE.CircleGeometry(2.52, 8), wallMat);
  core.position.z = -0.03;
  gate.add(core);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.6, 0.06), gateMat);
  spine.position.z = 0.03;
  gate.add(spine);
  scene.add(gate);
  const supportGeo = new THREE.BoxGeometry(0.55, 3.3, 0.7);
  for (const x of [-2.8, 2.8]) {
    const support = new THREE.Mesh(supportGeo, colMat);
    support.position.set(x, 1.65, -25.5);
    scene.add(support);
  }

  // Fixed four-metre floor joints establish scale beneath the drifting grid.
  const joints = [];
  for (let z = -24; z <= 4; z += 4) joints.push(-12, 0.006, z, 12, 0.006, z);
  for (let x = -12; x <= 12; x += 4) joints.push(x, 0.006, -24, x, 0.006, 4);
  const jointGeo = new THREE.BufferGeometry();
  jointGeo.setAttribute('position', new THREE.Float32BufferAttribute(joints, 3));
  scene.add(new THREE.LineSegments(jointGeo, new THREE.LineBasicMaterial({
    color: 0x355169, transparent: true, opacity: 0.38,
  })));
  // Eight recessed perimeter markers in one draw call, away from the targets.
  const markers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.015, 1.2),
    new THREE.MeshBasicMaterial({ color: 0x265763 }), 8);
  const markerMatrix = new THREE.Matrix4();
  let markerIndex = 0;
  for (const x of [-10, 10]) {
    for (const z of [-4, -10, -16, -22]) {
      markerMatrix.makeTranslation(x, 0.01, z);
      markers.setMatrixAt(markerIndex++, markerMatrix);
    }
  }
  scene.add(markers);
}

// Environment animation: scrolling grid, drifting stars, surge lighting.
// Everything runs on the raw timestamp; nothing allocates.
function tickEnv(ts) {
  if (REDUCED_MOTION) return;
  const t = ts * 0.001;
  envGrid.position.z = (t * 1.5) % 1;          // infinite-floor illusion
  envStars.rotation.y = t * 0.004;             // slow sky drift
  if (surgeWave) {
    const p = 0.5 + Math.sin(t * 6) * 0.5;     // urgent red pulse
    ptCyan.color.setHex(0xff2f55); ptCyan.intensity = 2.6 + p * 1.6;
    ptPurp.color.setHex(0xff2f55); ptPurp.intensity = 1.8 + p * 1.2;
  } else {
    ptCyan.color.setHex(0x00ffe7); ptCyan.intensity = 3;
    ptPurp.color.setHex(0x7b2fff); ptPurp.intensity = 2;
  }
}

// ── Lighting ──────────────────────────────────────────────────────
// Broad, shadow-free fill reveals armor without washing out the night sky.
scene.add(new THREE.HemisphereLight(0xb6c9e3, 0x172036, 0.85));
const keyLight = new THREE.DirectionalLight(0xe5eeff, 1.65);
keyLight.position.set(3, 8, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8586da, 0.65);
rimLight.position.set(-6, 4, -12);
scene.add(rimLight);
const ptCyan = new THREE.PointLight(0x00ffe7, 3, 22); ptCyan.position.set(0, 4, -14); scene.add(ptCyan);
const ptPurp = new THREE.PointLight(0x7b2fff, 2, 16); ptPurp.position.set(0, 4, -4); scene.add(ptPurp);

// ── Pointer lock ──────────────────────────────────────────────────
let locked = false;
let targetYaw = 0, targetPitch = 0, yaw = 0, pitch = 0;

canvas.addEventListener('click', () => {
  if (isMobile) return;
  if (gameState === S.PLAYING || gameState === S.TRANSITION) {
    canvas.requestPointerLock().catch(() => { });
  }
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  clickHint.style.opacity = locked ? '0' : '1';
  if (!locked && (gameState === S.PLAYING || gameState === S.TRANSITION)) {
    goPaused();
  }
});
document.addEventListener('mousemove', e => {
  if (!locked || (gameState !== S.PLAYING && gameState !== S.TRANSITION)) return;
  targetYaw -= e.movementX * 0.0018;
  targetPitch -= e.movementY * 0.0018;
  targetPitch = Math.max(-Math.PI / 3.2, Math.min(Math.PI / 3.2, targetPitch));
});

// Pause when the tab is hidden (rAF stops, but state should be explicit)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (gameState === S.PLAYING || gameState === S.TRANSITION)) goPaused();
});

// ── Sub-systems ───────────────────────────────────────────────────
const mathEng = new MathEngine();
const enemies = new EnemyManager(scene, camera);
const weapon = new WeaponFX(scene, camera);
const menuPreview = createRobotPreview(scene);
let menuWasVisible;
const audio = new AudioFX();

// Restore mute preference
try { audio.setMuted(localStorage.getItem('sns-muted') === '1'); } catch { /* ignore */ }
function toggleMute() {
  audio.setMuted(!audio.muted);
  try { localStorage.setItem('sns-muted', audio.muted ? '1' : '0'); } catch { /* ignore */ }
  if (muteBtn) muteBtn.textContent = audio.muted ? 'الصوت: متوقف' : 'الصوت: يعمل';
  mobileSound.setAttribute('aria-pressed', String(audio.muted));
  mobileSound.setAttribute('aria-label', audio.muted ? 'تشغيل الصوت' : 'إيقاف الصوت');
  mobileSound.textContent = audio.muted ? 'الصوت متوقف' : 'الصوت يعمل';
}
if (muteBtn) {
  muteBtn.textContent = audio.muted ? 'الصوت: متوقف' : 'الصوت: يعمل';
  muteBtn.addEventListener('click', e => { e.preventDefault(); toggleMute(); });
}
mobileSound.setAttribute('aria-pressed', String(audio.muted));
mobileSound.setAttribute('aria-label', audio.muted ? 'تشغيل الصوت' : 'إيقاف الصوت');
mobileSound.textContent = audio.muted ? 'الصوت متوقف' : 'الصوت يعمل';

// Reused raycaster – never re-created
const raycaster = new THREE.Raycaster();
const screenCtr = new THREE.Vector2(0, 0);
const _missPt = new THREE.Vector3();   // scratch endpoint for missed shots

// ── Game data (never holds DOM refs) ─────────────────────────────
const gd = {
  score: 0, wave: 1, hp: 100,
  timer: 0, timerMax: 0, combo: 0, timeScale: 1,
  q: null,                    // current question { text, answer, op, a, b }
  shots: 0, correctCount: 0,  // accuracy stats
  bestCombo: 0,
};

// Camera shake — transient offsets only; the player's actual aim
// (targetYaw/targetPitch) is never touched, so shots never drift.
let shakeAmt = 0, shakeYaw = 0, shakePitch = 0;
function addShake(amount) { if (!REDUCED_MOTION) shakeAmt = Math.max(shakeAmt, amount); }

// Loop-driven gameplay timers (seconds remaining, 0 = inactive).
// Counted down with raw (unscaled) time inside the render loop, so
// pausing the game freezes them exactly like everything else.
let transitionT = 0;   // PLAYING→next wave delay
let hitStopT = 0;      // correct-answer time dilation
let dyingT = 0;        // DYING→GAMEOVER delay
let revealT = 0;       // timeout: how long the correct robot stays revealed

// ── Landscape touch controls ──────────────────────────────────────
const mobileControls = isMobile ? new MobileControls({
  root: $('mobile-controls'), stick: $('aim-stick'), knob: $('aim-knob'),
  fireButton: $('fire-btn'), canvas,
  onAim: (dx, dy) => {
    if (mobilePortrait || (gameState !== S.PLAYING && gameState !== S.TRANSITION)) return;
    targetYaw -= dx;
    targetPitch = Math.max(-Math.PI / 3.2, Math.min(Math.PI / 3.2, targetPitch - dy));
  },
  onFire: () => { if (!mobilePortrait && gameState === S.PLAYING) fire(); },
}) : null;

function syncOrientation() {
  if (!isMobile) return;
  const portrait = window.innerWidth <= window.innerHeight;
  const changed = portrait !== mobilePortrait;
  mobilePortrait = portrait;
  rotateScreen.hidden = !portrait;
  document.body.classList.toggle('mobile-portrait', portrait);
  for (const el of [startScreen, overScreen, pauseScreen, hudEl, backBtn, $('mobile-controls')]) el.inert = portrait;
  if (portrait) {
    mobileControls.setEnabled(false, false);
    goPaused();
    if (changed) rotateScreen.focus({ preventScroll: true });
  } else if (changed) {
    const focusTarget = gameState === S.PAUSED ? $('resume-btn') : gameState === S.IDLE ? $('start-btn') : gameState === S.GAMEOVER ? $('retry-btn') : null;
    focusTarget?.focus({ preventScroll: true });
  }
}

async function enterFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    await screen.orientation?.lock?.('landscape');
  } catch { /* The rotate prompt also works without fullscreen/orientation APIs. */ }
}

if (isMobile) {
  clickHint.style.display = 'none';
  $('mobile-pause').addEventListener('click', goPaused);
  mobileSound.addEventListener('click', toggleMute);
  for (const btn of document.querySelectorAll('.fullscreen-btn')) {
    btn.hidden = !document.fullscreenEnabled;
    btn.addEventListener('click', enterFullscreen);
  }
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) goPaused();
    syncOrientation();
  });
  window.addEventListener('blur', () => { mobileControls.reset(); goPaused(); });
  syncOrientation();
}

// ── Shooting ──────────────────────────────────────────────────────
document.addEventListener('mousedown', e => {
  // Only a locked cursor fires: the click that re-acquires pointer
  // lock must never count as a shot.
  if (e.button === 0 && gameState === S.PLAYING && locked) fire();
});
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && gameState === S.PLAYING && locked) { e.preventDefault(); fire(); }
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'Escape') {
    if (gameState === S.PLAYING || gameState === S.TRANSITION) goPaused();
    else if (gameState === S.PAUSED) goResume();
  }
});

function fire() {
  gd.shots++;
  audio.shoot();
  weapon.fire();
  addShake(0.022);
  xhair.classList.add('recoil');
  setTimeout(() => xhair.classList.remove('recoil'), 95);

  raycaster.setFromCamera(screenCtr, camera);
  const hit = enemies.raycast(raycaster);
  if (hit) {
    // Visible laser beam: muzzle → robot chest
    weapon.spawnTracer(hit.root.position.x, hit.root.position.y + 1.0, hit.root.position.z);
    hit.isCorrect ? onCorrect(hit) : onWrong(hit);
  } else {
    // Miss — beam off into the fog along the aim ray
    raycaster.ray.at(40, _missPt);
    weapon.spawnTracer(_missPt.x, _missPt.y, _missPt.z);
  }
}

function onCorrect(hit) {
  if (gameState !== S.PLAYING) return;   // guard duplicate triggers
  gd.combo++;
  gd.bestCombo = Math.max(gd.bestCombo, gd.combo);
  // ⚡ Speed bonus: solved within the top third of the timer
  const fast = gd.timer > gd.timerMax * 0.66;
  const points = 10 + (gd.combo > 1 ? gd.combo * 2 : 0) + (fast ? 5 : 0);
  gd.score += points;
  gd.correctCount++;
  window.dispatchEvent(new CustomEvent('solve-and-shoot:correct'));
  audio.correct();
  if (fast) audio.bonus();
  enemies.destroyEnemy(hit);
  hitStopT = REDUCED_MOTION ? 0 : 0.38;
  doFlash('rgba(0,255,120,.26)');
  hitMark(true);
  scorePop(fast ? `⚡+${points}` : '+' + points, fast);
  showFeedback(`✓ ${solvedText()}`, true);
  updateHUD();
  goTransition();
}

function onWrong(hit) {
  if (gameState !== S.PLAYING) return;
  gd.combo = 0;
  gd.hp = Math.max(0, gd.hp - DIFF[currentDiff].dmg);
  audio.wrong();
  enemies.shakeEnemy(hit);
  doFlash('rgba(255,20,20,.38)');
  showDmgVig();
  hitMark(false);
  addShake(0.032);
  // Educational feedback: show the correct equation. The wave keeps
  // running — the player still has to find the robot carrying it.
  showFeedback(`✗ ${solvedText()}`, false);
  updateHUD();
  if (gd.hp <= 0) goDying();
}

// "7 × 3 = 21" from the current question
function solvedText() {
  return gd.q ? gd.q.text.replace('?', String(gd.q.answer)) : '';
}

// ── State transitions ─────────────────────────────────────────────
function goTransition(delay = 1.2, holdReveal = false) {
  if (gameState !== S.PLAYING) return;
  gameState = S.TRANSITION;
  // On a timeout the correct robot is revealed first — keep it on screen
  // until revealT expires (the loop then calls despawnAll), so the player
  // actually sees which robot carried the answer.
  if (!holdReveal) enemies.despawnAll();  // gentle shrink-out, no abrupt pops
  transitionT = delay;
}

function goPlaying() {
  const d = DIFF[currentDiff];
  gd.timer = d.timerMax;
  gd.timerMax = d.timerMax;

  const q = mathEng.generate(currentDiff, gd.wave);
  gd.q = q;
  qText.textContent = q.text;
  qText.classList.add('pop');
  setTimeout(() => qText.classList.remove('pop'), 140);
  hideFeedback();

  waveValEl.textContent = gd.wave;
  pulseStat(waveValEl);

  // SURGE rounds every 5th wave: announced, faster, red-lit
  surgeWave = gd.wave % 5 === 0;
  if (surgeWave) {
    waveAnn.textContent = `⚡ هجوم ${gd.wave} ⚡`;
    waveAnn.classList.add('show', 'surge');
    setTimeout(() => waveAnn.classList.remove('show', 'surge'), 1400);
    audio.surge();
  }

  let speed = d.baseSpeed + (gd.wave - 1) * d.speedScale;
  if (surgeWave) speed *= 1.25;
  enemies.spawnWave(q.answer, q.decoys, speed);
  audio.waveStart();

  gameState = S.PLAYING;
}

function goDying() {
  if (gameState === S.DYING || gameState === S.GAMEOVER) return;
  gameState = S.DYING;
  dyingT = 1.0;
  fadeOverlay.style.opacity = '1';
  audio.gameOver();
}

function goPaused() {
  if (gameState !== S.PLAYING && gameState !== S.TRANSITION) return;
  pausedFrom = gameState;
  gameState = S.PAUSED;
  mobileControls?.setEnabled(false, false);
  renderDirty = true;
  if (document.pointerLockElement === canvas) document.exitPointerLock?.();

  pauseScreen.style.display = 'flex';
  void pauseScreen.offsetWidth;
  pauseScreen.style.opacity = '1';
  pauseHint.style.opacity = '0';
}

function goResume() {
  if (gameState !== S.PAUSED || mobilePortrait) return;

  pauseScreen.style.opacity = '0';
  setTimeout(() => {
    if (gameState !== S.PAUSED) pauseScreen.style.display = 'none';
  }, 450);

  gameState = pausedFrom;
  lastTs = performance.now(); // Avoid jumping time
  if (!isMobile) canvas.requestPointerLock().catch(() => { });
  pauseHint.style.opacity = '1';
}

function goMainMenu() {
  mobileControls?.setEnabled(false, false);
  gameState = S.IDLE;
  document.exitPointerLock?.();
  enemies.clearAll();
  transitionT = 0; hitStopT = 0; dyingT = 0; revealT = 0;
  surgeWave = false;

  hudEl.style.opacity = '0';
  overScreen.style.opacity = '0';
  pauseScreen.style.opacity = '0';
  backBtn.style.opacity = '0';
  pauseHint.style.opacity = '0';
  fadeOverlay.style.opacity = '0';

  setTimeout(() => {
    overScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    backBtn.style.display = 'none';
    pauseHint.style.display = 'none';

    startScreen.style.display = 'flex';
    void startScreen.offsetWidth;
    startScreen.style.opacity = '1';
  }, 450);
}

function goGameOver() {
  if (gameState === S.GAMEOVER) return;
  gameState = S.GAMEOVER;
  mobileControls?.setEnabled(false, false);
  document.exitPointerLock?.();
  enemies.clearAll();

  const best = loadBest(currentDiff);
  const newBest = gd.score > best;
  if (newBest) saveBest(currentDiff, gd.score);

  finalScore.textContent = `النتيجة: ${gd.score}`;
  finalWave.textContent = `الموجة: ${gd.wave}`;
  const acc = gd.shots > 0 ? Math.round((gd.correctCount / gd.shots) * 100) : 0;
  finalStats.textContent = `الدقة ${acc}%  ·  أفضل سلسلة ×${gd.bestCombo}`;
  finalBest.textContent = newBest ? '★ رقم قياسي جديد ★' : `أفضل نتيجة: ${Math.max(best, gd.score)}`;

  overScreen.style.opacity = '0';
  overScreen.style.display = 'flex';
  // Trigger reflow for CSS transition
  void overScreen.offsetWidth;
  overScreen.style.opacity = '1';

  backBtn.style.opacity = '0';
  pauseHint.style.opacity = '0';
  setTimeout(() => {
    backBtn.style.display = 'none';
    pauseHint.style.display = 'none';
  }, 450);

  hudEl.style.opacity = '0';
}

function startGame() {
  if (mobilePortrait) return;
  mobileControls?.reset();
  // Reset all game data
  const d = DIFF[currentDiff];
  gd.wave = 1; gd.score = 0; gd.hp = 100;
  gd.combo = 0; gd.bestCombo = 0;
  gd.shots = 0; gd.correctCount = 0;
  gd.timerMax = d.timerMax; gd.timer = d.timerMax;
  gd.timeScale = 1;
  yaw = 0; pitch = 0; targetYaw = 0; targetPitch = 0;
  shakeAmt = 0; shakeYaw = 0; shakePitch = 0;
  transitionT = 0; hitStopT = 0; dyingT = 0; revealT = 0;
  surgeWave = false;
  pausedFrom = S.PLAYING;

  fadeOverlay.style.opacity = '0';
  overScreen.style.opacity = '0';
  pauseScreen.style.opacity = '0';
  setTimeout(() => {
    overScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
  }, 450);

  backBtn.style.display = 'block';
  pauseHint.style.display = 'block';
  void backBtn.offsetWidth;
  backBtn.style.opacity = '1';
  pauseHint.style.opacity = '1';

  enemies.clearAll();
  diffBadge.style.display = 'block';
  diffBadge.textContent = d.label;
  updateHUD();
  hudEl.style.opacity = '1';

  goPlaying();
  if (!isMobile) canvas.requestPointerLock().catch(() => { });
}

// ── Timer ─────────────────────────────────────────────────────────
function tickTimer(rawDt) {
  if (gameState !== S.PLAYING) return;
  gd.timer -= rawDt;

  const pct = Math.max(0, gd.timer / gd.timerMax);
  timerBar.style.width = (pct * 100) + '%';
  timerBar.style.background = pct > 0.35
    ? 'linear-gradient(90deg,#00ffe7,#7b2fff)'
    : 'linear-gradient(90deg,#ff4466,#ff8866)';

  if (gd.timer <= 0) {
    gd.hp = Math.max(0, gd.hp - DIFF[currentDiff].dmg * 0.75);
    doFlash('rgba(255,20,20,.35)'); showDmgVig(); audio.wrong();
    gd.combo = 0;
    // Time's up: reveal which robot was carrying the answer, hold it
    // briefly so the player actually sees it, then move on
    showFeedback(`✗ ${solvedText()}`, false);
    enemies.revealCorrect();
    revealT = 0.6;
    updateHUD();
    if (gd.hp <= 0) goDying();
    else goTransition(1.5, true); // holdReveal: despawn when revealT expires
  }
}

// ── Per-frame aim check ───────────────────────────────────────────
let _lastAimTarget = null;
function tickAim() {
  if (gameState !== S.PLAYING) {
    if (_lastAimTarget) { enemies.setHighlight(null); _lastAimTarget = null; }
    xhair.classList.remove('on-target');
    aimDot.classList.remove('show');
    return;
  }
  raycaster.setFromCamera(screenCtr, camera);
  const hit = enemies.raycast(raycaster);
  if (hit !== _lastAimTarget) {
    _lastAimTarget = hit;
    enemies.setHighlight(hit);
    xhair.classList.toggle('on-target', !!hit);
    aimDot.classList.toggle('show', !!hit);
  }
}

// ── Main render loop ────────────────────────────────────────────── M.A
let lastTs = 0;
let lastMenuFrame = -Infinity;
function loop(ts) {
  requestAnimationFrame(loop);

  // Clamp delta to avoid large spikes on tab-resume
  const rawDt = Math.min((ts - lastTs) * 0.001, 0.033);
  lastTs = ts;

  const active = gameState === S.PLAYING || gameState === S.TRANSITION;
  mobileControls?.setEnabled(active && !mobilePortrait && !document.hidden, gameState === S.PLAYING && !mobilePortrait && !document.hidden);
  // No simulation or GPU work behind the rotate prompt or a hidden tab.
  if (mobilePortrait || document.hidden) return;
  // Pause must freeze reveal/transition timers as well as enemy movement.
  if (gameState === S.PAUSED) {
    if (renderDirty) renderScene();
    return;
  }
  if (isMobile && (gameState === S.IDLE || gameState === S.GAMEOVER)) {
    if (!renderDirty && ts - lastMenuFrame < 1000 / 30) return;
    lastMenuFrame = ts;
  }

  // Loop-driven gameplay timers (frozen while paused, real-time based)
  if (hitStopT > 0) hitStopT = Math.max(0, hitStopT - rawDt);
  if (revealT > 0) {
    revealT -= rawDt;
    if (revealT <= 0) enemies.despawnAll();
  }
  if (gameState === S.TRANSITION) {
    transitionT -= rawDt;
    if (transitionT <= 0) { gd.wave++; goPlaying(); }
  } else if (gameState === S.DYING) {
    dyingT -= rawDt;
    if (dyingT <= 0) goGameOver();
  }

  // Time dilation: hit-stop after a correct answer, slow-mo while dying
  gd.timeScale = gameState === S.DYING ? 0.3 : (hitStopT > 0 ? 0.28 : 1);
  const dt = rawDt * gd.timeScale;
  mobileControls?.update(rawDt);

  if (gameState === S.PLAYING || gameState === S.TRANSITION || gameState === S.DYING) {
    // Smooth camera lerp
    const lf = Math.min(12 * dt, 1);
    yaw += (targetYaw - yaw) * lf;
    pitch += (targetPitch - pitch) * lf;

    // Idle sway
    const t = ts * 0.001;
    const swX = REDUCED_MOTION ? 0 : Math.sin(t * 0.8) * 0.0022;
    const swY = REDUCED_MOTION ? 0 : Math.sin(t * 0.55) * 0.003;

    // Camera shake — decaying transient offset, applied to the render
    // rotation only so the player's aim target is never corrupted
    if (shakeAmt > 0.0005) {
      shakeYaw = (Math.random() - 0.5) * shakeAmt;
      shakePitch = (Math.random() - 0.5) * shakeAmt;
      shakeAmt *= Math.exp(-10 * rawDt);
    } else {
      shakeAmt = 0; shakeYaw = 0; shakePitch = 0;
    }

    camera.position.x = swX * 0.5;
    camera.position.y = 1.7 - swY * 0.3;
    camera.position.z = 0;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw + swX + shakeYaw;
    camera.rotation.x = pitch + swY + shakePitch;

    enemies.update(dt, camera.position);
    weapon.update(dt);

    // Proximity damage only while actively playing
    if (gameState === S.PLAYING) {
      const near = enemies.checkProximity(camera.position, 1.5);
      if (near) {
        gd.hp = Math.max(0, gd.hp - DIFF[currentDiff].dmg * 0.5 * rawDt);
        showDmgVig(); updateHUD();
        if (gd.hp <= 0) goDying();
      }
      tickTimer(rawDt);
      tickAim();
    }
  }

  // Presentation only: the idle droid is separate from the live enemy pool.
  const menuVisible = gameState === S.IDLE;
  if (menuVisible !== menuWasVisible) {
    menuWasVisible = menuVisible;
    menuPreview.root.visible = menuPreview.shadow.visible = menuVisible;
    weapon.group.visible = !menuVisible;
    document.body.classList.toggle('menu-active', menuVisible);
  }
  if (menuVisible) {
    camera.position.set(0, 1.7, 0);
    camera.rotation.set(0, 0, 0);
    const portrait = window.innerWidth <= 600 && window.innerHeight > window.innerWidth;
    const compact = portrait && window.innerHeight < 700;
    const bob = REDUCED_MOTION ? 0 : Math.sin(ts * 0.0008) * 0.06;
    menuPreview.root.position.set(portrait ? 0 : camera.aspect * 2.4, (compact ? 3.65 : portrait ? 1.9 : 0.16) + bob, -7);
    menuPreview.root.rotation.y = -0.12;
    menuPreview.root.scale.setScalar(compact ? 0.72 : portrait ? 1.15 : 1.55);
    menuPreview.shadow.position.set(menuPreview.root.position.x, 0.012, -7);
    menuPreview.shadow.scale.setScalar(portrait ? 1.15 : 1.55);
  }
  tickEnv(ts);
  renderScene();
  flushHUD();
}
requestAnimationFrame(loop);

// ── HUD helpers (throttled to avoid layout thrash) ────────────────
let _hudDirty = false;
function updateHUD() { _hudDirty = true; }
function flushHUD() {
  if (!_hudDirty) return;
  _hudDirty = false;
  scoreValEl.textContent = gd.score;
  hpBar.style.width = gd.hp + '%';
  hpValEl.textContent = Math.ceil(gd.hp) + '%';
  hpWrap.style.setProperty('--health-color', gd.hp < 30 ? '#ff667c' : gd.hp < 60 ? '#edbd68' : '#5ddba5');
  hpTrack.setAttribute('aria-valuenow', String(Math.ceil(gd.hp)));
  comboValEl.textContent = gd.combo > 0 ? '×' + gd.combo : '—';
  comboWrapEl.classList.toggle('active', gd.combo >= 2);
}

let _fT, _vT;
function doFlash(color) {
  flashEl.style.background = color;
  flashEl.style.opacity = REDUCED_MOTION ? '0.45' : '1';
  clearTimeout(_fT); _fT = setTimeout(() => (flashEl.style.opacity = '0'), 180);
}
function showDmgVig() {
  dmgVig.style.opacity = REDUCED_MOTION ? '0.5' : '1';
  clearTimeout(_vT); _vT = setTimeout(() => (dmgVig.style.opacity = '0'), 420);
}

// Educational feedback line under the equation
let _fbT;
function showFeedback(text, ok) {
  feedbackEl.textContent = text;
  feedbackEl.classList.toggle('ok', ok);
  feedbackEl.classList.toggle('bad', !ok);
  feedbackEl.classList.add('show');
  clearTimeout(_fbT);
  // Keep the correction on screen through the transition; the next
  // wave hides it. Wrong-answer corrections linger a bit longer.
  _fbT = setTimeout(() => feedbackEl.classList.remove('show'), ok ? 900 : 1600);
}
function hideFeedback() {
  clearTimeout(_fbT);
  feedbackEl.classList.remove('show');
}

// Floating "+N" near the crosshair (gold when it carries a ⚡ bonus)
function scorePop(text, fast) {
  scorePopEl.textContent = text;
  scorePopEl.classList.toggle('fast', !!fast);
  scorePopEl.classList.remove('anim');
  void scorePopEl.offsetWidth;      // restart the CSS animation
  scorePopEl.classList.add('anim');
}

// Crosshair hit marker: green flash on correct, red on wrong
let _hmT;
function hitMark(ok) {
  xhair.classList.toggle('hit-ok', ok);
  xhair.classList.toggle('hit-bad', !ok);
  clearTimeout(_hmT);
  _hmT = setTimeout(() => {
    xhair.classList.remove('hit-ok');
    xhair.classList.remove('hit-bad');
  }, 180);
}

// Brief pulse on a stats value when it changes
function pulseStat(el) {
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

// ── Screen buttons ────────────────────────────────────────────────
document.querySelectorAll('button:not(#aim-stick):not(#fire-btn)').forEach(btn => {
  btn.addEventListener('click', () => audio.ui());
});
$('start-btn').addEventListener('click', e => {
  e.preventDefault();
  if (mobilePortrait) return;
  startScreen.style.opacity = '0';
  setTimeout(() => { startScreen.style.display = 'none'; }, 450);
  startGame();
});
$('retry-btn').addEventListener('click', e => {
  e.preventDefault();
  startGame();
});
$('resume-btn').addEventListener('click', e => {
  e.preventDefault();
  goResume();
});
$('pause-restart-btn').addEventListener('click', e => {
  e.preventDefault();
  startGame();
});
$('pause-menu-btn').addEventListener('click', e => {
  e.preventDefault();
  goMainMenu();
});
$('back-btn').addEventListener('click', e => {
  e.preventDefault();
  goMainMenu();
});
document.querySelectorAll('.exit-game').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.exitPointerLock?.();
    window.dispatchEvent(new CustomEvent('solve-and-shoot:exit'));
  });
});
