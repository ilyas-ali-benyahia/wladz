import { events } from '../../core/EventBus.js';
import { audio } from '../AudioSystem.js';

/**
 * Reusable facility activity framework (football training, swimming school, ...).
 *
 * An activity: { id, title, icon, giver, intro, stages: [...], freePlay? }
 * A stage:     { id, title, brief, objective, reward: { xp, coins }, timeLimit?, best?: { label, better: 'lower'|'higher', unit },
 *                quiz?: [{ q, options, answer, why }], setup(ctx), update(dt, ctx) -> { progress, text, done, failed, score }, cleanup(ctx) }
 * Stages unlock in order; results (completion, personal bests) are saved. Failing or leaving a stage cleans it up and
 * keeps all earlier progress, so a retry always starts from a clean state.
 */
export class ActivitySystem {
  constructor(game) {
    this.game = game;
    this.defs = {};
    this.state = {}; // id -> { unlocked, done: {stageId: true}, best: {stageId: number} }
    this.active = null;
    this.buildHud();
    this.buildMenu();
    this.buildQuiz();
  }

  register(def) {
    this.defs[def.id] = def;
    if (!this.state[def.id]) this.state[def.id] = { unlocked: 0, done: {}, best: {} };
  }

  stageCount(id) { return this.defs[id].stages.length; }
  isDone(id, stageId) { return !!this.state[id].done[stageId]; }
  unlockedIndex(id) { return this.state[id].unlocked; }

  // ─────────────────────────────────────────────────────────────
  // Running a stage
  // ─────────────────────────────────────────────────────────────
  start(id, index) {
    const def = this.defs[id];
    const st = this.state[id];
    if (index > st.unlocked || !def.stages[index]) return false;
    this.stop(true);
    const stage = def.stages[index];
    const ctx = { game: this.game, def, stage, index, time: 0, data: {} };
    this.active = { def, stage, index, ctx, free: false };
    if (stage.setup) stage.setup(ctx);
    audio.playClick();
    if (def.onStart) def.onStart(ctx);
    events.emit('TOAST', `${def.icon} ${stage.title}: ${stage.brief}`);
    if (stage.quiz) this.openQuiz(stage, ctx);
    this.showHud(true);
    events.emit('ACTIVITY_STARTED', { id, stage: stage.id });
    return true;
  }

  startFreePlay(id) {
    const def = this.defs[id];
    if (!def.freePlay) return;
    this.stop(true);
    const ctx = { game: this.game, def, time: 0, data: {} };
    this.active = { def, stage: def.freePlay, index: -1, ctx, free: true };
    def.freePlay.setup(ctx);
    events.emit('TOAST', `${def.icon} ${def.freePlay.title}: ${def.freePlay.brief}`);
    this.showHud(true);
  }

  /** Leave the current stage without result (silent when switching or leaving the area) */
  stop(silent = false) {
    if (!this.active) return;
    const { stage, ctx } = this.active;
    if (stage.cleanup) stage.cleanup(ctx);
    this.active = null;
    this.closeQuiz();
    this.showHud(false);
    if (!silent) events.emit('TOAST', '⏹️ أوقفت التحدي. تحدّث مع المدرّب متى شئت لاستئنافه.');
  }

  update(dt) {
    const a = this.active;
    if (!a) return;
    const { stage, ctx } = a;
    ctx.time += dt;
    if (this.quizOpen) { this.renderHud({ text: 'أجب عن أسئلة المدرّب' }); return; }
    const r = stage.update ? stage.update(dt, ctx) || {} : {};
    if (!a.free && stage.timeLimit && ctx.time > stage.timeLimit && !r.done) r.failed = '⏱️ انتهى الوقت!';
    this.renderHud(r);
    if (a.free) return;
    if (r.failed) this.fail(r.failed);
    else if (r.done) this.complete(r);
  }

  complete(r) {
    const { def, stage, index, ctx } = this.active;
    const st = this.state[def.id];
    if (stage.cleanup) stage.cleanup(ctx);
    this.active = null;
    this.showHud(false);
    const first = !st.done[stage.id];
    st.done[stage.id] = true;
    st.unlocked = Math.max(st.unlocked, Math.min(index + 1, def.stages.length - 1));
    // Personal best
    let bestNote = '';
    if (stage.best && typeof r.score === 'number') {
      const prev = st.best[stage.id];
      const better = prev === undefined || (stage.best.better === 'lower' ? r.score < prev : r.score > prev);
      if (better) { st.best[stage.id] = r.score; bestNote = ` 🏅 رقم شخصي جديد: ${this.formatBest(stage, r.score)}`; }
    }
    // Full reward the first time, a smaller one for repeats
    const k = first ? 1 : 0.3;
    const xp = Math.round((stage.reward?.xp || 0) * k), coins = Math.round((stage.reward?.coins || 0) * k);
    if (xp) this.game.progression.addXP(xp);
    if (coins) this.game.progression.addCoins(coins);
    audio.playMissionComplete();
    const next = def.stages[index + 1];
    events.emit('TOAST', `✅ ${stage.title}: أحسنت! +${xp} XP +${coins} 🪙${bestNote}`);
    if (first && next) setTimeout(() => events.emit('TOAST', `🔓 مرحلة جديدة: «${next.title}». تحدّث مع ${def.giver} لتبدأها.`), 2200);
    if (first && !next) setTimeout(() => events.emit('TOAST', `🏆 أتممت كل مراحل ${def.title}! ${def.finale || ''}`), 2200);
    events.emit('ACTIVITY_STAGE_DONE', { id: def.id, stage: stage.id, first, score: r.score });
    if (def.onStageDone) def.onStageDone(stage, index, first);
    if (this.game.saveCurrentGame && this.game.isGameActive) this.game.saveCurrentGame();
  }

  fail(msg) {
    const { def, stage, ctx } = this.active;
    if (stage.cleanup) stage.cleanup(ctx);
    this.active = null;
    this.showHud(false);
    audio.playWrongAnswer();
    events.emit('TOAST', `${msg} لا بأس، تحدّث مع ${def.giver} لإعادة المحاولة.`);
    events.emit('ACTIVITY_FAILED', { id: def.id, stage: stage.id });
  }

  formatBest(stage, v) {
    return stage.best.unit === 's' ? `${v.toFixed(1)} ث` : `${v} ${stage.best.unit || ''}`.trim();
  }

  getState() { return JSON.parse(JSON.stringify(this.state)); }
  loadState(s) {
    if (!s) return;
    Object.keys(s).forEach(id => {
      const v = s[id];
      if (!v) return;
      this.state[id] = { unlocked: Math.max(0, v.unlocked | 0), done: { ...(v.done || {}) }, best: { ...(v.best || {}) } };
      if (this.defs[id]) this.state[id].unlocked = Math.min(this.state[id].unlocked, this.defs[id].stages.length - 1);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HUD: title, stage, objective, progress bar, timer
  // ─────────────────────────────────────────────────────────────
  buildHud() {
    const el = document.createElement('div');
    el.id = 'activity-hud';
    el.innerHTML = `<div class="ac-top"><span class="ac-title" id="ac-title"></span><span class="ac-timer" id="ac-timer"></span></div>
      <div class="ac-obj" id="ac-obj"></div><div class="ac-bar"><div class="ac-fill" id="ac-fill"></div></div>`;
    document.body.appendChild(el);
    this.hud = el;
  }

  showHud(on) {
    this.hud.classList.toggle('show', on);
  }

  renderHud(r) {
    const a = this.active;
    if (!a) return;
    const { def, stage, index, ctx } = a;
    const title = a.free ? `${def.icon} ${stage.title}` : `${def.icon} ${def.title} • ${index + 1}/${def.stages.length}: ${stage.title}`;
    const set = (id, v) => { const e = this.hud.querySelector(id); if (e.textContent !== v) e.textContent = v; };
    set('#ac-title', title);
    set('#ac-obj', r.text || stage.objective || '');
    const t = !a.free && stage.timeLimit ? Math.max(0, stage.timeLimit - ctx.time) : null;
    set('#ac-timer', t !== null ? `⏱️ ${Math.ceil(t)}` : '');
    this.hud.querySelector('#ac-timer').classList.toggle('low', t !== null && t < 10);
    this.hud.querySelector('#ac-fill').style.width = `${Math.round(Math.min(1, Math.max(0, r.progress || 0)) * 100)}%`;
  }

  // ─────────────────────────────────────────────────────────────
  // Giver menu: intro, stage list (locked / done / best), start, free play
  // ─────────────────────────────────────────────────────────────
  buildMenu() {
    const el = document.createElement('div');
    el.id = 'activity-menu';
    el.className = 'modal-overlay';
    el.innerHTML = '<div class="ac-card"><div class="ac-head"><span class="ac-avatar" id="acm-icon"></span><div><h3 id="acm-title"></h3><small id="acm-giver"></small></div><button type="button" class="wd-close" id="acm-close">✕</button></div><p class="ac-intro" id="acm-intro"></p><div class="ac-list" id="acm-list"></div><div class="ac-foot" id="acm-foot"></div></div>';
    document.body.appendChild(el);
    this.menu = el;
    el.querySelector('#acm-close').addEventListener('click', () => this.closeMenu());
  }

  openMenu(id) {
    const def = this.defs[id];
    const st = this.state[id];
    this.menuId = id;
    const m = this.menu;
    m.querySelector('#acm-icon').textContent = def.icon;
    m.querySelector('#acm-title').textContent = def.title;
    m.querySelector('#acm-giver').textContent = def.giver;
    m.querySelector('#acm-intro').textContent = def.intro;
    m.querySelector('#acm-list').innerHTML = def.stages.map((s, i) => {
      const locked = i > st.unlocked;
      const done = st.done[s.id];
      const best = st.best[s.id] !== undefined && s.best ? `<span class="ac-best">🏅 ${s.best.label}: ${this.formatBest(s, st.best[s.id])}</span>` : '';
      const btn = locked ? '<span class="ac-lock">🔒 مقفلة</span>' : `<button type="button" class="wd-btn${done ? '' : ' buy'}" data-stage="${i}">${done ? 'إعادة' : 'ابدأ'}</button>`;
      return `<div class="ac-stage${locked ? ' locked' : ''}${done ? ' done' : ''}"><span class="ac-num">${done ? '✓' : i + 1}</span><div class="ac-info"><b>${s.title}</b><small>${s.brief}</small>${best}</div>${btn}</div>`;
    }).join('');
    const active = this.active && this.active.def.id === id;
    m.querySelector('#acm-foot').innerHTML =
      (def.freePlay ? `<button type="button" class="wd-btn" id="acm-free">${def.freePlay.title}</button>` : '') +
      (active ? '<button type="button" class="wd-btn poor" id="acm-stop">إيقاف التحدي الحالي</button>' : '');
    m.querySelectorAll('[data-stage]').forEach(b => b.addEventListener('click', () => { this.closeMenu(); this.start(id, +b.dataset.stage); }));
    const free = m.querySelector('#acm-free');
    if (free) free.addEventListener('click', () => { this.closeMenu(); this.startFreePlay(id); });
    const stop = m.querySelector('#acm-stop');
    if (stop) stop.addEventListener('click', () => { this.closeMenu(); this.stop(); });
    m.classList.add('show');
    this.menuOpen = true;
    this.game.input.setEnabled(false);
  }

  closeMenu() {
    if (!this.menuOpen) return;
    this.menu.classList.remove('show');
    this.menuOpen = false;
    this.game.input.setEnabled(true);
  }

  // ─────────────────────────────────────────────────────────────
  // Quiz stages (one question at a time; a wrong answer explains why and lets the player try again)
  // ─────────────────────────────────────────────────────────────
  buildQuiz() {
    const el = document.createElement('div');
    el.id = 'activity-quiz';
    el.className = 'modal-overlay';
    el.innerHTML = '<div class="ac-card"><div class="ac-head"><span class="ac-avatar" id="acq-icon"></span><div><h3 id="acq-title"></h3><small id="acq-count"></small></div></div><p class="ac-q" id="acq-q"></p><div class="ac-options" id="acq-opts"></div><p class="ac-why" id="acq-why"></p></div>';
    document.body.appendChild(el);
    this.quiz = el;
  }

  openQuiz(stage, ctx) {
    ctx.data.q = 0;
    this.quizOpen = true;
    this.game.input.setEnabled(false);
    this.quiz.classList.add('show');
    this.renderQuestion(stage, ctx);
  }

  renderQuestion(stage, ctx) {
    const q = stage.quiz[ctx.data.q];
    const el = this.quiz;
    el.querySelector('#acq-icon').textContent = this.active.def.icon;
    el.querySelector('#acq-title').textContent = stage.title;
    el.querySelector('#acq-count').textContent = `السؤال ${ctx.data.q + 1} من ${stage.quiz.length}`;
    el.querySelector('#acq-q').textContent = q.q;
    el.querySelector('#acq-why').textContent = '';
    if (q.onShow) q.onShow(ctx);
    const box = el.querySelector('#acq-opts');
    box.innerHTML = q.options.map((o, i) => `<button type="button" class="ac-opt" data-i="${i}">${o}</button>`).join('');
    box.querySelectorAll('.ac-opt').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i === q.answer) {
        audio.playCorrectAnswer();
        b.classList.add('right');
        el.querySelector('#acq-why').textContent = '✅ ' + (q.right || 'إجابة صحيحة!');
        setTimeout(() => {
          ctx.data.q++;
          if (ctx.data.q >= stage.quiz.length) { this.closeQuiz(); ctx.data.quizDone = true; } else this.renderQuestion(stage, ctx);
        }, 1400);
      } else {
        audio.playWrongAnswer();
        b.classList.add('wrong');
        el.querySelector('#acq-why').textContent = '💡 ' + q.why;
      }
    }));
  }

  closeQuiz() {
    if (!this.quizOpen) return;
    this.quizOpen = false;
    this.quiz.classList.remove('show');
    this.game.input.setEnabled(true);
  }
}
