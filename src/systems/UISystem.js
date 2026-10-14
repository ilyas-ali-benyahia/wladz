import * as THREE from 'three';
import { events } from '../core/EventBus.js';
import { audio } from './AudioSystem.js';

export class UISystem {
  constructor(gameApp) {
    this.game = gameApp;

    // Elements cache
    this.hud = document.getElementById('hud');
    this.titleScreen = document.getElementById('title-screen');
    this.characterSelectScreen = document.getElementById('character-select-screen');
    this.interactHint = document.getElementById('interact-hint');
    this.dialogOverlay = document.getElementById('dialog-overlay');
    this.questionOverlay = document.getElementById('question-overlay');
    this.missionCompleteModal = document.getElementById('mission-complete-modal');
    this.levelUpModal = document.getElementById('level-up-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.achievementsModal = document.getElementById('achievements-modal');
    this.toastEl = document.getElementById('toast');
    this.floatContainer = document.getElementById('float-container');

    this.selectedGender = 'boy';
    this.activeNPC = null;
    this.toastTimer = null;

    this.initEventListeners();
    this.initHUDButtons();
  }

  initEventListeners() {
    // Event bus bindings
    events.on('PROGRESSION_UPDATED', (state) => this.updateHUDProgression(state));
    events.on('MISSION_UPDATED', (data) => this.updateHUDMission(data));
    events.on('MISSION_COMPLETED', (data) => this.showMissionComplete(data));
    events.on('LEVEL_UP', (data) => this.showLevelUp(data));
    events.on('ACHIEVEMENT_UNLOCKED', (ach) => this.showAchievementUnlocked(ach));
    events.on('NEAR_NPC_CHANGED', (npc) => this.updateInteractHint(npc));
    events.on('MISSION_FAILED', (data) => this.showMissionFailed(data));
    events.on('FLOAT_TEXT', (data) => this.spawnFloatText(data.position, data.text, data.color));
    events.on('TOAST', (msg) => this.showToast(msg));
  }

  initHUDButtons() {
    // Title screen start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        audio.init();
        audio.playClick();
        this.openCharacterSelect();
      });
    }

    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      if (this.game.saveSystem.hasSave()) {
        continueBtn.style.display = 'inline-block';
        continueBtn.addEventListener('click', () => {
          audio.init();
          audio.playClick();
          this.game.loadSavedGame();
        });
      } else {
        continueBtn.style.display = 'none';
      }
    }

    // Character selection: a boy or a girl
    this.selectedCharType = 'boy_purple';
    this.previewYaw = 0;
    this.previewPop = 1;
    const charCards = [...document.querySelectorAll('.char-opt-card')];
    this.selectCharacter = (charType) => {
      if (!charCards.some(c => c.dataset.type === charType)) charType = 'boy_purple';
      charCards.forEach(c => c.classList.toggle('active', c.dataset.type === charType));
      if (charType === this.selectedCharType && this.game.player.gender === charType) return;
      this.selectedCharType = charType;
      this.selectedGender = charType;
      this.game.player.switchGender(charType);
      this.previewPop = 0; // the new model grows in (see main.js preview)
      this.previewYaw = 0;
      if (this.previewStage) this.previewStage.userData.ring.material.color.setHex(charType === 'girl_green' ? 0x2ecc71 : 0x8e5cf7);
    };
    charCards.forEach(card => {
      card.addEventListener('click', () => {
        audio.playClick();
        this.selectCharacter(card.dataset.type);
      });
    });

    // Keyboard: arrows switch, Enter starts
    window.addEventListener('keydown', (e) => {
      if (!this.characterSelectScreen.classList.contains('show')) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        audio.playClick();
        this.selectCharacter(this.selectedCharType === 'boy_purple' ? 'girl_green' : 'boy_purple');
      } else if (e.code === 'Enter') {
        audio.playClick();
        this.startGameSession();
      }
    });

    // Drag anywhere on the stage to turn the character around
    let dragX = null;
    window.addEventListener('pointerdown', (e) => {
      if (this.characterSelectScreen.classList.contains('show') && !e.target.closest('button')) dragX = e.clientX;
    });
    window.addEventListener('pointermove', (e) => {
      if (dragX === null) return;
      this.previewYaw += (e.clientX - dragX) * 0.012;
      dragX = e.clientX;
    });
    window.addEventListener('pointerup', () => { dragX = null; });
    this.isDraggingPreview = () => dragX !== null;

    const confirmCharBtn = document.getElementById('confirm-character-btn');
    if (confirmCharBtn) {
      confirmCharBtn.addEventListener('click', () => {
        audio.playClick();
        this.startGameSession();
      });
    }

    // HUD Quick Actions
    const mapBtn = document.getElementById('hud-map-btn');
    if (mapBtn) {
      mapBtn.addEventListener('click', () => {
        audio.playClick();
        this.game.mapSystem.toggleFullMap();
      });
    }

    const achBtn = document.getElementById('hud-ach-btn');
    if (achBtn) {
      achBtn.addEventListener('click', () => {
        audio.playClick();
        this.openAchievementsModal();
      });
    }

    const pauseBtn = document.getElementById('hud-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        audio.playClick();
        this.openPauseModal();
      });
    }

    const timeBtn = document.getElementById('hud-time-btn');
    if (timeBtn) {
      timeBtn.addEventListener('click', () => {
        audio.playClick();
        const timeName = this.game.environment.nextTimeOfDay();
        this.showToast(`🌅 تغير الوقت إلى: ${timeName}`);
      });
    }

    // Dialogue voice replay button
    const speakBtn = document.getElementById('dialog-speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        audio.playClick();
        const text = document.getElementById('dialog-text').textContent;
        if (this.game.dialogueSystem) {
          this.game.dialogueSystem.speakText(text);
        }
      });
    }

    // Mission Complete Action Buttons
    const mcNextBtn = document.getElementById('mc-next-btn');
    if (mcNextBtn) {
      mcNextBtn.addEventListener('click', () => {
        audio.playClick();
        this.missionCompleteModal.classList.remove('show');
        this.game.input.setEnabled(true);
        this.game.missionSystem.advanceToNextMission();
      });
    }

    const mcReturnBtn = document.getElementById('mc-return-btn');
    if (mcReturnBtn) {
      mcReturnBtn.addEventListener('click', () => {
        audio.playClick();
        this.missionCompleteModal.classList.remove('show');
        this.game.input.setEnabled(true);
      });
    }

    // Mission Failed Retry Button
    const mfRetryBtn = document.getElementById('mf-retry-btn');
    const mfModal = document.getElementById('mission-failed-modal');
    if (mfRetryBtn && mfModal) {
      mfRetryBtn.addEventListener('click', () => {
        audio.playClick();
        mfModal.classList.remove('show');
        this.game.input.setEnabled(true);
      });
    }

    // Modals close buttons
    const closeMapBtn = document.getElementById('close-map-btn');
    if (closeMapBtn) {
      closeMapBtn.addEventListener('click', () => {
        audio.playClick();
        this.game.mapSystem.toggleFullMap();
      });
    }

    const closeAchBtn = document.getElementById('close-ach-btn');
    if (closeAchBtn) {
      closeAchBtn.addEventListener('click', () => {
        audio.playClick();
        this.achievementsModal.classList.remove('show');
        this.game.input.setEnabled(true);
      });
    }

    // Pause menu buttons
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        audio.playClick();
        this.closePauseModal();
      });
    }

    const saveBtn = document.getElementById('save-game-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        audio.playClick();
        this.game.saveCurrentGame();
        this.showToast('💾 تم حفظ تقدمك في اللعبة بنجاح!');
      });
    }

    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        audio.setMuted(!e.target.checked);
      });
    }

    const volSlider = document.getElementById('volume-slider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        audio.setVolume(parseFloat(e.target.value));
      });
    }
  }

  openCharacterSelect() {
    this.titleScreen.style.display = 'none';
    this.characterSelectScreen.classList.add('show');
    this.createPreviewStage();
    this.previewStage.visible = true;
    this.selectCharacter(this.selectedCharType || 'boy_purple');
    this.game.player.switchGender(this.selectedCharType);
  }

  /** Small showcase stage under the character: stone disc and a soft light ring in the hero's colour */
  createPreviewStage() {
    if (this.previewStage) return;
    const scene = this.game.engine.scene;
    const p = this.game.player.position;
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.55 })
    );
    disc.position.y = 0.06;
    disc.receiveShadow = true;
    g.add(disc);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.035, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x8e5cf7, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.125;
    g.add(ring);
    g.userData.ring = ring;
    scene.add(g);
    this.previewStage = g;
  }

  startGameSession() {
    this.characterSelectScreen.classList.remove('show');
    if (this.previewStage) this.previewStage.visible = false;
    this.game.player.group.scale.setScalar(1);
    this.hud.style.display = 'block';
    this.game.isGameActive = true;
    this.game.input.setEnabled(true);

    // Every session begins at home: the player walks out to the street (and the family car)
    if (!this.game.startedAtHome && this.game.interiors) {
      this.game.startedAtHome = true;
      this.game.interiors.startInside('home');
    }

    this.showToast('🌱 مرحباً بك في مدينة «غِراس المواطنة»! ابدأ بمهمة تنظيف الشوارع.');

    const avatar = document.getElementById('hud-avatar');
    if (avatar) {
      avatar.textContent = /^girl/.test(this.selectedCharType || '') ? '🧕' : '👦';
    }
  }

  updateHUDProgression(state) {
    document.getElementById('hud-level-val').textContent = state.level;
    document.getElementById('hud-level-title').textContent = state.levelTitle;
    document.getElementById('hud-xp-val').textContent = `${state.xpProgress} / ${state.xpNeeded} XP`;
    document.getElementById('hud-xp-fill').style.width = `${state.xpPct * 100}%`;
    document.getElementById('hud-coins-val').textContent = state.coins;
    document.getElementById('hud-water-val').textContent = `${state.water}/${state.maxWater}`;
    document.getElementById('hud-water-fill').style.width = `${(state.water / state.maxWater) * 100}%`;
  }

  updateHUDMission(data) {
    const { mission, progress, target, status } = data;
    document.getElementById('hud-mission-title').textContent = mission.title;
    document.getElementById('hud-mission-desc').textContent = mission.description;
    document.getElementById('hud-mission-progress').textContent = `${progress} / ${target} ${mission.targetLabel || ''}`;
    const pct = Math.min(100, Math.max(0, (progress / target) * 100));
    document.getElementById('hud-mission-bar-fill').style.width = `${pct}%`;

    const badge = document.getElementById('hud-mission-status-badge');
    if (badge) {
      const s = status || this.game.missionSystem.missionStatus || 'جارية';
      badge.textContent = s;
      if (s === 'اكتملت') {
        badge.style.color = '#2ecc71';
        badge.style.borderColor = '#2ecc71';
      } else if (s === 'فشلت') {
        badge.style.color = '#e74c3c';
        badge.style.borderColor = '#e74c3c';
      } else if (s === 'تحتاج لمعلومات إضافية') {
        badge.style.color = '#f1c40f';
        badge.style.borderColor = '#f1c40f';
      } else {
        badge.style.color = '#2ecc71';
        badge.style.borderColor = '#2ecc71';
      }
    }
  }

  /** Context hint from a system (interiors, missions); the first non-empty source wins */
  setCustomHint(html, source = 'interior') {
    this.customHints = this.customHints || {};
    this.customHints[source] = html;
    this.customHint = this.customHints.vehicle || this.customHints.interior || this.customHints.mission || null;
    this.updateInteractHint(this.lastHintNPC);
  }

  updateInteractHint(npc) {
    this.lastHintNPC = npc;
    if (this.customHint) {
      this.interactHint.innerHTML = this.customHint;
      this.interactHint.style.display = 'block';
    } else if (npc) {
      this.interactHint.innerHTML = `اضغط <b>E</b> للتحدث مع ${npc.title}`;
      this.interactHint.style.display = 'block';
    } else {
      this.interactHint.style.display = 'none';
    }
  }

  openDialogue(npcData) {
    this.activeNPC = npcData;
    this.game.input.setEnabled(false);

    document.getElementById('dialog-npc-avatar').textContent = npcData.hatType === 'turban' ? '🕌' :
      (npcData.hatType === 'fez' ? '📜' : (npcData.hatType === 'police' ? '👮‍♂️' : (npcData.hatType === 'helmet' ? '🚒' : (npcData.category === 'health' ? '🩺' : '👤'))));
    document.getElementById('dialog-npc-name').textContent = npcData.name;
    document.getElementById('dialog-npc-role').textContent = npcData.title;

    // Check if this NPC triggers a story dialogue branch
    const curMission = this.game.missionSystem.getCurrentMission();
    let storyKey = null;

    if (npcData.id === 'npc_struggling_youth') {
      storyKey = 'tareeq_al_najah_intro';
    } else if (npcData.id === 'npc_police_officer' && (curMission.id === 'mission_4' || this.game.missionSystem.missionStatus === 'تحتاج لمعلومات إضافية')) {
      storyKey = 'tareeq_al_najah_report_police_step';
    } else if (npcData.id === 'npc_firefighter' && curMission.id === 'mission_5') {
      storyKey = 'fire_emergency_alert';
    } else if (npcData.id === 'npc_elderly_citizen' && curMission.id === 'mission_6') {
      storyKey = 'elderly_crosswalk_help';
    } else if (npcData.id === 'npc_artisan' && curMission.id === 'mission_7') {
      storyKey = 'casbah_artisan_lesson';
    }

    const branchBox = document.getElementById('dialog-branch-choices');
    const stdActions = document.getElementById('dialog-standard-actions');

    if (storyKey && this.game.dialogueSystem) {
      // Branching Story Dialogue Mode
      stdActions.style.display = 'none';
      branchBox.style.display = 'flex';
      branchBox.innerHTML = '';

      const dialogue = this.game.dialogueSystem.startStoryDialogue(storyKey, npcData);
      document.getElementById('dialog-text').textContent = dialogue.text;

      dialogue.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'primary-btn';
        btn.style.fontSize = '0.92rem';
        btn.style.textAlign = 'right';
        btn.style.padding = '8px 14px';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          const res = this.game.dialogueSystem.selectOption(idx);
          if (res && res.hasMore) {
            this.openStoryDialogueStep(res.dialogue);
          } else {
            this.closeDialogue();
          }
        });
        branchBox.appendChild(btn);
      });
    } else {
      // Standard Greeting & Educational Question flow
      branchBox.style.display = 'none';
      stdActions.style.display = 'flex';
      document.getElementById('dialog-text').textContent = npcData.dialogue.greeting;

      if (this.game.dialogueSystem) {
        this.game.dialogueSystem.speakText(npcData.dialogue.greeting);
      }

      const acceptBtn = document.getElementById('dialog-accept-btn');
      const declineBtn = document.getElementById('dialog-decline-btn');

      acceptBtn.textContent = npcData.dialogue.acceptText || 'نعم أود التعلم';
      declineBtn.textContent = npcData.dialogue.declineText || 'لاحقاً';

      acceptBtn.onclick = () => {
        audio.playClick();
        this.closeDialogue();
        this.openQuestion(npcData);
      };

      declineBtn.onclick = () => {
        audio.playClick();
        this.closeDialogue();
      };
    }

    this.dialogOverlay.classList.add('show');
  }

  openStoryDialogueStep(dialogue) {
    document.getElementById('dialog-text').textContent = dialogue.text;
    const branchBox = document.getElementById('dialog-branch-choices');
    branchBox.innerHTML = '';

    if (dialogue.options && dialogue.options.length > 0) {
      dialogue.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'primary-btn';
        btn.style.fontSize = '0.92rem';
        btn.style.textAlign = 'right';
        btn.style.padding = '8px 14px';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          const res = this.game.dialogueSystem.selectOption(idx);
          if (res && res.hasMore) {
            this.openStoryDialogueStep(res.dialogue);
          } else {
            this.closeDialogue();
          }
        });
        branchBox.appendChild(btn);
      });
    } else {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'dialog-btn accept';
      closeBtn.textContent = 'متابعة المغامرة 🏙️';
      closeBtn.onclick = () => this.closeDialogue();
      branchBox.appendChild(closeBtn);
    }
  }

  showMissionFailed(data) {
    const mfModal = document.getElementById('mission-failed-modal');
    const mfDesc = document.getElementById('mf-desc');
    if (mfModal && mfDesc) {
      mfDesc.textContent = data.reason;
      mfModal.classList.add('show');
      this.game.input.setEnabled(false);
    }
  }

  closeDialogue() {
    this.dialogOverlay.classList.remove('show');
    if (this.game.dialogueSystem) {
      this.game.dialogueSystem.stopSpeech();
    }
    this.activeNPC = null;
    this.game.input.setEnabled(true);
  }

  openQuestion(npcData) {
    this.game.input.setEnabled(false);
    const q = this.game.questionSystem.getQuestionForNPC(npcData);

    const badge = document.getElementById('q-category-badge');
    badge.textContent = q.categoryLabel;
    badge.style.background = q.categoryBadgeColor + '25';
    badge.style.color = q.categoryBadgeColor;
    badge.style.borderColor = q.categoryBadgeColor;

    document.getElementById('q-npc-source').textContent = `تحدي من: ${npcData.name} (${npcData.role})`;
    document.getElementById('q-text').textContent = q.question;

    const choicesEl = document.getElementById('q-choices');
    choicesEl.innerHTML = '';

    const feedbackEl = document.getElementById('q-feedback');
    const rewardEl = document.getElementById('q-reward');
    const nextBtn = document.getElementById('q-next-btn');

    feedbackEl.textContent = '';
    rewardEl.textContent = '';
    nextBtn.style.display = 'none';

    q.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'q-btn';
      btn.textContent = choice;
      btn.addEventListener('click', () => {
        const result = this.game.questionSystem.answerQuestion(index);
        const allBtns = choicesEl.querySelectorAll('.q-btn');
        allBtns.forEach(b => b.disabled = true);

        if (result.isCorrect) {
          btn.classList.add('correct');
          feedbackEl.innerHTML = `✅ إجابة ممتازة! <br><span class="explanation">${result.explanation}</span>`;
          feedbackEl.style.color = '#2ecc71';
          rewardEl.innerHTML = `🎁 المكافأة: +${result.reward.xp} XP  •  +${result.reward.coins} 💰 ${result.reward.water ? ' •  +' + result.reward.water + ' 💧' : ''}`;
        } else {
          btn.classList.add('wrong');
          allBtns[result.correctIndex].classList.add('correct');
          feedbackEl.innerHTML = `❌ إجابة خاطئة! <br><span class="explanation">${result.explanation}</span>`;
          feedbackEl.style.color = '#e74c3c';
        }

        nextBtn.style.display = 'block';
      });
      choicesEl.appendChild(btn);
    });

    nextBtn.onclick = () => {
      audio.playClick();
      this.closeQuestion();
    };

    this.questionOverlay.classList.add('show');
  }

  closeQuestion() {
    this.questionOverlay.classList.remove('show');
    this.game.questionSystem.clearCurrent();
    this.game.input.setEnabled(true);
  }

  showMissionComplete(data) {
    const { mission, message } = data;
    document.getElementById('mc-title').textContent = `🎉 مهمة مكتملة: ${mission.title}`;
    document.getElementById('mc-desc').textContent = message;
    document.getElementById('mc-rewards').innerHTML = `+${mission.rewardXP} XP  •  +${mission.rewardCoins} 💰  •  +${mission.rewardWater} 💧`;

    this.missionCompleteModal.classList.add('show');
    setTimeout(() => {
      this.missionCompleteModal.classList.remove('show');
    }, 3800);
  }

  showLevelUp(data) {
    document.getElementById('lu-level').textContent = `المستوى ${data.newLevel}`;
    document.getElementById('lu-title').textContent = data.title;

    this.levelUpModal.classList.add('show');
    setTimeout(() => {
      this.levelUpModal.classList.remove('show');
    }, 4200);
  }

  showAchievementUnlocked(ach) {
    this.showToast(`🏆 وسام جديد: ${ach.icon} «${ach.title}» - ${ach.description}`);
  }

  openAchievementsModal() {
    this.game.input.setEnabled(false);
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = '';

    const list = this.game.achievementSystem.getAll();
    list.forEach(ach => {
      const card = document.createElement('div');
      card.className = `ach-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.description}</div>
          <div class="ach-status">${ach.unlocked ? '✅ تم الإنجاز' : 'قيد الإنجاز'}</div>
        </div>
      `;
      grid.appendChild(card);
    });

    this.achievementsModal.classList.add('show');
  }

  openPauseModal() {
    this.game.input.setEnabled(false);
    this.pauseModal.classList.add('show');
  }

  closePauseModal() {
    this.pauseModal.classList.remove('show');
    this.game.input.setEnabled(true);
  }

  spawnFloatText(worldPos, text, color = '#2ecc71') {
    const v = worldPos.clone().project(this.game.engine.camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (v.y * -0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.color = color;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  showToast(msg, duration = 3000) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, duration);
  }
}
