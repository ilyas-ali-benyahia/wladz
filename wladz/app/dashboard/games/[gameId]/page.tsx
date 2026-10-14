import { ArrowRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ageTier } from "@/games/ageTier";
import { AmineLauncher } from "@/games/amine/AmineLauncher";
import { ChoicesGame } from "@/games/choices/ChoicesGame";
import { MathLauncher } from "@/games/math/MathLauncher";
import { MythsGame } from "@/games/myths/MythsGame";
import { SkillsLauncher } from "@/games/skills/SkillsLauncher";
import { SpaceGame } from "@/games/space/SpaceGame";
import { TreasuresLauncher } from "@/games/treasures/TreasuresLauncher";
import { ButtonLink } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/auth";
import { findGame } from "@/lib/games";
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

  return (
    <>
      <ButtonLink
        href="/dashboard"
        variant="secondary"
        size="sm"
        icon={ArrowRight}
        iconPosition="start"
        className="mb-4"
      >
        العودة
      </ButtonLink>
      {game.slug === "space" ? <SpaceGame initialAnswered={answered} /> : null}
      {game.slug === "choices" ? <ChoicesGame tier={tier} initialAnswered={answered} /> : null}
      {game.slug === "math" ? <MathLauncher /> : null}
      {game.slug === "treasures" ? <TreasuresLauncher /> : null}
      {game.slug === "amine" ? <AmineLauncher /> : null}
      {game.slug === "skills" ? <SkillsLauncher /> : null}
      {game.slug === "myths" ? <MythsGame tier={tier} initialAnswered={answered} /> : null}
    </>
  );
}
