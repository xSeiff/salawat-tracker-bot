const fs = require('fs');
const path = require('path');
const config = require('../../data/config.json');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'guild_data.json');
const TEMP_FILE = path.join(DATA_DIR, 'guild_data.tmp.json');

// In-memory cache
let dataCache = null;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

function loadData() {
  if (dataCache !== null) return dataCache;

  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    dataCache = JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file, initializing empty store:', err);
    dataCache = {};
  }
  return dataCache;
}

function saveData() {
  try {
    ensureDataFile();
    const content = JSON.stringify(dataCache, null, 2);
    fs.writeFileSync(TEMP_FILE, content, 'utf8');
    fs.renameSync(TEMP_FILE, DATA_FILE);
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

/**
 * Returns default guild data structure
 */
function createDefaultGuildData() {
  return {
    channelId: null,
    currentCount: 0,
    highScore: 0,
    lastUserId: null,
    lastMessageId: null,
    lastCountTimestamp: null,
    phrases: [...config.defaultPhrases],
    settings: { ...config.defaultSettings },
    contributors: {},
  };
}

/**
 * Get or initialize guild data
 */
function getGuildData(guildId) {
  const all = loadData();
  if (!all[guildId]) {
    all[guildId] = createDefaultGuildData();
    saveData();
  } else {
    // Ensure missing fields are populated
    let modified = false;
    if (!all[guildId].phrases || all[guildId].phrases.length === 0) {
      all[guildId].phrases = [...config.defaultPhrases];
      modified = true;
    }
    if (!all[guildId].settings) {
      all[guildId].settings = { ...config.defaultSettings };
      modified = true;
    }
    if (!all[guildId].contributors) {
      all[guildId].contributors = {};
      modified = true;
    }
    if (modified) saveData();
  }
  return all[guildId];
}

/**
 * Update partial guild data
 */
function updateGuildData(guildId, updates) {
  const guild = getGuildData(guildId);
  Object.assign(guild, updates);
  saveData();
  return guild;
}

/**
 * Atomically increments count and tracks user contribution
 */
function incrementCount(guildId, userId, messageId) {
  const guild = getGuildData(guildId);
  guild.currentCount += 1;
  if (guild.currentCount > guild.highScore) {
    guild.highScore = guild.currentCount;
  }
  guild.lastUserId = userId;
  guild.lastMessageId = messageId;
  guild.lastCountTimestamp = Date.now();

  guild.contributors[userId] = (guild.contributors[userId] || 0) + 1;

  saveData();
  return guild;
}

/**
 * Resets or overrides count
 */
function resetCount(guildId, newCount = 0, lastUserId = null) {
  const guild = getGuildData(guildId);
  guild.currentCount = Math.max(0, parseInt(newCount, 10) || 0);
  guild.lastUserId = lastUserId;
  guild.lastMessageId = null;
  guild.lastCountTimestamp = Date.now();
  saveData();
  return guild;
}

/**
 * Sets counting channel
 */
function setChannel(guildId, channelId) {
  return updateGuildData(guildId, { channelId });
}

/**
 * Adds a new allowed phrase
 */
function addPhrase(guildId, phrase) {
  const guild = getGuildData(guildId);
  const trimmed = phrase.trim();
  if (!guild.phrases.includes(trimmed)) {
    guild.phrases.push(trimmed);
    saveData();
    return true;
  }
  return false;
}

/**
 * Removes an allowed phrase
 */
function removePhrase(guildId, phrase) {
  const guild = getGuildData(guildId);
  const trimmed = phrase.trim();
  const index = guild.phrases.indexOf(trimmed);
  if (index !== -1) {
    guild.phrases.splice(index, 1);
    saveData();
    return true;
  }
  return false;
}

/**
 * Resets phrases to default list
 */
function resetPhrases(guildId) {
  const guild = getGuildData(guildId);
  guild.phrases = [...config.defaultPhrases];
  saveData();
  return guild.phrases;
}

/**
 * Updates settings
 */
function updateSettings(guildId, newSettings) {
  const guild = getGuildData(guildId);
  guild.settings = { ...guild.settings, ...newSettings };
  saveData();
  return guild.settings;
}

/**
 * Gets top contributors for leaderboard
 */
function getTopContributors(guildId, limit = 5) {
  const guild = getGuildData(guildId);
  const entries = Object.entries(guild.contributors || {});
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit).map(([userId, count]) => ({ userId, count }));
}

module.exports = {
  getGuildData,
  updateGuildData,
  incrementCount,
  resetCount,
  setChannel,
  addPhrase,
  removePhrase,
  resetPhrases,
  updateSettings,
  getTopContributors,
};
