require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { generateAllBadges } = require('./utils/badgeGenerator');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('❌ Error: DISCORD_TOKEN and CLIENT_ID are required in .env!');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);
const EMOJI_CACHE_FILE = path.join(__dirname, '../data/emojis.json');

(async () => {
  try {
    console.log('🎨 Step 1: Generating custom gold number badge graphics...');
    const badgeFiles = generateAllBadges();
    const badgeKeys = Object.keys(badgeFiles);
    console.log(`✅ Successfully generated ${badgeKeys.length} badge images in assets/emojis/\n`);

    console.log('🌐 Step 2: Fetching existing Discord Application Emojis...');
    const existingEmojis = await rest.get(Routes.applicationEmojis(clientId));
    console.log(`Found ${existingEmojis.items ? existingEmojis.items.length : existingEmojis.length} existing application emojis.\n`);

    const existingMap = new Map();
    const items = existingEmojis.items || existingEmojis;
    for (const em of items) {
      existingMap.set(em.name, em.id);
    }

    console.log('🚀 Step 3: Uploading missing custom number emojis to your Discord Bot Application...');
    const emojiIdMap = {};
    let uploadCount = 0;
    let skippedCount = 0;

    for (const emojiName of badgeKeys) {
      if (existingMap.has(emojiName)) {
        emojiIdMap[emojiName] = existingMap.get(emojiName);
        skippedCount++;
        continue;
      }

      const filePath = badgeFiles[emojiName];
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

      try {
        const created = await rest.post(
          Routes.applicationEmojis(clientId),
          {
            body: {
              name: emojiName,
              image: base64Image,
            },
          }
        );
        emojiIdMap[emojiName] = created.id;
        uploadCount++;
        console.log(`  [+] Uploaded (${uploadCount}/${badgeKeys.length - skippedCount}): ${emojiName} (ID: ${created.id})`);

        // Small delay to respect Discord rate limits
        await new Promise(res => setTimeout(res, 250));
      } catch (err) {
        console.error(`  [!] Failed to upload ${emojiName}:`, err.message);
      }
    }

    // Save emoji cache to data/emojis.json
    fs.writeFileSync(EMOJI_CACHE_FILE, JSON.stringify(emojiIdMap, null, 2), 'utf8');

    console.log('\n=============================================');
    console.log(`🎉 Done! Emojis setup complete.`);
    console.log(`  • New Emojis Uploaded: ${uploadCount}`);
    console.log(`  • Already Registered:  ${skippedCount}`);
    console.log(`  • Total Active Badges: ${Object.keys(emojiIdMap).length}`);
    console.log(`Saved emoji mapping to data/emojis.json`);
    console.log('=============================================\n');
  } catch (error) {
    console.error('❌ Failed to setup emojis:', error);
  }
})();
