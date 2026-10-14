// Génère games/_shared/svgIcons.js : les icônes lucide (licence ISC) en chaînes SVG, pour les
// jeux écrits en JavaScript pur (skills, treasures, math) qui n'utilisent pas React.
// Le site n'affiche jamais d'emoji : ces icônes les remplacent.
//
// Usage (depuis wladz/) : node scripts/generate-game-icons.mjs
// Pour ajouter une icône : ajouter son nom lucide (kebab-case) à la liste puis relancer.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const names = [
  "alarm-clock", "amphora", "anchor", "angry", "annoyed", "arrow-left", "arrow-right", "ban",
  "bed", "biceps-flexed", "brush", "gift", "house", "pill", "bird", "book-open", "brain", "brick-wall", "bridge", "bug",
  "building-2", "calendar", "camera", "castle", "chart-column", "check", "cherry", "circle-alert",
  "circle-check", "circle-help", "circle-x", "clipboard-list", "compass", "construction", "crown",
  "dices", "door-open", "drama", "droplet", "droplets", "drum", "ear", "earth", "eye", "fish",
  "fishing-hook", "flag", "flame", "flower", "footprints", "frown", "gamepad-2", "gem", "globe",
  "graduation-cap", "grape", "hand", "hand-fist", "hand-heart", "handshake", "heart",
  "heart-handshake", "hexagon", "history", "image", "info", "key-round", "landmark", "laugh", "leaf",
  "lightbulb", "list-ordered", "lock", "mail", "map", "map-pin", "medal", "megaphone",
  "message-circle", "message-circle-more", "message-square", "moon-star", "mountain", "music",
  "music-2", "newspaper", "notebook-pen", "palette", "party-popper", "paw-print", "person-standing",
  "pointer", "puzzle", "repeat", "repeat-1", "rotate-ccw", "rotate-cw", "route", "sailboat",
  "scale", "school", "scroll", "search", "search-check", "shell", "shield", "shirt", "smartphone",
  "smile", "snowflake", "soup", "sparkle", "sparkles", "speech", "sprout", "star", "sun", "swords",
  "tag", "target", "tent", "timer", "trash-2", "tree-deciduous", "tree-palm", "tree-pine", "trees",
  "trending-up", "triangle-alert", "trophy", "user", "users", "users-round", "volleyball",
  "volume-2", "volume-x", "waves", "wheat", "wind", "x", "zap",
];

const iconsDir = resolve("node_modules/lucide-react/dist/esm/icons");

// Certains noms sont des alias (ex. « smile ») qui réexportent une autre icône.
async function iconData(name) {
  const file = resolve(iconsDir, `${name}.mjs`);
  const iconModule = await import(pathToFileURL(file).href);
  if (iconModule.__iconData) return iconModule.__iconData;
  const target = readFileSync(file, "utf8").match(/from '\.\/(.+)\.mjs'/)?.[1];
  if (!target) throw new Error(`Icône lucide introuvable : ${name}`);
  return iconData(target);
}

const nodes = {};
for (const name of names) {
  // La clé React (« key ») n'est pas un attribut SVG.
  nodes[name] = (await iconData(name)).node.map(([tag, attributes]) => [
    tag,
    Object.fromEntries(Object.entries(attributes).filter(([attribute]) => attribute !== "key")),
  ]);
}

const output = `// Fichier généré par scripts/generate-game-icons.mjs — ne pas modifier à la main.
// Icônes lucide (https://lucide.dev, licence ISC) pour les jeux en JavaScript pur :
// iconSvg("star") renvoie un <svg> de 1em × 1em qui prend la couleur du texte (currentColor).

const NODES = ${JSON.stringify(nodes)};

function attributes(values) {
  return Object.entries(values)
    .map(([name, value]) => \`\${name}="\${value}"\`)
    .join(" ");
}

export function iconSvg(name, { className = "wz-i", strokeWidth = 2, fill = "none", label = "" } = {}) {
  const node = NODES[name];
  if (!node) return "";
  const a11y = label ? \`role="img" aria-label="\${label}"\` : 'aria-hidden="true"';
  const shapes = node.map(([tag, values]) => \`<\${tag} \${attributes(values)}/>\`).join("");
  return \`<svg class="\${className}" width="1em" height="1em" viewBox="0 0 24 24" fill="\${fill}" stroke="currentColor" stroke-width="\${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" \${a11y}>\${shapes}</svg>\`;
}

// Plusieurs icônes côte à côte (illustrations des cartes de درب المهارات).
export function iconRow(names, className = "pic-icon") {
  return names.map((name) => \`<span class="\${className}">\${iconSvg(name)}</span>\`).join("");
}
`;

writeFileSync(resolve("games/_shared/svgIcons.js"), output);
console.log(`games/_shared/svgIcons.js : ${names.length} icônes`);
