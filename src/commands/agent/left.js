const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { getAgentBySid } = require('../../utils/db');
const { AUDIT_CHANNEL } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agent-left')
    .setDescription('Запрос на увольнение по собственному желанию')
    .addStringOption(o =>
      o.setName('sid')
        .setDescription('Твой SID')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Причина увольнения')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const sid = interaction.options.getString('sid');
    const reason = interaction.options.getString('reason');

    const agent = getAgentBySid(sid);

    if (!agent || agent.discordId !== interaction.user.id) {
      return interaction.reply({
        content: '❌ В базе нет агента с таким SID, привязанного к твоему аккаунту.',
        ephemeral: true
      });
    }

    const auditChannel = await client.channels.fetch(AUDIT_CHANNEL).catch(() => null);
    if (!auditChannel) {
      return interaction.reply({
        content: 'Канал аудита не найден. Сообщи администрации.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🟡 Запрос на увольнение по собственному')
      .addFields(
        { name: 'Агент', value: `${interaction.user} / SID #${sid}` },
        { name: 'Причина', value: reason }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`leave_accept_${sid}`)
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`leave_decline_${sid}`)
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    await auditChannel.send({
      content: '<@1432734700065263683> <@1432734700065263685>',
      embeds: [embed],
      components: [row]
    });

    interaction.reply({
      content: '✅ Твой запрос на увольнение отправлен на рассмотрение.',
      ephemeral: true
    });
  }
};
