/**
 * Arabic text normalisation for answer checking.
 * Ignores diacritics (tashkeel), tatweel, hamza/alef forms, ya/alef-maqsura, ta-marbuta/ha,
 * punctuation and extra whitespace. Pure functions, no DOM.
 */
export function normalizeArabic(input) {
  return String(input ?? '')
    .normalize('NFC')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // harakat, superscript alef, Quranic marks
    .replace(/ـ/g, '')                              // tatweel
    .replace(/[آأإٱ]/g, 'ا')    // آ أ إ ٱ -> ا
    .replace(/ى/g, 'ي')                        // ى -> ي
    .replace(/ة/g, 'ه')                        // ة -> ه
    .replace(/[،؛؟.,;:!?"'()«»\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True only when the whole answer equals one of the accepted answers (no substring matching). */
export function matchesAnswer(input, acceptedAnswers) {
  const n = normalizeArabic(input);
  if (!n) return false;
  return acceptedAnswers.some(a => normalizeArabic(a) === n);
}
