// قائمة ولايات الجزائر الـ 58 مع الهوية البصرية والأوسمة الخاصة
export const WILAYAS_DATA = [
  {
    id: 1,
    code: "01",
    name: "أدرار",
    region: "الجنوب الغربي",
    colorPrimary: "#d97706",
    colorSecondary: "#b45309",
    colorBg: "linear-gradient(135deg, #78350f, #b45309)",
    accent: "#fbbf24",
    badge: {
      name: "وسام واحات توات الحكيمة",
      icon: "🏜️",
      title: "حارس الفقارات وقصور الطين",
      description: "مُنح لاكتشاف أسرار قصور أدرار ونظام الفقارات الفريد"
    },
    famousFor: "قصور تيميمون الحمراء، نظام الفقارات المائي العريق، زاوية الشيخ سيدي محمد بلكبير",
    totalStages: 8
  },
  {
    id: 2,
    code: "02",
    name: "الشلف",
    region: "الوسط الغربي",
    colorPrimary: "#059669",
    colorSecondary: "#047857",
    colorBg: "linear-gradient(135deg, #064e3b, #047857)",
    accent: "#34d399",
    badge: {
      name: "وسام الونشريس الخالد",
      icon: "⛰️",
      title: "صامد وادي الشلف",
      description: "مُنح لفتح معالم الونشريس وتنس الفينيقية"
    },
    famousFor: "مدينة تنس الأثرية، جبال الونشريس، وسواحل الميناء الجميل",
    totalStages: 6
  },
  {
    id: 3,
    code: "03",
    name: "الأغواط",
    region: "الهضاب وبوابة الصحراء",
    colorPrimary: "#ea580c",
    colorSecondary: "#c2410c",
    colorBg: "linear-gradient(135deg, #7c2d12, #c2410c)",
    accent: "#fb923c",
    badge: {
      name: "وسام واحة الأطلس الصحراوي",
      icon: "🌴",
      title: "فارس الأغواط العريقة",
      description: "مُنح لاجتياز قصر كاف سيدي بوزيد وتراث الجلفة والأغواط"
    },
    famousFor: "بساتين النخيل، القصور العتيقة، سد سكلافة",
    totalStages: 6
  },
  {
    id: 4,
    code: "04",
    name: "أم البواقي",
    region: "الشرق الجزائري",
    colorPrimary: "#0284c7",
    colorSecondary: "#0369a1",
    colorBg: "linear-gradient(135deg, #0c4a6e, #0369a1)",
    accent: "#38bdf8",
    badge: {
      name: "وسام قلاع الشاوية الحرة",
      icon: "🦅",
      title: "نسر الأوراس والسباخ",
      description: "مُنح للتعرف على آثار سيقوس ومسقط رأس البواسل"
    },
    famousFor: "قلاع الأوراس، آثار سيقوس، السباخ الطبيعية الرائعة",
    totalStages: 6
  },
  {
    id: 5,
    code: "05",
    name: "باتنة",
    region: "الأوراس",
    colorPrimary: "#b91c1c",
    colorSecondary: "#991b1b",
    colorBg: "linear-gradient(135deg, #7f1d1d, #991b1b)",
    accent: "#f87171",
    badge: {
      name: "وسام إمدغاسن وتيمقاد",
      icon: "🏛️",
      title: "مستكشف معالم الأوراس",
      description: "مُنح لاستكشاف ضريح إمدغاسن النوميدي ومدينة تيمقاد الرومانية"
    },
    famousFor: "تيمقاد، ضريح إمدغاسن، شرفات غوفي، مهد الثورة التحريرية",
    totalStages: 6
  },
  {
    id: 6,
    code: "06",
    name: "بجاية",
    region: "القبائل الصغرى",
    colorPrimary: "#0d9488",
    colorSecondary: "#0f766e",
    colorBg: "linear-gradient(135deg, #134e4a, #0f766e)",
    accent: "#2dd4bf",
    badge: {
      name: "وسام لؤلؤة الناصرية ويما قورايا",
      icon: "🌊",
      title: "حارس منارة كاب كربون",
      description: "مُنح لتسلق قمة يما قورايا واكتشاف عاصمة الحماديين"
    },
    famousFor: "جبل يما قورايا، رأس كربون، قلعة بني حماد التاريخية، زيت الزيتون الصافي",
    totalStages: 6
  },
  {
    id: 7,
    code: "07",
    name: "بسكرة",
    region: "الزيبان",
    colorPrimary: "#d97706",
    colorSecondary: "#b45309",
    colorBg: "linear-gradient(135deg, #78350f, #b45309)",
    accent: "#fde047",
    badge: {
      name: "وسام دقلة نور الذهبية",
      icon: "🍯",
      title: "سلطان عروس الزيبان",
      description: "مُنح لاكتشاف واحات بسكرة وأطباق الدوبارة الشهية"
    },
    famousFor: "دقلة نور الشهيرة عالمياً، الدوبارة البسكرية، مضايق خنقة سيدي ناجي",
    totalStages: 6
  },
  {
    id: 8,
    code: "08",
    name: "بشار",
    region: "الساورة",
    colorPrimary: "#c2410c",
    colorSecondary: "#9a3412",
    colorBg: "linear-gradient(135deg, #7c2d12, #9a3412)",
    accent: "#fb923c",
    badge: {
      name: "وسام كثبان الساورة الشامخة",
      icon: "🐪",
      title: "رحالة وادي الساورة",
      description: "مُنح لفتح أسرار تاغيت وكثبان الرمال الذهبية"
    },
    famousFor: "واحة تاغيت، النقوش الصخرية القديمة، رقصة القناوة والمايا",
    totalStages: 6
  },
  {
    id: 9,
    code: "09",
    name: "البليدة",
    region: "السهول والميتيجة",
    colorPrimary: "#16a34a",
    colorSecondary: "#15803d",
    colorBg: "linear-gradient(135deg, #14532d, #15803d)",
    accent: "#4ade80",
    badge: {
      name: "وسام مدينة الورود والشريعة",
      icon: "🌹",
      title: "صديق أرز الشريعة",
      description: "مُنح لعبور قمم الشريعة وبساتين البرتقال والورود"
    },
    famousFor: "حدائق الورود، حظيرة الشريعة الوطنية، بوقرة وحلويات الميتيجة",
    totalStages: 6
  },
  {
    id: 10,
    code: "10",
    name: "البويرة",
    region: "الوسط",
    colorPrimary: "#2563eb",
    colorSecondary: "#1d4ed8",
    colorBg: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    accent: "#60a5fa",
    badge: {
      name: "وسام ثلوج تيكجدة وجرجرة",
      icon: "❄️",
      title: "متسلق قمم تيكجدة",
      description: "مُنح لاستكشاف منتجع تيكجدة وغابات الأرز الباسقة"
    },
    famousFor: "منتجع تيكجدة للتزلج، قمم لالة خديجة، عسل السدر والزيتون",
    totalStages: 6
  },
  {
    id: 11,
    code: "11",
    name: "تمنراست",
    region: "الجنوب الكبير",
    colorPrimary: "#4338ca",
    colorSecondary: "#3730a3",
    colorBg: "linear-gradient(135deg, #312e81, #3730a3)",
    accent: "#818cf8",
    badge: {
      name: "وسام قمم الهقار والأسكرام",
      icon: "🌌",
      title: "أمير صحراء التوارق",
      description: "مُنح لمشاهدة أجمل شروق شمس من هضبة الأسكرام بالهقار"
    },
    famousFor: "هضبة الأسكرام، ضريح تين هينان، التراث التارقي الأصيل، شاي الصحراء",
    totalStages: 6
  },
  {
    id: 12,
    code: "12",
    name: "تبسة",
    region: "الشرق الجزائري",
    colorPrimary: "#b45309",
    colorSecondary: "#92400e",
    colorBg: "linear-gradient(135deg, #78350f, #92400e)",
    accent: "#f59e0b",
    badge: {
      name: "وسام سور كاراكلا والأمفيثياتر",
      icon: "🛡️",
      title: "حارس ثغور تيفست القديمة",
      description: "مُنح لفتح باب كاراكلا الروماني ومعالم تبسة العريقة"
    },
    famousFor: "قوس كاراكلا، السور البيزنطي، البازيليك المسيحية، مناجم الونزة",
    totalStages: 6
  },
  {
    id: 13,
    code: "13",
    name: "تلمسان",
    region: "الغرب الجزائري",
    colorPrimary: "#7c3aed",
    colorSecondary: "#6d28d9",
    colorBg: "linear-gradient(135deg, #5b21b6, #6d28d9)",
    accent: "#c084fc",
    badge: {
      name: "وسام الشدة التلمسانية والمنصورة",
      icon: "👑",
      title: "فارس عاصمة الزيانيين",
      description: "مُنح لاكتشاف صومعة المنصورة وتراث الحياكة والشدة الملكية"
    },
    famousFor: "صومعة المنصورة، مغارات بني عاد، الشدة التلمسانية المصنفة عالمياً، قصر المشور",
    totalStages: 6
  },
  {
    id: 14,
    code: "14",
    name: "تيارت",
    region: "الهضاب العليا الغربية",
    colorPrimary: "#a16207",
    colorSecondary: "#854d0e",
    colorBg: "linear-gradient(135deg, #713f12, #854d0e)",
    accent: "#eab308",
    badge: {
      name: "وسام الجواد العربي وأجدار تاهرت",
      icon: "🐎",
      title: "فارس تاهرت الرستمية",
      description: "مُنح لمعرفة تاريخ الدولة الرستمية والأحصنة العربية الأصيلة بشاوشاوة"
    },
    famousFor: "مركز شاوشاوة لتربية الخيول، أهرامات الأجدار النوميدية، آثار تاهرت",
    totalStages: 6
  },
  {
    id: 15,
    code: "15",
    name: "تيزي وزو",
    region: "القبائل الكبرى",
    colorPrimary: "#059669",
    colorSecondary: "#047857",
    colorBg: "linear-gradient(135deg, #064e3b, #047857)",
    accent: "#34d399",
    badge: {
      name: "وسام الفضة الأمازيغية وجرجرة",
      icon: "💍",
      title: "حارس تقاليد بني يني",
      description: "مُنح لإتقان صناعة الفضة المرجانية والجبة القبائلية وتراث جرجرة"
    },
    famousFor: "صناعة الحلي الفضية في بني يني، حظيرة جرجرة، الزليج الفخاري في معاتقة",
    totalStages: 6
  },
  {
    id: 16,
    code: "16",
    name: "الجزائر العاصمة",
    region: "الوسط والعاصمة",
    colorPrimary: "#0284c7",
    colorSecondary: "#0369a1",
    colorBg: "linear-gradient(135deg, #075985, #0369a1)",
    accent: "#38bdf8",
    badge: {
      name: "وسام البهجة ومقام الشهيد",
      icon: "🕊️",
      title: "سفير المحروسة وقصبة الأصالة",
      description: "مُنح للتجول في أزقة القصبة العتيقة وتكريم شهداء الجزائر الشرفاء"
    },
    famousFor: "قصبة الجزائر المصنفة يونسكو، مقام الشهيد، جامع الجزائر الأعظم، الكاراكو العاصمي",
    totalStages: 8
  },
  {
    id: 17,
    code: "17",
    name: "الجلفة",
    region: "السهوب والهضاب",
    colorPrimary: "#d97706",
    colorSecondary: "#b45309",
    colorBg: "linear-gradient(135deg, #78350f, #b45309)",
    accent: "#fbbf24",
    badge: {
      name: "وسام كبش أولاد جلال وحجر الملح",
      icon: "🐑",
      title: "رائد سهوب الصوان",
      description: "مُنح لاكتشاف نقوش زكار الحجرية وجبل حجر الملح العجيب"
    },
    famousFor: "سلالة أولاد جلال، جبل الملح، نقوش زكار ما قبل التاريخ، البرنوس الجلفاوي",
    totalStages: 6
  },
  {
    id: 18,
    code: "18",
    name: "جيجل",
    region: "الساحل الشرقي",
    colorPrimary: "#0284c7",
    colorSecondary: "#0f766e",
    colorBg: "linear-gradient(135deg, #0c4a6e, #0f766e)",
    accent: "#38bdf8",
    badge: {
      name: "وسام الكهوف العجيبة والكورنيش",
      icon: "🌊",
      title: "مستكشف الكورنيش الجيجلي",
      description: "مُنح لفتح أسرار الكهوف العجيبة وغابات الحظيرة الوطنية لتازة"
    },
    famousFor: "الكورنيش الصخري الساحر، الكهوف العجيبة، حظيرة تازة، شواطئ العوانة وزيامة",
    totalStages: 6
  },
  {
    id: 19,
    code: "19",
    name: "سطيف",
    region: "الهضاب العليا الشرقية",
    colorPrimary: "#2563eb",
    colorSecondary: "#1d4ed8",
    colorBg: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    accent: "#60a5fa",
    badge: {
      name: "وسام عين الفوارة وجميلة",
      icon: "⛲",
      title: "حكيم عاصمة الهضاب العليا",
      description: "مُنح لشرب ماء عين الفوارة وزيارة آثار كويكول (جميلة) الخالدة"
    },
    famousFor: "تمثال عين الفوارة، مدينة جميلة الرومانية المصنفة يونسكو، القمح الذهبي",
    totalStages: 6
  },
  {
    id: 20,
    code: "20",
    name: "سعيدة",
    region: "الهضاب الغربية",
    colorPrimary: "#059669",
    colorSecondary: "#047857",
    colorBg: "linear-gradient(135deg, #064e3b, #047857)",
    accent: "#34d399",
    badge: {
      name: "وسام ينابيع المياه المعدنية النقية",
      icon: "💧",
      title: "صديق منابع سعيدة العذبة",
      description: "مُنح لزيارة شلالات تيفريت وينابيع حمام ربي المعدنية"
    },
    famousFor: "مياه سعيدة المعدنية الشهيرة، شلالات تيفريت الطبيعية، الفلكلور والرقص البدوي",
    totalStages: 6
  },
  {
    id: 21,
    code: "21",
    name: "سكيكدة",
    region: "الساحل الشرقي",
    colorPrimary: "#0284c7",
    colorSecondary: "#0369a1",
    colorBg: "linear-gradient(135deg, #075985, #0369a1)",
    accent: "#38bdf8",
    badge: {
      name: "وسام روسيكادا وفراولة القل",
      icon: "🍓",
      title: "ربان خليج ستورا",
      description: "مُنح لتذوق فراولة سكيكدة وزيارة المسرح الروماني بروسيكادا"
    },
    famousFor: "فراولة سكيكدة الشهيرة، شواطئ القل الخلابة، المسرح الروماني التاريخي",
    totalStages: 6
  },
  {
    id: 22,
    code: "22",
    name: "سيدي بلعباس",
    region: "الغرب الجزائري",
    colorPrimary: "#16a34a",
    colorSecondary: "#15803d",
    colorBg: "linear-gradient(135deg, #14532d, #15803d)",
    accent: "#4ade80",
    badge: {
      name: "وسام بحيرة سيدي امحمد بن علي",
      icon: "🌾",
      title: "فارس بساتين مكرة",
      description: "مُنح لاكتشاف وادي مكرة وبحيرة سيدي امحمد بن علي وموسيقى الراي الأصيلة"
    },
    famousFor: "بحيرة سيدي امحمد بن علي، بساتين الحبوب، الفنون الشعبية والغناء التراثي",
    totalStages: 6
  },
  {
    id: 23,
    code: "23",
    name: "عنابة",
    region: "الشرق الساحلي",
    colorPrimary: "#0891b2",
    colorSecondary: "#0e7490",
    colorBg: "linear-gradient(135deg, #155e75, #0e7490)",
    accent: "#22d3ee",
    badge: {
      name: "وسام بونة وسيدة إيبون",
      icon: "⛵",
      title: "أمير خليج عنابة الجميل",
      description: "مُنح لزيارة هضبة القديس أوغسطين وشواطئ سرايدي وجبل إيدوغ"
    },
    famousFor: "كنيسة القديس أوغسطين، غابات سرايدي، شواطئ شطايبي، البوراك العنابي المميز",
    totalStages: 6
  },
  {
    id: 24,
    code: "24",
    name: "قالمة",
    region: "الشرق الجزائري",
    colorPrimary: "#0d9488",
    colorSecondary: "#0f766e",
    colorBg: "linear-gradient(135deg, #134e4a, #0f766e)",
    accent: "#2dd4bf",
    badge: {
      name: "وسام حمام دباغ الشلال المتكلس",
      icon: "♨️",
      title: "مستكشف ينابيع كالاتا الحارة",
      description: "مُنح للتعرف على شلال حمام المسخوطين الأسطوري والمسرح الروماني بقالمة"
    },
    famousFor: "حمام دباغ (المسخوطين)، المسرح الروماني، غابات ماونة، زيتون قالمة",
    totalStages: 6
  },
  {
    id: 25,
    code: "25",
    name: "قسنطينة",
    region: "الشرق الجزائري",
    colorPrimary: "#831843",
    colorSecondary: "#701a75",
    colorBg: "linear-gradient(135deg, #500724, #701a75)",
    accent: "#f472b6",
    badge: {
      name: "وسام مدينة الجسور المعلقة وسيرتا",
      icon: "🌉",
      title: "عمدة صخرة سيرتا العريقة",
      description: "مُنح لعبور قنطرة سيدي مسيد المعلقة وقصر أحمد باي الفاخر"
    },
    famousFor: "الجسور المعلقة (سيدي مسيد، باب القنطرة)، قصر أحمد باي، قندورة القطيفة، المالوف",
    totalStages: 8
  },
  {
    id: 26,
    code: "26",
    name: "المدية",
    region: "التيطري",
    colorPrimary: "#15803d",
    colorSecondary: "#166534",
    colorBg: "linear-gradient(135deg, #14532d, #166534)",
    accent: "#86efac",
    badge: {
      name: "وسام التيطري وعنب المدية",
      icon: "🍇",
      title: "حارس منارة التيطري",
      description: "مُنح لاكتشاف مضيق الشفة وبساتين العنب والكرز وقصر الباي"
    },
    famousFor: "كروم العنب المشهورة، مضايق الشفة، باب الأقواس، الصناعات الجلدية الأصيلة",
    totalStages: 6
  },
  {
    id: 27,
    code: "27",
    name: "مستغانم",
    region: "الغرب الساحلي",
    colorPrimary: "#0284c7",
    colorSecondary: "#0369a1",
    colorBg: "linear-gradient(135deg, #075985, #0369a1)",
    accent: "#38bdf8",
    badge: {
      name: "وسام مسك الغنائم والشعر الملحون",
      icon: "🎭",
      title: "شاعر مسك الغنائم والمسرح",
      description: "مُنح لفتح مهرجان المسرح الهواة وتراث سيدي لخضر بن خلوف"
    },
    famousFor: "عاصمة المسرح الهواة، الشاعر سيدي لخضر بن خلوف، شواطئ صابلات وكاب إيفي",
    totalStages: 6
  },
  {
    id: 28,
    code: "28",
    name: "المسيلة",
    region: "الحضنة",
    colorPrimary: "#ca8a04",
    colorSecondary: "#a16207",
    colorBg: "linear-gradient(135deg, #713f12, #a16207)",
    accent: "#fde047",
    badge: {
      name: "وسام قلعة بني حماد التاريخية",
      icon: "🏰",
      title: "حارس صرح الحماديين بالمعاضيد",
      description: "مُنح لاكتشاف مئذنة قلعة بني حماد المصنفة في التراث الإنساني العالمي"
    },
    famousFor: "قلعة بني حماد المصنفة يونسكو، طبق الزفيطي الحار الأصيل، شط الحضنة",
    totalStages: 6
  },
  {
    id: 29,
    code: "29",
    name: "معسكر",
    region: "الغرب الجزائري",
    colorPrimary: "#15803d",
    colorSecondary: "#166534",
    colorBg: "linear-gradient(135deg, #14532d, #166534)",
    accent: "#4ade80",
    badge: {
      name: "وسام الأمير عبد القادر الجزائري",
      icon: "⚔️",
      title: "حامل راية مؤسس الدولة الجزائرية الحديثة",
      description: "مُنح لزيارة شجرة الدردارة ومبايعة الأمير عبد القادر بطل المقاومة"
    },
    famousFor: "مهد الأمير عبد القادر، شجرة الدردارة، حمام بوحنيفية المعدني، زراعة الكروم",
    totalStages: 6
  },
  {
    id: 30,
    code: "30",
    name: "ورقلة",
    region: "الواحات والنفط",
    colorPrimary: "#ea580c",
    colorSecondary: "#c2410c",
    colorBg: "linear-gradient(135deg, #7c2d12, #c2410c)",
    accent: "#fed7aa",
    badge: {
      name: "وسام قصر ورقلة وبحيرة الرمال",
      icon: "🕌",
      title: "سيد قصر ورقلة العتيق",
      description: "مُنح لعبور حاسي مسعود وقصر ورقلة العتيق وبحيرة حاسي بن عبد الله"
    },
    famousFor: "قصر ورقلة الترابي، واحات نخيل الغرس، صناعة الفخار الصحراوي، الذهب الأسود",
    totalStages: 6
  },
  {
    id: 31,
    code: "31",
    name: "وهران",
    region: "الغرب الساحلي",
    colorPrimary: "#0284c7",
    colorSecondary: "#1d4ed8",
    colorBg: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    accent: "#38bdf8",
    badge: {
      name: "وسام الباهية وسانتا كروز",
      icon: "🏰",
      title: "سفير الباهية وهران والبلوزة",
      description: "مُنح لتسلق قمة المرجاجو وزيارة حصن سانتا كروز والبلوزة الوهرانية"
    },
    famousFor: "حصن سانتا كروز، قمة المرجاجو، البلوزة الوهرانية، طبق الكران (القرنطيطة)، الراي",
    totalStages: 8
  },
  {
    id: 32,
    code: "32",
    name: "البيض",
    region: "القصور والصحراء",
    colorPrimary: "#c2410c",
    colorSecondary: "#9a3412",
    colorBg: "linear-gradient(135deg, #7c2d12, #9a3412)",
    accent: "#fdba74",
    badge: {
      name: "وسام نقوش الغيشة والقصور",
      icon: "🦬",
      title: "صائد نقوش الوعول بالبيض",
      description: "مُنح لاكتشاف قصر بوسمغون والنقوش الصخرية النادرة في الغيشة"
    },
    famousFor: "قصر بوسمغون الصوفي، نقوش الغيشة الصخرية، جبل كسال، سلالة النعام",
    totalStages: 6
  },
  {
    id: 33,
    code: "33",
    name: "إليزي",
    region: "طاسيلي ناجر",
    colorPrimary: "#7c2d12",
    colorSecondary: "#9a3412",
    colorBg: "linear-gradient(135deg, #451a03, #7c2d12)",
    accent: "#f59e0b",
    badge: {
      name: "وسام كهوف ورسوم الطاسيلي العالمية",
      icon: "🎨",
      title: "مستكشف متحف الهواء الطلق العالمي",
      description: "مُنح لفك رموز أقدم لوحات جدارية للإنسان في هضبة طاسيلي ناجر"
    },
    famousFor: "حظيرة طاسيلي ناجر يونسكو، النقوش الجدارية البدائية، جبال سيفار الأسطورية",
    totalStages: 6
  },
  {
    id: 34,
    code: "34",
    name: "برج بوعريريج",
    region: "الهضاب العليا",
    colorPrimary: "#4f46e5",
    colorSecondary: "#4338ca",
    colorBg: "linear-gradient(135deg, #312e81, #4338ca)",
    accent: "#818cf8",
    badge: {
      name: "وسام برج المقراني والبيببان",
      icon: "🏰",
      title: "حارس معقل ثورة المقراني",
      description: "مُنح لزيارة برج المقراني ومضايق البيبان الشامخة وعاصمة الإلكترونيك"
    },
    famousFor: "برج المقراني التاريخي، مضايق البيبان، زمورة العتيقة، قطب الصناعات الإلكترونية",
    totalStages: 6
  },
  {
    id: 35,
    code: "35",
    name: "بومرداس",
    region: "الساحل الأوسط",
    colorPrimary: "#0284c7",
    colorSecondary: "#0369a1",
    colorBg: "linear-gradient(135deg, #0c4a6e, #0369a1)",
    accent: "#38bdf8",
    badge: {
      name: "وسام صخرة قصبة دلس ورأس جنات",
      icon: "⚓",
      title: "ملاح قصبة دلس العتيقة",
      description: "مُنح للتجول في القصبة الساحلية بدلس وميناء رأس جنات الخلاب"
    },
    famousFor: "قصبة دلس الأثرية، منارة برج فنار، غابات الساحل، شواطئ قورصو ورأس جنات",
    totalStages: 6
  },
  {
    id: 36,
    code: "36",
    name: "الطارف",
    region: "أقصى الشرق والبحيرات",
    colorPrimary: "#059669",
    colorSecondary: "#047857",
    colorBg: "linear-gradient(135deg, #064e3b, #047857)",
    accent: "#6ee7b7",
    badge: {
      name: "وسام بحيرة طونغا والقالة المرجانية",
      icon: "🪸",
      title: "غواص مرجان القالة الثمين",
      description: "مُنح لاستكشاف محمية القالة وبحيرة طونغا ومصائد المرجان الملكي"
    },
    famousFor: "صيد المرجان الطبيعي، الحظيرة الوطنية للقالة، بحيرة طونغا وملاح، غابات الفلين",
    totalStages: 6
  },
  {
    id: 37,
    code: "37",
    name: "تندوف",
    region: "أقصى الجنوب الغربي",
    colorPrimary: "#d97706",
    colorSecondary: "#b45309",
    colorBg: "linear-gradient(135deg, #78350f, #b45309)",
    accent: "#fde047",
    badge: {
      name: "وسام واحة بلاد الحطاطبة",
      icon: "⛺",
      title: "حارس قوافل الصحراء الغربية",
      description: "مُنح لاجتياز حمادة تندوف وزيارة زوايا العلم والتراث الأصيل"
    },
    famousFor: "خيمة الضيافة البدوية، غار جبيلات الحديدي، زاوية بلعمش العلمية",
    totalStages: 6
  },
  {
    id: 38,
    code: "38",
    name: "تيسمسيلت",
    region: "الونشريس",
    colorPrimary: "#15803d",
    colorSecondary: "#166534",
    colorBg: "linear-gradient(135deg, #14532d, #166534)",
    accent: "#86efac",
    badge: {
      name: "وسام حظيرة ثنية الحد وأرز المداد",
      icon: "🌲",
      title: "صديق أرز المداد الألفي",
      description: "مُنح لعبور غابة الأرز المعمرة بثنية الحد وعيون مياه الونشريس"
    },
    famousFor: "الحظيرة الوطنية لثنية الحد (عين لالة ربي)، قمة الونشريس، عسل الغابات الطبيعي",
    totalStages: 6
  },
  {
    id: 39,
    code: "39",
    name: "الوادي",
    region: "سوف وألف قبة",
    colorPrimary: "#ea580c",
    colorSecondary: "#c2410c",
    colorBg: "linear-gradient(135deg, #7c2d12, #c2410c)",
    accent: "#fdba74",
    badge: {
      name: "وسام مدينة الألف قبة والغوط",
      icon: "🕌",
      title: "فلاح الغيطان السوفية الذهبية",
      description: "مُنح لفك هندسة الغيطان لزراعة النخيل وتفاصيل مدينة القباب المعمارية"
    },
    famousFor: "نظام الغوط الفريد المصنف فاو، هندسة الألف قبة، زربية وادي سوف، البطاطا السوفية",
    totalStages: 6
  },
  {
    id: 40,
    code: "40",
    name: "خنشلة",
    region: "الأوراس الشامخ",
    colorPrimary: "#991b1b",
    colorSecondary: "#7f1d1d",
    colorBg: "linear-gradient(135deg, #450a0a, #7f1d1d)",
    accent: "#fca5a5",
    badge: {
      name: "وسام حمام الصالحين والملكة ديهيا",
      icon: "♨️",
      title: "أمير مياه أكوا كاليدا الرومانية",
      description: "مُنح للسباحة في حمام الصالحين الأثري المستمر بالتدفق منذ 2000 عام"
    },
    famousFor: "حمام الصالحين الروماني الحي، جبل شلية أعلى قمة بالأوراس، تفاح بوحمامة، الزربية النمامشية",
    totalStages: 6
  },
  {
    id: 41,
    code: "41",
    name: "سوق أهراس",
    region: "طاغاست وموطن القديس",
    colorPrimary: "#15803d",
    colorSecondary: "#166534",
    colorBg: "linear-gradient(135deg, #14532d, #166534)",
    accent: "#86efac",
    badge: {
      name: "وسام زيتونة القديس أوغسطين وطاغاست",
      icon: "🫒",
      title: "فيلسوف طاغاست التاريخية",
      description: "مُنح لزيارة شجرة زيتونة القديس أوغسطين المعمرة وآثار مادور الفكرية"
    },
    famousFor: "شجرة زيتونة أوغسطين، مدينة مادور (أول جامعة في أفريقيا وموطن أبوليوس)، غابات المشروحة",
    totalStages: 6
  },
  {
    id: 42,
    code: "42",
    name: "تيبازة",
    region: "الساحل والآثار الفينيقية",
    colorPrimary: "#0284c7",
    colorSecondary: "#0f766e",
    colorBg: "linear-gradient(135deg, #0c4a6e, #0f766e)",
    accent: "#38bdf8",
    badge: {
      name: "وسام الضريح الموريتاني الملكي وتيبازة",
      icon: "🏛️",
      title: "حارس قبر الرومية وضفاف المتوسط",
      description: "مُنح لاستكشاف الضريح الملكي الموريتاني وآثار تيبازة البحرية يونسكو"
    },
    famousFor: "الضريح الملكي الموريتاني (قبر الرومية)، الآثار الرومانية على البحر، جبل شنوة، الفخار",
    totalStages: 6
  },
  {
    id: 43,
    code: "43",
    name: "ميلة",
    region: "الشرق القديم وميليف",
    colorPrimary: "#4338ca",
    colorSecondary: "#3730a3",
    colorBg: "linear-gradient(135deg, #312e81, #3730a3)",
    accent: "#a5b4fc",
    badge: {
      name: "وسام عين البلد ومسجد سيدي غانم",
      icon: "⛲",
      title: "مؤرخ ميليف وأقدم مسجد جزائري",
      description: "مُنح للتعرف على مسجد أبي المهاجر دينار (سيدي غانم) وينبوع عين البلد الروماني"
    },
    famousFor: "مسجد سيدي غانم (أول مسجد بني بالجزائر)، سد بني هارون الأضخم وطنياً، ميلة القديمة",
    totalStages: 6
  },
  {
    id: 44,
    code: "44",
    name: "عين الدفلى",
    region: "الوسط الزراعي",
    colorPrimary: "#16a34a",
    colorSecondary: "#15803d",
    colorBg: "linear-gradient(135deg, #14532d, #15803d)",
    accent: "#86efac",
    badge: {
      name: "وسام جبل زكار وحمام ريغة",
      icon: "⛰️",
      title: "حارس سفوح جبل زكار الشامخ",
      description: "مُنح لزيارة حمام ريغة المعدني ومحاصيل عين الدفلى الوفيرة"
    },
    famousFor: "حمام ريغة التاريخي، جبل زكار، إنتاج الحبوب والبطاطا، ضريح سيدي أحمد بن يوسف بمليانة",
    totalStages: 6
  },
  {
    id: 45,
    code: "45",
    name: "النعامة",
    region: "السهوب الغربية",
    colorPrimary: "#ca8a04",
    colorSecondary: "#a16207",
    colorBg: "linear-gradient(135deg, #713f12, #a16207)",
    accent: "#fde047",
    badge: {
      name: "وسام قلعة الشيخ بوعمامة ومكمن بن عمار",
      icon: "🐎",
      title: "فارس مقاومة الشيخ بوعمامة",
      description: "مُنح لتخليد مسار مقاومة الشيخ بوعمامة وزيارة قصر عسلة القديم"
    },
    famousFor: "معقل الشيخ بوعمامة بمغرار، بحيرة عين ورقة الكبريتية، محطة النقوش الصخرية بتيوت",
    totalStages: 6
  },
  {
    id: 46,
    code: "46",
    name: "عين تموشنت",
    region: "الساحل الغربي",
    colorPrimary: "#0284c7",
    colorSecondary: "#0369a1",
    colorBg: "linear-gradient(135deg, #075985, #0369a1)",
    accent: "#38bdf8",
    badge: {
      name: "وسام جزيرة رشقون ومملكة سيفاكس",
      icon: "🏝️",
      title: "ربان عاصمة النوميديين الغربيين سيقا",
      description: "مُنح لزيارة جزيرة رشقون الساحرة وموقع سيقا عاصمة الملك سيفاكس"
    },
    famousFor: "شاطئ وجزيرة رشقون، موقع سيقا النوميدي، حمام بوحجر المعدني، مزارع العنب المصفاة",
    totalStages: 6
  },
  {
    id: 47,
    code: "47",
    name: "غرداية",
    region: "وادي ميزاب",
    colorPrimary: "#b45309",
    colorSecondary: "#92400e",
    colorBg: "linear-gradient(135deg, #78350f, #92400e)",
    accent: "#fbbf24",
    badge: {
      name: "وسام قصر بني يزقن ومآذن ميزاب",
      icon: "🕌",
      title: "مهندس العمارة الميزابية العالمية",
      description: "مُنح لاكتشاف قصور وادي ميزاب الخمسة المصنفة يونسكو وزربية غرداية العريقة"
    },
    famousFor: "قصور وادي ميزاب المعمارية الفريدة (بني يزقن، العطف، بنورة...)، صناعة السجاد، برج بوليلة",
    totalStages: 6
  },
  {
    id: 48,
    code: "48",
    name: "غليزان",
    region: "سهل مينا",
    colorPrimary: "#15803d",
    colorSecondary: "#166534",
    colorBg: "linear-gradient(135deg, #14532d, #166534)",
    accent: "#4ade80",
    badge: {
      name: "وسام سهل مينا وزاوية سيدي امحمد بن عودة",
      icon: "🌾",
      title: "فارس الفانتازيا بوعدة بن عودة",
      description: "مُنح لحضور أكبر تظاهرة فانتازيا شعبية بوعدة سيدي امحمد بن عودة"
    },
    famousFor: "وعدة سيدي امحمد بن عودة للفانتازيا، سد قرقار، سهل مينا الفلاحي الخصيب",
    totalStages: 6
  },
  {
    id: 49,
    code: "49",
    name: "تيميمون",
    region: "الواحة الحمراء وقورارة",
    colorPrimary: "#b91c1c",
    colorSecondary: "#991b1b",
    colorBg: "linear-gradient(135deg, #7f1d1d, #991b1b)",
    accent: "#f87171",
    badge: {
      name: "وسام الواحة الحمراء وأهليل قورارة",
      icon: "🥁",
      title: "منشد تراث الأهليل العالمي",
      description: "مُنح للاستماع لفن أهليل قورارة الشفهي المعترف به في اليونسكو"
    },
    famousFor: "العمارة الطينية الحمراء، فن أهليل قورارة المصنف يونسكو، قصر إغزر ومغارات الكاف",
    totalStages: 6
  },
  {
    id: 50,
    code: "50",
    name: "برج باجي مختار",
    region: "أقصى الحدود الجنوبية",
    colorPrimary: "#ea580c",
    colorSecondary: "#c2410c",
    colorBg: "linear-gradient(135deg, #7c2d12, #c2410c)",
    accent: "#fde047",
    badge: {
      name: "وسام بوابات تنزروفت الكبرى",
      icon: "🧭",
      title: "دليل دروب صحراء تنزروفت العظيمة",
      description: "مُنح لقطع دروب صحراء تنزروفت الشاسعة وتراث البدو الرحل"
    },
    famousFor: "صحراء تنزروفت المترامية، تقاليد التوارق والرعاة، سباقات الهجن والإبل الأصيلة",
    totalStages: 6
  },
  {
    id: 51,
    code: "51",
    name: "أولاد جلال",
    region: "الزيبان الغربية",
    colorPrimary: "#d97706",
    colorSecondary: "#b45309",
    colorBg: "linear-gradient(135deg, #78350f, #b45309)",
    accent: "#fbbf24",
    badge: {
      name: "وسام سلالة الشياه والتمور البهية",
      icon: "🐑",
      title: "راعي سلالة أولاد جلال الأصيلة",
      description: "مُنح لمعرفة أشهر سلالة أغنام جزائرية ذات الصيت الإقليمي والعالمي"
    },
    famousFor: "أكبر مركز وطني لسلالة المواشي الأصيلة، زراعة النخيل، المخطوطات والزوايا السالمية",
    totalStages: 6
  },
  {
    id: 52,
    code: "52",
    name: "بني عباس",
    region: "واحة العرق الغربي الكبير",
    colorPrimary: "#c2410c",
    colorSecondary: "#9a3412",
    colorBg: "linear-gradient(135deg, #7c2d12, #9a3412)",
    accent: "#fdba74",
    badge: {
      name: "وسام واحة العقرب الأبيض والنخلة",
      icon: "🦂",
      title: "حكيم قصر بني عباس ومتحف الصحراء",
      description: "مُنح لزيارة صومعة شارل دو فوكو ومتحف بني عباس وتلال العرق الذهبي"
    },
    famousFor: "واحة النخيل على شكل عقرب، الكثبان الرملية الهائلة، متحف بني عباس للأبحاث الصحراوية",
    totalStages: 6
  },
  {
    id: 53,
    code: "53",
    name: "عين صالح",
    region: "التديكلت",
    colorPrimary: "#ea580c",
    colorSecondary: "#c2410c",
    colorBg: "linear-gradient(135deg, #7c2d12, #c2410c)",
    accent: "#fed7aa",
    badge: {
      name: "وسام غابات الخشب المتحجر بتديكلت",
      icon: "🪵",
      title: "جيولوجي غابات الأشجار المتحجرة",
      description: "مُنح لاكتشاف ظاهرة الغابات المتحجرة العائدة لملايين السنين في قلب الصحراء"
    },
    famousFor: "جذوع الأشجار المتحجرة الصخرية، واحات التديكلت، قصر البركة القديم",
    totalStages: 6
  },
  {
    id: 54,
    code: "54",
    name: "عين قزام",
    region: "أقصى الجنوب",
    colorPrimary: "#4338ca",
    colorSecondary: "#3730a3",
    colorBg: "linear-gradient(135deg, #312e81, #3730a3)",
    accent: "#818cf8",
    badge: {
      name: "وسام بوابة التجارة الإفريقية الخضراء",
      icon: "🌍",
      title: "حارس بوابة الساحل الإفريقي",
      description: "مُنح لفتح معبر قوافل التجارة العابرة للصحراء والتضاريس الجبلية النادرة"
    },
    famousFor: "بوابة الجزائر نحو إفريقيا، سهول التينيري، التراث التارقي والتبادل التجاري التقليدي",
    totalStages: 6
  },
  {
    id: 55,
    code: "55",
    name: "تقرت",
    region: "وادي ريغ",
    colorPrimary: "#d97706",
    colorSecondary: "#b45309",
    colorBg: "linear-gradient(135deg, #78350f, #b45309)",
    accent: "#fde047",
    badge: {
      name: "وسام أضرحة ملوك بني جلاب وتقرت",
      icon: "👑",
      title: "أمير سلطنة وادي ريغ",
      description: "مُنح لزيارة قبة ملوك بني جلاب ومسجد الجامع الكبير العتيق بتقرت"
    },
    famousFor: "أضرحة ملوك بني جلاب، واحات وادي ريغ النضرة، مسجد القبة، التمور الفاخرة",
    totalStages: 6
  },
  {
    id: 56,
    code: "56",
    name: "جانت",
    region: "التاسيلي الجنوبي وعرائس الصخر",
    colorPrimary: "#6d28d9",
    colorSecondary: "#5b21b6",
    colorBg: "linear-gradient(135deg, #4c1d95, #5b21b6)",
    accent: "#c4b5fd",
    badge: {
      name: "وسام البقرة الباكية وإهرير الساحرة",
      icon: "🗿",
      title: "عاشق نقش البقرة الباكية بتيديس",
      description: "مُنح لتأمل رائعة النحت الصخري 'البقرة الباكية' وواحات إهرير المائية العجيبة"
    },
    famousFor: "نقش البقرة الباكية الأسطوري، واحة إهرير العذبة وسط الصخور، حفل السبيبة التراثي العالمي",
    totalStages: 6
  },
  {
    id: 57,
    code: "57",
    name: "المغير",
    region: "شط ملغيغ والنخيل",
    colorPrimary: "#b45309",
    colorSecondary: "#92400e",
    colorBg: "linear-gradient(135deg, #78350f, #92400e)",
    accent: "#fbbf24",
    badge: {
      name: "وسام شط ملغيغ وأدنى نقطة بالجزائر",
      icon: "🪞",
      title: "مستكشف مرآة شط ملغيغ البلورية",
      description: "مُنح لزيارة شط ملغيغ ذي السطح الملحي الأخاذ المنخفض عن مستوى البحر"
    },
    famousFor: "شط ملغيغ (أخفض نقطة في الجزائر -40م تحت البحر)، بساتين دقلة نور بجامعة والمغير",
    totalStages: 6
  },
  {
    id: 58,
    code: "58",
    name: "المنيعة",
    region: "الواحة المعلقة وقصر القليعة",
    colorPrimary: "#ea580c",
    colorSecondary: "#c2410c",
    colorBg: "linear-gradient(135deg, #7c2d12, #c2410c)",
    accent: "#fed7aa",
    badge: {
      name: "وسام قصر القليعة ووردة الرمال",
      icon: "🌹",
      title: "حارس حصن القليعة الحصين",
      description: "مُنح للصعود إلى قصر القليعة المنيع والظفر بأجمل ورود الرمال الكريستالية"
    },
    famousFor: "قصر القليعة الأثري المشيد فوق قمة الجبل، وردة الرمال الطبيعية، بحيرة المالح، واحات المشمش والتمور",
    totalStages: 6
  }
];
