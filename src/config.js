module.exports = {
  GUILD_ID: process.env.GUILD_ID,
  LOGS_CHANNEL: process.env.LOGS_CHANNEL,
  AUDIT_CHANNEL: process.env.AUDIT_CHANNEL,
  PANEL_CHANNEL: process.env.PANEL_CHANNEL,
  FORUM_CHANNEL: process.env.FORUM_CHANNEL,
  STAFF_ROLES: (process.env.ALLOWED_ROLES || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean),

  RANKS: {
    9: 'Leader',
    8: 'Vice Gen.',
    7: 'Gen. Secretary',
    6: 'Chief Structure',
    5: 'Chief Completion',
    4: 'Recruiter',
    3: 'Stacked',
    2: 'Main',
    1: 'Academy'
  }
};
