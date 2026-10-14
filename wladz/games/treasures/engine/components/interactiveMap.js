// خريطة الجزائر التفاعلية: تكبير، تحريك، ولمس أي ولاية لعرض بطاقتها (Interactive SVG Map)

import { MAP_VIEWBOX, WILAYA_PATHS } from "../data/mapPaths.js";
import { WILAYAS_INFO } from "../data/wilayasInfo.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const DRAG_THRESHOLD = 6; // بكسل قبل اعتبار اللمسة سحباً لا نقراً
const MAX_ZOOM = 9;

export const REGION_STYLES = {
  West: { label: "الغرب", color: "#25c9c0" },
  Center: { label: "الوسط", color: "#a78bfa" },
  East: { label: "الشرق", color: "#fb7185" },
  South: { label: "الجنوب", color: "#ff9f1c" },
};

const PROGRESS_STYLES = {
  completed: { label: "مكتملة", color: "#22c55e" },
  unlocked: { label: "مفتوحة", color: "#ffc857" },
  locked: { label: "مقفلة", color: "#4a5a85" },
};

export class InteractiveMap {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.stage = document.getElementById("imap-stage");
    this.svg = document.getElementById("imap-svg");
    this.tooltip = document.getElementById("imap-tooltip");
    this.legend = document.getElementById("imap-legend");
    this.modeButtons = document.querySelectorAll(".imap-mode-btn");

    const [x, y, w, h] = MAP_VIEWBOX.split(/\s+/).map(Number);
    this.base = { x, y, w, h };
    this.view = { ...this.base };

    this.mode = "region";
    this.selectedCode = null;
    this.paths = new Map();
    this.labels = new Map();
    this.bboxes = new Map();
    this.pointers = new Map();
    this.anim = null;

    if (!this.svg) return;
    this.build();
    this.initEvents();
    this.applyView();
    this.refresh();
  }

  // ---------- البناء ----------

  build() {
    this.svg.setAttribute("viewBox", MAP_VIEWBOX);
    this.svg.innerHTML = `
      <defs>
        <filter id="imap-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    `;
    this.gWilayas = document.createElementNS(SVG_NS, "g");
    this.gWilayas.setAttribute("class", "imap-wilayas");
    this.gLabels = document.createElementNS(SVG_NS, "g");
    this.gLabels.setAttribute("class", "imap-labels");
    this.svg.append(this.gWilayas, this.gLabels);

    WILAYAS_INFO.forEach((info) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", WILAYA_PATHS[info.code]);
      path.setAttribute("class", "imap-wilaya");
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", `ولاية ${info.name_ar} (${info.code})`);
      path.dataset.code = info.code;
      this.gWilayas.appendChild(path);
      this.paths.set(info.code, path);
    });

    // تُحسب الأبعاد بعد إدراج المسارات في الصفحة
    WILAYAS_INFO.forEach((info) => {
      const box = this.paths.get(info.code).getBBox();
      this.bboxes.set(info.code, box);

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("class", "imap-label");
      text.setAttribute("x", box.x + box.width / 2);
      text.setAttribute("y", box.y + box.height / 2);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      this.gLabels.appendChild(text);
      this.labels.set(info.code, text);
    });
  }

  getBBox(code) {
    return this.bboxes.get(code);
  }

  // ---------- الأحداث ----------

  initEvents() {
    this.modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.modeButtons.forEach((b) => b.classList.toggle("active", b === btn));
        this.mode = btn.dataset.mode;
        sounds.playLetterClick();
        this.refresh();
      });
    });

    document.querySelectorAll(".imap-zoom-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.zoom;
        if (action === "in") this.zoomBy(0.6);
        else if (action === "out") this.zoomBy(1 / 0.6);
        else this.animateTo(this.base);
      });
    });

    this.svg.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    this.svg.addEventListener("pointermove", (e) => this.onPointerMove(e));
    this.svg.addEventListener("pointerup", (e) => this.onPointerUp(e));
    this.svg.addEventListener("pointercancel", (e) => this.onPointerUp(e, true));
    this.svg.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") this.hideTooltip();
    });
    this.svg.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });

    this.svg.addEventListener("keydown", (e) => {
      const code = Number(e.target.dataset?.code);
      if (code && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        this.select(code, { notify: true });
      }
    });
    this.svg.addEventListener("focusin", (e) => {
      const code = Number(e.target.dataset?.code);
      if (code) this.setHover(code);
    });
    this.svg.addEventListener("focusout", () => this.setHover(null));

    window.addEventListener("resize", () => this.updateLabels());
  }

  clientToSvg(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    // النسبة الثابتة للعرض (meet) تعني مقياساً واحداً للمحورين
    const scale = Math.max(this.view.w / rect.width, this.view.h / rect.height);
    const offX = (rect.width * scale - this.view.w) / 2;
    const offY = (rect.height * scale - this.view.h) / 2;
    return {
      x: this.view.x + (clientX - rect.left) * scale - offX,
      y: this.view.y + (clientY - rect.top) * scale - offY,
      scale,
    };
  }

  onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this.stopAnim();
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1) {
      this.gesture = {
        startX: e.clientX,
        startY: e.clientY,
        startView: { ...this.view },
        moved: false,
        targetCode: Number(e.target.closest?.(".imap-wilaya")?.dataset.code) || null,
      };
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const mid = this.clientToSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      this.pinch = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        startView: { ...this.view },
        mid,
      };
      if (this.gesture) this.gesture.moved = true;
    }
  }

  onPointerMove(e) {
    if (!this.pointers.has(e.pointerId)) {
      if (e.pointerType === "mouse") this.handleHover(e);
      return;
    }
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size >= 2 && this.pinch) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!dist || !this.pinch.dist) return;
      const factor = this.pinch.dist / dist;
      const sv = this.pinch.startView;
      const w = sv.w * factor;
      const h = sv.h * factor;
      const { mid } = this.pinch;
      this.view = {
        x: mid.x - (mid.x - sv.x) * factor,
        y: mid.y - (mid.y - sv.y) * factor,
        w,
        h,
      };
      this.applyView();
      return;
    }

    const g = this.gesture;
    if (!g) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!g.moved) {
      g.moved = true;
      this.svg.setPointerCapture?.(e.pointerId);
      this.stage.classList.add("dragging");
      this.hideTooltip();
    }
    const { scale } = this.clientToSvg(0, 0);
    this.view = {
      ...g.startView,
      x: g.startView.x - dx * scale,
      y: g.startView.y - dy * scale,
    };
    this.applyView();
  }

  onPointerUp(e, cancelled = false) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    this.stage.classList.remove("dragging");

    if (this.pointers.size < 2) this.pinch = null;

    if (this.pointers.size === 0) {
      const g = this.gesture;
      this.gesture = null;
      if (!cancelled && g && !g.moved && g.targetCode) {
        this.select(g.targetCode, { notify: true });
      }
    } else if (this.pointers.size === 1) {
      // استئناف السحب بالإصبع المتبقي بعد التكبير
      const [p] = [...this.pointers.values()];
      this.gesture = { startX: p.x, startY: p.y, startView: { ...this.view }, moved: true, targetCode: null };
    }
  }

  onWheel(e) {
    e.preventDefault();
    this.stopAnim();
    const factor = Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0025));
    const p = this.clientToSvg(e.clientX, e.clientY);
    this.zoomAround(p.x, p.y, factor);
  }

  handleHover(e) {
    const code = Number(e.target.closest?.(".imap-wilaya")?.dataset.code) || null;
    this.setHover(code);
    if (!code) return this.hideTooltip();

    const info = WILAYAS_INFO[code - 1];
    const rect = this.stage.getBoundingClientRect();
    this.tooltip.innerHTML = `<span class="imap-tt-code">${String(code).padStart(2, "0")}</span>${info.name_ar}`;
    this.tooltip.classList.add("visible");
    const x = Math.min(Math.max(e.clientX - rect.left, 60), rect.width - 60);
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${e.clientY - rect.top - 14}px`;
  }

  setHover(code) {
    if (this.hoverCode === code) return;
    if (this.hoverCode) this.paths.get(this.hoverCode)?.classList.remove("hover");
    this.hoverCode = code;
    if (code) this.paths.get(code)?.classList.add("hover");
  }

  hideTooltip() {
    this.tooltip?.classList.remove("visible");
    this.setHover(null);
  }

  // ---------- التكبير والتحريك ----------

  clampView(v) {
    const minW = this.base.w / MAX_ZOOM;
    let w = Math.min(Math.max(v.w, minW), this.base.w);
    const ratio = w / v.w;
    let h = v.h * ratio;
    // تثبيت مركز التكبير عند بلوغ الحد
    let x = v.x + (v.w - w) / 2;
    let y = v.y + (v.h - h) / 2;
    x = Math.min(Math.max(x, this.base.x), this.base.x + this.base.w - w);
    y = Math.min(Math.max(y, this.base.y), this.base.y + this.base.h - h);
    return { x, y, w, h };
  }

  applyView() {
    this.view = this.clampView(this.view);
    const { x, y, w, h } = this.view;
    this.svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    const zoom = this.base.w / w;
    this.stage.classList.toggle("zoomed", zoom > 1.02);
    this.svg.style.setProperty("--imap-zoom", zoom);
    this.updateLabels();
  }

  zoomAround(cx, cy, factor) {
    const v = this.view;
    this.view = {
      x: cx - (cx - v.x) * factor,
      y: cy - (cy - v.y) * factor,
      w: v.w * factor,
      h: v.h * factor,
    };
    this.applyView();
  }

  zoomBy(factor) {
    const v = this.view;
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    this.animateTo(this.clampView({
      x: cx - (v.w * factor) / 2,
      y: cy - (v.h * factor) / 2,
      w: v.w * factor,
      h: v.h * factor,
    }));
  }

  zoomToWilaya(code) {
    const box = this.bboxes.get(code);
    if (!box) return;
    const aspect = this.base.w / this.base.h;
    let w = Math.max(box.width, box.height * aspect) * 2.4;
    w = Math.max(w, this.base.w / 6);
    const h = w / aspect;
    this.animateTo(this.clampView({
      x: box.x + box.width / 2 - w / 2,
      y: box.y + box.height / 2 - h / 2,
      w,
      h,
    }));
  }

  animateTo(target, duration = 450) {
    this.stopAnim();
    const from = { ...this.view };
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const k = ease(t);
      this.view = {
        x: from.x + (target.x - from.x) * k,
        y: from.y + (target.y - from.y) * k,
        w: from.w + (target.w - from.w) * k,
        h: from.h + (target.h - from.h) * k,
      };
      this.applyView();
      this.anim = t < 1 ? requestAnimationFrame(step) : null;
    };
    this.anim = requestAnimationFrame(step);
  }

  stopAnim() {
    if (this.anim) cancelAnimationFrame(this.anim);
    this.anim = null;
  }

  // أسماء الولايات تظهر تدريجياً كلما اتسعت مساحتها على الشاشة
  updateLabels() {
    if (!this.labels.size) return;
    const rect = this.svg.getBoundingClientRect();
    if (!rect.width) return;
    const pxPerUnit = Math.min(rect.width / this.view.w, rect.height / this.view.h);
    const fontUnits = 11 / pxPerUnit;

    this.labels.forEach((text, code) => {
      const box = this.bboxes.get(code);
      const wPx = box.width * pxPerUnit;
      const hPx = box.height * pxPerUnit;
      const info = WILAYAS_INFO[code - 1];
      const nameWidthPx = info.name_ar.length * 7 + 10;

      let content = "";
      if (wPx > nameWidthPx && hPx > 26) content = info.name_ar;
      else if (Math.min(wPx, hPx) > 18) content = String(code);

      if (text.textContent !== content) text.textContent = content;
      text.setAttribute("font-size", fontUnits);
      text.classList.toggle("is-code", content !== "" && content === String(code));
    });
  }

  // ---------- الحالة والألوان ----------

  statusOf(code) {
    if (store.isWilayaCompleted(code)) return "completed";
    if (store.isWilayaUnlocked(code)) return "unlocked";
    return "locked";
  }

  refresh() {
    if (!this.paths.size) return;
    const current = store.getState().currentWilayaId;

    this.paths.forEach((path, code) => {
      const info = WILAYAS_INFO[code - 1];
      const color =
        this.mode === "progress"
          ? PROGRESS_STYLES[this.statusOf(code)].color
          : REGION_STYLES[info.region]?.color || "#4a5a85";
      path.style.setProperty("--fill", color);
      path.classList.toggle("is-current", this.mode === "progress" && code === current);
    });

    this.renderLegend();
  }

  renderLegend() {
    if (!this.legend) return;
    let items;
    if (this.mode === "progress") {
      const counts = { completed: 0, unlocked: 0, locked: 0 };
      this.paths.forEach((_, code) => counts[this.statusOf(code)]++);
      items = Object.entries(PROGRESS_STYLES).map(([k, s]) => ({ ...s, count: counts[k] }));
    } else {
      const counts = {};
      WILAYAS_INFO.forEach((w) => (counts[w.region] = (counts[w.region] || 0) + 1));
      items = Object.entries(REGION_STYLES).map(([k, s]) => ({ ...s, count: counts[k] || 0 }));
    }
    this.legend.innerHTML = items
      .map(
        (it) => `
        <span class="imap-legend-item">
          <span class="imap-legend-dot" style="background:${it.color}"></span>
          ${it.label}
          <span class="imap-legend-count">${it.count}</span>
        </span>`
      )
      .join("");
  }

  // تعتيم الولايات غير المطابقة للبحث أو تصفية المنطقة
  setFilter(codes) {
    const all = !codes || codes.size === WILAYAS_INFO.length;
    this.paths.forEach((path, code) => {
      path.classList.toggle("dimmed", !all && !codes.has(code));
    });
  }

  select(code, { notify = false, zoom = true } = {}) {
    if (this.selectedCode) this.paths.get(this.selectedCode)?.classList.remove("selected");
    this.selectedCode = code;
    const path = this.paths.get(code);
    if (path) {
      path.classList.add("selected");
      this.gWilayas.appendChild(path); // رسم الولاية المختارة فوق جاراتها
    }
    if (zoom) this.zoomToWilaya(code);
    if (notify) {
      sounds.playLetterClick();
      this.onSelect?.(code);
    }
  }

  clearSelection() {
    if (this.selectedCode) this.paths.get(this.selectedCode)?.classList.remove("selected");
    this.selectedCode = null;
  }
}
