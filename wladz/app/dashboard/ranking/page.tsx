import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, Trophy } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getPlayerRank, getRanking, rankingName, type RankingEntry } from "@/lib/ranking";

export const metadata: Metadata = { title: "لوحة المتصدرين" };

const listSize = 20;

const podiumStyles = {
  1: { medal: "🥇", tile: "bg-gold", height: "h-36", ring: "ring-gold" },
  2: { medal: "🥈", tile: "bg-dz-green-light", height: "h-28", ring: "ring-dz-green-light" },
  3: { medal: "🥉", tile: "bg-dz-red", height: "h-20", ring: "ring-dz-red" },
} as const;

const avatarTiles = ["bg-dz-green-light", "bg-dz-green", "bg-dz-red", "bg-green", "bg-gold"];

function Avatar({ name, index, size = "size-11" }: { name: string; index: number; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white shadow-md ${size} ${avatarTiles[index % avatarTiles.length]}`}
    >
      {name[0]}
    </span>
  );
}

function Points({ points }: { points: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-dz-green-soft px-3 py-1 text-base font-extrabold text-ink">
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
          <li key={entry.id} className="flex w-28 flex-col items-center gap-2 sm:w-36">
            <span aria-hidden="true" className="text-4xl">
              {style.medal}
            </span>
            <span
              aria-hidden="true"
              className={`grid size-16 place-items-center rounded-3xl text-2xl font-extrabold text-white shadow-lg ring-4 ${style.tile} ${style.ring}`}
            >
              {entry.displayName[0]}
            </span>
            <span className="text-center text-base font-extrabold text-ink">
              {entry.displayName}
              {isMe ? <span className="block text-sm text-dz-green">(أنت)</span> : null}
            </span>
            <Points points={entry.points} />
            <span
              className={`flex w-full items-start justify-center rounded-t-3xl pt-2 text-2xl font-black text-white shadow-inner ${style.height} ${style.tile}`}
            >
              {entry.rank}
            </span>
          </li>
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
          <span className="grid size-12 place-items-center rounded-2xl bg-gold text-white shadow-md">
            <Trophy size={26} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">لوحة المتصدرين</h1>
            <p className="text-base text-ink-soft">العب وتعلّم، واجمع النقاط لتصعد في الترتيب!</p>
          </div>
        </div>
        {me ? (
          <p className="flex items-center gap-3 rounded-3xl bg-white px-5 py-3 shadow-xl shadow-dz-green/10">
            <span className="text-base font-bold text-ink-soft">ترتيبك</span>
            <span className="text-3xl font-black text-dz-green">{me.rank}</span>
            <span className="text-base text-ink-soft">من {me.total}</span>
          </p>
        ) : null}
      </header>

      {ranking.length === 0 ? (
        <section className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-dz-green/10">
          <p className="text-lg text-ink-soft">لا يوجد لاعبون بعد. كن أول من يجمع النقاط!</p>
        </section>
      ) : (
        <>
          <section className="rounded-[2rem] bg-white px-4 pt-6 shadow-xl shadow-dz-green/10 sm:px-8">
            <Podium entries={podium} meId={user.id} />
          </section>

          {rest.length > 0 || !meInList ? (
            <section className="rounded-[2rem] bg-white p-3 shadow-xl shadow-dz-green/10 sm:p-5">
              <ol className="flex flex-col gap-2">
                {rest.map((entry, index) => {
                  const isMe = entry.id === user.id;
                  return (
                    <li
                      key={entry.id}
                      aria-current={isMe ? "true" : undefined}
                      className={`flex items-center gap-3 rounded-3xl px-3 py-2 ${
                        isMe ? "bg-dz-green-soft ring-2 ring-dz-green-light" : "bg-paper"
                      }`}
                    >
                      <span className="w-8 text-center text-lg font-black text-ink-soft">
                        {entry.rank}
                      </span>
                      <Avatar name={entry.displayName} index={index} />
                      <span className="flex-1 text-base font-extrabold text-ink">
                        {entry.displayName}
                        {isMe ? <span className="ms-2 text-sm text-dz-green">(أنت)</span> : null}
                      </span>
                      <Points points={entry.points} />
                    </li>
                  );
                })}

                {!meInList && me ? (
                  <>
                    <li aria-hidden="true" className="text-center text-xl font-black text-ink-soft">
                      ⋮
                    </li>
                    <li
                      aria-current="true"
                      className="flex items-center gap-3 rounded-3xl bg-dz-green-soft px-3 py-2 ring-2 ring-dz-green-light"
                    >
                      <span className="w-8 text-center text-lg font-black text-ink-soft">
                        {me.rank}
                      </span>
                      <Avatar name={rankingName(user.full_name)} index={0} />
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

      <p className="text-center text-base text-ink-soft">
        تظهر الأسماء مختصرة (الاسم وأول حرف من اللقب) لحماية خصوصيتكم.{" "}
        <Link href="/dashboard/games" className="font-bold text-dz-green underline-offset-4 hover:underline">
          العب الآن لتجمع نقاطاً أكثر
        </Link>
      </p>
    </div>
  );
}
