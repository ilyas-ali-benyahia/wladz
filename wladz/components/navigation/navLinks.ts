import { Gamepad2, Home, User, type LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  // Couleur de la tuile d'icône (IconTile).
  tone: string;
};

// Chaque lien a sa propre tuile colorée, pour que les enfants le reconnaissent à sa couleur.
// Les jeux rapides sont dans « الألعاب » (interrupteur), le classement dans « حسابي ».
export const homeLink: NavLink = {
  href: "/dashboard",
  label: "الرئيسية",
  short: "الرئيسية",
  description: "عُد إلى الصفحة الرئيسية",
  icon: Home,
  tone: "#0b7a43",
};

export const gamesLink: NavLink = {
  href: "/dashboard/games",
  label: "الألعاب",
  short: "الألعاب",
  description: "العب وتعلّم واجمع النقاط",
  icon: Gamepad2,
  tone: "#2f8f5b",
};

export const profileLink: NavLink = {
  href: "/dashboard/profile",
  label: "الملف الشخصي",
  short: "حسابي",
  description: "معلوماتك ونقاطك وترتيبك",
  icon: User,
  tone: "#3a8ee6",
};

export const navLinks: NavLink[] = [homeLink, gamesLink, profileLink];
