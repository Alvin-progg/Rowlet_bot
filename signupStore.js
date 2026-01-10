const signups = new Map();

function createSignup(threadId, sheetMessageId, leaderId) {
  signups.set(threadId, {
    threadId, 
    sheetMessageId,
    slots: {
      raidlead: leaderId,
      debuff: null,
      mainheal: null,
      arcane: null,
      shadow: null,
      blazing: null,
      dps1: null,
      dps2: null,
      dps3: null,
      leach: null
    }
  });
}

function getSignup(threadId) {
  return signups.get(threadId);
}

module.exports = { createSignup, getSignup };
