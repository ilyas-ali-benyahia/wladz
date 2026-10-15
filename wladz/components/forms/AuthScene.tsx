import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ui/GameIcon";
import { SkyBackdrop } from "@/components/ui/SkyBackdrop";

export function AuthScene({
  icon,
  tone = "#2f8f5b",
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  tone?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      <SkyBackdrop />

      <section className="wz-glass wz-rise relative w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <Image
          src="/images/wladz-logo.webp"
          alt="WLADZ"
          width={1000}
          height={418}
          priority
          className="mx-auto h-auto w-48 drop-shadow-md"
        />
        <div className="mt-4 flex justify-center">
          <IconTile icon={icon} tone={tone} size="lg" className="wz-bob" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-1 text-center text-base text-ink-soft">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
