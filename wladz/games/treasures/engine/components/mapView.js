// عرض الخريطة ومسار رحلة استكشاف ولايات الجزائر (Map & Journey Component)

import { WILAYAS_DATA } from "../data/wilayas.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";
import { WILAYAS_INFO } from "../data/wilayasInfo.js";
import { iconSvg } from "../../../_shared/svgIcons.js";

export class MapView {
  constructor(onSelectWilaya, { onFilter, onInfo } = {}) {
    this.onSelectWilaya = onSelectWilaya;
    this.onFilter = onFilter;
    this.onInfo = onInfo;
    this.container = document.getElementById("wilayas-journey-list");
    this.searchInput = document.getElementById("wilaya-search-input");
    this.regionChips = document.querySelectorAll(".region-chip");
    
    this.currentRegion = "all";
    this.searchQuery = "";

    this.initEvents();
  }

  initEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.render();
      });
    }

    if (this.regionChips) {
      this.regionChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          this.regionChips.forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          this.currentRegion = chip.getAttribute("data-region");
          this.render();
        });
      });
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";
    const state = store.getState();

    // تصفية الولايات حسب البحث والمنطقة
    const filtered = WILAYAS_DATA.filter((w) => {
      const info = WILAYAS_INFO[w.id - 1];
      const extra = info
        ? [info.name_fr, info.name_en, info.capital, ...info.details.famous_landmarks].join(" ").toLowerCase()
        : "";
      const matchSearch =
        !this.searchQuery ||
        w.name.toLowerCase().includes(this.searchQuery) ||
        w.code.includes(this.searchQuery) ||
        w.famousFor.toLowerCase().includes(this.searchQuery) ||
        extra.includes(this.searchQuery);

      const matchRegion =
        this.currentRegion === "all" ||
        w.region.includes(this.currentRegion);

      return matchSearch && matchRegion;
    });

    this.onFilter?.(new Set(filtered.map((w) => w.id)));

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.9rem;">
          لم يتم العثور على ولايات مطابقة لبحثك
        </div>
      `;
      return;
    }

    filtered.forEach((wilaya) => {
      const isUnlocked = store.isWilayaUnlocked(wilaya.id);
      const isCompleted = store.isWilayaCompleted(wilaya.id);
      const isCurrent = state.currentWilayaId === wilaya.id;
      const progress = store.getWilayaProgress(wilaya.id, wilaya.totalStages);

      const card = document.createElement("div");
      card.className = `wilaya-card ${isUnlocked ? "unlocked" : "locked"} ${isCurrent ? "current" : ""}`;

      card.innerHTML = `
        <div class="wilaya-header">
          <div class="wilaya-main-info">
            <div class="wilaya-num-badge">${wilaya.code}</div>
            <div class="wilaya-titles">
              <span class="wilaya-name">
                ولاية ${wilaya.name}
                ${isCompleted ? `<span>${iconSvg('trophy')}</span>` : ''}
              </span>
              <span class="wilaya-region-tag">${wilaya.region}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="wilaya-info-btn" data-info="${wilaya.id}">${iconSvg("info")} معلومات</button>
            ${
              isCompleted
                ? `<span class="wilaya-status-pill status-completed">${iconSvg("check")} مكتملة</span>`
                : isUnlocked
                ? `<span class="wilaya-status-pill status-current">مفتوحة للعب</span>`
                : `<span class="wilaya-status-pill status-locked">${iconSvg("lock")} مقفلة</span>`
            }
          </div>
        </div>

        <div class="wilaya-badge-preview">
          <span class="w-badge-icon">${iconSvg(wilaya.badge.icon)}</span>
          <div>
            <div class="w-badge-text">${wilaya.badge.name}</div>
            <div style="font-size:0.72rem; color:#4a5a85;">${wilaya.famousFor.split('،').slice(0, 2).join('، ')}</div>
          </div>
        </div>

        ${
          isUnlocked
            ? `
          <div class="wilaya-progress-box">
            <div class="progress-header">
              <span>نسبة الإنجاز</span>
              <span>${progress}% (${Math.round((progress / 100) * wilaya.totalStages)} / ${wilaya.totalStages} مراحل)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width:${progress}%;"></div>
            </div>
          </div>
        `
            : `
          <div style="font-size:0.75rem; color:#4a5a85; text-align:center;">
            ${iconSvg("lock")} أكمل مراحل ولاية ${wilaya.id > 1 ? WILAYAS_DATA[wilaya.id - 2]?.name : 'السابقة'} لفتح هذه الولاية تلقائياً
          </div>
        `
        }

        <button class="wilaya-action-btn" data-id="${wilaya.id}" ${!isUnlocked ? "disabled" : ""}>
          ${
            isUnlocked
              ? `<span>${isCompleted ? 'إعادة استكشاف المراحل ' + iconSvg('rotate-ccw') : 'دخول واستكشاف الولاية ' + iconSvg('gamepad-2')}</span>`
              : `<span>مرحلة مقفلة ${iconSvg("lock")}</span>`
          }
        </button>
      `;

      // أحداث النقر
      card.querySelector(".wilaya-info-btn")?.addEventListener("click", () => {
        sounds.playLetterClick();
        this.onInfo?.(wilaya.id);
      });

      const btn = card.querySelector(".wilaya-action-btn");
      if (btn && isUnlocked) {
        btn.addEventListener("click", () => {
          sounds.playLetterClick();
          if (this.onSelectWilaya) {
            this.onSelectWilaya(wilaya);
          }
        });
      }

      this.container.appendChild(card);
    });
  }
}
