import achievementsData from '../data/achievements.json';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export class AchievementSystem {
  constructor() {
    this.achievements = achievementsData.achievements.map(a => ({ ...a }));
    this.setupListeners();
  }

  setupListeners() {
    events.on('UNLOCK_ACHIEVEMENT', (badgeId) => {
      this.unlock(badgeId);
    });
  }

  unlock(badgeId) {
    const ach = this.achievements.find(a => a.id === badgeId);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      audio.playMissionComplete();
      events.emit('ACHIEVEMENT_UNLOCKED', ach);
    }
  }

  getAll() {
    return this.achievements;
  }

  getState() {
    return this.achievements.map(a => ({ id: a.id, unlocked: a.unlocked }));
  }

  loadState(saved) {
    if (!Array.isArray(saved)) return;
    saved.forEach(s => {
      const ach = this.achievements.find(a => a.id === s.id);
      if (ach) ach.unlocked = s.unlocked;
    });
  }
}
