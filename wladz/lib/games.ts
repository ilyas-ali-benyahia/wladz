export type Game = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  // Partie courte, listée dans « ألعاب سريعة ».
  quick?: boolean;
};

export const games: Game[] = [
  {
    slug: "space",
    title: "الرائد الصغير — رحلة إلى الفضاء",
    description: "انظر عبر التلسكوب السحري واكتشف أسرار الشمس والكواكب والنجوم.",
    emoji: "🚀",
  },
  {
    slug: "choices",
    title: "قرارات الأبطال",
    description: "مواقف من الحياة اليومية: اختر ما ستفعله وتعلّم كيف تحمي نفسك وتقول «لا».",
    emoji: "🦸",
  },
  {
    slug: "amine",
    title: "أمين: طريق الحياة",
    description: "عِش حياة أمين في حومة جزائرية: كل قرار يغيّر طريقه، و72 نهاية مختلفة تنتظرك.",
    emoji: "🧒",
  },
  {
    slug: "treasures",
    title: "كنوز الجزائر",
    description: "رحلة عبر ولايات الجزائر الـ 58: معالم وتراث وتاريخ، مرحلة بعد مرحلة.",
    emoji: "🏺",
  },
  {
    slug: "skills",
    title: "درب المهارات",
    description: "ست محطات للمهارات الحياتية: بطاقات تتعلّم منها وتحدّيات تختبر قراراتك.",
    emoji: "🧭",
  },
  {
    slug: "math",
    title: "احسب وصوّب",
    description: "احسب العملية بسرعة وصوّب نحو الروبوت الذي يحمل الجواب الصحيح.",
    emoji: "🎯",
  },
  {
    slug: "myths",
    title: "حقيقة أم خرافة؟",
    description: "اكشف المعلومات الخاطئة عن التدخين والمخدرات بطاقةً بعد بطاقة.",
    emoji: "🕵️",
    quick: true,
  },
];

export function findGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
