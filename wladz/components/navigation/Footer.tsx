import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { navLinks } from "@/components/navigation/navLinks";
import { IconTile } from "@/components/ui/GameIcon";

export function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden rounded-t-[2.5rem] bg-dz-green px-4 pt-10 pb-28 text-white md:px-8 md:pb-6">
      <span
        aria-hidden="true"
        className="absolute -top-16 -start-16 size-56 rounded-full bg-white/10"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-20 end-1/4 size-48 rounded-full bg-white/5"
      />

      <div className="relative mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.3fr_1fr_1fr] md:items-start">
        <div>
          <Image
            src="/images/logo-3.png"
            alt="WLADZ"
            width={1412}
            height={704}
            className="h-20 w-auto drop-shadow-lg"
          />
          <p className="mt-3 text-lg font-bold">نلعب، نتعلّم، ونكبر معاً.</p>
          <p className="mt-1 text-base text-white/85">
            ألعاب تعليمية وتوعوية لأطفال وشباب الجزائر.
          </p>
        </div>

        <nav aria-label="روابط سريعة">
          <p className="mb-3 text-lg font-extrabold">روابط سريعة</p>
          <ul className="grid grid-cols-2 gap-2">
            {navLinks.map(({ href, label, icon, tone }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="wz-footer-link flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-2 py-1.5 text-base font-bold backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <IconTile icon={icon} tone={tone} size="sm" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col items-center gap-3 text-center md:items-end md:text-end">
          <div className="grid size-32 place-items-center rounded-3xl bg-white p-3 shadow-xl transition-transform duration-300 hover:-rotate-2 hover:scale-105">
            <Image
              src="/landing/ministere-jeunesse-sport.svg"
              alt="شعار وزارة الشباب والرياضة"
              width={2342}
              height={2004}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="text-lg font-extrabold">
            بدعم من وزارة الشباب والرياضة
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-white/25 pt-4 text-base text-white/90 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          صُنع بكل
          <Heart
            size={18}
            className="fill-dz-red text-dz-red"
            aria-label="حب"
          />
          لأطفال الجزائر
        </p>
        <p>
          <bdi>© WLADZ</bdi> — جميع الحقوق محفوظة ·{" "}
          <Link
            href="/dashboard/contact"
            className="font-bold underline-offset-4 hover:underline"
          >
            اتصل بنا
          </Link>
        </p>
      </div>
    </footer>
  );
}
