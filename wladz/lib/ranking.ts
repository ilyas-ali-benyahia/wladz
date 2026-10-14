import { getDb } from "@/lib/db";

export type RankingEntry = {
  id: string;
  rank: number;
  displayName: string;
  points: number;
};

// Le classement ne montre jamais le nom complet : prénom + initiale du dernier nom.
export function rankingName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts.at(-1)?.[0]}.`;
}

// Classement « olympique » : deux enfants à égalité de points partagent le même rang.
export function getRanking(limit: number) {
  const rows = getDb()
    .prepare(
      `SELECT id, full_name, points, RANK() OVER (ORDER BY points DESC) AS rank
       FROM users
       ORDER BY points DESC, created_at ASC
       LIMIT ?`,
    )
    .all(limit) as { id: string; full_name: string; points: number; rank: number }[];

  return rows.map(
    (row): RankingEntry => ({
      id: row.id,
      rank: row.rank,
      displayName: rankingName(row.full_name),
      points: row.points,
    }),
  );
}

export function getPlayerRank(userId: string) {
  const row = getDb()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE points > me.points) + 1 AS rank,
         (SELECT COUNT(*) FROM users) AS total,
         me.points AS points
       FROM users AS me
       WHERE me.id = ?`,
    )
    .get(userId) as { rank: number; total: number; points: number } | undefined;
  return row ?? null;
}
