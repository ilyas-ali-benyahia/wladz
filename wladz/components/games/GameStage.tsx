"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Maximize, X } from "lucide-react";
import { useFullscreen } from "@/components/games/useFullscreen";
import { Button, ButtonLink } from "@/components/ui/Button";

// Cadre des jeux affichés dans la page (espace, اختيارات, خرافات, صلاتي) : bouton « العودة »
// et bouton « ملء الشاشة ». En plein écran le jeu recouvre toute la page (barre latérale
// comprise) ; sans API plein écran (iPhone) ce mode « immersif » occupe quand même tout l'écran.
export function GameStage({
  title,
  canGoFullscreen,
  children,
}: {
  title: string;
  canGoFullscreen: boolean;
  children: ReactNode;
}) {
  const fullscreen = useFullscreen();
  const [immersive, setImmersive] = useState(false);
  const usedApi = useRef(false);

  function open() {
    usedApi.current = fullscreen.supported;
    fullscreen.enter();
    setImmersive(true);
  }

  function close() {
    setImmersive(false);
    if (usedApi.current) fullscreen.exit();
    usedApi.current = false;
  }

  // Échap (ou le geste du navigateur) quitte le plein écran : on quitte aussi le mode immersif.
  const { isFullscreen } = fullscreen;
  const wasFullscreen = useRef(false);
  useEffect(() => {
    if (wasFullscreen.current && !isFullscreen && usedApi.current) {
      usedApi.current = false;
      setImmersive(false);
    }
    wasFullscreen.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    if (!immersive) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !usedApi.current) setImmersive(false);
    }
    // La page derrière le jeu ne défile plus.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [immersive]);

  // Même arbre dans les deux modes : le jeu n'est jamais remonté (sa partie continue).
  return (
    <div
      role={immersive ? "dialog" : undefined}
      aria-modal={immersive ? true : undefined}
      aria-label={immersive ? title : undefined}
      className={
        immersive
          ? "wladz-immersive fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-sky-grad"
          : undefined
      }
    >
      {immersive ? (
        <div className="wz-glass sticky top-0 z-10 flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <p className="truncate text-lg font-extrabold text-dz-green">{title}</p>
          <Button variant="secondary" size="sm" icon={X} iconPosition="start" onClick={close} className="shrink-0">
            خروج من ملء الشاشة
          </Button>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <ButtonLink href="/dashboard" variant="secondary" size="sm" icon={ArrowRight} iconPosition="start">
            العودة
          </ButtonLink>
          {canGoFullscreen ? (
            <Button variant="secondary" size="sm" icon={Maximize} iconPosition="start" onClick={open}>
              ملء الشاشة
            </Button>
          ) : null}
        </div>
      )}
      <div
        className={
          immersive
            ? "mx-auto w-full max-w-6xl flex-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5"
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
