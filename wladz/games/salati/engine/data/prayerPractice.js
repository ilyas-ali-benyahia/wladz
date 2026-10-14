/**
 * Curriculum choices shared by the UI and the animation, and the wording of each step.
 * Content review (WLADZ_TEAM_PROMPT.md section 9.4): the fiqh statements and the references below
 * must be checked by a qualified teacher. Entries marked TODO-VERIFICATION are not verified yet.
 */
// TODO-VERIFICATION: all fiqh statements in stepContent() and PRAYER_SOURCES.
// Initial choices (the project's reference settings): raise to the ears, qabḍ, iftirāsh, two salāms.
// Every option stays selectable in the practice dialog and drives the mascot animation.
export const DEFAULT_PRACTICE = Object.freeze({ hands: 'qabd', raise: 'ears', sitting: 'iftirash', taslim: 'double', tahrik: 'move', descent: 'hands-first' });
export const ACTION_POSES = Object.freeze({
  takbir: 'takbir', qiyam: 'qiyam', ruku: 'ruku', itidal: 'itidal',
  sujud1: 'sujud1', jalsa1: 'jalsa', sujud2: 'sujud2', qada: 'qada', salam: 'salam'
});
export const MOVEMENT_SEQUENCE = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8]);
// Opening takbir happens once. Rise to recitation after the first rak‘ah; sit for
// final tashahhud only after the second. Each entry is an occurrence, not an ID.
export const TWO_RAKAH_SEQUENCE = Object.freeze([0, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8]);
export function sequenceFor(scope) { return scope === 'two-rakah' ? TWO_RAKAH_SEQUENCE : MOVEMENT_SEQUENCE; }
export function stepContent(step, settings = DEFAULT_PRACTICE) {
  const result = { ...step };
  if (step.id === 'takbir') {
    result.subInstruction = {
      shoulders: 'ارفع يديك حذو منكبيك، ظهورهما إلى السماء وبطونهما إلى الأرض، ثم أنزلهما بهدوء.',
      'shoulders-qibla': 'ارفع يديك حذو منكبيك، وباطن الكفين إلى القبلة، ثم أنزلهما بهدوء.',
      ears: 'ارفع يديك حتى تحاذي بهما أذنيك، وباطن الكفين إلى القبلة، ثم أنزلهما بهدوء.'
    }[settings.raise || 'shoulders'];
  }
  if (step.id === 'qiyam') {
    result.subInstruction = settings.hands === 'sadl'
      ? 'قف مطمئناً وأرسل يديك بجانبك؛ ثم اقرأ ما تيسر بعد الفاتحة.'
      : 'ضع اليمنى على اليسرى أمام الجذع؛ ثم اقرأ ما تيسر بعد الفاتحة.';
    result.sunnah = 'السدل والقبض من الهيئات المعروفة؛ اتبع ما تتعلمه من معلّمك.';
  }
  if (step.id === 'jalsa1' || step.id === 'qada') {
    result.subInstruction = settings.sitting === 'tawarruk'
      ? 'اجلس على الجانب الأيسر، وأخرج اليسرى تحت ساقك اليمنى، مع نصب القدم اليمنى.'
      : 'افرش القدم اليسرى واجلس عليها، وانصب اليمنى مع توجيه أصابعها للقبلة.';
    if (step.id === 'qada') {
      result.subInstruction += ' اقبض أصابع اليمنى إلا السبابة وأشر بها' + (settings.tahrik === 'still' ? ' دون تحريك' : ' وحرّكها') + '، وابسط اليسرى على فخذك. اقرأ التشهد وصلِّ على النبي ﷺ.';
    }
  }
  if (step.id === 'salam') {
    result.instruction = settings.taslim === 'single' ? 'سلِّم تسليمة واحدة إلى يمينك' : 'سلِّم إلى يمينك ثم إلى يسارك';
    result.subInstruction = settings.taslim === 'single' ? 'قل: السلام عليكم. هذه هيئة المنفرد في العرض المالكي.' : 'قل في كل جهة: السلام عليكم ورحمة الله. هذا خيار بهيئة أخرى معروفة.';
  }
  return result;
}

export const PRAYER_SOURCES = [
  { title: 'وزارة الشؤون الدينية الجزائرية: السدل في الصلاة', url: 'https://marw.gov.dz/السدل-في-الصلاة' },
  { title: 'رسالة ابن أبي زيد: صفة الصلاة (ترجمة مع شرح)', url: 'https://www.muwatta.com/ebooks/english/risala_ibn_abi_zayd_salutations.pdf' },
  { title: 'صحيح مسلم ٥٨٢: التسليم إلى اليمين واليسار', url: 'https://sunnah.com/muslim:582' },
  { title: 'صحيح البخاري ٨٢٨: الركوع والسجود والجلوس', url: 'https://sunnah.com/bukhari:828' },
  { title: 'صحيح البخاري ٨١٢: أعضاء السجود', url: 'https://sunnah.com/bukhari:812' },
  { title: 'صحيح البخاري ٧٥٧: الترتيب والطمأنينة', url: 'https://sunnah.com/bukhari:757' }
];
