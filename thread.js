const { getSignup } = require("./signupStore");

function formatUser(id) {
  return id ? `<@${id}>` : "—";
}

function buildSheet(slots) {
  return `#forcecityoverload true

1 👑 **RAID LEAD** : ${formatUser(slots.raidlead)}
\`\`\`Silver Bags - Maps - T9+ Items\`\`\`

2 🔵 **DEBUFF** : ${formatUser(slots.debuff)}
\`\`\`Rune/Soul/Relic/Shard - Treasures - Artifacts\`\`\`

3 🟡 **MainHeal** : ${formatUser(slots.mainheal)}
\`\`\`Boots\`\`\`

4 🟣 **Still Gaze** : ${formatUser(slots.arcane)}
\`\`\`Bags & Capes\`\`\`

5 🔴 **SHADOWCALLER** : ${formatUser(slots.shadow)}
\`\`\`Helmets\`\`\`

6 🔴 **BLAZING** : ${formatUser(slots.blazing)}
\`\`\`Melee Weapons\`\`\`

7 🔴 **DPS 1** : ${formatUser(slots.dps1)}
\`\`\`Offhand & HCE Maps\`\`\`

8 🔴 **DPS 2** : ${formatUser(slots.dps2)}
\`\`\`Armors\`\`\`

9 🔴 **DPS 3** : ${formatUser(slots.dps3)}
\`\`\`Ranged Weapons\`\`\`

10 🟢 **Leach** : ${formatUser(slots.leach)}
\`\`\`Ground Loot Bags + Ava Energy\`\`\``;
}

async function updateThreadSheet(thread) {
  const data = getSignup(thread.id);
  if (!data) return;

  const msg = await thread.messages.fetch(data.sheetMessageId);
  if (!msg) return;

  await msg.edit(buildSheet(data.slots));
}

module.exports = { updateThreadSheet };
