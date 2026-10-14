import { Gamepad2, Home, Trophy, User, Zap, type LucideIcon } from "lucide-react";

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
export const navLinks: NavLink[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    short: "الرئيسية",
    description: "عُد إلى الصفحة الرئيسية",
    icon: Home,
    tone: "#0b7a43",
  },
  {
    href: "/dashboard/quick-games",
    label: "ألعاب سريعة",
    short: "سريعة",
    description: "تحدّيات قصيرة وممتعة",
    icon: Zap,
    tone: "#d21034",
  },
  {
    href: "/dashboard/games",
    label: "الألعاب",
    short: "الألعاب",
    description: "العب وتعلّم واجمع النقاط",
    icon: Gamepad2,
    tone: "#2f8f5b",
  },
  {
    href: "/dashboard/ranking",
    label: "لوحة المتصدرين",
    short: "المتصدرون",
    description: "شاهد ترتيب الأبطال",
    icon: Trophy,
    tone: "#e5a400",
  },
  {
    href: "/dashboard/profile",
    label: "الملف الشخصي",
    short: "حسابي",
    description: "معلوماتك ونقاطك",
    icon: User,
    tone: "#3a8ee6",
  },
];
