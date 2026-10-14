// إدارة الحالة والتخزين المحلي للعبة كنوز الجزائر (Local Storage Persistence)

// WLADZ : une sauvegarde par enfant connecté (et son prénom comme nom de joueur).
const WLADZ_PLAYER = (typeof window !== "undefined" && window.__WLADZ_PLAYER__) || null;
const STORAGE_KEY = "kounouz_algeria_save_v1" + (WLADZ_PLAYER ? ":" + WLADZ_PLAYER.id : "");

const DEFAULT_STATE = {
  playerName: WLADZ_PLAYER?.name || "مستكشف الجزائر",
  coins: 150,
  gems: 8,
  totalStars: 0,
  currentWilayaId: 1,
  currentStageIndex: 0,
  unlockedWilayas: [1], // ولاية أدرار فقط مفتوحة بالبداية
  completedWilayas: [],
  solvedStages: {}, // { stageId: { stars: 3, score: 100, timestamp: ... } }
  claimedAchievements: [],
  stats: {
    totalSolved: 0,
    perfectStreak: 0,
    highestStreak: 0,
    totalHintsUsed: 0,
    totalCoinsEarned: 150,
    wheelSpins: 0,
    chestsOpened: 0,
    startedAt: Date.now()
  },
  dailyStreak: {
    lastLoginDate: "",
    currentStreak: 1,
    claimedToday: false
  },
  lastWheelSpin: 0,
  chestStars: 0, // كل 10 نجوم تفتح صندوق هدايا
  settings: {
    soundEnabled: true,
    musicEnabled: false
  }
};

class GameStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // دمج البيانات المحفوظة مع الإعدادات الافتراضية
        return {
          ...DEFAULT_STATE,
          ...parsed,
          playerName: WLADZ_PLAYER?.name || parsed.playerName || DEFAULT_STATE.playerName,
          stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
          dailyStreak: { ...DEFAULT_STATE.dailyStreak, ...(parsed.dailyStreak || {}) },
          settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.warn("Could not load saved game, using defaults", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error("Error in store listener", err);
      }
    });
  }

  getState() {
    return this.state;
  }

  // المعاملات المالية
  addCoins(amount) {
    this.state.coins = Math.max(0, this.state.coins + amount);
    if (amount > 0) {
      this.state.stats.totalCoinsEarned = (this.state.stats.totalCoinsEarned || 0) + amount;
    }
    this.saveState();
  }

  spendCoins(amount) {
    if (this.state.coins >= amount) {
      this.state.coins -= amount;
      this.saveState();
      return true;
    }
    return false;
  }

  addGems(amount) {
    this.state.gems = Math.max(0, this.state.gems + amount);
    this.saveState();
  }

  spendGems(amount) {
    if (this.state.gems >= amount) {
      this.state.gems -= amount;
      this.saveState();
      return true;
    }
    return false;
  }

  // تقدم المراحل والولايات
  markStageSolved(stageId, wilayaId, starsEarned, coinsReward, gemsReward, usedHints) {
    const isFirstTime = !this.state.solvedStages[stageId];

    this.state.solvedStages[stageId] = {
      stars: starsEarned,
      solvedAt: Date.now(),
      usedHints: usedHints
    };

    if (isFirstTime) {
      this.state.stats.totalSolved += 1;
      this.state.totalStars += starsEarned;
      this.state.chestStars = (this.state.chestStars || 0) + starsEarned;

      if (!usedHints) {
        this.state.stats.perfectStreak = (this.state.stats.perfectStreak || 0) + 1;
        if (this.state.stats.perfectStreak > (this.state.stats.highestStreak || 0)) {
          this.state.stats.highestStreak = this.state.stats.perfectStreak;
        }
      } else {
        this.state.stats.perfectStreak = 0;
      }
    }

    if (coinsReward) this.addCoins(coinsReward);
    if (gemsReward) this.addGems(gemsReward);

    this.saveState();
  }

  // إكمال الولاية وفتح الولاية التالية تلقائياً
  completeWilaya(wilayaId) {
    if (!this.state.completedWilayas.includes(wilayaId)) {
      this.state.completedWilayas.push(wilayaId);
    }
    // فتح الولاية التالية (إذا كان معرفها أقل من 58)
    const nextWilayaId = wilayaId + 1;
    if (nextWilayaId <= 58 && !this.state.unlockedWilayas.includes(nextWilayaId)) {
      this.state.unlockedWilayas.push(nextWilayaId);
    }
    this.saveState();
  }

  isWilayaUnlocked(wilayaId) {
    return this.state.unlockedWilayas.includes(wilayaId);
  }

  isWilayaCompleted(wilayaId) {
    return this.state.completedWilayas.includes(wilayaId);
  }

  // حساب نسبة إكمال الولاية
  getWilayaProgress(wilayaId, totalStages) {
    if (!totalStages || totalStages <= 0) return 0;
    let solvedCount = 0;
    for (const [stId] of Object.entries(this.state.solvedStages)) {
      if (stId.startsWith(`adrar_`) && wilayaId === 1) solvedCount++;
      else if (stId.startsWith(`chlef_`) && wilayaId === 2) solvedCount++;
      else if (stId.startsWith(`algiers_`) && wilayaId === 16) solvedCount++;
      else if (stId.startsWith(`constantine_`) && wilayaId === 25) solvedCount++;
      else if (stId.startsWith(`stage_${wilayaId}_`)) solvedCount++;
    }
    return Math.min(100, Math.round((solvedCount / totalStages) * 100));
  }

  // تحديث مسار التلميحات
  recordHintUsed() {
    this.state.stats.totalHintsUsed = (this.state.stats.totalHintsUsed || 0) + 1;
    this.state.stats.perfectStreak = 0;
    this.saveState();
  }

  // المكافأة اليومية
  checkDailyLogin() {
    const today = new Date().toISOString().split("T")[0];
    const lastLogin = this.state.dailyStreak.lastLoginDate;

    if (lastLogin !== today) {
      if (lastLogin) {
        const lastDate = new Date(lastLogin);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // يوم متتالي
          this.state.dailyStreak.currentStreak = Math.min(7, (this.state.dailyStreak.currentStreak || 1) + 1);
        } else if (diffDays > 1) {
          // انقطاع السلسلة
          this.state.dailyStreak.currentStreak = 1;
        }
      } else {
        this.state.dailyStreak.currentStreak = 1;
      }

      this.state.dailyStreak.lastLoginDate = today;
      this.state.dailyStreak.claimedToday = false;
      this.saveState();
    }

    return {
      streak: this.state.dailyStreak.currentStreak,
      canClaim: !this.state.dailyStreak.claimedToday
    };
  }

  claimDailyReward(coins, gems) {
    this.state.dailyStreak.claimedToday = true;
    this.addCoins(coins);
    if (gems > 0) this.addGems(gems);
    this.saveState();
  }

  // صندوق الهدايا
  canOpenChest() {
    return (this.state.chestStars || 0) >= 10;
  }

  openChest() {
    if (this.canOpenChest()) {
      this.state.chestStars -= 10;
      this.state.stats.chestsOpened = (this.state.stats.chestsOpened || 0) + 1;
      this.saveState();
      return true;
    }
    return false;
  }

  // إعادة التعيين
  resetProgress() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

export const store = new GameStore();
