"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  Building2,
  Candy,
  Cherry,
  Cigarette,
  CircleCheck,
  CircleHelp,
  EyeOff,
  Gift,
  HeartHandshake,
  House,
  Lightbulb,
  MessageCircle,
  Package,
  PartyPopper,
  PersonStanding,
  Pill,
  Play,
  RotateCcw,
  School,
  Smartphone,
  Star,
  Trophy,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AgeTier } from "@/games/ageTier";
import { choiceScenes, choicesGameSlug, type SceneIcon } from "@/games/choices/data";
import { Button, ButtonLink } from "@/components/ui/Button";
import { GameIcon, IconTile } from "@/components/ui/GameIcon";
import { shuffledOrder, submitAnswer } from "@/games/submitAnswer";

type Turn = {
  index: number;
  // Ordre d'affichage des choix, mélangé à chaque situation.
  order: number[];
  wrong: number[];
  // Dernier choix : celui dont on affiche la conséquence.
  picked: number | null;
  status: "open" | "saving" | "solved";
  awarded: boolean;
  error: boolean;
};

const card = "wz-glass wz-rise rounded-[2rem] p-5 sm:p-7";

// Illustration de chaque situation (à la place des emojis).
const sceneIcons: Record<SceneIcon, LucideIcon> = {
  school: School,
  candy: Candy,
  house: House,
  pill: Pill,
  buildings: Building2,
  cigarette: Cigarette,
  secret: EyeOff,
  child: PersonStanding,
  phone: Smartphone,
  gift: Gift,
  backpack: Backpack,
  books: BookOpen,
  vapor: Wind,
  fruit: Cherry,
  hug: HeartHandshake,
  chat: MessageCircle,
  package: Package,
};
const sceneTones = ["#3a8ee6", "#d21034"];

export function ChoicesGame({
  tier,
  initialAnswered,
}: {
  tier: AgeTier;
  initialAnswered: string[];
}) {
  const router = useRouter();
  const scenes = choiceScenes[tier];
  const [answered, setAnswered] = useState(initialAnswered);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [turn, setTurn] = useState<Turn | null>(null);

  const doneCount = scenes.filter((scene) => answered.includes(scene.id)).length;

  function openScene(index: number) {
    setTurn({
      index,
      order: shuffledOrder(scenes[index].choices.length),
      wrong: [],
      picked: null,
      status: "open",
      awarded: false,
      error: false,
    });
    setPhase("play");
  }

  function start() {
    const firstNew = scenes.findIndex((scene) => !answered.includes(scene.id));
    openScene(firstNew === -1 ? 0 : firstNew);
  }

  async function choose(choiceIndex: number) {
    if (!turn || turn.status !== "open") return;
    const scene = scenes[turn.index];

    if (!scene.choices[choiceIndex].good) {
      setTurn({ ...turn, picked: choiceIndex, wrong: [...turn.wrong, choiceIndex], error: false });
      return;
    }

    setTurn({ ...turn, picked: choiceIndex, status: "saving", error: false });
    try {
      const result = await submitAnswer(choicesGameSlug, scene.id, choiceIndex);
      if (!result.correct) throw new Error("answer rejected");
      if (!answered.includes(scene.id)) setAnswered([...answered, scene.id]);
      setTurn({ ...turn, picked: choiceIndex, status: "solved", awarded: result.awarded });
      // Met à jour le total de points affiché dans le tableau de bord.
      router.refresh();
    } catch {
      setTurn({ ...turn, picked: null, status: "open", error: true });
    }
  }

  if (phase === "intro") {
    return (
      <section className={`${card} flex flex-col items-center text-center`}>
        <GameIcon slug="choices" size="xl" className="wz-bob" />
        <h1 className="mt-4 text-3xl font-extrabold text-dz-green">قرارات الأبطال</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
          ستمرّ بـ {scenes.length} مواقف قد تحدث لأي واحد منا. في كل موقف، اختر ما ستفعله وشاهد ما
          يحدث. كل قرار صحيح يمنحك نقطة!
        </p>
        {doneCount > 0 ? (
          <p className="wz-glass-soft mx-auto mt-3 w-fit rounded-full px-4 py-2 text-base font-bold text-ink">
            أكملت {doneCount} من {scenes.length}
          </p>
        ) : null}
        <Button size="lg" icon={Play} className="mx-auto mt-6" onClick={start}>
          {doneCount === 0 ? "هيّا نبدأ" : doneCount === scenes.length ? "ألعب من جديد" : "أواصل"}
        </Button>
      </section>
    );
  }

  if (phase === "done" || !turn) {
    return (
      <section className={`${card} flex flex-col items-center text-center`}>
        <IconTile icon={Trophy} tone="#e5a400" size="xl" className="wz-bob" />
        <h1 className="mt-4 text-3xl font-extrabold text-dz-green">أنت بطل القرارات!</h1>
        <p className="mt-2 text-lg text-ink-soft">هذا ما تعلّمته اليوم:</p>
        <ul className="mx-auto mt-4 flex max-w-lg flex-col gap-2 text-start">
          {scenes.map((scene) => (
            <li
              key={scene.id}
              className="wz-glass-soft flex items-center gap-3 rounded-3xl px-4 py-3 text-base font-bold text-ink"
            >
              <CircleCheck size={22} strokeWidth={2.5} className="shrink-0 text-green" aria-hidden="true" />
              {scene.lesson}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-5 max-w-lg rounded-3xl bg-gold/25 px-4 py-3 text-base font-bold text-ink">
          إذا حدث لك أو لصديقك موقف مثل هذه المواقف، تحدّث مع والديك أو معلّمك أو أي شخص كبير تثق
          به. طلب المساعدة شجاعة.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button icon={RotateCcw} onClick={() => openScene(0)}>
            ألعب من جديد
          </Button>
          <ButtonLink href="/dashboard" variant="secondary" icon={ArrowLeft}>
            العودة إلى الرئيسية
          </ButtonLink>
        </div>
      </section>
    );
  }

  const scene = scenes[turn.index];
  const picked = turn.picked === null ? null : scene.choices[turn.picked];
  const isLast = turn.index === scenes.length - 1;

  return (
    <section className={card}>
      <ol aria-label="تقدّمك" className="flex items-center justify-center gap-2">
        {scenes.map((step, index) => {
          const current = index === turn.index;
          const done = answered.includes(step.id);
          return (
            <li
              key={step.id}
              aria-current={current ? "step" : undefined}
              className={`grid size-10 place-items-center rounded-2xl text-base font-extrabold transition-all ${
                current
                  ? "scale-110 bg-dz-green text-white shadow-md"
                  : done
                    ? "bg-gold text-ink"
                    : "bg-dz-green-soft text-ink-soft"
              }`}
            >
              {done && !current ? (
                <Star size={20} className="fill-white text-white" aria-label="مكتمل" />
              ) : (
                index + 1
              )}
            </li>
          );
        })}
      </ol>

      <div
        className={`mt-5 flex flex-col items-center gap-2 rounded-3xl bg-linear-to-br p-5 text-center ${scene.background}`}
      >
        <div className="flex items-center gap-3">
          {scene.art.map((name, artIndex) => (
            <IconTile key={name} icon={sceneIcons[name]} tone={sceneTones[artIndex]} size="lg" />
          ))}
        </div>
        <p className="rounded-full bg-white/80 px-4 py-1 text-base font-bold text-ink-soft">
          {scene.place}
        </p>
      </div>

      <p className="mt-5 text-xl font-bold leading-relaxed text-ink">{scene.story}</p>
      <h2 className="mt-4 text-2xl font-extrabold text-dz-green">ماذا تفعل؟</h2>

      <div className="mt-3 flex flex-col gap-3">
        {turn.order.map((choiceIndex) => {
          const choice = scene.choices[choiceIndex];
          const wrong = turn.wrong.includes(choiceIndex);
          const right = turn.status === "solved" && choice.good;
          return (
            <button
              key={choiceIndex}
              type="button"
              disabled={turn.status !== "open" || wrong}
              onClick={() => choose(choiceIndex)}
              className={`min-h-14 cursor-pointer rounded-3xl border-2 px-5 py-3 text-start text-lg font-bold transition duration-300 disabled:cursor-default ${
                right
                  ? "border-green bg-green/15 text-ink"
                  : wrong
                    ? "border-dz-red/60 bg-dz-red/10 text-ink-soft"
                    : "wz-glass-soft border-white text-ink hover:-translate-y-0.5 hover:border-dz-green-light hover:shadow-[0_0_24px_-6px] hover:shadow-dz-green-light"
              }`}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      <div role="status" className="mt-4">
        {turn.error ? (
          <p className="rounded-3xl bg-dz-red/15 px-5 py-4 text-lg font-bold text-ink">
            تعذّر حفظ إجابتك. تحقّق من الإنترنت وحاول مرة أخرى!
          </p>
        ) : null}

        {picked && turn.status === "open" ? (
          <div className="rounded-3xl bg-dz-red/15 px-5 py-4 text-ink">
            <p className="flex items-center gap-2 text-lg font-extrabold">
              <CircleHelp size={22} strokeWidth={2.5} className="text-dz-red" aria-hidden="true" />
              ماذا حدث؟
            </p>
            <p className="mt-1 text-lg">{picked.outcome}</p>
            <p className="mt-2 text-base font-bold text-ink-soft">
              لا بأس، كلنا نتعلّم. فكّر واختر من جديد!
            </p>
          </div>
        ) : null}

        {picked && turn.status === "solved" ? (
          <div className="rounded-3xl bg-green/15 px-5 py-4 text-ink">
            <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
              <PartyPopper size={22} strokeWidth={2.5} className="text-dz-green" aria-hidden="true" />
              قرار الأبطال!
              {turn.awarded ? (
                <span className="flex items-center gap-1">
                  +1 نقطة
                  <Star size={18} className="fill-gold text-gold" aria-hidden="true" />
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-lg">{picked.outcome}</p>
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white px-4 py-2 text-lg font-extrabold">
              <Lightbulb size={22} strokeWidth={2.5} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
              <span>تذكّر: {scene.lesson}</span>
            </p>
            <Button
              icon={isLast ? Trophy : ArrowLeft}
              className="mt-4"
              onClick={() => (isLast ? setPhase("done") : openScene(turn.index + 1))}
            >
              {isLast ? "أنهيت الرحلة" : "الموقف التالي"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
