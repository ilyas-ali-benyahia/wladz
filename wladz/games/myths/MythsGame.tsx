"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AgeTier } from "@/games/ageTier";
import { mythCards, mythsGameSlug } from "@/games/myths/data";
import { shuffledOrder, submitAnswer } from "@/games/submitAnswer";

type Round = {
  // Cartes restantes ; une carte ratée revient à la fin de la pile.
  queue: number[];
  total: number;
  correct: number;
  gained: number;
  verdict: "correct" | "wrong" | null;
  saving: boolean;
  error: boolean;
};

const card = "rounded-[2rem] bg-white p-5 shadow-xl shadow-dz-green/10 sm:p-7";
const primaryButton =
  "flex min-h-12 cursor-pointer items-center justify-center fun-btn bg-dz-green px-6 text-lg font-extrabold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0.5";

export function MythsGame({
  tier,
  initialAnswered,
}: {
  tier: AgeTier;
  initialAnswered: string[];
}) {
  const router = useRouter();
  const cards = mythCards[tier];
  const [answered, setAnswered] = useState(initialAnswered);
  const [round, setRound] = useState<Round | null>(null);

  const knownCount = cards.filter((item) => answered.includes(item.id)).length;

  function start() {
    setRound({
      queue: shuffledOrder(cards.length),
      total: cards.length,
      correct: 0,
      gained: 0,
      verdict: null,
      saving: false,
      error: false,
    });
  }

  async function answer(saysTrue: boolean) {
    if (!round || round.verdict || round.saving) return;
    const current = cards[round.queue[0]];

    if (saysTrue !== current.isTrue) {
      setRound({ ...round, verdict: "wrong", error: false });
      return;
    }

    setRound({ ...round, saving: true, error: false });
    try {
      const result = await submitAnswer(mythsGameSlug, current.id, Number(saysTrue));
      if (!result.correct) throw new Error("answer rejected");
      if (!answered.includes(current.id)) setAnswered([...answered, current.id]);
      setRound({
        ...round,
        saving: false,
        verdict: "correct",
        correct: round.correct + 1,
        gained: round.gained + (result.awarded ? 1 : 0),
      });
      // Met à jour le total de points affiché dans le tableau de bord.
      router.refresh();
    } catch {
      setRound({ ...round, saving: false, error: true });
    }
  }

  function next() {
    if (!round) return;
    const [first, ...rest] = round.queue;
    setRound({
      ...round,
      queue: round.verdict === "wrong" ? [...rest, first] : rest,
      verdict: null,
    });
  }

  if (!round) {
    return (
      <section className={`${card} text-center`}>
        <p aria-hidden="true" className="text-7xl motion-safe:animate-float">
          🕵️
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-dz-green">حقيقة أم خرافة؟</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
          ستظهر لك {cards.length} بطاقات. اقرأ كل جملة وقرّر: هل هي حقيقة أم خرافة؟ كل إجابة صحيحة
          تمنحك نقطة!
        </p>
        {knownCount > 0 ? (
          <p className="mx-auto mt-3 w-fit rounded-full bg-dz-green-soft px-4 py-2 text-base font-bold text-ink">
            عرفت {knownCount} من {cards.length}
          </p>
        ) : null}
        <button type="button" className={`${primaryButton} mx-auto mt-6`} onClick={start}>
          هيّا نبدأ
        </button>
      </section>
    );
  }

  if (round.queue.length === 0) {
    return (
      <section className={`${card} text-center`}>
        <p aria-hidden="true" className="text-7xl">
          🏅
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-dz-green">أحسنت أيها المحقّق!</h1>
        <p className="mt-3 text-lg text-ink-soft">
          كشفت {round.total} بطاقات
          {round.gained > 0 ? ` وربحت ${round.gained} نقطة ⭐` : ""}.
        </p>
        <p className="mx-auto mt-5 max-w-lg rounded-3xl bg-gold/25 px-4 py-3 text-base font-bold text-ink">
          إذا سمعت معلومة ولم تكن متأكداً منها، اسأل والديك أو معلّمك أو الطبيب.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className={primaryButton} onClick={start}>
            ألعب من جديد
          </button>
          <Link
            href="/dashboard"
            className="flex min-h-12 items-center rounded-3xl border-2 border-dz-green px-6 text-lg font-extrabold text-dz-green transition hover:bg-dz-green-soft"
          >
            العودة إلى الرئيسية
          </Link>
        </div>
      </section>
    );
  }

  const current = cards[round.queue[0]];
  const progress = ((round.total - round.queue.length) / round.total) * 100;

  return (
    <section className={card}>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="تقدّمك"
          aria-valuemin={0}
          aria-valuemax={round.total}
          aria-valuenow={round.total - round.queue.length}
          className="h-4 flex-1 overflow-hidden rounded-full bg-dz-green-soft"
        >
          <div
            className="h-full rounded-full bg-dz-green transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="rounded-full bg-dz-green-soft px-3 py-1 text-base font-extrabold text-ink">
          {round.total - round.queue.length}/{round.total}
        </p>
      </div>

      <div className="mt-5 flex min-h-48 flex-col items-center justify-center gap-3 rounded-3xl bg-linear-to-br from-dz-green-light/60 to-dz-green-soft p-6 text-center">
        <p aria-hidden="true" className="text-5xl">
          🤔
        </p>
        <p className="text-2xl font-extrabold leading-relaxed text-ink">{current.statement}</p>
      </div>

      {round.verdict ? (
        <div
          role="status"
          className={`mt-5 rounded-3xl px-5 py-4 text-ink ${
            round.verdict === "correct" ? "bg-green/15" : "bg-dz-red/15"
          }`}
        >
          <p className="text-lg font-extrabold">
            {round.verdict === "correct"
              ? "🎉 إجابة صحيحة!"
              : "🤔 ليس تماماً، لا بأس. سنعود إلى هذه البطاقة."}
          </p>
          <p className="mt-2 text-xl font-extrabold">
            هذه {current.isTrue ? "حقيقة ✅" : "خرافة ❌"}
          </p>
          <p className="mt-1 text-lg">{current.explanation}</p>
          <button type="button" className={`${primaryButton} mt-4`} onClick={next}>
            التالي
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={round.saving}
              onClick={() => answer(true)}
              className="min-h-16 cursor-pointer rounded-3xl bg-green text-xl font-extrabold text-white shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              ✅ حقيقة
            </button>
            <button
              type="button"
              disabled={round.saving}
              onClick={() => answer(false)}
              className="min-h-16 cursor-pointer rounded-3xl bg-dz-red text-xl font-extrabold text-ink shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              ❌ خرافة
            </button>
          </div>
          {round.error ? (
            <p role="status" className="mt-4 rounded-3xl bg-dz-red/15 px-5 py-4 text-lg font-bold text-ink">
              تعذّر حفظ إجابتك. تحقّق من الإنترنت وحاول مرة أخرى!
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
