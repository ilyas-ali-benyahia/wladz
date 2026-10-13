import type { GameManifest } from "@/types/game";

// Données pures : pas de "use client", pas d'import React ni de composant.
export const manifest: GameManifest = {
  slug: "_template",
  title: { ar: "لعبة نموذجية", fr: "Jeu modèle" },
  description: {
    ar: "مثال قصير يوضّح كيف تُبنى لعبة داخل منصة ولادز.",
    fr: "Exemple court montrant comment brancher un jeu sur le hub WLADZ.",
  },
  category: "valeurs",
  ageRange: { min: 7, max: 12 },
  learningGoals: [
    {
      ar: "أرفض كل شيء مجهول يعرضه عليّ غريب وأخبر والديّ.",
      fr: "Refuser ce qu'un inconnu propose et en parler à ses parents.",
    },
  ],
  estimatedMinutes: 2,
  maxPointsPerRun: 20,
  thumbnail: "/games/_template/thumbnail.webp",
  team: "hub-core",
  status: "en-developpement",
};
