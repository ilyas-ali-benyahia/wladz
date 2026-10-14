"use client";

import { useEffect } from "react";
import { exitFramedGame } from "@/games/exitFramedGame";
import { treasuresMarkup } from "@/games/treasures/markup";
import "@/games/treasures/treasures.css";

declare global {
  interface Window {
    __WLADZ_PLAYER__?: { id: string; name: string };
  }
}

// Document plein écran de « كنوز الجزائر », affiché dans une iframe par FullscreenGameLauncher.
export function TreasuresGameDocument({ player }: { player: { id: string; name: string } }) {
  useEffect(() => {
    // Le moteur lit le joueur au chargement : une sauvegarde par enfant.
    window.__WLADZ_PLAYER__ = player;

    // Étape réussie : le serveur vérifie la réponse ; une wilaya complète rapporte 1 point.
    function onSolved(event: Event) {
      const { stageId, answer } = (event as CustomEvent<{ stageId: string; answer: string }>)
        .detail;
      void fetch("/api/games/treasures/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: stageId, answer }),
      }).catch(() => {});
    }
    window.addEventListener("treasures:solved", onSolved);
    window.addEventListener("treasures:exit", exitFramedGame);

    // Le moteur s'exécute une seule fois par document ; l'iframe est détruite en quittant.
    void import("@/games/treasures/engine/main.js");

    return () => {
      window.removeEventListener("treasures:solved", onSolved);
      window.removeEventListener("treasures:exit", exitFramedGame);
    };
  }, [player]);

  // Contenu statique repris du jeu d'origine (aucune donnée saisie par l'utilisateur).
  return <div dangerouslySetInnerHTML={{ __html: treasuresMarkup }} />;
}
