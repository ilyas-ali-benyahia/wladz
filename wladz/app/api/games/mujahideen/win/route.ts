import { mujahideenGameSlug, mujahideenWinIds } from "@/games/mujahideen/config";
import { getSessionUser } from "@/lib/auth";
import { recordCorrectAnswer } from "@/lib/points";

// المجاهدون الستة : question réussie, mission accomplie ou légendaire → +1 point, une fois.
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

  if (typeof body !== "object" || body === null || !("id" in body) || typeof body.id !== "string") {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }
  if (!mujahideenWinIds.has(body.id)) {
    return Response.json({ error: "مرحلة غير موجودة." }, { status: 404 });
  }

  return Response.json(recordCorrectAnswer(user.id, mujahideenGameSlug, body.id));
}
