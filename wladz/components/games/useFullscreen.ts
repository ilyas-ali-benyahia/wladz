"use client";

import { useCallback, useSyncExternalStore } from "react";

// Plein écran du navigateur (toute la page), avec le préfixe webkit des anciens Safari.
// Sur iPhone l'API n'existe pas : `supported` est faux et les jeux restent en mode
// « immersif » CSS (fixed inset-0), qui occupe déjà tout l'écran visible.
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function currentElement() {
  const doc = document as WebkitDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function enterFullscreen() {
  const root = document.documentElement as WebkitElement;
  if (currentElement()) return;
  try {
    const request = root.requestFullscreen
      ? root.requestFullscreen({ navigationUI: "hide" })
      : root.webkitRequestFullscreen?.();
    // Refus (pas de geste de l'utilisateur, iframe sans permission…) : on reste en fenêtre.
    void Promise.resolve(request).catch(() => {});
  } catch {}
}

export function exitFullscreen() {
  const doc = document as WebkitDocument;
  if (!currentElement()) return;
  try {
    const exit = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
    void Promise.resolve(exit).catch(() => {});
  } catch {}
}

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}

function isSupported() {
  const doc = document as WebkitDocument;
  return Boolean(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled);
}

export function useFullscreen() {
  const isFullscreen = useSyncExternalStore(subscribe, () => currentElement() !== null, () => false);
  const supported = useSyncExternalStore(subscribe, isSupported, () => false);
  const toggle = useCallback(() => (currentElement() ? exitFullscreen() : enterFullscreen()), []);
  return { isFullscreen, supported, enter: enterFullscreen, exit: exitFullscreen, toggle };
}
