const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAgentBySid } = require('../../utils/db');
const { RANKS } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agent-info')
    .setDescription('Показать информацию об агенте по SID')
    .addStringOption(o =>
      o.setName('sid')
        .setDescription('Static ID агента (без #)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const sid = interaction.options.getString('sid');
    const agent = getAgentBySid(sid);

    if (!agent) {
      return interaction.reply({
        content: '❌ Агент с таким SID не найден.',
        ephemeral: true
      });
    }

    const joinDate = agent.joinDate || 'неизвестно';
    let daysInFamily = 'неизвестно';
    if (agent.joinDate) {
      const diffMs = Date.now() - new Date(agent.joinDate).getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      daysInFamily = `${days} дн.`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🧾 Агент #${sid}`)
      .addFields(
        { name: 'Имя', value: agent.name || '—' },
        { name: 'Discord ID', value: `\`${agent.discordId}\`` },
        {
          name: 'Ранг',
          value: `${agent.rank} — ${RANKS[agent.rank] || 'неизвестно'}`,
          inline: true
        },
        { name: 'Дата приглашения', value: joinDate, inline: true },
        { name: 'Сколько в семье', value: daysInFamily, inline: false },
        {
          name: 'Статус',
          value: agent.left ? `Уволен (${agent.left})` : 'В семье',
          inline: true
        },
        {
          name: 'Чёрный список',
          value: agent.blacklist ? '🚫 В ЧС' : '✅ Нет',
          inline: true
        }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
