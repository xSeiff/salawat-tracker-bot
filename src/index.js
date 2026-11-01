require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const token = process.env.DISCORD_TOKEN;

if (!token || token.trim() === '' || token === 'your_bot_token_here') {
  console.error('\n❌ ERROR: DISCORD_TOKEN is missing or not configured in .env!');
  console.error('👉 Please copy .env.example to .env and fill in your Bot Token & Client ID.');
  console.error('   See README.md for complete instructions.\n');
  process.exit(1);
}

// Initialize Client with required intents and partials
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged Intent required to read prayer messages
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`[COMMAND] Loaded /${command.data.name}`);
    } else {
      console.warn(`[WARN] Command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[EVENT] Registered event: ${event.name}`);
  }
}

// Global process error handlers
process.on('unhandledRejection', error => {
  console.error('[UNHANDLED REJECTION]:', error);
});

process.on('uncaughtException', error => {
  console.error('[UNCAUGHT EXCEPTION]:', error);
});

// Log in
console.log('⏳ Connecting to Discord Gateway...');
client.login(token).catch(err => {
  console.error('❌ Failed to login to Discord:', err.message);
  if (err.message.includes('disallowed intents')) {
    console.error('\n⚠️ IMPORTANT: You must enable "MESSAGE CONTENT INTENT" in the Discord Developer Portal:');
    console.error('   1. Go to https://discord.com/developers/applications');
    console.error('   2. Select your Bot -> Bot tab');
    console.error('   3. Scroll to "Privileged Gateway Intents"');
    console.error('   4. Check "MESSAGE CONTENT INTENT" and click Save Changes.\n');
  }
});
