/**
 * Tracked timers: everything scheduled through a bag can be cancelled in one call,
 * so quitting or restarting a run never leaves callbacks firing on a dead screen.
 */
export function createTimerBag() {
  const ids = new Set();
  return {
    timeout(fn, ms) {
      const id = setTimeout(() => { ids.delete(id); fn(); }, ms);
      ids.add(id);
      return id;
    },
    interval(fn, ms) {
      const id = setInterval(fn, ms);
      ids.add(id);
      return id;
    },
    clear(id) {
      clearTimeout(id);
      clearInterval(id);
      ids.delete(id);
    },
    clearAll() {
      ids.forEach(id => { clearTimeout(id); clearInterval(id); });
      ids.clear();
    }
  };
}
