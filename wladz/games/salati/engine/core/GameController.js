/**
 * GameController - runs one Salati training session inside the WLADZ game shell.
 *
 * Responsibilities: mode selection, the 3D lesson (Learn), the step-order challenge (Challenge),
 * quiz dialogs, scoring, and the lifecycle of every timer, dialog and WebGL context.
 * The hub (GameShell) shows the introduction and the result; when a run ends, this controller
 * reports it once through `onFinish`. Every DOM lookup is scoped to `root`.
 */
import gsap from 'gsap';
import { ScoringEngine } from '../logic/ScoringEngine.js';
import { QuizEngine } from '../logic/QuizEngine.js';
import { PRAYER_STEPS } from '../data/prayerData.js';
import { DEFAULT_PRACTICE, sequenceFor, stepContent, PRAYER_SOURCES } from '../data/prayerPractice.js';
import { transitionScreen, showToast, createParticles, slideUp, prefersReducedMotion } from '../utils/animations.js';
import {
  buildModeScreen, buildGameScreen, renderGameControls, renderProgressSteps,
  updateGameUI, showLoading, hideLoading
} from '../ui/Screens.js';
import { openDialog } from '../ui/dialog.js';
import { createTimerBag } from './timers.js';
import { shuffleNotIdentity } from '../utils/random.js';

/** Game states. Step clicks are only accepted in IDLE; dialogs block the game behind them. */
const STATE = Object.freeze({
  IDLE: 'idle',             // waiting for the player to pick the next step
  STEP_POPUP: 'stepPopup',  // educational card is open
  ANIMATING: 'animating',   // pose transition / short delays
  QUIZ: 'quiz',             // quiz dialog is open
  COMPLETING: 'completing', // last step done, waiting for the final animation
  FINISHED: 'finished'      // run reported to the hub
});

// After the last step, the Learn figure finishes the salam head-turn (~2.6 s) before the run ends.
const COMPLETE_DELAY_MS = { learn: 600, challenge: 1200 };
// After this many wrong clicks on the same step, Learn mode explains and reveals the correct step.
const LEARN_REVEAL_AFTER = 2;

export class GameController {
  /**
   * @param {object} options
   * @param {HTMLElement} options.root          element owned by the game component
   * @param {number} options.maxPointsPerRun     from the game manifest
   * @param {(result: import('@/types/game').GameResult) => void} options.onFinish  called once per run
   * @param {() => void} options.onExit          called when the player leaves before the end
   */
  constructor({ root, maxPointsPerRun, onFinish, onExit }) {
    this.root = root;
    this.maxPointsPerRun = maxPointsPerRun;
    this.onFinish = onFinish;
    this.onExit = onExit;
    this.screens = {};
    this.currentScreen = null;

    // Systems
    this.sceneManager = null;
    this.scoringEngine = new ScoringEngine();
    this.quizEngine = new QuizEngine({ root });

    // Game state
    this.gameMode = null; // 'learn' | 'challenge'
    this.difficulty = 'easy';
    this.userSequence = [];
    this.timerInterval = null;
    this.elapsedTime = 0;
    this.gameState = STATE.IDLE;
    this.wrongOnCurrentStep = 0;
    this.stepDialog = null;
    this.finished = false;

    this.characterGender = 'boy';
    this.practice = { ...DEFAULT_PRACTICE };
    this.scope = 'movements';
    this.sequence = sequenceFor(this.scope);
    this.poseRun = 0;
    this.currentAction = null;

    // Lifecycle guards: every delayed callback is tracked and tied to the current run
    this.timers = createTimerBag();
    this.runId = 0;
    this.isStarting = false;
  }

  /** Builds the screens and shows the mode selection. Call once after construction. */
  init() {
    this.root.replaceChildren(); // a previous instance (e.g. Strict Mode re-mount) must leave nothing behind
    this.buildScreens();
    this.addParticles();
    this.showMode();
  }

  setState(next) {
    this.gameState = next;
    if (this.screens.game) this.screens.game.dataset.state = next;
  }

  buildScreens() {
    this.screens.mode = buildModeScreen(
      (mode, diff, scope, gender) => {
        if (gender) this.characterGender = gender;
        this.startGame(mode, diff, scope);
      },
      () => this.exitGame()
    );
    this.root.appendChild(this.screens.mode);

    this.screens.game = buildGameScreen(
      (idx) => this.handleStepClick(idx),
      () => this.exitGame(),
      {
        onCharacter: gender => this.switchCharacter(gender),
        onView: view => this.sceneManager?.setView(view),
        onReplay: () => this.currentAction && this.previewStep(PRAYER_STEPS.findIndex(s => s.id === this.currentAction), false),
        onSettings: () => this.showPracticeSettings()
      }
    );
    this.root.appendChild(this.screens.game);
  }

  addParticles() {
    const container = document.createElement('div');
    container.className = 'particles-container';
    this.root.appendChild(container);
    createParticles(container, 30);
  }

  // ===== SCREEN NAVIGATION =====
  showMode() {
    transitionScreen(this.root, this.currentScreen, this.screens.mode);
    this.currentScreen = this.screens.mode;
    this.screens.mode.collapseDeck?.();
    this.screens.mode.setCharacter?.(this.characterGender);
    if (prefersReducedMotion()) return;
    slideUp(this.screens.mode.querySelectorAll('.mode-title, .mode-subtitle'), 0.08);
    // The two cards deal in from below, back card first; the wrapper animates so the
    // cards' own 3D transforms (stack / fan) are never overwritten.
    gsap.fromTo(this.screens.mode.querySelector('#modeDeck'), { opacity: 0, y: 36, rotationX: 10, transformPerspective: 1200 },
      { opacity: 1, y: 0, rotationX: 0, duration: 0.65, ease: 'power3.out', delay: 0.12, clearProps: 'opacity,transform' });
  }

  // ===== GAME LIFECYCLE =====
  async startGame(mode, difficulty = 'easy', scope = this.scope) {
    if (this.isStarting) return; // ignore double taps while a start is in flight
    this.isStarting = true;
    this.cleanupGame(); this.isStarting = true; // fresh run: cancel timers, quiz, popups and any previous 3D scene
    const run = this.runId;
    this.gameMode = mode;
    this.difficulty = difficulty;
    this.scope = scope || 'movements';
    this.sequence = sequenceFor(this.scope);
    this.scoringEngine = new ScoringEngine(this.sequence.map(index => PRAYER_STEPS[index]));
    this.quizEngine.setDifficulty(difficulty);
    this.resetGameState();

    const loadingText = mode === 'learn' ? 'جاري تهيئة المشهد ثلاثي الأبعاد...' : 'جاري إعداد التحدي...';
    showLoading(this.root, loadingText);

    // Lazy-load WebGL only for the learning view.
    let SceneManager = null;
    try {
      if (mode === 'learn') ({ SceneManager } = await import('../scene/SceneManager.js'));
    } catch (error) {
      this.isStarting = false; hideLoading(this.root); showToast(this.root, 'تعذر تحميل المحاكاة. أعد المحاولة.', 'error');
      console.error(error); return;
    }
    if (run !== this.runId) { this.isStarting = false; hideLoading(this.root); return; }

    transitionScreen(this.root, this.currentScreen, this.screens.game, () => {
      this.isStarting = false;
      if (run !== this.runId) { hideLoading(this.root); return; }
      const container = this.screens.game.querySelector('#game3dContainer');
      const panel = this.screens.game.querySelector('.game-panel');
      const qibla = this.screens.game.querySelector('#qiblaIndicator');
      const challenge = this.gameMode === 'challenge';
      this.screens.game.classList.toggle('fullscreen-mode', challenge);
      if (this.gameMode === 'learn') {
        if (container) container.style.display = 'block';
        if (qibla) qibla.style.display = 'flex';
        if (panel) panel.classList.remove('challenge-panel');
        try { this.init3D(SceneManager); } catch (error) {
          container.dataset.contextLost = 'true';
          showToast(this.root, 'تعذر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز. تعليمات الحركات متاحة.', 'info');
          console.error(error);
        }
      } else {
        if (container) container.style.display = 'none';
        if (qibla) qibla.style.display = 'none';
        if (panel) panel.classList.add('challenge-panel');
        this.destroy3D();
      }
      this.renderGameUI();
      this.startTimer();
      hideLoading(this.root);
    });
    this.currentScreen = this.screens.game;
  }

  resetGameState() {
    this.userSequence = [];
    this.currentAction = null;
    this.elapsedTime = 0;
    this.wrongOnCurrentStep = 0;
    this.finished = false;
    this.setState(STATE.IDLE);
    this.scoringEngine.reset();
    this.timerInterval = null;
  }

  /** Cancels everything belonging to the current run. Safe to call at any time. */
  cleanupGame() {
    this.poseRun++;
    this.isStarting = false;
    this.runId++;                 // invalidates every pending callback
    this.timers.clearAll();       // popup delays, end-of-game, clock
    this.timerInterval = null;
    this.quizEngine.dispose();    // closes an open quiz and stops its timers
    if (this.stepDialog) { this.stepDialog.destroy(); this.stepDialog = null; }
    this.destroy3D();
    // Defensive: remove any stray popups or overlays inside this game only
    this.root.querySelectorAll('.overlay, .popup').forEach(el => el.remove());
    this.setState(STATE.IDLE);
  }

  /** Releases every resource this controller owns. Called when the game component unmounts. */
  destroy() {
    this.cleanupGame();
    this.root.replaceChildren();
  }

  destroy3D() {
    if (this.sceneManager) {
      this.sceneManager.destroy();
      this.sceneManager = null;
    }
  }

  init3D(SceneManager) {
    this.destroy3D(); // never keep two WebGL contexts alive
    const container = this.screens.game.querySelector('#game3dContainer');
    delete container.dataset.contextLost;
    this.sceneManager = new SceneManager(container, { gender: this.characterGender, settings: this.practice });
    this.screens.game.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === 'front')));
  }

  /**
   * The single seam between gameplay and the 3D figure. Everything the game asks the character to do
   * goes through here, so the character implementation can be replaced without touching game logic.
   */
  playPose(poseKey, durationSec = 1.0) {
    return this.sceneManager?.setCharacterPose(poseKey, durationSec) || Promise.resolve(true);
  }

  renderGameUI() {
    const controlsSection = this.screens.game.querySelector('#controlsSection');
    const progressSteps = this.screens.game.querySelector('#progressSteps');

    let indices = null;
    if (this.gameMode === 'challenge') {
      // Shuffled, and never the correct order itself
      indices = shuffleNotIdentity(PRAYER_STEPS.map((_, i) => i));
    }

    renderGameControls(controlsSection, (idx) => this.handleStepClick(idx), indices);
    renderProgressSteps(progressSteps, this.gameMode, this.sequence);
    this.switchCharacter(this.characterGender);
    this.screens.game.querySelector('#lessonScopeLabel').textContent = this.scope === 'two-rakah'
      ? 'تدريب على ترتيب صلاة من ركعتين' : 'تعلّم ٩ حركات • تمرين، وليس صلاة كاملة';
    this.refreshGameUI();
  }

  // ===== GAME LOGIC =====
  handleStepClick(index) {
    if (!PRAYER_STEPS[index]) return;
    if (this.gameMode === 'learn') { this.previewStep(index); return; }
    if (this.gameState !== STATE.IDLE) return;

    const run = this.runId;
    const step = stepContent(PRAYER_STEPS[index], this.practice);
    const expectedIndex = this.getNextExpectedIndex();

    if (index !== expectedIndex) {
      this.handleWrongStep(index, expectedIndex);
      return; // never progress on a wrong step, in any mode
    }

    // Correct step
    this.scoringEngine.recordStepDone(this.userSequence.length);
    this.userSequence.push(this.userSequence.length);
    this.wrongOnCurrentStep = 0;
    this.setState(STATE.STEP_POPUP);

    const hasQuiz = this.gameMode === 'challenge' && step.hasQuiz;

    this.showInfoPopup(step, () => {
      if (run !== this.runId) return;
      this.setState(STATE.ANIMATING);

      // Animate the character after the popup (Learn only: Challenge has no 3D scene)
      this.playPose(step.position, 1.0);

      if (hasQuiz) {
        this.timers.timeout(() => { if (run === this.runId) this.showQuiz(step.quizType); }, 800);
        return;
      }
      this.afterStepResolved(run);
    });
  }

  /** Wrong order: gentle feedback, never scored against speed, never advances. */
  handleWrongStep(clickedIndex, expectedIndex) {
    const wrongCount = this.scoringEngine.recordWrongClick(this.userSequence.length);
    this.wrongOnCurrentStep = wrongCount;

    const btn = this.screens.game.querySelector(`.control-btn[data-index="${clickedIndex}"]`);
    if (btn) {
      btn.classList.add('wrong');
      gsap.fromTo(btn, { x: 0 }, { x: 8, duration: 0.08, yoyo: true, repeat: 5, ease: 'power1.inOut', clearProps: 'x' });
      this.timers.timeout(() => btn.classList.remove('wrong'), 700);
    }

    const expected = PRAYER_STEPS[expectedIndex];
    if (this.gameMode === 'learn') {
      if (wrongCount >= LEARN_REVEAL_AFTER && expected) {
        // After two misses Learn mode explains and shows the right step.
        showToast(this.root, `الخطوة الآن هي «${expected.name}»: ${expected.description}`, 'info', 4500);
        const target = this.screens.game.querySelector(`.control-btn[data-index="${expectedIndex}"]`);
        if (target) target.classList.add('hint');
      } else {
        showToast(this.root, 'ليست هذه الخطوة. اقرأ التعليمات وحاول مرة أخرى', 'info', 2500);
      }
    } else {
      // Challenge: never reveal the correct order
      showToast(this.root, 'ليست هذه الخطوة الآن. فكّر في ترتيب الصلاة وحاول مرة أخرى', 'info', 2500);
    }
  }

  /** After a step (and its quiz, if any) is finished: complete the run or hand control back. */
  afterStepResolved(run) {
    if (this.userSequence.length === this.sequence.length) {
      this.setState(STATE.COMPLETING);
      this.refreshGameUI();
      this.timers.timeout(() => {
        if (run === this.runId) this.endGame();
      }, this.gameMode === 'learn' ? COMPLETE_DELAY_MS.learn : COMPLETE_DELAY_MS.challenge);
    } else {
      this.setState(STATE.IDLE);
      this.refreshGameUI();
    }
  }

  showInfoPopup(step, onClose) {
    const learn = this.gameMode === 'learn';
    // Step content is static, author-written data; it is not user input.
    let html = `<div class="dialog-title" id="infoTitle"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ${step.name}</div>`;

    if (learn) {
      html += `<div class="quiz-question">${step.instruction}</div>`;
      html += `<div class="quiz-hint">${step.subInstruction}</div>`;
      if (step.sunnah) html += `<div class="note note--sunnah"><strong>سنة:</strong> ${step.sunnah}</div>`;
      if (step.mistake) html += `<div class="note note--mistake"><strong>تجنّب الخطأ:</strong> ${step.mistake}</div>`;
    } else {
      html += `<div class="quiz-question">أحسنت! خطوة صحيحة</div>`;
      if (step.sunnah) html += `<div class="note note--sunnah"><strong>معلومة إضافية:</strong> ${step.sunnah}</div>`;
    }

    html += `<div class="dialog-actions">
      <button class="btn btn-primary" id="infoClose" data-autofocus>${learn ? 'متابعة الحركة' : 'متابعة'}</button>
      <button class="dialog-quit" id="infoQuit" type="button">إنهاء التدريب</button>
    </div>`;

    const dialog = openDialog({ root: this.root, id: 'infoPopup', titleId: 'infoTitle', html, reducedMotion: prefersReducedMotion() });
    this.stepDialog = dialog;

    let closing = false;
    dialog.card.querySelector('#infoClose').addEventListener('click', () => {
      if (closing) return;
      closing = true;
      dialog.close(() => {
        if (this.stepDialog === dialog) this.stepDialog = null;
        onClose();
      });
    });
    dialog.card.querySelector('#infoQuit').addEventListener('click', () => this.exitGame());
  }

  showQuiz(quizType) {
    this.setState(STATE.QUIZ);
    this.refreshGameUI();

    const run = this.runId;
    this.quizEngine.reducedMotion = prefersReducedMotion();
    this.quizEngine.open(quizType, (result) => {
      if (run !== this.runId) return;
      this.scoringEngine.recordQuizResult(quizType, result);
      this.setState(STATE.ANIMATING);
      this.afterStepResolved(run);
    }, { onQuit: () => this.exitGame() });
  }

  getNextExpectedIndex() { return this.sequence[this.userSequence.length] ?? -1; }

  async previewStep(index, allowAdvance = true) {
    if (this.stepDialog || ![STATE.IDLE, STATE.ANIMATING].includes(this.gameState)) return;
    const run = this.runId, poseRun = ++this.poseRun;
    const step = stepContent(PRAYER_STEPS[index], this.practice);
    const advances = allowAdvance && index === this.getNextExpectedIndex();
    this.currentAction = step.id;
    this.setState(STATE.ANIMATING); this.refreshGameUI();
    const done = await this.playPose(step.position, 1.0);
    if (!done || run !== this.runId || poseRun !== this.poseRun) return;
    if (advances) {
      this.scoringEngine.recordStepDone(this.userSequence.length);
      this.userSequence.push(this.userSequence.length);
    }
    this.afterStepResolved(run);
  }

  switchCharacter(gender) {
    if (!['boy', 'girl'].includes(gender)) return;
    this.characterGender = gender;
    this.sceneManager?.setCharacter(gender);
    this.screens.game.querySelectorAll('[data-character]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.character === gender));
    });
    const stage = this.screens.game.querySelector('#game3dContainer');
    stage.classList.remove('character-changed');
    void stage.offsetWidth; stage.classList.add('character-changed');
  }

  showPracticeSettings() {
    if (this.stepDialog) return;
    // Static, author-written markup (the source list is built from PRAYER_SOURCES, a constant).
    const html = `<h2 id="practiceTitle">هيئة الصلاة ومراجع التعلّم</h2>
      <p class="settings-intro">الخيارات الموسومة «المالكي» تتبع العرض المالكي للمنفرد، وتوجد هيئات معتبرة أخرى. الإعداد الافتراضي هيئة مختارة لهذا الدرس؛ غيّره مع معلّمك عند الحاجة.</p>
      <label class="setting-field">رفع اليدين في التكبير<select id="practiceRaise"><option value="shoulders">حذو المنكبين، ظهور الكفين إلى السماء — العرض المالكي</option><option value="shoulders-qibla">حذو المنكبين، الكفان إلى القبلة</option><option value="ears">حذو الأذنين، الكفان إلى القبلة</option></select></label>
      <label class="setting-field">اليدان في القيام<select id="practiceHands"><option value="sadl">السدل — إرسال اليدين</option><option value="qabd">القبض — اليمنى على اليسرى</option></select></label>
      <label class="setting-field">هيئة الجلوس<select id="practiceSitting"><option value="tawarruk">التورك — العرض المالكي</option><option value="iftirash">الافتراش — هيئة أخرى</option></select></label>
      <label class="setting-field">السبابة في التشهد<select id="practiceTahrik"><option value="move">الإشارة بها مع تحريكها — قول ابن القاسم (المالكية)</option><option value="still">الإشارة بها دون تحريك — هيئة أخرى</option></select></label>
      <label class="setting-field">التسليم<select id="practiceTaslim"><option value="single">تسليمة واحدة — المنفرد المالكي</option><option value="double">تسليمتان — هيئة أخرى</option></select></label>
      <p class="settings-note">هذه محاكاة تعليمية مبسطة، وليست فتوى أو تقييماً لصحة الصلاة. الشخصيتان طفلان؛ لباس المرأة البالغة وتفاصيل هيئاتها تُراجع مع المعلّم.</p>
      <details><summary>المراجع وحدود الدرس</summary><p>تدرّب على الحركات بهدوء. توقيت الرسوم ليس مدة القراءة أو الذكر. تمرين الحركات التسع لا يمثل صلاة كاملة. خيار الركعتين يكرر الركعة قبل التشهد والسلام، ولا يشرح جميع شروط الصلاة أو أحكام الجماعة.</p>
      <ul>${PRAYER_SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a></li>`).join('')}</ul>
      <p>تحتاج التفاصيل الدقيقة لحركة السبابة ورفع اليدين وستر القدمين إلى مراجعة تربوية من معلّم مالكي مؤهل.</p></details>
      <button class="btn btn-primary" id="practiceSave" data-autofocus>حفظ والعودة</button>`;
    this.stepDialog = openDialog({ root: this.root, id: 'practicePopup', titleId: 'practiceTitle', html, reducedMotion: prefersReducedMotion() });
    const dialog = this.stepDialog;
    dialog.card.querySelector('#practiceRaise').value = this.practice.raise;
    dialog.card.querySelector('#practiceHands').value = this.practice.hands;
    dialog.card.querySelector('#practiceSitting').value = this.practice.sitting;
    dialog.card.querySelector('#practiceTaslim').value = this.practice.taslim;
    dialog.card.querySelector('#practiceTahrik').value = this.practice.tahrik;
    dialog.card.querySelector('#practiceSave').addEventListener('click', () => {
      this.practice.raise = dialog.card.querySelector('#practiceRaise').value;
      this.practice.hands = dialog.card.querySelector('#practiceHands').value;
      this.practice.sitting = dialog.card.querySelector('#practiceSitting').value;
      this.practice.taslim = dialog.card.querySelector('#practiceTaslim').value;
      this.practice.tahrik = dialog.card.querySelector('#practiceTahrik').value;
      dialog.close(() => {
        this.stepDialog = null;
        if (this.sceneManager) {
          this.sceneManager.character.animator.settings = { ...this.practice };
          if (this.currentAction) this.previewStep(PRAYER_STEPS.findIndex(s => s.id === this.currentAction), false);
          else this.sceneManager.setCharacterPose('qiyam', 0.5);
        }
        this.refreshGameUI();
      });
    });
  }

  refreshGameUI() {
    const nextExpected = this.getNextExpectedIndex();
    const nextStep = nextExpected >= 0 ? stepContent(PRAYER_STEPS[nextExpected], this.practice) : null;
    const current = this.currentAction ? stepContent(PRAYER_STEPS.find(s => s.id === this.currentAction), this.practice) : null;
    const displayed = this.gameMode === 'learn' && current ? current : nextStep;
    const stage = this.screens.game.querySelector('#game3dContainer');
    stage.dataset.action = this.currentAction || 'ready';
    this.screens.game.querySelector('#poseLabel').textContent = current ? current.name : 'مستعدون للتعلّم';
    this.screens.game.querySelector('#poseStatus').textContent = this.gameState === STATE.ANIMATING ? 'شاهد الحركة…' : 'اختر حركة لمشاهدتها أو إعادتها';
    this.screens.game.querySelector('#nextStepLabel').textContent = this.gameMode === 'challenge'
      ? `الخطوة ${Math.min(this.userSequence.length + 1, this.sequence.length)} من ${this.sequence.length}`
      : nextStep ? `التالي في الترتيب: ${nextStep.name}` : 'أكملت الترتيب';
    this.screens.game.querySelector('.lesson-tools').hidden = this.gameMode === 'challenge';
    this.screens.game.querySelector('#practiceSettings').disabled = ![STATE.IDLE].includes(this.gameState);
    this.screens.game.querySelector('#replayPose').disabled = !current || ![STATE.IDLE, STATE.ANIMATING].includes(this.gameState);

    // Clear the Learn hint highlight whenever the expected step changes
    this.screens.game.querySelectorAll('.control-btn.hint').forEach(b => {
      if (parseInt(b.dataset.index, 10) !== nextExpected || this.wrongOnCurrentStep < LEARN_REVEAL_AFTER) b.classList.remove('hint');
    });

    updateGameUI(this.screens.game, {
      mode: this.gameMode,
      sequence: this.sequence,
      activeAction: this.currentAction,
      busy: this.gameState !== STATE.IDLE,
      currentStepIndex: nextExpected,
      userSequence: this.userSequence,
      stepTimings: [],
      instruction: displayed ? {
        icon: displayed.icon,
        text: this.gameMode === 'learn' ? displayed.instruction : 'اختر الخطوة التالية',
        sub: this.gameMode === 'learn' ? displayed.subInstruction : `خطوة ${this.userSequence.length + 1} من ${this.sequence.length}`,
        dhikr: null,
        active: true
      } : { icon: 'fa-circle-check', text: 'أكملت جميع الخطوات!', sub: 'جاري تجهيز النتيجة...', active: true },
      isQuizActive: this.gameState === STATE.QUIZ
    });
  }

  startTimer() {
    const display = this.screens.game.querySelector('#timerDisplay');
    this.elapsedTime = 0;

    if (display) { display.classList.remove('warning'); display.textContent = '00:00'; }
    this.timerInterval = this.timers.interval(() => {
      this.elapsedTime++;
      const m = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
      const s = (this.elapsedTime % 60).toString().padStart(2, '0');
      if (display) display.textContent = `${m}:${s}`;
    }, 1000);
  }

  /** Last step done: stop the clock, free the 3D scene and report the run once. */
  endGame() {
    if (this.timerInterval) {
      this.timers.clear(this.timerInterval);
      this.timerInterval = null;
    }
    this.setState(STATE.FINISHED);
    this.destroy3D();

    this.scoringEngine.setTotalTime(this.elapsedTime);
    const result = this.scoringEngine.calculateFinal();
    this.finish(result);
  }

  /**
   * Converts the run into a GameResult. Challenge awards points by its score (0-100).
   * Learn has no quiz and no penalty for watching, so it awards points by completed steps.
   */
  finish(result) {
    if (this.finished) return;
    this.finished = true;
    const ratio = this.gameMode === 'challenge'
      ? result.score / 100
      : this.userSequence.length / this.sequence.length;
    this.onFinish({
      score: result.score,
      pointsEarned: Math.round(ratio * this.maxPointsPerRun),
      completed: true,
      durationMs: this.elapsedTime * 1000
    });
  }

  /** Player leaves the game: cancel the run and hand control back to the hub. */
  exitGame() {
    this.cleanupGame();
    this.onExit();
  }
}
