const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[READY] Logged in as ${client.user.tag} (ID: ${client.user.id})`);
    console.log(`[READY] Serving ${client.guilds.cache.size} server(s)`);

    // Fetch application emojis into cache
    try {
      if (client.application && client.application.emojis) {
        const appEmojis = await client.application.emojis.fetch();
        console.log(`[EMOJIS] Loaded ${appEmojis.size} application emojis into cache.`);
      }
    } catch (err) {
      console.warn(`[EMOJIS] Could not fetch application emojis: ${err.message}`);
    }

    // Set bot presence
    client.user.setPresence({
      activities: [
        {
          name: 'الصلاة على النبي ﷺ | /stats',
          type: ActivityType.Custom,
        },
      ],
      status: 'online',
    });
  },
};
