"use client";

import { useEffect } from "react";
import { exitFramedGame } from "@/games/exitFramedGame";
import { mujahideenMarkup } from "@/games/mujahideen/markup";
import "@/games/mujahideen/mujahideen.css";

// Document plein écran de « المجاهدون الستة », affiché dans une iframe par FullscreenGameLauncher.
export function MujahideenGameDocument({ player }: { player: { id: string; name: string } }) {
  useEffect(() => {
    // Le moteur lit le joueur au chargement : meilleur score et réglage du son par enfant.
    window.__WLADZ_PLAYER__ = player;

    // Question réussie, mission accomplie : le serveur vérifie l'identifiant et ajoute 1 point (une fois).
    function onWin(event: Event) {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      void fetch("/api/games/mujahideen/win", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
    window.addEventListener("mujahideen:win", onWin);
    window.addEventListener("mujahideen:exit", exitFramedGame);

    // Le moteur s'exécute une seule fois par document ; l'iframe est détruite en quittant.
    void import("@/games/mujahideen/engine.js");

    return () => {
      window.removeEventListener("mujahideen:win", onWin);
      window.removeEventListener("mujahideen:exit", exitFramedGame);
    };
  }, [player]);

  // Contenu statique repris du jeu d'origine (aucune donnée saisie par l'utilisateur).
  return <div dangerouslySetInnerHTML={{ __html: mujahideenMarkup }} />;
}
