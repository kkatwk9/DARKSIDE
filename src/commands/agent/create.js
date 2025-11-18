const { SlashCommandBuilder } = require('discord.js');
const { getAgentBySid, setAgent } = require('../../utils/db');
const { sendAudit } = require('../../utils/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agent-create')
    .setDescription('Добавить агента в базу')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Участник Discord')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('name')
        .setDescription('Имя / фамилия агента')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('sid')
        .setDescription('Static ID (без #, только цифры)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const name = interaction.options.getString('name');
    const sid = interaction.options.getString('sid');

    if (getAgentBySid(sid)) {
      return interaction.reply({
        content: '❌ Агент с таким SID уже существует.',
        ephemeral: true
      });
    }

    const today = new Date().toISOString().split('T')[0];

    setAgent(sid, {
      discordId: user.id,
      name,
      rank: 1,
      joinDate: today,
      invitedBySid: null,
      blacklist: false,
      left: null
    });

    await sendAudit(
      client,
      '➕ Создан агент',
      `${interaction.user} добавил агента ${user}.`,
      [
        { name: 'SID', value: `#${sid}` },
        { name: 'Имя', value: name }
      ]
    );

    interaction.reply(`✅ Агент **${name}** добавлен в базу с SID **#${sid}**.`);
  }
};
