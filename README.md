# SalawatTracker Bot 🌙

> **Spiritual Community Goal Tracker with Dynamic SVG Progress Generation**

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord)](https://discord.js.org/)
[![resvg](https://img.shields.io/badge/Render_Engine-resvg--js-FF5722?style=for-the-badge)](https://github.com/yisibl/resvg-js)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A high-engagement spiritual community bot that tracks prayers upon the Prophet Muhammad (صلى الله عليه وسلم) across servers. Generates real-time custom vector graphics on the fly with `@resvg/resvg-js`, responds with numbered reaction sequences, and provides interactive community milestones.

---

## ✨ Features

- **Ultra-Fast Vector Rasterization**: Generates custom branded milestone graphics dynamically in <30ms using `@resvg/resvg-js`.
- **Custom Reaction Sequences**: Reacts with numbered emoji sequences in real time upon message triggers.
- **Server-Wide Milestone Counters**: Cumulative tracking with celebratory announcements upon reaching community spiritual goals.
- **Full Slash Command Suite**: Clean `/setchannel`, `/setgoal`, and `/stats` commands for administrators.

---

## 🚀 Setup & Installation

### 1. Installation
```bash
git clone https://github.com/xSeiff/salawat-tracker-bot.git
cd salawat-tracker-bot
npm install
```

### 2. Configuration
```bash
cp .env.example .env
```
Provide your `DISCORD_TOKEN` and `CLIENT_ID`.

### 3. Deploy Commands & Run
```bash
npm run deploy
npm start
```

---

## 📜 License
This project is licensed under the MIT License.

Developed by [Seif (@xSeiff)](https://github.com/xSeiff).
