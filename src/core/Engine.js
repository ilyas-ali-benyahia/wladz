import * as THREE from 'three';
import { upgradeMaterials } from './MaterialUpgrader.js';

export class Engine {
  constructor(canvasId = 'game-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;

    this.updatables = [];
    this.isRunning = false;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8cd3ff);
    this.scene.fog = new THREE.FogExp2(0x8cd3ff, 0.0075);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.25, // Higher near plane = far better depth precision (no road/decal flicker)
      400
    );
    this.camera.position.set(0, 5, 12);

    // 3. Renderer with soft shadows and filmic tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.94;
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTarget = null;

    // 4. Lighting (sky environment / IBL now provides most of the ambient fill)
    this.ambientLight = new THREE.AmbientLight(0xfffaea, 0.2);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x8cd3ff, 0x4d7c38, 0.25);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3d1, 1.4);
    this.sunLight.position.set(45, 70, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 220;
    // Tighter frustum that follows the camera: ~2x sharper shadows at the same cost
    const shadowDist = 42;
    this.sunLight.shadow.camera.left = -shadowDist;
    this.sunLight.shadow.camera.right = shadowDist;
    this.sunLight.shadow.camera.top = shadowDist;
    this.sunLight.shadow.camera.bottom = -shadowDist;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.03;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
    this.sunOffset = this.sunLight.position.clone();
    this.shadowFocus = new THREE.Vector3();
    this.shadowTexel = (shadowDist * 2) / 2048;

    this.setSkyEnvironment(0x8cd3ff, 0x6b7f4a, 0.7);
    this.materialTimer = 0;

    // 5. Clock
    this.clock = new THREE.Clock();

    // 6. Window resize listener
    window.addEventListener('resize', () => this.onResize());
  }

  /** Builds a soft sky/ground gradient environment map for image-based ambient light */
  setSkyEnvironment(skyHex, groundHex, intensity = 0.7) {
    const envScene = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 32, 16);
    // Keep the ambient fairly neutral/warm so skin and paint don't turn grey-blue
    const sky = new THREE.Color(skyHex).lerp(new THREE.Color(0xffffff), 0.45);
    const ground = new THREE.Color(groundHex).lerp(new THREE.Color(0xb59a7a), 0.4);
    const horizon = sky.clone().lerp(new THREE.Color(0xfff1dc), 0.6);
    const colors = [];
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 10;
      if (y >= 0) c.copy(horizon).lerp(sky, Math.pow(y, 0.6));
      else c.copy(horizon).lerp(ground, Math.min(1, -y * 3));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    envScene.add(new THREE.Mesh(geo, mat));

    if (this.envTarget) this.envTarget.dispose();
    this.envTarget = this.pmrem.fromScene(envScene, 0.04);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = intensity;
    geo.dispose();
    mat.dispose();
  }

  updateShadowFocus() {
    // Follow the camera, snapped to shadow texels so shadow edges don't shimmer
    const cam = this.camera.position;
    const t = this.shadowTexel;
    this.shadowFocus.set(Math.round(cam.x / t) * t, 0, Math.round(cam.z / t) * t);
    this.sunLight.target.position.copy(this.shadowFocus);
    this.sunLight.position.copy(this.shadowFocus).add(this.sunOffset);
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addUpdatable(obj) {
    this.updatables.push(obj);
  }

  removeUpdatable(obj) {
    const idx = this.updatables.indexOf(obj);
    if (idx !== -1) this.updatables.splice(idx, 1);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.loop);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    for (let i = 0; i < this.updatables.length; i++) {
      try {
        this.updatables[i].update(dt, elapsed);
      } catch (err) {
        console.error('Error in updatable:', err);
      }
    }

    // Upgrade newly spawned legacy materials to PBR (cheap, throttled)
    this.materialTimer -= dt;
    if (this.materialTimer <= 0) {
      this.materialTimer = 1.5;
      upgradeMaterials(this.scene);
    }
    this.updateShadowFocus();

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.error('Error in renderer:', err);
    }
  };
}
