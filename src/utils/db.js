const fs = require('fs');
const path = './database/agents.json';

function readAgents() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');
  return JSON.parse(fs.readFileSync(path));
}

function writeAgents(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getAgentBySid(sid) {
  const db = readAgents();
  return db[sid] || null;
}

function setAgent(sid, data) {
  const db = readAgents();
  db[sid] = { sid, ...data };
  writeAgents(db);
}

function updateAgent(sid, patch) {
  const db = readAgents();
  if (!db[sid]) return;
  db[sid] = { ...db[sid], ...patch };
  writeAgents(db);
}

module.exports = {
  readAgents,
  writeAgents,
  getAgentBySid,
  setAgent,
  updateAgent
};
