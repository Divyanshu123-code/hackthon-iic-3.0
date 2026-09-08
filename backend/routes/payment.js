const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../data/db');

// GET /api/payment/:farmerId
router.get('/:farmerId', (req, res) => {
  const { farmerId } = req.params;
  const db = getDb();
  const farmer = db.farmers.find(f => f.farmerId === farmerId);

  if (!farmer) {
    return res.status(404).json({ error: `Farmer ${farmerId} not found` });
  }

  return res.json(farmer.payment);
});

// POST /api/payment/:farmerId/advance
// Instant 80% advance payout
router.post('/:farmerId/advance', (req, res) => {
  const { farmerId } = req.params;
  const db = getDb();
  const farmer = db.farmers.find(f => f.farmerId === farmerId);

  if (!farmer) {
    return res.status(404).json({ error: `Farmer ${farmerId} not found` });
  }

  if (farmer.payment.advance.taken) {
    return res.status(400).json({
      success: false,
      error: 'Advance payout has already been processed for this farmer',
      referenceNo: farmer.payment.advance.referenceNo
    });
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const refNo = `IMPS-${Date.now().toString().slice(-8)}`;

  farmer.payment.advance.available = false;
  farmer.payment.advance.taken = true;
  farmer.payment.advance.creditedAt = nowStr;
  farmer.payment.advance.referenceNo = refNo;

  // Update bank transfer timeline item
  const transferStep = farmer.payment.timeline.find(t => t.name === 'transfer');
  if (transferStep) {
    transferStep.status = 'done';
    transferStep.timestamp = nowStr;
    transferStep.detail = `₹${farmer.payment.advance.amount.toLocaleString('en-IN')} (80% त्वरित अग्रिम • Ref: ${refNo}) सीधे ${farmer.payment.bank.name} खाते में प्रेषित`;
  }

  // Update center financial metrics
  const center = db.centers.find(c => c.centerId === farmer.centerId) || db.centers[0];
  center.totalAdvanceDisbursed = (center.totalAdvanceDisbursed || 0) + farmer.payment.advance.amount;

  saveDb(db, {
    type: 'ADVANCE_DISBURSED',
    message: `${farmer.name} (Token #${farmer.token}) को ₹${farmer.payment.advance.amount.toLocaleString('en-IN')} का 80% अग्रिम भुगतान जारी (Ref: ${refNo})`
  });

  return res.json({
    success: true,
    amountCredited: farmer.payment.advance.amount,
    remainingPercent: 100 - farmer.payment.advance.percent,
    referenceNo: refNo,
    creditedTo: `${farmer.payment.bank.name} (•••• ${farmer.payment.bank.last4})`,
    timestamp: nowStr,
    message: `₹${farmer.payment.advance.amount.toLocaleString('en-IN')} सफलतापूर्वक आपके बैंक खाते में जमा कर दिए गए हैं! (UTR Ref: ${refNo})`
  });
});

module.exports = router;
