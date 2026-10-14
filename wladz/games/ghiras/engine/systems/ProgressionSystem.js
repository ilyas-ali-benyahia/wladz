import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export class ProgressionSystem {
  constructor() {
    this.xp = 0;
    this.level = 1;
    this.coins = 50;
    this.water = 5;
    this.maxWater = 10;

    this.levelTitles = [
      'المواطن الصغير',
      'صديق البيئة',
      'المساعد الصغير',
      'حامي المدينة',
      'سفير المواطنة الصالحة'
    ];

    this.xpPerLevel = [0, 100, 250, 450, 750, 1200];
  }

  addXP(amount) {
    this.xp += amount;
    events.emit('XP_GAINED', { amount, totalXP: this.xp });

    // Check level up
    const nextLevelXP = this.xpPerLevel[this.level] || 999999;
    if (this.xp >= nextLevelXP && this.level < this.levelTitles.length) {
      this.level++;
      audio.playMissionComplete();
      events.emit('LEVEL_UP', {
        newLevel: this.level,
        title: this.getLevelTitle()
      });
    }

    events.emit('PROGRESSION_UPDATED', this.getState());
  }

  addCoins(amount) {
    this.coins += amount;
    events.emit('PROGRESSION_UPDATED', this.getState());
  }

  addWater(amount) {
    this.water = Math.min(this.maxWater, this.water + amount);
    events.emit('PROGRESSION_UPDATED', this.getState());
  }

  consumeWater(amount = 1) {
    if (this.water >= amount) {
      this.water -= amount;
      events.emit('PROGRESSION_UPDATED', this.getState());
      return true;
    }
    return false;
  }

  getLevelTitle() {
    const idx = Math.min(this.level - 1, this.levelTitles.length - 1);
    return this.levelTitles[idx];
  }

  getXPProgress() {
    const prevXP = this.xpPerLevel[this.level - 1] || 0;
    const nextXP = this.xpPerLevel[this.level] || (prevXP + 300);
    const currentProgress = this.xp - prevXP;
    const needed = nextXP - prevXP;
    const pct = Math.min(1.0, Math.max(0, currentProgress / needed));
    return { currentProgress, needed, pct };
  }

  getState() {
    const { currentProgress, needed, pct } = this.getXPProgress();
    return {
      xp: this.xp,
      level: this.level,
      levelTitle: this.getLevelTitle(),
      coins: this.coins,
      water: this.water,
      maxWater: this.maxWater,
      xpProgress: currentProgress,
      xpNeeded: needed,
      xpPct: pct
    };
  }

  loadState(saved) {
    if (!saved) return;
    if (typeof saved.xp === 'number') this.xp = saved.xp;
    if (typeof saved.level === 'number') this.level = saved.level;
    if (typeof saved.coins === 'number') this.coins = saved.coins;
    if (typeof saved.water === 'number') this.water = saved.water;
    events.emit('PROGRESSION_UPDATED', this.getState());
  }
}
