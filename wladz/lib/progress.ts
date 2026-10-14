import type { AgeTier } from "@/games/ageTier";
import { amineTotalEndings } from "@/games/amine/config";
import { choiceScenes } from "@/games/choices/data";
import { mathDailyPoints } from "@/games/math/MathLauncher";
import { mythCards } from "@/games/myths/data";
import { salatiDailyWins } from "@/games/salati/config";
import { LEVELS } from "@/games/skills/levels.js";
import { totalSpaceQuestions } from "@/games/space/data";
import { WILAYAS_DATA } from "@/games/treasures/engine/data/wilayas.js";
import { getDb } from "@/lib/db";
import { games, type Game } from "@/lib/games";

export type GameActivity = Game & {
  lastPlayed: string | null;
  // Points gagnés dans ce jeu (les étapes de كنوز الجزائر sont enregistrées sans point).
  points: number;
  done: number;
  total: number;
  unit: string;
};

type Row = { game: string; question_id: string; created_at: string };

// Avancement de l'enfant dans chaque jeu, à partir de game_answers.
export function getGameActivity(userId: string, tier: AgeTier, today: string): GameActivity[] {
  const rows = getDb()
    .prepare("SELECT game, question_id, created_at FROM game_answers WHERE user_id = ?")
    .all(userId) as Row[];

  return games.map((game) => {
    const mine = rows.filter((row) => row.game === game.slug);
    const ids = mine.map((row) => row.question_id);
    const count = (prefix: string) => ids.filter((id) => id.startsWith(prefix)).length;

    const progress: Record<string, { done: number; total: number; unit: string }> = {
      space: { done: ids.length, total: totalSpaceQuestions, unit: "سؤالاً" },
      choices: { done: count(`${tier}:`), total: choiceScenes[tier].length, unit: "مواقف" },
      myths: { done: count(`${tier}:`), total: mythCards[tier].length, unit: "بطاقات" },
      treasures: { done: count("wilaya:"), total: (WILAYAS_DATA as unknown[]).length, unit: "ولاية" },
      skills: { done: count("level:"), total: (LEVELS as unknown[]).length, unit: "محطات" },
      math: { done: count(`${today}:`), total: mathDailyPoints, unit: "نقطة اليوم" },
      amine: { done: count("ending:"), total: amineTotalEndings, unit: "نهاية" },
      salati: { done: count(`${today}:`), total: salatiDailyWins, unit: "فوز اليوم" },
    };

    return {
      ...game,
      lastPlayed: mine.reduce<string | null>(
        (latest, row) => (!latest || row.created_at > latest ? row.created_at : latest),
        null,
      ),
      points: ids.filter((id) => !id.startsWith("stage:")).length,
      ...(progress[game.slug] ?? { done: 0, total: 0, unit: "" }),
    };
  });
}
