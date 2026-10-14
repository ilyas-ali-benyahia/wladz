// Quitter un jeu en iframe : la page hôte (FullscreenGameLauncher) ferme l'iframe ;
// en accès direct à /play/..., retour à la liste des jeux.
export function exitFramedGame() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "wladz:game-exit" }, window.location.origin);
    return;
  }
  // Navigation complète voulue : elle arrête le moteur du jeu.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/dashboard/games";
}
