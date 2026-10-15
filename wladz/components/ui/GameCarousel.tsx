"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MOBILE_QUERY = "(max-width: 700px)";
const AUTOPLAY_MS = 3200;
const PAUSE_AFTER_SWIPE_MS = 7000;
const SWIPE_THRESHOLD = 40;

export function useMediaQuery(query: string) {
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

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}

// En dehors du composant : React 19 interdit les appels impurs (Date.now) au rendu.
function now() {
  return Date.now();
}

// Position d'une carte par rapport à la carte active, en faisant le tour de l'anneau.
function ringOffset(index: number, active: number, total: number) {
  const offset = (((index - active) % total) + total) % total;
  return offset > total / 2 ? offset - total : offset;
}

export type CarouselState = { active: boolean; featured: boolean };

// Carrousel de cartes de jeux (styles .wz-carousel dans app/ui.css) :
// - téléphone : anneau 3D qui tourne seul ; un swipe passe à la carte suivante dans le sens
//   du geste et met l'autoplay en pause 7 s ;
// - ordinateur (desktop="coverflow") : 3 cartes au premier plan, les 2 suivantes de chaque
//   côté en retrait et estompées, flèches vertes « < » et « > ».
export function GameCarousel<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  desktop = "coverflow",
  label,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T, state: CarouselState) => ReactNode;
  desktop?: "coverflow";
  label: string;
}) {
  const mobile = useIsMobile();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const pausedUntil = useRef(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const total = items.length;
  const mode = mobile ? "ring" : desktop;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // L'anneau du téléphone tourne seul quand il est visible.
  useEffect(() => {
    if (mode !== "ring" || reducedMotion || !inView || total < 2) return;
    const timer = window.setInterval(() => {
      if (now() < pausedUntil.current || document.hidden) return;
      setActive((current) => (current + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [mode, reducedMotion, inView, total]);

  function select(index: number) {
    pausedUntil.current = now() + PAUSE_AFTER_SWIPE_MS;
    setActive(((index % total) + total) % total);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    suppressClick.current = true;
    // En arabe, les cartes suivantes attendent à gauche : un swipe vers la droite les amène.
    select(active + (dx > 0 ? 1 : -1));
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  if (total === 0) return null;

  return (
    <div className="wz-carousel" data-mode={mode} role="group" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={rootRef}
        className="wz-carousel-track"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        onClickCapture={onClickCapture}
      >
        {items.map((item, index) => {
          const offset = total > 1 ? ringOffset(index, active, total) : 0;
          const distance = Math.abs(offset);
          return (
            <div
              key={getKey(item)}
              className="wz-carousel-slot"
              data-distance={Math.min(distance, 3)}
              data-active={offset === 0 ? "true" : undefined}
              aria-hidden={mode === "ring" ? offset !== 0 : distance > 1}
              style={{ "--offset": offset, "--abs": distance } as CSSProperties}
              onClickCapture={(event) => {
                // Toucher une carte de côté l'amène au centre au lieu d'ouvrir le jeu.
                const sideCard = mode === "ring" ? offset !== 0 : distance > 1;
                if (!sideCard) return;
                event.preventDefault();
                event.stopPropagation();
                select(index);
              }}
            >
              {renderItem(item, {
                active: offset === 0,
                featured: mode === "ring" && offset === 0 && inView && !reducedMotion,
              })}
            </div>
          );
        })}
      </div>

      {mode === "coverflow" && total > 1 ? (
        <>
          <button
            type="button"
            className="wz-carousel-arrow wz-carousel-arrow--next"
            aria-label="اللعبة التالية"
            onClick={() => select(active + 1)}
          >
            <ChevronLeft strokeWidth={2.6} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="wz-carousel-arrow wz-carousel-arrow--prev"
            aria-label="اللعبة السابقة"
            onClick={() => select(active - 1)}
          >
            <ChevronRight strokeWidth={2.6} aria-hidden="true" />
          </button>
        </>
      ) : null}

      {total > 1 ? (
        <div className="wz-carousel-dots" role="group" aria-label="اختيار اللعبة">
          {items.map((item, index) => (
            <button
              key={getKey(item)}
              type="button"
              aria-label={getLabel(item)}
              aria-current={active === index ? "true" : undefined}
              onClick={() => select(index)}
            >
              <span />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
