import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gamepad2, Star, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/GameIcon";
import { RankMedal } from "@/components/ui/RankMedal";
import { Tilt } from "@/components/ui/Tilt";
import { getSessionUser } from "@/lib/auth";
import { getPlayerRank, getRanking, rankingName, type RankingEntry } from "@/lib/ranking";

export const metadata: Metadata = { title: "لوحة المتصدرين" };

const listSize = 20;

const podiumStyles = {
  1: { tone: "#e5a400", height: "h-36" },
  2: { tone: "#2f8f5b", height: "h-28" },
  3: { tone: "#d21034", height: "h-20" },
} as const;

const avatarTones = ["#2f8f5b", "#0b7a43", "#d21034", "#3a8ee6", "#e5a400", "#7c5ce6"];

// Première lettre du prénom dans une tuile colorée en relief.
function Avatar({ name, tone, size = "2.75rem" }: { name: string; tone: string; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className="wz-icon-tile text-lg font-extrabold"
      style={{ "--tile": size, "--tone": tone } as CSSProperties}
    >
      {name[0]}
    </span>
  );
}

function Points({ points }: { points: number }) {
  return (
    <span className="wz-glass-soft flex items-center gap-1 rounded-full px-3 py-1 text-base font-extrabold text-ink">
      <Star size={16} className="fill-gold text-gold" aria-hidden="true" />
      {points}
    </span>
  );
}

function Podium({ entries, meId }: { entries: RankingEntry[]; meId: string }) {
  // Ordre visuel 2 – 1 – 3, la première place au centre.
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <ol aria-label="المراكز الثلاثة الأولى" className="flex items-end justify-center gap-3 sm:gap-6">
      {order.map((entry) => {
        const place = Math.min(entry.rank, 3) as 1 | 2 | 3;
        const style = podiumStyles[place];
        const isMe = entry.id === meId;
        return (
          <Tilt as="li" key={entry.id} className="flex w-28 flex-col items-center gap-2 rounded-t-3xl sm:w-36">
            <RankMedal rank={place} size="lg" />
            <Avatar name={entry.displayName} tone={style.tone} size="4rem" />
            <span className="text-center text-base font-extrabold text-ink">
              {entry.displayName}
              {isMe ? <span className="block text-sm text-dz-green">(أنت)</span> : null}
            </span>
            <Points points={entry.points} />
            <span
              className={`flex w-full items-start justify-center rounded-t-3xl pt-2 text-2xl font-black text-white shadow-inner ${style.height}`}
              style={{
                background: `linear-gradient(180deg, rgb(255 255 255 / 0.28), transparent 45%), linear-gradient(160deg, color-mix(in srgb, ${style.tone} 75%, white), ${style.tone})`,
              }}
            >
              {entry.rank}
            </span>
          </Tilt>
        );
      })}
    </ol>
  );
}

export default async function RankingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const ranking = getRanking(listSize);
  const me = getPlayerRank(user.id);
  const meInList = ranking.some((entry) => entry.id === user.id);
  const podium = ranking.filter((entry) => entry.rank <= 3).slice(0, 3);
  const rest = ranking.slice(podium.length);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconTile icon={Trophy} tone="#e5a400" size="md" />
          <div>
            <h1 className="text-2xl font-extrabold text-ink">لوحة المتصدرين</h1>
            <p className="text-base text-ink-soft">العب وتعلّم، واجمع النقاط لتصعد في الترتيب!</p>
          </div>
        </div>
        {me ? (
          <p className="wz-glass flex items-center gap-3 rounded-3xl px-5 py-3">
            <span className="text-base font-bold text-ink-soft">ترتيبك</span>
            <span className="text-3xl font-black text-dz-green">{me.rank}</span>
            <span className="text-base text-ink-soft">من {me.total}</span>
          </p>
        ) : null}
      </header>

      {ranking.length === 0 ? (
        <section className="wz-glass wz-rise rounded-[2rem] p-8 text-center">
          <p className="text-lg text-ink-soft">لا يوجد لاعبون بعد. كن أول من يجمع النقاط!</p>
        </section>
      ) : (
        <>
          <section className="wz-glass wz-rise rounded-[2rem] px-4 pt-6 sm:px-8">
            <Podium entries={podium} meId={user.id} />
          </section>

          {rest.length > 0 || !meInList ? (
            <section className="wz-glass wz-rise rounded-[2rem] p-3 sm:p-5" style={{ "--i": 1 } as CSSProperties}>
              <ol className="flex flex-col gap-2">
                {rest.map((entry, index) => {
                  const isMe = entry.id === user.id;
                  return (
                    <Tilt
                      as="li"
                      key={entry.id}
                      maxTilt={4}
                      aria-current={isMe ? "true" : undefined}
                      className={`flex items-center gap-3 rounded-3xl px-3 py-2 ${
                        isMe ? "bg-white/90 shadow-md ring-2 ring-dz-green-light" : "wz-glass-soft"
                      }`}
                    >
                      <span className="w-8 text-center text-lg font-black text-ink-soft">
                        {entry.rank}
                      </span>
                      <Avatar name={entry.displayName} tone={avatarTones[index % avatarTones.length]} />
                      <span className="flex-1 text-base font-extrabold text-ink">
                        {entry.displayName}
                        {isMe ? <span className="ms-2 text-sm text-dz-green">(أنت)</span> : null}
                      </span>
                      <Points points={entry.points} />
                    </Tilt>
                  );
                })}

                {!meInList && me ? (
                  <>
                    <li aria-hidden="true" className="text-center text-xl font-black text-ink-soft">
                      ⋮
                    </li>
                    <li
                      aria-current="true"
                      className="flex items-center gap-3 rounded-3xl bg-white/90 px-3 py-2 shadow-md ring-2 ring-dz-green-light"
                    >
                      <span className="w-8 text-center text-lg font-black text-ink-soft">
                        {me.rank}
                      </span>
                      <Avatar name={rankingName(user.full_name)} tone={avatarTones[0]} />
                      <span className="flex-1 text-base font-extrabold text-ink">
                        {rankingName(user.full_name)}
                        <span className="ms-2 text-sm text-dz-green">(أنت)</span>
                      </span>
                      <Points points={me.points} />
                    </li>
                  </>
                ) : null}
              </ol>
            </section>
          ) : null}
        </>
      )}

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-base text-ink-soft">
          تظهر الأسماء مختصرة (الاسم وأول حرف من اللقب) لحماية خصوصيتكم.
        </p>
        <ButtonLink href="/dashboard/games" icon={Gamepad2}>
          العب الآن لتجمع نقاطاً أكثر
        </ButtonLink>
      </div>
    </div>
  );
}
