// لوحة المتصدرين (Leaderboard Modal)

import { store } from "../state/store.js";
import { iconSvg } from "../../../_shared/svgIcons.js";

export class LeaderboardModal {
  constructor() {
    this.backdrop = document.getElementById("leaderboard-modal-backdrop");
    this.listEl = document.getElementById("leaderboard-list");
    this.closeBtn = document.getElementById("leaderboard-close-btn");

    this.mockLeaders = [
      { name: "طارق بن زياد", title: "مستكشف نوميدي أسطوري", stars: 174, wilayas: 58, badge: "1" },
      { name: "فاطمة نسومر", title: "سيدة جرجرة الحكيمة", stars: 152, wilayas: 48, badge: "2" },
      { name: "العربي بن مهيدي", title: "فارس الأوراس الباسل", stars: 138, wilayas: 42, badge: "3" },
      { name: "مفدي زكريا", title: "شاعر الإلياذة الجزائرية", stars: 110, wilayas: 36, badge: "4" },
      { name: "ابن باديس", title: "علامة صخرة سيرتا", stars: 95, wilayas: 30, badge: "5" }
    ];

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

    // إدراج اللاعب الحالي في القائمة بناء على نجومه
    const playerEntry = {
      name: state.playerName || "أنت (المستكشف)",
      title: "رحالتنا المتميز",
      stars: state.totalStars || 0,
      wilayas: (state.completedWilayas || []).length,
      isPlayer: true
    };

    const allEntries = [...this.mockLeaders, playerEntry].sort((a, b) => b.stars - a.stars);

    allEntries.forEach((entry, idx) => {
      const item = document.createElement("div");
      item.className = "list-item-card";
      if (entry.isPlayer) {
        item.style.borderColor = "var(--c-gold)";
        item.style.background = "rgba(58, 142, 230, 0.2)";
      }

      const rankClass = idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-other";

      item.innerHTML = `
        <div class="item-left">
          <div class="rank-badge ${rankClass}">${idx + 1}</div>
          <div class="item-texts">
            <span class="item-title">${entry.name} ${entry.isPlayer ? "(أنت)" : ""}</span>
            <span class="item-desc">${entry.title} • ${entry.wilayas} ولاية مكتملة</span>
          </div>
        </div>
        <div style="font-weight:800; color:var(--text-gold); font-size:0.9rem;">
          ${iconSvg("star", { fill: "currentColor" })} ${entry.stars}
        </div>
      `;

      this.listEl.appendChild(item);
    });
  }
}
