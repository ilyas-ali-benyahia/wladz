import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Gamepad2, Hand, Medal, Play, Sparkles, Star, Trophy } from "lucide-react";
import { ageTier } from "@/games/ageTier";
import { ButtonLink } from "@/components/ui/Button";
import { GameIcon, IconTile } from "@/components/ui/GameIcon";
import { RankMedal } from "@/components/ui/RankMedal";
import { Tilt } from "@/components/ui/Tilt";
import { getSessionUser } from "@/lib/auth";
import { getGameActivity, type GameActivity } from "@/lib/progress";
import { gameTitle } from "@/lib/games";
import { getPlayerRank, getRanking } from "@/lib/ranking";

const card = "wz-glass wz-rise rounded-[2rem] p-5 sm:p-6";

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

// Ordre d'apparition des cartes (animation wz-rise).
function order(index: number) {
  return { "--i": index } as CSSProperties;
}

function SectionTitle({ icon, title, link }: { icon: ReactNode; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-xl font-extrabold text-ink">
        {icon}
        {title}
      </h2>
      {link ? (
        <ButtonLink href={link.href} variant="secondary" size="sm" icon={ArrowLeft}>
          {link.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}

function RecentGame({ game, now }: { game: GameActivity; now: Date }) {
  const percent = game.total ? Math.min(100, Math.round((game.done / game.total) * 100)) : 0;
  return (
    <Tilt as="li" maxTilt={5} className="wz-glass-soft flex items-center gap-4 rounded-3xl p-3 sm:p-4">
      <GameIcon slug={game.slug} size="lg" />
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
          className="wz-progress mt-2"
        >
          <span style={{ width: `${percent}%` }} />
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
      <ButtonLink
        href={`/dashboard/games/${game.slug}`}
        aria-label={`أكمل ${game.title}`}
        icon={Play}
        className="shrink-0"
      />
    </Tilt>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // « Aujourd'hui » et l'âge dépendent de la date du jour : rendu à la requête uniquement.
  await connection();
  const now = new Date();
  const firstName = user.full_name.split(" ")[0];
  const activity = getGameActivity(user.id, ageTier(user.birth_date, now), now.toISOString().slice(0, 10)).map(
    (game) => ({ ...game, title: gameTitle(game, firstName) }),
  );
  const recent = activity
    .filter((game) => game.lastPlayed)
    .sort((a, b) => b.lastPlayed!.localeCompare(a.lastPlayed!))
    .slice(0, 4);
  const notPlayed = activity.filter((game) => !game.lastPlayed);
  const me = getPlayerRank(user.id);
  const leaders = getRanking(3);

  const stats = [
    { label: "نقطة", value: `${user.points}`, icon: Star, tone: "#e5a400" },
    { label: "ترتيبك", value: me ? `${me.rank}` : "—", icon: Trophy, tone: "#d21034" },
    {
      label: "لعبة جرّبتها",
      value: `${activity.length - notPlayed.length}/${activity.length}`,
      icon: Gamepad2,
      tone: "#0b7a43",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section
        className="wz-glass-green wz-rise relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
        style={order(0)}
      >
        <span aria-hidden="true" className="absolute -top-10 -end-10 size-40 rounded-full bg-white/15" />
        <span aria-hidden="true" className="absolute -bottom-12 end-24 size-28 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold sm:text-4xl">
              مرحباً، {firstName}!
              <span className="wz-wave grid size-12 place-items-center rounded-2xl bg-white/20 shadow-inner">
                <Hand size={30} strokeWidth={2.2} className="text-gold" aria-hidden="true" />
              </span>
            </h1>
            <p className="mt-2 text-lg font-medium text-white/90">
              {recent.length ? "أكمل مغامرتك من حيث توقّفت." : "هيّا نبدأ أول مغامرة اليوم!"}
            </p>
          </div>
          <dl className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-3">
            {stats.map((stat) => (
              <Tilt
                key={stat.label}
                maxTilt={8}
                className="flex min-w-0 flex-col items-center gap-2 rounded-3xl border border-white/70 bg-white/85 px-2 py-3 text-ink shadow-lg sm:flex-row sm:gap-3 sm:px-4"
              >
                <IconTile icon={stat.icon} tone={stat.tone} size="sm" />
                <span className="text-center sm:text-start">
                  <dd className="text-xl font-extrabold leading-none sm:text-2xl">{stat.value}</dd>
                  <dt className="mt-1 text-sm font-bold text-ink-soft">{stat.label}</dt>
                </span>
              </Tilt>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={card} style={order(1)}>
          <SectionTitle
            icon={<IconTile icon={Play} tone="#0b7a43" size="sm" />}
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
            <div className="wz-glass-soft flex flex-col items-center rounded-3xl p-6 text-center">
              <IconTile icon={Gamepad2} tone="#2f8f5b" size="xl" className="wz-bob" />
              <p className="mt-4 text-lg font-bold text-ink">لم تلعب أي لعبة بعد</p>
              <p className="text-base text-ink-soft">ستظهر هنا الألعاب التي تلعبها وتقدّمك فيها.</p>
            </div>
          )}
        </section>

        <section className={card} style={order(2)}>
          <SectionTitle
            icon={<IconTile icon={Medal} tone="#e5a400" size="sm" />}
            title="المتصدرون"
            link={{ href: "/dashboard/ranking", label: "الترتيب الكامل" }}
          />
          <ol className="flex flex-col gap-2">
            {leaders.map((entry) => {
              const isMe = entry.id === user.id;
              return (
                <Tilt
                  as="li"
                  key={entry.id}
                  maxTilt={5}
                  className={`flex items-center gap-3 rounded-3xl px-3 py-2 ${
                    isMe ? "bg-white/90 shadow-md ring-2 ring-dz-green-light" : "wz-glass-soft"
                  }`}
                >
                  <RankMedal rank={entry.rank} size="sm" />
                  <span className="flex-1 font-extrabold text-ink">
                    {entry.displayName}
                    {isMe ? <span className="ms-2 text-sm text-dz-green">(أنت)</span> : null}
                  </span>
                  <span className="flex items-center gap-1 font-extrabold text-ink">
                    <Star size={16} className="fill-gold text-gold" aria-hidden="true" />
                    {entry.points}
                  </span>
                </Tilt>
              );
            })}
          </ol>
          {me && !leaders.some((entry) => entry.id === user.id) ? (
            <p className="wz-glass-soft mt-3 rounded-3xl px-4 py-3 text-base font-bold text-ink">
              أنت في المركز <span className="text-dz-green">{me.rank}</span> من {me.total}. واصل اللعب لتصعد!
            </p>
          ) : null}
        </section>
      </div>

      {notPlayed.length ? (
        <section className={card} style={order(3)}>
          <SectionTitle
            icon={<IconTile icon={Sparkles} tone="#d21034" size="sm" />}
            title="ألعاب لم تجرّبها بعد"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notPlayed.slice(0, 3).map((game) => (
              <Tilt as="li" key={game.slug} className="wz-glass-soft rounded-3xl">
                <Link
                  href={`/dashboard/games/${game.slug}`}
                  className="flex h-full items-center gap-3 rounded-3xl p-3"
                >
                  <GameIcon slug={game.slug} size="md" />
                  <span className="min-w-0">
                    <span className="block font-extrabold text-ink">{game.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-sm font-bold text-dz-green">
                      جرّبها الآن
                      <ArrowLeft size={16} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </Tilt>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
