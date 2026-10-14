/**
 * Scoring Engine - first-try accuracy.
 *
 * score = 50% step-order accuracy + 50% question accuracy (only questions that were asked).
 * Time is reported but never scored: this is a click-to-order game, not a physical performance.
 * Pure logic (no DOM) so it can be unit-tested with `npm test`.
 */
import { PRAYER_STEPS, DHIKR_QUIZZES } from '../data/prayerData.js';

export class ScoringEngine {
  constructor(steps = PRAYER_STEPS, quizzes = DHIKR_QUIZZES) {
    this.steps = steps;
    this.quizzes = quizzes;
    this.reset();
  }

  reset() {
    this.wrongClicks = new Array(this.steps.length).fill(0);
    this.completed = new Array(this.steps.length).fill(false);
    this.quizResults = []; // { quizId, firstTry, attempts, correct }
    this.totalTime = 0;
  }

  /** A click on a step that was not the expected one. Returns how many wrong clicks this step has had. */
  recordWrongClick(expectedIndex) {
    this.wrongClicks[expectedIndex]++;
    return this.wrongClicks[expectedIndex];
  }

  recordStepDone(index) {
    this.completed[index] = true;
  }

  /** One entry per question asked (not per attempt). */
  recordQuizResult(quizId, { firstTry, attempts, correct = firstTry }) {
    this.quizResults.push({ quizId, firstTry: !!firstTry, attempts, correct: !!correct });
  }

  setTotalTime(seconds) {
    this.totalTime = seconds;
  }

  calculateFinal() {
    const totalSteps = this.steps.length;
    const stepsFirstTry = this.steps.filter((_, i) => this.completed[i] && this.wrongClicks[i] === 0).length;
    const stepsCompleted = this.completed.filter(Boolean).length;
    const totalQuizzes = this.quizResults.length;
    const quizzesFirstTry = this.quizResults.filter(q => q.firstTry).length;

    const orderAccuracy = totalSteps ? stepsFirstTry / totalSteps : 0;
    // No questions asked (Learn mode) -> the question half does not exist; order accuracy is the whole score.
    const score = totalQuizzes
      ? Math.round(50 * orderAccuracy + 50 * (quizzesFirstTry / totalQuizzes))
      : Math.round(100 * orderAccuracy);

    let stars = 1; // a finished run never shows zero stars
    if (score >= 95) stars = 5;
    else if (score >= 82) stars = 4;
    else if (score >= 68) stars = 3;
    else if (score >= 50) stars = 2;

    const mistakes = [];
    this.steps.forEach((step, i) => {
      if (this.wrongClicks[i] > 0) {
        mistakes.push({
          type: 'order',
          step: step.name,
          message: `راجع ترتيب خطوة «${step.name}»`,
          tip: step.description || '',
          icon: 'fa-list-ol',
          severity: 'warning'
        });
      }
    });
    this.quizResults.forEach(q => {
      if (!q.firstTry) {
        const quiz = this.quizzes[q.quizId];
        mistakes.push({
          type: 'quiz',
          step: quiz?.title || q.quizId,
          message: `راجع: ${quiz?.title || q.quizId}`,
          tip: quiz?.explanation || '',
          icon: 'fa-book-open',
          severity: q.correct ? 'warning' : 'error'
        });
      }
    });

    return {
      score,
      stars,
      stepsFirstTry,
      stepsCompleted,
      totalSteps,
      quizzesFirstTry,
      totalQuizzes,
      mistakes,
      totalTime: this.totalTime
    };
  }
}
