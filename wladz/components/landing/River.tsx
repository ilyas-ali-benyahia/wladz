"use client";

import { useEffect, useId, useRef } from "react";

type RiverPoint = { x: number; y: number; half: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function edge(points: RiverPoint[], side: number) {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const middle = (previous.y + point.y) / 2;
    return `C${previous.x + previous.half * side} ${middle} ${point.x + point.half * side} ${middle} ${point.x + point.half * side} ${point.y}`;
  }).join(" ");
}

export default function River() {
  const ref = useRef<SVGSVGElement>(null);
  const id = `journey-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    const svg = ref.current;
    const section = svg?.closest<HTMLElement>(".games-section");
    if (!svg || !section) return;
    const slots = Array.from(section.querySelectorAll<HTMLElement>(".game-slot"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cards: { element: HTMLElement; top: number }[] = [];
    let frame = 0;
    let needsMeasure = true;

    function measure() {
      const bounds = section!.getBoundingClientRect();
      const width = bounds.width;
      const height = bounds.height;
      const mobile = width <= 700;
      const center = mobile ? 30 : width / 2;
      const amplitude = mobile ? 8 : Math.min(45, width * 0.035);
      const points: RiverPoint[] = [{ x: width / 2, y: 0, half: width * 0.0375 }];
      let branches = "";
      let ripples = "";
      cards = slots.map((element, index) => {
        const card = element.getBoundingClientRect();
        const top = card.top - bounds.top;
        const y = top + card.height * 0.48;
        const direction = mobile || index % 2 === 0 ? 1 : -1;
        const x = center + direction * amplitude;
        const half = mobile ? 17 : 43 + (index % 3) * 8;
        points.push({ x, y, half });
        const target = direction > 0 ? card.left - bounds.left + 6 : card.right - bounds.left - 6;
        const bank = x + direction * half * 0.7;
        branches += `M${bank} ${y - 8} Q${(bank + target) / 2} ${y - 15} ${target} ${y - 2} L${target} ${y + 6} Q${(bank + target) / 2} ${y + 2} ${bank} ${y + 10}Z `;
        ripples += `M${x - half * 0.3} ${y - 40} Q${x - half * 0.6} ${y - 12} ${x - half * 0.2} ${y + 12} `;
        element.style.setProperty("--source-x", `${x - (card.left - bounds.left + card.width / 2)}px`);
        element.style.setProperty("--source-y", `${card.height * -0.02}px`);
        return { element, top };
      });
      points.sort((a, b) => a.y - b.y);
      points.push({ x: center, y: height - 260, half: mobile ? 27 : 64 });
      const last = points[points.length - 1];
      const reverse = [...points].reverse();
      const water = `M${points[0].x - points[0].half} 0 ${edge(points, -1)} C${last.x - last.half} ${height - 120} ${width * 0.12} ${height - 190} 0 ${height - 100} V${height + 2} H${width} V${height - 100} C${width * 0.88} ${height - 190} ${last.x + last.half} ${height - 120} ${last.x + last.half} ${last.y} ${edge(reverse, 1)}Z`;
      svg!.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg!.querySelectorAll("[data-water]").forEach((path) => path.setAttribute("d", water));
      svg!.querySelector("[data-current]")!.setAttribute("d", `M${points[0].x + points[0].half * 0.3} 0 ${edge(points, 0.3)}`);
      svg!.querySelector("[data-branches]")!.setAttribute("d", branches);
      svg!.querySelector("[data-ripples]")!.setAttribute("d", ripples);
      needsMeasure = false;
      section!.dataset.journeyReady = "true";
    }

    function update() {
      frame = 0;
      if (needsMeasure) measure();
      const top = section!.getBoundingClientRect().top;
      const viewport = window.innerHeight;
      cards.forEach(({ element, top: cardTop }) => {
        // A pure scroll mapping: reversing scroll retraces exactly the same shape.
        // Use the stationary slot, never the transformed card, as the reference.
        const raw = motion.matches || element.contains(document.activeElement)
          ? 1 : clamp((viewport * 0.98 - top - cardTop) / (viewport * 0.42));
        const progress = raw * raw * (3 - 2 * raw);
        element.dataset.emerged = String(raw === 1);
        element.style.setProperty("--emerge", progress.toFixed(4));
        element.style.setProperty("--water-opacity", (1 - clamp((progress - 0.15) / 0.65)).toFixed(4));
        element.style.setProperty("--card-opacity", clamp(progress * 4).toFixed(4));
        element.style.setProperty("--organic-radius", `${(1 - progress) * 42}%`);
      });
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function resize() {
      needsMeasure = true;
      schedule();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(section);
    slots.forEach((slot) => observer.observe(slot));
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    motion.addEventListener("change", schedule);
    section.addEventListener("focusin", schedule);
    section.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", schedule);
      section.removeEventListener("focusin", schedule);
      section.removeEventListener("focusout", schedule);
      delete section.dataset.journeyReady;
      slots.forEach((slot) => {
        delete slot.dataset.emerged;
        ["--source-x", "--source-y", "--emerge", "--water-opacity", "--card-opacity", "--organic-radius"].forEach((name) => slot.style.removeProperty(name));
      });
    };
  }, []);

  return (
    <svg ref={ref} className="river" viewBox="0 0 1440 2600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-water`} x2="0" y2="1">
          <stop stopColor="#8fd1de" />
          <stop offset=".72" stopColor="#96d4df" />
          <stop offset=".9" stopColor="#b8e1e7" />
          <stop offset="1" stopColor="#e2f3f4" />
        </linearGradient>
        <linearGradient id={`${id}-bank`} x2="0" y2="1">
          <stop stopColor="#d7e9d9" />
          <stop offset=".85" stopColor="#dfede1" />
          <stop offset="1" stopColor="#e2f3f4" />
        </linearGradient>
        <linearGradient id={`${id}-current`} x2="0" y2="1">
          <stop stopColor="#4fa6ba" stopOpacity="0" />
          <stop offset=".05" stopColor="#4fa6ba" stopOpacity=".16" />
          <stop offset=".9" stopColor="#4fa6ba" stopOpacity=".16" />
          <stop offset="1" stopColor="#4fa6ba" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path data-water className="river-shore" d="M666 0 Q560 900 666 2000 L0 2600 H1440 L774 2000 Q880 900 774 0Z" stroke={`url(#${id}-bank)`} />
      <path data-branches className="river-tributaries" fill={`url(#${id}-water)`} />
      <path data-water className="river-surface" d="M666 0 Q560 900 666 2000 L0 2600 H1440 L774 2000 Q880 900 774 0Z" fill={`url(#${id}-water)`} />
      <path data-current className="river-current" stroke={`url(#${id}-current)`} />
      <path data-current className="river-flow-line" />
      <path data-ripples className="river-glints" />
    </svg>
  );
}
