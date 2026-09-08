const express = require('express');
const router = express.Router();
require('dotenv').config();

const { getDb, saveDb, getDynamicQueueMetrics } = require('../data/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Global server-configured keys from .env
const serverKeys = {
  gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  groq: process.env.GROQ_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || ''
};

// Normalize vehicle strings for fuzzy matching
function cleanStr(str) {
  return (str || '').toLowerCase().replace(/[\s\-_]/g, '');
}

// Check if string contains Devanagari / Gurmukhi / Gujarati script
function detectLanguageFromText(str, preferredLang = 'hi') {
  if (/[\u0A00-\u0A7F]/.test(str)) return 'pa'; // Punjabi (Gurmukhi)
  if (/[\u0A80-\u0AFF]/.test(str)) return 'gu'; // Gujarati
  if (/[\u0900-\u097F]/.test(str)) {
    if (preferredLang === 'mr') return 'mr'; // Marathi
    return 'hi'; // Hindi
  }
  if (preferredLang && preferredLang !== 'hi') return preferredLang;
  // If English/Latin text and preferred is english, use en
  return preferredLang || 'en';
}

const LANG_NAMES = {
  hi: 'Hindi (हिन्दी)',
  en: 'English',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)'
};

// Build Live Mandi Grounding Context for the LLM
function buildSystemPrompt(farmer, center, screenContext, targetLang) {
  const p = farmer.payment || {};
  const advanceTaken = p.advance && p.advance.taken;
  const langName = LANG_NAMES[targetLang] || 'Hindi';

  return `
You are "साथी (Sathi)", the official, highly intelligent, warm, respectful, and helpful AI assistant for Indian farmers at APMC Kota Mandi e-Procurement Portal.
The user's preferred language is ${langName}.
CRITICAL: YOU MUST WRITE YOUR ENTIRE RESPONSE NATIVELY IN ${langName}.

Keep your answers direct, empathetic, and actionable (2 to 4 sentences max). Use clean formatting suitable for mobile screens and voice readouts.

=== LIVE REAL-TIME MANDI CONTEXT ===
- Mandi Center: ${center.name} (ID: ${center.centerId})
- Mandi Status: ${center.open ? 'OPEN' : 'CLOSED'} (${center.timing}) | Active Gate: Gate #${center.gateNumber}
- Today's Procurement Crop: ${center.todayCrop} (${center.cropGrade || 'Grade-A Premium'})
- Govt. MSP Rate: ₹${center.msp.toLocaleString('en-IN')} per Quintal
- Upcoming Procurement: Tomorrow Mustard (Gate 1 & 3 • 8 AM – 4:30 PM), Day after Weekly Cleaning (Closed).
- Advance Slot Booking Status:
  * Morning Slot (09:00 - 11:00 AM): ${center.slots?.[0]?.tokensLeft || 8} tokens available
  * Afternoon Slot (01:00 - 03:00 PM): ${center.slots?.[1]?.tokensLeft || 15} tokens available

=== CURRENT FARMER PROFILE ===
- Farmer Name: ${farmer.name} (Farmer ID: ${farmer.farmerId})
- Active Token Number: #${farmer.token}
- Vehicle Number: ${farmer.vehicleNumber} (${farmer.vehicleType})
- Commodity Loaded: ${farmer.commodity} (${farmer.commodityQty})
- Live Queue Stage: ${farmer.stage} (Stage ${farmer.stageIndex || 2} of 4: Gate Checkin → Weighbridge → Quality Grading → Gate Pass)
- Queue Position: ${farmer.aheadCount} vehicle(s) ahead
- Estimated Remaining Wait: ~${farmer.estWaitMins} minutes
- Designated Weighbridge: Weighbridge #${farmer.weighbridgeNo}
- Gate Priority Token currently at scale: #${farmer.atGateNumber}

=== PAYMENT & FINANCIAL STATUS ===
- Total Approved Procurement Value: ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} (${p.quintal || 50} Qtl @ ₹${center.msp}/Qtl)
- Lot Number: #${p.lotNumber || 'LOT-2026-8849'}
- Moisture: ${p.quality?.moisture || '10.8%'} | Purity: ${p.quality?.purity || '99.4%'} | Shed: ${p.quality?.shed || 'Mandi Shed 4'}
- 80% Instant Cash Advance Facility: ${advanceTaken ? 'Advance ₹91,000 already transferred to bank' : '₹91,000 (80%) available instantly with 0% interest via UPI/IMPS within 120 seconds'}
- Linked Bank: ${p.bank?.name || 'State Bank of India'} (Account •••• ${p.bank?.last4 || '4912'}, IFSC: ${p.bank?.ifsc || 'SBIN000210'})
- Mandi Tax/Fee: ₹0 (Exempted for farmers)

=== CURRENT SCREEN CONTEXT ===
- Farmer is currently viewing screen: "${screenContext}"

=== CORE INSTRUCTIONS ===
1. Answer the query directly using the LIVE facts above.
2. Output in ${langName}.
3. If asked about vehicle or token, give the full breakdown (Token #${farmer.token}, ~${farmer.estWaitMins} mins wait, Weighbridge #${farmer.weighbridgeNo}, approved payout).
4. Always maintain a cheerful, respectful, farmer-friendly tone.
`.trim();
}

// Fallback High-Quality Sathi Agricultural Response Generator for 5 Indian Languages
function getFallbackReply(q, farmer, center, screenContext, lang) {
  let reply = '';
  let category = 'general';
  const p = farmer.payment || {};
  const lowerQ = q.toLowerCase();

  const cleanQ = cleanStr(q);
  const cleanVeh = cleanStr(farmer.vehicleNumber);
  const isVehicleQuery = cleanQ.includes(cleanVeh) || cleanQ.includes('rj20') || cleanQ.includes('mp09') || cleanQ.includes('pb10') || cleanQ.includes('rj14') || lowerQ.includes('vehicle') || lowerQ.includes('गाड़ी') || lowerQ.includes('ਗੱਡੀ') || lowerQ.includes('गाडी') || lowerQ.includes('ગાડી');

  // 1. Vehicle Number Lookup
  if (isVehicleQuery) {
    category = 'vehicle_status';
    if (lang === 'en') {
      reply = `Vehicle ${farmer.vehicleNumber} belongs to ${farmer.name} (Token #${farmer.token}, ${farmer.vehicleType}). Current status is Stage ${farmer.stageIndex || 2} (${farmer.stage}) at Weighbridge #${farmer.weighbridgeNo}. Estimated wait is ~${farmer.estWaitMins} mins with ${farmer.aheadCount} vehicle(s) ahead. Approved payout is ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} with ₹${(p.advance?.amount || 91000).toLocaleString('en-IN')} (80%) instant cash advance available.`;
    } else if (lang === 'pa') {
      reply = `ਵਾਹਨ ${farmer.vehicleNumber} ਕਿਸਾਨ ${farmer.name} ਦਾ ਹੈ (ਟੋਕਨ #${farmer.token}, ${farmer.vehicleType})। ਤੁਹਾਡੀ ਫ਼ਸਲ ਕੰਡੇ #${farmer.weighbridgeNo} 'ਤੇ ਤੋਲ ਲਈ ਨਿਰਧਾਰਿਤ ਹੈ। ਬਾਕੀ ਸਮਾਂ ਲਗਭਗ ${farmer.estWaitMins} ਮਿੰਟ ਹੈ। ਕੁੱਲ ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਰਕਮ ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} ਹੈ, ਜਿਸ ਵਿੱਚ 80% ਐਡਵਾਂਸ (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) ਤੁਰੰਤ ਉਪਲਬਧ ਹੈ।`;
    } else if (lang === 'mr') {
      reply = `वाहन ${farmer.vehicleNumber} शेतकरी ${farmer.name} यांचे आहे (टोकन #${farmer.token}, ${farmer.vehicleType}). आपले पीक वजन काटा #${farmer.weighbridgeNo} वर निश्चित आहे. अंदाजे वेळ सुमारे ${farmer.estWaitMins} मिनिटे आहे. एकूण मंजूर रक्कम ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} असून, 80% अ‍ॅडव्हान्स (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) त्वरित उपलब्ध आहे.`;
    } else if (lang === 'gu') {
      reply = `વાહન ${farmer.vehicleNumber} ખેડૂત ${farmer.name} નું છે (ટોકન #${farmer.token}, ${farmer.vehicleType}). તમારો પાક કાંટા #${farmer.weighbridgeNo} પર તોલ માટે નિર્ધારિત છે. અંદાજિત સમય લગભગ ${farmer.estWaitMins} મિનિટ છે. કુલ મંજૂર રકમ ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} છે, જેમાં 80% એડવાન્સ (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) તરત ઉપલબ્ધ છે.`;
    } else {
      reply = `वाहन ${farmer.vehicleNumber} किसान ${farmer.name} का है (टोकन #${farmer.token}, ${farmer.vehicleType})। आपकी उपज (${farmer.commodityQty}) की तौल कांटा #${farmer.weighbridgeNo} पर निर्धारित है। अनुमानित प्रतीक्षा समय लगभग ${farmer.estWaitMins} मिनट है (आगे ${farmer.aheadCount} वाहन)। कुल स्वीकृत राशि ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} है, जिसमें 80% अग्रिम (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) तुरंत उपलब्ध है।`;
    }
    return { reply, category, modelUsed: '🌾 Kisan Sathi AI (Direct Mandi Engine)' };
  }

  // 2. Token / Queue Status
  if (lowerQ.includes('टोकन') || lowerQ.includes('token') || lowerQ.includes('ਨੰਬਰ') || lowerQ.includes('नंबर') || lowerQ.includes('કતાર') || lowerQ.includes('रांग') || lowerQ.includes('queue') || lowerQ.includes('line')) {
    category = 'queue_status';
    if (lang === 'en') {
      reply = `${farmer.name}, your Token Number is #${farmer.token}. There are ${farmer.aheadCount} vehicle(s) ahead of you. Your turn at Weighbridge #${farmer.weighbridgeNo} is estimated in approximately ~${farmer.estWaitMins} minutes.`;
    } else if (lang === 'pa') {
      reply = `${farmer.name}, ਤੁਹਾਡਾ ਟੋਕਨ ਨੰਬਰ #${farmer.token} ਹੈ। ਤੁਹਾਡੇ ਅੱਗੇ ਅਜੇ ${farmer.aheadCount} ਵਾਹਨ ਹਨ। ਕੰਡਾ #${farmer.weighbridgeNo} 'ਤੇ ਤੁਹਾਡੀ ਵਾਰੀ ਲਗਭਗ ${farmer.estWaitMins} ਮਿੰਟਾਂ ਵਿੱਚ ਆਵੇਗੀ।`;
    } else if (lang === 'mr') {
      reply = `${farmer.name}, आपला टोकन क्रमांक #${farmer.token} आहे. आपल्या पुढे सध्या ${farmer.aheadCount} वाहने आहेत. काटा #${farmer.weighbridgeNo} वर आपली पाळी सुमारे ${farmer.estWaitMins} मिनिटांत येईल.`;
    } else if (lang === 'gu') {
      reply = `${farmer.name}, તમારો ટોકન નંબર #${farmer.token} છે. તમારી આગળ હજુ ${farmer.aheadCount} વાહનો છે. કાંટો #${farmer.weighbridgeNo} પર તમારો વારો આશરે ${farmer.estWaitMins} મિનિટમાં આવશે.`;
    } else {
      reply = `${farmer.name}, आपका टोकन नंबर #${farmer.token} है। आपके आगे अभी ${farmer.aheadCount} वाहन हैं। कांटा #${farmer.weighbridgeNo} पर आपकी अनुमानित बारी लगभग ${farmer.estWaitMins} मिनट में आएगी।`;
    }
  }
  // 3. Timing / Weighing
  else if (lowerQ.includes('कब') || lowerQ.includes('when') || lowerQ.includes('ਕਦੋਂ') || lowerQ.includes('कधी') || lowerQ.includes('ક્યારે') || lowerQ.includes('समय') || lowerQ.includes('wait') || lowerQ.includes('तौल')) {
    category = 'timing';
    if (lang === 'en') {
      reply = `Your crop (${farmer.commodity}) weighing will begin in approximately ~${farmer.estWaitMins} minutes at Weighbridge #${farmer.weighbridgeNo}. Please stay ready with vehicle ${farmer.vehicleNumber}.`;
    } else if (lang === 'pa') {
      reply = `ਤੁਹਾਡੀ ਫ਼ਸਲ ਦੀ ਤੋਲ ਲਗਭਗ ${farmer.estWaitMins} ਮਿੰਟਾਂ ਵਿੱਚ ਕੰਡਾ #${farmer.weighbridgeNo} 'ਤੇ ਸ਼ੁਰੂ ਹੋਵੇਗੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਵਾਹਨ (${farmer.vehicleNumber}) ਨਾਲ ਤਿਆਰ ਰਹੋ।`;
    } else if (lang === 'mr') {
      reply = `आपल्या पिकाचे वजन सुमारे ${farmer.estWaitMins} मिनिटांत काटा #${farmer.weighbridgeNo} वर सुरू होईल. कृपया आपल्या वाहनासह (${farmer.vehicleNumber}) तयार राहा.`;
    } else if (lang === 'gu') {
      reply = `તમારા પાકની તોલ આશરે ${farmer.estWaitMins} મિનિટમાં કાંટો #${farmer.weighbridgeNo} પર શરૂ થશે. કૃપા કરીને તમારા વાહન (${farmer.vehicleNumber}) સાથે તૈયાર રહો.`;
    } else {
      reply = `आपकी फसल की तौल लगभग ${farmer.estWaitMins} मिनट में कांटा #${farmer.weighbridgeNo} पर शुरू होगी। कृपया अपने वाहन (${farmer.vehicleNumber}) के साथ तैयार रहें।`;
    }
  }
  // 4. MSP / Rate
  else if (lowerQ.includes('भाव') || lowerQ.includes('msp') || lowerQ.includes('रेट') || lowerQ.includes('ਭਾਅ') || lowerQ.includes('દર') || lowerQ.includes('price') || lowerQ.includes('rate')) {
    category = 'msp';
    if (lang === 'en') {
      reply = `Today at ${center.name}, the Govt. MSP rate for ${center.todayCrop} is ₹${center.msp.toLocaleString('en-IN')}/Quintal (${center.cropGrade}). Tomorrow's procurement will be Mustard (Gate 1 & 3).`;
    } else if (lang === 'pa') {
      reply = `ਅੱਜ ${center.name} ਵਿੱਚ ${center.todayCrop} ਦਾ ਸਰਕਾਰੀ ਐਮ.ਐਸ.ਪੀ ₹${center.msp.toLocaleString('en-IN')} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ (${center.cropGrade})। ਕੱਲ੍ਹ ਸਰ੍ਹੋਂ ਦੀ ਖ਼ਰੀਦ ਹੋਵੇਗੀ।`;
    } else if (lang === 'mr') {
      reply = `आज ${center.name} मध्ये ${center.todayCrop} चा शासकीय हमीभाव (MSP) ₹${center.msp.toLocaleString('en-IN')} प्रति क्विंटल आहे (${center.cropGrade}). उद्या मोहरीची खरेदी होईल.`;
    } else if (lang === 'gu') {
      reply = `આજે ${center.name} માં ${center.todayCrop} નો સરકારી ટેકાનો ભાવ (MSP) ₹${center.msp.toLocaleString('en-IN')} પ્રતિ ક્વિન્ટલ છે (${center.cropGrade}). આવતીકાલે રાઈની ખરીદી થશે.`;
    } else {
      reply = `आज ${center.name} में ${center.todayCrop} का सरकारी समर्थन मूल्य (MSP) ₹${center.msp.toLocaleString('en-IN')} प्रति क्विंटल तय है (${center.cropGrade})। कल सरसों की खरीद होगी।`;
    }
  }
  // 5. Payment / 80% Advance
  else if (lowerQ.includes('भुगतान') || lowerQ.includes('payment') || lowerQ.includes('पैसे') || lowerQ.includes('advance') || lowerQ.includes('ਅੱਡਵਾਂਸ') || lowerQ.includes('પૈસા') || lowerQ.includes('80%')) {
    category = 'payment';
    if (lang === 'en') {
      reply = `Your total approved procurement payment is ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} for ${p.quintal || 50} Qtl. You can get an 80% instant cash advance of ₹${(p.advance?.amount || 91000).toLocaleString('en-IN')} directly transferred to your ${p.bank?.name || 'SBI'} bank account within 120 seconds!`;
    } else if (lang === 'pa') {
      reply = `ਤੁਹਾਡੀ ਕੁੱਲ ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਰਕਮ ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} ਹੈ। ਤੁਸੀਂ ਬਿਨਾਂ ਉਡੀਕ ਕੀਤੇ 80% ਐਡਵਾਂਸ (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) ਤੁਰੰਤ ਆਪਣੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹੋ!`;
    } else if (lang === 'mr') {
      reply = `आपली एकूण मंजूर रक्कम ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} आहे. आपण प्रतीक्षा न करता 80% अ‍ॅडव्हान्स (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) त्वरित बँक खात्यात मिळवू शकता!`;
    } else if (lang === 'gu') {
      reply = `તમારી કુલ મંજૂર રકમ ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} છે. તમે રાહ જોયા વગર 80% એડવાન્સ (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) તરત તમારા બેંક ખાતામાં મેળવી શકો છો!`;
    } else {
      reply = `आपकी कुल अनुमोदित राशि ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} है। आप बिना किसी इंतज़ार के 80% अग्रिम राशि (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) तुरंत अपने ${p.bank?.name || 'SBI'} बैंक खाते में पा सकते हैं!`;
    }
  }
  // 6. General Greeting / Fallback
  else {
    if (lang === 'en') {
      reply = `Hello ${farmer.name}! I am your 'Sathi' AI assistant for Kota Mandi. You can ask me about your Token Status (#${farmer.token}), Vehicle #${farmer.vehicleNumber}, Remaining Wait Time (~${farmer.estWaitMins} mins), MSP Rates (₹${center.msp}/Qtl), or Claiming your 80% Instant Cash Advance.`;
    } else if (lang === 'pa') {
      reply = `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ${farmer.name}! ਮੈਂ ਤੁਹਾਡਾ 'ਸਾਥੀ' AI ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਟੋਕਨ ਸਥਿਤੀ (#${farmer.token}), ਵਾਹਨ #${farmer.vehicleNumber}, ਤੋਲ ਦਾ ਸਮਾਂ (~${farmer.estWaitMins} ਮਿੰਟ), ਜਾਂ 80% ਤੁਰੰਤ ਭੁਗਤਾਨ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।`;
    } else if (lang === 'mr') {
      reply = `नमस्कार ${farmer.name}! मी तुमचा 'साथी' AI सहाय्यक आहे. आपण टोकन स्थिती (#${farmer.token}), वाहन #${farmer.vehicleNumber}, वजन वेळ (~${farmer.estWaitMins} मिनिटे), किंवा 80% त्वरित पेमेंटबद्दल विचारू शकता.`;
    } else if (lang === 'gu') {
      reply = `નમસ્તે ${farmer.name}! હું તમારો 'સાથી' AI સહાયક છું. તમે ટોકન સ્થિતિ (#${farmer.token}), વાહન #${farmer.vehicleNumber}, તોલ સમય (~${farmer.estWaitMins} મિનિટ), અથવા 80% તરત ચુકવણી વિશે પૂછી શકો છો.`;
    } else {
      reply = `नमस्ते ${farmer.name}! मैं आपका 'साथी' AI सहायक हूँ। आप मुझसे अपनी टोकन स्थिति (#${farmer.token}), वाहन #${farmer.vehicleNumber}, तौल का समय (~${farmer.estWaitMins} मिनट), आज का MSP भाव (₹${center.msp}), या 80% तुरंत भुगतान के बारे में पूछ सकते हैं।`;
    }
  }

  return { reply, category, modelUsed: '🌾 Kisan Sathi AI (Direct Mandi Engine)' };
}

// POST /api/sathi/query
router.post('/query', async (req, res) => {
  const {
    message = '',
    screenContext = 'home',
    farmerId = 'F1',
    conversation = [],
    customApiKey = '',
    customProvider = '',
    customBaseUrl = '',
    language = 'hi'
  } = req.body;

  const db = getDb();
  const promptText = (message || '').trim();
  if (!promptText) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 1. Smart Entity Resolution: Match Farmer by Vehicle No, Token #, or Farmer ID
  const cleanPrompt = cleanStr(promptText);
  let matchedFarmer = db.farmers.find(f => {
    const cleanVeh = cleanStr(f.vehicleNumber);
    const cleanTok = String(f.token);
    const cleanName = cleanStr(f.name);
    return cleanPrompt.includes(cleanVeh) || cleanPrompt.includes(`token${cleanTok}`) || cleanPrompt.includes(`#${cleanTok}`) || (cleanPrompt.includes(cleanTok) && cleanPrompt.length < 6) || cleanPrompt.includes(cleanName);
  });

  let farmer = matchedFarmer || db.farmers.find(f => f.farmerId === farmerId) || db.farmers[0];
  const center = db.centers.find(c => c.centerId === (farmer ? farmer.centerId : 'C1')) || db.centers[0];

  farmer = getDynamicQueueMetrics(db, farmer.farmerId) || farmer;

  // Detect language from text or explicit request param
  const activeLang = detectLanguageFromText(promptText, language);

  const systemPrompt = buildSystemPrompt(farmer, center, screenContext, activeLang);
  let replyText = '';
  let modelUsed = '';
  let action = null;

  // Auto-action: Slot Booking
  if (promptText.includes('स्लॉट बुक') || cleanPrompt.includes('bookslot') || cleanPrompt.includes('reserveslot') || promptText.includes('ਸਲਾਟ ਬੁੱਕ')) {
    const slot = center.slots.find(s => s.tokensLeft > 0) || center.slots[0];
    if (slot && slot.tokensLeft > 0) {
      slot.tokensLeft -= 1;
      saveDb(db, {
        type: 'SLOT_BOOKED',
        message: `${farmer.name} ने साथी AI के माध्यम से ${slot.label} का स्लॉट आरक्षित किया`
      });
      action = { type: 'SLOT_BOOKED', slot: slot.label, token: farmer.token };
    }
  }

  // Auto-action: Cash Advance
  if (promptText.includes('एडवांस भेज दो') || cleanPrompt.includes('claimadvance') || cleanPrompt.includes('sendadvance') || promptText.includes('ਐਡਵਾਂਸ')) {
    if (farmer.payment && !farmer.payment.advance?.taken) {
      farmer.payment.advance = farmer.payment.advance || {};
      farmer.payment.advance.taken = true;
      farmer.payment.advance.utr = 'UTR' + Math.floor(100000000 + Math.random() * 900000000);
      farmer.payment.advance.timestamp = new Date().toISOString();
      saveDb(db, {
        type: 'PAYMENT_ADVANCED',
        message: `${farmer.name} ने साथी AI के माध्यम से 80% अग्रिम राशि प्राप्त की`
      });
      action = { type: 'ADVANCE_PROCESSED', utr: farmer.payment.advance.utr, amount: farmer.payment.advance.amount };
    }
  }

  const userKey = customApiKey || '';
  const provider = (customProvider || '').toLowerCase();

  // 1. Google Gemini
  const geminiKey = (provider === 'gemini' && userKey) || serverKeys.gemini;
  if (!replyText && geminiKey) {
    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    for (const modelName of modelsToTry) {
      if (replyText) break;
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt
        });

        const chat = model.startChat({
          history: conversation.slice(-6).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }))
        });

        const result = await chat.sendMessage(promptText);
        const response = await result.response;
        replyText = response.text().trim();
        modelUsed = `✨ Google ${modelName}`;
        break;
      } catch (err) {
        console.warn(`Gemini (${modelName}) failed, trying next:`, err.message);
      }
    }
  }

  // 2. Groq (Super fast & free LLM)
  const groqKey = (provider === 'groq' && userKey) || serverKeys.groq;
  if (!replyText && groqKey) {
    try {
      const groqClient = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1'
      });
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.slice(-6).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: promptText }
      ];
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 350
      });
      replyText = response.choices[0]?.message?.content?.trim();
      modelUsed = '⚡ Groq (Llama 3.3 70B)';
    } catch (err) {
      console.warn('Groq API call failed, falling back:', err.message);
    }
  }

  // 3. OpenAI / Custom OpenAI-compatible provider
  const openAIKey = (provider === 'openai' && userKey) || (userKey && !provider ? userKey : '') || serverKeys.openai;
  const baseUrl = customBaseUrl || (provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : undefined);

  if (!replyText && openAIKey) {
    try {
      const openaiClient = new OpenAI({
        apiKey: openAIKey,
        baseURL: baseUrl
      });
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.slice(-6).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: promptText }
      ];
      const response = await openaiClient.chat.completions.create({
        model: provider === 'openrouter' ? 'google/gemini-2.0-flash-lite-preview-02-05:free' : 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 350
      });
      replyText = response.choices[0]?.message?.content?.trim();
      modelUsed = baseUrl ? '🌐 OpenRouter AI' : '🤖 OpenAI GPT-4o-mini';
    } catch (err) {
      console.warn('OpenAI/Compatible call failed, falling back:', err.message);
    }
  }

  // 4. Fallback to Grounded Kisan Sathi Multi-Lingual Engine
  if (!replyText) {
    const fallback = getFallbackReply(promptText, farmer, center, screenContext, activeLang);
    replyText = fallback.reply;
    modelUsed = fallback.modelUsed;
  }

  const chipsMap = {
    en: ["When will my crop be weighed?", "What is today's MSP rate?", "Check RJ-20-EA-4412 status", "How to get 80% advance?"],
    pa: ["ਮੇਰੀ ਫ਼ਸਲ ਕਦੋਂ ਤੁਲੇਗੀ?", "ਅੱਜ ਕਣਕ ਦਾ ਕੀ ਭਾਅ ਹੈ?", "ਗੱਡੀ RJ-20-EA-4412 ਸਥਿਤੀ", "80% ਐਡਵਾਂਸ ਕਿਵੇਂ ਮਿਲੇਗਾ?"],
    mr: ["माझे पीक कधी मोजले जाईल?", "आज गव्हाचा भाव काय आहे?", "गाडी RJ-20-EA-4412 स्थिती", "80% अ‍ॅडव्हान्स कसा मिळेल?"],
    gu: ["મારો પાક ક્યારે તોલાશે?", "આજે ઘઉંનો ભાવ શું છે?", "વાહન RJ-20-EA-4412 સ્થિતિ", "80% એડવાન્સ કેવી રીતે મળશે?"],
    hi: ["मेरी फसल कब बिकेगी?", "आज गेहूं का भाव क्या है?", "गाड़ी RJ-20-EA-4412 स्थिति", "80% एडवांस कैसे मिलेगा?"]
  };

  return res.json({
    reply: replyText,
    audioText: replyText,
    category: 'llm_response',
    modelUsed,
    suggestedChips: chipsMap[activeLang] || chipsMap.hi,
    action,
    farmerId: farmer.farmerId,
    token: farmer.token,
    vehicleNumber: farmer.vehicleNumber,
    farmerName: farmer.name,
    language: activeLang,
    screenContext
  });
});

module.exports = router;
