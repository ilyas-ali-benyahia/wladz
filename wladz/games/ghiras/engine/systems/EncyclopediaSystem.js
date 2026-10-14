import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

/**
 * In-game encyclopedia: every information point the player reads (museum, library, mosque, clinic, ...)
 * becomes an entry, grouped by place. Entries come only from the game's own verified texts.
 */
export class EncyclopediaSystem {
  constructor(game) {
    this.game = game;
    this.entries = {}; // title -> { title, text, place }
    events.on('INTERIOR_POI_READ', ({ title, text, building }) => this.unlock(title, text, building));
    this.buildModal();
  }

  /** All entries that exist in the world (for the "x of y" counter) */
  totalKnown() {
    const its = this.game.interiors ? Object.values(this.game.interiors.interiors) : [];
    return its.reduce((n, it) => n + it.pois.filter(p => p.text && !p.action).length, 0);
  }

  unlock(title, text, place) {
    if (!title || !text || this.entries[title]) return false;
    this.entries[title] = { title, text, place: place || '' };
    events.emit('TOAST', `📖 أُضيف إلى الموسوعة: «${title}»`);
    events.emit('ENCYCLOPEDIA_UPDATED', { count: Object.keys(this.entries).length });
    return true;
  }

  count() { return Object.keys(this.entries).length; }

  buildModal() {
    const el = document.createElement('div');
    el.id = 'encyclopedia-modal';
    el.className = 'modal-overlay';
    el.innerHTML = '<div class="ac-card"><div class="ac-head"><span class="ac-avatar">📖</span><div><h3>موسوعة غِراس</h3><small id="enc-count"></small></div><button type="button" class="wd-close" id="enc-close">✕</button></div><div class="ac-list" id="enc-list"></div></div>';
    document.body.appendChild(el);
    this.modal = el;
    el.querySelector('#enc-close').addEventListener('click', () => this.close());
  }

  open() {
    audio.playClick();
    const total = this.totalKnown();
    this.modal.querySelector('#enc-count').textContent = `اكتشفت ${this.count()} من ${total} معلومة • اقرأ لوحات المعالم (E) لتكتشف المزيد`;
    const byPlace = {};
    Object.values(this.entries).forEach(e => { (byPlace[e.place] = byPlace[e.place] || []).push(e); });
    const html = Object.keys(byPlace).map(place => `<div class="enc-place">${place || 'معلومات'}</div>` +
      byPlace[place].map(e => `<div class="ac-stage done"><span class="ac-num">📘</span><div class="ac-info"><b>${e.title}</b><small>${e.text}</small></div></div>`).join('')).join('');
    this.modal.querySelector('#enc-list').innerHTML = html || '<p class="ac-intro">الموسوعة فارغة: ادخل المتحف والمكتبة والمعالم واقرأ اللوحات (E) لتملأها.</p>';
    this.modal.classList.add('show');
    this.game.input.setEnabled(false);
    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    this.modal.classList.remove('show');
    this.game.input.setEnabled(true);
    this.isOpen = false;
  }

  getState() { return { entries: this.entries }; }
  loadState(s) { if (s && s.entries) Object.assign(this.entries, s.entries); }
}
