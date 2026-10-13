"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import type { GameManifest, GameProps, GameResult } from "@/types/game";

type GameShellProps = {
  manifest: GameManifest;
  Game: ComponentType<GameProps>;
};

type Phase = "intro" | "playing" | "result";

// Version minimale du cadre commun des jeux (intro → partie → résultat).
// Le groupe Hub & Core la remplacera par la version finale sans changer ses props.
export default function GameShell({ manifest, Game }: GameShellProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  // TODO(core): remplacer par le profil réel de l'utilisateur connecté.
  const player = { firstName: "بطل", age: manifest.ageRange.min };

  function start() {
    setResult(null);
    setRun(run + 1);
    setPhase("playing");
  }

  function finish(gameResult: GameResult) {
    setResult(gameResult);
    setPhase("result");
    // TODO(core): POST /api/games/<slug>/result pour enregistrer les points.
  }

  const points = result
    ? Math.min(
        Math.max(Math.round(result.pointsEarned), 0),
        manifest.maxPointsPerRun,
      )
    : 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
      {phase === "intro" && (
        <section className="flex flex-col gap-4 rounded-3xl bg-dz-white p-6 shadow">
          <h1 className="text-3xl font-bold text-dz-green">
            {manifest.title.ar}
          </h1>
          <p className="text-ink">{manifest.description.ar}</p>
          <p className="text-ink-soft">
            المدة: {manifest.estimatedMinutes} دقائق تقريبًا
          </p>
          <button
            type="button"
            onClick={start}
            className="min-h-12 rounded-2xl bg-dz-green px-6 py-3 text-lg font-bold text-dz-white"
          >
            ابدأ
          </button>
        </section>
      )}

      {phase === "playing" && (
        <Game
          key={run}
          player={player}
          onFinish={finish}
          onExit={() => router.push("/dashboard/games")}
        />
      )}

      {phase === "result" && (
        <section className="flex flex-col gap-4 rounded-3xl bg-dz-white p-6 shadow">
          <h2 className="text-2xl font-bold text-dz-green">أحسنت!</h2>
          <p className="text-xl text-ink">
            النقاط: <span className="font-bold text-gold">{points}</span>
          </p>
          <h3 className="font-bold text-ink">ما تعلّمته</h3>
          <ul className="list-disc ps-6 text-ink">
            {manifest.learningGoals.map((goal) => (
              <li key={goal.ar}>{goal.ar}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={start}
              className="min-h-12 rounded-2xl bg-dz-green px-6 py-3 font-bold text-dz-white"
            >
              العب مرة أخرى
            </button>
            <Link
              href="/dashboard/games"
              className="flex min-h-12 items-center rounded-2xl bg-dz-green-soft px-6 py-3 font-bold text-dz-green"
            >
              العودة إلى الألعاب
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
