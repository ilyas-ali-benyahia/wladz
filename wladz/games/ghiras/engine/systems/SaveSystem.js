export class SaveSystem {
  constructor(storageKey = 'ghirass_save_data_v1') {
    // WLADZ : une sauvegarde par enfant connecté.
    const player = typeof window !== 'undefined' && window.__WLADZ_PLAYER__;
    this.storageKey = player ? `${storageKey}:${player.id}` : storageKey;
  }

  saveGame(data) {
    try {
      const payload = {
        timestamp: Date.now(),
        ...data
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('Failed to save game state to localStorage:', err);
      return false;
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to load game state:', err);
      return null;
    }
  }

  hasSave() {
    return !!localStorage.getItem(this.storageKey);
  }

  clearSave() {
    localStorage.removeItem(this.storageKey);
  }
}
