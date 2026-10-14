export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-dz-green/10">
      <p aria-hidden="true" className="text-6xl">
        🚧
      </p>
      <h1 className="mt-3 text-2xl font-extrabold text-dz-green">{title}</h1>
      <p className="mt-2 text-lg text-ink-soft">قريباً إن شاء الله…</p>
    </section>
  );
}
