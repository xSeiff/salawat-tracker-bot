const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('إعدادات وقوانين قناة الصلاة على النبي / Configure Salawat channel rules')
    .addBooleanOption(opt =>
      opt
        .setName('consecutive_turns')
        .setDescription('السماح لنفس الشخص بالعد المتتالي / Allow same user to count consecutively')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt
        .setName('warning_notice')
        .setDescription('إرسال تنبيه مؤقت يُحذف تلقائياً عند الخطأ / Send temporary self-deleting warning')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt
        .setName('cooldown')
        .setDescription('المهلة الزمنية بالثواني بين كل صلاة لنفس الشخص (0-30 ثانية) / Cooldown in seconds')
        .setMinValue(0)
        .setMaxValue(30)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const consecutiveTurns = interaction.options.getBoolean('consecutive_turns');
    const warningNotice = interaction.options.getBoolean('warning_notice');
    const cooldown = interaction.options.getInteger('cooldown');

    const updates = {};
    if (consecutiveTurns !== null) updates.allowConsecutiveTurns = consecutiveTurns;
    if (warningNotice !== null) updates.sendSelfDeletingNotice = warningNotice;
    if (cooldown !== null) updates.cooldownSeconds = cooldown;

    if (Object.keys(updates).length > 0) {
      storage.updateSettings(interaction.guildId, updates);
    }

    const currentSettings = storage.getGuildData(interaction.guildId).settings;

    const embed = new EmbedBuilder()
      .setColor('#D4AF37')
      .setTitle('⚙️ إعدادات قناة الصلاة على النبي')
      .setDescription(
        Object.keys(updates).length > 0
          ? '✅ تم تحديث الإعدادات بنجاح!'
          : 'الإعدادات الحالية للقناة:'
      )
      .addFields(
        {
          name: '🔄 العد المتتالي لنفس العضو',
          value: currentSettings.allowConsecutiveTurns
            ? '✅ مسموح (يمكن للشخص الاستمرار بالعد)'
            : '❌ غير مسموح (يجب التناوب بين الأعضاء)',
          inline: true,
        },
        {
          name: '⚠️ إشعار الحذف التلقائي',
          value: currentSettings.sendSelfDeletingNotice
            ? `✅ مفعل (إشعار يختفي بعد ${currentSettings.deleteNoticeSeconds || 3} ثوانٍ)`
            : '❌ معطل (حذف صامت بدون رسائل)',
          inline: true,
        },
        {
          name: '⏱️ مهلة التكرار (Cooldown)',
          value: `\`${currentSettings.cooldownSeconds || 0}\` ثانية`,
          inline: true,
        }
      )
      .setFooter({ text: 'يمكنك تعديل أي خيار عبر أمر /settings', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
