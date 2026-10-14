"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Star } from "lucide-react";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { navLinks } from "@/components/navigation/navLinks";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

export function Sidebar({ points }: { points: number }) {
  const isActive = useIsActive();

  return (
    <>
      {/* Tablet (md): icon rail · Desktop (lg): full sidebar */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col items-center rounded-e-[2rem] bg-white p-3 shadow-xl shadow-dz-green/10 md:flex md:w-24 lg:w-72 lg:items-stretch lg:p-5">
        <Link href="/dashboard" aria-label="WLADZ" className="mb-6 flex items-center justify-center">
          <Logo className="h-auto w-full" priority />
        </Link>

        <nav className="flex flex-col gap-2">
          {navLinks.map(({ href, label, icon: Icon, tile }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-3xl p-2.5 text-lg font-bold transition-all ${
                  active
                    ? "bg-dz-green-soft text-dz-green ring-2 ring-dz-green-light"
                    : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-md transition-transform ${tile} ${
                    active ? "scale-110" : ""
                  }`}
                >
                  <Icon size={22} strokeWidth={2.5} />
                </span>
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2 lg:items-stretch">
          <PointsChip points={points} className="flex-col lg:flex-row" />
          <LogoutButton
            aria-label="خروج"
            className="flex cursor-pointer items-center justify-center gap-3 rounded-3xl p-2.5 text-lg font-bold text-ink-soft transition-all hover:bg-paper hover:text-ink lg:justify-start"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red text-white shadow-md">
              <LogOut size={22} strokeWidth={2.5} />
            </span>
            <span className="hidden lg:inline">خروج</span>
          </LogoutButton>
        </div>
      </aside>

      {/* Phone: top brand bar */}
      <header className="fixed inset-x-0 top-0 z-30 short:absolute flex items-center justify-between bg-white/90 px-4 py-3 shadow-sm shadow-dz-green/10 backdrop-blur md:hidden">
        <Link href="/dashboard" aria-label="WLADZ" className="flex items-center">
          <Logo className="h-11 w-auto" priority />
        </Link>
        <PointsChip points={points} />
      </header>

      {/* Phone: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around rounded-t-[1.75rem] bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] short:rounded-t-2xl short:pt-1 short:pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_-8px] shadow-dz-green/10 md:hidden">
        {navLinks.map(({ href, label, short, icon: Icon, tile }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 short:flex-row short:gap-2 short:py-0.5"
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-2xl transition-all short:size-9 short:translate-y-0 ${
                  active
                    ? `${tile} -translate-y-1.5 text-white shadow-md`
                    : "bg-dz-green-soft text-ink-soft"
                }`}
              >
                <Icon size={22} strokeWidth={2.5} />
              </span>
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
      className={`flex items-center justify-center gap-1.5 rounded-3xl bg-dz-green-soft px-3 py-2 text-base font-extrabold text-ink ${className}`}
    >
      <Star size={20} className="fill-gold text-gold" aria-hidden="true" />
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
