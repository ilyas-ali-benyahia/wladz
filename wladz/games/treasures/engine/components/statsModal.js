// نافذة إحصائيات اللاعب ونسبة إكمال الولايات (Stats Modal)

import { store } from "../state/store.js";
import { WILAYAS_DATA } from "../data/wilayas.js";
import { iconSvg } from "../../../_shared/svgIcons.js";

export class StatsModal {
  constructor() {
    this.backdrop = document.getElementById("stats-modal-backdrop");
    this.contentBox = document.getElementById("stats-modal-content");
    this.closeBtn = document.getElementById("stats-close-btn");

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
    if (!this.contentBox) return;
    const state = store.getState();
    const stats = state.stats;
    const completedCount = (state.completedWilayas || []).length;
    const unlockedCount = (state.unlockedWilayas || []).length;

    // حساب نسبة دقة الإجابات بدون تلميحات
    const accuracy = stats.totalSolved > 0
      ? Math.max(10, Math.round(((stats.totalSolved - (stats.totalHintsUsed * 0.5)) / stats.totalSolved) * 100))
      : 100;

    this.contentBox.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%;">
        <div class="quick-feature-card">
          <span class="qf-icon">${iconSvg("star", { fill: "currentColor" })}</span>
          <div class="qf-info">
            <span class="qf-title">${state.totalStars || 0}</span>
            <span class="qf-sub">إجمالي النجوم</span>
          </div>
        </div>
        <div class="quick-feature-card">
          <span class="qf-icon">${iconSvg("map")}</span>
          <div class="qf-info">
            <span class="qf-title">${completedCount} / 58</span>
            <span class="qf-sub">الولايات المكتملة</span>
          </div>
        </div>
        <div class="quick-feature-card">
          <span class="qf-icon">${iconSvg("target")}</span>
          <div class="qf-info">
            <span class="qf-title">${stats.totalSolved || 0}</span>
            <span class="qf-sub">مراحل تم حلها</span>
          </div>
        </div>
        <div class="quick-feature-card">
          <span class="qf-icon">${iconSvg("flame")}</span>
          <div class="qf-info">
            <span class="qf-title">${accuracy}%</span>
            <span class="qf-sub">دقة الاستكشاف</span>
          </div>
        </div>
      </div>

      <div style="width:100%; margin-top:14px; text-align:right;">
        <h4 style="font-size:0.9rem; color:var(--text-gold); margin-bottom:8px;">نسبة إنجاز الولايات المفتوحة:</h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; padding-left:4px;">
          ${(state.unlockedWilayas || [1]).map((wId) => {
            const w = WILAYAS_DATA.find((x) => x.id === wId) || { name: `ولاية ${wId}`, totalStages: 6 };
            const prog = store.getWilayaProgress(wId, w.totalStages);
            const isDone = state.completedWilayas.includes(wId);
            return `
              <div style="background:rgba(58, 142, 230, 0.06); padding:8px 12px; border-radius:var(--radius-md); border:1px solid var(--border-glass);">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:4px;">
                  <span>${w.name} (${w.code || wId})</span>
                  <span style="color:${isDone ? '#34d399' : 'var(--text-gold)'}">${isDone ? iconSvg('check') + ' مكتملة 100%' : `${prog}%`}</span>
                </div>
                <div class="progress-bar-bg" style="height:6px;">
                  <div class="progress-bar-fill" style="width:${prog}%; background:${isDone ? '#10b981' : 'var(--c-primary)'};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
}
