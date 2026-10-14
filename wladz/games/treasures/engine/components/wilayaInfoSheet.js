// بطاقة معلومات الولاية: التاريخ، الأعلام، التقاليد، الثقافة والمعالم (Wilaya Info Sheet)

import { WILAYAS_INFO } from "../data/wilayasInfo.js";
import { WILAYAS_DATA } from "../data/wilayas.js";
import { WILAYA_PATHS } from "../data/mapPaths.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";
import { REGION_STYLES } from "./interactiveMap.js";

const TABS = [
  { id: "history", label: "التاريخ", icon: "📜" },
  { id: "people", label: "أعلام", icon: "👤" },
  { id: "traditions", label: "تقاليد", icon: "🧵" },
  { id: "culture", label: "ثقافة", icon: "🍲" },
  { id: "landmarks", label: "معالم", icon: "🏛️" },
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const pad = (n) => String(n).padStart(2, "0");

export class WilayaInfoSheet {
  constructor({ getBBox, onPlay, onNavigate, onClose }) {
    this.getBBox = getBBox;
    this.onPlay = onPlay;
    this.onNavigate = onNavigate;
    this.onClose = onClose;

    this.backdrop = document.getElementById("wilaya-sheet-backdrop");
    this.card = document.getElementById("wilaya-sheet-card");
    this.body = document.getElementById("wilaya-sheet-body");
    this.closeBtn = document.getElementById("wilaya-sheet-close");

    this.code = null;
    this.tab = "history";
    this.openedAt = 0;

    this.initEvents();
  }

  initEvents() {
    this.closeBtn?.addEventListener("click", () => this.hide());
    this.backdrop?.addEventListener("click", (e) => {
      // تجاهل "النقرة الوهمية" التي تتبع لمسة فتح البطاقة على الهواتف
      if (performance.now() - this.openedAt < 450) return;
      if (e.target === this.backdrop) this.hide();
    });

    document.addEventListener("keydown", (e) => {
      if (!this.isOpen()) return;
      if (e.key === "Escape") this.hide();
      // الواجهة من اليمين لليسار: السهم الأيسر = التالي
      else if (e.key === "ArrowLeft") this.step(1);
      else if (e.key === "ArrowRight") this.step(-1);
    });

    // تفويض الأحداث لعناصر المحتوى المتجدد
    this.body?.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-tab]");
      if (tabBtn) {
        sounds.playLetterClick();
        this.setTab(tabBtn.dataset.tab);
        return;
      }
      const nav = e.target.closest("[data-step]");
      if (nav) {
        this.step(Number(nav.dataset.step));
        return;
      }
      if (e.target.closest("[data-action='play']")) {
        const wilaya = WILAYAS_DATA.find((w) => w.id === this.code);
        if (wilaya && store.isWilayaUnlocked(wilaya.id)) {
          sounds.playLetterClick();
          this.hide();
          this.onPlay?.(wilaya);
        }
      }
    });

    this.initSwipeToClose();
  }

  // سحب البطاقة للأسفل لإغلاقها على الهواتف
  initSwipeToClose() {
    const handle = document.getElementById("wilaya-sheet-handle");
    if (!handle || !this.card) return;
    let startY = null;
    let dy = 0;

    handle.addEventListener("pointerdown", (e) => {
      startY = e.clientY;
      dy = 0;
      handle.setPointerCapture(e.pointerId);
      this.card.style.transition = "none";
    });
    handle.addEventListener("pointermove", (e) => {
      if (startY === null) return;
      dy = Math.max(0, e.clientY - startY);
      this.card.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (startY === null) return;
      startY = null;
      this.card.style.transition = "";
      this.card.style.transform = "";
      if (dy > 90) this.hide();
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  isOpen() {
    return this.backdrop?.classList.contains("active");
  }

  show(code) {
    if (!this.backdrop) return;
    const switching = this.isOpen() && this.code !== code;
    this.code = code;
    this.render();
    if (switching) {
      this.body.classList.remove("swap");
      void this.body.offsetWidth; // إعادة تشغيل حركة الانتقال
      this.body.classList.add("swap");
    }
    if (!this.isOpen()) this.openedAt = performance.now();
    this.backdrop.classList.add("active");
    document.body.classList.add("sheet-open");
  }

  hide() {
    if (!this.isOpen()) return;
    this.backdrop.classList.remove("active");
    document.body.classList.remove("sheet-open");
    this.onClose?.(this.code);
  }

  step(delta) {
    if (!this.code) return;
    const next = ((this.code - 1 + delta + WILAYAS_INFO.length) % WILAYAS_INFO.length) + 1;
    sounds.playLetterClick();
    this.show(next);
    this.onNavigate?.(next);
  }

  setTab(tab) {
    this.tab = tab;
    this.body.querySelectorAll("[data-tab]").forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active);
    });
    const panel = this.body.querySelector(".ws-panel");
    if (panel) {
      panel.innerHTML = this.renderPanel(WILAYAS_INFO[this.code - 1]);
      panel.classList.remove("enter");
      void panel.offsetWidth;
      panel.classList.add("enter");
    }
  }

  // ---------- العرض ----------

  silhouette(code, color) {
    const box = this.getBBox?.(code);
    if (!box) return "";
    const padU = Math.max(box.width, box.height) * 0.08;
    const vb = `${box.x - padU} ${box.y - padU} ${box.width + padU * 2} ${box.height + padU * 2}`;
    return `
      <svg class="ws-silhouette" viewBox="${vb}" aria-hidden="true">
        <path d="${WILAYA_PATHS[code]}" fill="${color}" vector-effect="non-scaling-stroke"/>
      </svg>`;
  }

  render() {
    const info = WILAYAS_INFO[this.code - 1];
    const game = WILAYAS_DATA.find((w) => w.id === this.code);
    if (!info) return;

    const region = REGION_STYLES[info.region] || { color: "#4a5a85" };
    const accent = game?.accent || region.color;
    const isUnlocked = store.isWilayaUnlocked(this.code);
    const isCompleted = store.isWilayaCompleted(this.code);
    const progress = game ? store.getWilayaProgress(game.id, game.totalStages) : 0;
    const prev = WILAYAS_INFO[(this.code - 2 + 58) % 58];
    const next = WILAYAS_INFO[this.code % 58];

    this.card.style.setProperty("--ws-accent", accent);
    this.card.style.setProperty("--ws-region", region.color);
    this.card.style.setProperty("--ws-hero-bg", game?.colorBg || `linear-gradient(135deg, #e3f3ff, ${region.color})`);

    const statusPill = isCompleted
      ? `<span class="wilaya-status-pill status-completed">✓ مكتملة</span>`
      : isUnlocked
      ? `<span class="wilaya-status-pill status-current">مفتوحة للعب</span>`
      : `<span class="wilaya-status-pill status-locked">🔒 مقفلة</span>`;

    const prevGameName = this.code > 1 ? WILAYAS_INFO[this.code - 2].name_ar : "";

    this.body.innerHTML = `
      <div class="ws-hero">
        ${this.silhouette(this.code, "rgba(58, 142, 230, 0.26)")}
        <div class="ws-hero-top">
          <span class="ws-code">${pad(info.code)}</span>
          ${game ? `<span class="ws-badge-icon">${game.badge.icon}</span>` : ""}
        </div>
        <h2 class="ws-name" id="wilaya-sheet-title">ولاية ${esc(info.name_ar)}</h2>
        <div class="ws-name-latin">${esc(info.name_fr)}${info.name_en !== info.name_fr ? ` · ${esc(info.name_en)}` : ""}</div>
        <div class="ws-meta">
          <span class="ws-meta-chip">🏙️ ${esc(info.capital)}</span>
          <span class="ws-meta-chip"><i style="background:${region.color}"></i>${esc(info.region_ar)}</span>
          <span class="ws-meta-chip">🧭 ${esc(info.details.geography_type)}</span>
        </div>
      </div>

      <div class="ws-funfact">
        <span class="ws-funfact-icon">💡</span>
        <div>
          <div class="ws-funfact-title">هل تعلم؟</div>
          <p>${esc(info.details.fun_fact)}</p>
        </div>
      </div>

      <div class="ws-tabs" role="tablist">
        ${TABS.map(
          (t) => `
          <button class="ws-tab ${t.id === this.tab ? "active" : ""}" data-tab="${t.id}" role="tab" aria-selected="${t.id === this.tab}">
            <span>${t.icon}</span>${t.label}
          </button>`
        ).join("")}
      </div>

      <div class="ws-panel enter" role="tabpanel">${this.renderPanel(info)}</div>

      <div class="ws-game-box">
        <div class="ws-game-head">
          <span>${game ? `${game.badge.icon} ${esc(game.badge.name)}` : "رحلة الولاية"}</span>
          ${statusPill}
        </div>
        ${
          isUnlocked && game
            ? `
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progress}%;"></div></div>
          <button class="btn btn-gold ws-play-btn" data-action="play">
            ${isCompleted ? "إعادة استكشاف المراحل 🔄" : "العب مراحل هذه الولاية 🎮"}
          </button>`
            : `<div class="ws-locked-note">🔒 أكمل مراحل ولاية ${esc(prevGameName || "السابقة")} لفتح مراحل هذه الولاية</div>`
        }
      </div>

      <div class="ws-nav">
        <button class="ws-nav-btn" data-step="-1" aria-label="الولاية السابقة">
          <span class="ws-nav-arrow">→</span>
          <span><small>${pad(prev.code)}</small> ${esc(prev.name_ar)}</span>
        </button>
        <button class="ws-nav-btn" data-step="1" aria-label="الولاية التالية">
          <span><small>${pad(next.code)}</small> ${esc(next.name_ar)}</span>
          <span class="ws-nav-arrow">←</span>
        </button>
      </div>
    `;
    this.body.scrollTop = 0;
  }

  chips(items, cls = "") {
    if (!items?.length) return `<p class="ws-empty">لا توجد معلومات متاحة</p>`;
    return `<div class="ws-chips">${items.map((i) => `<span class="ws-chip ${cls}">${esc(i)}</span>`).join("")}</div>`;
  }

  section(icon, title, content) {
    return `<div class="ws-section"><h4 class="ws-section-title"><span>${icon}</span>${title}</h4>${content}</div>`;
  }

  renderPanel(info) {
    switch (this.tab) {
      case "history":
        return `
          <p class="ws-summary">${esc(info.history.summary)}</p>
          ${this.section(
            "🕰️",
            "محطات تاريخية",
            `<ol class="ws-timeline">
              ${info.history.key_events
                .map((ev) => {
                  const i = ev.indexOf(":");
                  const date = i > 0 && i < 40 ? ev.slice(0, i) : "";
                  const text = date ? ev.slice(i + 1).trim() : ev;
                  return `<li>${date ? `<span class="ws-tl-date">${esc(date)}</span>` : ""}<span class="ws-tl-text">${esc(text)}</span></li>`;
                })
                .join("")}
            </ol>`
          )}`;

      case "people":
        return `
          <div class="ws-people">
            ${info.famous_people
              .map(
                (p) => `
              <div class="ws-person">
                <div class="ws-person-avatar">${esc(p.name_ar.replace(/^(الشيخ|سيدي|الأمير|الإمام|الحاج)\s+/, "").trim().charAt(0))}</div>
                <div class="ws-person-info">
                  <div class="ws-person-name">${esc(p.name_ar)}</div>
                  <div class="ws-person-latin">${esc(p.name_en)}</div>
                  <div class="ws-person-role">${esc(p.role)}</div>
                </div>
              </div>`
              )
              .join("")}
          </div>`;

      case "traditions":
        return [
          this.section("👘", "اللباس التقليدي", this.chips(info.traditions.clothing)),
          this.section("🏺", "الحرف والصناعات", this.chips(info.traditions.crafts)),
          this.section("🎉", "المهرجانات والمواسم", this.chips(info.traditions.festivals)),
        ].join("");

      case "culture":
        return [
          this.section("🍲", "أطباق ومأكولات", this.chips(info.culture.food_and_dishes, "food")),
          this.section("🎶", "الموسيقى والفنون", this.chips(info.culture.music_and_arts, "music")),
          this.section("🗣️", "كلمات ومقولات", this.chips(info.culture.famous_sayings_or_keywords, "saying")),
        ].join("");

      case "landmarks":
        return this.section(
          "📍",
          "أشهر المعالم",
          `<ul class="ws-landmarks">
            ${info.details.famous_landmarks.map((l) => `<li><span>🏛️</span>${esc(l)}</li>`).join("")}
          </ul>`
        );

      default:
        return "";
    }
  }
}
