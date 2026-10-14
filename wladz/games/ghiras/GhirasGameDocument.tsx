"use client";

import { useEffect } from "react";
import { exitFramedGame } from "@/games/exitFramedGame";
import { ghirasMarkup } from "@/games/ghiras/markup";
import "@/games/ghiras/ghiras.css";

// Document plein écran de « غِراس المواطنة », affiché dans une iframe par FullscreenGameLauncher.
export function GhirasGameDocument({ player }: { player: { id: string; name: string } }) {
  useEffect(() => {
    // Le moteur lit le joueur au chargement : une sauvegarde par enfant.
    window.__WLADZ_PLAYER__ = player;

    // Mission terminée ou étape réussie : le serveur vérifie l'identifiant et ajoute 1 point (une fois).
    function onWin(event: Event) {
      const { kind, id } = (event as CustomEvent<{ kind: string; id: string }>).detail;
      void fetch("/api/games/ghiras/win", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      }).catch(() => {});
    }
    window.addEventListener("ghiras:win", onWin);
    window.addEventListener("ghiras:exit", exitFramedGame);

    // Le moteur s'exécute une seule fois par document ; l'iframe est détruite en quittant.
    void import("@/games/ghiras/engine/main.js");

    return () => {
      window.removeEventListener("ghiras:win", onWin);
      window.removeEventListener("ghiras:exit", exitFramedGame);
    };
  }, [player]);

  // Contenu statique repris du jeu d'origine (aucune donnée saisie par l'utilisateur).
  return <div dangerouslySetInnerHTML={{ __html: ghirasMarkup }} />;
}
