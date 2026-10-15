"use client";

import { useEffect, useRef } from "react";

// The outer ridges move, while the valley endpoints stay anchored to the water.
function mountain(shift: number, facet = false) {
  return facet
    ? `M${155 - shift} 64 L${275 - shift} 110 L${390 - shift * 0.8} 204 Q${460 - shift * 0.5} 222 538 310 Q600 358 666 400 L${320 - shift} 400 Q${348 - shift} 285 ${265 - shift} 216 Z`
    : `M-600 160 L${42 - shift} 113 Q${113 - shift} 62 ${155 - shift} 64 L${275 - shift} 110 L${390 - shift * 0.8} 204 Q${460 - shift * 0.5} 222 538 310 Q600 358 666 400 L-600 400 Z`;
}

export default function Landscape() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const hero = root?.closest(".hero");
    if (!root || !hero) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ridges = root.querySelectorAll("[data-ridge]");
    const facets = root.querySelectorAll("[data-facet]");
    let frame = 0;
    let previous = -1;
    function update() {
      frame = 0;
      const bounds = hero!.getBoundingClientRect();
      const progress = motion.matches ? 0 : Math.min(1, Math.max(0, -bounds.top / bounds.height));
      if (progress === previous) return;
      previous = progress;
      ridges.forEach((path) => path.setAttribute("d", mountain(progress * 640)));
      facets.forEach((path) => path.setAttribute("d", mountain(progress * 640, true)));
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <div ref={ref} className="landscape" aria-hidden="true">
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="valley-mist" x2="0" y2="1">
            <stop stopColor="#f5faf7" stopOpacity="0" />
            <stop offset="1" stopColor="#f5faf7" />
          </linearGradient>
          <linearGradient id="mountain-sage" x2="0.3" y2="1">
            <stop stopColor="#9dcbb9" />
            <stop offset="1" stopColor="#c6dfcb" />
          </linearGradient>
          <linearGradient id="source-water" x2="0" y2="1">
            <stop stopColor="#b8e2e7" />
            <stop offset="1" stopColor="#8fd1de" />
          </linearGradient>
        </defs>
        <path d="M350 360 L520 231 L593 283 L667 219 L742 282 L834 224 L950 320 L1110 400 H350Z" fill="#cee3df" />
        <path d="M440 400 Q540 296 624 323 Q692 356 738 296 Q822 262 1000 400Z" fill="#bdd9c6" />
        <path d="M0 330 Q370 294 680 364 Q760 375 840 342 Q1140 294 1440 330 V400 H0Z" fill="#deeadb" />
        <path d="M727 294 C684 321 764 344 666 400 H774 C820 351 724 326 738 294Z" fill="#d4e9da" />
        <path d="M729 294 C696 324 777 348 724 368 C700 382 666 384 666 400 H774 C774 374 720 325 736 294Z" fill="url(#source-water)" />
        <path d="M732 310 C726 331 771 344 720 386" fill="none" stroke="#e7f7f8" strokeWidth="4" strokeLinecap="round" opacity=".75" />
        <g className="mountain mountain--left">
          <path data-ridge d={mountain(0)} fill="url(#mountain-sage)" />
          <path data-facet d={mountain(0, true)} fill="#78b7a3" opacity=".55" />
        </g>
        <g className="mountain mountain--right" transform="translate(1440 0) scale(-1 1)">
          <path data-ridge d={mountain(0)} fill="url(#mountain-sage)" />
          <path data-facet d={mountain(0, true)} fill="#78b7a3" opacity=".4" />
        </g>
        <path d="M0 330 Q330 304 666 400 H0Z M1440 330 Q1110 304 774 400 H1440Z" fill="url(#valley-mist)" />
      </svg>
    </div>
  );
}
