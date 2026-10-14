"use client";

import { useEffect, useRef } from "react";
import type { GameProps } from "@/types/game";
import { manifest } from "../manifest";
import { GameController } from "../_engine/core/GameController.js";
import "./salati.css";
import "./embed.css";

// Mounts the Salati training engine (Three.js lesson + quiz challenge) into this component.
// The engine owns its DOM inside `rootRef` and releases every resource when the component unmounts.
export default function Game({ onFinish, onExit }: GameProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The engine is created once per mount, so it reads the latest callbacks through this ref.
  const callbacks = useRef({ onFinish, onExit });
  useEffect(() => {
    callbacks.current = { onFinish, onExit };
  }, [onFinish, onExit]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const controller = new GameController({
      root,
      maxPointsPerRun: manifest.maxPointsPerRun,
      onFinish: (result) => callbacks.current.onFinish(result),
      onExit: () => callbacks.current.onExit(),
    });
    controller.init();

    return () => controller.destroy();
  }, []);

  return (
    <>
      {/* Font Awesome icons, used by the engine. Hoisted into <head> by React. */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        precedence="default"
      />
      {/* Tajawal and Reem Kufi: the fonts this game uses. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@500;700&family=Tajawal:wght@400;500;700;800;900&display=swap"
        precedence="default"
      />
      <div ref={rootRef} className="wladz-salati" lang="ar" dir="rtl" />
    </>
  );
}
