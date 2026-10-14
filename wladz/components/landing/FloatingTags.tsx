import type { CSSProperties } from "react";
import Icon, { type IconName } from "./Icon";

const tags: { text: string; icon: IconName }[] = [
  { text: "#الوقاية", icon: "shield" }, { text: "#المهارات", icon: "heart" },
  { text: "#التاريخ", icon: "book" }, { text: "#الرياضيات", icon: "leaf" },
  { text: "#العلوم", icon: "compass" }, { text: "#المواطنة", icon: "flag" },
];

export default function FloatingTags() {
  return <div className="floating-tags" aria-label="مواضيع المغامرات">
    {tags.map((tag, index) => <div key={tag.text} className={`tag-position tag-position--${index + 1}`} data-parallax-y={-(65 + index * 22)} data-parallax-x={index < 3 ? 40 : -40}>
      <span className="floating-tag" style={{ "--tag-tilt": `${[9, -7, 5, -8, 8, -5][index]}deg`, "--float-delay": `${-index * 1.2}s` } as CSSProperties}><Icon name={tag.icon} />{tag.text}</span>
    </div>)}
  </div>;
}
