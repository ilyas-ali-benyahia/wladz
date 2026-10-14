// نافذة الإنجازات والأوسمة التراثية (Achievements Modal)

import { ACHIEVEMENTS_DATA } from "../data/achievements.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";
import { iconSvg } from "../../../_shared/svgIcons.js";

export class AchievementsModal {
  constructor(confettiEngine) {
    this.confetti = confettiEngine;
    this.backdrop = document.getElementById("achievements-modal-backdrop");
    this.listEl = document.getElementById("achievements-list");
    this.closeBtn = document.getElementById("achievements-close-btn");

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hide());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener("click", (e) => {
        if (e.target === this.backdrop) this.hide();
      });
    }
  }

  show() {
    if (!this.backdrop) return;
    this.render();
    this.backdrop.classList.add("active");
  }

  hide() {
    if (this.backdrop) {
      this.backdrop.classList.remove("active");
    }
  }

  render() {
    if (!this.listEl) return;
    this.listEl.innerHTML = "";
    const state = store.getState();

    ACHIEVEMENTS_DATA.forEach((ach) => {
      const isCompleted = ach.check(state);

      const item = document.createElement("div");
      item.className = "list-item-card";

      item.innerHTML = `
        <div class="item-left">
          <span style="font-size:1.6rem; display:inline-flex; color:var(--text-gold);">${iconSvg(ach.icon)}</span>
          <div class="item-texts">
            <span class="item-title">${ach.title}</span>
            <span class="item-desc">${ach.description}</span>
          </div>
        </div>
        <div>
          ${
            isCompleted
              ? `<span style="font-size:0.75rem; color:#10b981; font-weight:700;">${iconSvg("check")} تمّ</span>`
              : `<span style="font-size:0.75rem; color:#4a5a85;">قيد الإنجاز</span>`
          }
        </div>
      `;

      this.listEl.appendChild(item);
    });

  }

}
