"use client";

import { useState } from "react";
import { Gamepad2, Zap } from "lucide-react";
import { TrailerCard, type TrailerGame } from "@/components/games/TrailerCard";
import { IconTile } from "@/components/ui/GameIcon";

type Mode = "classic" | "quick";

const modes = [
  { value: "classic", label: "ألعاب كلاسيكية", icon: Gamepad2 },
  { value: "quick", label: "ألعاب سريعة", icon: Zap },
] as const;

// Page « الألعاب » : un interrupteur passe des jeux classiques aux jeux rapides.
export function GamesBrowser({
  classic,
  quick,
  initialMode = "classic",
}: {
  classic: TrailerGame[];
  quick: TrailerGame[];
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const list = mode === "classic" ? classic : quick;

  return (
    <>
      <div className="wz-rise mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold text-ink">
          <IconTile icon={mode === "classic" ? Gamepad2 : Zap} tone={mode === "classic" ? "#2f8f5b" : "#d21034"} size="sm" />
          الألعاب
        </h1>
        <div className="wz-switch wz-glass" role="radiogroup" aria-label="نوع الألعاب" data-value={mode}>
          <span className="wz-switch-thumb" aria-hidden="true" />
          {modes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul key={mode} className="grid gap-5 sm:grid-cols-2">
        {list.map((game, index) => (
          <li key={game.slug}>
            <TrailerCard game={game} index={index} />
          </li>
        ))}
      </ul>
    </>
  );
}
