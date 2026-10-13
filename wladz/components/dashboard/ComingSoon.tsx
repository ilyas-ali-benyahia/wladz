export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="rounded-3xl bg-dz-white p-8 text-center shadow-xl">
      <h1 className="text-2xl font-extrabold text-dz-green">{title}</h1>
      <p className="mt-2 text-lg text-ink-soft">قريباً إن شاء الله…</p>
    </section>
  );
}
