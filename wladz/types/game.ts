// Contrat partagé entre le hub WLADZ et chaque jeu (voir WLADZ_TEAM_PROMPT.md §6).
// Propriétaire : groupe Hub & Core. Toute modification doit être annoncée dans CRITICAL_CHANGES.md.

export type GameCategory =
  | "prevention" // drogues, addictions, dangers du quotidien
  | "civisme" // comportement, respect, citoyenneté
  | "histoire" // histoire de l'Algérie
  | "culture" // patrimoine, traditions, géographie
  | "valeurs"; // valeurs islamiques et morales

export type LocalizedText = {
  ar: string;
  fr?: string;
};

export type GameStatus = "en-developpement" | "pret";

// Plafond commun : aucun jeu ne peut donner plus de points en une partie.
export const MAX_POINTS_PER_RUN = 100;

export interface GameManifest {
  slug: string; // = nom du dossier app/dashboard/games/<slug>, kebab-case ASCII
  title: LocalizedText;
  description: LocalizedText; // 1 à 2 phrases, affichées sur la carte du hub
  category: GameCategory;
  ageRange: { min: number; max: number };
  learningGoals: LocalizedText[]; // affichés sur l'écran de résultat du hub
  estimatedMinutes: number;
  maxPointsPerRun: number; // entier, 1..MAX_POINTS_PER_RUN, borné côté serveur
  thumbnail: string; // "/games/<slug>/thumbnail.webp"
  team: string;
  status: GameStatus;
}

export interface GamePlayer {
  firstName: string;
  age: number;
}

export interface GameResult {
  score: number; // score interne au jeu, libre
  pointsEarned: number; // entier, 0..manifest.maxPointsPerRun
  completed: boolean;
  durationMs: number;
}

export interface GameProps {
  player: GamePlayer;
  onFinish: (result: GameResult) => void; // appelé une seule fois par partie
  onExit: () => void;
}
