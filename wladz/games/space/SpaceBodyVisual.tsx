import type { SpaceBody } from "@/games/space/data";

const starDots = [
  { top: "12%", left: "20%", size: 9 },
  { top: "30%", left: "68%", size: 13 },
  { top: "58%", left: "30%", size: 11 },
  { top: "70%", left: "72%", size: 7 },
  { top: "44%", left: "48%", size: 16 },
  { top: "16%", left: "52%", size: 6 },
];

export function SpaceBodyVisual({ body, scale = 1 }: { body: SpaceBody; scale?: number }) {
  const size = body.size * scale;

  if (body.kind === "stars") {
    return (
      <div aria-hidden="true" className="relative" style={{ width: size, height: size }}>
        {starDots.map((dot, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-white motion-safe:animate-pulse"
            style={{
              top: dot.top,
              left: dot.left,
              width: dot.size * scale,
              height: dot.size * scale,
              boxShadow: "0 0 12px 3px rgba(255,255,255,.75)",
              animationDelay: `${index * -0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="relative" style={{ width: size, height: size }}>
      <div
        className="size-full rounded-full"
        style={{
          background: body.background,
          filter: body.kind === "nebula" ? "blur(5px)" : undefined,
          boxShadow:
            body.kind === "nebula"
              ? `0 0 34px 8px ${body.glow}55`
              : `inset ${-size * 0.12}px ${-size * 0.12}px ${size * 0.28}px rgba(0,0,0,.45), 0 0 ${size * 0.4}px ${body.glow}88`,
        }}
      />
      {body.ring ? (
        <div
          className="absolute rounded-[50%]"
          style={{
            top: "32%",
            left: "-38%",
            width: "176%",
            height: "36%",
            border: `${Math.max(3, size * 0.07)}px solid rgba(240,214,150,.85)`,
            transform: "rotate(-16deg)",
          }}
        />
      ) : null}
    </div>
  );
}
