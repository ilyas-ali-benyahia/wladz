import storyDialoguesData from '../data/story_dialogues.json';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

/**
 * DialogueSystem: Interactive Branching Narrative & Story Decisions
 * - Multi-choice branching dialogues
 * - Real-time state flags and quest branch triggers
 * - Integrated Arabic Speech Synthesis with repeat option
 * - Safe educational handling of sensitive topics
 */
export class DialogueSystem {
  constructor(missionSystem) {
    this.missionSystem = missionSystem;
    this.dialogues = storyDialoguesData.dialogues;
    this.currentDialogue = null;
    this.activeSpeaker = null;

    // Speech Synthesis
    try {
      this.speechSynthesis = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null;
    } catch (e) {
      this.speechSynthesis = null;
    }
    this.arabicVoice = null;
    this.initVoices();
  }

  initVoices() {
    if (!this.speechSynthesis) return;

    try {
      const findVoice = () => {
        const voices = this.speechSynthesis.getVoices();
        this.arabicVoice = voices.find(v => v.lang.startsWith('ar')) || null;
      };

      findVoice();
      if (this.speechSynthesis.onvoiceschanged !== undefined) {
        this.speechSynthesis.onvoiceschanged = findVoice;
      }
    } catch (e) {
      console.warn('Voice lookup failed:', e);
    }
  }

  speakText(text) {
    if (!this.speechSynthesis || audio.isMuted || typeof SpeechSynthesisUtterance === 'undefined') return;

    try {
      this.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.arabicVoice) {
        utterance.voice = this.arabicVoice;
      }
      utterance.lang = 'ar';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      this.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable:', e);
    }
  }

  stopSpeech() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  startStoryDialogue(dialogueKey, speakerData = null) {
    const d = this.dialogues[dialogueKey];
    if (!d) return null;

    this.currentDialogue = d;
    this.activeSpeaker = speakerData;

    // Trigger voice reading
    this.speakText(d.text);

    return d;
  }

  selectOption(optionIndex) {
    if (!this.currentDialogue || !this.currentDialogue.options) return null;

    const option = this.currentDialogue.options[optionIndex];
    if (!option) return null;

    audio.playClick();

    // Trigger any associated story action
    if (option.action) {
      this.handleStoryAction(option.action, option);
    }

    if (option.nextDialogueId && this.dialogues[option.nextDialogueId]) {
      this.currentDialogue = this.dialogues[option.nextDialogueId];
      this.speakText(this.currentDialogue.text);
      return {
        hasMore: true,
        dialogue: this.currentDialogue
      };
    } else {
      // End of story branch
      this.currentDialogue = null;
      this.stopSpeech();
      return {
        hasMore: false,
        completed: true
      };
    }
  }

  handleStoryAction(action, option) {
    events.emit('STORY_ACTION_TRIGGERED', { action, option });

    switch (action) {
      case 'CHOOSE_REHAB':
        events.emit('TOAST', '🌱 خيار إنساني حكيم! توجيه الشاب نحو الرعاية الصحية يحفظ كرامته وأمله.');
        break;

      case 'ASK_SUPPLIER':
        events.emit('TOAST', '🔍 جمع المعلومات خطوة ضرورية للإبلاغ الأمني المسؤول.');
        break;

      case 'RECKLESS_UNDERCOVER':
        events.emit('TOAST', '⚠️ فشل المسار المتهور! التظاهر بالطلب يعرضك للخطر والقانون يحذر منه.');
        break;

      case 'GO_TO_POLICE':
        events.emit('TOAST', '🚨 توجه إلى مقر الأمن الوطني لمقابلة الملازم سليم وتسليم البلاغ.');
        break;

      case 'COMPLETE_TAREEQ_NAJAH':
        events.emit('MISSION_BRANCH_COMPLETED', { missionId: 'mission_4' });
        break;

      case 'START_FIRE_EVACUATION':
        events.emit('MISSION_BRANCH_COMPLETED', { missionId: 'mission_5' });
        break;

      case 'START_CROSSWALK_ESCORT':
        events.emit('MISSION_BRANCH_COMPLETED', { missionId: 'mission_6' });
        break;

      case 'COMPLETE_HERITAGE_LESSON':
        events.emit('MISSION_BRANCH_COMPLETED', { missionId: 'mission_7' });
        break;
    }
  }
}
