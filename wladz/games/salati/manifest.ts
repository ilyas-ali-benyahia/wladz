import type { GameManifest } from "@/types/game";

// Pure data: no "use client", no React import.
export const manifest: GameManifest = {
  slug: "salati",
  title: { ar: "مدرب الصلاة الذكي" },
  description: {
    ar: "تعلّم حركات الصلاة وترتيبها خطوة بخطوة، مع محاكاة ثلاثية الأبعاد وأسئلة قصيرة عن الأذكار.",
  },
  category: "valeurs",
  ageRange: { min: 7, max: 14 },
  learningGoals: [
    { ar: "أتعلّم ترتيب حركات الصلاة من التكبير إلى التسليم." },
    { ar: "أعرف الأذكار التي تُقال في الركوع والسجود والتشهد." },
    { ar: "أسأل معلّمي ووالديّ عن كل ما لا أعرفه من هيئات الصلاة." },
  ],
  estimatedMinutes: 8,
  maxPointsPerRun: 30,
  thumbnail: "/games/salati/thumbnail.webp",
  team: "game:salati",
  status: "en-developpement",
};
