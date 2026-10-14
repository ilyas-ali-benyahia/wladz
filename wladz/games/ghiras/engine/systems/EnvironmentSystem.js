import * as THREE from 'three';

export class EnvironmentSystem {
  constructor(engine, worldBuilder) {
    this.engine = engine;
    this.worldBuilder = worldBuilder;

    // Times: 0 = morning, 1 = noon, 2 = sunset, 3 = night
    this.timeOfDay = 1; // Start at vibrant sunny noon
    this.cycleSpeed = 0.015; // Slow natural progression
    this.isCyclePaused = false;

    this.states = [
      {
        name: 'الصباح الباكر',
        skyColor: 0x90caf9,
        sunColor: 0xffe082,
        sunIntensity: 1.2,
        sunPos: new THREE.Vector3(60, 35, -40),
        ambientColor: 0xffecb3,
        ambientIntensity: 0.18,
        envIntensity: 0.65,
        hemiSky: 0xbbdefb,
        hemiGround: 0x558a38,
        streetLightsOn: false
      },
      {
        name: 'الظهيرة المشرقة',
        skyColor: 0x64b5f6,
        sunColor: 0xffffff,
        sunIntensity: 1.45,
        sunPos: new THREE.Vector3(25, 75, 25),
        ambientColor: 0xfffaea,
        ambientIntensity: 0.2,
        envIntensity: 0.75,
        hemiSky: 0x8cd3ff,
        hemiGround: 0x4d7c38,
        streetLightsOn: false
      },
      {
        name: 'الغروب الذهبي',
        skyColor: 0xe67e22,
        sunColor: 0xff7043,
        sunIntensity: 1.1,
        sunPos: new THREE.Vector3(-65, 18, 45),
        ambientColor: 0xffab91,
        ambientIntensity: 0.18,
        envIntensity: 0.55,
        hemiSky: 0xf39c12,
        hemiGround: 0x422f28,
        streetLightsOn: true
      },
      {
        name: 'الليل الهادئ',
        skyColor: 0x0a192f,
        sunColor: 0x80d8ff,
        sunIntensity: 0.35,
        sunPos: new THREE.Vector3(-30, 45, -30), // Moon
        ambientColor: 0x1e3a5f,
        ambientIntensity: 0.22,
        envIntensity: 0.25,
        hemiSky: 0x0f2744,
        hemiGround: 0x091420,
        streetLightsOn: true
      }
    ];

    this.applyState(this.states[this.timeOfDay]);
  }

  setTimeOfDay(idx) {
    this.timeOfDay = idx % this.states.length;
    this.applyState(this.states[this.timeOfDay]);
  }

  nextTimeOfDay() {
    this.setTimeOfDay(this.timeOfDay + 1);
    return this.states[this.timeOfDay].name;
  }

  applyState(state) {
    const scene = this.engine.scene;

    // Sky & Fog
    scene.background = new THREE.Color(state.skyColor);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(state.skyColor);
    }

    // Sun / Directional Light
    if (this.engine.sunLight) {
      this.engine.sunLight.color = new THREE.Color(state.sunColor);
      this.engine.sunLight.intensity = state.sunIntensity;
      if (this.engine.sunOffset) this.engine.sunOffset.copy(state.sunPos);
      else this.engine.sunLight.position.copy(state.sunPos);
    }

    // Ambient & Hemisphere
    if (this.engine.ambientLight) {
      this.engine.ambientLight.color = new THREE.Color(state.ambientColor);
      this.engine.ambientLight.intensity = state.ambientIntensity;
    }

    if (this.engine.hemiLight) {
      this.engine.hemiLight.color = new THREE.Color(state.hemiSky);
      this.engine.hemiLight.groundColor = new THREE.Color(state.hemiGround);
    }

    // Soft sky-based ambient (IBL) matching the time of day
    if (this.engine.setSkyEnvironment) {
      this.engine.setSkyEnvironment(state.hemiSky, state.hemiGround, state.envIntensity);
    }

    // Street Lights
    if (this.worldBuilder && this.worldBuilder.streetLights) {
      this.worldBuilder.streetLights.forEach(light => {
        light.intensity = state.streetLightsOn ? 1.0 : 0.0;
      });
    }
  }

  update(dt) {
    // Optional slow real-time day night cycle
    // Keeps performance high and steady
  }
}
