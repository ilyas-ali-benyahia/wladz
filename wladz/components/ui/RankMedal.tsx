import type { CSSProperties } from "react";
import { Medal } from "lucide-react";

const medalTones = { 1: "#f2b705", 2: "#9aa9b8", 3: "#c47a3d" } as const;
const medalNames = { 1: "المركز الأول", 2: "المركز الثاني", 3: "المركز الثالث" } as const;

// Médaille d'or, d'argent ou de bronze (icône), à la place des emojis de médailles.
export function RankMedal({ rank, size = "md" }: { rank: number; size?: "sm" | "md" | "lg" }) {
  const place = Math.min(Math.max(rank, 1), 3) as 1 | 2 | 3;
  return (
    <span
      role="img"
      aria-label={medalNames[place]}
      className={`wz-medal wz-medal--${size}`}
      style={{ "--tone": medalTones[place] } as CSSProperties}
    >
      <Medal strokeWidth={2.3} aria-hidden="true" />
    </span>
  );
}
