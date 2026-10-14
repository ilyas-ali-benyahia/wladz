import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { GameStage } from "@/components/games/GameStage";
import { ageTier } from "@/games/ageTier";
import { AmineLauncher } from "@/games/amine/AmineLauncher";
import { ChoicesGame } from "@/games/choices/ChoicesGame";
import { GhirasLauncher } from "@/games/ghiras/GhirasLauncher";
import { MathLauncher } from "@/games/math/MathLauncher";
import { MujahideenLauncher } from "@/games/mujahideen/MujahideenLauncher";
import { MythsGame } from "@/games/myths/MythsGame";
import { SalatiGame } from "@/games/salati/SalatiGame";
import { SkillsLauncher } from "@/games/skills/SkillsLauncher";
import { SpaceGame } from "@/games/space/SpaceGame";
import { TreasuresLauncher } from "@/games/treasures/TreasuresLauncher";
import { getSessionUser } from "@/lib/auth";
import { findGame, gameTitle } from "@/lib/games";
import { getAnsweredQuestions } from "@/lib/points";

export default async function GamePage({ params }: PageProps<"/dashboard/games/[gameId]">) {
  const { gameId } = await params;
  const game = findGame(gameId);
  if (!game) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Le niveau de contenu dépend de l'âge du jour : rendu à la requête uniquement.
  await connection();
  const tier = ageTier(user.birth_date, new Date());
  const answered = getAnsweredQuestions(user.id, game.slug);

  // Les jeux en iframe passent seuls en plein écran au lancement.
  const firstName = user.full_name.split(" ")[0];
  const inPage = ["space", "choices", "myths", "salati"].includes(game.slug);

  return (
    <GameStage title={gameTitle(game, firstName)} canGoFullscreen={inPage}>
      {game.slug === "space" ? <SpaceGame initialAnswered={answered} /> : null}
      {game.slug === "choices" ? <ChoicesGame tier={tier} initialAnswered={answered} /> : null}
      {game.slug === "math" ? <MathLauncher /> : null}
      {game.slug === "treasures" ? <TreasuresLauncher /> : null}
      {game.slug === "amine" ? <AmineLauncher title={gameTitle(game, firstName)} /> : null}
      {game.slug === "ghiras" ? <GhirasLauncher /> : null}
      {game.slug === "mujahideen" ? <MujahideenLauncher /> : null}
      {game.slug === "salati" ? (
        <SalatiGame
          player={{
            firstName,
            age: Number(new Date().getFullYear()) - Number(user.birth_date.slice(0, 4)),
          }}
        />
      ) : null}
      {game.slug === "skills" ? <SkillsLauncher /> : null}
      {game.slug === "myths" ? <MythsGame tier={tier} initialAnswered={answered} /> : null}
    </GameStage>
  );
}
