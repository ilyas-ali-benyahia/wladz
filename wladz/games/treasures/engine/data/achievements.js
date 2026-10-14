// قائمة إنجازات مستكشف كنوز الجزائر
export const ACHIEVEMENTS_DATA = [
  {
    id: "first_step",
    title: "الخطوة الأولى",
    description: "أجب عن أول مرحلة صحيحة في اللعبة",
    icon: "🌱",
    rewardCoins: 50,
    rewardGems: 1,
    check: (state) => state.stats.totalSolved >= 1
  },
  {
    id: "sahara_explorer",
    title: "خبير الصحراء وتوات",
    description: "أكمل جميع مراحل ولاية أدرار الـ 8",
    icon: "🏜️",
    rewardCoins: 150,
    rewardGems: 5,
    check: (state) => state.completedWilayas.includes(1)
  },
  {
    id: "star_collector_10",
    title: "جامع النجوم الفضي",
    description: "اجمع 10 نجوم من مختلف المراحل",
    icon: "⭐",
    rewardCoins: 100,
    rewardGems: 2,
    check: (state) => state.totalStars >= 10
  },
  {
    id: "star_collector_30",
    title: "جامع النجوم الذهبي",
    description: "اجمع 30 نجمة من رحلتك عبر الولايات",
    icon: "🌟",
    rewardCoins: 250,
    rewardGems: 6,
    check: (state) => state.totalStars >= 30
  },
  {
    id: "quiz_master",
    title: "نابغة التراث الجزائري",
    description: "حل 10 أسئلة متتالية دون استخدام أي تلميح",
    icon: "🧠",
    rewardCoins: 200,
    rewardGems: 4,
    check: (state) => state.stats.perfectStreak >= 10
  },
  {
    id: "wilayas_5",
    title: "سفير الولايات الخمس",
    description: "افتح وأكمل 5 ولايات جزائرية",
    icon: "🗺️",
    rewardCoins: 300,
    rewardGems: 10,
    check: (state) => state.completedWilayas.length >= 5
  }
];
