// قاعدة بيانات مراحل لعبة كنوز الجزائر
// تشمل أنواع المراحل المختلفة:
// 1. word_scramble: صورة + سؤال + حروف مبعثرة
// 2. multiple_choice: اختيار من متعدد
// 3. which_wilaya: من أي ولاية؟
// 4. complete_name: أكمل الاسم أو المثل
// 5. missing_letters: أكمل الحروف الناقصة
// 6. matching_pairs: لعبة مطابقة البطاقات والتراث

export const STAGES_BY_WILAYA = {
  // ولاية 01: أدرار (مفتوحة في البداية)
  1: [
    {
      id: "adrar_1",
      type: "word_scramble",
      category: "معالم وقصور",
      title: "قصور الطين الحمراء",
      question: "ما اسم هذه الواحة والمدينة الشهيرة بقصورها الطينية الحمراء في أدرار؟",
      answer: "تيميمون",
      image: "/games/treasures/assets/timimoun.jpg",
      hint: "تلقب بالواحة الحمراء وتشتهر بعمارتها الصحراوية الفريدة",
      decoyLetters: "ب ق ش ز ر ص",
      fact: {
        title: "هل تعلم عن قصر تيميمون؟",
        text: "تُبنى قصور تيميمون بمادة الطين الأحمر المخلوط بالتبن والسبخة المحلية، وهو طراز هندسي عبقري يجعل البيوت باردة ومنعشة في صيف الصحراء الحار ودافئة في ليالي الشتاء الباردة!",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "adrar_2",
      type: "word_scramble",
      category: "تراث وهندسة الري",
      title: "معجزة توزيع المياه",
      question: "ما اسم نظام الري الجوفي التقليدي العريق الذي يقسم المياه بالتساوي في واحات أدرار؟",
      answer: "الفقارة",
      image: "/games/treasures/assets/foggara.jpg",
      hint: "قناة جوفية لنقل المياه وتقسم بمشط حجري يسمى الكسرية",
      decoyLetters: "ح م د ك س و",
      fact: {
        title: "هل تعلم عن الفقارة؟",
        text: "نظام الفقارة في أدرار وتوات مسجل ضمن التراث الإنساني العالمي! يمتد لآلاف الكيلومترات تحت الأرض ويوزع الماء بدقة حسابية متناهية دون الحاجة لأي مضخات أو طاقة حديثة.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "adrar_3",
      type: "multiple_choice",
      category: "شخصيات وأعلام",
      title: "منارة العلم والقرآن",
      question: "في أي منطقة من أدرار تقع زاوية الشيخ العلامة سيدي محمد بلكبير الشهيرة بتعليم القرآن الكريم؟",
      options: ["مدينة أدرار العتيقة", "بودة", "تسابيت", "رڤان"],
      correctIndex: 0,
      image: "/games/treasures/assets/timimoun.jpg",
      hint: "تقع الزاوية في قلب مدينة أدرار وتخرج منها آلاف العلماء",
      fact: {
        title: "هل تعلم عن الشيخ بلكبير؟",
        text: "الشيخ سيدي محمد بلكبير (رحمه الله) كرس حياته لتعليم القرآن ونشر السلم والتآخي، وكانت زاويته ملاذاً لطلاب العلم من مختلف ولايات الجزائر ودول إفريقيا المجاورة.",
        rewardCoins: 45,
        rewardGems: 1
      }
    },
    {
      id: "adrar_4",
      type: "which_wilaya",
      category: "أكلات شعبية",
      title: "أكلة المردومة التراثية",
      question: "أكلة 'المردومة' الشهيرة التي يطهى فيها اللحم المتبل بدفنه تحت الجمر الساخن في الرمال تنتمي أساساً إلى واحات ولاية:",
      options: ["أدرار", "جيجل", "تيبازة", "تيزي وزو"],
      correctIndex: 0,
      image: "/games/treasures/assets/couscous.jpg",
      hint: "ولاية صحراوية كبرى بالجنوب الغربي مشهورة بكثبان الرمال",
      fact: {
        title: "هل تعلم عن سر المردومة؟",
        text: "المردومة طريقة طهي صحراوية فريدة تعود لمئات السنين، حيث يوضع اللحم في قدر فخاري ويدفن في حفرة من الحصى والجمر تحت الرمل لمدة 4 إلى 5 ساعات، فيصبح اللحم طرياً جداً بنكهة دخانية لا تقاوم!",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "adrar_5",
      type: "matching_pairs",
      category: "مصطلحات وتراث توات",
      title: "مطابقة مصطلحات الواحات",
      question: "قم بمطابقة كل مصطلح تراثي من منطقة توات بمعناه الصحيح:",
      pairs: [
        { item: "الفقارة", match: "قناة مياه جوفية" },
        { item: "الكسرية", match: "مشط توزيع المياه" },
        { item: "الأهليل", match: "شعر وغناء صحراوي" }
      ],
      hint: "اربط كل عنصر بما يناسبه في تقاليد أدرار وتيميمون",
      fact: {
        title: "هل تعلم عن أهليل قورارة؟",
        text: "فن الأهليل هو تراث شفهي وشعري غنائي مصنف من روائع التراث الشفهي اللامادي لليونسكو، ويؤدى جماعياً في حلقات دائرية متناغمة تسمى 'القعدة' وسط تصفيق منتظم.",
        rewardCoins: 60,
        rewardGems: 2
      }
    },
    {
      id: "adrar_6",
      type: "complete_name",
      category: "ألعاب شعبية",
      title: "لعبة الصحراء التراثية",
      question: "لعبة شعبية صحراوية قديمة تعتمد على عيدان القصب والحصى والحساب الذهني تسمى لعبة الـ...",
      answer: "السيك",
      clue: "الـ [ ... ]",
      hint: "تُلعب بعيدان القصب الملونة وتلعبها العائلات في السهرات",
      decoyLetters: "ب ل م ط ف و ز",
      fact: {
        title: "هل تعلم عن لعبة السيك؟",
        text: "لعبة السيك هي بمثابة الشطرنج الصحراوي التقليدي! تلعب بستة عيدان مصقولة تسمى 'السيكات'، وتحتاج إلى سرعة بديهة واستراتيجية محكمة لحسم الفوز.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "adrar_7",
      type: "missing_letters",
      category: "حيوانات الصحراء",
      title: "رمز رمال الصحراء",
      question: "أكمل الحروف الناقصة لاسم الثعلب الصحراوي الصغير ذو الأذنين الكبيرتين:",
      pattern: "ف _ ك",
      answer: "فنك",
      missingChar: "ن",
      image: "/games/treasures/assets/fennec.jpg",
      hint: "الحرف الناقص هو حرف النون",
      decoyLetters: "ن ل م ر ص ب",
      fact: {
        title: "هل تعلم عن الفنك الجزائري؟",
        text: "الفنك هو أصغر فصيلة في الكلبيات حول العالم، وأذناه الكبيرتان لا تساعدانه فقط على سماع أصوات الحشرات تحت الرمال، بل تعملان كمبرد طبيعي لتشتيت حرارة الصحراء الشديدة!",
        rewardCoins: 55,
        rewardGems: 1
      }
    },
    {
      id: "adrar_8",
      type: "multiple_choice",
      category: "اللهجات والتقاليد",
      title: "التضامن الشعبي في الواحة",
      question: "ماذا يطلق أهل توات والجزائر عموماً على العمل التعاوني التطوعي الذي يجتمع فيه أهل القرية لمساعدة جارهم؟",
      options: ["التويزة", "الشاشية", "القندورة", "البرنوس"],
      correctIndex: 0,
      image: "/games/treasures/assets/foggara.jpg",
      hint: "عادة تضامنية جزائرية موروثة في البناء والحصاد والولائم",
      fact: {
        title: "مبروك! أكملت ولاية أدرار بنجاح!",
        text: "التويزة من أبهى صور التكافل الاجتماعي الجزائري الأصيل. بإنهاء هذه المرحلة تكون قد جمعت وسام أدرار وفُتحت لك ولاية الشلف التالية تلقائياً!",
        rewardCoins: 100,
        rewardGems: 3,
        isWilayaCompleted: true
      }
    }
  ],

  // ولاية 02: الشلف
  2: [
    {
      id: "chlef_1",
      type: "word_scramble",
      category: "معالم تاريخية",
      title: "المدينة الفينيقية الساحلية",
      question: "ما اسم المدينة الساحلية الأثرية الشهيرة بولاية الشلف ذات الميناء الفينيقي العريق؟",
      answer: "تنس",
      image: "/games/treasures/assets/banner.jpg",
      hint: "ميناء تاريخي معروف يقع شمال ولاية الشلف",
      decoyLetters: "ق م س ل ج ب",
      fact: {
        title: "هل تعلم عن مدينة تنس؟",
        text: "تنس من أقدم مدن البحر الأبيض المتوسط، أسسها الفينيقيون في القرن الثامن قبل الميلاد كمركز تجاري، وتتميز بمنارتها الشهيرة على رأس كاب تينس وجدرانها العتيقة.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "chlef_2",
      type: "multiple_choice",
      category: "معالم طبيعية",
      title: "السلسلة الجبلية الشامخة",
      question: "ما اسم السلسلة الجبلية الطبيعية العريقة التي تمتد عبر أراضي ولاية الشلف؟",
      options: ["جبال الونشريس", "جبال الأوراس", "جبال جرجرة", "جبال الهقار"],
      correctIndex: 0,
      image: "/games/treasures/assets/banner.jpg",
      hint: "سلسلة جبلية شهيرة في الأطلس التلي تضم غابات الأرز والصنوبر",
      fact: {
        title: "هل تعلم عن جبال الونشريس؟",
        text: "تعني كلمة الونشريس في اللغة الأمازيغية 'المكان المرتفع المحصن'، وتضم قمة سيدي عمار وقلاعاً تاريخية ومناظر طبيعية تسلب الألباب.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "chlef_3",
      type: "which_wilaya",
      category: "معالم وسدود",
      title: "سد سيدي يعقوب العظيم",
      question: "يقع سد سيدي يعقوب، أحد أهم المنشآت المائية الكبرى، في ولاية:",
      options: ["الشلف", "تلمسان", "ورقلة", "عنابة"],
      correctIndex: 0,
      image: "/games/treasures/assets/foggara.jpg",
      hint: "الولاية التي تحمل الرقم 02 في الترقيم الوطني",
      fact: {
        title: "هل تعلم؟",
        text: "يعتبر وادي الشلف أطول نهر في الجزائر بطول يتجاوز 700 كيلومتر، ينبع من الأطلس الصحراوي ويصب في البحر الأبيض المتوسط قرب مستغانم.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "chlef_4",
      type: "complete_name",
      category: "تاريخ وشخصيات",
      title: "اسم الولاية التاريخي القديم",
      question: "كانت مدينة الشلف تسمى في العهد الروماني باسم قلعة الـ...",
      answer: "كاستيلوم",
      clue: "كـ [ ... ]",
      hint: "كلمة لاتينية تعني الحصن أو القلعة الرومانية",
      decoyLetters: "س ت ي ل و م ن ر ف",
      fact: {
        title: "هل تعلم عن تاريخ الشلف؟",
        text: "عرفت الشلف تاريخياً باسم 'كاستيلوم تينجيتانوم' أثناء الوجود الروماني، وكانت مركزاً استراتيجياً رابطاً بين الساحل والسهول الداخلية الخصبة.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "chlef_5",
      type: "missing_letters",
      category: "أكلات تقليدية",
      title: "خبز الميتيجة والونشريس",
      question: "ما اسم الخبز التقليدي الجزائري المستدير المصنوع من السميد وزيت الزيتون؟",
      pattern: "ك _ ر ة",
      answer: "كسرة",
      missingChar: "س",
      image: "/games/treasures/assets/couscous.jpg",
      hint: "الحرف الناقص هو حرف السين",
      decoyLetters: "س ص ض ط ع ف",
      fact: {
        title: "هل تعلم عن الكسرة الجزائرية؟",
        text: "الكسرة (أو أغروم بالأمازيغية) هي سيدة المائدة الجزائرية اليومية، وتطهى على طاجين الطين التقليدي وتؤكل ساخنة مع اللبن أو زيت الزيتون الصافي.",
        rewardCoins: 55,
        rewardGems: 1
      }
    },
    {
      id: "chlef_6",
      type: "multiple_choice",
      category: "تراث ورياضات",
      title: "فخر الرياضة بالشلف",
      question: "ما هو اللقب الشهير لنادي أولمبي الشلف العريق الفائز بعدة كؤوس وطنية؟",
      options: ["الجوارح (لاسيوس)", "النسور", "الفرسان", "الأسود"],
      correctIndex: 0,
      image: "/games/treasures/assets/banner.jpg",
      hint: "لقب شهير يطلقه أنصار الشلف على ناديهم المحبوب",
      fact: {
        title: "مبروك! أكملت ولاية الشلف!",
        text: "أحسنت صنعاً! لقد أتممت جميع مراحل الشلف وظفرت بوسام الونشريس وفُتحت لك الولايات التالية لمواصلة رحلة الكنوز!",
        rewardCoins: 120,
        rewardGems: 3,
        isWilayaCompleted: true
      }
    }
  ],

  // ولاية 16: الجزائر العاصمة
  16: [
    {
      id: "algiers_1",
      type: "word_scramble",
      category: "معالم وتاريخ",
      title: "صرح تخليد الشهداء",
      question: "ما اسم الصرح الخالد الشاهق المطل على خليج الجزائر تكريماً لشهداء الثورة؟",
      answer: "مقام الشهيد",
      image: "/games/treasures/assets/maqam.jpg",
      hint: "يتكون من ثلاث سعفات نخيل متلاقية تحمي شعلة الشهيد",
      decoyLetters: "ق م س ل ج ب ح و",
      fact: {
        title: "هل تعلم عن مقام الشهيد؟",
        text: "يبلغ ارتفاع مقام الشهيد (رياض الفتح) 92 متراً، ودُشن سنة 1982 بمناسبة الذكرى العشرين لاستقلال الجزائر، وتضم قاعدته المتحف الوطني للمجاهد.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "algiers_2",
      type: "word_scramble",
      category: "لباس تقليدي",
      title: "أيقونة الهوت كوتور العاصمية",
      question: "ما اسم السترة المخملية الفاخرة المطرزة بخيوط الفتلة والمجبود الذهبية؟",
      answer: "كاراكو",
      image: "/games/treasures/assets/karakou.jpg",
      hint: "لباس تقليدي نسائي عاصمي فاخر يرتدى مع السروال الشلقة",
      decoyLetters: "ف ط ل ح ن ر",
      fact: {
        title: "هل تعلم عن الكاراكو العاصمي؟",
        text: "يعود تاريخ الكاراكو إلى القرن الخامس عشر في قصبة الجزائر، حيث كانت ترتديه نساء الطبقة الأرستقراطية، ويحتاج تطريز القطعة الواحدة يدوياً أشهراً من العمل الدقيق!",
        rewardCoins: 55,
        rewardGems: 1
      }
    },
    {
      id: "algiers_3",
      type: "word_scramble",
      category: "أكلات تقليدية عالمية",
      title: "سيد المائدة المغاربية والجزائرية",
      question: "ما اسم هذا الطبق الجزائري العريق المصنوع من السميد المفور والمزين باللحم والخضار؟",
      answer: "كسكسي",
      image: "/games/treasures/assets/couscous.jpg",
      hint: "الطبق الوطني الأكثر شهرة والمصنف في التراث اللامادي لليونسكو",
      decoyLetters: "م ط ل ح ن ر",
      fact: {
        title: "هل تعلم عن الكسكسي الجزائري؟",
        text: "يعود تاريخ الكسكسي إلى العهد النوميدي قبل أكثر من 2000 سنة، حيث عثر علماء الآثار على قدور الكسكاس الفخارية في مدافن ملوك نوميديا القديمة!",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "algiers_4",
      type: "multiple_choice",
      category: "معالم وتراث",
      title: "قلب الجزائر التاريخي",
      question: "ما اسم المدينة التاريخية العتيقة ذات الأزقة المرصوفة بالجزائر العاصمة المصنفة في اليونسكو؟",
      options: ["قصبة الجزائر", "تيبازة القديمة", "المنصورة", "سيرتا"],
      correctIndex: 0,
      image: "/games/treasures/assets/banner.jpg",
      hint: "عاصمة الدايات والأزقة البيضاء والقصور العثمانية المطلة على البحر",
      fact: {
        title: "هل تعلم عن قصبة الجزائر؟",
        text: "تعتبر القصبة نموذجاً معمارياً إسلامياً متوسطياً استثنائياً، وكانت المعقل الحصين لمعركة الجزائر البطولية أثناء ثورة التحرير المظفرة.",
        rewardCoins: 50,
        rewardGems: 1
      }
    }
  ],

  // ولاية 25: قسنطينة
  25: [
    {
      id: "constantine_1",
      type: "word_scramble",
      category: "معالم وجسور",
      title: "أعلى جسر معلق فوق وادي الرمال",
      question: "ما اسم أشهر جسر معلق يربط صخرة قسنطينة بمستشفى المدينة الشاهق؟",
      answer: "سيدي مسيد",
      image: "/games/treasures/assets/constantine.jpg",
      hint: "جسر معلق يرتفع 175 متراً فوق أخدود وادي الرمال السحيق",
      decoyLetters: "ق ل ك ر و ن ت",
      fact: {
        title: "هل تعلم عن جسر سيدي مسيد؟",
        text: "دُشن جسر سيدي مسيد سنة 1912، وكان وقتها أعلى جسر معلق في العالم بأكمله! يمنح المارين فوقه إطلالة بانورامية تأسر الألباب على وادي الرمال وقوس الملاح التاريخي.",
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: "constantine_2",
      type: "multiple_choice",
      category: "تراث موسيقي",
      title: "فن قسنطينة الأندلسي العريق",
      question: "ما اسم الطابع الغنائي والموسيقي الأندلسي الكلاسيكي الشهير الذي تميزت به قسنطينة؟",
      options: ["المالوف", "الراي", "الشعبي", "الركروكي"],
      correctIndex: 0,
      image: "/games/treasures/assets/constantine.jpg",
      hint: "موسيقى تراثية كلاسيكية تعتمد على النوبات والكمان والعود التونسي/الجزائري",
      fact: {
        title: "هل تعلم عن المالوف؟",
        text: "المالوف هو مدرسة موسيقية عريقة انتقلت مع المهاجرين الأندلسيين وحافظت عليها قسنطينة ببراعة، ومن كبار روادها الشيخ حاج محمد الطاهر الفرقاني.",
        rewardCoins: 50,
        rewardGems: 1
      }
    }
  ]
};

// مولد ذكي للمراحل التراثية لبقية ولايات الجزائر الـ 58
// يضمن إمكانية اللعب في كل ولاية يفتحها اللاعب!
export function getStagesForWilaya(wilaya) {
  if (STAGES_BY_WILAYA[wilaya.id] && STAGES_BY_WILAYA[wilaya.id].length > 0) {
    return STAGES_BY_WILAYA[wilaya.id];
  }

  // توليد مراحل ثرية مخصصة للولاية من بياناتها التراثية
  const name = wilaya.name;
  return [
    {
      id: `stage_${wilaya.id}_1`,
      type: "word_scramble",
      category: "معالم وتاريخ",
      title: `جوهرة ولاية ${name}`,
      question: `ما اسم هذه الولاية الجزائرية العريقة التي تشتهر بـ ${wilaya.famousFor.split('،')[0]}؟`,
      answer: name.replace(/\s+/g, ""),
      image: wilaya.id % 2 === 0 ? "/games/treasures/assets/banner.jpg" : "/games/treasures/assets/timimoun.jpg",
      hint: `عاصمة منطقة ${wilaya.region} وتحمل الرقم ${wilaya.code}`,
      decoyLetters: "ل م ك و ن ف ج ت",
      fact: {
        title: `هل تعلم عن ولاية ${name}؟`,
        text: `تتميز ولاية ${name} بموقعها الاستراتيجي في ${wilaya.region} وتشتهر بـ ${wilaya.famousFor}. وتملك تراثاً ضارباً في عمق التاريخ الجزائري!`,
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: `stage_${wilaya.id}_2`,
      type: "multiple_choice",
      category: "جغرافيا وتراث",
      title: `موقع وتراث ولاية ${name}`,
      question: `تنتمي ولاية ${name} جغرافياً إلى منطقة:`,
      options: [
        wilaya.region,
        wilaya.region === "الشرق الجزائري" ? "الغرب الجزائري" : "الشرق الجزائري",
        "الجنوب الكبير",
        "الساحل الأوسط"
      ].sort(() => Math.random() - 0.5),
      correctIndex: -1, // will be resolved dynamically
      correctOption: wilaya.region,
      image: "/games/treasures/assets/banner.jpg",
      hint: `ابحث عن المنطقة الجغرافية المناسبة لـ ${name}`,
      fact: {
        title: `وسام ${wilaya.badge.name}`,
        text: `${wilaya.badge.description}.`,
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: `stage_${wilaya.id}_3`,
      type: "which_wilaya",
      category: "أعلام ومعالم",
      title: `أين يقع هذا المعلم؟`,
      question: `المعلم التراثي (${wilaya.famousFor.split('،')[0]}) يقع في ولاية:`,
      options: [name, "الجزائر", "وهران", "تمنراست"].sort(() => Math.random() - 0.5),
      correctIndex: -1,
      correctOption: name,
      image: "/games/treasures/assets/maqam.jpg",
      hint: `رمز الولاية رقم ${wilaya.code}`,
      fact: {
        title: "معلومة قيمة!",
        text: `الجزائر تزخر بـ 58 ولاية تشكل لوحة فسيفسائية مبهرة تجمع بين سحر السواحل وشموخ الجبال وهيبة الصحراء الكبرى!`,
        rewardCoins: 50,
        rewardGems: 1
      }
    },
    {
      id: `stage_${wilaya.id}_4`,
      type: "complete_name",
      category: "تراث شعبي",
      title: "أمثال وحكم جزائرية",
      question: "أكمل المثل الشعبي الجزائري الشهير: 'اللي فات مات واللي جاي في علم...'",
      answer: "الغيب",
      clue: "في علم [ ... ]",
      hint: "يعبر عن التفاؤل والتوكل على الله",
      decoyLetters: "ل م ك و ن ف ج ت",
      fact: {
        title: "حكمة من التراث",
        text: "تزخر الذاكرة الشعبية الجزائرية بآلاف الأمثال التراثية التي تلخص تجارب الأجداد في الحكمة والصبر والكرم وحسن الجوار.",
        rewardCoins: 55,
        rewardGems: 1
      }
    },
    {
      id: `stage_${wilaya.id}_5`,
      type: "multiple_choice",
      category: "أكلات وأطباق",
      title: "المطبخ الجزائري الأصيل",
      question: "ما هو المشروب التراثي الساخن الذي يُقدم دائماً كرمز للضيافة والترحيب في كافة ربوع الجزائر وخاصة الصحراء؟",
      options: ["الشاي بالنعناع مع الرغوة", "القهوة فقط", "عصير الليمون", "الحليب الرائب"],
      correctIndex: 0,
      image: "/games/treasures/assets/couscous.jpg",
      hint: "يحضر في إبريق فضي ويصب من علو لتكوين رغوة غنية",
      fact: {
        title: `مبروك! نلت وسام ${wilaya.badge.name}!`,
        text: `تهانينا لك! لقد أكملت ولاية ${name} بنجاح، وجمعت وسامها الفخري وفُتحت لك أبواب الاستكشاف للولاية القادمة!`,
        rewardCoins: 100,
        rewardGems: 3,
        isWilayaCompleted: true
      }
    }
  ].map(stage => {
    // إصلاح correctIndex إن وجد correctOption
    if (stage.correctOption && stage.options) {
      stage.correctIndex = stage.options.indexOf(stage.correctOption);
    }
    return stage;
  });
}
