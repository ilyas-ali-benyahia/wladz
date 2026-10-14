import { LEVELS } from "@/games/skills/levels.js";
import { getSessionUser } from "@/lib/auth";
import { recordCorrectAnswer } from "@/lib/points";

const skillsGameSlug = "skills";
// Comme dans le jeu : 3 bonnes réponses sur 5 = une étoile = station gagnée.
const winningScore = 3;

type Level = { id: number; quiz: { a: number }[] };

// درب المهارات : le serveur recompte les réponses d'une station terminée ;
// une station gagnée rapporte 1 point, une seule fois.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "لم تسجّل دخولك بعد." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("levelId" in body) ||
    !("answers" in body) ||
    typeof body.levelId !== "number" ||
    !Array.isArray(body.answers)
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const level = (LEVELS as Level[]).find((candidate) => candidate.id === body.levelId);
  if (!level || body.answers.length !== level.quiz.length) {
    return Response.json({ error: "محطة غير موجودة." }, { status: 404 });
  }

  const answers: unknown[] = body.answers;
  const right = level.quiz.filter((question, index) => answers[index] === question.a).length;
  if (right < winningScore) {
    return Response.json({ won: false, right, awarded: false, points: user.points });
  }

  return Response.json({
    won: true,
    right,
    ...recordCorrectAnswer(user.id, skillsGameSlug, `level:${level.id}`),
  });
}
