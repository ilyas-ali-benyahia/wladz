import { choiceAnswer, choicesGameSlug } from "@/games/choices/data";
import { mythAnswer, mythsGameSlug } from "@/games/myths/data";
import { getSessionUser } from "@/lib/auth";
import { recordCorrectAnswer } from "@/lib/points";

// Bonne réponse attendue pour chaque question, par jeu.
const answerKeys: Record<string, (questionId: string) => number | string | undefined> = {
  [choicesGameSlug]: choiceAnswer,
  [mythsGameSlug]: mythAnswer,
};

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/games/[slug]/answer">,
) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "لم تسجّل دخولك بعد." }, { status: 401 });
  }

  const { slug } = await params;
  const answerKey = answerKeys[slug];
  if (!answerKey) {
    return Response.json({ error: "لعبة غير موجودة." }, { status: 404 });
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
    !("questionId" in body) ||
    !("answer" in body) ||
    typeof body.questionId !== "string" ||
    !(
      typeof body.answer === "number" ||
      (typeof body.answer === "string" && body.answer.length <= 100)
    )
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const expected = answerKey(body.questionId);
  if (expected === undefined || expected === -1) {
    return Response.json({ error: "سؤال غير موجود." }, { status: 404 });
  }

  if (String(body.answer) !== String(expected)) {
    return Response.json({ correct: false, awarded: false, points: user.points });
  }

  return Response.json({
    correct: true,
    ...recordCorrectAnswer(user.id, slug, body.questionId),
  });
}
