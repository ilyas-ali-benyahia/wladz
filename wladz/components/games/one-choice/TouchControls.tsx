"use client";

import { useEffect, useRef, type PointerEvent as RPointerEvent } from "react";
import type { InputState } from "./input";
import styles from "./OneChoice.module.css";

const RADIUS = 52;

/** Bottom-left virtual joystick. Tracks a single pointer by id. */
export function Joystick({ input }: { input: InputState }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);

  const reset = () => {
    active.current = null;
    input.joy.x = 0;
    input.joy.y = 0;
    if (knob.current) knob.current.style.transform = "translate(-50%, -50%)";
  };

  // Release the stick when the control unmounts (dialogue opens, pause, etc.).
  useEffect(() => {
    return () => {
      input.joy.x = 0;
      input.joy.y = 0;
    };
  }, [input]);

  const update = (e: RPointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    input.joy.x = dx / RADIUS;
    input.joy.y = -dy / RADIUS;
    if (knob.current) {
      knob.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  };

  return (
    <div
      ref={base}
      className={styles.joystick}
      role="application"
      aria-label="Movement joystick"
      onPointerDown={(e) => {
        if (active.current !== null) return;
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === active.current) update(e);
      }}
      onPointerUp={(e) => {
        if (e.pointerId === active.current) reset();
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === active.current) reset();
      }}
      onLostPointerCapture={(e) => {
        if (e.pointerId === active.current) reset();
      }}
    >
      <div ref={knob} className={styles.joystickKnob} />
    </div>
  );
}

/** Right-side drag area for the camera. Supports several fingers at once. */
export function LookZone({ input }: { input: InputState }) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const end = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
  };
  return (
    <div
      className={styles.lookZone}
      aria-hidden="true"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        const last = pointers.current.get(e.pointerId);
        if (!last) return;
        input.look.dx += (e.clientX - last.x) * 1.5;
        input.look.dy += (e.clientY - last.y) * 1.5;
        last.x = e.clientX;
        last.y = e.clientY;
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    />
  );
}
