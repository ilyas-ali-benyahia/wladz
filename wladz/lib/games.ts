export type Game = {
  slug: string;
  title: string;
  description: string;
  // Partie courte, listée dans « ألعاب سريعة ».
  quick?: boolean;
  // Jeu principal de l'application : lien à part dans la barre latérale, absent des listes.
  featured?: boolean;
  // Titre affiché avec le prénom de l'enfant connecté : « <prénom>: <playerTitle> ».
  playerTitle?: string;
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
  },
  {
    slug: "amine",
    title: "أمين: طريق الحياة",
    description: "عِش حياة أمين في حومة جزائرية: كل قرار يغيّر طريقه، و72 نهاية مختلفة تنتظرك.",
    featured: true,
    playerTitle: "طريق الحياة",
  },
  {
    slug: "treasures",
    title: "كنوز الجزائر",
    description: "رحلة عبر ولايات الجزائر الـ 58: معالم وتراث وتاريخ، مرحلة بعد مرحلة.",
  },
  {
    slug: "mujahideen",
    title: "المجاهدون الستة",
    description: "ليلة أول نوفمبر 1954: قُد القادة الستة عبر جبال الأوراس وأجب عن أسئلة حولهم لتفتح الطريق.",
  },
  {
    slug: "salati",
    title: "صلاتي",
    description: "تعلّم حركات الصلاة وترتيبها خطوة بخطوة في مسجد ثلاثي الأبعاد، مع أسئلة قصيرة عن الأذكار.",
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

// Titre du jeu pour l'enfant connecté (« ياسمين: طريق الحياة »), sinon le titre habituel.
export function gameTitle(game: Pick<Game, "title" | "playerTitle">, firstName: string) {
  return game.playerTitle && firstName ? `${firstName}: ${game.playerTitle}` : game.title;
}

export const featuredGame = games.find((game) => game.featured)!;
