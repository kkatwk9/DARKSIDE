const { Events, EmbedBuilder } = require('discord.js');
const { LOGS_CHANNEL } = require('../config');

async function sendLog(client, embed) {
  if (!LOGS_CHANNEL) return;
  const ch = await client.channels.fetch(LOGS_CHANNEL).catch(() => null);
  if (!ch) return;
  ch.send({ embeds: [embed] });
}

module.exports = {
  name: Events.ClientReady,
  once: false,
  async execute(client) {
    client.on(Events.GuildMemberAdd, async member => {
      const e = new EmbedBuilder()
        .setTitle('👋 Вход на сервер')
        .setDescription(`${member} зашел на сервер`)
        .setTimestamp();
      await sendLog(client, e);
    });

    client.on(Events.GuildMemberRemove, async member => {
      const e = new EmbedBuilder()
        .setTitle('🚪 Выход с сервера')
        .setDescription(`${member.user.tag} покинул сервер`)
        .setTimestamp();
      await sendLog(client, e);
    });
  }
};
