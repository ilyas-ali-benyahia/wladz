import type { GameManifest } from "@/types/game";

export const manifest: GameManifest = {
  slug: "games-2",
  title: { ar: "ساحة الاحترام", fr: "La cour du respect" },
  description: {
    ar: "استكشف ساحة مدرسة ثلاثية الأبعاد، وحلّ 19 قضية عن الاحترام والتعاون والمسؤولية.",
    fr: "Explorez une cour d'école en 3D et résolvez 19 situations sur le respect et la responsabilité.",
  },
  category: "civisme",
  ageRange: { min: 13, max: 17 },
  learningGoals: [
    {
      ar: "أتعرف على السلوك المؤذي وأختار ردًا يحفظ كرامة الجميع.",
      fr: "Reconnaître les comportements blessants et choisir une réponse respectueuse.",
    },
    {
      ar: "أحلل الأدلة قبل الحكم، وأحترم خصوصية الآخرين.",
      fr: "Analyser les faits avant de juger et respecter la vie privée.",
    },
    {
      ar: "أوازن بين ضغط الأصدقاء والعواقب وأطلب مساعدة بالغ موثوق.",
      fr: "Faire face à la pression des pairs et demander l'aide d'un adulte de confiance.",
    },
  ],
  estimatedMinutes: 18,
  maxPointsPerRun: 20,
  thumbnail: "/games/games-2/thumbnail.webp",
  team: "game:games-2",
  status: "en-developpement",
};
