"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut, Star } from "lucide-react";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import {
  gamesLink,
  homeLink,
  profileLink,
  type NavLink,
} from "@/components/navigation/navLinks";
import { IconTile, gameArtFor } from "@/components/ui/GameIcon";
import { featuredGame, gameTitle } from "@/lib/games";

const featuredHref = `/dashboard/games/${featuredGame.slug}`;
const COLLAPSED_KEY = "wladz:sidebar-collapsed";

// Liens de navigation, avec le jeu principal (« <prénom>: طريق الحياة ») juste après l'accueil.
function navLinksFor(firstName: string): (NavLink & { featured?: boolean })[] {
  const { icon, tone } = gameArtFor(featuredGame.slug);
  const main = {
    href: featuredHref,
    label: gameTitle(featuredGame, firstName),
    short: "طريقي",
    description: featuredGame.description,
    icon,
    tone,
    featured: true,
  };
  return [homeLink, main, gamesLink, profileLink];
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === featuredHref) return pathname.startsWith(featuredHref);
    // Les jeux rapides sont dans « الألعاب », le classement dans « حسابي ».
    if (href === gamesLink.href)
      return (
        (pathname.startsWith(href) && !pathname.startsWith(featuredHref)) ||
        pathname.startsWith("/dashboard/quick-games")
      );
    if (href === profileLink.href)
      return (
        pathname.startsWith(href) || pathname.startsWith("/dashboard/ranking")
      );
    return pathname.startsWith(href);
  };
}

// Barre latérale repliable sur ordinateur : affichée par défaut, le choix de l'enfant est
// mémorisé dans ce navigateur. html[data-sidebar] laisse la place au bouton de réouverture.
const COLLAPSED_EVENT = "wladz:sidebar";
// Repli quand le stockage du navigateur est bloqué (navigation privée…).
let collapsedInMemory = false;

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return collapsedInMemory;
  }
}

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSED_EVENT, onChange);
  };
}

function useCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );

  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "open";
    return () => {
      delete document.documentElement.dataset.sidebar;
    };
  }, [collapsed]);

  function toggle() {
    collapsedInMemory = !collapsed;
    try {
      window.localStorage.setItem(COLLAPSED_KEY, String(!collapsed));
    } catch {}
    window.dispatchEvent(new Event(COLLAPSED_EVENT));
  }

  return [collapsed, toggle] as const;
}

// Lien de la barre latérale : soulèvement, balayage blanc et halo vert au survol.
const navItem =
  "wz-nav-item flex items-center gap-3 rounded-3xl p-2.5 text-lg font-bold transition-all duration-300";

export function Sidebar({
  points,
  firstName,
}: {
  points: number;
  firstName: string;
}) {
  const isActive = useIsActive();
  const [collapsed, toggleCollapsed] = useCollapsed();
  const links = navLinksFor(firstName);
  // Téléphone : l'accueil au milieu.
  const mobileLinks = [gamesLink, homeLink, profileLink];

  return (
    <>
      {/* Tablet (md): icon rail · Desktop (lg): full sidebar */}
      <aside
        className={`wz-glass sticky top-0 hidden h-dvh shrink-0 flex-col items-center rounded-e-[2rem] p-3 md:w-24 lg:w-72 lg:items-stretch lg:p-5 ${
          collapsed ? "" : "md:flex"
        }`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="إخفاء القائمة"
          title="إخفاء القائمة"
          className="wz-sidebar-toggle absolute top-5 -end-5 z-10"
        >
          <ChevronsRight aria-hidden="true" />
        </button>

        <Link
          href="/dashboard"
          aria-label="WLADZ"
          className="mb-6 flex items-center justify-center"
        >
          <Image
            src="/images/logo-3.png"
            alt="WLADZ"
            width={1000}
            height={418}
            priority
            className="hidden h-auto w-full drop-shadow-md transition-transform duration-300 hover:-rotate-2 hover:scale-105 lg:block"
          />
          <Image
            src="/images/wladz-mark.webp"
            alt="WLADZ"
            width={600}
            height={515}
            priority
            className="h-auto w-14 drop-shadow-md transition-transform duration-300 hover:-rotate-3 hover:scale-105 lg:hidden"
          />
        </Link>

        <nav className="flex flex-col gap-2">
          {links.map(({ href, label, icon, tone, featured }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`${navItem} ${
                  active
                    ? "bg-white/85 text-dz-green shadow-lg ring-2 ring-dz-green-light/70"
                    : featured
                      ? "bg-white/50 text-ink ring-2 ring-[#7c5ce6]/35 hover:bg-white/70"
                      : "text-ink-soft hover:bg-white/60 hover:text-ink"
                }`}
              >
                <IconTile
                  icon={icon}
                  tone={tone}
                  size="sm"
                  className={`shrink-0 ${active ? "scale-110" : ""}`}
                />
                {featured ? (
                  <span className="hidden min-w-0 lg:block">
                    <span className="block truncate">{label}</span>
                    <span className="block text-xs font-bold text-[#7c5ce6]">
                      اللعبة الرئيسية
                    </span>
                  </span>
                ) : (
                  <span className="hidden lg:inline">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2 lg:items-stretch">
          <PointsChip points={points} className="flex-col lg:flex-row" />
          <LogoutButton
            aria-label="خروج"
            className={`${navItem} cursor-pointer justify-center text-ink-soft hover:bg-white/60 hover:text-dz-red lg:justify-start`}
          >
            <IconTile icon={LogOut} tone="#d21034" size="sm" />
            <span className="hidden lg:inline">خروج</span>
          </LogoutButton>
        </div>
      </aside>

      {/* Ordinateur, barre repliée : bouton pour la rouvrir. */}
      {collapsed ? (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="إظهار القائمة"
          title="إظهار القائمة"
          className="wz-sidebar-toggle fixed top-20 start-4 z-30 hidden md:grid"
        >
          <ChevronsLeft aria-hidden="true" />
        </button>
      ) : null}

      {/* Phone: top brand bar */}
      <header className="wz-glass fixed inset-x-0 top-0 z-30 flex items-center justify-between rounded-b-[1.75rem] px-4 py-3 short:absolute md:hidden">
        <Link
          href="/dashboard"
          aria-label="WLADZ"
          className="flex items-center"
        >
          <Image
            src="/images/logo-3.png"
            alt="WLADZ"
            width={1000}
            height={418}
            priority
            className="h-11 w-auto drop-shadow-md"
          />
        </Link>
        <PointsChip points={points} />
      </header>

      {/* Phone: bottom tab bar */}
      <nav className="dashboard-mobile-nav fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-[1.55rem] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] short:rounded-2xl short:pt-1 short:pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden">
        {mobileLinks.map(({ href, label, short, icon, tone }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 short:flex-row short:gap-2 short:py-0.5"
            >
              <IconTile
                icon={icon}
                tone={active ? tone : "#9db8a9"}
                size="sm"
                className={`shrink-0 transition-transform duration-300 short:translate-y-0 ${active ? "-translate-y-1.5" : "opacity-80"}`}
              />
              <span
                className={`truncate text-xs font-bold ${
                  active ? "text-dz-green" : "text-ink-soft"
                }`}
              >
                {short}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function PointsChip({
  points,
  className = "",
}: {
  points: number;
  className?: string;
}) {
  return (
    <p
      className={`wz-glass-soft flex items-center justify-center gap-1.5 rounded-3xl px-3 py-2 text-base font-extrabold text-ink ${className}`}
    >
      <Star
        size={20}
        className="fill-gold text-gold drop-shadow-sm"
        aria-hidden="true"
      />
      <span>{points}</span>
      <span className="sr-only lg:not-sr-only">نقطة</span>
    </p>
  );
}
