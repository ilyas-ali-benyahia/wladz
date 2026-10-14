import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';
import { OUTFITS, SKIN_TONES, HAIR_COLORS, HIJAB_COLORS, HAIR_STYLES, DEFAULT_APPEARANCE, getOutfit } from '../data/outfits.js';

const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const isGirl = (type) => /^girl/.test(type || '');

/**
 * Player appearance and clothing: owned outfits, equipped outfit per character, skin / hair / hijab,
 * purchases with the game's coins, try-on previews, and save / load. The player model is rebuilt from
 * these choices on the shared rig, so mission progress, inventory and identity are never touched.
 */
export class WardrobeSystem {
  constructor(game) {
    this.game = game;
    this.owned = new Set(['casual']);
    this.looks = JSON.parse(JSON.stringify(DEFAULT_APPEARANCE));
    this.tryOn = null; // outfit id being previewed in the shop
    this.isOpen = false;

    // The player controller asks us how to dress whichever character is active
    game.player.lookFor = (type) => this.optionsFor(type);
    this.buildPanel();
  }

  get type() {
    return this.game.player.gender || 'boy_purple';
  }

  look(type = this.type) {
    if (!this.looks[type]) this.looks[type] = JSON.parse(JSON.stringify(DEFAULT_APPEARANCE[isGirl(type) ? 'girl_green' : 'boy_purple']));
    return this.looks[type];
  }

  optionsFor(type) {
    const look = this.look(type);
    const outfit = getOutfit(this.tryOn && type === this.type ? this.tryOn : look.outfit);
    return { appearance: look, outfit: { ...outfit[isGirl(type) ? 'girl' : 'boy'] } };
  }

  refresh() {
    this.game.player.switchGender(this.type);
  }

  setLook(patch, type = this.type) {
    Object.assign(this.look(type), patch);
    if (type === this.type) this.refresh();
  }

  // ─────────────────────────────────────────────────────────────
  // Shop actions
  // ─────────────────────────────────────────────────────────────
  /** Returns 'bought' | 'owned' | 'poor' */
  buy(id) {
    const o = getOutfit(id);
    if (this.owned.has(o.id)) return 'owned';
    const prog = this.game.progression;
    if (prog.coins < o.price) return 'poor';
    prog.addCoins(-o.price);
    this.owned.add(o.id);
    audio.playMissionComplete();
    events.emit('TOAST', `🛍️ اشتريت «${o.name}» بـ ${o.price} قطعة نقدية!`);
    this.equip(o.id);
    return 'bought';
  }

  equip(id) {
    if (!this.owned.has(id)) return false;
    this.look().outfit = id;
    this.tryOn = null;
    this.refresh();
    this.autosave();
    return true;
  }

  autosave() {
    if (this.game.isGameActive && this.game.saveCurrentGame) this.game.saveCurrentGame();
  }

  getState() {
    return { owned: [...this.owned], looks: this.looks };
  }

  loadState(s) {
    if (!s) return;
    if (Array.isArray(s.owned)) s.owned.forEach(id => { if (OUTFITS.some(o => o.id === id)) this.owned.add(id); });
    if (s.looks) Object.keys(s.looks).forEach(t => { this.looks[t] = { ...this.look(t), ...s.looks[t] }; });
    Object.values(this.looks).forEach(l => { if (!this.owned.has(l.outfit)) l.outfit = 'casual'; });
  }

  // ─────────────────────────────────────────────────────────────
  // Appearance controls (shared by character selection and the shop)
  // ─────────────────────────────────────────────────────────────
  renderAppearance(container, type = this.type) {
    const look = this.look(type);
    const row = (label, html) => `<div class="wd-row"><span class="wd-label">${label}</span><div class="wd-opts">${html}</div></div>`;
    const swatches = (key, list) => list.map(c =>
      `<button type="button" class="wd-swatch${look[key] === c ? ' on' : ''}" data-key="${key}" data-val="${c}" style="--c:${hex(c)}" aria-label="${hex(c)}"></button>`).join('');
    let html = row('لون البشرة', swatches('skin', SKIN_TONES));
    if (isGirl(type)) {
      html += row('لون الحجاب', swatches('hijab', HIJAB_COLORS));
    } else {
      html += row('لون الشعر', swatches('hair', HAIR_COLORS));
      html += row('التسريحة', HAIR_STYLES.map(s =>
        `<button type="button" class="wd-chip${look.hairStyle === s.id ? ' on' : ''}" data-key="hairStyle" data-val="${s.id}">${s.label}</button>`).join(''));
    }
    container.innerHTML = html;
    container.querySelectorAll('[data-key]').forEach(b => b.addEventListener('click', () => {
      audio.playClick();
      const key = b.dataset.key;
      const val = key === 'hairStyle' ? b.dataset.val : Number(b.dataset.val);
      this.setLook({ [key]: val }, type);
      this.renderAppearance(container, type);
      this.autosave();
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // Shop / wardrobe panel
  // ─────────────────────────────────────────────────────────────
  buildPanel() {
    const el = document.createElement('div');
    el.id = 'wardrobe-panel';
    el.innerHTML = `
      <div class="wd-head">
        <div>
          <h3 id="wd-title">متجر الملابس</h3>
          <span class="wd-coins">🪙 <b id="wd-coins">0</b></span>
        </div>
        <button type="button" class="wd-close" id="wd-close" aria-label="إغلاق">✕</button>
      </div>
      <div class="wd-tabs">
        <button type="button" class="wd-tab on" data-tab="clothes">👕 الملابس</button>
        <button type="button" class="wd-tab" data-tab="look">🎨 المظهر</button>
      </div>
      <div class="wd-body" id="wd-clothes"></div>
      <div class="wd-body" id="wd-look" hidden></div>
      <div class="wd-foot">🔄 اضغط على قطعة لتجربتها قبل الشراء</div>`;
    document.body.appendChild(el);
    this.panel = el;
    el.querySelector('#wd-close').addEventListener('click', () => this.close());
    el.querySelectorAll('.wd-tab').forEach(t => t.addEventListener('click', () => {
      audio.playClick();
      el.querySelectorAll('.wd-tab').forEach(x => x.classList.toggle('on', x === t));
      el.querySelector('#wd-clothes').hidden = t.dataset.tab !== 'clothes';
      el.querySelector('#wd-look').hidden = t.dataset.tab !== 'look';
    }));
    events.on('PROGRESSION_UPDATED', () => { if (this.isOpen) this.renderClothes(); });
  }

  /** mode: 'shop' (buy and wear) or 'home' (owned outfits only) */
  open(mode = 'shop') {
    this.mode = mode;
    this.isOpen = true;
    this.tryOn = null;
    this.panel.querySelector('#wd-title').textContent = mode === 'shop' ? '🛍️ متجر الأناقة للملابس' : '🚪 خزانة ملابسي';
    this.panel.querySelector('.wd-foot').hidden = mode !== 'shop';
    this.renderClothes();
    this.renderAppearance(this.panel.querySelector('#wd-look'));
    this.panel.classList.add('show');
    this.game.input.setEnabled(false);
    if (this.game.ui && this.game.ui.interactHint) this.game.ui.interactHint.style.visibility = 'hidden';
    events.emit('WARDROBE_OPENED', { mode });
  }

  close() {
    if (!this.isOpen) return;
    audio.playClick();
    this.isOpen = false;
    if (this.tryOn) { this.tryOn = null; this.refresh(); }
    this.panel.classList.remove('show');
    this.game.input.setEnabled(true);
    if (this.game.ui && this.game.ui.interactHint) this.game.ui.interactHint.style.visibility = '';
  }

  renderClothes() {
    const box = this.panel.querySelector('#wd-clothes');
    this.panel.querySelector('#wd-coins').textContent = this.game.progression.coins;
    const equipped = this.look().outfit;
    const list = this.mode === 'shop' ? OUTFITS : OUTFITS.filter(o => this.owned.has(o.id));
    box.innerHTML = list.map(o => {
      const owned = this.owned.has(o.id);
      const on = equipped === o.id;
      const previewing = this.tryOn === o.id;
      let action;
      if (on) action = '<span class="wd-state on">✓ ترتديه</span>';
      else if (owned) action = `<button type="button" class="wd-btn" data-act="equip" data-id="${o.id}">ارتداء</button>`;
      else action = `<button type="button" class="wd-btn buy${this.game.progression.coins < o.price ? ' poor' : ''}" data-act="buy" data-id="${o.id}">شراء 🪙 ${o.price}</button>`;
      return `<div class="wd-card${on ? ' equipped' : ''}${previewing ? ' trying' : ''}" data-id="${o.id}">
        <span class="wd-icon">${o.icon}</span>
        <div class="wd-info"><b>${o.name}</b><small>${o.category}${owned ? ' • تملكه' : ''}</small><p>${o.desc}</p></div>
        <div class="wd-act">${action}</div>
      </div>`;
    }).join('');
    box.querySelectorAll('.wd-card').forEach(card => card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'buy') {
        const r = this.buy(id);
        if (r === 'poor') {
          audio.playWrongAnswer();
          events.emit('TOAST', '🪙 رصيدك غير كافٍ: أكمل المهام والتحديات لتجمع المزيد من القطع النقدية.');
        }
      } else if (act && act.dataset.act === 'equip') {
        audio.playClick();
        this.equip(id);
      } else if (this.look().outfit !== id) {
        // Try on (no purchase): the real character wears it until the panel closes
        audio.playClick();
        this.tryOn = this.tryOn === id ? null : id;
        this.refresh();
      }
      this.renderClothes();
    }));
  }
}
