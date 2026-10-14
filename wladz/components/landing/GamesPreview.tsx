"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Icon from "./Icon";
import { useParallax } from "./useParallax";

type Game = {
  id: string;
  title: string;
  category: string;
  type: string;
  description: string;
  color: "sky" | "mint" | "sand" | "rose";
  video?: string;
};

const games: readonly Game[] = [
  {
    id: "game-1",
    title: "فضاء",
    category: "علوم ومغامرة",
    type: "ألعاب مصغّرة",
    description: "فضولك هو البداية. انطلق في رحلة مليئة بالاكتشافات والتحديات!",
    color: "sky",
    video: "/landing/games/fadha.mp4",
  },
  {
    id: "game-2",
    title: "حياة أمين",
    category: "الوقاية",
    type: "ألعاب مصغّرة",
    description: "تعلّم كيف تحمي نفسك، وتتخذ قرارًا سليمًا، وتطلب مساعدة من تثق به.",
    color: "mint",
    video: "/landing/games/hayat-amine.mp4",
  },
  {
    id: "game-3",
    title: "رحلة في تاريخ الجزائر",
    category: "التاريخ",
    type: "مغامرة في عالم مفتوح",
    description: "اكتشف حكايات من وطننا الجميل، وعش مغامرة تجمع المعرفة والاستكشاف.",
    color: "sand",
  },
  {
    id: "game-4",
    title: "أبطال التطوع",
    category: "التطوع",
    type: "ألعاب مصغّرة",
    description: "كل مساعدة تصنع فرقًا. تعاون مع الآخرين واجعل حيّك مكانًا أجمل!",
    color: "rose",
  },
];

const MOBILE_QUERY = "(max-width: 700px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AUTOPLAY_MS = 3200;
const SWIPE_PAUSE_MS = 7000;
const SWIPE_THRESHOLD = 40;

// Outside the component: React 19 forbids impure calls (Date.now) during render.
function now() {
  return Date.now();
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Position of a card relative to the active one, wrapped around the ring.
function ringOffset(index: number, active: number, total: number) {
  const offset = (((index - active) % total) + total) % total;
  return offset > total / 2 ? offset - total : offset;
}

function GameCard({ game, index, featured }: { game: Game; index: number; featured: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const playing = hovered || featured;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0.1;
    }
  }, [playing]);

  function tilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
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
      data-reveal
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <Link
        href="/login"
        prefetch={false}
        className="game-link"
        aria-labelledby={`${game.id}-title`}
      >
        <div className="game-art">
          {game.video ? (
            <video
              ref={videoRef}
              className="game-video"
              src={`${game.video}#t=0.1`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          ) : (
            <Image
              src={`/landing/games/${game.id}.svg`}
              alt=""
              width={800}
              height={500}
              sizes="(max-width: 700px) 82vw, (max-width: 1200px) 46vw, 540px"
            />
          )}
          <span className="game-category">{game.category}</span>
          <span className="game-number" aria-hidden="true">
            0{index + 1}
          </span>
          <span className="game-art-label">
            <Icon name="play" />
            لنكتشف معًا
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
  const gridRef = useRef<HTMLDivElement>(null);
  const carousel = useMediaQuery(MOBILE_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const pausedUntil = useRef(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  // Mobile ring turns on its own while visible, and waits 7 s after a swipe.
  useEffect(() => {
    if (!carousel || reducedMotion || !inView) return;
    const timer = window.setInterval(() => {
      if (now() < pausedUntil.current || document.hidden) return;
      setActive((current) => (current + 1) % games.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [carousel, reducedMotion, inView]);

  function select(index: number) {
    pausedUntil.current = now() + SWIPE_PAUSE_MS;
    setActive(((index % games.length) + games.length) % games.length);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (carousel) swipeStart.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!carousel || !start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    suppressClick.current = true;
    // In RTL the next cards wait on the left: a swipe to the right brings them in.
    select(active + (dx > 0 ? 1 : -1));
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
  }

  return (
    <section
      ref={ref}
      id="games"
      className="games-section section-shell"
      aria-labelledby="games-title"
    >
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
        <p>اختر مغامرتك، أطلق فضولك، وتعلّم شيئًا جديدًا مع كل خطوة.</p>
      </header>

      <div
        ref={gridRef}
        className="games-grid"
        data-carousel={carousel ? "true" : undefined}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        onClickCapture={onClickCapture}
      >
        {games.map((game, index) => {
          const offset = ringOffset(index, active, games.length);
          return (
            <div
              key={game.id}
              className="game-slot"
              data-active={carousel && offset === 0 ? "true" : undefined}
              style={{ "--offset": offset, "--abs": Math.abs(offset) } as CSSProperties}
              onClickCapture={(event) => {
                if (!carousel || offset === 0) return;
                event.preventDefault();
                select(index);
              }}
            >
              <div
                className={`game-depth game-depth--${index % 2}`}
                data-parallax-y={index % 2 === 0 ? -32 : -85}
              >
                <GameCard
                  game={game}
                  index={index}
                  featured={carousel && inView && offset === 0 && !reducedMotion}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="carousel-dots" role="group" aria-label="اختيار اللعبة">
        {games.map((game, index) => (
          <button
            key={game.id}
            type="button"
            aria-label={game.title}
            aria-current={active === index ? "true" : undefined}
            onClick={() => select(index)}
          >
            <span />
          </button>
        ))}
      </div>

      <p className="preview-note">صور وعناوين توضيحية لألعاب قيد التطوير.</p>
    </section>
  );
}
