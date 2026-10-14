// نافذة "هل تعلم؟" التراثية وبطاقة الاحتفال بالنجاح

import { sounds } from "../audio/audioEngine.js";

export class FactModal {
  constructor(confettiEngine, onNextStage, onBackToMap) {
    this.confetti = confettiEngine;
    this.onNextStage = onNextStage;
    this.onBackToMap = onBackToMap;
    this.backdrop = document.getElementById("fact-modal-backdrop");
    this.titleEl = document.getElementById("fact-title");
    this.textEl = document.getElementById("fact-text");
    this.starsBox = document.getElementById("fact-stars-box");
    this.rewardsBox = document.getElementById("fact-rewards-box");
    this.nextBtn = document.getElementById("fact-next-btn");
    this.closeBtn = document.getElementById("fact-close-btn");

    this.initEvents();
  }

  initEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => {
        this.hide();
        if (this.currentStageData && this.currentStageData.isWilayaCompleted) {
          if (this.onBackToMap) this.onBackToMap();
        } else {
          if (this.onNextStage) this.onNextStage();
        }
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => {
        this.hide();
      });
    }

    if (this.backdrop) {
      this.backdrop.addEventListener("click", (e) => {
        if (e.target === this.backdrop) this.hide();
      });
    }
  }

  show(factData, starsEarned = 3, wilayaData = null) {
    this.currentStageData = factData;
    sounds.playCorrect();
    if (this.confetti) {
      this.confetti.burst(80);
    }

    if (this.titleEl) {
      this.titleEl.textContent = factData.title || "هل تعلم؟";
    }

    if (this.textEl) {
      this.textEl.textContent = factData.text || "معلومة تراثية ممتعة عن أصالة وتاريخ الجزائر العريق.";
    }

    // عرض النجوم المستحقة
    if (this.starsBox) {
      this.starsBox.innerHTML = "";
      for (let i = 1; i <= 3; i++) {
        const star = document.createElement("span");
        star.className = "star-icon-anim";
        star.style.animationDelay = `${i * 0.15}s`;
        star.textContent = i <= starsEarned ? "⭐" : "☆";
        this.starsBox.appendChild(star);
      }
    }

    // عرض الجوائز
    if (this.rewardsBox) {
      // WLADZ : plus de pièces ni de joyaux ; une wilaya terminée rapporte 1 point.
      this.rewardsBox.innerHTML = factData.isWilayaCompleted
        ? `<div class="reward-tag gold">⭐ +1 نقطة في حسابك</div>`
        : "";
    }

    // نص الزر عند إكمال الولاية
    if (this.nextBtn) {
      if (factData.isWilayaCompleted) {
        sounds.playWilayaUnlocked();
        this.nextBtn.innerHTML = `<span>🏆 الظفر بالوسام والانتقال للولاية التالية</span>`;
      } else {
        this.nextBtn.innerHTML = `<span>المرحلة التالية</span> <span>←</span>`;
      }
    }

    if (this.backdrop) {
      this.backdrop.classList.add("active");
    }
  }

  hide() {
    if (this.backdrop) {
      this.backdrop.classList.remove("active");
    }
  }
}
