"use client";

import { createElement, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";

type TiltTag = "div" | "li" | "article" | "section";

// Carte qui s'incline en 3D en suivant la souris, avec un reflet et un halo vert au survol
// (styles .wz-tilt dans app/ui.css). Au toucher, seul le halo s'affiche.
export function Tilt({
  as = "div",
  className = "",
  maxTilt = 9,
  children,
  ...rest
}: {
  as?: TiltTag;
  className?: string;
  maxTilt?: number;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty("--ry", `${((x - 0.5) * maxTilt * 2).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${((0.5 - y) * maxTilt * 1.6).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    card.dataset.tilting = "true";
  }

  function onPointerLeave(event: PointerEvent<HTMLElement>) {
    const card = event.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    delete card.dataset.tilting;
  }

  return createElement(
    as,
    { ...rest, className: `wz-tilt ${className}`, onPointerMove, onPointerLeave },
    children,
  );
}
