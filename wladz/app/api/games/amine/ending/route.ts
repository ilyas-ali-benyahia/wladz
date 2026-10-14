import { amineDailyPoints, amineGameSlug } from "@/games/amine/config";
import { getSessionUser } from "@/lib/auth";
import { recordCappedOnce } from "@/lib/points";

// أمين: طريق الحياة : une fin atteinte (jeu externe) → +1 point, une fois par fin,
// au plus amineDailyPoints par jour.
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
    !("endingId" in body) ||
    typeof body.endingId !== "string" ||
    !/^[\p{L}\p{N}_:.-]{1,64}$/u.test(body.endingId)
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  return Response.json(
    recordCappedOnce(user.id, amineGameSlug, `ending:${body.endingId}`, amineDailyPoints),
  );
}
