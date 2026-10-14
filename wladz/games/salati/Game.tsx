"use client";

import { useEffect, useRef } from "react";
import type { GameProps } from "@/types/game";
import { manifest } from "@/games/salati/manifest";
import { GameController } from "@/games/salati/engine/core/GameController.js";
import "./salati.css";
import "./embed.css";

// Repris de la branche game/salati (WLADZ). Adaptations : chemins d'import, police de l'application.
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
      {/* WLADZ : polices du jeu remplacées par Cairo, celle de l'application (embed.css). */}
      <div ref={rootRef} className="wladz-salati" lang="ar" dir="rtl" />
    </>
  );
}
