"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFullscreen } from "@/components/games/useFullscreen";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Compass,
  Headphones,
  Lightbulb,
  Maximize,
  LockOpen,
  Map as MapIcon,
  Monitor,
  Play,
  Smartphone,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GameIcon, IconTile } from "@/components/ui/GameIcon";

// Icônes des conseils affichés avant la partie (les lanceurs sont des composants serveur :
// ils transmettent un nom d'icône, pas le composant).
const tipIcons = {
  star: { icon: Star, tone: "#e5a400" },
  compass: { icon: Compass, tone: "#e2557a" },
  headphones: { icon: Headphones, tone: "#7c5ce6" },
  computer: { icon: Monitor, tone: "#3a8ee6" },
  phone: { icon: Smartphone, tone: "#12a39a" },
  book: { icon: BookOpen, tone: "#2f8f5b" },
  unlock: { icon: LockOpen, tone: "#0b7a43" },
  hint: { icon: Lightbulb, tone: "#e5a400" },
  map: { icon: MapIcon, tone: "#d9822b" },
} satisfies Record<string, { icon: LucideIcon; tone: string }>;

export type LauncherTip = { icon: keyof typeof tipIcons; text: string };

// Jeux repris d'autres projets : ils tournent dans une iframe plein écran (leurs styles
// globaux restent isolés) et s'arrêtent proprement quand l'iframe est retirée.
// Le jeu demande la fermeture avec exitFramedGame() (games/exitFramedGame.ts).
//
// Jeu hébergé ailleurs (externalOrigin) : un bouton « خروج » de l'application est ajouté
// par-dessus, et les messages du jeu sont acceptés depuis cette origine :
//   { type: "wladz:game-exit" }                → ferme le jeu
//   { type: "wladz:ending", endingId: string } → envoyé à pointsEndpoint (points côté serveur)
//
// L'écran de jeu est rendu dans <body> (portal) : la carte en verre (backdrop-filter)
// ne doit pas devenir le cadre de cet écran fixe.
export function FullscreenGameLauncher({
  src,
  slug,
  title,
  intro,
  tips,
  externalOrigin,
  pointsEndpoint,
}: {
  src: string;
  slug: string;
  title: string;
  intro: string;
  tips: LauncherTip[];
  externalOrigin?: string;
  pointsEndpoint?: string;
}) {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fullscreen = useFullscreen();
  // Le plein écran demandé au lancement est quitté à la fermeture du jeu, pas celui de l'enfant.
  const enteredOnPlay = useRef(false);

  function play() {
    enteredOnPlay.current = !fullscreen.isFullscreen;
    fullscreen.enter();
    setPlaying(true);
  }

  function stop() {
    setPlaying(false);
    setLoaded(false);
    if (enteredOnPlay.current) fullscreen.exit();
    enteredOnPlay.current = false;
    // Met à jour le total de points gagné pendant la partie.
    router.refresh();
  }

  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });

  useEffect(() => {
    if (!playing) return;

    function onMessage(event: MessageEvent) {
      const trusted =
        event.origin === window.location.origin || (externalOrigin && event.origin === externalOrigin);
      if (!trusted || typeof event.data !== "object" || event.data === null) return;

      if (event.data.type === "wladz:game-exit") stopRef.current();

      if (
        event.data.type === "wladz:ending" &&
        pointsEndpoint &&
        typeof event.data.endingId === "string"
      ) {
        void fetch(pointsEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endingId: event.data.endingId }),
        })
          .then(() => router.refresh())
          .catch(() => {});
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playing, router, externalOrigin, pointsEndpoint]);

  return (
    <section className="wz-glass wz-rise flex flex-col items-center rounded-[2rem] p-5 text-center sm:p-7">
      <GameIcon slug={slug} size="xl" className="wz-bob" />
      <h1 className="mt-4 text-3xl font-extrabold text-dz-green">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{intro}</p>
      <ul className="mx-auto mt-4 flex w-full max-w-md flex-col gap-2 text-start text-base font-bold text-ink">
        {tips.map((tip) => {
          const { icon, tone } = tipIcons[tip.icon];
          return (
            <li key={tip.text} className="wz-glass-soft flex items-center gap-3 rounded-3xl px-3 py-2.5">
              <IconTile icon={icon} tone={tone} size="sm" />
              <span>{tip.text}</span>
            </li>
          );
        })}
      </ul>
      <Button size="lg" icon={Play} onClick={play} className="mx-auto mt-6">
        العب الآن
      </Button>

      {playing
        ? createPortal(
            <div className="fixed inset-0 z-50 bg-linear-to-b from-dz-green-light to-dz-green">
              {externalOrigin && !loaded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                  <GameIcon slug={slug} size="xl" className="wz-bob" />
                  <p className="text-2xl font-extrabold">{title}</p>
                  <p className="text-lg font-bold text-white/90">جارٍ تحميل اللعبة…</p>
                </div>
              ) : null}
              <iframe
                src={src}
                title={title}
                allow="fullscreen; autoplay; gamepad"
                onLoad={() => setLoaded(true)}
                className={`relative size-full border-0 transition-opacity duration-500 ${
                  externalOrigin && !loaded ? "opacity-0" : "opacity-100"
                }`}
              />
              {externalOrigin ? (
                // Conteneur positionné : .wz-btn (app/ui.css) impose position: relative.
                <div className="absolute end-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
                  <Button variant="secondary" size="sm" icon={X} iconPosition="start" onClick={stop} className="text-dz-red!">
                    خروج
                  </Button>
                </div>
              ) : null}
              {fullscreen.supported && !fullscreen.isFullscreen ? (
                <div className="absolute start-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Maximize}
                    onClick={fullscreen.enter}
                    aria-label="ملء الشاشة"
                    title="ملء الشاشة"
                  />
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
