const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { PANEL_CHANNEL } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply-panel')
    .setDescription('Создать панель заявок в канале'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'Нет прав для этой команды.', ephemeral: true });
    }

    if (PANEL_CHANNEL && interaction.channelId !== PANEL_CHANNEL) {
      return interaction.reply({
        content: 'Панель можно создать только в специально указанном канале.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📩 Панель заявок — Darkside')
      .setDescription('Выберите тип заявки:')
      .setColor(0x5865f2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('apply_join')
        .setLabel('Вступление')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('apply_restore')
        .setLabel('Восстановление')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('apply_unban')
        .setLabel('Снятие ЧС')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
