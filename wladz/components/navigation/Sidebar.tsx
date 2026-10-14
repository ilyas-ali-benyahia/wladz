"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Star } from "lucide-react";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { navLinks, type NavLink } from "@/components/navigation/navLinks";
import { IconTile, gameArtFor } from "@/components/ui/GameIcon";
import { featuredGame, gameTitle } from "@/lib/games";

const featuredHref = `/dashboard/games/${featuredGame.slug}`;

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
  return [navLinks[0], main, ...navLinks.slice(1)];
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href) && (href === featuredHref || !pathname.startsWith(featuredHref));
}

// Lien de la barre latérale : soulèvement, balayage blanc et halo vert au survol.
const navItem =
  "wz-nav-item flex items-center gap-3 rounded-3xl p-2.5 text-lg font-bold transition-all duration-300";

export function Sidebar({ points, firstName }: { points: number; firstName: string }) {
  const isActive = useIsActive();
  const links = navLinksFor(firstName);

  return (
    <>
      {/* Tablet (md): icon rail · Desktop (lg): full sidebar */}
      <aside className="wz-glass sticky top-0 hidden h-dvh shrink-0 flex-col items-center rounded-e-[2rem] p-3 md:flex md:w-24 lg:w-72 lg:items-stretch lg:p-5">
        <Link href="/dashboard" aria-label="WLADZ" className="mb-6 flex items-center justify-center">
          <Logo className="h-auto w-full drop-shadow-md transition-transform duration-300 hover:-rotate-2 hover:scale-105" priority />
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
                <IconTile icon={icon} tone={tone} size="sm" className={`shrink-0 ${active ? "scale-110" : ""}`} />
                {featured ? (
                  <span className="hidden min-w-0 lg:block">
                    <span className="block truncate">{label}</span>
                    <span className="block text-xs font-bold text-[#7c5ce6]">اللعبة الرئيسية</span>
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

      {/* Phone: top brand bar */}
      <header className="wz-glass fixed inset-x-0 top-0 z-30 flex items-center justify-between rounded-b-[1.75rem] px-4 py-3 short:absolute md:hidden">
        <Link href="/dashboard" aria-label="WLADZ" className="flex items-center">
          <Logo className="h-11 w-auto drop-shadow-md" priority />
        </Link>
        <PointsChip points={points} />
      </header>

      {/* Phone: bottom tab bar */}
      <nav className="wz-glass fixed inset-x-0 bottom-0 z-30 flex justify-around rounded-t-[1.75rem] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] short:rounded-t-2xl short:pt-1 short:pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden">
        {links.map(({ href, label, short, icon, tone }) => {
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

function PointsChip({ points, className = "" }: { points: number; className?: string }) {
  return (
    <p
      className={`wz-glass-soft flex items-center justify-center gap-1.5 rounded-3xl px-3 py-2 text-base font-extrabold text-ink ${className}`}
    >
      <Star size={20} className="fill-gold text-gold drop-shadow-sm" aria-hidden="true" />
      <span>{points}</span>
      <span className="sr-only lg:not-sr-only">نقطة</span>
    </p>
  );
}

function Logo({ className, priority = false }: { className: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo-3.png"
      alt="WLADZ"
      width={1412}
      height={704}
      priority={priority}
      className={className}
    />
  );
}
