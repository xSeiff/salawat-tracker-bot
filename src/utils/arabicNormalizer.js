/**
 * Arabic Text Normalizer for Salawat validation
 */

// Common Arabic diacritics / Tashkeel regex
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;

// Tatweel / Kashida (ـ)
const TATWEEL_REGEX = /\u0640/g;

// Discord custom emojis <a?:name:id> and standard unicode emojis
const EMOJI_REGEX = /(<a?:[a-zA-Z0-9_]+:[0-9]+>)|(\p{Extended_Pictographic})/gu;

// Quranic / Honorific ligatures
const HONORIFICS = {
  '\uFDFA': 'صلى الله عليه وسلم', // ﷺ
  '\uFDFB': 'جل جلاله',
};

/**
 * Normalizes an Arabic string for flexible comparison:
 * - Expands honorific ligatures (e.g. ﷺ -> صلى الله عليه وسلم)
 * - Removes tashkeel (diacritics)
 * - Removes tatweel (kashida)
 * - Normalizes Alef variants (أ, إ, آ, ٱ -> ا)
 * - Normalizes Taa Marbouta (ة -> ه)
 * - Normalizes Alif Maqsura (ى -> ي)
 * - Removes emojis, punctuation, and non-letter symbols
 * - Collapses extra spaces and trims
 * 
 * @param {string} text
 * @returns {string}
 */
function normalizeArabic(text) {
  if (!text || typeof text !== 'string') return '';

  let normalized = text;

  // 1. Expand ligatures like ﷺ
  for (const [ligature, expansion] of Object.entries(HONORIFICS)) {
    normalized = normalized.replaceAll(ligature, expansion);
  }

  // 2. Remove emojis
  normalized = normalized.replace(EMOJI_REGEX, '');

  // 3. Remove tashkeel and tatweel
  normalized = normalized.replace(TASHKEEL_REGEX, '');
  normalized = normalized.replace(TATWEEL_REGEX, '');

  // 4. Normalize Alef variants: أ, إ, آ, ٱ -> ا
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // 5. Normalize Taa Marbouta: ة -> ه
  normalized = normalized.replace(/ة/g, 'ه');

  // 6. Normalize Alif Maqsura / Ya: ى -> ي
  normalized = normalized.replace(/ى/g, 'ي');

  // 7. Remove English/Arabic punctuation, numbers, and special characters
  // Keep only Arabic letters and spaces
  normalized = normalized.replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, ' ');

  // 8. Normalize verbal forms (صلي -> صل) to ensure flexible typing matching
  normalized = normalized.split(' ').map(w => (w === 'صلي' ? 'صل' : w)).join(' ');

  // 9. Collapse whitespace and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Checks if a message text matches any of the allowed prayer phrases
 * @param {string} messageText
 * @param {string[]} allowedPhrases
 * @returns {{ isValid: boolean, matchedPhrase: string | null, normalizedInput: string }}
 */
function validatePrayerMessage(messageText, allowedPhrases = []) {
  const normalizedInput = normalizeArabic(messageText);

  if (!normalizedInput) {
    return { isValid: false, matchedPhrase: null, normalizedInput: '' };
  }

  for (const phrase of allowedPhrases) {
    const normalizedPhrase = normalizeArabic(phrase);
    if (normalizedPhrase && normalizedInput === normalizedPhrase) {
      return {
        isValid: true,
        matchedPhrase: phrase,
        normalizedInput,
      };
    }
  }

  return {
    isValid: false,
    matchedPhrase: null,
    normalizedInput,
  };
}

module.exports = {
  normalizeArabic,
  validatePrayerMessage,
};
