const express = require('express');
const router = express.Router();
const { getDb, saveDb, getDynamicQueueMetrics } = require('../data/db');

// GET /api/farmer/all
router.get('/all', (req, res) => {
  const db = getDb();
  const list = db.farmers.map(f => ({
    farmerId: f.farmerId,
    name: f.name,
    token: f.token,
    vehicleNumber: f.vehicleNumber,
    commodity: f.commodity,
    stage: f.stage,
    aheadCount: f.aheadCount,
    estWaitMins: f.estWaitMins
  }));
  return res.json(list);
});

// GET /api/farmer/:farmerId/home
router.get('/:farmerId/home', (req, res) => {
  const { farmerId } = req.params;
  const db = getDb();
  let farmer = db.farmers.find(f => f.farmerId === farmerId);

  if (!farmer) {
    return res.status(404).json({ error: `Farmer ${farmerId} not found` });
  }

  // Recalculate dynamic queue metrics
  farmer = getDynamicQueueMetrics(db, farmerId) || farmer;

  return res.json({
    farmerId: farmer.farmerId,
    name: farmer.name,
    phone: farmer.phone,
    token: farmer.token,
    date: farmer.date,
    mandi: farmer.mandi,
    vehicleNumber: farmer.vehicleNumber,
    vehicleType: farmer.vehicleType,
    commodity: farmer.commodity,
    commodityQty: farmer.commodityQty,
    centerId: farmer.centerId,
    stage: farmer.stage,
    stageIndex: farmer.stageIndex,
    aheadCount: farmer.aheadCount,
    estWaitMins: farmer.estWaitMins,
    atGateNumber: farmer.atGateNumber,
    weighbridgeNo: farmer.weighbridgeNo,
    stages: farmer.stages,
    payment: farmer.payment
  });
});

// POST /api/farmer/checkin
// New tractor check-in at Mandi gate
router.post('/checkin', (req, res) => {
  const { name, phone, vehicleNumber, vehicleType, commodity, commodityQty, centerId = 'C1' } = req.body;

  if (!name || !vehicleNumber) {
    return res.status(400).json({ error: 'Name and Vehicle Number are required for check-in' });
  }

  const db = getDb();
  const maxToken = db.farmers.reduce((max, f) => Math.max(max, f.token || 0), 40);
  const nextToken = maxToken + 1;
  const newFarmerId = `F${db.farmers.length + 1}`;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newFarmer = {
    farmerId: newFarmerId,
    name,
    phone: phone || '+91 98000 00000',
    token: nextToken,
    date: '2026-09-08',
    mandi: 'APMC अनाज मंडी (Kota Mandi)',
    vehicleNumber,
    vehicleType: vehicleType || 'ट्रैक्टर ट्रॉली',
    commodity: commodity || 'गेहूं (Wheat)',
    commodityQty: commodityQty || '50 बोरी (38 Qtl)',
    centerId,
    stage: 'arrived',
    stageIndex: 1,
    aheadCount: db.farmers.filter(f => f.stage !== 'pass').length,
    estWaitMins: (db.farmers.filter(f => f.stage !== 'pass').length + 1) * 5,
    atGateNumber: nextToken - 4,
    weighbridgeNo: (nextToken % 3) + 1,
    stages: [
      { name: 'arrived', label: 'पहुंचे / Arrived', status: 'done', timestamp: nowStr },
      { name: 'weighing', label: 'तौल / Weighing', status: 'pending', timestamp: null },
      { name: 'grade', label: 'गुणवत्ता / Grade', status: 'pending', timestamp: null },
      { name: 'pass', label: 'पास / Pass', status: 'pending', timestamp: null }
    ],
    payment: {
      totalApproved: 86450,
      quintal: 38,
      crop: commodity || 'गेहूं Grade-A',
      lotNumber: `LOT-2026-${8850 + nextToken}`,
      quality: { moisture: '11.0%', purity: '99.1%', shed: `मंडी शेड ${(nextToken % 4) + 1}` },
      timeline: [
        { name: 'weighed', label: 'Weighed & Certified', status: 'pending', detail: 'तौल की प्रतीक्षा', timestamp: null },
        { name: 'bill', label: 'Bill Generated', status: 'pending', detail: 'बिल लंबित', timestamp: null },
        { name: 'transfer', label: 'Bank Transfer', status: 'pending', detail: 'बैंक प्रेषण लंबित', timestamp: null },
        { name: 'credited', label: 'Credited to Account', status: 'pending', detail: 'लंबित', timestamp: null }
      ],
      advance: { available: true, taken: false, percent: 80, amount: 69160, feePercent: 0, creditedAt: null, referenceNo: null },
      bank: { name: 'SBI Bank', last4: '5512', ifsc: 'SBIN000112' },
      mandiTax: 0
    }
  };

  db.farmers.push(newFarmer);
  saveDb(db, {
    type: 'CHECKIN',
    message: `${name} (टोकन #${nextToken}, वाहन ${vehicleNumber}) का मंडी में चेक-इन संपन्न`
  });

  return res.status(201).json({
    success: true,
    message: `Farmer checked in successfully. Assigned Token #${nextToken}`,
    farmer: newFarmer
  });
});

module.exports = router;
