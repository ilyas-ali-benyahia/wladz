import { Construction } from "lucide-react";
import { IconTile } from "@/components/ui/GameIcon";

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="wz-glass wz-rise flex flex-col items-center rounded-[2rem] p-8 text-center">
      <IconTile icon={Construction} tone="#e5a400" size="xl" className="wz-bob" />
      <h1 className="mt-4 text-2xl font-extrabold text-dz-green">{title}</h1>
      <p className="mt-2 text-lg text-ink-soft">قريباً إن شاء الله…</p>
    </section>
  );
}
