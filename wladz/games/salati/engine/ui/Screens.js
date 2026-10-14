/**
 * UI screens for the Salati game: mode selection, the 3D lesson screen and the
 * control panel. Every element is built inside the game root and queried from it.
 */
import { PRAYER_STEPS } from '../data/prayerData.js';
import { MOVEMENT_SEQUENCE } from '../data/prayerPractice.js';

// ===== MODE SCREEN =====
/**
 * Two equal 3D cards stacked one on the other; the back card's title row always peeks out.
 * Wide screens: hover / keyboard focus / first tap fans them side by side.
 * Portrait phones: tapping (or tabbing into) the back card brings it to the front.
 */
export function buildModeScreen(onSelectMode, onBack) {
  const screen = document.createElement('div');
  screen.className = 'screen mode-screen';
  screen.id = 'modeScreen';
  screen.innerHTML = `
    <button class="back-btn" id="modeBackBtn" aria-label="رجوع"><i class="fa-solid fa-arrow-right"></i></button>
    <h2 class="mode-title">اختر وضع التدريب</h2>
    <p class="mode-subtitle">حدد الوضع المناسب لمستواك</p>
    <div class="mode-deck" id="modeDeck" data-front="learn" role="group" aria-label="اختر وضع التدريب">
      <article class="mode-card learn-mode" id="learnModeCard" aria-labelledby="learnTitle">
        <header class="mode-card-head">
          <span class="mode-icon-wrap" aria-hidden="true"><i class="fa-solid fa-cube"></i></span>
          <span class="mode-card-titles"><h3 id="learnTitle">وضع التعلم</h3><span class="mode-kicker">محاكاة ثلاثية الأبعاد</span></span>
        </header>
        <p class="mode-desc">شاهد كل حركة من حركات الصلاة في المسجد خطوة بخطوة، مع إرشاد واضح.</p>
        <div class="mode-meta">
          <span class="mode-tag"><i class="fa-solid fa-child" aria-hidden="true"></i> للمبتدئين</span>
          <span class="mode-tag"><i class="fa-solid fa-hand-holding-hand" aria-hidden="true"></i> مع إرشاد</span>
        </div>
        <ul class="mode-points">
          <li><i class="fa-solid fa-list-ol" aria-hidden="true"></i> تعلّم الخطوات بالترتيب</li>
          <li><i class="fa-solid fa-rotate" aria-hidden="true"></i> أعد أي حركة متى شئت</li>
          <li><i class="fa-solid fa-camera" aria-hidden="true"></i> زاوية أمامية وجانبية</li>
        </ul>
        <div class="choice-group" id="characterChoice" role="radiogroup" aria-label="الشخصية">
          <button class="choice-btn active" data-choose-character="boy" role="radio" aria-checked="true" type="button"><i class="fa-solid fa-child" aria-hidden="true"></i> ولد</button>
          <button class="choice-btn" data-choose-character="girl" role="radio" aria-checked="false" type="button"><i class="fa-solid fa-child-dress" aria-hidden="true"></i> بنت</button>
        </div>
        <p class="choice-desc">اختر الشخصية التي تؤدي الحركات.</p>
        <button class="btn btn-primary mode-start" id="learnStartBtn" type="button"><i class="fa-solid fa-play" aria-hidden="true"></i> ابدأ التعلّم</button>
      </article>
      <article class="mode-card challenge-mode" id="challengeModeCard" aria-labelledby="challengeTitle">
        <header class="mode-card-head">
          <span class="mode-icon-wrap" aria-hidden="true"><i class="fa-solid fa-trophy"></i></span>
          <span class="mode-card-titles"><h3 id="challengeTitle">وضع التحدي</h3><span class="mode-kicker">أسئلة وأذكار</span></span>
        </header>
        <p class="mode-desc">رتّب خطوات الصلاة بنفسك وأجب عن أسئلة الأذكار، ثم راجع ما يحتاج إلى تدريب.</p>
        <div class="mode-meta">
          <span class="mode-tag"><i class="fa-solid fa-user-graduate" aria-hidden="true"></i> للمتقدمين</span>
          <span class="mode-tag"><i class="fa-solid fa-brain" aria-hidden="true"></i> مع أسئلة</span>
        </div>
        <ul class="mode-points">
          <li><i class="fa-solid fa-shuffle" aria-hidden="true"></i> الأزرار بترتيب عشوائي</li>
          <li><i class="fa-solid fa-book-quran" aria-hidden="true"></i> أكمل أذكار الصلاة</li>
          <li><i class="fa-solid fa-star" aria-hidden="true"></i> نتيجة ونجوم ومراجعة</li>
        </ul>
        <div class="choice-group difficulty-selector" id="difficultySelector" role="radiogroup" aria-label="مستوى الصعوبة">
          <button class="choice-btn difficulty-btn active" data-diff="easy" role="radio" aria-checked="true" type="button">سهل</button>
          <button class="choice-btn difficulty-btn" data-diff="medium" role="radio" aria-checked="false" type="button">متوسط</button>
          <button class="choice-btn difficulty-btn" data-diff="hard" role="radio" aria-checked="false" type="button">صعب</button>
        </div>
        <p class="choice-desc difficulty-desc" id="difficultyDesc" aria-live="polite">أسئلة اختيار من متعدد مع تلميح.</p>
        <button class="btn btn-primary mode-start" id="challengeStartBtn" type="button"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ابدأ التحدي</button>
      </article>
    </div>
    <p class="mode-deck-hint" id="modeDeckHint" aria-hidden="true">
      <span class="hint-hover"><i class="fa-solid fa-computer-mouse"></i> مرّر المؤشر على البطاقات لعرض الوضعين</span>
      <span class="hint-touch"><i class="fa-solid fa-hand-pointer"></i> المس البطاقات لعرض الوضعين</span>
      <span class="hint-swap"><i class="fa-solid fa-hand-pointer"></i> المس البطاقة الخلفية لإظهارها</span>
    </p>
  `;

  screen.querySelector('#modeBackBtn').addEventListener('click', onBack);

  const deck = screen.querySelector('#modeDeck');
  const cards = { learn: screen.querySelector('#learnModeCard'), challenge: screen.querySelector('#challengeModeCard') };
  const swapLayout = window.matchMedia('(max-width: 699px) and (orientation: portrait)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastPointerType = 'mouse';
  let swapTimer = null;

  const setOpen = (open) => { deck.classList.toggle('is-open', open); deck.dataset.open = String(open); };
  const syncInert = () => {
    // Only the front card's controls are reachable while the cards are stacked on a phone.
    for (const [name, card] of Object.entries(cards)) {
      const back = swapLayout.matches && deck.dataset.front !== name;
      card.querySelectorAll('button').forEach(b => { b.tabIndex = back ? -1 : (b.classList.contains('choice-btn') && !b.classList.contains('active') ? -1 : 0); });
      card.setAttribute('aria-hidden', 'false');
    }
  };
  const setFront = (name) => {
    if (deck.dataset.front === name || swapTimer) return;
    const leaving = cards[deck.dataset.front];
    const finish = () => { swapTimer = null; leaving.classList.remove('is-leaving'); deck.dataset.front = name; syncInert(); };
    if (reducedMotion.matches) { finish(); return; }
    // Phase 1: the front card drops toward the viewer; phase 2: the cards change places.
    leaving.classList.add('is-leaving');
    swapTimer = setTimeout(finish, 230);
  };

  deck.addEventListener('pointerdown', (e) => { lastPointerType = e.pointerType || 'mouse'; }, true);
  deck.addEventListener('click', (e) => {
    const card = e.target.closest('.mode-card');
    if (!card) return;
    const name = card === cards.learn ? 'learn' : 'challenge';
    if (swapLayout.matches) {
      // A tap on the back card only brings it forward; it never presses a half-hidden button.
      // (detail === 0: keyboard / screen-reader activation goes straight through.)
      if (deck.dataset.front !== name && e.detail > 0) { e.preventDefault(); e.stopPropagation(); setFront(name); }
      return;
    }
    if (deck.classList.contains('is-open')) return;
    // detail === 0 means a keyboard-activated click: let it through (focus already spread the deck)
    if (e.detail > 0 && lastPointerType !== 'mouse') { e.preventDefault(); e.stopPropagation(); setOpen(true); }
  }, true);
  deck.addEventListener('focusin', (e) => {
    let keyboard = true;
    try { keyboard = e.target.matches(':focus-visible'); } catch { /* old browsers */ }
    if (!keyboard) return;
    const card = e.target.closest('.mode-card');
    if (swapLayout.matches) { if (card) setFront(card === cards.learn ? 'learn' : 'challenge'); }
    else setOpen(true);
  });
  swapLayout.addEventListener('change', syncInert);
  screen.collapseDeck = () => { setOpen(false); clearTimeout(swapTimer); swapTimer = null; cards.learn.classList.remove('is-leaving'); cards.challenge.classList.remove('is-leaving'); deck.dataset.front = 'learn'; syncInert(); };

  // Radio-style groups (character, difficulty): arrow keys move, click selects.
  const radioGroup = (group, onChange) => {
    const buttons = [...group.querySelectorAll('.choice-btn')];
    const select = btn => {
      buttons.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-checked', String(on)); });
      syncInert(); onChange(btn);
    };
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => select(btn));
      btn.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const delta = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? 1 : -1;
        const next = buttons[(index + delta + buttons.length) % buttons.length];
        select(next); next.focus();
      });
    });
    return select;
  };
  const DIFF_TEXT = {
    easy: 'أسئلة اختيار من متعدد مع تلميح.',
    medium: 'اكتب الكلمة الناقصة. يظهر التلميح بعد أول خطأ.',
    hard: 'اكتب الكلمة الناقصة خلال 30 ثانية لكل محاولة.'
  };
  radioGroup(screen.querySelector('#difficultySelector'), btn => { screen.querySelector('#difficultyDesc').textContent = DIFF_TEXT[btn.dataset.diff]; });
  const selectCharacter = radioGroup(screen.querySelector('#characterChoice'), () => {});
  screen.setCharacter = gender => {
    const btn = screen.querySelector(`[data-choose-character="${gender}"]`);
    if (btn) selectCharacter(btn);
  };

  // Only the explicit buttons start a game (a stray tap on a card must not).
  const scope = () => 'movements'; // the nine-movement lesson (the scope picker was removed from this screen)
  screen.querySelector('#learnStartBtn').addEventListener('click', () => {
    onSelectMode('learn', 'easy', scope(), screen.querySelector('#characterChoice .active').dataset.chooseCharacter);
  });
  screen.querySelector('#challengeStartBtn').addEventListener('click', () => {
    const activeDiff = screen.querySelector('.difficulty-btn.active');
    onSelectMode('challenge', activeDiff ? activeDiff.dataset.diff : 'easy', scope());
  });
  syncInert();
  return screen;
}

// ===== GAME SCREEN =====
export function buildGameScreen(onStepClick, onQuit, callbacks = {}) {
  const screen = document.createElement('div');
  screen.className = 'screen game-screen';
  screen.id = 'gameScreen';
  screen.innerHTML = `
    <button class="back-btn" id="gameQuitBtn" aria-label="إنهاء التدريب والعودة"><i class="fa-solid fa-arrow-right"></i></button>
    <div class="game-3d-container" id="game3dContainer">
      <div class="game-3d-overlay"></div>
      <div class="stage-toolbar">
        <div class="character-selector" role="group" aria-label="اختر الشخصية">
          <button type="button" data-character="boy" aria-pressed="true">ولد</button>
          <button type="button" data-character="girl" aria-pressed="false">بنت</button>
        </div>
        <div class="view-selector" role="group" aria-label="زاوية العرض">
          <button type="button" data-view="front" aria-pressed="true">أمامي</button>
          <button type="button" data-view="side" aria-pressed="false">جانبي</button>
        </div>
      </div>
      <div class="pose-caption"><strong id="poseLabel">مستعدون للتعلّم</strong><span id="poseStatus" aria-live="polite">اختر حركة لمشاهدتها</span></div>
      <div class="qibla-indicator" id="qiblaIndicator">
        <i class="fa-solid fa-compass" aria-hidden="true"></i> القبلة أمام المصلّي
      </div>
    </div>
    <div class="game-panel">
      <div class="glass game-header">
        <h2 id="gameModeTitle"><i class="fa-solid fa-graduation-cap"></i> <span>وضع التعلم</span></h2>
        <div class="timer-display" id="timerDisplay">00:00</div>
      </div>
      <div class="glass progress-section">
        <div class="progress-header">
          <span>التقدم</span>
          <span id="progressPercent">0%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="progress-steps" id="progressSteps"></div>
      </div>
      <div class="glass instruction-box" id="instructionBox">
        <i class="fa-solid fa-hand-point-up instruction-icon" id="instructionIcon"></i>
        <div class="instruction-text" id="instructionText">اضغط على التكبير لبدء الصلاة</div>
        <div class="instruction-sub" id="instructionSub">قل: الله أكبر</div>
        <div class="instruction-dhikr hidden" id="instructionDhikr"></div>
      </div>
      <div class="lesson-context"><span id="lessonScopeLabel"></span><strong id="nextStepLabel"></strong>
        <div class="lesson-tools"><button type="button" id="replayPose">إعادة الحركة</button><button type="button" id="practiceSettings">الهيئة والمراجع</button></div>
      </div>
      <div class="glass controls-section" id="controlsSection"></div>
    </div>
  `;

  screen.querySelector('#gameQuitBtn').addEventListener('click', onQuit);
  screen.querySelectorAll('[data-character]').forEach(button => button.addEventListener('click', () => callbacks.onCharacter?.(button.dataset.character)));
  screen.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    screen.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    callbacks.onView?.(button.dataset.view);
  }));
  screen.querySelector('#replayPose').addEventListener('click', () => callbacks.onReplay?.());
  screen.querySelector('#practiceSettings').addEventListener('click', () => callbacks.onSettings?.());

  return screen;
}

export function renderGameControls(container, onClick, indices = null) {
  container.innerHTML = '';
  const order = indices || PRAYER_STEPS.map((_, i) => i);
  order.forEach(index => {
    const step = PRAYER_STEPS[index];
    const btn = document.createElement('button');
    btn.className = 'control-btn';
    btn.innerHTML = `<i class="fa-solid ${step.icon}"></i><span>${step.name}</span>`;
    btn.dataset.stepId = step.id;
    btn.dataset.index = index;
    btn.addEventListener('click', () => onClick(index));
    container.appendChild(btn);
  });
}

export function renderProgressSteps(container, mode, sequence = MOVEMENT_SEQUENCE) {
  container.innerHTML = '';
  sequence.forEach((stepIndex, index) => {
    const step = PRAYER_STEPS[stepIndex];
    const pill = document.createElement('div');
    pill.className = 'step-pill';
    pill.textContent = mode === 'challenge' ? `الخطوة ${index + 1}` : step.name;
    pill.dataset.index = index;
    container.appendChild(pill);
  });
}

export function updateGameUI(screen, state) {
  const {
    mode, userSequence,
    instruction, sequence = MOVEMENT_SEQUENCE, activeAction, busy
  } = state;

  // Mode title
  const titleEl = screen.querySelector('#gameModeTitle span');
  if (titleEl) titleEl.textContent = (mode === 'learn' ? 'وضع التعلم' : 'وضع التحدي') + (sequence.length > 9 ? ' · ركعتان' : '');

  // Progress bar
  const progress = userSequence.length / sequence.length * 100;
  const bar = screen.querySelector('#progressBar');
  const percent = screen.querySelector('#progressPercent');
  if (bar) bar.style.width = progress + '%';
  if (percent) percent.textContent = Math.round(progress) + '%';

  // Step pills
  const pills = screen.querySelectorAll('.step-pill');
  pills.forEach((pill, idx) => {
    pill.classList.remove('completed', 'current', 'error');
    
    // STRICT logic: Only highlight genuinely completed steps
    if (userSequence.includes(idx)) {
      pill.classList.add('completed');
    }
    if (mode === 'learn' && idx === userSequence.length) pill.classList.add('current');
  });

  // Instruction box
  const iconEl = screen.querySelector('#instructionIcon');
  const textEl = screen.querySelector('#instructionText');
  const subEl = screen.querySelector('#instructionSub');
  const dhikrEl = screen.querySelector('#instructionDhikr');
  const box = screen.querySelector('#instructionBox');

  if (instruction) {
    if (iconEl) iconEl.className = `fa-solid ${instruction.icon} instruction-icon`;
    if (box && textEl && textEl.textContent !== instruction.text) {
      // restart the short fade so a new step reads as new
      box.classList.remove('is-updated'); void box.offsetWidth; box.classList.add('is-updated');
    }
    if (textEl) textEl.textContent = instruction.text;
    if (subEl) subEl.textContent = instruction.sub;
    if (dhikrEl) {
      if (instruction.dhikr) {
        dhikrEl.textContent = instruction.dhikr;
        dhikrEl.classList.remove('hidden');
      } else {
        dhikrEl.classList.add('hidden');
      }
    }
    if (box) box.classList.toggle('active', !!instruction.active);
  }

  // Controls state
  const buttons = screen.querySelectorAll('.control-btn');

  buttons.forEach((btn) => {
    const stepIndex = parseInt(btn.dataset.index, 10);
    const isCompleted = sequence.some((id, occurrence) => id === stepIndex && userSequence.includes(occurrence));
    const hasRemaining = sequence.slice(userSequence.length).includes(stepIndex);
    btn.classList.remove('correct', 'wrong', 'current');
    btn.classList.toggle('correct', isCompleted);
    btn.classList.toggle('current', mode === 'learn' && PRAYER_STEPS[stepIndex].id === activeAction);
    btn.setAttribute('aria-pressed', String(mode === 'learn' && PRAYER_STEPS[stepIndex].id === activeAction));
    btn.disabled = mode === 'challenge' ? busy || !hasRemaining : false;
    btn.style.opacity = '1';
  });
}

// ===== LOADING OVERLAY =====
/** Shows a loading overlay inside the game root (never on the page body). */
export function showLoading(root, text = 'جاري التحميل...') {
  let overlay = root.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    const label = document.createElement('div');
    label.className = 'loading-text';
    label.textContent = text;
    overlay.append(spinner, label);
    root.appendChild(overlay);
  }
  return overlay;
}

/** @param {HTMLElement} root */
export function hideLoading(root) {
  const overlay = root.querySelector('.loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }
}
