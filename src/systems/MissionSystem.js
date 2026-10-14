import * as THREE from 'three';
import missionsData from '../data/missions.json';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export const MissionStatus = {
  NOT_STARTED: 'لم تبدأ',
  AWAITING: 'بانتظار الاستلام',
  IN_PROGRESS: 'جارية',
  NEED_INFO: 'تحتاج لمعلومات إضافية',
  COMPLETED: 'اكتملت',
  FAILED: 'فشلت'
};

const PRESIDENT_ID = 'npc_volunteer_president';
const AUTO_ADVANCE_MS = 2600;
const BAG_CAPACITY = 4;
const KEY_HINT = '<b>F</b> (أو زر الفأرة الأيسر)';

// Recycling stations on the sidewalks around the central plaza [x, z, rotY]
const BIN_SPOTS = [[24, 7.6, Math.PI], [-20, -7.6, 0], [-7.6, 24, Math.PI / 2], [7.6, -24, -Math.PI / 2]];

// Mission types whose objectives are physical things in the world (progress restarts with them on load)
const SPATIAL_TYPES = new Set(['collect_trash', 'collect_items', 'plant_trees', 'water_trees', 'extinguish_fire', 'fire_emergency', 'deliver', 'escort_elderly']);

// ─────────────────────────────────────────────────────────────
// Soft procedural textures for fire, smoke and scorch marks
// ─────────────────────────────────────────────────────────────
function radialTexture(stops, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let FX = null;
function fxTextures() {
  if (FX) return FX;
  FX = {
    flame: radialTexture([[0, 'rgba(255,255,235,1)'], [0.25, 'rgba(255,225,150,0.95)'], [0.55, 'rgba(255,130,40,0.45)'], [1, 'rgba(255,60,0,0)']]),
    smoke: radialTexture([[0, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]),
    glow: radialTexture([[0, 'rgba(255,170,60,0.9)'], [0.4, 'rgba(255,110,30,0.35)'], [1, 'rgba(255,60,0,0)']]),
    scorch: radialTexture([[0, 'rgba(18,14,12,0.85)'], [0.6, 'rgba(28,22,18,0.45)'], [1, 'rgba(28,22,18,0)']])
  };
  return FX;
}

// Road layout helpers (roads at 0 and ±42, roundabout r 9.5, zebra crossings at ±16)
function onRoad(x, z) {
  if (Math.hypot(x, z) < 9.7) return true;
  if (Math.abs(z) < 4.1 || Math.abs(x) < 4.1) return Math.abs(x) < 82 && Math.abs(z) < 82;
  return Math.abs(Math.abs(z) - 42) < 3.6 || Math.abs(Math.abs(x) - 42) < 3.6;
}

/** Zebra crossing under (x, z): { cars: 'EW' | 'NS', central } or null */
function crosswalkAt(x, z) {
  for (const r of [0, 42, -42]) {
    const hw = r === 0 ? 4.6 : 4.1;
    if (Math.abs(z - r) < hw && Math.abs(Math.abs(x) - 16) < 1.8) return { cars: 'EW', central: r === 0 };
    if (Math.abs(x - r) < hw && Math.abs(Math.abs(z) - 16) < 1.8) return { cars: 'NS', central: r === 0 };
  }
  return null;
}

export class MissionSystem {
  constructor(engine, worldBuilder, progression, playerController) {
    this.engine = engine;
    this.worldBuilder = worldBuilder;
    this.progression = progression;
    this.player = playerController;

    this.currentMissionIndex = 0;
    this.currentProgress = 0;
    this.missionStatus = MissionStatus.NOT_STARTED;

    // Dynamic objectives (litter, fires, pickups, markers) for the current mission
    this.activeSide = null; // repeatable association mission running after the story
    this.accepted = false;
    this.stage = 0;
    this.dynamic = [];
    this.readPOIs = new Set();
    this.advanceTimer = null;
    this.bag = 0;
    this.actionProgress = 0;
    this.growing = [];
    this.lastHint = null;
    this.toastTimes = {};

    // Lookups provided by the game (NPC positions, landmark doors, interior state, traffic lights, HUD hint)
    this.npcLookup = () => null;
    this.doorLookup = () => null;
    this.isInside = () => false;
    this.lightPhase = () => 'NS_GREEN';
    this.setHint = () => {};
    this.npcSystem = null;

    this.initMissions();
  }

  initMissions() {
    this.createObjectiveBeacon();
    this.createSprayPool();
    this.createRecyclingStations();
    this.fireLight = new THREE.PointLight(0xff8a3d, 0, 16, 2);
    this.fireLight.castShadow = false;
    this.engine.scene.add(this.fireLight); // always present (intensity 0) so materials never recompile
    this.setupListeners();
    this.onMissionStarted(this.getCurrentMission());
  }

  setupListeners() {
    events.on('NPC_QUESTION_SOLVED', (npcData) => {
      this.checkNPCMissionProgress(npcData);
    });

    events.on('MISSION_BRANCH_COMPLETED', ({ missionId }) => {
      const cur = this.getCurrentMission();
      if (cur.id !== missionId) return;
      // Story dialogues that start a hands-on stage instead of finishing the mission
      if (cur.type === 'fire_emergency' || cur.type === 'escort_elderly') {
        if (this.stage === 0 && this.missionStatus === MissionStatus.IN_PROGRESS) {
          if (cur.type === 'fire_emergency') this.beginFireFight(cur);
          else this.beginEscort(cur);
        }
        return;
      }
      this.currentProgress = cur.target;
      this.missionStatus = MissionStatus.COMPLETED;
      this.completeCurrentMission();
    });

    events.on('STORY_ACTION_TRIGGERED', ({ action }) => {
      if (action === 'RECKLESS_UNDERCOVER') {
        this.missionStatus = MissionStatus.FAILED;
        events.emit('MISSION_FAILED', {
          mission: this.getCurrentMission(),
          reason: 'لقد كشفك المشتبه به! التظاهر بالطلب يعرضك للخطر والقانون يحذر منه. التحقيق من اختصاص الشرطة.'
        });
      } else if (action === 'GO_TO_POLICE') {
        this.missionStatus = MissionStatus.NEED_INFO;
      }
    });

    // Interior missions (museum visit / reading exhibits)
    events.on('INTERIOR_POI_READ', ({ id, title }) => {
      const m = this.getCurrentMission();
      if (m.type !== 'read_info' || m.building !== id || this.missionStatus !== MissionStatus.IN_PROGRESS) return;
      if (this.readPOIs.has(title)) return;
      this.readPOIs.add(title);
      this.currentProgress = this.readPOIs.size;
      this.progression.addXP(10);
      this.emitUpdate();
      if (this.currentProgress >= m.target) this.completeCurrentMission();
    });
  }

  getCurrentMission() {
    if (this.activeSide) return this.activeSide;
    const list = missionsData.missions;
    return list[Math.min(this.currentMissionIndex, list.length - 1)];
  }

  /** HUD objective text for the current stage of the mission */
  getObjectiveText(m) {
    if (this.missionStatus === MissionStatus.AWAITING) {
      return 'توجّه إلى مقر «جمعية شباب التطوع» قرب ساحة الاستقلال وتحدّث مع السيدة سميرة لاستلام المهمة.';
    }
    if (m.type === 'deliver') {
      return this.stage === 0 ? `استلم ${m.pickup.label}.` : `أوصل ${m.carryLabel} إلى ${m.dropoff.label}.`;
    }
    if (m.type === 'fire_emergency') {
      if (this.stage === 0) return '🔥 حريق قرب المخبزة! أسرع إلى رجل الإطفاء عمر أمام مركز الحماية المدنية لتأخذ المطفأة.';
      const left = this.dynamic.filter(d => d.kind === 'fire' && !d.done).length;
      return `🧯 أطفئ كل النيران قرب المخبزة قبل أن تنتشر (${left} متبقية). اضغط مطولاً على F للرش.`;
    }
    if (m.type === 'escort_elderly' && this.stage === 1) {
      return '🚶 قُد عمي قدور إلى الرصيف المقابل عبر ممر الراجلين (الخطوط البيضاء). انتظر توقف السيارات قبل العبور.';
    }
    let text = (m.description || '').replace('{n}', m.target);
    if ((m.type === 'collect_trash' || m.type === 'collect_items') && this.bag > 0) {
      text += ` — 🗑️ في الكيس: ${this.bag}/${BAG_CAPACITY}`;
    }
    return text;
  }

  emitUpdate() {
    const mission = this.getCurrentMission();
    events.emit('MISSION_UPDATED', {
      mission: { ...mission, description: this.getObjectiveText(mission) },
      progress: this.currentProgress,
      target: mission.target,
      status: this.missionStatus
    });
  }

  toastOnce(key, text, seconds = 4) {
    const now = performance.now();
    if (this.toastTimes[key] && now - this.toastTimes[key] < seconds * 1000) return;
    this.toastTimes[key] = now;
    events.emit('TOAST', text);
  }

  showHint(html) {
    if (html === this.lastHint) return;
    this.lastHint = html;
    this.setHint(html);
  }

  groundAt(x, z) {
    const cs = this.worldBuilder.collisionSystem;
    return cs && cs.getGroundHeight ? cs.getGroundHeight(x, z) : 0;
  }

  // ─────────────────────────────────────────────────────────────
  // Recycling stations (where collected litter is sorted)
  // ─────────────────────────────────────────────────────────────
  createRecyclingStations() {
    this.bins = [];
    const cols = [[0x2e7d32, 'زجاج'], [0xf9a825, 'بلاستيك'], [0x1565c0, 'ورق']];
    BIN_SPOTS.forEach(([x, z, rot]) => {
      const g = new THREE.Group();
      g.position.set(x, this.groundAt(x, z), z);
      g.rotation.y = rot;
      const lids = [];
      cols.forEach(([c], i) => {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.86, 0.52), new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }));
        body.position.set((i - 1) * 0.6, 0.43, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        g.add(body);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.56), new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6 }));
        lid.position.set((i - 1) * 0.6, 0.89, 0);
        g.add(lid);
        lids.push(lid);
        const label = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        label.position.set((i - 1) * 0.6, 0.55, 0.265);
        g.add(label);
        const arrow = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.11, 3), new THREE.MeshBasicMaterial({ color: c }));
        arrow.position.set((i - 1) * 0.6, 0.55, 0.27);
        g.add(arrow);
      });
      this.engine.scene.add(g);
      const cs = this.worldBuilder.collisionSystem;
      if (cs) {
        const hx = Math.abs(Math.cos(rot)) > 0.5 ? 0.95 : 0.32;
        const hz = Math.abs(Math.cos(rot)) > 0.5 ? 0.32 : 0.95;
        cs.addBox(x - hx, z - hz, x + hx, z + hz, 1.0);
      }
      this.bins.push({ pos: new THREE.Vector3(x, 0, z), group: g, lids, bounce: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Objective beacon (tall light pillar guiding the player)
  // ─────────────────────────────────────────────────────────────
  createObjectiveBeacon() {
    const g = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 40, 20, 1, true), beamMat);
    beam.position.y = 20;
    g.add(beam);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.15, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.25;
    g.add(ring);
    g.visible = false;
    g.traverse(m => { m.castShadow = false; m.receiveShadow = false; });
    this.engine.scene.add(g);
    this.beacon = g;
    this.beaconBeam = beamMat;
  }

  nearestBin(p) {
    let best = null, bd = Infinity;
    this.bins.forEach(b => { const d = Math.hypot(b.pos.x - p.x, b.pos.z - p.z); if (d < bd) { bd = d; best = b; } });
    return { bin: best, dist: bd };
  }

  getObjectivePosition(m, playerPos) {
    const nearest = (list) => {
      let best = null, bd = Infinity;
      list.forEach(p => { const d = p.distanceTo(playerPos); if (d < bd) { bd = d; best = p; } });
      return best;
    };
    const door = (id) => { const d = this.doorLookup(id); return d ? new THREE.Vector3(d[0], 0, d[1]) : null; };

    if (this.missionStatus === MissionStatus.COMPLETED) return null;
    if (this.missionStatus === MissionStatus.AWAITING) return this.npcLookup(PRESIDENT_ID) || door('association');

    switch (m.type) {
      case 'collect_trash':
      case 'collect_items': {
        const left = this.dynamic.filter(d => d.kind === 'item' && !d.done).map(d => d.obj.position);
        if (this.bag >= BAG_CAPACITY || (this.bag > 0 && left.length === 0)) return this.nearestBin(playerPos).bin.pos;
        return nearest(left);
      }
      case 'plant_trees':
        return nearest(this.worldBuilder.plantSpots.filter(s => !s.isPlanted).map(s => s.position));
      case 'water_trees':
        if (this.progression.water <= 0 && this.worldBuilder.fountains.length) {
          const f = this.worldBuilder.fountains[0];
          return new THREE.Vector3(f.x, 0, f.z);
        }
        return nearest(this.worldBuilder.plantSpots.filter(s => s.isPlanted && !s.isWatered).map(s => s.position));
      case 'extinguish_fire':
        return nearest(this.dynamic.filter(d => d.kind === 'fire' && !d.done).map(d => d.obj.position));
      case 'fire_emergency':
        return this.stage === 0 ? this.npcLookup(m.targetNPC)
          : nearest(this.dynamic.filter(d => d.kind === 'fire' && !d.done).map(d => d.obj.position));
      case 'escort_elderly':
        return this.stage === 0 ? this.npcLookup(m.targetNPC) : new THREE.Vector3(m.destination.x, 0, m.destination.z);
      case 'deliver':
        return this.stage === 0 ? new THREE.Vector3(m.pickup.x, 0, m.pickup.z) : this.getDropoffPos(m);
      case 'read_info':
        return this.isInside() ? null : door(m.building);
      case 'free_play':
        return this.npcLookup(PRESIDENT_ID); // repeatable volunteering missions
      default:
        return m.targetNPC ? this.npcLookup(m.targetNPC) : null;
    }
  }

  getDropoffPos(m) {
    if (m.dropoff.npc) return this.npcLookup(m.dropoff.npc);
    return new THREE.Vector3(m.dropoff.x, 0, m.dropoff.z);
  }

  updateBeacon(dt, playerPos) {
    const target = this.getObjectivePosition(this.getCurrentMission(), playerPos);
    const show = !!target && (!this.isInside() || target.x > 300) && target.distanceTo(playerPos) > 2.2;
    this.beacon.visible = show;
    if (show) {
      this.beacon.position.set(target.x, target.y || 0, target.z);
      this.beaconBeam.opacity = 0.2 + Math.sin(Date.now() * 0.004) * 0.08;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Mission setup
  // ─────────────────────────────────────────────────────────────
  clearDynamic() {
    this.dynamic.forEach(d => { if (d.obj.parent) d.obj.parent.remove(d.obj); });
    this.dynamic = [];
    this.setCarry(null);
    this.readPOIs.clear();
    this.stage = 0;
    this.bag = 0;
    this.actionProgress = 0;
    this.stopEscort();
  }

  /** Targets always match what really exists in the world (all litter, every soil bed, every fire) */
  resolveTarget(m) {
    if (m.type === 'collect_trash' || m.type === 'collect_items') m.target = m.items.length;
    else if (m.type === 'plant_trees' || m.type === 'water_trees') m.target = this.worldBuilder.plantSpots.length;
    else if (m.type === 'extinguish_fire' || m.type === 'fire_emergency') m.target = m.fires.length;
  }

  onMissionStarted(m) {
    clearTimeout(this.advanceTimer);
    this.clearDynamic();
    this.resolveTarget(m);
    this.accepted = m.giver !== 'association';
    this.missionStatus = this.accepted ? MissionStatus.IN_PROGRESS : MissionStatus.AWAITING;
    if (this.accepted) this.spawnObjectives(m);
    this.emitUpdate();
  }

  acceptMission() {
    const m = this.getCurrentMission();
    this.accepted = true;
    this.missionStatus = MissionStatus.IN_PROGRESS;
    this.spawnObjectives(m);
    audio.playClick();
    events.emit('TOAST', `🤝 استلمت المهمة: ${m.title}`);
    if (m.startMessage) setTimeout(() => events.emit('TOAST', m.startMessage), 1800);
    this.emitUpdate();
  }

  spawnObjectives(m) {
    const scene = this.engine.scene;
    if (m.type === 'collect_items' || m.type === 'collect_trash') {
      m.items.forEach(([x, z], i) => {
        const obj = this.makeLitter(i);
        obj.position.set(x, this.groundAt(x, z), z);
        obj.rotation.y = i * 1.7;
        scene.add(obj);
        this.dynamic.push({ kind: 'item', obj, done: false });
      });
    } else if (m.type === 'extinguish_fire' || m.type === 'fire_emergency') {
      m.fires.forEach(([x, z], i) => this.spawnFire(x, z, m.type === 'fire_emergency' && i === 0));
      if (m.type === 'extinguish_fire') this.setCarry('extinguisher');
    } else if (m.type === 'deliver') {
      const obj = this.makeCarryItem(m.carryStyle);
      obj.position.set(m.pickup.x, this.groundAt(m.pickup.x, m.pickup.z) + 0.2, m.pickup.z);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 32), new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.17;
      obj.add(ring);
      scene.add(obj);
      this.dynamic.push({ kind: 'pickup', obj, done: false });
    } else if (m.type === 'water_trees') {
      // Loaded straight into the watering mission: make sure every bed has its sapling
      this.worldBuilder.plantSpots.forEach(s => { if (!s.isPlanted) this.plantTree(s, true); });
    }
  }

  spawnFire(x, z, dumpster = false) {
    const obj = this.makeFire(1, dumpster);
    obj.position.set(x, this.groundAt(x, z), z);
    this.engine.scene.add(obj);
    const d = { kind: 'fire', obj, done: false, health: 1, hot: 0, steam: 0 };
    this.dynamic.push(d);
    return d;
  }

  // ─────────────────────────────────────────────────────────────
  // Prop builders
  // ─────────────────────────────────────────────────────────────
  makeLitter(i) {
    const g = new THREE.Group();
    const kind = i % 4;
    if (kind === 0) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 10), new THREE.MeshStandardMaterial({ color: [0x5dade2, 0x58d68d, 0xf5b041][i % 3], roughness: 0.3, transparent: true, opacity: 0.85 }));
      bottle.rotation.z = Math.PI / 2;
      bottle.position.set(0.08, 0.07, 0);
      g.add(bottle);
      const paper = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9 }));
      paper.position.set(-0.12, 0.09, 0.08);
      g.add(paper);
    } else if (kind === 1) {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.35, metalness: 0.6 }));
      can.rotation.set(Math.PI / 2, 0, 0.4);
      can.position.y = 0.05;
      g.add(can);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.16), new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.95 }));
      box.position.set(-0.14, 0.04, 0.05);
      box.rotation.y = 0.5;
      g.add(box);
    } else if (kind === 2) {
      const bag = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xeceff1, roughness: 0.5 }));
      bag.scale.set(1, 0.7, 1.2);
      bag.position.y = 0.1;
      g.add(bag);
    } else {
      [0, 1, 2].forEach(k => {
        const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + k * 0.015, 0), new THREE.MeshStandardMaterial({ color: k === 1 ? 0xfff3c4 : 0xf4f1ea, roughness: 0.9 }));
        p.position.set((k - 1) * 0.14, 0.06, (k % 2) * 0.1);
        g.add(p);
      });
    }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 28), new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    g.add(ring);
    g.userData.ring = ring;
    return g;
  }

  makeFire(size = 1, dumpster = false) {
    const T = fxTextures();
    const g = new THREE.Group();
    const std = (c, r = 0.9) => new THREE.MeshStandardMaterial({ color: c, roughness: r });

    if (dumpster) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.0), std(0x2e5e34, 0.7));
      body.position.y = 0.5;
      body.castShadow = true;
      g.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.06, 0.6), std(0x1b3d20, 0.7));
      lid.position.set(0, 1.18, -0.62);
      lid.rotation.x = -1.2;
      g.add(lid);
      [-0.6, 0.6].forEach(x => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10), std(0x212121));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.09, 0.4);
        g.add(wheel);
      });
    } else {
      // Burning debris: charred crates and cardboard
      [[0, 0, 0.5, 0.3], [0.35, 0.2, 0.4, -0.4], [-0.3, -0.25, 0.35, 1.1]].forEach(([x, z, s, r]) => {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.6, s), std(0x3e2a20));
        crate.position.set(x, s * 0.3, z);
        crate.rotation.y = r;
        crate.castShadow = true;
        g.add(crate);
      });
    }
    const baseY = dumpster ? 0.95 : 0.25;

    const scorch = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4 * size, 3.4 * size),
      new THREE.MeshBasicMaterial({ map: T.scorch, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
    );
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.y = 0.02;
    g.add(scorch);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(5 * size, 5 * size),
      new THREE.MeshBasicMaterial({ map: T.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.03;
    g.add(glow);

    const flames = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.flame, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.userData = { t: i / 12, rate: 1.2 + Math.random() * 0.8, ox: 0, oz: 0, w: 0 };
      this.resetFlame(s, size, dumpster);
      g.add(s);
      flames.push(s);
    }
    const smoke = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.smoke, color: 0x3c3c3c, depthWrite: false, transparent: true, opacity: 0 }));
      s.userData = { t: i / 7, drift: Math.random() * 6 };
      g.add(s);
      smoke.push(s);
    }
    g.userData = { flames, smoke, glow, baseY, size, dumpster };
    return g;
  }

  resetFlame(s, size, dumpster) {
    const q = s.userData;
    const spread = dumpster ? 1.2 : 0.9;
    q.ox = (Math.random() - 0.5) * spread * size;
    q.oz = (Math.random() - 0.5) * (dumpster ? 0.7 : 0.9) * size;
    q.w = (0.55 + Math.random() * 0.5) * size;
  }

  /** Rising flame tongues, glow flicker and smoke / steam columns */
  animateFire(d, dt) {
    const u = d.obj.userData;
    const h = d.health;
    u.flames.forEach(s => {
      const q = s.userData;
      q.t += dt * q.rate;
      if (q.t > 1) { q.t -= 1; this.resetFlame(s, u.size, u.dumpster); }
      const t = q.t;
      s.visible = h > 0.02;
      if (!s.visible) return;
      s.position.set(q.ox * (1 - t * 0.7), u.baseY + t * 1.8 * u.size * (0.45 + h * 0.55), q.oz * (1 - t * 0.7));
      const w = q.w * (1 - t * 0.7) * (0.35 + 0.65 * h);
      s.scale.set(w, w * 1.7, 1);
      s.material.color.setRGB(1, 0.78 - t * 0.5, 0.4 - t * 0.35);
      s.material.opacity = Math.min(1, (1 - t) * 1.6) * Math.min(1, h * 1.6);
    });
    u.glow.material.opacity = h * (0.75 + Math.random() * 0.25);
    u.glow.scale.setScalar(0.55 + 0.45 * h);

    if (d.steam > 0) d.steam -= dt;
    const steaming = d.done && d.steam > 0;
    u.smoke.forEach(s => {
      const q = s.userData;
      q.t = (q.t + dt * (steaming ? 0.35 : 0.22)) % 1;
      const t = q.t;
      s.position.set(Math.sin(q.drift + t * 3) * 0.4, u.baseY + 0.6 + t * 5.5 * u.size, Math.cos(q.drift + t * 2) * 0.3 + t * 0.8);
      s.scale.setScalar((1 + t * 3.2) * u.size);
      s.material.color.setHex(steaming ? 0xe8eef2 : 0x3c3c3c);
      const base = d.done ? (steaming ? 0.5 * (d.steam / 4) : 0) : 0.18 + 0.4 * h;
      s.material.opacity = base * Math.sin(t * Math.PI);
      s.visible = base > 0.01;
    });
  }

  makeCarryItem(style) {
    const g = new THREE.Group();
    const std = (c, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    if (style === 'basket') {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.26, 14), std(0xb9770e)));
      [[0x27ae60, -0.08], [0xe74c3c, 0.08], [0xf1c40f, 0]].forEach(([c, x], i) => {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), std(c, 0.5));
        f.position.set(x, 0.16, (i - 1) * 0.06);
        g.add(f);
      });
    } else if (style === 'cat') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), std(0x9e9e9e));
      body.scale.set(1, 0.8, 1.4);
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), std(0x9e9e9e));
      head.position.set(0, 0.1, 0.2);
      g.add(head);
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 4), std(0x9e9e9e));
        ear.position.set(s * 0.05, 0.2, 0.2);
        g.add(ear);
      });
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.5), std(0x5dade2));
      blanket.position.y = -0.12;
      g.add(blanket);
    } else if (style === 'books') {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.32), std(0xc8a165)));
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.22), std(0x1f618d));
      top.position.y = 0.18;
      g.add(top);
    } else if (style === 'water') {
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 10), new THREE.MeshStandardMaterial({ color: 0x85c1e9, roughness: 0.2, transparent: true, opacity: 0.85 }));
        b.position.set((i % 3 - 1) * 0.11, 0, Math.floor(i / 3) * 0.11 - 0.055);
        g.add(b);
      }
    } else if (style === 'extinguisher') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 14), std(0xd32f2f, 0.4));
      g.add(body);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8), std(0x212121));
      nozzle.position.set(0, 0.22, 0.04);
      nozzle.rotation.x = 0.6;
      g.add(nozzle);
    } else if (style === 'trashbag') {
      const bag = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), std(0x263238, 0.45));
      bag.scale.set(1, 1.25, 1);
      g.add(bag);
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 6), std(0x263238, 0.45));
      knot.position.y = 0.24;
      g.add(knot);
    }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    return g;
  }

  /** Item carried by the player (chest carry, or a trash bag in the right hand) */
  setCarry(style) {
    if (this.carryMesh) {
      this.carryMesh.parent && this.carryMesh.parent.remove(this.carryMesh);
      this.carryMesh = null;
    }
    this.carryStyle = style || null;
    if (this.player.model) this.player.model.carrying = !!style && style !== 'trashbag';
    if (!style) return;
    this.carryMesh = this.makeCarryItem(style);
    if (style === 'trashbag') this.carryMesh.position.set(-0.3, 0.55, 0.05);
    else this.carryMesh.position.set(0.0, 1.0, 0.36);
    this.player.group.add(this.carryMesh);
  }

  createSprayPool() {
    this.spray = [];
    const geo = new THREE.SphereGeometry(0.08, 8, 6);
    for (let i = 0; i < 48; i++) {
      const p = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.75, depthWrite: false }));
      p.visible = false;
      p.userData = { life: 0, vel: new THREE.Vector3() };
      this.engine.scene.add(p);
      this.spray.push(p);
    }
    this.sprayCursor = 0;
  }

  emitSpray(from, to, color = 0xeaf6ff) {
    const p = this.spray[this.sprayCursor++ % this.spray.length];
    p.visible = true;
    p.material.color.setHex(color);
    p.position.copy(from);
    p.userData.life = 0.45;
    p.userData.vel.copy(to).sub(from).multiplyScalar(2.2);
    p.userData.vel.x += (Math.random() - 0.5) * 0.8;
    p.userData.vel.y += Math.random() * 0.6;
    p.userData.vel.z += (Math.random() - 0.5) * 0.8;
  }

  handPos() {
    const h = this.player.heading;
    const p = this.player.position;
    return new THREE.Vector3(p.x + Math.sin(h) * 0.5, p.y + 1.05, p.z + Math.cos(h) * 0.5);
  }

  facePlayerTo(pos) {
    const p = this.player.position;
    this.player.heading = Math.atan2(pos.x - p.x, pos.z - p.z);
    this.player.group.rotation.y = this.player.heading;
  }

  // ─────────────────────────────────────────────────────────────
  // Per-frame update
  // ─────────────────────────────────────────────────────────────
  update(dt, playerPosition) {
    const mission = this.getCurrentMission();
    const elapsed = Date.now() * 0.002;

    if (this.missionStatus === MissionStatus.NOT_STARTED) {
      this.missionStatus = MissionStatus.IN_PROGRESS;
    }

    // Spray particles
    this.spray.forEach(p => {
      if (!p.visible) return;
      p.userData.life -= dt;
      p.position.addScaledVector(p.userData.vel, dt);
      p.userData.vel.y -= 4 * dt;
      p.scale.setScalar(1 + (0.45 - p.userData.life) * 3);
      p.material.opacity = Math.max(0, p.userData.life / 0.45) * 0.8;
      if (p.userData.life <= 0) p.visible = false;
    });

    this.updateGrowth(dt);
    this.updateBins(dt);
    this.updateFountainRefill(playerPosition);

    // Fires keep burning (and steaming after being put out) whatever the mission state
    const fires = this.dynamic.filter(d => d.kind === 'fire');
    fires.forEach(d => this.animateFire(d, dt));
    this.updateFireLight(fires, playerPosition, elapsed);

    this.updateBeacon(dt, playerPosition);
    if (this.missionStatus !== MissionStatus.IN_PROGRESS) { this.showHint(null); return; }

    let hint = null;
    switch (mission.type) {
      case 'collect_trash':
      case 'collect_items': hint = this.updateLitter(dt, playerPosition, elapsed, mission); break;
      case 'plant_trees': hint = this.updatePlanting(dt, playerPosition); break;
      case 'water_trees': hint = this.updateWatering(dt, playerPosition); break;
      case 'extinguish_fire':
      case 'fire_emergency': hint = this.updateFires(dt, playerPosition, mission); break;
      case 'deliver': this.updateDelivery(dt, playerPosition, mission); break;
      case 'escort_elderly': hint = this.updateEscort(dt, playerPosition, mission); break;
    }
    this.showHint(hint);
  }

  updateGrowth(dt) {
    this.growing = this.growing.filter(g => {
      g.t = Math.min(1, g.t + dt / g.dur);
      // Ease-out with a small overshoot: a sapling "pops" out of the soil
      const k = 1 + 2.2 * Math.pow(g.t - 1, 3) + 1.2 * Math.pow(g.t - 1, 2);
      g.obj.scale.setScalar(g.from + (g.to - g.from) * k);
      return g.t < 1;
    });
  }

  updateBins(dt) {
    this.bins.forEach(b => {
      if (b.bounce <= 0) return;
      b.bounce = Math.max(0, b.bounce - dt);
      const a = Math.sin((1 - b.bounce / 0.6) * Math.PI) * 0.18;
      b.lids.forEach(l => { l.position.y = 0.89 + a; });
    });
  }

  updateFountainRefill(p) {
    const near = this.worldBuilder.fountains.some(f => Math.hypot(f.x - p.x, f.z - p.z) < 4.8);
    if (near && !this.atFountain && this.progression.water < this.progression.maxWater) {
      this.progression.addWater(this.progression.maxWater);
      audio.playWaterTree();
      events.emit('FLOAT_TEXT', { position: p, text: '💧 امتلأ مرشّ الماء!', color: '#3498db' });
    }
    this.atFountain = near;
  }

  updateFireLight(fires, p, elapsed) {
    let best = null, bd = 40;
    fires.forEach(d => {
      if (d.done) return;
      const dist = d.obj.position.distanceTo(p);
      if (dist < bd) { bd = dist; best = d; }
    });
    if (!best) { this.fireLight.intensity = 0; return; }
    this.fireLight.position.set(best.obj.position.x, best.obj.position.y + 1.3, best.obj.position.z);
    this.fireLight.intensity = 30 * best.health * (0.8 + Math.sin(elapsed * 23) * 0.1 + Math.random() * 0.1);
  }

  // ─────────────────────────────────────────────────────────────
  // Litter: pick up into a bag, then sort it at a recycling station
  // ─────────────────────────────────────────────────────────────
  updateLitter(dt, p, elapsed, m) {
    let hint = null;
    this.dynamic.forEach(d => {
      if (d.kind !== 'item' || d.done) return;
      d.obj.userData.ring.material.opacity = 0.45 + Math.sin(elapsed * 3) * 0.25;
      if (Math.hypot(d.obj.position.x - p.x, d.obj.position.z - p.z) >= 1.5) return;
      if (this.bag >= BAG_CAPACITY) {
        hint = '🗑️ الكيس ممتلئ! أفرغه في أقرب حاوية فرز (اتبع العمود الأصفر).';
        return;
      }
      d.done = true;
      d.obj.visible = false;
      this.bag++;
      audio.playTrashCollect();
      this.player.triggerAction('pickup', 0.6);
      this.progression.addXP(5);
      events.emit('FLOAT_TEXT', { position: d.obj.position, text: `🗑️ في الكيس ${this.bag}/${BAG_CAPACITY}`, color: '#2ecc71' });
      if (this.carryStyle !== 'trashbag') this.setCarry('trashbag');
      if (this.bag >= BAG_CAPACITY) this.toastOnce('bagfull', '🗑️ امتلأ الكيس! ضعه في حاوية الفرز ثم أكمل التنظيف.');
      this.emitUpdate();
    });

    if (this.bag > 0) {
      const { bin, dist } = this.nearestBin(p);
      if (dist < 2.6) {
        const n = this.bag;
        this.bag = 0;
        this.currentProgress += n;
        bin.bounce = 0.6;
        this.setCarry(null);
        audio.playTrashCollect();
        this.player.triggerAction('pickup', 0.6);
        this.progression.addXP(10 * n);
        this.progression.addCoins(3 * n);
        events.emit('FLOAT_TEXT', { position: bin.pos, text: `♻️ فرزت ${n} قطع! +${10 * n} XP`, color: '#2ecc71' });
        this.emitUpdate();
        if (this.currentProgress >= m.target) {
          this.completeCurrentMission();
          return null;
        }
        const left = this.dynamic.filter(d => d.kind === 'item' && !d.done).length;
        this.toastOnce('left', `♻️ أحسنت! بقيت ${left} قطع في المدينة.`, 1);
      }
    }
    return hint;
  }

  // ─────────────────────────────────────────────────────────────
  // Planting and watering (hold the action key)
  // ─────────────────────────────────────────────────────────────
  nearestSpot(p, filter, maxDist) {
    let best = null, bd = maxDist;
    this.worldBuilder.plantSpots.forEach(s => {
      if (!filter(s)) return;
      const d = Math.hypot(s.position.x - p.x, s.position.z - p.z);
      if (d < bd) { bd = d; best = s; }
    });
    return best;
  }

  updatePlanting(dt, p) {
    const spot = this.nearestSpot(p, s => !s.isPlanted, 2.2);
    if (!spot) { this.actionProgress = 0; return null; }
    if (!this.player.input.isActionHeld()) {
      this.actionProgress = 0;
      return `🌱 اضغط مطولاً على ${KEY_HINT} لحفر التربة وغرس الشتلة`;
    }
    this.facePlayerTo(spot.position);
    this.player.triggerAction('plant', 0.3);
    this.actionProgress += dt / 1.5;
    if (this.actionProgress >= 1) {
      this.actionProgress = 0;
      this.plantTree(spot);
      return null;
    }
    return `🌱 جارٍ غرس الشتلة... ${Math.round(this.actionProgress * 100)}%`;
  }

  updateWatering(dt, p) {
    const spot = this.nearestSpot(p, s => s.isPlanted && !s.isWatered, 2.8);
    if (!spot) { this.actionProgress = 0; return null; }
    if (this.progression.water <= 0) {
      return '💧 نفد الماء! املأ مرشّك من نافورة الحديقة (اقترب منها).';
    }
    if (!this.player.input.isActionHeld()) {
      this.actionProgress = 0;
      return `💧 اضغط مطولاً على ${KEY_HINT} لسقي الشجرة`;
    }
    this.facePlayerTo(spot.position);
    this.player.triggerAction('water', 0.3);
    if (Math.random() < 0.8) this.emitSpray(this.handPos(), spot.position.clone().setY(0.4), 0x5dade2);
    this.actionProgress += dt / 1.4;
    if (this.actionProgress >= 1) {
      this.actionProgress = 0;
      this.waterTree(spot);
      return null;
    }
    return `💧 جارٍ السقي... ${Math.round(this.actionProgress * 100)}%`;
  }

  plantTree(spot, instant = false) {
    spot.isPlanted = true;
    if (spot.ring) spot.ring.visible = false;

    const tree = this.worldBuilder.nature.createCartoonTree(spot.position.x, spot.position.z, 0.42, 'light');
    tree.position.y = 0.12;
    spot.treeMesh = tree;
    if (instant) return;

    tree.scale.setScalar(0.01);
    this.growing.push({ obj: tree, from: 0.01, to: 1, t: 0, dur: 1.6 });
    audio.playPlantTree();
    this.player.triggerAction('celebrate', 0.8);

    this.currentProgress++;
    this.progression.addXP(25);
    this.progression.addCoins(10);
    events.emit('FLOAT_TEXT', { position: spot.position, text: '🌱 تمت زراعة الشتلة!', color: '#27ae60' });

    this.emitUpdate();
    const left = this.worldBuilder.plantSpots.filter(s => !s.isPlanted).length;
    if (this.currentProgress >= this.getCurrentMission().target || left === 0) this.completeCurrentMission();
  }

  waterTree(spot) {
    this.progression.consumeWater(1);
    spot.isWatered = true;
    audio.playWaterTree();

    // Wet soil and the tree visibly grows
    if (spot.mound && spot.mound.material && spot.mound.material.color) spot.mound.material.color.setHex(0x2b1d17);
    if (spot.treeMesh) this.growing.push({ obj: spot.treeMesh, from: spot.treeMesh.scale.x, to: 1.45, t: 0, dur: 2.2 });

    this.currentProgress++;
    this.progression.addXP(30);
    this.progression.addCoins(15);
    events.emit('FLOAT_TEXT', { position: spot.position, text: '💧 ارتوت الشجرة وكبرت!', color: '#3498db' });

    this.emitUpdate();
    const left = this.worldBuilder.plantSpots.filter(s => s.isPlanted && !s.isWatered).length;
    if (this.currentProgress >= this.getCurrentMission().target || left === 0) this.completeCurrentMission();
  }

  // ─────────────────────────────────────────────────────────────
  // Fires: spray with the extinguisher; untreated fires recover and spread
  // ─────────────────────────────────────────────────────────────
  beginFireFight(m) {
    this.stage = 1;
    this.setCarry('extinguisher');
    audio.playClick();
    events.emit('TOAST', '🧯 أخذت المطفأة من عمر! أسرع إلى المخبزة وأطفئ النيران — صوّب على قاعدة اللهب.');
    setTimeout(() => events.emit('TOAST', '⚠️ في الحياة الواقعية: ابتعد عن النار واتصل فوراً بالحماية المدنية على الرقم 14.'), 2600);
    this.emitUpdate();
  }

  updateFires(dt, p, m) {
    const fires = this.dynamic.filter(d => d.kind === 'fire');
    const active = fires.filter(d => !d.done);
    let nearest = null, nd = Infinity;
    active.forEach(d => {
      const dist = Math.hypot(d.obj.position.x - p.x, d.obj.position.z - p.z);
      if (dist < nd) { nd = dist; nearest = d; }
    });

    // Never walk into the flames
    if (nearest && nd < 1.2) {
      const dx = p.x - nearest.obj.position.x, dz = p.z - nearest.obj.position.z;
      const l = Math.hypot(dx, dz) || 1;
      p.x = nearest.obj.position.x + dx / l * 1.25;
      p.z = nearest.obj.position.z + dz / l * 1.25;
      this.toastOnce('tooclose', '⚠️ لا تقترب كثيراً من النار! رشّ من مسافة آمنة.');
    }

    const hasExt = this.carryStyle === 'extinguisher';
    const spraying = hasExt && nearest && nd < 5 && this.player.input.isActionHeld();
    if (spraying) {
      this.facePlayerTo(nearest.obj.position);
      this.player.triggerAction('spray', 0.25);
      const target = nearest.obj.position.clone();
      target.y += nearest.obj.userData.baseY;
      for (let i = 0; i < 2; i++) this.emitSpray(this.handPos(), target);
    }

    active.forEach(d => {
      if (spraying && d === nearest) {
        d.health -= dt / 2.2 * (nd < 3.8 ? 1 : 0.6);
        d.hot = 0;
      } else {
        d.health = Math.min(1, d.health + dt * 0.05);
        d.hot = d.health > 0.9 ? d.hot + dt : 0;
      }
      if (d.health <= 0) this.extinguish(d);
    });

    // Neglected fires spread to the surroundings (limited)
    if (m.spread && fires.length < (m.maxFires || 5)) {
      const source = active.find(d => !d.done && d.hot > 14);
      if (source) {
        source.hot = 0;
        const a = Math.random() * Math.PI * 2;
        let x = source.obj.position.x + Math.cos(a) * 2.3;
        let z = source.obj.position.z + Math.sin(a) * 2.3;
        if (m.spreadBounds) {
          const [x0, x1, z0, z1] = m.spreadBounds;
          x = Math.max(x0, Math.min(x1, x));
          z = Math.max(z0, Math.min(z1, z));
        }
        this.spawnFire(x, z);
        m.target = this.dynamic.filter(d => d.kind === 'fire').length;
        this.toastOnce('spread', '🔥 النار تنتشر! أسرع قبل أن تكبر أكثر.', 6);
        this.emitUpdate();
      }
    }

    if (this.missionStatus !== MissionStatus.IN_PROGRESS || !nearest) return null;
    if (!hasExt) return nd < 9 ? '🧯 تحتاج إلى مطفأة! خذها من رجل الإطفاء عمر أمام مركز الحماية المدنية.' : null;
    if (spraying) return `🧯 استمر بالرش... ${Math.round((1 - Math.max(0, nearest.health)) * 100)}%`;
    if (nd < 5) return `🧯 اضغط مطولاً على ${KEY_HINT} لرشّ النار`;
    return null;
  }

  extinguish(d) {
    d.done = true;
    d.health = 0;
    d.steam = 4;
    audio.playWaterTree();
    this.progression.addXP(20);
    events.emit('FLOAT_TEXT', { position: d.obj.position, text: '🧯 تم إخماد النار!', color: '#5dade2' });
    this.currentProgress = this.dynamic.filter(f => f.kind === 'fire' && f.done).length;
    this.emitUpdate();
    if (this.dynamic.every(f => f.kind !== 'fire' || f.done)) {
      this.setCarry(null);
      this.completeCurrentMission();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Escort: the elderly NPC follows the player's footsteps and only crosses at zebra crossings
  // ─────────────────────────────────────────────────────────────
  beginEscort(m) {
    if (!this.npcSystem) return;
    this.stage = 1;
    const npc = this.npcSystem.findNPC(m.targetNPC);
    this.escort = { npc, crumbs: [], waiting: false };
    this.npcSystem.setMoveTarget(m.targetNPC, npc.group.position, 1.3);

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.8, 40),
      new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(m.destination.x, this.groundAt(m.destination.x, m.destination.z) + 0.04, m.destination.z);
    this.engine.scene.add(marker);
    this.dynamic.push({ kind: 'marker', obj: marker, done: false });

    events.emit('TOAST', '🚶 عمي قدور يمشي خلفك. امشِ ببطء وقُده إلى ممر الراجلين ثم إلى الرصيف المقابل.');
    this.emitUpdate();
  }

  stopEscort() {
    if (this.escort && this.npcSystem) this.npcSystem.setMoveTarget(this.escort.npc.data.id, null);
    this.escort = null;
  }

  getEscortPositions() {
    if (!this.escort) return [];
    const k = this.escort.npc.group.position;
    return onRoad(k.x, k.z) ? [k] : [];
  }

  updateEscort(dt, p, m) {
    const e = this.escort;
    if (this.stage !== 1 || !e) return null;
    const k = e.npc.group.position;
    const id = m.targetNPC;
    const standStill = () => this.npcSystem.setMoveTarget(id, k, 1.3);
    const playerDist = Math.hypot(p.x - k.x, p.z - k.z);

    // Arrived on the far sidewalk
    if (Math.hypot(k.x - m.destination.x, k.z - m.destination.z) < 2.0) {
      this.stopEscort();
      e.npc.charModel.setAction('wave', 2.0);
      events.emit('TOAST', `💬 عمي قدور: ${m.thanksLine || 'بارك الله فيك يا بني، عبرت بأمان بفضلك!'}`);
      this.currentProgress = 1;
      this.completeCurrentMission();
      return null;
    }

    if (e.waiting) {
      standStill();
      if (playerDist < 2.5) { e.waiting = false; e.crumbs = []; }
      return '👴 عمي قدور لن يعبر من هنا. عد إليه وقُده نحو ممر الراجلين.';
    }

    // Record the player's footsteps
    const last = e.crumbs[e.crumbs.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.z - p.z) > 0.7) e.crumbs.push(new THREE.Vector3(p.x, 0, p.z));
    while (e.crumbs.length && Math.hypot(e.crumbs[0].x - k.x, e.crumbs[0].z - k.z) < 0.45) e.crumbs.shift();

    if (playerDist < 1.8 || !e.crumbs.length) { standStill(); return null; }
    const next = e.crumbs[0];

    // Refuses to jaywalk: only steps onto the road on a zebra crossing
    const cw = crosswalkAt(next.x, next.z);
    if (onRoad(next.x, next.z) && !cw) {
      e.waiting = true;
      e.crumbs = [];
      standStill();
      this.toastOnce('jaywalk', '💬 عمي قدور: لا يا بني! لا نقطع الطريق إلا من ممر الراجلين (الخطوط البيضاء).', 5);
      return null;
    }
    // Waits at the curb while cars have the green light
    if (cw && cw.central && !onRoad(k.x, k.z) && this.lightPhase() === `${cw.cars}_GREEN`) {
      standStill();
      return '🚦 عمي قدور ينتظر حتى تتوقف السيارات عند الإشارة الحمراء...';
    }

    this.npcSystem.setMoveTarget(id, next, playerDist > 6 ? 1.6 : 1.3);
    if (playerDist > 12) return '👴 لا تبتعد كثيراً! عمي قدور يمشي ببطء، انتظره.';
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // Deliveries: pick up, carry, hand over to the person
  // ─────────────────────────────────────────────────────────────
  updateDelivery(dt, playerPos, m) {
    if (this.stage === 0) {
      const pickup = this.dynamic.find(d => d.kind === 'pickup');
      if (pickup) pickup.obj.rotation.y += dt * 1.2;
      if (Math.hypot(m.pickup.x - playerPos.x, m.pickup.z - playerPos.z) < 1.8) {
        this.stage = 1;
        if (pickup) { pickup.done = true; pickup.obj.visible = false; }
        this.setCarry(m.carryStyle);
        this.player.triggerAction('pickup', 0.6);
        audio.playClick();
        events.emit('TOAST', `📦 حملت ${m.carryLabel}. أوصله إلى ${m.dropoff.label}.`);
        this.emitUpdate();
      }
    } else {
      const drop = this.getDropoffPos(m);
      if (drop && Math.hypot(drop.x - playerPos.x, drop.z - playerPos.z) < 2.4) {
        this.setCarry(null);
        if (m.dropoff.npc && this.npcSystem) {
          this.npcSystem.giveItem(m.dropoff.npc, this.makeCarryItem(m.carryStyle));
          const npc = this.npcSystem.findNPC(m.dropoff.npc);
          events.emit('TOAST', `💬 ${npc ? npc.data.name : ''}: ${m.thanksLine || 'شكراً جزيلاً لك! بارك الله فيك.'}`);
        }
        this.currentProgress = 1;
        this.completeCurrentMission();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // NPC interaction hook (association president, talk missions, active story stages)
  // ─────────────────────────────────────────────────────────────
  /** Returns true if this NPC interaction was handled by the mission system */
  handleNPCInteraction(npc) {
    const m = this.getCurrentMission();
    if (m.type === 'talk_npc' && m.targetNPC === npc.id && this.missionStatus === MissionStatus.IN_PROGRESS) {
      events.emit('TOAST', `💬 ${npc.name}: ${m.talkLine || 'أهلاً بك!'}`);
      this.currentProgress = 1;
      this.completeCurrentMission();
      return true;
    }
    if (m.type === 'fire_emergency' && npc.id === m.targetNPC && this.stage >= 1) {
      events.emit('TOAST', `💬 ${npc.name}: أسرع إلى المخبزة! صوّب المطفأة نحو قاعدة اللهب من مسافة آمنة.`);
      return true;
    }
    if (m.type === 'escort_elderly' && npc.id === m.targetNPC && this.stage >= 1) {
      events.emit('TOAST', `💬 ${npc.name}: هيا بنا يا بني، أنا أمشي خلفك. لنعبر من ممر الراجلين.`);
      return true;
    }
    if (npc.id !== PRESIDENT_ID) return false;

    if (this.missionStatus === MissionStatus.AWAITING) {
      events.emit('TOAST', `💬 السيدة سميرة: ${m.giverLine || 'شكراً لروحك التطوعية! إليك مهمة جديدة.'}`);
      this.acceptMission();
    } else if (this.isStoryFinished() && !this.activeSide) {
      this.startRepeatableMission();
    } else if (this.missionStatus === MissionStatus.COMPLETED) {
      events.emit('TOAST', '💬 السيدة سميرة: أحسنت! مهمتك التالية في الطريق.');
    } else {
      events.emit('TOAST', `💬 السيدة سميرة: أكمل مهمتك الحالية «${m.title}» ثم عد إليّ لمهام تطوعية جديدة!`);
    }
    return true;
  }

  isStoryFinished() {
    const list = missionsData.missions;
    return this.currentMissionIndex >= list.length - 1;
  }

  startRepeatableMission() {
    const pool = missionsData.missions.filter(x => x.repeatable && x.id !== this.lastRepeatId);
    const base = pool[Math.floor(Math.random() * pool.length)];
    this.lastRepeatId = base.id;
    this.activeSide = {
      ...base,
      giver: null,
      title: `🔁 ${base.title}`,
      rewardXP: Math.round(base.rewardXP * 0.5),
      rewardCoins: Math.round(base.rewardCoins * 0.5)
    };
    this.currentProgress = 0;
    this.onMissionStarted(this.activeSide);
    events.emit('TOAST', `💬 السيدة سميرة: مهمة تطوعية جديدة: ${base.title}`);
    if (base.startMessage) setTimeout(() => events.emit('TOAST', base.startMessage), 1800);
  }

  checkNPCMissionProgress(npcData) {
    const mission = this.getCurrentMission();
    if ((mission.type === 'visit_npc' || mission.type === 'traffic_safety') && mission.targetNPC === npcData.id) {
      this.currentProgress = 1;
      this.completeCurrentMission();
    }
  }

  completeCurrentMission() {
    if (this.missionStatus === MissionStatus.COMPLETED && this.completedId === this.getCurrentMission().id) return;
    const mission = this.getCurrentMission();
    this.completedId = mission.id;
    this.missionStatus = MissionStatus.COMPLETED;
    audio.playMissionComplete();
    this.player.triggerAction('celebrate', 2.0);

    this.progression.addXP(mission.rewardXP);
    this.progression.addCoins(mission.rewardCoins);
    this.progression.addWater(mission.rewardWater || 0);

    this.emitUpdate();
    events.emit('MISSION_COMPLETED', {
      mission,
      message: mission.completeMessage
    });

    if (mission.badgeUnlocked) {
      events.emit('UNLOCK_ACHIEVEMENT', mission.badgeUnlocked);
    }

    // Move straight on to the next mission
    clearTimeout(this.advanceTimer);
    this.advanceTimer = setTimeout(() => this.advanceToNextMission(), AUTO_ADVANCE_MS);
  }

  advanceToNextMission() {
    if (this.missionStatus !== MissionStatus.COMPLETED) return; // already advanced (button + auto timer)
    clearTimeout(this.advanceTimer);
    this.completedId = null;

    if (this.activeSide) {
      // Repeatable association mission finished: back to free exploration
      this.activeSide = null;
      this.clearDynamic();
      this.currentProgress = 0;
      this.missionStatus = MissionStatus.IN_PROGRESS;
      this.emitUpdate();
      events.emit('TOAST', '🤝 عد إلى جمعية شباب التطوع متى شئت لاستلام مهمة تطوعية أخرى.');
      return;
    }

    this.currentMissionIndex = Math.min(this.currentMissionIndex + 1, missionsData.missions.length - 1);
    this.currentProgress = 0;
    const nextMission = this.getCurrentMission();
    this.onMissionStarted(nextMission);

    events.emit('TOAST', this.missionStatus === MissionStatus.AWAITING
      ? `📋 مهمة جديدة: ${nextMission.title} — استلمها من جمعية شباب التطوع`
      : `📋 بدأت المهمة: ${nextMission.title}`);
  }

  loadState(saved) {
    if (!saved) return;
    if (typeof saved.missionIndex === 'number') {
      this.currentMissionIndex = saved.missionIndex;
      this.activeSide = null;
      // Earlier missions are done: their trees stand in the park
      if (this.currentMissionIndex > 1) this.worldBuilder.plantSpots.forEach(s => { if (!s.isPlanted) this.plantTree(s, true); });
      const m = this.getCurrentMission();
      this.onMissionStarted(m);
      // Objectives in the world respawn from scratch, so their progress restarts too
      this.currentProgress = SPATIAL_TYPES.has(m.type) ? 0 : (saved.missionProgress || 0);
      this.emitUpdate();
    }
  }
}
