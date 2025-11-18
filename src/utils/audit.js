const { EmbedBuilder } = require('discord.js');
const { AUDIT_CHANNEL } = require('../config');

async function sendAudit(client, title, description, fields = []) {
  if (!AUDIT_CHANNEL) return;
  const ch = await client.channels.fetch(AUDIT_CHANNEL).catch(() => null);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setTimestamp();

  ch.send({ embeds: [embed] });
}

module.exports = { sendAudit };
