import { salatiDailyWins, salatiGameSlug, salatiWinningScore } from "@/games/salati/config";
import { getSessionUser } from "@/lib/auth";
import { recordDailyPoint } from "@/lib/points";

// صلاتي : une partie gagnée → +1 point, au plus salatiDailyWins par jour.
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
    !("score" in body) ||
    !("completed" in body) ||
    typeof body.score !== "number" ||
    typeof body.completed !== "boolean" ||
    body.score < 0 ||
    body.score > 100
  ) {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  if (!body.completed || body.score < salatiWinningScore) {
    return Response.json({ won: false, awarded: false, points: user.points });
  }

  return Response.json({ won: true, ...recordDailyPoint(user.id, salatiGameSlug, salatiDailyWins) });
}
