import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

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

      {/* Deux logos séparés par un trait blanc (styles .wz-footer-grid dans app/ui.css). */}
      <div className="wz-footer-grid relative mx-auto max-w-5xl">
        {/* Tuile blanche : le logo vert reste lisible sur le fond vert. */}
        <Link
          href="/dashboard"
          aria-label="WLADZ"
          className="wz-footer-logo rounded-3xl bg-white px-4 py-3 shadow-xl transition-transform duration-300 hover:-rotate-2 hover:scale-105 md:px-5"
        >
          <Image
            src="/images/wladz-logo.webp"
            alt="WLADZ"
            width={1000}
            height={418}
            className="h-auto w-36 md:w-48"
          />
        </Link>
        <div className="wz-footer-tag">
          <p className="text-lg font-bold">نلعب، نتعلّم، ونكبر معاً.</p>
          <p className="mt-1 text-base text-white/85">ألعاب تعليمية وتوعوية لأطفال وشباب الجزائر.</p>
        </div>
        <span className="wz-footer-line" aria-hidden="true" />
        <div className="wz-footer-ministry">
          <div className="grid size-28 place-items-center rounded-3xl bg-white p-3 shadow-xl transition-transform duration-300 hover:-rotate-2 hover:scale-105 md:size-32">
            <Image
              src="/landing/ministere-jeunesse-sport.svg"
              alt="شعار وزارة الشباب والرياضة"
              width={2342}
              height={2004}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="text-base font-extrabold md:text-lg">بدعم من وزارة الشباب والرياضة</p>
        </div>
      </div>

      <div className="relative mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-white/25 pt-4 text-base text-white/90 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          صُنع بكل
          <Heart size={18} className="fill-dz-red text-dz-red" aria-label="حب" />
          لأطفال الجزائر
        </p>
        <p>
          <bdi>© WLADZ</bdi> — جميع الحقوق محفوظة ·{" "}
          <Link href="/dashboard/contact" className="font-bold underline-offset-4 hover:underline">
            اتصل بنا
          </Link>
        </p>
      </div>
    </footer>
  );
}
