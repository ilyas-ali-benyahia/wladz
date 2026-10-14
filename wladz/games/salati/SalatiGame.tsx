"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GameResult } from "@/types/game";
import { manifest } from "@/games/salati/manifest";
import { salatiDailyWins, salatiWinningScore } from "@/games/salati/config";

// Le moteur (three.js, gsap) n'est chargé qu'au lancement de la partie.
const Game = dynamic(() => import("@/games/salati/Game"), { ssr: false });

type Phase = "intro" | "playing" | "result";

// Cadre WLADZ du jeu « صلاتي » : intro → partie → résultat, aux couleurs de l'application.
// Une partie gagnée (score ≥ salatiWinningScore) rapporte 1 point au compte de l'enfant.
export function SalatiGame({ player }: { player: { firstName: string; age: number } }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [awarded, setAwarded] = useState(false);

  function start() {
    setResult(null);
    setAwarded(false);
    setRun(run + 1);
    setPhase("playing");
  }

  async function finish(gameResult: GameResult) {
    setResult(gameResult);
    setPhase("result");
    try {
      const response = await fetch("/api/games/salati/win", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: gameResult.score, completed: gameResult.completed }),
      });
      const data: unknown = await response.json();
      if (typeof data === "object" && data !== null && "awarded" in data && data.awarded === true) {
        setAwarded(true);
      }
      // Met à jour le total de points affiché dans le tableau de bord.
      router.refresh();
    } catch {
      // Sans réseau, la partie reste jouable ; le point n'est simplement pas enregistré.
    }
  }

  const won = result !== null && result.completed && result.score >= salatiWinningScore;
  const card = "rounded-[2rem] bg-white p-5 shadow-xl shadow-dz-green/10 sm:p-7";

  if (phase === "playing") {
    return (
      <Game
        key={run}
        player={player}
        onFinish={(gameResult) => void finish(gameResult)}
        onExit={() => setPhase("intro")}
      />
    );
  }

  if (phase === "result" && result) {
    return (
      <section className={`${card} text-center`}>
        <p aria-hidden="true" className="text-7xl">
          {won ? "🏆" : "💪"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-dz-green">
          {won ? `أحسنت يا ${player.firstName}!` : "محاولة جميلة!"}
        </h1>
        <p className="mt-2 text-lg text-ink-soft">
          نتيجتك <span className="font-extrabold text-ink">{result.score}%</span>
          {won ? "" : ` — تحتاج ${salatiWinningScore}% لتفوز بالجولة.`}
        </p>
        {awarded ? (
          <p className="mx-auto mt-4 w-fit rounded-full bg-gold/20 px-5 py-2 text-lg font-extrabold text-ink">
            ⭐ +1 نقطة في حسابك
          </p>
        ) : null}
        <h2 className="mt-6 text-xl font-extrabold text-ink">ما تعلّمته</h2>
        <ul className="mx-auto mt-3 flex max-w-lg flex-col gap-2 text-start">
          {manifest.learningGoals.map((goal) => (
            <li
              key={goal.ar}
              className="flex gap-3 rounded-3xl bg-dz-green-soft px-4 py-3 text-base font-bold text-ink"
            >
              <span aria-hidden="true">✅</span>
              {goal.ar}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={start}
            className="fun-btn flex min-h-12 cursor-pointer items-center bg-dz-green px-6 text-lg font-extrabold text-white"
          >
            العب مرة أخرى
          </button>
          <Link
            href="/dashboard"
            className="flex min-h-12 items-center rounded-full border-2 border-dz-green px-6 text-lg font-extrabold text-dz-green transition hover:bg-dz-green-soft"
          >
            العودة إلى الرئيسية
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`${card} text-center`}>
      <p aria-hidden="true" className="text-7xl motion-safe:animate-float">
        🕌
      </p>
      <h1 className="mt-3 text-3xl font-extrabold text-dz-green">{manifest.title.ar}</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{manifest.description.ar}</p>
      <ul className="mx-auto mt-4 flex max-w-md flex-col gap-2 text-start text-base font-bold text-ink">
        <li className="rounded-3xl bg-dz-green-soft px-4 py-3">
          📖 وضع التعلّم: شاهد كل حركة من حركات الصلاة في مسجد ثلاثي الأبعاد.
        </li>
        <li className="rounded-3xl bg-dz-green-soft px-4 py-3">
          🧩 وضع التحدّي: رتّب الحركات وأجب عن أسئلة الأذكار.
        </li>
        <li className="rounded-3xl bg-dz-green-soft px-4 py-3">
          ⭐ كل جولة تفوز بها ({salatiWinningScore}% أو أكثر) تمنحك نقطة (حتى {salatiDailyWins} نقاط في
          اليوم).
        </li>
      </ul>
      <p className="mt-3 text-base text-ink-soft">المدة: {manifest.estimatedMinutes} دقائق تقريباً</p>
      <button
        type="button"
        onClick={start}
        className="fun-btn mx-auto mt-6 flex min-h-12 cursor-pointer items-center justify-center bg-dz-green px-8 text-lg font-extrabold text-white"
      >
        ابدأ
      </button>
    </section>
  );
}
