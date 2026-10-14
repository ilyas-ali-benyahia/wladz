import { Gamepad2, Home, Trophy, User, Zap, type LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  tile: string;
};

// Each item gets its own bright icon tile so kids can recognise it by colour
export const navLinks: NavLink[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    short: "الرئيسية",
    description: "عُد إلى الصفحة الرئيسية",
    icon: Home,
    tile: "bg-dz-green",
  },
  {
    href: "/dashboard/quick-games",
    label: "ألعاب سريعة",
    short: "سريعة",
    description: "تحدّيات قصيرة وممتعة",
    icon: Zap,
    tile: "bg-dz-red",
  },
  {
    href: "/dashboard/games",
    label: "الألعاب",
    short: "الألعاب",
    description: "العب وتعلّم واجمع النقاط",
    icon: Gamepad2,
    tile: "bg-dz-green-light",
  },
  {
    href: "/dashboard/ranking",
    label: "لوحة المتصدرين",
    short: "المتصدرون",
    description: "شاهد ترتيب الأبطال",
    icon: Trophy,
    tile: "bg-gold",
  },
  {
    href: "/dashboard/profile",
    label: "الملف الشخصي",
    short: "حسابي",
    description: "معلوماتك ونقاطك",
    icon: User,
    tile: "bg-sky-deep",
  },
];
