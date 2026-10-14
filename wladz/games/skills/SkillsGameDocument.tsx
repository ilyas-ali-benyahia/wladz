"use client";

import { useEffect } from "react";
import { exitFramedGame } from "@/games/exitFramedGame";
import { skillsMarkup } from "@/games/skills/markup";
import "@/games/skills/skills.css";

// Document plein écran de « درب المهارات », affiché dans une iframe par FullscreenGameLauncher.
export function SkillsGameDocument({ player }: { player: { id: string; name: string } }) {
  useEffect(() => {
    // Le moteur lit le joueur au chargement : une sauvegarde par enfant.
    window.__WLADZ_PLAYER__ = player;

    // Station terminée : le serveur recompte les bonnes réponses et accorde
    // 1 point la première fois que la station est gagnée (3 bonnes réponses ou plus).
    function onFinished(event: Event) {
      const { levelId, answers } = (
        event as CustomEvent<{ levelId: number; answers: number[] }>
      ).detail;
      void fetch("/api/games/skills/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId, answers }),
      }).catch(() => {});
    }
    window.addEventListener("skills:finished", onFinished);
    window.addEventListener("skills:exit", exitFramedGame);

    // Le moteur s'exécute une seule fois par document ; l'iframe est détruite en quittant.
    void import("@/games/skills/engine.js");

    return () => {
      window.removeEventListener("skills:finished", onFinished);
      window.removeEventListener("skills:exit", exitFramedGame);
    };
  }, [player]);

  // Contenu statique repris du jeu d'origine (aucune donnée saisie par l'utilisateur).
  return <div dangerouslySetInnerHTML={{ __html: skillsMarkup }} />;
}
