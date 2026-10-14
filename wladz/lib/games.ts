export type Game = {
  slug: string;
  title: string;
  description: string;
  // Partie courte, listée dans « ألعاب سريعة ».
  quick?: boolean;
};

export const games: Game[] = [
  {
    slug: "space",
    title: "الرائد الصغير — رحلة إلى الفضاء",
    description: "انظر عبر التلسكوب السحري واكتشف أسرار الشمس والكواكب والنجوم.",
  },
  {
    slug: "choices",
    title: "قرارات الأبطال",
    description: "مواقف من الحياة اليومية: اختر ما ستفعله وتعلّم كيف تحمي نفسك وتقول «لا».",
  },
  {
    slug: "ghiras",
    title: "غِراس المواطنة",
    description: "مدينة ثلاثية الأبعاد: نظّف حيّك، اغرس الأشجار، ساعد غيرك، وتعلّم قيم المواطنة.",
    emoji: "🌱",
  },
  {
    slug: "amine",
    title: "أمين: طريق الحياة",
    description: "عِش حياة أمين في حومة جزائرية: كل قرار يغيّر طريقه، و72 نهاية مختلفة تنتظرك.",
  },
  {
    slug: "treasures",
    title: "كنوز الجزائر",
    description: "رحلة عبر ولايات الجزائر الـ 58: معالم وتراث وتاريخ، مرحلة بعد مرحلة.",
  },
  {
    slug: "salati",
    title: "صلاتي",
    description: "تعلّم حركات الصلاة وترتيبها خطوة بخطوة في مسجد ثلاثي الأبعاد، مع أسئلة قصيرة عن الأذكار.",
    emoji: "🕌",
  },
  {
    slug: "skills",
    title: "درب المهارات",
    description: "ست محطات للمهارات الحياتية: بطاقات تتعلّم منها وتحدّيات تختبر قراراتك.",
  },
  {
    slug: "math",
    title: "احسب وصوّب",
    description: "احسب العملية بسرعة وصوّب نحو الروبوت الذي يحمل الجواب الصحيح.",
  },
  {
    slug: "myths",
    title: "حقيقة أم خرافة؟",
    description: "اكشف المعلومات الخاطئة عن التدخين والمخدرات بطاقةً بعد بطاقة.",
    quick: true,
  },
];

export function findGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
