const storage = require('../utils/storage');
const { validatePrayerMessage } = require('../utils/arabicNormalizer');
const { reactNumberToMessage } = require('../utils/emojiManager');

// Memory map for user cooldowns: key = `${guildId}_${userId}`, value = timestamp
const userCooldowns = new Map();

/**
 * Sends a self-deleting feedback message to the channel
 * @param {import('discord.js').TextChannel} channel
 * @param {string} content
 * @param {number} seconds
 */
async function sendTemporaryNotice(channel, content, seconds = 3) {
  try {
    const notice = await channel.send({ content });
    setTimeout(() => {
      notice.delete().catch(() => {});
    }, seconds * 1000);
  } catch (err) {
    console.warn('[NOTICE] Could not send notice message:', err.message);
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bot messages, system messages, or DMs
    if (message.author.bot || !message.guild || message.system) return;

    const guildData = storage.getGuildData(message.guildId);

    // Only process messages in the official counting channel
    if (!guildData.channelId || message.channelId !== guildData.channelId) {
      return;
    }

    const settings = guildData.settings || {};
    const deleteNotice = settings.sendSelfDeletingNotice ?? false;
    const noticeSeconds = settings.deleteNoticeSeconds || 3;
    const cooldownMs = (settings.cooldownSeconds || 0) * 1000;

    // 1. Check user cooldown
    const cooldownKey = `${message.guildId}_${message.author.id}`;
    const now = Date.now();
    const lastUserTime = userCooldowns.get(cooldownKey) || 0;

    if (cooldownMs > 0 && now - lastUserTime < cooldownMs) {
      await message.delete().catch(err => {
        console.warn('[DELETE] Missing Manage Messages permission:', err.message);
      });

      if (deleteNotice) {
        await sendTemporaryNotice(
          message.channel,
          `⏱️ ${message.author} يرجى الانتظار ثوانٍ معدودة قبل إرسال الصلاة التالية.`,
          noticeSeconds
        );
      }
      return;
    }

    // 2. Check turn enforcement (consecutive turns)
    if (!settings.allowConsecutiveTurns && guildData.lastUserId === message.author.id) {
      await message.delete().catch(err => {
        console.warn('[DELETE] Missing Manage Messages permission:', err.message);
      });

      if (deleteNotice) {
        await sendTemporaryNotice(
          message.channel,
          `⚠️ ${message.author} لا يمكنك إرسال صلاتين متتاليتين! دع عضواً آخر يصلي على النبي أولاً للتناوب.`,
          noticeSeconds
        );
      }
      return;
    }

    // 3. Validate prayer content
    const validation = validatePrayerMessage(message.content, guildData.phrases);

    if (!validation.isValid) {
      // Invalid message - auto delete
      await message.delete().catch(err => {
        console.warn('[DELETE] Missing Manage Messages permission:', err.message);
      });

      if (deleteNotice) {
        await sendTemporaryNotice(
          message.channel,
          `❌ ${message.author} هذه القناة مخصصة للصلاة على النبي ﷺ فقط (استخدم \`/phrases list\` لرؤية الصيغ المعتمدة).`,
          noticeSeconds
        );
      }
      return;
    }

    // 4. Valid prayer message! Increment count and record state
    userCooldowns.set(cooldownKey, now);
    const updated = storage.incrementCount(message.guildId, message.author.id, message.id);

    // 5. React with custom number emojis
    try {
      await reactNumberToMessage(message, updated.currentCount, client);
    } catch (err) {
      console.error('[REACTION ERROR] Failed to react with count:', err.message);
    }
  },
};
