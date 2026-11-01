const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('عيّن القناة الرسمية للصلاة على النبي / Set the official counting channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('القناة المراد تعيينها / The channel to designate')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    storage.setChannel(interaction.guildId, channel.id);
    const guildData = storage.getGuildData(interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor('#D4AF37')
      .setTitle('✨ تم تعيين قناة الصلاة على النبي بنجاح')
      .setDescription(
        `تم تحديد القناة **${channel}** لتكون القناة الرسمية لعدّ الصلاة على النبي ﷺ.\n\n` +
        `**العدد الحالي:** \`${guildData.currentCount}\`\n` +
        `**أعلى رقم قياسي:** \`${guildData.highScore}\`\n\n` +
        `*تذكير: أي رسالة لا تحتوي على صيغة صلاة مقبولة سيتم حذفها تلقائياً للمحافظة على تنظيم القناة.*`
      )
      .setFooter({ text: 'اللهم صل وسلم على نبينا محمد', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
