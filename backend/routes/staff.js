const express = require('express');
const router = express.Router();
const { getDb, saveDb, resetDb, getDynamicQueueMetrics } = require('../data/db');

const STAGES_ORDER = ['arrived', 'weighing', 'grade', 'pass'];
const STAGE_LABELS = {
  arrived: 'पहुंचे / Arrived',
  weighing: 'तौल / Weighing',
  grade: 'गुणवत्ता / Grade',
  pass: 'पास / Pass'
};

const PAYMENT_TIMELINE_ORDER = ['weighed', 'bill', 'transfer', 'credited'];

// GET /api/staff/data
router.get('/data', (req, res) => {
  const db = getDb();
  
  // Dynamically update metrics for all farmers
  db.farmers.forEach(f => {
    getDynamicQueueMetrics(db, f.farmerId);
  });

  const center = db.centers[0];
  const totalApproved = db.farmers.reduce((sum, f) => sum + (f.payment ? f.payment.totalApproved : 0), 0);
  const totalAdvances = db.farmers.reduce((sum, f) => sum + (f.payment && f.payment.advance.taken ? f.payment.advance.amount : 0), 0);
  const totalQuintals = db.farmers.reduce((sum, f) => sum + (f.payment ? f.payment.quintal : 0), 0);

  return res.json({
    centers: db.centers,
    farmers: db.farmers,
    events: db.events || [],
    metrics: {
      totalFarmersCheckedIn: db.farmers.length,
      farmersInQueue: db.farmers.filter(f => f.stage !== 'pass').length,
      farmersCompletedToday: db.farmers.filter(f => f.stage === 'pass').length,
      totalQuintalsProcured: totalQuintals,
      totalApprovedPayment: totalApproved,
      totalAdvancesDisbursed: totalAdvances,
      centerOpen: center.open,
      gateOpen: center.gateOpen
    }
  });
});

// POST /api/staff/schedule
router.post('/schedule', (req, res) => {
  const { centerId = 'C1', open, gateOpen, todayCrop, msp, timing, gateNumber, cropQuality, cropGrade } = req.body;
  const db = getDb();

  const center = db.centers.find(c => c.centerId === centerId);
  if (!center) {
    return res.status(404).json({ error: `Center ${centerId} not found` });
  }

  if (open !== undefined) center.open = Boolean(open);
  if (gateOpen !== undefined) center.gateOpen = Boolean(gateOpen);
  if (todayCrop !== undefined) center.todayCrop = todayCrop;
  if (msp !== undefined) center.msp = Number(msp);
  if (timing !== undefined) center.timing = timing;
  if (gateNumber !== undefined) center.gateNumber = Number(gateNumber);
  if (cropQuality !== undefined) center.cropQuality = cropQuality;
  if (cropGrade !== undefined) center.cropGrade = cropGrade;

  saveDb(db, {
    type: 'SCHEDULE_UPDATE',
    message: `मंडी अनुसूची अद्यतन: ${center.todayCrop} (MSP: ₹${center.msp}), स्थिति: ${center.open ? 'खुला' : 'बंद'}`
  });

  return res.json({
    success: true,
    message: 'Center schedule updated successfully',
    center
  });
});

// POST /api/staff/advance-stage
// body: { farmerId, stage }
router.post('/advance-stage', (req, res) => {
  const { farmerId = 'F1', stage } = req.body;
  const db = getDb();

  const farmer = db.farmers.find(f => f.farmerId === farmerId);
  if (!farmer) {
    return res.status(404).json({ error: `Farmer ${farmerId} not found` });
  }

  let targetStage = stage;
  if (!targetStage) {
    const currentIndex = STAGES_ORDER.indexOf(farmer.stage);
    if (currentIndex < STAGES_ORDER.length - 1) {
      targetStage = STAGES_ORDER[currentIndex + 1];
    } else {
      targetStage = STAGES_ORDER[STAGES_ORDER.length - 1];
    }
  }

  const stageIndex = STAGES_ORDER.indexOf(targetStage);
  if (stageIndex === -1) {
    return res.status(400).json({ error: `Invalid stage: ${targetStage}. Allowed: ${STAGES_ORDER.join(', ')}` });
  }

  farmer.stage = targetStage;
  farmer.stageIndex = stageIndex + 1;

  // Update stages array status
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  farmer.stages = STAGES_ORDER.map((st, idx) => {
    let status = 'pending';
    let timestamp = null;

    if (idx < stageIndex) {
      status = 'done';
      timestamp = '10:15 AM';
    } else if (idx === stageIndex) {
      status = 'in_progress';
      timestamp = nowStr;
    } else {
      status = 'pending';
      timestamp = null;
    }

    return {
      name: st,
      label: STAGE_LABELS[st] || st,
      status,
      timestamp
    };
  });

  // If stage reaches pass, advance payment weighed step
  if (targetStage === 'pass' && farmer.payment) {
    farmer.payment.timeline.forEach((item, idx) => {
      if (idx === 0 || idx === 1) item.status = 'done';
      if (idx === 2) item.status = 'in_progress';
    });
  }

  // Recalculate dynamic queue metrics
  getDynamicQueueMetrics(db, farmer.farmerId);

  saveDb(db, {
    type: 'STAGE_ADVANCED',
    message: `${farmer.name} (टोकन #${farmer.token}) का चरण बढ़कर '${STAGE_LABELS[targetStage]}' हुआ`
  });

  return res.json({
    success: true,
    message: `Farmer ${farmer.name} advanced to stage: ${targetStage}`,
    farmer: {
      farmerId: farmer.farmerId,
      name: farmer.name,
      token: farmer.token,
      stage: farmer.stage,
      stageIndex: farmer.stageIndex,
      aheadCount: farmer.aheadCount,
      estWaitMins: farmer.estWaitMins,
      stages: farmer.stages
    }
  });
});

// POST /api/staff/advance-payment
// body: { farmerId, stage }
router.post('/advance-payment', (req, res) => {
  const { farmerId = 'F1', stage } = req.body;
  const db = getDb();

  const farmer = db.farmers.find(f => f.farmerId === farmerId);
  if (!farmer) {
    return res.status(404).json({ error: `Farmer ${farmerId} not found` });
  }

  let targetStage = stage;
  if (!targetStage) {
    const currentPendingIndex = farmer.payment.timeline.findIndex(t => t.status !== 'done');
    if (currentPendingIndex !== -1) {
      targetStage = PAYMENT_TIMELINE_ORDER[currentPendingIndex];
    } else {
      targetStage = 'credited';
    }
  }

  const stageIndex = PAYMENT_TIMELINE_ORDER.indexOf(targetStage);
  if (stageIndex === -1) {
    return res.status(400).json({ error: `Invalid payment stage: ${targetStage}` });
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  farmer.payment.timeline.forEach((item, idx) => {
    if (idx <= stageIndex) {
      item.status = 'done';
      if (!item.timestamp) item.timestamp = nowStr;
    } else if (idx === stageIndex + 1) {
      item.status = 'in_progress';
    } else {
      item.status = 'pending';
    }
  });

  if (targetStage === 'credited') {
    farmer.payment.advance.available = false;
  }

  saveDb(db, {
    type: 'PAYMENT_ADVANCED',
    message: `${farmer.name} (Token #${farmer.token}) का भुगतान प्रक्रम '${targetStage}' तक संपन्न`
  });

  return res.json({
    success: true,
    message: `Payment timeline updated up to: ${targetStage}`,
    timeline: farmer.payment.timeline
  });
});

// POST /api/staff/announce
// Mandi Public Announcement broadcast trigger
router.post('/announce', (req, res) => {
  const { token, weighbridgeNo, customText } = req.body;
  const db = getDb();
  const farmer = db.farmers.find(f => f.token === Number(token)) || db.farmers[0];

  const announcement = customText || `ध्यान दें: टोकन नंबर ${farmer.token}, किसान ${farmer.name}, वाहन ${farmer.vehicleNumber}, कृपया तुरंत कांटा नंबर ${weighbridgeNo || farmer.weighbridgeNo} पर पहुंचे।`;

  saveDb(db, {
    type: 'PA_ANNOUNCEMENT',
    message: `मंडी लाउडस्पीकर घोषणा: "टोकन #${farmer.token} कांटा #${weighbridgeNo || farmer.weighbridgeNo} पर पहुंचे"`
  });

  return res.json({
    success: true,
    announcement,
    token: farmer.token,
    weighbridgeNo: weighbridgeNo || farmer.weighbridgeNo
  });
});

// POST /api/staff/reset
router.post('/reset', (req, res) => {
  const db = resetDb();
  return res.json({
    success: true,
    message: 'Database reset to initial demo seed successfully',
    data: db
  });
});

module.exports = router;
