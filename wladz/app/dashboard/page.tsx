import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Gamepad2, Medal, Play, Sparkles, Star, Trophy } from "lucide-react";
import { ageTier } from "@/games/ageTier";
import { getSessionUser } from "@/lib/auth";
import { getGameActivity, type GameActivity } from "@/lib/progress";
import { getPlayerRank, getRanking } from "@/lib/ranking";

const card = "rounded-[2rem] bg-white p-5 shadow-xl shadow-dz-green/10 sm:p-6";

function timeAgo(isoDate: string, now: Date) {
  const days = Math.floor((now.getTime() - new Date(isoDate).getTime()) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "منذ يومين";
  return days <= 10 ? `منذ ${days} أيام` : `منذ ${days} يوماً`;
}

// Accord du mot « نقطة » avec le nombre.
function pointsLabel(points: number) {
  if (points === 1) return "نقطة واحدة";
  if (points === 2) return "نقطتان";
  if (points >= 3 && points <= 10) return `${points} نقاط`;
  return `${points} نقطة`;
}

function SectionTitle({ icon, title, link }: { icon: ReactNode; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink">
        {icon}
        {title}
      </h2>
      {link ? (
        <Link href={link.href} className="py-2 text-base font-bold text-dz-green hover:underline">
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}

function RecentGame({ game, now }: { game: GameActivity; now: Date }) {
  const percent = game.total ? Math.min(100, Math.round((game.done / game.total) * 100)) : 0;
  return (
    <li className="flex items-center gap-4 rounded-3xl bg-paper p-3 sm:p-4">
      <span
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center rounded-3xl bg-dz-green-soft text-4xl"
      >
        {game.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="truncate text-lg font-extrabold text-ink">{game.title}</h3>
          <span className="text-sm font-bold text-ink-soft">{timeAgo(game.lastPlayed!, now)}</span>
        </div>
        <div
          role="progressbar"
          aria-label={`التقدّم في ${game.title}`}
          aria-valuemin={0}
          aria-valuemax={game.total}
          aria-valuenow={game.done}
          className="mt-2 h-3 overflow-hidden rounded-full bg-dz-green-soft"
        >
          <div className="h-full rounded-full bg-dz-green" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-ink-soft">
          <span>
            {game.done} / {game.total} {game.unit}
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-gold text-gold" aria-hidden="true" />
            {pointsLabel(game.points)} من هذه اللعبة
          </span>
        </div>
      </div>
      <Link
        href={`/dashboard/games/${game.slug}`}
        aria-label={`أكمل ${game.title}`}
        className="grid size-12 shrink-0 place-items-center fun-btn bg-dz-green text-white transition-transform hover:-translate-y-0.5"
      >
        <Play size={22} className="fill-white" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // « Aujourd'hui » et l'âge dépendent de la date du jour : rendu à la requête uniquement.
  await connection();
  const now = new Date();
  const activity = getGameActivity(user.id, ageTier(user.birth_date, now), now.toISOString().slice(0, 10));
  const recent = activity
    .filter((game) => game.lastPlayed)
    .sort((a, b) => b.lastPlayed!.localeCompare(a.lastPlayed!))
    .slice(0, 4);
  const notPlayed = activity.filter((game) => !game.lastPlayed);
  const me = getPlayerRank(user.id);
  const leaders = getRanking(3);
  const firstName = user.full_name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-dz-green-light to-dz-green p-6 text-white shadow-xl shadow-dz-green/10 sm:p-8">
        <span aria-hidden="true" className="absolute -top-10 -end-10 size-40 rounded-full bg-white/15" />
        <span aria-hidden="true" className="absolute -bottom-12 end-24 size-28 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">مرحباً، {firstName}! 👋</h1>
            <p className="mt-2 text-lg font-medium text-white/90">
              {recent.length ? "أكمل مغامرتك من حيث توقّفت." : "هيّا نبدأ أول مغامرة اليوم!"}
            </p>
          </div>
          <dl className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-3">
            {[
              { label: "نقطة", value: user.points, icon: <Star size={22} className="fill-white" aria-hidden="true" />, tile: "bg-gold" },
              { label: "ترتيبك", value: me ? `${me.rank}` : "—", icon: <Trophy size={22} aria-hidden="true" />, tile: "bg-dz-red" },
              { label: "لعبة جرّبتها", value: `${activity.length - notPlayed.length}/${activity.length}`, icon: <Gamepad2 size={22} aria-hidden="true" />, tile: "bg-dz-green" },
            ].map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col items-center gap-1 rounded-3xl bg-white px-2 py-3 text-ink shadow-md sm:flex-row sm:gap-3 sm:px-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl text-white shadow-md ${stat.tile}`}>
                  {stat.icon}
                </span>
                <span className="text-center sm:text-start">
                  <dd className="text-xl font-extrabold leading-none sm:text-2xl">{stat.value}</dd>
                  <dt className="mt-1 text-sm font-bold text-ink-soft">{stat.label}</dt>
                </span>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={card}>
          <SectionTitle
            icon={<Play size={22} className="text-dz-green" aria-hidden="true" />}
            title="تابع اللعب"
            link={{ href: "/dashboard/games", label: "كل الألعاب" }}
          />
          {recent.length ? (
            <ul className="flex flex-col gap-3">
              {recent.map((game) => (
                <RecentGame key={game.slug} game={game} now={now} />
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl bg-paper p-6 text-center">
              <p aria-hidden="true" className="text-5xl">🎮</p>
              <p className="mt-2 text-lg font-bold text-ink">لم تلعب أي لعبة بعد</p>
              <p className="text-base text-ink-soft">ستظهر هنا الألعاب التي تلعبها وتقدّمك فيها.</p>
            </div>
          )}
        </section>

        <section className={card}>
          <SectionTitle
            icon={<Medal size={22} className="text-gold" aria-hidden="true" />}
            title="المتصدرون"
            link={{ href: "/dashboard/ranking", label: "الترتيب الكامل" }}
          />
          <ol className="flex flex-col gap-2">
            {leaders.map((entry) => {
              const isMe = entry.id === user.id;
              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-3xl px-3 py-2 ${isMe ? "bg-dz-green-soft ring-2 ring-dz-green-light" : "bg-paper"}`}
                >
                  <span aria-hidden="true" className="text-2xl">
                    {["🥇", "🥈", "🥉"][Math.min(entry.rank, 3) - 1]}
                  </span>
                  <span className="flex-1 font-extrabold text-ink">
                    {entry.displayName}
                    {isMe ? <span className="ms-2 text-sm text-dz-green">(أنت)</span> : null}
                  </span>
                  <span className="flex items-center gap-1 font-extrabold text-ink">
                    <Star size={16} className="fill-gold text-gold" aria-hidden="true" />
                    {entry.points}
                  </span>
                </li>
              );
            })}
          </ol>
          {me && !leaders.some((entry) => entry.id === user.id) ? (
            <p className="mt-3 rounded-3xl bg-dz-green-soft px-4 py-3 text-base font-bold text-ink">
              أنت في المركز <span className="text-dz-green">{me.rank}</span> من {me.total}. واصل اللعب لتصعد!
            </p>
          ) : null}
        </section>
      </div>

      {notPlayed.length ? (
        <section className={card}>
          <SectionTitle
            icon={<Sparkles size={22} className="text-dz-red" aria-hidden="true" />}
            title="ألعاب لم تجرّبها بعد"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notPlayed.slice(0, 3).map((game) => (
              <li key={game.slug}>
                <Link
                  href={`/dashboard/games/${game.slug}`}
                  className="flex h-full items-center gap-3 rounded-3xl bg-paper p-3 transition-transform hover:-translate-y-0.5"
                >
                  <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-dz-green-soft text-3xl">
                    {game.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-extrabold text-ink">{game.title}</span>
                    <span className="block text-sm font-bold text-dz-green">جرّبها الآن ←</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
