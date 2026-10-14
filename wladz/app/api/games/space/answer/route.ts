import { spaceBodies, spaceGameSlug, spaceQuestionId } from "@/games/space/data";
import { getSessionUser } from "@/lib/auth";
import { recordCorrectAnswer } from "@/lib/points";

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
    !("bodyId" in body) ||
    !("questionIndex" in body) ||
    !("answer" in body) ||
    typeof body.bodyId !== "string" ||
    typeof body.questionIndex !== "number" ||
    typeof body.answer !== "number"
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const { bodyId, questionIndex, answer } = body;
  const question = spaceBodies.find((spaceBody) => spaceBody.id === bodyId)?.questions[
    questionIndex
  ];
  if (!question) {
    return Response.json({ error: "سؤال غير موجود." }, { status: 404 });
  }

  if (answer !== question.answer) {
    return Response.json({ correct: false, awarded: false, points: user.points });
  }

  const result = recordCorrectAnswer(
    user.id,
    spaceGameSlug,
    spaceQuestionId(bodyId, questionIndex),
  );
  return Response.json({ correct: true, ...result });
}
