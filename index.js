require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

client.commands = new Collection();

// === Загрузка команд ===
const commandsPath = path.join(__dirname, 'src', 'commands');
for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const command = require(path.join(folderPath, file));
    client.commands.set(command.data.name, command);
  }
}

// === Загрузка событий ===
const eventsPath = path.join(__dirname, 'src', 'events');
for (const file of fs.readdirSync(eventsPath)) {
  if (!file.endsWith('.js')) continue;
  const event = require(path.join(eventsPath, file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

client.login(process.env.TOKEN);
