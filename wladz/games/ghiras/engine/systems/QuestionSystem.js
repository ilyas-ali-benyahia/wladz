import questionsData from '../data/questions.json';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export class QuestionSystem {
  constructor(progression) {
    this.progression = progression;
    this.questions = questionsData.questions;
    this.askedQuestionIds = new Set();
    this.currentQuestion = null;
    this.currentNPC = null;
  }

  getQuestionForNPC(npcData) {
    const category = npcData.category;
    let pool = this.questions.filter(q => q.category === category);

    if (pool.length === 0) {
      pool = this.questions; // Fallback to all questions
    }

    // Filter out already answered questions in current cycle
    let unasked = pool.filter(q => !this.askedQuestionIds.has(q.id));
    if (unasked.length === 0) {
      pool.forEach(q => this.askedQuestionIds.delete(q.id));
      unasked = pool;
    }

    const selected = unasked[Math.floor(Math.random() * unasked.length)];
    this.askedQuestionIds.add(selected.id);
    this.currentQuestion = selected;
    this.currentNPC = npcData;

    return selected;
  }

  answerQuestion(selectedIndex) {
    if (!this.currentQuestion) return null;

    const isCorrect = selectedIndex === this.currentQuestion.correct;

    if (isCorrect) {
      audio.playCorrectAnswer();
      const reward = this.currentQuestion.reward;
      this.progression.addXP(reward.xp || 25);
      this.progression.addCoins(reward.coins || 15);
      if (reward.water) {
        this.progression.addWater(reward.water);
      }

      events.emit('NPC_QUESTION_SOLVED', this.currentNPC);
    } else {
      audio.playWrongAnswer();
    }

    events.emit('QUESTION_ANSWERED', {
      question: this.currentQuestion,
      isCorrect,
      selectedIndex,
      explanation: this.currentQuestion.explanation,
      reward: this.currentQuestion.reward
    });

    return {
      isCorrect,
      correctIndex: this.currentQuestion.correct,
      explanation: this.currentQuestion.explanation,
      reward: this.currentQuestion.reward
    };
  }

  clearCurrent() {
    this.currentQuestion = null;
    this.currentNPC = null;
  }
}
