const { SlashCommandBuilder } = require('discord.js');
const { getAgentBySid, updateAgent } = require('../../utils/db');
const { sendAudit } = require('../../utils/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agent-drop')
    .setDescription('Уволить агента')
    .addStringOption(o =>
      o.setName('yousid')
        .setDescription('Твой SID (должен быть ранг 6+)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('targetsid')
        .setDescription('SID увольняемого агента')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Причина увольнения')
        .setRequired(true)
    )
    .addBooleanOption(o =>
      o.setName('blacklist')
        .setDescription('Занести в чёрный список?')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const youSid = interaction.options.getString('yousid');
    const targetSid = interaction.options.getString('targetsid');
    const reason = interaction.options.getString('reason');
    const bl = interaction.options.getBoolean('blacklist');

    const you = getAgentBySid(youSid);
    const target = getAgentBySid(targetSid);

    if (!you) {
      return interaction.reply({
        content: '❌ Твой SID не найден в базе.',
        ephemeral: true
      });
    }

    if (you.rank < 6) {
      return interaction.reply({
        content: '❌ Увольнять могут только агенты ранга 6 и выше.',
        ephemeral: true
      });
    }

    if (!target) {
      return interaction.reply({
        content: '❌ Агент для увольнения не найден.',
        ephemeral: true
      });
    }

    const member = await interaction.guild.members
      .fetch(target.discordId)
      .catch(() => null);

    if (member) {
      await member.kick(reason).catch(() => null);
    }

    updateAgent(targetSid, {
      left: reason,
      blacklist: bl
    });

    await sendAudit(
      client,
      '❌ Увольнение агента',
      `${interaction.user} уволил агента.`,
      [
        { name: 'SID', value: `#${targetSid}` },
        { name: 'Причина', value: reason },
        { name: 'Чёрный список', value: bl ? 'Да' : 'Нет' }
      ]
    );

    interaction.reply(
      `🛑 Агент **${target.name}** (SID #${targetSid}) уволен. ${bl ? '🚫 Добавлен в ЧС.' : ''}`
    );
  }
};
