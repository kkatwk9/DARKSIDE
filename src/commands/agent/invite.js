const { SlashCommandBuilder } = require('discord.js');
const { getAgentBySid, updateAgent } = require('../../utils/db');
const { sendAudit } = require('../../utils/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agent-invite')
    .setDescription('Отметить приглашение агента в семью')
    .addStringOption(o =>
      o.setName('yousid')
        .setDescription('Твой Static ID')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('targetsid')
        .setDescription('SID агента')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const youSid = interaction.options.getString('yousid');
    const targetSid = interaction.options.getString('targetsid');

    const you = getAgentBySid(youSid);
    const target = getAgentBySid(targetSid);

    if (!you) {
      return interaction.reply({
        content: '❌ Твой SID не найден в базе. Обратись к старшему составу.',
        ephemeral: true
      });
    }

    if (!target) {
      return interaction.reply({
        content: '❌ Агент с таким SID не найден. Сначала используй `/agent-create`.',
        ephemeral: true
      });
    }

    updateAgent(targetSid, {
      invitedBySid: youSid,
      left: null
    });

    await sendAudit(
      client,
      '📥 Invite агента',
      `${interaction.user} отметил приглашение агента.`,
      [
        { name: 'Пригласивший SID', value: `#${youSid}` },
        { name: 'Агент SID', value: `#${targetSid}` }
      ]
    );

    interaction.reply(
      `✅ Агент **${target.name}** (SID #${targetSid}) отмечен как приглашённый тобой (SID #${youSid}).`
    );
  }
};
