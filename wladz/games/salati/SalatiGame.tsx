"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Dumbbell, Play, Puzzle, RotateCcw, Star, Trophy, type LucideIcon } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { GameIcon, IconTile } from "@/components/ui/GameIcon";
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
  const card = "wz-glass wz-rise flex flex-col items-center rounded-[2rem] p-5 text-center sm:p-7";

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
      <section className={card}>
        <IconTile icon={won ? Trophy : Dumbbell} tone={won ? "#e5a400" : "#3a8ee6"} size="xl" className="wz-bob" />
        <h1 className="mt-4 text-3xl font-extrabold text-dz-green">
          {won ? `أحسنت يا ${player.firstName}!` : "محاولة جميلة!"}
        </h1>
        <p className="mt-2 text-lg text-ink-soft">
          نتيجتك <span className="font-extrabold text-ink">{result.score}%</span>
          {won ? "" : ` — تحتاج ${salatiWinningScore}% لتفوز بالجولة.`}
        </p>
        {awarded ? (
          <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-gold/20 px-5 py-2 text-lg font-extrabold text-ink">
            <Star size={20} className="fill-gold text-gold" aria-hidden="true" /> +1 نقطة في حسابك
          </p>
        ) : null}
        <h2 className="mt-6 text-xl font-extrabold text-ink">ما تعلّمته</h2>
        <ul className="mx-auto mt-3 flex w-full max-w-lg flex-col gap-2 text-start">
          {manifest.learningGoals.map((goal) => (
            <li
              key={goal.ar}
              className="wz-glass-soft flex items-center gap-3 rounded-3xl px-3 py-2.5 text-base font-bold text-ink"
            >
              <IconTile icon={Check} tone="#2f8f5b" size="sm" />
              {goal.ar}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" icon={RotateCcw} onClick={start}>
            العب مرة أخرى
          </Button>
          <ButtonLink href="/dashboard" variant="secondary" size="lg">
            العودة إلى الرئيسية
          </ButtonLink>
        </div>
      </section>
    );
  }

  const tips: { icon: LucideIcon; tone: string; text: string }[] = [
    { icon: BookOpen, tone: "#2f8f5b", text: "وضع التعلّم: شاهد كل حركة من حركات الصلاة في مسجد ثلاثي الأبعاد." },
    { icon: Puzzle, tone: "#7c5ce6", text: "وضع التحدّي: رتّب الحركات وأجب عن أسئلة الأذكار." },
    {
      icon: Star,
      tone: "#e5a400",
      text: `كل جولة تفوز بها (${salatiWinningScore}% أو أكثر) تمنحك نقطة (حتى ${salatiDailyWins} نقاط في اليوم).`,
    },
  ];

  return (
    <section className={card}>
      <GameIcon slug="salati" size="xl" className="wz-bob" />
      <h1 className="mt-4 text-3xl font-extrabold text-dz-green">{manifest.title.ar}</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{manifest.description.ar}</p>
      <ul className="mx-auto mt-4 flex w-full max-w-md flex-col gap-2 text-start text-base font-bold text-ink">
        {tips.map(({ icon, tone, text }) => (
          <li key={text} className="wz-glass-soft flex items-center gap-3 rounded-3xl px-3 py-2.5">
            <IconTile icon={icon} tone={tone} size="sm" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-base text-ink-soft">المدة: {manifest.estimatedMinutes} دقائق تقريباً</p>
      <Button size="lg" icon={Play} onClick={start} className="mx-auto mt-6">
        ابدأ
      </Button>
    </section>
  );
}
