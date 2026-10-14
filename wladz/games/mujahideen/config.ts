// « المجاهدون الستة » : chaque question sur un chef historique réussie pour la première fois,
// la mission accomplie (arrivée à la grotte) et la mission « légendaire » (3 étoiles) → +1 point.
export const mujahideenGameSlug = "mujahideen";
// Six chefs, deux questions chacun (le jeu en tire une au hasard à chaque obstacle).
const leaders = 6;
const questionsPerLeader = 2;
export const mujahideenWinIds = new Set([
  ...Array.from({ length: leaders * questionsPerLeader }, (_, i) => `q:${Math.floor(i / questionsPerLeader)}-${i % questionsPerLeader}`),
  "win",
  "legend",
]);
export const mujahideenTotalWins = mujahideenWinIds.size;
