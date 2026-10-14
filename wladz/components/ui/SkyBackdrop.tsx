"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { CloudShape } from "@/components/ui/CloudShape";

// Nuages répartis sur plus d'un écran de haut : en faisant défiler la page, ils montent
// moins vite que le contenu (parallax), et de nouveaux nuages entrent par le bas.
const clouds = [
  { top: "4%", start: "-12%", width: 420, speed: 0.08, opacity: 0.95, drift: 46 },
  { top: "18%", start: "72%", width: 520, speed: 0.16, opacity: 0.9, drift: 38 },
  { top: "48%", start: "-18%", width: 360, speed: 0.22, opacity: 0.8, drift: 54 },
  { top: "64%", start: "58%", width: 300, speed: 0.12, opacity: 0.7, drift: 42 },
  { top: "92%", start: "8%", width: 480, speed: 0.3, opacity: 0.85, drift: 60 },
  { top: "118%", start: "64%", width: 440, speed: 0.36, opacity: 0.8, drift: 48 },
  { top: "150%", start: "-10%", width: 400, speed: 0.42, opacity: 0.75, drift: 40 },
];

export function SkyBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sky = ref.current;
    if (!sky) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function update() {
      frame = 0;
      sky?.style.setProperty("--sky-scroll", String(Math.round(window.scrollY)));
    }

    function schedule() {
      if (!frame && !reducedMotion.matches) frame = window.requestAnimationFrame(update);
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={ref} className="wz-sky" aria-hidden="true">
      <div className="wz-sky-sun" />
      {clouds.map((cloud, index) => (
        <div
          key={index}
          className="wz-sky-cloud"
          style={
            {
              top: cloud.top,
              insetInlineStart: cloud.start,
              width: `min(${cloud.width}px, 82vw)`,
              opacity: cloud.opacity,
              "--speed": cloud.speed,
              "--drift": `${cloud.drift}px`,
              "--drift-duration": `${28 + index * 5}s`,
            } as CSSProperties
          }
        >
          <CloudShape className="wz-sky-cloud-shape" />
        </div>
      ))}
    </div>
  );
}
