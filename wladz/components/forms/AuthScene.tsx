import type { ReactNode } from "react";

function Cloud({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute h-10 w-28 rounded-full bg-dz-white opacity-90 motion-safe:animate-float ${className}`}
    >
      <div className="absolute -top-5 start-5 size-12 rounded-full bg-dz-white" />
      <div className="absolute -top-3 end-4 size-9 rounded-full bg-dz-white" />
    </div>
  );
}

export function AuthScene({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <Cloud className="start-4 top-10" />
      <Cloud className="end-6 top-28 scale-75 [animation-delay:-3s]" />
      <Cloud className="bottom-12 start-1/4 hidden scale-125 [animation-delay:-5s] sm:block" />

      <section className="relative w-full max-w-md rounded-3xl border-b-8 border-dz-green bg-dz-white p-6 shadow-xl sm:p-8">
        <p dir="ltr" className="text-center text-2xl font-black tracking-wide text-dz-green">
          WLADZ<span className="text-dz-red">.</span>
        </p>
        <div
          aria-hidden="true"
          className="mx-auto mt-4 flex size-20 items-center justify-center rounded-full bg-dz-green-soft text-4xl"
        >
          {emoji}
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-1 text-center text-base text-ink-soft">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
