/**
 * Quiz Engine - dhikr / knowledge questions.
 *
 * Difficulty:
 *  - easy:   multiple choice, hint shown up-front
 *  - medium: type the missing word (multiple choice when the question is not typeable), hint after a mistake
 *  - hard:   same as medium plus a visible 30 s timer per attempt
 *
 * Every question allows at most 2 attempts: first mistake -> hint and a second try,
 * second mistake -> the answer and explanation are revealed. A question can never loop forever.
 * `onDone({ correct, firstTry, attempts })` is called exactly once, after the player taps "متابعة".
 */
import gsap from 'gsap';
import { DHIKR_QUIZZES } from '../data/prayerData.js';
import { matchesAnswer } from './arabicText.js';
import { shuffle } from '../utils/random.js';
import { openDialog } from '../ui/dialog.js';

const MAX_ATTEMPTS = 2;
const HARD_SECONDS = 30;

export class QuizEngine {
  /** @param {{ root: HTMLElement, difficulty?: string }} options */
  constructor({ root, difficulty = 'easy' }) {
    this.root = root;
    this.difficulty = difficulty;
    this.currentQuiz = null;
    this.dialog = null;
    this.hardTimer = null;
    this.timeouts = new Set();
    this.reducedMotion = false;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  getQuiz(quizType) {
    return DHIKR_QUIZZES[quizType] || null;
  }

  checkAnswer(userAnswer, quiz = this.currentQuiz) {
    if (!quiz) return false;
    return matchesAnswer(userAnswer, quiz.acceptedAnswers || [quiz.answer]);
  }

  /** Stops timers and removes any open quiz without reporting an answer. Safe to call anytime. */
  dispose() {
    if (this.hardTimer) { clearInterval(this.hardTimer); this.hardTimer = null; }
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
    if (this.dialog) { this.dialog.destroy(); this.dialog = null; }
    this.currentQuiz = null;
  }

  /**
   * @param {string} quizType key of DHIKR_QUIZZES
   * @param {(r: {correct:boolean, firstTry:boolean, attempts:number}) => void} onDone
   * @param {{ onQuit?: () => void }} [opts]
   */
  open(quizType, onDone, { onQuit } = {}) {
    const quiz = this.getQuiz(quizType);
    if (!quiz) { onDone({ correct: true, firstTry: true, attempts: 0 }); return; }

    this.dispose(); // never keep two quiz dialogs alive
    this.currentQuiz = quiz;

    const typing = this.difficulty !== 'easy' && quiz.typeable;
    const hard = this.difficulty === 'hard';
    const hintUpfront = this.difficulty === 'easy';

    // Quiz content is static, author-written data; it is not user input.
    const html = `
      <div class="dialog-title" id="quizTitle"><i class="fa-solid fa-book-quran" aria-hidden="true"></i> ${quiz.title}</div>
      <div class="quiz-question">${quiz.question}</div>
      <div class="quiz-hint ${hintUpfront ? '' : 'hidden'}" id="quizHint">${quiz.hint}</div>
      ${hard ? `<div class="quiz-timer" id="quizTimer" aria-hidden="true"><span class="quiz-timer-text"><i class="fa-solid fa-stopwatch"></i> <span id="quizTimerText">${HARD_SECONDS} ثانية</span></span><span class="quiz-timer-bar"><span></span></span></div>` : ''}
      <div class="quiz-feedback" id="quizFeedback" role="status" aria-live="polite"></div>
      ${typing
        ? `<input type="text" class="quiz-input" id="quizInput" aria-label="اكتب الكلمة الناقصة" placeholder="اكتب الكلمة الناقصة..." autocomplete="off" data-autofocus>
           <div class="dialog-actions"><button class="btn btn-primary" id="quizSubmit">تحقق</button></div>`
        : `<div class="quiz-options" id="quizOptions"></div>`}
      <div class="dialog-actions">
        <button class="btn btn-primary hidden" id="quizContinue">متابعة</button>
        <button class="dialog-quit" id="quizQuit" type="button">إنهاء التدريب</button>
      </div>`;

    const dialog = openDialog({ root: this.root, id: 'quizPopup', titleId: 'quizTitle', html, reducedMotion: this.reducedMotion });
    this.dialog = dialog;
    const card = dialog.card;
    const $ = (sel) => card.querySelector(sel);
    const feedback = $('#quizFeedback');
    const hintEl = $('#quizHint');
    const continueBtn = $('#quizContinue');

    let attempts = 0;
    let finished = false;
    let outcome = null;

    const setFeedback = (nodes, kind) => {
      feedback.replaceChildren(...nodes);
      feedback.className = `quiz-feedback ${kind} show`;
    };
    const text = (value) => document.createTextNode(value);
    const element = (tag, value) => Object.assign(document.createElement(tag), { textContent: value });

    const stopTimer = () => {
      if (this.hardTimer) { clearInterval(this.hardTimer); this.hardTimer = null; }
    };
    const startTimer = () => {
      if (!hard) return;
      stopTimer();
      let left = HARD_SECONDS;
      const timerEl = $('#quizTimer');
      const show = () => {
        if (!timerEl) return;
        timerEl.querySelector('#quizTimerText').textContent = `${left} ثانية`;
        timerEl.style.setProperty('--left', String(left / HARD_SECONDS));
        timerEl.classList.toggle('is-low', left <= 10);
      };
      show();
      this.hardTimer = setInterval(() => {
        left--;
        show();
        if (left <= 0) { stopTimer(); submit('', null, true); }
      }, 1000);
    };

    const lockInputs = () => {
      card.querySelectorAll('.quiz-option, #quizInput, #quizSubmit').forEach(el => { el.disabled = true; });
    };

    const finish = (correct) => {
      finished = true;
      stopTimer();
      lockInputs();
      outcome = { correct, firstTry: correct && attempts === 1, attempts };
      if (correct) {
        setFeedback([text(`✓ أحسنت! ${quiz.explanation}`)], 'success');
      } else {
        setFeedback([
          text('الإجابة الصحيحة: '),
          element('strong', quiz.answer),
          document.createElement('br'),
          element('small', quiz.explanation)
        ], 'info');
        card.querySelectorAll('.quiz-option').forEach(opt => {
          if (this.checkAnswer(opt.textContent, quiz)) opt.classList.add('revealed-correct');
        });
      }
      continueBtn.classList.remove('hidden');
      continueBtn.focus({ preventScroll: true });
    };

    const submit = (value, optionBtn, timedOut = false) => {
      if (finished) return;
      stopTimer();
      attempts++;
      const correct = !timedOut && this.checkAnswer(value, quiz);
      if (optionBtn) optionBtn.classList.add(correct ? 'correct' : 'wrong');

      if (correct) { finish(true); return; }
      if (attempts >= MAX_ATTEMPTS) { finish(false); return; }

      // First mistake: encourage, show the hint, allow one more try.
      hintEl.classList.remove('hidden');
      setFeedback([text(timedOut ? 'انتهى الوقت. جرّب مرة أخرى 🌱' : 'ليست الإجابة الصحيحة، حاول مرة أخرى 🌱')], 'error');
      if (!this.reducedMotion) gsap.fromTo(card, { x: 0 }, { x: 8, duration: 0.08, yoyo: true, repeat: 5, ease: 'power1.inOut', clearProps: 'x' });
      if (optionBtn) optionBtn.disabled = true;
      const input = $('#quizInput');
      if (input) { input.value = ''; input.focus({ preventScroll: true }); }
      startTimer();
    };

    if (typing) {
      const input = $('#quizInput');
      const submitBtn = $('#quizSubmit');
      const go = () => { const v = input.value.trim(); if (v) submit(v, null); };
      submitBtn.addEventListener('click', go);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    } else {
      const optionsContainer = $('#quizOptions');
      shuffle(quiz.options).forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => submit(opt, btn));
        optionsContainer.appendChild(btn);
      });
    }

    continueBtn.addEventListener('click', () => {
      if (!finished || !outcome) return;
      const result = outcome;
      outcome = null;
      dialog.close(() => {
        if (this.dialog === dialog) this.dialog = null;
        onDone(result);
      });
    });
    $('#quizQuit').addEventListener('click', () => { if (onQuit) onQuit(); });

    dialog.focusFirst();
    startTimer();
  }
}
