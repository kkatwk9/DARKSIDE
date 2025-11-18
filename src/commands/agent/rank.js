const { SlashCommandBuilder } = require('discord.js');
const { getAgentBySid, updateAgent } = require('../../utils/db');
const { sendAudit } = require('../../utils/audit');
const { RANKS } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agent-rank')
    .setDescription('Повысить или понизить агента')
    .addStringOption(o =>
      o.setName('yousid')
        .setDescription('Твой SID')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('targetsid')
        .setDescription('SID агента, которого меняешь')
        .setRequired(true)
    )
    .addIntegerOption(o => {
      let opt = o
        .setName('rank')
        .setDescription('Новый ранг')
        .setRequired(true);
      for (const [value, name] of Object.entries(RANKS)) {
        opt = opt.addChoices({ name: `${value} - ${name}`, value: Number(value) });
      }
      return opt;
    })
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Причина изменения ранга')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const youSid = interaction.options.getString('yousid');
    const targetSid = interaction.options.getString('targetsid');
    const newRank = interaction.options.getInteger('rank');
    const reason = interaction.options.getString('reason');

    const you = getAgentBySid(youSid);
    const target = getAgentBySid(targetSid);

    if (!you) {
      return interaction.reply({
        content: '❌ Твой SID не найден в базе.',
        ephemeral: true
      });
    }

    if (!target) {
      return interaction.reply({
        content: '❌ Агент не найден в базе.',
        ephemeral: true
      });
    }

    if (newRank > you.rank) {
      return interaction.reply({
        content: `❌ Ты не можешь назначить ранг выше своего (${you.rank}).`,
        ephemeral: true
      });
    }

    updateAgent(targetSid, { rank: newRank });

    await sendAudit(
      client,
      '📊 Изменение ранга',
      `${interaction.user} изменил ранг агента.`,
      [
        { name: 'SID агента', value: `#${targetSid}` },
        { name: 'Новый ранг', value: `${newRank} — ${RANKS[newRank]}` },
        { name: 'Причина', value: reason }
      ]
    );

    interaction.reply(
      `✅ Ранг агента **${target.name}** (SID #${targetSid}) изменён на **${newRank} – ${RANKS[newRank]}**.`
    );
  }
};
