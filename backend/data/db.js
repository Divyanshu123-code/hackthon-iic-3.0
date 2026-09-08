const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const dbPath = path.join(__dirname, 'db.json');
const seedPath = path.join(__dirname, 'seed.json');

class MandiEventEmitter extends EventEmitter {}
const mandiEvents = new MandiEventEmitter();

let inMemoryDb = null;

// Initialize in-memory DB or file DB
function initSeed() {
  try {
    const seedData = fs.readFileSync(seedPath, 'utf8');
    return JSON.parse(seedData);
  } catch (err) {
    return { centers: [], farmers: [], events: [] };
  }
}

if (!fs.existsSync(dbPath)) {
  try {
    const seedData = fs.readFileSync(seedPath, 'utf8');
    fs.writeFileSync(dbPath, seedData, 'utf8');
  } catch (e) {
    inMemoryDb = initSeed();
  }
}

function getDb() {
  if (inMemoryDb) return inMemoryDb;
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    inMemoryDb = initSeed();
    return inMemoryDb;
  }
}

function saveDb(data, eventInfo = null) {
  try {
    if (eventInfo) {
      if (!data.events) data.events = [];
      data.events.unshift({
        id: `ev-${Date.now()}`,
        type: eventInfo.type || 'INFO',
        message: eventInfo.message || 'State updated',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      if (data.events.length > 30) data.events = data.events.slice(0, 30);
    }

    inMemoryDb = data;
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (writeErr) {
      // In serverless (e.g. Vercel), disk is read-only; in-memory copy is used
    }
    
    // Broadcast live event to all connected SSE clients
    mandiEvents.emit('change', {
      type: eventInfo ? eventInfo.type : 'UPDATE',
      message: eventInfo ? eventInfo.message : 'Database updated',
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Error saving db:', err);
    return false;
  }
}

function resetDb() {
  inMemoryDb = initSeed();
  try {
    const seedData = fs.readFileSync(seedPath, 'utf8');
    fs.writeFileSync(dbPath, seedData, 'utf8');
  } catch (e) {}
  mandiEvents.emit('change', { type: 'RESET', message: 'Database reset to initial demo seed' });
  return parsed;
}

// Calculate dynamic queue metrics for any farmer
function getDynamicQueueMetrics(db, farmerId) {
  const farmer = db.farmers.find(f => f.farmerId === farmerId);
  if (!farmer) return null;

  // Count farmers ahead with smaller token numbers that are not yet "pass"
  const activeAhead = db.farmers.filter(f => f.token < farmer.token && f.stage !== 'pass');
  
  // Calculate dynamic wait based on stage and tractors ahead
  const stageWeights = { 'arrived': 4, 'weighing': 3, 'grade': 2, 'pass': 0 };
  const currentStageWeight = stageWeights[farmer.stage] || 0;
  
  const calculatedAhead = activeAhead.length + (farmer.stage === 'arrived' ? 1 : 0);
  const calculatedEstWait = Math.max(0, (calculatedAhead * 5) + currentStageWeight);

  // Determine current active token at gate
  const activeAtGate = db.farmers.find(f => f.stage === 'weighing' || f.stage === 'arrived');
  const atGateNumber = activeAtGate ? activeAtGate.token : Math.max(38, farmer.token - calculatedAhead);

  farmer.aheadCount = calculatedAhead;
  farmer.estWaitMins = calculatedEstWait;
  farmer.atGateNumber = atGateNumber;

  return farmer;
}

module.exports = {
  getDb,
  saveDb,
  resetDb,
  getDynamicQueueMetrics,
  mandiEvents
};
