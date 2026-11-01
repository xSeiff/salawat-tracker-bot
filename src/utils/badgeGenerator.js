const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const EMOJI_DIR = path.join(__dirname, '../../assets/emojis');

// Color themes for the 3 duplicate sets
const SET_THEMES = {
  a: {
    name: 'Royal Gold',
    bgStart: '#141416',
    bgEnd: '#232328',
    borderColor: '#D4AF37', // Classic metallic gold
    digitColor: '#FFD700',  // Pure gold
    accentColor: '#B8860B', // Dark goldenrod
    innerGlow: 'rgba(212, 175, 55, 0.25)',
  },
  b: {
    name: 'Amber Gold',
    bgStart: '#181512',
    bgEnd: '#292118',
    borderColor: '#F5BD02', // Warm amber gold
    digitColor: '#FFE066',  // Bright amber gold
    accentColor: '#D97706', // Warm amber
    innerGlow: 'rgba(245, 189, 2, 0.25)',
  },
  c: {
    name: 'Champagne Gold',
    bgStart: '#151717',
    bgEnd: '#222728',
    borderColor: '#E6CA65', // Champagne gold
    digitColor: '#FFF2B2',  // Radiant pale gold
    accentColor: '#9A8330', // Deep brass
    innerGlow: 'rgba(230, 202, 101, 0.25)',
  },
  d: {
    name: 'Platinum Gold',
    bgStart: '#181a1c',
    bgEnd: '#25292c',
    borderColor: '#D8DEE9', // Platinum/silver luster
    digitColor: '#ECEFF4',  // Brilliant diamond white
    accentColor: '#8892B0', // Slate highlight
    innerGlow: 'rgba(216, 222, 233, 0.25)',
  },
};

/**
 * Creates an SVG string for a single digit badge
 * @param {string|number} digit
 * @param {'a'|'b'|'c'} setKey
 * @returns {string} SVG code
 */
function createBadgeSvg(digit, setKey = 'a') {
  const theme = SET_THEMES[setKey] || SET_THEMES.a;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad_${setKey}_${digit}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgStart}"/>
      <stop offset="100%" stop-color="${theme.bgEnd}"/>
    </linearGradient>

    <!-- Gold Border Gradient -->
    <linearGradient id="goldGrad_${setKey}_${digit}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.digitColor}"/>
      <stop offset="50%" stop-color="${theme.borderColor}"/>
      <stop offset="100%" stop-color="${theme.accentColor}"/>
    </linearGradient>

    <!-- Digit Gradient -->
    <linearGradient id="textGrad_${setKey}_${digit}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="35%" stop-color="${theme.digitColor}"/>
      <stop offset="100%" stop-color="${theme.borderColor}"/>
    </linearGradient>

    <!-- Subtle Drop Shadow -->
    <filter id="shadow_${setKey}_${digit}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Outer Rounded Squircle Base -->
  <rect x="6" y="6" width="116" height="116" rx="30" ry="30"
        fill="url(#bgGrad_${setKey}_${digit})"
        stroke="url(#goldGrad_${setKey}_${digit})"
        stroke-width="5"
        filter="url(#shadow_${setKey}_${digit})"/>

  <!-- Inner Soft Ring -->
  <rect x="13" y="13" width="102" height="102" rx="23" ry="23"
        fill="none"
        stroke="${theme.innerGlow}"
        stroke-width="1.5"/>

  <!-- Centered Bold Digit -->
  <text x="64" y="85"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="68"
        font-weight="900"
        fill="url(#textGrad_${setKey}_${digit})"
        stroke="#111113"
        stroke-width="1"
        paint-order="stroke fill">${digit}</text>
</svg>`;
}

/**
 * Generates PNG buffer from an SVG string
 * @param {string} svgCode
 * @returns {Buffer}
 */
function svgToPngBuffer(svgCode) {
  const resvg = new Resvg(svgCode, {
    fitTo: {
      mode: 'width',
      value: 128,
    },
    shapeRendering: 2, // geometricPrecision
    textRendering: 2,  // geometricPrecision
    imageRendering: 0, // optimizeQuality
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * Generates all 30 badges (digits 0-9 for sets a, b, c) and saves them to disk
 * @returns {{ [key: string]: string }} Map of emojiName -> filePath
 */
function generateAllBadges() {
  if (!fs.existsSync(EMOJI_DIR)) {
    fs.mkdirSync(EMOJI_DIR, { recursive: true });
  }

  const generatedFiles = {};
  const sets = ['a', 'b', 'c', 'd'];

  for (const setKey of sets) {
    for (let digit = 0; digit <= 9; digit++) {
      const emojiName = `num_${digit}_${setKey}`;
      const filePath = path.join(EMOJI_DIR, `${emojiName}.png`);
      const svgCode = createBadgeSvg(digit, setKey);
      const pngBuffer = svgToPngBuffer(svgCode);

      fs.writeFileSync(filePath, pngBuffer);
      generatedFiles[emojiName] = filePath;
    }
  }

  return generatedFiles;
}

module.exports = {
  createBadgeSvg,
  svgToPngBuffer,
  generateAllBadges,
  SET_THEMES,
};
