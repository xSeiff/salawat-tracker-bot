const assert = require('assert');
const { normalizeArabic, validatePrayerMessage } = require('../src/utils/arabicNormalizer');
const { getEmojiNamesForNumber, isMilestone } = require('../src/utils/emojiManager');
const config = require('../data/config.json');

console.log('🧪 Running Salawat Counter Bot Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ==========================================
// 1. Arabic Normalization & Validation Tests
// ==========================================
console.log('--- 1. Arabic Normalization Tests ---');

test('Normalizes tashkeel (diacritics)', () => {
  const input = 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ';
  const expected = 'اللهم صل وسلم علي نبينا محمد';
  assert.strictEqual(normalizeArabic(input), expected);
});

test('Normalizes Tatweel / Kashida (ـ)', () => {
  const input = 'اللـــهم صــــل وســــلم عـــلى نبـــينا محـــمد';
  const expected = 'اللهم صل وسلم علي نبينا محمد';
  assert.strictEqual(normalizeArabic(input), expected);
});

test('Normalizes Hamzat (أ, إ, آ -> ا)', () => {
  const input = 'اللهم صل على محمد وعلى آل محمد';
  const expected = 'اللهم صل علي محمد وعلي ال محمد';
  assert.strictEqual(normalizeArabic(input), expected);
});

test('Normalizes Alif Maqsura and Taa Marbouta (ى -> ي, ة -> ه)', () => {
  const input = 'عليه الصلاة والسلام';
  const expected = 'عليه الصلاه والسلام';
  assert.strictEqual(normalizeArabic(input), expected);
});

test('Expands honorific ligature ﷺ', () => {
  const input = 'ﷺ';
  const expected = 'صل الله عليه وسلم';
  assert.strictEqual(normalizeArabic(input), expected);
});

test('Strips emojis, english characters, and punctuation', () => {
  const input = '✨ اللهم صل وسلم على نبينا محمد! :) ❤️';
  const expected = 'اللهم صل وسلم علي نبينا محمد';
  assert.strictEqual(normalizeArabic(input), expected);
});

test('Validates allowed prayer phrases correctly', () => {
  const allowed = config.defaultPhrases;

  // Exact matching with diacritics
  const res1 = validatePrayerMessage('اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', allowed);
  assert.strictEqual(res1.isValid, true);

  // Spelling variation (صلي instead of صل)
  const res2 = validatePrayerMessage('اللهم صلي وسلم على نبينا محمد', allowed);
  assert.strictEqual(res2.isValid, true);

  // Ligature ﷺ
  const res3 = validatePrayerMessage('ﷺ', allowed);
  assert.strictEqual(res3.isValid, true);

  // Short formula
  const res4 = validatePrayerMessage('صلى الله عليه وسلم', allowed);
  assert.strictEqual(res4.isValid, true);

  // Invalid chat messages
  const res5 = validatePrayerMessage('hello there', allowed);
  assert.strictEqual(res5.isValid, false);

  const res6 = validatePrayerMessage('123', allowed);
  assert.strictEqual(res6.isValid, false);

  const res7 = validatePrayerMessage('صباح الخير جميعاً', allowed);
  assert.strictEqual(res7.isValid, false);
});

// ==========================================
// 2. Custom Emoji & Duplicate Digit Tests
// ==========================================
console.log('\n--- 2. Custom Emoji & Duplicate Digit Tests ---');

test('Decomposes single digit numbers correctly', () => {
  const res = getEmojiNamesForNumber(5);
  assert.deepStrictEqual(res, ['num_5_a']);
});

test('Decomposes numbers with distinct digits', () => {
  const res = getEmojiNamesForNumber(42);
  assert.deepStrictEqual(res, ['num_4_a', 'num_2_a']);
});

test('Handles duplicate digits (100) using alternating sets a & b', () => {
  const res = getEmojiNamesForNumber(100);
  assert.deepStrictEqual(res, ['num_1_a', 'num_0_a', 'num_0_b']);

  // Verify all 3 emojis are distinct (no duplicate reaction collision!)
  const set = new Set(res);
  assert.strictEqual(set.size, 3, '100 must yield 3 distinct emoji names to avoid Discord reaction conflicts');
});

test('Handles 3 duplicate digits (111) using sets a, b, and c', () => {
  const res = getEmojiNamesForNumber(111);
  assert.deepStrictEqual(res, ['num_1_a', 'num_1_b', 'num_1_c']);
  const set = new Set(res);
  assert.strictEqual(set.size, 3);
});

test('Handles 4 duplicate digits (2222) using sets a, b, c, and d', () => {
  const res = getEmojiNamesForNumber(2222);
  assert.deepStrictEqual(res, ['num_2_a', 'num_2_b', 'num_2_c', 'num_2_d']);
  const set = new Set(res);
  assert.strictEqual(set.size, 4);
});

test('Handles interspersed duplicates (1010)', () => {
  const res = getEmojiNamesForNumber(1010);
  assert.deepStrictEqual(res, ['num_1_a', 'num_0_a', 'num_1_b', 'num_0_b']);
  const set = new Set(res);
  assert.strictEqual(set.size, 4);
});

// ==========================================
// 3. Milestone Detection Tests
// ==========================================
console.log('\n--- 3. Milestone Detection Tests ---');

test('Detects milestone values correctly', () => {
  assert.strictEqual(isMilestone(10), true);
  assert.strictEqual(isMilestone(50), true);
  assert.strictEqual(isMilestone(100), true);
  assert.strictEqual(isMilestone(250), true);
  assert.strictEqual(isMilestone(500), true);
  assert.strictEqual(isMilestone(1000), true);
  assert.strictEqual(isMilestone(10000), true);

  assert.strictEqual(isMilestone(1), false);
  assert.strictEqual(isMilestone(7), false);
  assert.strictEqual(isMilestone(42), false);
  assert.strictEqual(isMilestone(99), false);
});

// ==========================================
// 4. Storage & State Management Tests
// ==========================================
console.log('\n--- 4. Storage & State Management Tests ---');

const storage = require('../src/utils/storage');

test('Initializes default guild data correctly', () => {
  const data = storage.getGuildData('test_guild_1');
  assert.strictEqual(data.currentCount, 0);
  assert.strictEqual(data.highScore, 0);
  assert.strictEqual(Array.isArray(data.phrases), true);
  assert.strictEqual(data.phrases.length, config.defaultPhrases.length);
});

test('Increments count and updates high score & contributors', () => {
  storage.resetCount('test_guild_1', 0);
  const updated1 = storage.incrementCount('test_guild_1', 'user_A', 'msg_101');
  assert.strictEqual(updated1.currentCount, 1);
  assert.strictEqual(updated1.highScore, 1);
  assert.strictEqual(updated1.lastUserId, 'user_A');

  const updated2 = storage.incrementCount('test_guild_1', 'user_B', 'msg_102');
  assert.strictEqual(updated2.currentCount, 2);
  assert.strictEqual(updated2.highScore, 2);
  assert.strictEqual(updated2.lastUserId, 'user_B');

  const top = storage.getTopContributors('test_guild_1');
  assert.strictEqual(top.length >= 2, true);
});

test('Adds and removes custom phrases', () => {
  const customPhrase = 'اللهم صل وسلم على سيدنا وحبيبنا محمد';
  const added = storage.addPhrase('test_guild_1', customPhrase);
  assert.strictEqual(added, true);

  const guild = storage.getGuildData('test_guild_1');
  assert.strictEqual(guild.phrases.includes(customPhrase), true);

  const removed = storage.removePhrase('test_guild_1', customPhrase);
  assert.strictEqual(removed, true);
  assert.strictEqual(storage.getGuildData('test_guild_1').phrases.includes(customPhrase), false);
});

test('Updates and retrieves settings', () => {
  storage.updateSettings('test_guild_1', { allowConsecutiveTurns: true, cooldownSeconds: 5 });
  const settings = storage.getGuildData('test_guild_1').settings;
  assert.strictEqual(settings.allowConsecutiveTurns, true);
  assert.strictEqual(settings.cooldownSeconds, 5);

  // Clean up test guild data
  const fs = require('fs');
  const path = require('path');
  const dataPath = path.join(__dirname, '../data/guild_data.json');
  if (fs.existsSync(dataPath)) {
    try {
      const all = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      delete all['test_guild_1'];
      fs.writeFileSync(dataPath, JSON.stringify(all, null, 2), 'utf8');
    } catch (_) {}
  }
});

// ==========================================
// Summary
// ==========================================
console.log('\n=============================================');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} Passed`);
if (passedTests === totalTests) {
  console.log('🎉 All automated tests completed successfully!');
  console.log('=============================================\n');
  process.exit(0);
} else {
  console.error('💥 Some tests failed!');
  console.log('=============================================\n');
  process.exit(1);
}
