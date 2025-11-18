const { Events } = require('discord.js');
const { GUILD_ID } = require('../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    const commands = client.commands.map(c => c.data.toJSON());
    if (GUILD_ID) {
      const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
      if (guild) {
        await guild.commands.set(commands);
        console.log('Guild commands registered');
      }
    } else {
      await client.application.commands.set(commands);
      console.log('Global commands registered');
    }
  }
};
