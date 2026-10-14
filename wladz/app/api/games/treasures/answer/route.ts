import { treasuresGameSlug, treasuresStage } from "@/games/treasures/answers";
import { getSessionUser } from "@/lib/auth";
import { hasProgress, recordCorrectAnswer, recordProgress } from "@/lib/points";

// كنوز الجزائر : chaque étape réussie est enregistrée (sans point) ; quand toutes les
// étapes d'une wilaya le sont, la wilaya rapporte 1 point, une seule fois.
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
    !("questionId" in body) ||
    !("answer" in body) ||
    typeof body.questionId !== "string" ||
    typeof body.answer !== "string" ||
    body.answer.length > 100
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const stage = treasuresStage(body.questionId);
  if (!stage || stage.expected === undefined) {
    return Response.json({ error: "سؤال غير موجود." }, { status: 404 });
  }

  if (body.answer !== stage.expected) {
    return Response.json({ correct: false, awarded: false, points: user.points });
  }

  recordProgress(user.id, treasuresGameSlug, `stage:${body.questionId}`);

  const wilayaDone = stage.wilayaStageIds.every((id) =>
    hasProgress(user.id, treasuresGameSlug, `stage:${id}`),
  );
  if (!wilayaDone) {
    return Response.json({ correct: true, awarded: false, points: user.points, wilayaCompleted: false });
  }

  return Response.json({
    correct: true,
    wilayaCompleted: true,
    ...recordCorrectAnswer(user.id, treasuresGameSlug, `wilaya:${stage.wilayaId}`),
  });
}
