import { ghirasGameSlug, ghirasMissionIds, ghirasStageIds } from "@/games/ghiras/config";
import { getSessionUser } from "@/lib/auth";
import { recordCorrectAnswer } from "@/lib/points";

// غِراس المواطنة : une mission terminée ou une étape d'activité réussie → +1 point, une fois.
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
    !("kind" in body) ||
    !("id" in body) ||
    typeof body.id !== "string" ||
    (body.kind !== "mission" && body.kind !== "stage")
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const known = body.kind === "mission" ? ghirasMissionIds : ghirasStageIds;
  if (!known.has(body.id)) {
    return Response.json({ error: "مهمة غير موجودة." }, { status: 404 });
  }

  return Response.json(recordCorrectAnswer(user.id, ghirasGameSlug, `${body.kind}:${body.id}`));
}
