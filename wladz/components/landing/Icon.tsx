import type { CSSProperties } from "react";

export type IconName = "arrow" | "spark" | "play" | "shield" | "heart" | "compass" | "book" | "leaf" | "flag" | "user" | "route" | "trophy" | "rocket";

const paths: Record<Exclude<IconName, "spark">, string> = {
  arrow: "M19 12H5m6-6-6 6 6 6",
  play: "m9 5 10 7-10 7V5Z",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  compass: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-5-4-3 5-5 3 3-5 5-3Z",
  book: "M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z",
  leaf: "M20 3C8 2 2 9 5 16s15 6 15-13ZM4 21 15 10",
  flag: "M5 21V3m0 1c5-5 9 5 15 0v11c-6 5-10-5-15 0",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2M19 5h4m-2-2v4",
  route: "M5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm14 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9",
  trophy: "M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3c0 3 2 4 5 4m9-7h4v3c0 3-2 4-5 4m-4 3v6m-5 0h10",
  rocket: "M9 15 5 11C8 5 14 2 21 3c1 7-2 13-8 16l-4-4ZM9 6H4l-2 6 5-1m11 4v5l-6 2 1-5M6 16l-3 5 5-3M16 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
};

export default function Icon({ name, className, style }: { name: IconName; className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "spark" ? <path d="m12 1 2.8 7.6L23 12l-8.2 3.4L12 23l-2.8-7.6L1 12l8.2-3.4L12 1Z" fill="currentColor" stroke="none" /> : <path d={paths[name]} />}
  </svg>;
}
