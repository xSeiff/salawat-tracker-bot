const fs = require('fs');
const path = require('path');
const config = require('../../data/config.json');

const SETS = ['a', 'b', 'c', 'd'];

// Unicode keycap fallbacks if custom emojis are not yet uploaded
const UNICODE_DIGITS = {
  '0': '0️⃣',
  '1': '1️⃣',
  '2': '2️⃣',
  '3': '3️⃣',
  '4': '4️⃣',
  '5': '5️⃣',
  '6': '6️⃣',
  '7': '7️⃣',
  '8': '8️⃣',
  '9': '9️⃣',
};

/**
 * Decomposes a number into a sequence of custom emoji names,
 * assigning alternating sets ('a', 'b', 'c', 'd') to repeated digits.
 * 
 * Example:
 * 100 -> ['num_1_a', 'num_0_a', 'num_0_b']
 * 111 -> ['num_1_a', 'num_1_b', 'num_1_c']
 * 1010 -> ['num_1_a', 'num_0_a', 'num_1_b', 'num_0_b']
 * 
 * @param {number|string} count
 * @returns {string[]} Array of emoji names
 */
function getEmojiNamesForNumber(count) {
  const digits = String(count).split('');
  const digitUsage = {};
  const emojiNames = [];

  for (const digit of digits) {
    if (!/^[0-9]$/.test(digit)) continue;

    const usageIndex = digitUsage[digit] || 0;
    const setKey = SETS[usageIndex % SETS.length];
    digitUsage[digit] = usageIndex + 1;

    emojiNames.push(`num_${digit}_${setKey}`);
  }

  return emojiNames;
}

let localEmojiMap = null;

function getLocalEmojiMap() {
  if (localEmojiMap !== null) return localEmojiMap;
  const emojiCachePath = path.join(__dirname, '../../data/emojis.json');
  if (fs.existsSync(emojiCachePath)) {
    try {
      localEmojiMap = JSON.parse(fs.readFileSync(emojiCachePath, 'utf8'));
    } catch (_) {
      localEmojiMap = {};
    }
  } else {
    localEmojiMap = {};
  }
  return localEmojiMap;
}

/**
 * Resolves an emoji name to an Emoji object, formatted string, or fallback unicode string
 * Searches in Application Emojis, Local Emoji Map, and Client Guild Emojis.
 * 
 * @param {import('discord.js').Client} client
 * @param {string} emojiName
 * @param {string} fallbackDigit
 * @returns {any}
 */
function resolveEmoji(client, emojiName, fallbackDigit) {
  // 1. Search application emojis cached on client
  if (client && client.application && client.application.emojis) {
    const appEmoji = client.application.emojis.cache.find(e => e.name === emojiName);
    if (appEmoji) return appEmoji;
  }

  // 2. Search local emoji ID map
  const map = getLocalEmojiMap();
  if (map && map[emojiName]) {
    return map[emojiName];
  }

  // 3. Search guild emojis cached across the client
  if (client && client.emojis && client.emojis.cache) {
    const guildEmoji = client.emojis.cache.find(e => e.name === emojiName);
    if (guildEmoji) return guildEmoji;
  }

  // 4. Fallback to unicode digit if custom emoji is not registered yet
  return UNICODE_DIGITS[fallbackDigit] || '✅';
}

/**
 * Checks if a given count is a milestone
 * @param {number} count
 * @param {number[]} customMilestones
 * @returns {boolean}
 */
function isMilestone(count, customMilestones = config.milestones) {
  if (count <= 0) return false;

  // Exact custom milestones
  if (customMilestones && customMilestones.includes(count)) return true;

  // Powers of 10: 10, 100, 1000, 10000, etc. (must be >= 10)
  if (count >= 10) {
    const log10 = Math.log10(count);
    if (Math.abs(log10 - Math.round(log10)) < 1e-9) return true;
  }

  // Multiples of 100
  if (count % 100 === 0) return true;

  // Multiples of 50 for counts < 1000
  if (count < 1000 && count % 50 === 0) return true;

  return false;
}

/**
 * Reacts to a message with the sequential number emojis representing the count.
 * Adds celebratory reactions if milestone is reached.
 * 
 * @param {import('discord.js').Message} message
 * @param {number} count
 * @param {import('discord.js').Client} client
 */
async function reactNumberToMessage(message, count, client) {
  const emojiNames = getEmojiNamesForNumber(count);
  const digits = String(count).split('');

  // Add digit reactions in sequential order
  for (let i = 0; i < emojiNames.length; i++) {
    const emojiName = emojiNames[i];
    const digit = digits[i];
    const emoji = resolveEmoji(client, emojiName, digit);

    try {
      await message.react(emoji);
      // Small pause to preserve visual reaction order
      if (emojiNames.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (err) {
      console.error(`Failed to react with emoji ${emojiName}:`, err.message);
      // Fallback to unicode if custom emoji failed
      if (typeof emoji !== 'string' && UNICODE_DIGITS[digit]) {
        try {
          await message.react(UNICODE_DIGITS[digit]);
        } catch (_) {}
      }
    }
  }

  // Milestone celebratory reaction spam
  if (isMilestone(count)) {
    const milestoneEmojis = config.milestoneReactions || ['🎉', '✨', '🌟', '⭐', '🏆', '👑', '🚀', '💚'];
    for (const mEmoji of milestoneEmojis) {
      try {
        await message.react(mEmoji);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (_) {}
    }
  }
}

module.exports = {
  SETS,
  UNICODE_DIGITS,
  getEmojiNamesForNumber,
  resolveEmoji,
  isMilestone,
  reactNumberToMessage,
};
