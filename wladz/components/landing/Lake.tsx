// Surface du lac (section « لماذا ولادز » et pied de page) : lignes de vagues blanches qui
// ondulent et se décalent au scroll (parallax de la section, attributs data-parallax-*).
const WAVE = "M0 20 Q 25 6 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20 T 400 20";

const rows = [
  { top: "14%", x: -60, width: "62%", start: "-6%", opacity: 0.55 },
  { top: "31%", x: 70, width: "48%", start: "58%", opacity: 0.45 },
  { top: "52%", x: -40, width: "70%", start: "20%", opacity: 0.4 },
  { top: "71%", x: 55, width: "56%", start: "-10%", opacity: 0.5 },
  { top: "88%", x: -70, width: "64%", start: "44%", opacity: 0.45 },
];

export default function Lake({ deep = false }: { deep?: boolean }) {
  return (
    <div className={`lake ${deep ? "lake--deep" : ""}`} aria-hidden="true">
      {rows.map((row, index) => (
        <div
          key={index}
          className="lake-wave"
          data-parallax-x={row.x}
          style={{ top: row.top, insetInlineStart: row.start, width: row.width, opacity: row.opacity }}
        >
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ animationDelay: `${index * -1.3}s` }}>
            <path d={WAVE} />
          </svg>
        </div>
      ))}
    </div>
  );
}
