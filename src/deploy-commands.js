require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Error: DISCORD_TOKEN and CLIENT_ID are required in .env!');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[LOAD] Loaded command: /${command.data.name}`);
  } else {
    console.warn(`[WARN] Command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands...`);

    let data;
    if (guildId && guildId.trim() !== '') {
      // Register commands to specific guild for instant updates
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId.trim()),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} commands to GUILD ${guildId}! (Instant availability)`);
    } else {
      // Register global commands
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} commands GLOBALLY across Discord!`);
    }
  } catch (error) {
    console.error('❌ Error deploying slash commands:', error);
  }
})();
