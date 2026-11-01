const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetcount')
    .setDescription('إعادة ضبط أو تعديل العداد (للمشرفين فقط) / Reset or adjust the counter')
    .addIntegerOption(option =>
      option
        .setName('number')
        .setDescription('الرقم الجديد للعداد (افتراضياً 0) / New count number (default 0)')
        .setMinValue(0)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب إعادة الضبط / Reason for reset')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const newCount = interaction.options.getInteger('number') ?? 0;
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';

    const previousData = storage.getGuildData(interaction.guildId);
    const prevCount = previousData.currentCount;

    storage.resetCount(interaction.guildId, newCount, null);

    const embed = new EmbedBuilder()
      .setColor('#C0392B')
      .setTitle('🔄 تم تعديل عداد الصلاة على النبي')
      .setDescription(
        `قام المشرف **${interaction.user}** بتعديل العداد.\n\n` +
        `• **العدد السابق:** \`${prevCount}\`\n` +
        `• **العدد الجديد:** \`${newCount}\`\n` +
        `• **السبب:** ${reason}`
      )
      .setFooter({ text: 'تمت العملية بواسطة إدارة السيرفر', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
