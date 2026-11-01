const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('phrases')
    .setDescription('إدارة صيغ الصلاة على النبي المقبولة / Manage accepted Salawat phrases')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('عرض قائمة الصيغ المقبولة حالياً / List current accepted phrases')
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('إضافة صيغة صلاة جديدة للقائمة المقبولة / Add a new accepted phrase')
        .addStringOption(opt =>
          opt
            .setName('phrase')
            .setDescription('صيغة الصلاة المراد إضافتها / The phrase to add')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('حذف صيغة من القائمة المقبولة / Remove an accepted phrase')
        .addStringOption(opt =>
          opt
            .setName('phrase')
            .setDescription('الصيغة المراد إزالتها بالضبط / The phrase to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('إعادة تعيين القائمة إلى الصيغ الافتراضية / Reset phrases to default')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildData = storage.getGuildData(interaction.guildId);

    // Require ManageGuild permission for modifying phrases
    if (subcommand !== 'list' && !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '⚠️ تحتاج إلى صلاحية إدارة السيرفر (`Manage Server`) لتعديل صيغ الصلاة.',
        ephemeral: true,
      });
    }

    if (subcommand === 'list') {
      const phraseList = guildData.phrases.map((p, i) => `${i + 1}. **${p}**`).join('\n');
      const embed = new EmbedBuilder()
        .setColor('#D4AF37')
        .setTitle('📜 قائمة صيغ الصلاة على النبي المقبولة')
        .setDescription(phraseList || 'لا توجد صيغ مسجلة حالياً.')
        .setFooter({ text: `إجمالي الصيغ: ${guildData.phrases.length}`, iconURL: interaction.client.user.displayAvatarURL() });

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'add') {
      const newPhrase = interaction.options.getString('phrase').trim();
      const added = storage.addPhrase(interaction.guildId, newPhrase);

      if (!added) {
        return interaction.reply({
          content: `⚠️ الصيغة **"${newPhrase}"** موجودة بالفعل في القائمة المقبولة!`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ تمت إضافة الصيغة بنجاح')
        .setDescription(`تمت إضافة: **"${newPhrase}"**\nأصبح بإمكان الأعضاء الآن إرسال هذه الصيغة للعد.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'remove') {
      const phraseToRemove = interaction.options.getString('phrase').trim();
      const removed = storage.removePhrase(interaction.guildId, phraseToRemove);

      if (!removed) {
        return interaction.reply({
          content: `❌ لم يتم العثور على الصيغة **"${phraseToRemove}"** في القائمة! يمكنك استخدام \`/phrases list\` لمعرفة الصيغ المتاحة.`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#E67E22')
        .setTitle('🗑️ تم حذف الصيغة')
        .setDescription(`تمت إزالة: **"${phraseToRemove}"** من القائمة المقبولة.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'reset') {
      const defaultList = storage.resetPhrases(interaction.guildId);
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🔄 تمت إعادة التعيين للوضع الافتراضي')
        .setDescription(`تمت استعادة الصيغ الافتراضية بنجاح (${defaultList.length} صيغة).`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
