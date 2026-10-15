import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { CalendarDays, Hourglass, Cake, House, Phone, Star, Trophy, type LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { months } from "@/components/forms/BirthDateField";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { ButtonLink } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/GameIcon";
import { Tilt } from "@/components/ui/Tilt";
import { getSessionProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "ملفّي" };

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

function ageFrom(birthDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  const age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return today.slice(5) < birthDate.slice(5) ? age - 1 : age;
}

function formatAge(age: number) {
  if (age <= 0) return "أقل من سنة";
  if (age === 1) return "سنة واحدة";
  if (age === 2) return "سنتان";
  return age <= 10 ? `${age} سنوات` : `${age} سنة`;
}

function formatPhone(phone: string) {
  return phone.replace(/^\+213(\d{3})(\d{2})(\d{2})(\d{2})$/, "0$1 $2 $3 $4");
}

function InfoRow({ icon, tone, label, value }: { icon: LucideIcon; tone: string; label: string; value: string }) {
  return (
    <Tilt maxTilt={5} className="wz-glass-soft flex items-center gap-3 rounded-2xl px-4 py-3">
      <IconTile icon={icon} tone={tone} size="sm" />
      <div>
        <dt className="text-base text-ink-soft">{label}</dt>
        <dd className="text-lg font-bold text-ink">{value}</dd>
      </div>
    </Tilt>
  );
}

export default async function ProfilePage() {
  // L'âge dépend de la date du jour : rendu à la requête uniquement.
  await connection();
  const user = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <section className="wz-glass wz-rise mx-auto max-w-md rounded-[2rem] p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="wz-icon-tile mx-auto text-5xl font-black"
        style={{ "--tile": "6rem", "--tone": "#0b7a43", borderRadius: "9999px" } as CSSProperties}
      >
        {user.full_name[0]}
      </div>
      <h1 className="mt-4 text-center text-2xl font-extrabold text-ink">{user.full_name}</h1>

      <p className="wz-glass-soft mx-auto mt-3 flex w-fit items-center gap-2 rounded-full px-5 py-2 text-xl font-extrabold text-ink">
        <Star size={22} className="fill-gold text-gold drop-shadow-sm" aria-hidden="true" />
        {user.points} نقطة
      </p>

      <dl className="mt-6 flex flex-col gap-3">
        <InfoRow icon={Cake} tone="#e2557a" label="تاريخ الميلاد" value={formatDate(user.birth_date)} />
        <InfoRow icon={Hourglass} tone="#7c5ce6" label="العمر" value={formatAge(ageFrom(user.birth_date))} />
        <InfoRow
          icon={Phone}
          tone="#12a39a"
          label="رقم هاتف الوليّ"
          value={`⁦${formatPhone(user.parent_phone)}⁩`}
        />
        <InfoRow icon={CalendarDays} tone="#3a8ee6" label="عضو منذ" value={formatDate(user.created_at)} />
      </dl>

      {/* Le classement est dans « حسابي » (il n'a plus de lien dans la barre de navigation). */}
      <ButtonLink href="/dashboard/ranking" variant="gold" icon={Trophy} block className="mt-6">
        ترتيبي في لوحة المتصدرين
      </ButtonLink>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href="/dashboard" size="sm" icon={House}>
          العودة إلى الرئيسية
        </ButtonLink>
        <LogoutButton />
      </div>
    </section>
  );
}
