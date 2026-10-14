import missions from "@/games/ghiras/engine/data/missions.json";

export const ghirasGameSlug = "ghiras";

// Victoires reconnues par le serveur : les missions du jeu (missions.json) et les étapes
// des activités (engine/systems/activities/*). Chacune rapporte 1 point, une seule fois.
export const ghirasMissionIds = new Set(
  (Array.isArray(missions) ? missions : (missions as { missions: { id: string }[] }).missions).map(
    (mission: { id: string }) => mission.id,
  ),
);

export const ghirasStageIds = new Set(
  Object.entries({
    firstaid: ["call", "cut", "burn", "safety"],
    museum: ["tour", "memory", "explorer"],
    recycling: ["learn", "speed", "campaign"],
    driving: ["rules", "calm", "crossing", "parking"],
    football: ["control", "cones", "passing", "shooting", "penalties", "course", "match"],
    swimming: ["entry", "float", "buoys", "distance", "flags", "rescue"],
  }).flatMap(([activity, stages]) => stages.map((stage) => `${activity}.${stage}`)),
);

export const ghirasTotalWins = ghirasMissionIds.size + ghirasStageIds.size;
