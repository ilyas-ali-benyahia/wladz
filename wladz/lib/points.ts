import { getDb } from "@/lib/db";

export function getAnsweredQuestions(userId: string, game: string) {
  const rows = getDb()
    .prepare("SELECT question_id FROM game_answers WHERE user_id = ? AND game = ?")
    .all(userId, game) as { question_id: string }[];
  return rows.map((row) => row.question_id);
}

// Une bonne réponse = 1 point, une seule fois par question et par enfant.
export function recordCorrectAnswer(userId: string, game: string, questionId: string) {
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const inserted = db
      .prepare(
        `INSERT INTO game_answers (user_id, game, question_id) VALUES (?, ?, ?)
         ON CONFLICT DO NOTHING`,
      )
      .run(userId, game, questionId);
    const awarded = Number(inserted.changes) === 1;
    if (awarded) {
      db.prepare(
        `UPDATE users
         SET points = points + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      ).run(userId);
    }
    db.exec("COMMIT");

    const user = db.prepare("SELECT points FROM users WHERE id = ?").get(userId) as {
      points: number;
    };
    return { awarded, points: user.points };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

// Jeux sans liste de questions fixe : 1 point par bonne réponse, plafonné par jour.
export function recordDailyPoint(userId: string, game: string, dailyCap: number) {
  const day = new Date().toISOString().slice(0, 10);
  const { count } = getDb()
    .prepare(
      `SELECT COUNT(*) AS count FROM game_answers
       WHERE user_id = ? AND game = ? AND question_id LIKE ?`,
    )
    .get(userId, game, `${day}:%`) as { count: number };

  if (count >= dailyCap) {
    const user = getDb().prepare("SELECT points FROM users WHERE id = ?").get(userId) as {
      points: number;
    };
    return { awarded: false, points: user.points };
  }
  return recordCorrectAnswer(userId, game, `${day}:${count + 1}`);
}

// Progrès sans point (ex. étapes d'une wilaya, dont seule la wilaya complète rapporte).
export function recordProgress(userId: string, game: string, progressId: string) {
  getDb()
    .prepare(
      `INSERT INTO game_answers (user_id, game, question_id) VALUES (?, ?, ?)
       ON CONFLICT DO NOTHING`,
    )
    .run(userId, game, progressId);
}

export function hasProgress(userId: string, game: string, progressId: string) {
  return (
    getDb()
      .prepare("SELECT 1 FROM game_answers WHERE user_id = ? AND game = ? AND question_id = ?")
      .get(userId, game, progressId) !== undefined
  );
}

// Une seule fois par identifiant, et au plus dailyCap points par jour pour ce jeu
// (jeux externes dont le serveur ne peut pas vérifier les réponses).
export function recordCappedOnce(userId: string, game: string, id: string, dailyCap: number) {
  const db = getDb();
  const points = () =>
    (db.prepare("SELECT points FROM users WHERE id = ?").get(userId) as { points: number }).points;

  if (hasProgress(userId, game, id)) return { awarded: false, points: points() };

  const { count } = db
    .prepare(
      `SELECT COUNT(*) AS count FROM game_answers
       WHERE user_id = ? AND game = ? AND substr(created_at, 1, 10) = date('now')`,
    )
    .get(userId, game) as { count: number };
  if (count >= dailyCap) return { awarded: false, points: points(), capped: true };

  return recordCorrectAnswer(userId, game, id);
}
