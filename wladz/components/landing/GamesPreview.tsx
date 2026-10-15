"use client";

import Link from "next/link";
import { useState, type PointerEvent } from "react";
import { GameCarousel, useIsMobile } from "@/components/ui/GameCarousel";
import { GameMedia } from "@/components/ui/GameMedia";
import Icon from "./Icon";
import River from "./River";
import { useParallax } from "./useParallax";

type Game = {
  id: string;
  title: string;
  category: string;
  type: string;
  description: string;
  color: "sky" | "mint" | "sand" | "rose";
};

// Jeux présentés sur la page d'accueil, chacun avec son trailer (public/trailers/<id>.mp4).
const games: readonly Game[] = [
  {
    id: "amine",
    title: "أمين: طريق الحياة",
    category: "قصة الحياة",
    type: "عالم مفتوح ثلاثي الأبعاد",
    description: "عِش حياة أمين في حومة جزائرية: 68 فصلاً و72 نهاية مختلفة حسب قراراتك.",
    color: "sand",
  },
  {
    id: "space",
    title: "الرائد الصغير — رحلة إلى الفضاء",
    category: "علوم ومغامرة",
    type: "مغامرة ثلاثية الأبعاد",
    description: "انظر عبر التلسكوب السحري واكتشف أسرار الشمس والكواكب والنجوم.",
    color: "sky",
  },
  {
    id: "mujahideen",
    title: "المجاهدون الستة",
    category: "التاريخ والذاكرة",
    type: "مغامرة تاريخية",
    description:
      "تعرّف على تاريخ الجزائر وعلى المجاهدين الذين ضحّوا من أجل تحرير وطننا، ليلة أول نوفمبر 1954.",
    color: "sand",
  },
  {
    id: "ghiras",
    title: "غِراس المواطنة",
    category: "التطوّع والمواطنة",
    type: "مدينة ثلاثية الأبعاد",
    description:
      "تطوّع في حيّك: نظّف، اغرس الأشجار، وساعد غيرك. كل عمل نافع يجعل مدينتك أجمل.",
    color: "mint",
  },
];

function GameCard({ game, index, featured = false }: { game: Game; index: number; featured?: boolean }) {
  const [hovered, setHovered] = useState(false);

  function tilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    card.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    card.style.setProperty("--gx", `${x * 100}%`);
    card.style.setProperty("--gy", `${y * 100}%`);
    card.dataset.tilting = "true";
  }

  function resetTilt(event: PointerEvent<HTMLElement>) {
    const card = event.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    delete card.dataset.tilting;
    setHovered(false);
  }

  return (
    <article
      className={`game-card game-card--${game.color}`}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <Link
        href={`/dashboard/games/${game.id}`}
        prefetch={false}
        className="game-link"
        aria-labelledby={`${game.id}-title`}
      >
        <div className="game-art">
          <GameMedia slug={game.id} playing={hovered || featured} />
          <span className="game-category">{game.category}</span>
          <span className="game-number" aria-hidden="true">
            0{index + 1}
          </span>
          <span className="game-art-label">
            <Icon name="play" />
            العب الآن
          </span>
        </div>
        <div className="game-info">
          <span className="game-type">
            <span className="dot" aria-hidden="true" />
            {game.type}
          </span>
          <h3 id={`${game.id}-title`}>{game.title}</h3>
          <p>{game.description}</p>
          <span className="game-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function GamesPreview() {
  const ref = useParallax<HTMLElement>();
  const mobile = useIsMobile();

  return (
    <section ref={ref} id="games" className="games-section" aria-labelledby="games-title">
      {/* Ordinateur : les cartes sortent de la rivière. Téléphone : anneau 3D qui se swipe. */}
      {mobile ? null : <River />}
      <div className="section-shell games-inner">
        <header className="section-heading" data-reveal>
          <div>
            <p className="section-kicker">
              <Icon name="spark" />
              عالم صغير، اكتشافات كبيرة
            </p>
            <h2 id="games-title">
              ألعاب <span className="outlined-word">تنتظرك</span>
            </h2>
          </div>
        </header>

        {mobile ? (
          <GameCarousel
            items={games}
            getKey={(game) => game.id}
            getLabel={(game) => game.title}
            label="ألعاب ولادز"
            renderItem={(game, { featured }) => (
              <GameCard game={game} index={games.indexOf(game)} featured={featured} />
            )}
          />
        ) : (
          <div className="games-grid">
            {games.map((game, index) => (
              <div key={game.id} className={`game-slot game-slot--${index % 2}`}>
                <div className="game-depth">
                  <GameCard game={game} index={index} />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="preview-note">سجّل الدخول لتلعب وتجمع النقاط وتصعد في لوحة المتصدرين.</p>
      </div>
    </section>
  );
}
