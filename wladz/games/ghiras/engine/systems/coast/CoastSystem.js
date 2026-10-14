import * as THREE from 'three';
import { events } from '../../core/EventBus.js';
import { audio } from '../AudioSystem.js';
import { CoastDistrict, COAST_ORIGIN, SHORE_Z, WATER_Y } from './CoastDistrict.js';
import { Football, createFootballActivity } from '../activities/FootballActivity.js';
import { createSwimmingActivity } from '../activities/SwimmingActivity.js';

// City side: the south tunnel at the end of the main boulevard leads to the coast
const CITY_TUNNEL = new THREE.Vector3(0, 0, 80.1);
const CITY_RETURN = new THREE.Vector3(0, 0, 78.4);

/**
 * Coast orchestration: tunnel transitions between the city and the coastal district, water / ground hooks for
 * the player while there, facility givers (coach, swim instructor, lifeguard) and the per-frame updates.
 */
export class CoastSystem {
  constructor(game) {
    this.game = game;
    this.district = new CoastDistrict(game.engine, game.collisionSystem);
    this.football = new Football(this.district, game);
    this.inCoast = false;
    this.lastHint = null;
    this.hooks = { onLifeguardAlert: null };
    game.activities.register(createFootballActivity(this.district, this.football));
    game.activities.register(createSwimmingActivity(this.district, game, this.hooks));
  }

  /** Swimming rules: shallow zone after the first lesson (or during it, from the entry point); advanced zone after the distance challenge */
  swimAllowed(x, z) {
    const zone = this.district.swimZoneAt(x, z);
    const act = this.game.activities;
    const active = act.active && act.active.def.id === 'swimming' ? act.active.stage.id : null;
    if (zone === 'shallow') return act.isDone('swimming', 'entry') || (active === 'entry' && act.active.ctx.data.viaEntry);
    if (zone === 'advanced') return act.isDone('swimming', 'distance');
    return false;
  }

  swimBlockedMessage(x, z) {
    const zone = this.district.swimZoneAt(x, z);
    if (zone === 'advanced') return '⛔ المنطقة المتقدمة مخصّصة لمن أنهى تحدي المسافة في مدرسة السباحة.';
    if (zone === 'shallow') return '🏊 تحدّث أولاً مع المدرّبة نسرين، وادخل الماء من نقطة الدخول الخضراء.';
    return '⛔ ممنوع السباحة خارج حبال العوامات: ابقَ في المنطقة المحروسة.';
  }

  // ─────────────────────────────────────────────────────────────
  enter() {
    const g = this.game;
    g.interiors.transition(() => {
      this.inCoast = true;
      const d = this.district;
      d.group.visible = true;
      g.collisionSystem.bounds = d.bounds;
      g.collisionSystem.groundFn = (x, z) => d.heightAt(x, z);
      const pl = g.player;
      pl.cameraBounds = null;
      pl.waterDepthAt = (x, z) => d.depthAt(x, z);
      pl.waterSurfaceY = WATER_Y;
      pl.swimAllowed = (x, z) => this.swimAllowed(x, z);
      pl.onSwimBlocked = () => this.toastOnce('swim', this.swimBlockedMessage(pl.position.x, pl.position.z));
      pl.onWaterChange = (on) => { audio.playSplash(on); this.splash(); };
      g.interiors.teleport(d.spawn, 0, Math.PI);
      audio.setBeachAmbience(true, 0.6);
      events.emit('TOAST', '🏖️ أهلاً بك في شاطئ غِراس! الملعب على يمينك، ومدرسة السباحة عند الشاطئ.');
      events.emit('ZONE_ENTERED', { id: 'coast' });
    });
  }

  exit() {
    const g = this.game;
    g.interiors.transition(() => {
      g.activities.stop(true);
      this.football.hide();
      this.inCoast = false;
      this.district.group.visible = false;
      g.collisionSystem.bounds = null;
      g.collisionSystem.groundFn = null;
      const pl = g.player;
      pl.waterDepthAt = null;
      pl.swimAllowed = null;
      pl.onSwimBlocked = null;
      pl.onWaterChange = null;
      pl.swimming = false;
      g.interiors.teleport(CITY_RETURN, Math.PI, 0);
      audio.setBeachAmbience(false);
      events.emit('ZONE_EXITED', { id: 'coast' });
    });
  }

  toastOnce(key, text) {
    const now = performance.now();
    this.toastAt = this.toastAt || {};
    if (this.toastAt[key] && now - this.toastAt[key] < 3500) return;
    this.toastAt[key] = now;
    events.emit('TOAST', text);
  }

  /** Water splash particles where the player enters / leaves the water */
  splash() {
    const p = this.game.player.position;
    const d = this.district;
    if (!this.splashPool) {
      const geo = new THREE.SphereGeometry(0.08, 6, 5);
      const mat = new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.85, depthWrite: false });
      this.splashPool = Array.from({ length: 18 }, () => { const m = new THREE.Mesh(geo, mat); m.visible = false; d.group.add(m); return { m, v: new THREE.Vector3(), life: 0 }; });
    }
    const l = d.local(p);
    this.splashPool.forEach(s => {
      s.m.visible = true;
      s.m.position.set(l.x, WATER_Y + 0.1, l.z);
      s.v.set((Math.random() - 0.5) * 2.4, 2 + Math.random() * 2, (Math.random() - 0.5) * 2.4);
      s.life = 0.7;
    });
  }

  nearNpc(key, r = 2.6) {
    const n = this.district.npcs[key];
    const p = this.game.player.position;
    const pos = n.model.group.position;
    return Math.hypot(p.x - (COAST_ORIGIN.x + pos.x), p.z - (COAST_ORIGIN.z + pos.z)) < r;
  }

  /** E pressed: returns true if the coast handled it */
  tryInteract() {
    const g = this.game;
    if (g.interiors.busy) return false;
    const p = g.player.position;
    if (!this.inCoast) {
      if (!g.interiors.isInside() && Math.hypot(p.x - CITY_TUNNEL.x, p.z - CITY_TUNNEL.z) < 3.2) { this.enter(); return true; }
      return false;
    }
    if (Math.hypot(p.x - this.district.exitPoint.x, p.z - this.district.exitPoint.z) < 3.2) { this.exit(); return true; }
    if (g.player.swimming) return false;
    if (this.nearNpc('coach')) { g.activities.openMenu('football'); audio.playClick(); return true; }
    if (this.nearNpc('instructor')) { g.activities.openMenu('swimming'); audio.playClick(); return true; }
    if (this.nearNpc('lifeguard', 3.2)) {
      if (this.hooks.onLifeguardAlert && this.hooks.onLifeguardAlert()) return true;
      events.emit('TOAST', '💬 المنقذ سفيان: اسبح دائماً بين العوامات وتحت نظري، وأخبرني فوراً إذا رأيت أحداً في خطر. رقم الحماية المدنية: 14.');
      return true;
    }
    return false;
  }

  hint() {
    const g = this.game;
    const p = g.player.position;
    if (!this.inCoast) {
      return !g.interiors.isInside() && !g.vehicle.driving && Math.hypot(p.x - CITY_TUNNEL.x, p.z - CITY_TUNNEL.z) < 3.2
        ? '🏖️ اضغط <b>E</b> لعبور النفق إلى الشاطئ والملعب' : null;
    }
    if (Math.hypot(p.x - this.district.exitPoint.x, p.z - this.district.exitPoint.z) < 3.2) return '🏙️ اضغط <b>E</b> للعودة عبر النفق إلى المدينة';
    if (g.player.swimming) return null;
    if (this.nearNpc('coach')) return '⚽ اضغط <b>E</b> للتحدث مع المدرب كريم';
    if (this.nearNpc('instructor')) return '🏊 اضغط <b>E</b> للتحدث مع المدرّبة نسرين';
    if (this.nearNpc('lifeguard', 3.2)) return '🛟 اضغط <b>E</b> للتحدث مع المنقذ سفيان';
    return null;
  }

  update(dt) {
    const h = this.hint();
    if (h !== this.lastHint) { this.lastHint = h; this.game.ui.setCustomHint(h, 'zone'); }
    if (!this.inCoast) return;
    this.district.update(dt);
    this.football.update(dt);
    // Waves are louder near the shore
    const l = this.district.local(this.game.player.position);
    audio.beachIntensity = THREE.MathUtils.clamp(1.2 - Math.abs(l.z - SHORE_Z) / 40, 0.25, 1.2);
    if (this.splashPool) this.splashPool.forEach(s => {
      if (s.life <= 0) return;
      s.life -= dt;
      s.v.y -= 9.8 * dt;
      s.m.position.addScaledVector(s.v, dt);
      if (s.life <= 0) s.m.visible = false;
    });
  }

  getState() { return { inCoast: false }; }
}
