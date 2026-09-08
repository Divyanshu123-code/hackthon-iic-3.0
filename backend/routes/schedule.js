const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../data/db');

// GET /api/schedule/:centerId
router.get('/:centerId', (req, res) => {
  const { centerId } = req.params;
  const db = getDb();
  const center = db.centers.find(c => c.centerId === centerId);

  if (!center) {
    return res.status(404).json({ error: `Center ${centerId} not found` });
  }

  // Contract: full center object (open, gate, timing, todayCrop, msp, upcomingDays, slots)
  return res.json(center);
});

// POST /api/schedule/:centerId/book-slot
// body: { farmerId, slotId }
router.post('/:centerId/book-slot', (req, res) => {
  const { centerId } = req.params;
  const { farmerId, slotId } = req.body;
  const db = getDb();

  const center = db.centers.find(c => c.centerId === centerId);
  if (!center) {
    return res.status(404).json({ error: `Center ${centerId} not found` });
  }

  const slot = center.slots.find(s => s.id === slotId) || center.slots[0];
  if (slot && slot.tokensLeft > 0) {
    slot.tokensLeft -= 1;
  }

  let updatedToken = 42;
  const farmer = db.farmers.find(f => f.farmerId === (farmerId || 'F1'));
  if (farmer) {
    updatedToken = farmer.token;
  }

  saveDb(db);

  return res.json({
    success: true,
    message: `Slot reserved successfully for ${slot.label}`,
    slotBooked: slot.label,
    tokensLeft: slot.tokensLeft,
    updatedToken
  });
});

module.exports = router;
