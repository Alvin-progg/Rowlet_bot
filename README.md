# Rowlet Bot - Discord Raid Organizer

A Discord bot for organizing raid events with role signups.

## Features
- Create raid events with embedded messages
- Role signup system (Tank, Healer, Debuff, DPS, Queue)
- Reaction-based signup
- Automatic roster updates
- Role limits

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Discord Bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Go to "Bot" section and click "Add Bot"
   - Copy the bot token
   - Enable these intents:
     - Presence Intent
     - Server Members Intent
     - Message Content Intent

3. **Configure the bot:**
   - Open `.env` file
   - Replace `your_bot_token_here` with your actual bot token

4. **Invite bot to your server:**
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`
   - Select permissions: 
     - Send Messages
     - Embed Links
     - Read Message History
     - Add Reactions
     - Use External Emojis
   - Copy and open the generated URL

5. **Run the bot:**
   ```bash
   node index.js
   ```

## Commands

### Create a Raid Event
```
!createraid Title | Date | Time | Description
```
**Example:**
```
!createraid GDG 8.1+++ FF | 1/10/2026 | 8:00 PM - 11:00 PM | GDG 8.1 and above, starting from MARTLOCK PORTAL. Bring weapon and armor sets with tier 7 equivalent sets minimum.
```

### Sign Up for Roles
React to the raid message with the corresponding emoji:
- 🛡️ - Tank
- 💚 - Healer  
- ⚡ - Debuff
- ⚔️ - DPS
- 📋 - Queue

To remove yourself, just remove your reaction!

## Custom Emojis

To use your own Discord emojis instead of the default ones, you'll need to modify the `emojiMap` in [index.js](index.js#L108) and update the reaction emojis in the `!createraid` command (around [index.js](index.js#L57)).

Replace the emojis with your custom ones like this:
```javascript
const emojiMap = {
    '<:tankicon:123456789>': 'tank',  // Your custom tank emoji
    '<:healericon:123456789>': 'healer',
    // ... etc
};
```

## Customization

You can customize role limits in the `createraid` command:
```javascript
roles: {
    tank: { emoji: null, max: 1, users: [] },   // Change max here
    healer: { emoji: null, max: 1, users: [] },
    debuff: { emoji: null, max: 1, users: [] },
    dps: { emoji: null, max: 4, users: [] },
    queue: { emoji: null, max: 3, users: [] }
}
```
