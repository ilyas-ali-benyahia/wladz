// محرك اللعبة الأساسي (Game Engine Component)
// يدعم جميع أنواع المراحل والتلميحات والمؤثرات التفاعلية

import { getStagesForWilaya } from "../data/stages.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";

// WLADZ : la réponse envoyée au serveur, qui la compare à la sienne (voir games/treasures/answers.ts).
function wladzAnswer(stage) {
  switch (stage.type) {
    case "multiple_choice":
    case "which_wilaya":
      // Les options des étapes générées sont mélangées à chaque chargement : on envoie le texte.
      return stage.correctOption ?? String(stage.correctIndex);
    case "missing_letters":
      return stage.missingChar;
    case "matching_pairs":
      return "pairs";
    default:
      return (stage.answer || "الجزائر").replace(/\s+/g, "");
  }
}

export class GameView {
  constructor(factModal, onBackToMap) {
    this.factModal = factModal;
    this.onBackToMap = onBackToMap;

    // عناصر واجهة المستخدم
    this.wilayaNameEl = document.getElementById("game-wilaya-name");
    this.stageCounterEl = document.getElementById("game-stage-counter");
    this.categoryEl = document.getElementById("game-category-tag");
    this.imageEl = document.getElementById("game-stage-image");
    this.mediaBadgeEl = document.getElementById("game-media-badge");
    this.questionSubtitleEl = document.getElementById("game-question-subtitle");
    this.questionTitleEl = document.getElementById("game-question-title");
    this.puzzleAreaEl = document.getElementById("game-puzzle-area");
    this.errorBannerEl = document.getElementById("game-error-banner");
    this.backBtn = document.getElementById("game-back-btn");

    // أزرار التلميحات
    this.hintRevealBtn = document.getElementById("hint-reveal-btn");
    this.hintRemoveBtn = document.getElementById("hint-remove-btn");

    this.currentWilaya = null;
    this.stages = [];
    this.currentStageIdx = 0;
    this.currentStage = null;
    this.usedHintsInStage = 0;

    // حالة لعبة الحروف
    this.slotLetters = []; // الحروف في خانات الإجابة
    this.poolLetters = []; // بنك الحروف في الأسفل
    this.matchingSelected = null; // للمطابقة
    this.matchedPairsCount = 0;

    this.initEvents();
  }

  initEvents() {
    if (this.backBtn) {
      this.backBtn.addEventListener("click", () => {
        sounds.playLetterClick();
        if (this.onBackToMap) this.onBackToMap();
      });
    }

    if (this.hintRevealBtn) {
      this.hintRevealBtn.addEventListener("click", () => this.useRevealHint());
    }

    if (this.hintRemoveBtn) {
      this.hintRemoveBtn.addEventListener("click", () => this.useRemoveDecoysHint());
    }

  }

  loadWilaya(wilaya) {
    this.currentWilaya = wilaya;
    this.stages = getStagesForWilaya(wilaya);
    this.currentStageIdx = 0;

    // استئناف من أول مرحلة غير محلولة إن وجدت
    const state = store.getState();
    for (let i = 0; i < this.stages.length; i++) {
      if (!state.solvedStages[this.stages[i].id]) {
        this.currentStageIdx = i;
        break;
      }
    }

    this.renderCurrentStage();
  }

  nextStage() {
    if (this.currentStageIdx < this.stages.length - 1) {
      this.currentStageIdx++;
      this.renderCurrentStage();
    } else {
      // إكمال الولاية والعودة للخريطة
      store.completeWilaya(this.currentWilaya.id);
      if (this.onBackToMap) this.onBackToMap();
    }
  }

  renderCurrentStage() {
    this.currentStage = this.stages[this.currentStageIdx];
    this.usedHintsInStage = 0;
    if (this.errorBannerEl) this.errorBannerEl.classList.remove("show");

    // تحديث الترويسة
    if (this.wilayaNameEl) this.wilayaNameEl.textContent = `ولاية ${this.currentWilaya.name}`;
    if (this.stageCounterEl) this.stageCounterEl.textContent = `المرحلة ${this.currentStageIdx + 1} من ${this.stages.length}`;
    if (this.categoryEl) this.categoryEl.textContent = this.currentStage.category || "تراث ومعالم";

    // تحديث الصورة
    if (this.imageEl) {
      this.imageEl.src = this.currentStage.image || "/games/treasures/assets/banner.jpg";
      this.imageEl.alt = this.currentStage.title || "معلم جزائري";
    }
    if (this.mediaBadgeEl) {
      this.mediaBadgeEl.textContent = this.currentStage.category || "كنوز الجزائر";
    }

    // تحديث نص السؤال
    if (this.questionSubtitleEl) this.questionSubtitleEl.textContent = this.currentStage.title || "";
    if (this.questionTitleEl) this.questionTitleEl.textContent = this.currentStage.question || "";

    // تفريغ منطقة اللعب وبناء الوضع المخصص
    if (this.puzzleAreaEl) {
      this.puzzleAreaEl.innerHTML = "";
    }

    switch (this.currentStage.type) {
      case "word_scramble":
        this.setupWordScramble(this.currentStage.answer, this.currentStage.decoyLetters);
        break;
      case "multiple_choice":
      case "which_wilaya":
        this.setupMultipleChoice(this.currentStage);
        break;
      case "complete_name":
        this.setupCompleteName(this.currentStage);
        break;
      case "missing_letters":
        this.setupMissingLetters(this.currentStage);
        break;
      case "matching_pairs":
        this.setupMatchingPairs(this.currentStage.pairs);
        break;
      default:
        this.setupWordScramble(this.currentStage.answer || "الجزائر", "ب ت ث ج");
    }
  }

  // =========================================================
  // النوع 1: تكوين الكلمة بالحروف المبعثرة
  // =========================================================
  setupWordScramble(answerText, decoyLettersStr = "") {
    const cleanAnswer = answerText.replace(/\s+/g, "");
    const targetLetters = cleanAnswer.split("");
    const decoys = decoyLettersStr.split(/\s+/).filter(Boolean);

    // دمج الحروف وخلطها
    const allChars = [...targetLetters, ...decoys].sort(() => Math.random() - 0.5);

    this.slotLetters = new Array(targetLetters.length).fill(null);
    this.poolLetters = allChars.map((char, idx) => ({ id: idx, char, isUsed: false, isHidden: false }));

    const wrap = document.createElement("div");
    wrap.className = "word-puzzle-area";

    // صف خانات الإجابة
    const slotsRow = document.createElement("div");
    slotsRow.className = "answer-slots-row";
    slotsRow.id = "answer-slots-container";

    for (let i = 0; i < targetLetters.length; i++) {
      const slot = document.createElement("div");
      slot.className = "answer-slot";
      slot.setAttribute("data-slot-idx", i);
      slot.addEventListener("click", () => this.handleSlotClick(i));
      slotsRow.appendChild(slot);
    }

    // شبكة الحروف في الأسفل
    const poolGrid = document.createElement("div");
    poolGrid.className = "letters-pool-grid";
    poolGrid.id = "letters-pool-container";

    this.poolLetters.forEach((item, poolIdx) => {
      const tile = document.createElement("div");
      tile.className = "letter-tile";
      tile.textContent = item.char;
      tile.setAttribute("data-pool-idx", poolIdx);
      tile.addEventListener("click", () => this.handlePoolTileClick(poolIdx));
      poolGrid.appendChild(tile);
    });

    wrap.appendChild(slotsRow);
    wrap.appendChild(poolGrid);
    this.puzzleAreaEl.appendChild(wrap);
  }

  handlePoolTileClick(poolIdx) {
    const item = this.poolLetters[poolIdx];
    if (item.isUsed || item.isHidden) return;

    // العثور على أول خانة فارغة
    const emptySlotIdx = this.slotLetters.findIndex((slot) => slot === null);
    if (emptySlotIdx === -1) return;

    item.isUsed = true;
    this.slotLetters[emptySlotIdx] = { char: item.char, poolIdx: poolIdx };
    sounds.playLetterClick();

    this.updateSlotsAndPoolUI();
    this.checkScrambleAnswer();
  }

  handleSlotClick(slotIdx) {
    const slotItem = this.slotLetters[slotIdx];
    if (!slotItem || slotItem.isLocked) return;

    // تحرير الحرف في البنك
    this.poolLetters[slotItem.poolIdx].isUsed = false;
    this.slotLetters[slotIdx] = null;
    sounds.playLetterRemove();

    this.updateSlotsAndPoolUI();
  }

  updateSlotsAndPoolUI() {
    const slotsContainer = document.getElementById("answer-slots-container");
    const poolContainer = document.getElementById("letters-pool-container");
    if (!slotsContainer || !poolContainer) return;

    // تحديث الخانات
    const slotEls = slotsContainer.querySelectorAll(".answer-slot");
    slotEls.forEach((slotEl, idx) => {
      const item = this.slotLetters[idx];
      if (item) {
        slotEl.textContent = item.char;
        slotEl.className = `answer-slot filled ${item.isLocked ? "hinted" : ""}`;
      } else {
        slotEl.textContent = "";
        slotEl.className = "answer-slot";
      }
    });

    // تحديث حروف البنك
    const tileEls = poolContainer.querySelectorAll(".letter-tile");
    tileEls.forEach((tileEl, idx) => {
      const item = this.poolLetters[idx];
      tileEl.className = `letter-tile ${item.isUsed ? "used" : ""} ${item.isHidden ? "hidden-by-hint" : ""}`;
    });
  }

  checkScrambleAnswer() {
    // إذا كانت جميع الخانات ممتلئة
    const isFull = this.slotLetters.every((s) => s !== null);
    if (!isFull) return;

    const currentWord = this.slotLetters.map((s) => s.char).join("");
    const targetWord = this.currentStage.answer.replace(/\s+/g, "");

    if (currentWord === targetWord) {
      this.handleStageSuccess();
    } else {
      sounds.playWrong();
      if (this.errorBannerEl) {
        this.errorBannerEl.textContent = "إجابة خاطئة! حاول إعادة ترتيب الحروف";
        this.errorBannerEl.classList.add("show");
        setTimeout(() => this.errorBannerEl?.classList.remove("show"), 2500);
      }
      const slotsContainer = document.getElementById("answer-slots-container");
      if (slotsContainer) {
        slotsContainer.style.animation = "shakeX 0.4s ease-in-out";
        setTimeout(() => (slotsContainer.style.animation = ""), 450);
      }
    }
  }

  // =========================================================
  // النوع 2 و 3: اختيار من متعدد / من أي ولاية؟
  // =========================================================
  setupMultipleChoice(stage) {
    const grid = document.createElement("div");
    grid.className = "quiz-options-grid";
    const letters = ["أ", "ب", "ج", "د"];

    stage.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option-btn";
      btn.innerHTML = `
        <span class="quiz-option-letter">${letters[idx] || (idx + 1)}</span>
        <span>${optText}</span>
      `;

      btn.addEventListener("click", () => {
        if (idx === stage.correctIndex) {
          btn.classList.add("correct");
          sounds.playCorrect();
          setTimeout(() => this.handleStageSuccess(), 600);
        } else {
          btn.classList.add("wrong");
          sounds.playWrong();
          this.usedHintsInStage++;
        }
      });

      grid.appendChild(btn);
    });

    this.puzzleAreaEl.appendChild(grid);
  }

  // =========================================================
  // النوع 4: أكمل الاسم / المثل
  // =========================================================
  setupCompleteName(stage) {
    const clueBox = document.createElement("div");
    clueBox.style.cssText = "font-size:1.1rem; font-weight:800; color:var(--text-gold); text-align:center; margin-bottom:12px;";
    clueBox.textContent = stage.clue || "";
    this.puzzleAreaEl.appendChild(clueBox);

    this.setupWordScramble(stage.answer, stage.decoyLetters || "ب س ل ك م");
  }

  // =========================================================
  // النوع 5: الحروف الناقصة
  // =========================================================
  setupMissingLetters(stage) {
    const patternBox = document.createElement("div");
    patternBox.className = "missing-pattern-display";
    patternBox.textContent = stage.pattern;
    this.puzzleAreaEl.appendChild(patternBox);

    const decoys = (stage.decoyLetters || "ن ل م ر ص ب").split(/\s+/);
    const candidateChars = [stage.missingChar, ...decoys].sort(() => Math.random() - 0.5);

    const grid = document.createElement("div");
    grid.className = "letters-pool-grid";
    grid.style.marginTop = "14px";

    candidateChars.forEach((char) => {
      const tile = document.createElement("div");
      tile.className = "letter-tile";
      tile.textContent = char;

      tile.addEventListener("click", () => {
        if (char === stage.missingChar) {
          tile.style.borderColor = "#10b981";
          patternBox.textContent = stage.pattern.replace("_", char);
          sounds.playCorrect();
          setTimeout(() => this.handleStageSuccess(), 500);
        } else {
          sounds.playWrong();
          tile.style.borderColor = "#ef4444";
          this.usedHintsInStage++;
        }
      });

      grid.appendChild(tile);
    });

    this.puzzleAreaEl.appendChild(grid);
  }

  // =========================================================
  // النوع 6: لعبة مطابقة البطاقات (Matching Pairs)
  // =========================================================
  setupMatchingPairs(pairs) {
    this.matchingSelected = null;
    this.matchedPairsCount = 0;

    // تفكيك البطاقات وخلطها
    const cards = [];
    pairs.forEach((p, pIdx) => {
      cards.push({ text: p.item, pairId: pIdx });
      cards.push({ text: p.match, pairId: pIdx });
    });
    cards.sort(() => Math.random() - 0.5);

    const grid = document.createElement("div");
    grid.className = "matching-game-grid";

    cards.forEach((cardData) => {
      const cardBtn = document.createElement("button");
      cardBtn.className = "match-card-btn";
      cardBtn.textContent = cardData.text;

      cardBtn.addEventListener("click", () => {
        sounds.playLetterClick();

        if (this.matchingSelected === null) {
          this.matchingSelected = { cardData, element: cardBtn };
          cardBtn.classList.add("selected");
        } else {
          if (this.matchingSelected.element === cardBtn) {
            // إلغاء التحديد
            cardBtn.classList.remove("selected");
            this.matchingSelected = null;
            return;
          }

          if (this.matchingSelected.cardData.pairId === cardData.pairId) {
            // مطابقة صحيحة!
            sounds.playCorrect();
            this.matchingSelected.element.classList.remove("selected");
            this.matchingSelected.element.classList.add("matched");
            cardBtn.classList.add("matched");
            this.matchingSelected = null;
            this.matchedPairsCount++;

            if (this.matchedPairsCount === pairs.length) {
              setTimeout(() => this.handleStageSuccess(), 600);
            }
          } else {
            // مطابقة خاطئة
            sounds.playWrong();
            cardBtn.classList.add("selected");
            setTimeout(() => {
              this.matchingSelected?.element.classList.remove("selected");
              cardBtn.classList.remove("selected");
              this.matchingSelected = null;
            }, 600);
          }
        }
      });

      grid.appendChild(cardBtn);
    });

    this.puzzleAreaEl.appendChild(grid);
  }

  // =========================================================
  // تلميحات اللعب
  // =========================================================
  useRevealHint() {
    if (!this.slotLetters || this.slotLetters.length === 0) return;
    store.recordHintUsed();
    this.usedHintsInStage++;
    sounds.playCoin();

    const cleanAnswer = this.currentStage.answer.replace(/\s+/g, "");

    // البحث عن أول خانة غير مقفلة أو خاطئة
    for (let i = 0; i < cleanAnswer.length; i++) {
      const correctChar = cleanAnswer[i];
      const currentInSlot = this.slotLetters[i];

      if (!currentInSlot || currentInSlot.char !== correctChar || !currentInSlot.isLocked) {
        // إذا كان هناك حرف آخر خاطئ، أعده للبنك
        if (currentInSlot) {
          this.poolLetters[currentInSlot.poolIdx].isUsed = false;
        }

        // ابحث عن الحرف الصحيح في البنك
        const poolItem = this.poolLetters.find((p) => p.char === correctChar && !p.isUsed && !p.isHidden);
        if (poolItem) {
          poolItem.isUsed = true;
          this.slotLetters[i] = { char: correctChar, poolIdx: poolItem.id, isLocked: true };
        } else {
          this.slotLetters[i] = { char: correctChar, poolIdx: -1, isLocked: true };
        }

        this.updateSlotsAndPoolUI();
        this.checkScrambleAnswer();
        break;
      }
    }
  }

  useRemoveDecoysHint() {
    if (!this.poolLetters || this.poolLetters.length === 0) return;
    store.recordHintUsed();
    this.usedHintsInStage++;
    sounds.playCoin();

    const cleanAnswer = this.currentStage.answer.replace(/\s+/g, "");
    let removedCount = 0;

    this.poolLetters.forEach((p) => {
      if (removedCount >= 3) return;
      if (!p.isUsed && !p.isHidden && !cleanAnswer.includes(p.char)) {
        p.isHidden = true;
        removedCount++;
      }
    });

    this.updateSlotsAndPoolUI();
  }

  handleStageSuccess(forcedStars = null) {
    // WLADZ : chaque étape réussie est envoyée au serveur ; une wilaya entièrement
    // réussie rapporte 1 point au compte de l'enfant.
    if (forcedStars === null) {
      window.dispatchEvent(new CustomEvent("treasures:solved", {
        detail: { stageId: this.currentStage.id, answer: wladzAnswer(this.currentStage) },
      }));
    }
    let stars = forcedStars;
    if (stars === null) {
      stars = this.usedHintsInStage === 0 ? 3 : this.usedHintsInStage === 1 ? 2 : 1;
    }

    const isLastStageOfWilaya = this.currentStageIdx === this.stages.length - 1;
    const fact = {
      ...this.currentStage.fact,
      isWilayaCompleted: isLastStageOfWilaya
    };

    // حفظ في الحالة المحلية
    store.markStageSolved(
      this.currentStage.id,
      this.currentWilaya.id,
      stars,
      0, // WLADZ : plus de pièces
      0, // WLADZ : plus de joyaux
      this.usedHintsInStage > 0
    );

    if (isLastStageOfWilaya) {
      store.completeWilaya(this.currentWilaya.id);
    }

    // إظهار بطاقة "هل تعلم؟"
    this.factModal.show(fact, stars, this.currentWilaya);
  }
}
