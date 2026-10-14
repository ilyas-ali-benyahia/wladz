/**
 * Prayer step definitions and dhikr quiz data for the Salati training game.
 *
 * Content review (WLADZ_TEAM_PROMPT.md section 9.4): every Arabic recitation text, every
 * fiqh statement and every reference must be checked against a reliable source before the
 * game is set to status "pret". Entries marked TODO-VERIFICATION are not verified yet.
 */

// ===== PRAYER STEPS =====
export const PRAYER_STEPS = [
  {
    id: 'takbir',
    name: 'التكبير',
    icon: 'fa-hand-point-up',
    instruction: 'قل: الله أكبر',
    subInstruction: 'ارفع يديك إلى نحو المنكبين ثم أنزلهما بهدوء، وأنت مستقبل القبلة',
    position: 'takbir',
    minDuration: 2500,
    description: 'افتتاح الصلاة بالتكبير',
    sunnah: 'رفع اليدين عند التكبير',
    mistake: 'عدم التلفظ بـ (الله أكبر) أو النطق بها خطأ',
    hasQuiz: false,
  },
  {
    id: 'qiyam',
    name: 'القيام',
    icon: 'fa-person',
    instruction: 'اقرأ سورة الفاتحة',
    subInstruction: 'قف مطمئناً وأرسل يديك بجانبك في هيئة السدل',
    position: 'qiyam',
    minDuration: 6000,
    description: 'الوقوف وقراءة الفاتحة',
    sunnah: 'السدل والقبض هيئتان معروفتان؛ اختر الهيئة مع معلّمك',
    mistake: 'كثرة الحركة أو قراءة الفاتحة بسرعة بدون طمأنينة',
    hasQuiz: true,
    quizType: 'qiyam_sunnah',
  },
  {
    id: 'ruku',
    name: 'الركوع',
    icon: 'fa-hand-sparkles',
    instruction: 'انحنِ للركوع',
    subInstruction: 'ضع كفيك على ركبتيك وسوِّ ظهرك ورأسك، وقل: سبحان ربي العظيم',
    position: 'ruku',
    minDuration: 4000,
    description: 'الانحناء مع التسبيح',
    sunnah: 'تسوية الظهر بحيث يكون مستقيماً وموازياً للأرض',
    mistake: 'عدم الاطمئنان في الركوع أو عدم تسوية الظهر',
    hasQuiz: true,
    quizType: 'ruku',
  },
  {
    id: 'itidal',
    name: 'الاعتدال',
    icon: 'fa-person-arrow-up-from-line',
    instruction: 'ارفع من الركوع',
    subInstruction: 'قف مستقيماً مطمئناً؛ يقول المنفرد: سمع الله لمن حمده، ربنا ولك الحمد',
    position: 'itidal',
    minDuration: 2500,
    description: 'النهوض من الركوع',
    sunnah: 'في العرض المالكي تبقى اليدان مرسلتين عند الاعتدال',
    mistake: 'النزول للسجود قبل أن يستوي واقفاً (نقر الغراب)',
    hasQuiz: true,
    quizType: 'itidal_mistake',
  },
  {
    id: 'sujud1',
    name: 'السجود الأول',
    icon: 'fa-person-praying',
    instruction: 'اسجد لله',
    subInstruction: 'ضع الجبهة والأنف والكفين والركبتين وأطراف القدمين على الأرض، وارفع المرفقين',
    position: 'sujud1',
    minDuration: 4000,
    description: 'السجود الأول',
    hasQuiz: true,
    quizType: 'sujud',
  },
  {
    id: 'jalsa1',
    name: 'الجلوس',
    icon: 'fa-chair',
    instruction: 'اجلس بين السجدتين',
    subInstruction: 'اجلس مطمئناً على الجانب الأيسر في هيئة التورك، وضع يديك على فخذيك',
    position: 'jalsa',
    minDuration: 2500,
    description: 'الجلوس بين السجدتين',
    hasQuiz: false,
  },
  {
    id: 'sujud2',
    name: 'السجود الثاني',
    icon: 'fa-person-praying',
    instruction: 'اسجد لله مرة أخرى',
    subInstruction: 'كما فعلت في السجود الأول',
    position: 'sujud2',
    minDuration: 4000,
    description: 'السجود الثاني',
    hasQuiz: true,
    quizType: 'sujud',
  },
  {
    id: 'qada',
    name: 'القعود',
    icon: 'fa-book-open',
    instruction: 'اجلس للتشهد',
    subInstruction: 'اقرأ التشهد وصلِّ على النبي ﷺ',
    position: 'qada',
    minDuration: 5000,
    description: 'الجلوس للتشهد الأخير',
    sunnah: 'اقبض أصابع اليد اليمنى إلا السبابة وأشر بها، وابسط اليسرى على فخذك',
    hasQuiz: true,
    quizType: 'tashahhud',
  },
  {
    id: 'salam',
    name: 'السلام',
    icon: 'fa-rotate-left',
    instruction: 'سلِّم تسليمة واحدة إلى يمينك',
    subInstruction: 'قل: السلام عليكم؛ هذه هيئة المنفرد في العرض المالكي',
    position: 'salam',
    minDuration: 2500,
    description: 'إنهاء الصلاة بالتسليم',
    hasQuiz: false,
  }
];

// ===== DHIKR QUIZ DATA =====
// TODO-VERIFICATION: recitation texts and the fiqh statements in this block are unverified.
// Fields: answer (displayed), acceptedAnswers (typed/MCQ match after Arabic normalisation),
// typeable (false = always multiple-choice, e.g. long phrases), options, hint, explanation.
export const DHIKR_QUIZZES = {
  ruku: {
    id: 'ruku',
    title: 'ذكر الركوع',
    question: 'سُبْحَانَ ____ العَظِيمِ',
    answer: 'ربي',
    acceptedAnswers: ['ربي', 'رَبِّيَ'],
    typeable: true,
    hint: 'اكمل الذكر: سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    // "الله" was removed as a distractor: "سبحان الله العظيم" is itself a phrase people say.
    options: ['ربي', 'ملكي', 'خالقي', 'رازقي'],
    explanation: 'في الركوع نقول: سُبْحَانَ رَبِّيَ الْعَظِيمِ؛ دون اشتراط عدد في هذا التدريب'
  },
  sujud: {
    id: 'sujud',
    title: 'ذكر السجود',
    question: 'سُبْحَانَ ____ الأَعْلَى',
    answer: 'ربي',
    acceptedAnswers: ['ربي', 'رَبِّيَ'],
    typeable: true,
    hint: 'اكمل الذكر: سُبْحَانَ رَبِّيَ الأَعْلَى',
    options: ['ربي', 'ملكي', 'خالقي', 'رازقي'],
    explanation: 'في السجود نقول: سُبْحَانَ رَبِّيَ الأَعْلَى؛ دون اشتراط عدد في هذا التدريب'
  },
  tashahhud: {
    id: 'tashahhud',
    title: 'التشهد',
    question: 'التَّحِيَّاتُ لِلَّهِ، الزَّاكِيَاتُ لِلَّهِ، الطَّيِّبَاتُ الصَّلَوَاتُ لِلَّهِ، ____',
    answer: 'السلام عليك أيها النبي ورحمة الله وبركاته',
    acceptedAnswers: ['السلام عليك أيها النبي ورحمة الله وبركاته'],
    typeable: false, // long phrase: always multiple-choice
    hint: 'بداية التشهد: التَّحِيَّاتُ لِلَّهِ ... ثم السلام على النبي',
    options: [
      'السلام عليك أيها النبي ورحمة الله وبركاته',
      'الحمد لله رب العالمين',
      'سبحان الله وبحمده',
      'لا إله إلا الله'
    ],
    explanation: 'التشهد: التَّحِيَّاتُ لِلَّهِ، الزَّاكِيَاتُ لِلَّهِ، الطَّيِّبَاتُ الصَّلَوَاتُ لِلَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ'
  },
  qiyam_sunnah: {
    id: 'qiyam_sunnah',
    title: 'سنة أم فرض؟',
    question: 'قراءة سورة بعد الفاتحة في الركعتين الأوليين من:',
    answer: 'سنة',
    acceptedAnswers: ['سنة'],
    typeable: true,
    hint: 'من الأفعال المستحبة...',
    options: ['سنة', 'فرض', 'واجب', 'مكروه'],
    explanation: 'قراءة سورة بعد الفاتحة في الركعتين الأوليين من سنن الصلاة في العرض المالكي.'
  },
  itidal_mistake: {
    id: 'itidal_mistake',
    title: 'اكتشاف الأخطاء',
    question: 'بعد الرفع من الركوع، قف مستقيماً مع:',
    answer: 'الطمأنينة',
    acceptedAnswers: ['الطمأنينة', 'طمأنينة'],
    typeable: true,
    hint: 'تمهّل حتى يستقر جسمك قبل النزول للسجود.',
    options: ['الطمأنينة', 'الاستعجال', 'القفز', 'الالتفات'],
    explanation: 'تمهّل حتى يستقيم جسمك في الاعتدال؛ الطمأنينة مطلوبة، ولا يقيّم هذا التدريب صحة صلاة شخص بعينه.'
  }
};
