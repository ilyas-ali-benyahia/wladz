// Deux niveaux de contenu : 8-11 ans et 12-16 ans.
export type AgeTier = "junior" | "senior";

export function ageTier(birthDate: string, today: Date): AgeTier {
  const now = today.toISOString().slice(0, 10);
  let age = Number(now.slice(0, 4)) - Number(birthDate.slice(0, 4));
  if (now.slice(5) < birthDate.slice(5)) age -= 1;
  return age < 12 ? "junior" : "senior";
}
