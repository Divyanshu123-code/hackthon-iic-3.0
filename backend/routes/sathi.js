const express = require('express');
const router = express.Router();
const { getDb, saveDb, getDynamicQueueMetrics } = require('../data/db');

// POST /api/sathi/query
// body: { message, screenContext, farmerId }
router.post('/query', (req, res) => {
  const { message = '', screenContext = 'home', farmerId = 'F1' } = req.body;
  const db = getDb();
  let farmer = db.farmers.find(f => f.farmerId === farmerId) || db.farmers[0];
  const center = db.centers.find(c => c.centerId === (farmer ? farmer.centerId : 'C1')) || db.centers[0];

  farmer = getDynamicQueueMetrics(db, farmer.farmerId) || farmer;

  const q = message.toLowerCase().trim();
  let reply = '';
  let category = 'general';
  let suggestedChips = [];
  let action = null;

  // 1. Slot Booking Intent via Chat ("स्लॉट बुक करो", "book slot")
  if (
    q.includes('स्लॉट बुक') ||
    q.includes('slot book') ||
    q.includes('टोकन बुक') ||
    q.includes('बुक कर') ||
    q.includes('reserve slot')
  ) {
    category = 'slot_booking';
    const slot = center.slots.find(s => s.tokensLeft > 0) || center.slots[0];
    if (slot && slot.tokensLeft > 0) {
      slot.tokensLeft -= 1;
      saveDb(db, {
        type: 'SLOT_BOOKED',
        message: `${farmer.name} ने साथी AI के माध्यम से ${slot.label} का स्लॉट आरक्षित किया`
      });
      reply = `बधाई हो ${farmer.name}! आपका '${slot.label}' का स्लॉट सफलतापूर्वक आरक्षित हो गया है। आपका टोकन #${farmer.token} है। कृपया समय पर गेट नं. ${center.gateNumber} पर पहुंचे।`;
      action = { type: 'SLOT_BOOKED', slot: slot.label };
    } else {
      reply = `आज के सभी ऑनलाइन स्लॉट भर चुके हैं। आप सीधे मंडी गेट नं. ${center.gateNumber} पर पहुंचकर तत्काल टोकन प्राप्त कर सकते हैं।`;
    }
    suggestedChips = ["कतार में समय कितना है?", "आज गेहूं का भाव क्या है?", "गेट का रास्ता"];
  }

  // 2. Token & Queue Status
  else if (
    q.includes('टोकन') ||
    q.includes('token') ||
    q.includes('नंबर') ||
    q.includes('number') ||
    q.includes('कतार') ||
    q.includes('line') ||
    q.includes('आगे') ||
    q.includes('ट्रैक्टर') ||
    q.includes('बारी') ||
    q.includes('status')
  ) {
    category = 'queue_status';
    reply = `${farmer.name}, आपका टोकन नंबर #${farmer.token} है। आपके आगे अभी ${farmer.aheadCount} ट्रैक्टर हैं। गेट पर अभी टोकन #${farmer.atGateNumber} का काम चल रहा है। अनुमानित समय लगभग ${farmer.estWaitMins} मिनट है।`;
    suggestedChips = ["मेरी फसल कब बिकेगी?", "कांटा नंबर क्या है?", "गेट पास दिखाएं"];
  }

  // 3. Timing / Selling Time / When will crop be sold
  else if (
    q.includes('कब बिकेगी') ||
    q.includes('कब') ||
    q.includes('when') ||
    q.includes('समय') ||
    q.includes('time') ||
    q.includes('eta') ||
    q.includes('wait')
  ) {
    category = 'timing';
    reply = `वर्तमान कतार के अनुसार आपकी उपज की तौल लगभग ${farmer.estWaitMins} मिनट में कांटा #${farmer.weighbridgeNo} पर शुरू होगी। कृपया अपने ट्रैक्टर (${farmer.vehicleNumber}) के साथ तैयार रहें।`;
    suggestedChips = ["सुरक्षा गार्ड को पास दिखाएं", "तौल के बाद पैसे कब मिलेंगे?", "मंडी भाव"];
  }

  // 4. Crop Rates, MSP & Mandi Schedule
  else if (
    q.includes('भाव') ||
    q.includes('msp') ||
    q.includes('रेट') ||
    q.includes('rate') ||
    q.includes('कीमत') ||
    q.includes('price') ||
    q.includes('गेहूं') ||
    q.includes('wheat') ||
    q.includes('सरसों') ||
    q.includes('mustard') ||
    q.includes('सोयाबीन') ||
    q.includes('soybean')
  ) {
    category = 'msp';
    reply = `आज ${center.name} में ${center.todayCrop} का सरकारी समर्थन मूल्य (MSP) ₹${center.msp.toLocaleString('en-IN')}/क्विंटल है (${center.cropGrade})। कल मंडी में सरसों (Mustard) की आवक होगी (MSP: ₹5,650/Qtl)।`;
    suggestedChips = ["स्लॉट बुक करें", "मंडी खुलने का समय क्या है?", "पेमेंट कैसे मिलेगा?"];
  }

  // 5. Payment, Money & Bank Status
  else if (
    q.includes('भुगतान') ||
    q.includes('payment') ||
    q.includes('पैसे') ||
    q.includes('रुपये') ||
    q.includes('खाता') ||
    q.includes('bank') ||
    q.includes('balance') ||
    q.includes('paisa')
  ) {
    category = 'payment';
    const p = farmer.payment;
    if (p.advance && p.advance.taken) {
      reply = `आपकी कुल अनुमोदित राशि ₹${p.totalApproved.toLocaleString('en-IN')} है। ₹${p.advance.amount.toLocaleString('en-IN')} (80% त्वरित अग्रिम • Ref: ${p.advance.referenceNo || 'IMPS'}) आपके ${p.bank.name} (${p.bank.last4}) खाते में जमा हो चुके हैं। शेष 20% सामान्य 24-48 घंटे चक्र में जमा होगा।`;
    } else {
      reply = `आपकी कुल अनुमोदित राशि ₹${p.totalApproved.toLocaleString('en-IN')} (${p.quintal} क्विंटल ${p.crop}) तैयार है। आप बिना इंतज़ार किए अभी 80% अग्रिम (₹${p.advance.amount.toLocaleString('en-IN')}) सीधे अपने ${p.bank.name} खाते में ट्रांसफर कर सकते हैं!`;
    }
    suggestedChips = ["80% तुरंत पैसे कैसे लें?", "मेरा बैंक खाता बदलें", "मंडी पर्ची रसीद"];
  }

  // 6. 80% Instant Cash Advance / Loan Inquiry
  else if (
    q.includes('अग्रिम') ||
    q.includes('advance') ||
    q.includes('लोन') ||
    q.includes('loan') ||
    q.includes('मदद') ||
    q.includes('help') ||
    q.includes('तुरंत')
  ) {
    category = 'advance_info';
    const p = farmer.payment;
    reply = `सरकारी शून्य-ब्याज योजना के तहत आप अपनी स्वीकृत फसल राशि का 80% (₹${p.advance.amount.toLocaleString('en-IN')}) 120 सेकंड में UPI/IMPS द्वारा प्राप्त कर सकते हैं। 'Payments' स्क्रीन पर जाकर '⚡ तुरंत पैसे लें' बटन दबाएं।`;
    suggestedChips = ["भुगतान स्थिति देखें", "बैंक विवरण", "सहायता केंद्र"];
  }

  // 7. Gate, Weighbridge & Location
  else if (
    q.includes('गेट') ||
    q.includes('gate') ||
    q.includes('कांटा') ||
    q.includes('weighbridge') ||
    q.includes('कहाँ') ||
    q.includes('location') ||
    q.includes('रास्ता')
  ) {
    category = 'location';
    reply = `${center.name} का गेट नं. ${center.gateNumber} खुला है (समय: ${center.timing})। आपकी ट्रॉली (${farmer.vehicleNumber}) के लिए निर्धारित तौल कांटा नं. ${farmer.weighbridgeNo} है।`;
    suggestedChips = ["टोकन स्थिति", "प्रवेश QR पास", "मंडी में भीड़"];
  }

  // 8. Weather & Mandi Storage Advisory
  else if (
    q.includes('मौसम') ||
    q.includes('weather') ||
    q.includes('बारिश') ||
    q.includes('rain') ||
    q.includes('धूप')
  ) {
    category = 'weather';
    reply = `आज कोटा क्षेत्र में मौसम साफ और धूप खिली रहेगी (तापमान: 31°C)। आगामी 3 दिनों तक बारिश की कोई संभावना नहीं है। अनाज को मंडी शेड नं. 4 में सुरक्षित रखा गया है (नमी: 10.8%)।`;
    suggestedChips = ["आज गेहूं का क्या भाव है?", "मेरी तौल कब होगी?", "बीज और खाद"];
  }

  // 9. Seeds, Fertilizer & Marketplace
  else if (
    q.includes('बीज') ||
    q.includes('खाद') ||
    q.includes('यूरिया') ||
    q.includes('fertilizer') ||
    q.includes('seed') ||
    q.includes('खरीद')
  ) {
    category = 'marketplace';
    reply = `मंडी केंद्र पर प्रमाणित सरसों के बीज (Pusa Bold • ₹850/10kg) और IFFCO नैनो यूरिया लिक्विड (₹225/500ml) सरकारी सब्सिडी दर पर उपलब्ध हैं।`;
    suggestedChips = ["खाद कहाँ से मिलेगी?", "फसल बीमा योजना", "मुख्य पेज"];
  }

  // 10. Context-based default fallback
  else {
    category = 'context_default';
    if (screenContext === 'mandi-schedule' || screenContext === 'schedule') {
      reply = `आज मंडी खुली है (${center.timing})। आज ${center.todayCrop} MSP ₹${center.msp}/क्विंटल पर लिया जा रहा है। आप आज का टोकन स्लॉट सीधे बुक कर सकते हैं।`;
      suggestedChips = ["स्लॉट बुक करें", "कल क्या भाव रहेगा?", "गेट नं. क्या है?"];
    } else if (screenContext === 'token-and-queue' || screenContext === 'queue') {
      reply = `आपका टोकन #${farmer.token} है। आगे ${farmer.aheadCount} वाहन शेष हैं, लगभग ${farmer.estWaitMins} मिनट प्रतीक्षा समय है। कांटा #${farmer.weighbridgeNo} की ओर बढ़ें।`;
      suggestedChips = ["मेरी बारी कब आएगी?", "QR पास दिखाएं", "तौल के बाद क्या करें?"];
    } else if (screenContext === 'payments' || screenContext === 'payment') {
      reply = `आपका कुल भुगतान ₹${farmer.payment.totalApproved.toLocaleString('en-IN')} तैयार है। आप चाहें तो 80% (₹${farmer.payment.advance.amount.toLocaleString('en-IN')}) तुरंत अपने SBI बैंक में ले सकते हैं।`;
      suggestedChips = ["80% तुरंत पैसे लें", "खाता विवरण", "ई-मंडी बिल देखें"];
    } else {
      reply = `नमस्ते ${farmer.name}! मैं आपका 'साथी' AI सहायक हूँ। आप मुझसे अपनी फसल की तौल का समय, टोकन स्थिति, मंडी भाव (MSP), या 80% त्वरित भुगतान के बारे में कुछ भी पूछ सकते हैं।`;
      suggestedChips = ["मेरी फसल कब बिकेगी?", "आज गेहूं का भाव क्या है?", "मेरा टोकन नंबर क्या है?"];
    }
  }

  return res.json({
    reply,
    audioText: reply,
    category,
    suggestedChips,
    action,
    farmerId: farmer.farmerId,
    token: farmer.token,
    screenContext
  });
});

module.exports = router;
