"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFullscreen } from "@/components/games/useFullscreen";

// Jeux repris d'autres projets : ils tournent dans une iframe plein écran (leurs styles
// globaux restent isolés) et s'arrêtent proprement quand l'iframe est retirée.
// Le jeu demande la fermeture avec exitFramedGame() (games/exitFramedGame.ts).
//
// Jeu hébergé ailleurs (externalOrigin) : un bouton « خروج » de l'application est ajouté
// par-dessus, et les messages du jeu sont acceptés depuis cette origine :
//   { type: "wladz:game-exit" }                → ferme le jeu
//   { type: "wladz:ending", endingId: string } → envoyé à pointsEndpoint (points côté serveur)
export function FullscreenGameLauncher({
  src,
  title,
  emoji,
  intro,
  tips,
  externalOrigin,
  pointsEndpoint,
}: {
  src: string;
  title: string;
  emoji: string;
  intro: string;
  tips: string[];
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
    <section className="rounded-[2rem] bg-white p-5 text-center shadow-xl shadow-dz-green/10 sm:p-7">
      <p aria-hidden="true" className="text-7xl motion-safe:animate-float">
        {emoji}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold text-dz-green">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{intro}</p>
      <ul className="mx-auto mt-4 flex max-w-md flex-col gap-2 text-start text-base font-bold text-ink">
        {tips.map((tip) => (
          <li key={tip} className="rounded-3xl bg-dz-green-soft px-4 py-3">
            {tip}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={play}
        className="mx-auto mt-6 flex min-h-12 cursor-pointer items-center justify-center fun-btn bg-dz-green px-8 text-lg font-extrabold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
      >
        العب الآن
      </button>

      {playing ? (
        <div className="fixed inset-0 z-50 bg-linear-to-b from-dz-green-light to-dz-green">
          {externalOrigin && !loaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
              <p aria-hidden="true" className="text-7xl motion-safe:animate-float">
                {emoji}
              </p>
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
            <button
              type="button"
              onClick={stop}
              className="absolute end-3 bottom-3 flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white/90 px-4 text-base font-extrabold text-dz-red shadow-lg backdrop-blur transition hover:bg-white"
            >
              <span aria-hidden="true">✕</span> خروج
            </button>
          ) : null}
          {fullscreen.supported && !fullscreen.isFullscreen ? (
            <button
              type="button"
              onClick={fullscreen.enter}
              aria-label="ملء الشاشة"
              title="ملء الشاشة"
              className="absolute start-3 bottom-3 flex size-11 cursor-pointer items-center justify-center rounded-2xl bg-white/85 text-xl text-dz-green shadow-lg backdrop-blur transition hover:bg-white"
            >
              <span aria-hidden="true">⛶</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
