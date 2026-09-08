const express = require('express');
const router = express.Router();
const { getDb, getDynamicQueueMetrics } = require('../data/db');

// GET /api/queue/board
// Full live queue board for mandi terminal screens
router.get('/board', (req, res) => {
  const db = getDb();
  const queueBoard = db.farmers.map(f => {
    const updated = getDynamicQueueMetrics(db, f.farmerId) || f;
    return {
      farmerId: updated.farmerId,
      name: updated.name,
      token: updated.token,
      stage: updated.stage,
      stageIndex: updated.stageIndex,
      aheadCount: updated.aheadCount,
      estWaitMins: updated.estWaitMins,
      weighbridgeNo: updated.weighbridgeNo,
      vehicleNumber: updated.vehicleNumber,
      commodity: updated.commodity
    };
  });

  return res.json({
    totalInQueue: db.farmers.filter(f => f.stage !== 'pass').length,
    passedToday: db.farmers.filter(f => f.stage === 'pass').length,
    activeAtGate: queueBoard.find(f => f.stage === 'weighing' || f.stage === 'arrived') || null,
    queue: queueBoard
  });
});

// GET /api/queue/:farmerId
router.get('/:farmerId', (req, res) => {
  const { farmerId } = req.params;
  const db = getDb();
  let farmer = db.farmers.find(f => f.farmerId === farmerId);

  if (!farmer) {
    return res.status(404).json({ error: `Farmer ${farmerId} not found` });
  }

  farmer = getDynamicQueueMetrics(db, farmerId) || farmer;

  return res.json({
    farmerId: farmer.farmerId,
    token: farmer.token,
    aheadCount: farmer.aheadCount,
    estWaitMins: farmer.estWaitMins,
    atGateNumber: farmer.atGateNumber,
    stage: farmer.stage,
    stageIndex: farmer.stageIndex,
    stages: farmer.stages,
    vehicleNumber: farmer.vehicleNumber,
    vehicleType: farmer.vehicleType,
    weighbridgeNo: farmer.weighbridgeNo,
    commodity: farmer.commodity,
    commodityQty: farmer.commodityQty
  });
});

module.exports = router;
