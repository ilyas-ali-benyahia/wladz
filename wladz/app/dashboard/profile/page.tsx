import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { months } from "@/components/forms/BirthDateField";
import { LogoutButton } from "@/components/navigation/LogoutButton";
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

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3">
      <span aria-hidden="true" className="text-2xl">
        {icon}
      </span>
      <div>
        <dt className="text-base text-ink-soft">{label}</dt>
        <dd className="text-lg font-bold text-ink">{value}</dd>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  // L'âge dépend de la date du jour : rendu à la requête uniquement.
  await connection();
  const user = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <section className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-xl shadow-dz-green/10 sm:p-8">
      <div
        aria-hidden="true"
        className="mx-auto flex size-24 items-center justify-center rounded-full bg-dz-green text-5xl font-black text-white"
      >
        {user.full_name[0]}
      </div>
      <h1 className="mt-4 text-center text-2xl font-extrabold text-ink">{user.full_name}</h1>

      <p className="mx-auto mt-3 w-fit rounded-full bg-dz-green-soft px-5 py-2 text-xl font-extrabold text-ink">
        <span className="text-gold" aria-hidden="true">
          ★
        </span>{" "}
        {user.points} نقطة
      </p>

      <dl className="mt-6 flex flex-col gap-3">
        <InfoRow icon="🎂" label="تاريخ الميلاد" value={formatDate(user.birth_date)} />
        <InfoRow icon="🎈" label="العمر" value={formatAge(ageFrom(user.birth_date))} />
        <InfoRow
          icon="📞"
          label="رقم هاتف الوليّ"
          value={`⁦${formatPhone(user.parent_phone)}⁩`}
        />
        <InfoRow icon="📅" label="عضو منذ" value={formatDate(user.created_at)} />
      </dl>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 items-center fun-btn bg-dz-green px-5 text-base font-bold text-white transition hover:bg-dz-green-light"
        >
          العودة إلى الرئيسية
        </Link>
        <LogoutButton />
      </div>
    </section>
  );
}
