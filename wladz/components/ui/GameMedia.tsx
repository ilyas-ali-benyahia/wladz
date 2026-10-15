"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { GameIcon, gameArtFor } from "@/components/ui/GameIcon";

// Jeux qui ont un trailer dans public/trailers/<slug>.mp4 (image de couverture <slug>.jpg).
// Pour en ajouter un : exporter la vidéo en 720p sans son, puis ajouter le slug ici.
const trailers = new Set(["amine", "space", "ghiras", "treasures", "mujahideen", "salati", "math"]);

export function hasTrailer(slug: string) {
  return trailers.has(slug);
}

// Image d'une carte de jeu : le trailer (lu en boucle quand `playing` est vrai) ou, sans
// trailer, une illustration avec l'icône du jeu.
export function GameMedia({
  slug,
  playing,
  className = "",
}: {
  slug: string;
  playing: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trailer = hasTrailer(slug);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [playing]);

  if (trailer) {
    return (
      <video
        ref={videoRef}
        className={`wz-media ${className}`}
        src={`/trailers/${slug}.mp4`}
        poster={`/trailers/${slug}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
    );
  }

  const { tone } = gameArtFor(slug);
  return (
    <span
      className={`wz-media wz-media--art ${className}`}
      style={{ "--tone": tone } as CSSProperties}
      aria-hidden="true"
    >
      <GameIcon slug={slug} size="xl" className="wz-bob" />
    </span>
  );
}
