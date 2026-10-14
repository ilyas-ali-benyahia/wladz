import * as THREE from 'three';
import { Character3D } from './Character3D.js';
import { buildMosque } from './MosqueEnvironment.js';
import { disposeTree } from './resources.js';

export class SceneManager {
  constructor(container, options = {}) {
    this.container = container; this.destroyed = false; this.frameId = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.coarse = window.matchMedia('(pointer: coarse)').matches;
    this.maxPixelRatio = this.coarse ? 1.25 : 1.5;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0xe8deca);
    this.scene.fog = new THREE.Fog(0xe8deca, 8, 22);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.08, 35);
    this.view = 'front'; this.target = new THREE.Vector3(0, 1.10, 0.08);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.autoUpdate = false; this.renderer.shadowMap.needsUpdate = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'محاكاة الصلاة ثلاثية الأبعاد');
    this.renderer.domElement.setAttribute('role', 'img');
    this.container.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xfff7e7, 0x938b6e, 2.0));
    this.sun = new THREE.DirectionalLight(0xffe5bb, 3.1);
    this.sun.position.set(-3.5, 6, 4); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.coarse ? 512 : 1024, this.coarse ? 512 : 1024);
    Object.assign(this.sun.shadow.camera, { left: -2.4, right: 2.4, top: 3.2, bottom: -2, near: 0.5, far: 14 });
    this.sun.shadow.normalBias = 0.025; this.sun.shadow.bias = -0.0002;
    this.scene.add(this.sun);
    const fill = new THREE.DirectionalLight(0xe9f3ff, 0.8); fill.position.set(3, 3, 2); this.scene.add(fill);
    try {
      this.environment = buildMosque(this.scene);
      this.character = new Character3D(this.scene, { ...options, reducedMotion: this.reducedMotion.matches });
    } catch (error) {
      disposeTree(this.scene); this.scene.clear();
      this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
      throw error;
    }
    this.dirty = true;
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container);
    this.onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(this.frameId); this.frameId = null; }
      else if (!this.destroyed && !this.frameId) { this.last = performance.now(); this.frameId = requestAnimationFrame(this.tick); }
    };
    this.onMotion = () => { this.character.reducedMotion = this.reducedMotion.matches; this.dirty = true; };
    this.onContextLost = event => { event.preventDefault(); this.container.dataset.contextLost = 'true'; };
    this.onContextRestored = () => { delete this.container.dataset.contextLost; this.dirty = true; this.renderer.shadowMap.needsUpdate = true; };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.reducedMotion.addEventListener('change', this.onMotion);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);
    this.elapsed = 0; this.last = performance.now(); this.lastRender = 0; this.slowFrames = 0;
    this.tick = now => {
      if (this.destroyed) return;
      this.frameId = requestAnimationFrame(this.tick);
      const frameInterval = this.coarse ? 1000 / 30 : 1000 / 40;
      if (now - this.lastRender < frameInterval) return;
      if (this.container.dataset.contextLost) return;
      if (this.reducedMotion.matches && !this.dirty && !this.character.animator.busy) { this.last = now; return; }
      const moving = this.character.animator.busy;
      const delta = Math.min((now - this.last) / 1000, 0.1); this.last = now;
      this.lastRender = now; this.elapsed += delta;
      // An idle mascot between blinks draws nothing new: skip the frame instead of re-rendering it.
      if (!this.character.update(delta, this.elapsed) && !this.dirty) return;
      if (moving || this.dirty) this.renderer.shadowMap.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    };
    this.resize(); this.frameId = requestAnimationFrame(this.tick);
  }
  resize() {
    if (this.destroyed) return;
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
    this.renderer.setSize(w, h); this.setView(this.view);
  }
  setView(view) {
    this.view = view; this.dirty = true;
    // Keep both cameras inside the cutaway walls, including tall desktop windows.
    // Widen the lens when narrow instead of moving through the qibla wall.
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(38 / 2)) * Math.max(1, 0.7 / this.camera.aspect)));
    this.camera.updateProjectionMatrix();
    // Side camera sits between the x=2.7 pillars (z=-2.7 / 1.7); the old [4.3, 2.3, 2.5]
    // looked straight through the z=1.7 pillar and hid the mascot in every pose.
    const position = view === 'side' ? [4.4, 2.0, 0.8] : [1.1, 2.35, 5.1];
    this.camera.position.fromArray(position); this.camera.lookAt(this.target);
  }
  setCharacterPose(pose, duration = 1.15) { this.dirty = true; return this.character.transitionTo(pose, duration); }
  setCharacter(gender) { this.character.setGender(gender); this.dirty = true; }
  setPractice(settings) { this.dirty = true; return this.character.setSettings(settings); }
  getDiagnostics() {
    const info = this.renderer.info;
    return { action: this.character.animator.action, animating: this.character.animator.busy, gender: this.character.gender,
      calls: info.render.calls, triangles: info.render.triangles, geometries: info.memory.geometries,
      textures: info.memory.textures, pixelRatio: this.renderer.getPixelRatio(), canvasCount: this.container.querySelectorAll('canvas').length };
  }
  destroy() {
    if (this.destroyed) return; this.destroyed = true;
    cancelAnimationFrame(this.frameId); this.frameId = null;
    this.resizeObserver.disconnect(); document.removeEventListener('visibilitychange', this.onVisibility);
    this.reducedMotion.removeEventListener('change', this.onMotion);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.character.destroy(); disposeTree(this.environment); this.scene.clear();
    this.sun.shadow.map?.dispose(); this.renderer.renderLists.dispose(); this.renderer.dispose();
    this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
