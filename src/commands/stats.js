const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('عرض إحصائيات عداد الصلاة على النبي / View Salawat counter statistics'),

  async execute(interaction) {
    const guildData = storage.getGuildData(interaction.guildId);
    const topUsers = storage.getTopContributors(interaction.guildId, 5);

    const channelDisplay = guildData.channelId ? `<#${guildData.channelId}>` : '*(لم يتم تعيين قناة بعد)*';
    const lastUserDisplay = guildData.lastUserId ? `<@${guildData.lastUserId}>` : '*(لا يوجد)*';

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let leaderboardText = 'لا توجد مشاركات مسجلة بعد.';

    if (topUsers.length > 0) {
      leaderboardText = topUsers
        .map((entry, idx) => `${medals[idx]} <@${entry.userId}>: **${entry.count.toLocaleString()}** صلاة`)
        .join('\n');
    }

    const embed = new EmbedBuilder()
      .setColor('#1E5128')
      .setTitle('📊 إحصائيات الصلاة على النبي ﷺ')
      .addFields(
        { name: '🔢 العداد الحالي', value: `\`${guildData.currentCount.toLocaleString()}\``, inline: true },
        { name: '🏆 أعلى رقم قياسي', value: `\`${guildData.highScore.toLocaleString()}\``, inline: true },
        { name: '📢 القناة المعتمدة', value: channelDisplay, inline: true },
        { name: '👤 آخر من صلّى', value: lastUserDisplay, inline: true },
        { name: '📜 عدد الصيغ المقبولة', value: `\`${guildData.phrases.length}\` صيغة`, inline: true },
        { name: '⚙️ تكرار نفس الشخص', value: guildData.settings.allowConsecutiveTurns ? 'مسموح' : 'غير مسموح (بالتناوب)', inline: true },
        { name: '🏅 أكثر المشاركين بركةً (Top 5)', value: leaderboardText, inline: false }
      )
      .setFooter({ text: 'جزاكم الله خيراً ونفع بكم', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
