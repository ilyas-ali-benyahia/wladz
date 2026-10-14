import { getSessionUser } from "@/lib/auth";
import { recordDailyPoint } from "@/lib/points";

// Doit rester égal à `mathDailyPoints` affiché dans games/math/MathLauncher.tsx.
const dailyCap = 30;

// Les opérations sont tirées au hasard dans le navigateur : le serveur ne peut pas
// vérifier la réponse, il limite donc le nombre de points par enfant et par jour.
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "لم تسجّل دخولك بعد." }, { status: 401 });
  }

  return Response.json(recordDailyPoint(user.id, "math", dailyCap));
}
