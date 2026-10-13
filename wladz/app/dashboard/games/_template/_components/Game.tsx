"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/types/game";
import { manifest } from "../manifest";
import { questions } from "../_data/content";

// Hors du composant : React 19 interdit les fonctions impures (Date.now) dans le rendu.
function elapsedSince(start: number) {
  return Date.now() - start;
}

// Composant principal du jeu : composant client exporté par défaut, qui respecte GameProps.
// GameShell affiche l'intro et l'écran de résultat ; le jeu ne gère que la partie elle-même.
export default function Game({ player, onFinish, onExit }: GameProps) {
  const startedAt = useRef(0);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const question = questions[index];

  function answer(choiceIndex: number) {
    const nextScore = choiceIndex === question.correctIndex ? score + 1 : score;

    if (index + 1 < questions.length) {
      setScore(nextScore);
      setIndex(index + 1);
      return;
    }

    onFinish({
      score: nextScore,
      pointsEarned: Math.round(
        (nextScore / questions.length) * manifest.maxPointsPerRun,
      ),
      completed: true,
      durationMs: elapsedSince(startedAt.current),
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
      <p className="text-lg text-ink">مرحبًا {player.firstName}!</p>
      <h2 className="text-2xl font-bold text-dz-green">{question.prompt}</h2>
      <div className="grid gap-3">
        {question.choices.map((choice, choiceIndex) => (
          <button
            key={choice}
            type="button"
            onClick={() => answer(choiceIndex)}
            className="min-h-12 rounded-2xl bg-dz-white px-4 py-3 text-start shadow"
          >
            {choice}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onExit}
        className="self-start text-sm text-ink-soft underline"
      >
        خروج
      </button>
    </section>
  );
}
