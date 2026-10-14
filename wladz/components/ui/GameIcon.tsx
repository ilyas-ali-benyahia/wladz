import type { CSSProperties } from "react";
import {
  Amphora,
  Compass,
  Flag,
  Gamepad2,
  MoonStar,
  Rocket,
  Route,
  SearchCheck,
  ShieldCheck,
  Sprout,
  Target,
  type LucideIcon,
} from "lucide-react";

type TileSize = "sm" | "md" | "lg" | "xl";

// Illustration de chaque jeu (icône + couleur), à la place des emojis.
const gameArt: Record<string, { icon: LucideIcon; tone: string }> = {
  space: { icon: Rocket, tone: "#3a8ee6" },
  choices: { icon: ShieldCheck, tone: "#2f8f5b" },
  amine: { icon: Route, tone: "#7c5ce6" },
  treasures: { icon: Amphora, tone: "#d9822b" },
  skills: { icon: Compass, tone: "#e2557a" },
  math: { icon: Target, tone: "#12a39a" },
  myths: { icon: SearchCheck, tone: "#d21034" },
  ghiras: { icon: Sprout, tone: "#4c9a2a" },
  salati: { icon: MoonStar, tone: "#0b7a43" },
  mujahideen: { icon: Flag, tone: "#b8892b" },
};

const fallback = { icon: Gamepad2, tone: "#2f8f5b" };

export function gameArtFor(slug: string) {
  return gameArt[slug] ?? fallback;
}

// Tuile colorée en relief avec une icône blanche (styles .wz-icon-tile dans app/ui.css).
export function IconTile({
  icon: Icon,
  tone = "#2f8f5b",
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  tone?: string;
  size?: TileSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`wz-icon-tile wz-icon-tile--${size} ${className}`}
      style={{ "--tone": tone } as CSSProperties}
    >
      <Icon strokeWidth={2.2} />
    </span>
  );
}

export function GameIcon({ slug, size = "md", className = "" }: { slug: string; size?: TileSize; className?: string }) {
  const { icon, tone } = gameArtFor(slug);
  return <IconTile icon={icon} tone={tone} size={size} className={className} />;
}
