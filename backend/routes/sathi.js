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

// Normalize vehicle strings for fuzzy matching (e.g. "RJ-20-EA-4412" -> "rj20ea4412")
function cleanStr(str) {
  return (str || '').toLowerCase().replace(/[\s\-_]/g, '');
}

// Check if string contains Devanagari script (Hindi)
function isHindiText(str) {
  return /[\u0900-\u097F]/.test(str);
}

// Build Live Mandi Grounding Context for the LLM
function buildSystemPrompt(farmer, center, screenContext, isEnglish) {
  const p = farmer.payment || {};
  const advanceTaken = p.advance && p.advance.taken;

  if (isEnglish) {
    return `
You are "Sathi (साथी)", the official, highly intelligent, respectful AI assistant for Indian farmers at APMC Kota Mandi e-Procurement Portal.
The user asked in English, so REPLY DIRECTLY IN CLEAR, POLITE, PROFESSIONAL ENGLISH.

Provide a complete, detailed, yet easy-to-read answer (2-4 sentences) with specific facts from the live data below.

=== LIVE REAL-TIME MANDI CONTEXT ===
- Mandi Name: ${center.name} (Center ID: ${center.centerId})
- Mandi Status: ${center.open ? 'OPEN' : 'CLOSED'} (${center.timing}) | Active Gate: Gate #${center.gateNumber}
- Today's Procurement Crop: ${center.todayCrop} (${center.cropGrade || 'Grade A Verified'})
- Govt. MSP Rate: ₹${center.msp.toLocaleString('en-IN')} per Quintal
- Upcoming: Tomorrow Mustard (Gate 1 & 3 • 8 AM – 4:30 PM), Day after Weekly Cleaning (Closed).
- Advance Slot Booking: Morning Slot (${center.slots?.[0]?.tokensLeft || 8} tokens left), Afternoon Slot (${center.slots?.[1]?.tokensLeft || 15} tokens left).

=== ACTIVE FARMER PROFILE ===
- Farmer Name: ${farmer.name} (ID: ${farmer.farmerId})
- Active Token Number: #${farmer.token}
- Vehicle Number: ${farmer.vehicleNumber} (${farmer.vehicleType})
- Loaded Commodity: ${farmer.commodity} (${farmer.commodityQty})
- Live Queue Stage: ${farmer.stage} (Stage ${farmer.stageIndex || 2} of 4: Gate Checkin → Weighbridge → Quality Grading → Gate Pass)
- Queue Position: ${farmer.aheadCount} vehicle(s) ahead
- Estimated Remaining Wait Time: ~${farmer.estWaitMins} minutes
- Designated Weighbridge: Weighbridge #${farmer.weighbridgeNo}
- Gate Priority Token currently at scale: #${farmer.atGateNumber}

=== PAYMENT & FINANCIAL STATUS ===
- Total Approved Procurement Value: ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} (${p.quintal || 50} Qtl @ ₹${center.msp}/Qtl)
- Lot Number: #${p.lotNumber || 'LOT-2026-8849'}
- Quality Specs: Moisture: ${p.quality?.moisture || '10.8%'}, Purity: ${p.quality?.purity || '99.4%'}, Shed: ${p.quality?.shed || 'Mandi Shed 4'}
- 80% Instant Cash Advance Scheme: ${advanceTaken ? 'Advance ₹91,000 already transferred to bank (UTR: ' + (p.advance?.utr || 'SBI982341209') + ')' : '₹91,000 (80%) available instantly with 0% interest via UPI/IMPS within 120 seconds'}
- Linked Bank: ${p.bank?.name || 'State Bank of India'} (Account •••• ${p.bank?.last4 || '4912'}, IFSC: ${p.bank?.ifsc || 'SBIN000210'})
- Mandi Tax: ₹0 (Exempted for farmers)

=== INSTRUCTIONS ===
1. Answer the query fully using the exact data above.
2. If the user provided a vehicle number (${farmer.vehicleNumber}), state the farmer name (${farmer.name}), token #${farmer.token}, queue stage (${farmer.stage}), weighbridge #${farmer.weighbridgeNo}, estimated wait (~${farmer.estWaitMins} min), and payment status.
3. Be respectful, helpful, and concise.
`.trim();
  }

  return `
You are "साथी (Sathi)", the official, highly intelligent, warm, respectful, and helpful AI assistant for Indian farmers at APMC Mandi (कृषि उपज मंडी - Kota Mandi e-Procurement Portal).
You speak primarily in clear, natural, polite Hindi (हिन्दी) with respectful honorifics (e.g. "राम लाल जी", "नमस्ते"), but you can also understand and reply in English, Hinglish, Punjabi, or Marathi if the farmer asks in those languages.

Keep your answers direct, empathetic, and actionable (2 to 4 sentences max). Use clean formatting suitable for mobile screens and voice readouts.

=== LIVE REAL-TIME MANDI CONTEXT ===
- Mandi Center: ${center.name} (ID: ${center.centerId})
- Mandi Status: ${center.open ? 'खुली है (OPEN)' : 'बंद है (CLOSED)'}
- Mandi Timings: ${center.timing} | Active Gate: ${center.gateNumber}
- Today's Procurement Crop: ${center.todayCrop} (${center.cropQuality || 'Grade-A Premium'})
- Govt. MSP Rate: ₹${center.msp.toLocaleString('en-IN')} प्रति क्विंटल
- Upcoming Procurement: कल सरसों (Mustard • Gate 1 & 3 • 8 AM – 4:30 PM), परसों सफाई अवकाश (Closed).
- Advance Slot Booking Status:
  * Morning Slot (सुबह 09:00 - 11:00 AM): ${center.slots?.[0]?.tokensLeft || 8} टोकन उपलब्ध
  * Afternoon Slot (दोपहर 01:00 - 03:00 PM): ${center.slots?.[1]?.tokensLeft || 15} टोकन उपलब्ध

=== CURRENT FARMER PROFILE ===
- Farmer Name: ${farmer.name} (Farmer ID: ${farmer.farmerId})
- Active Token Number: #${farmer.token}
- Vehicle Number: ${farmer.vehicleNumber} (${farmer.vehicleType})
- Commodity Loaded: ${farmer.commodity} (${farmer.commodityQty})
- Live Queue Stage: ${farmer.stage} (Stage ${farmer.stageIndex || 2} of 4: Gate Checkin → Weighbridge → Quality Grading → Gate Pass)
- Queue Position: आपके आगे केवल ${farmer.aheadCount} ट्रैक्टर हैं
- Estimated Remaining Wait: ~${farmer.estWaitMins} मिनट
- Designated Weighbridge: कांटा #${farmer.weighbridgeNo}
- Gate Priority Token currently at scale: #${farmer.atGateNumber}

=== PAYMENT & FINANCIAL STATUS ===
- Total Approved Procurement Value: ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} (${p.quintal || 50} क्विंटल @ ₹${center.msp}/Qtl)
- Lot Number: #${p.lotNumber || 'LOT-2026-8849'}
- Moisture: ${p.quality?.moisture || '10.8%'} | Purity: ${p.quality?.purity || '99.4%'} | Shed: ${p.quality?.shed || 'मंडी शेड 4'}
- 80% Instant Cash Advance Facility: ${advanceTaken ? 'अग्रिम ₹91,000 पहले ही आपके बैंक खाते में भेजा जा चुका है' : '₹91,000 (80%) तुरंत शून्य-ब्याज पर 120 सेकंड में UPI/IMPS द्वारा आपके खाते में उपलब्ध है'}
- Linked Bank: ${p.bank?.name || 'State Bank of India'} (खाता •••• ${p.bank?.last4 || '4912'}, IFSC: ${p.bank?.ifsc || 'SBIN000210'})
- Mandi Tax/Fee: ₹0 (सरकारी छूट - किसान से कोई शुल्क नहीं)

=== CORE INSTRUCTIONS ===
1. Answer the farmer's question directly using the LIVE facts above.
2. If asked about vehicle or token, give the full breakdown: Token #${farmer.token}, ~${farmer.estWaitMins} minutes wait, Weighbridge #${farmer.weighbridgeNo}, and approved payment.
3. Always maintain a cheerful, respectful tone with respectful Hindi words ("जी", "किसान भाई").
`.trim();
}

// Fallback High-Quality Sathi Agricultural Response Generator (Hindi & English)
function getFallbackReply(q, farmer, center, screenContext, isEnglish) {
  let reply = '';
  let category = 'general';
  const p = farmer.payment || {};
  const lowerQ = q.toLowerCase();

  // 1. Vehicle Number Query / Lookup
  const cleanQ = cleanStr(q);
  const cleanVeh = cleanStr(farmer.vehicleNumber);
  const isVehicleQuery = cleanQ.includes(cleanVeh) || cleanQ.includes('rj20') || cleanQ.includes('mp09') || cleanQ.includes('pb10') || cleanQ.includes('rj14') || lowerQ.includes('vehicle') || lowerQ.includes('गाड़ी') || lowerQ.includes('ट्रैक्टर') || lowerQ.includes('tractor');

  if (isVehicleQuery) {
    category = 'vehicle_status';
    if (isEnglish) {
      reply = `Vehicle ${farmer.vehicleNumber} belongs to ${farmer.name} (Token #${farmer.token}, ${farmer.vehicleType}). Current status is Stage ${farmer.stageIndex || 2} (${farmer.stage}) at Weighbridge #${farmer.weighbridgeNo}. Estimated wait is ~${farmer.estWaitMins} mins with ${farmer.aheadCount} vehicle(s) ahead. Approved payout is ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} with ₹${(p.advance?.amount || 91000).toLocaleString('en-IN')} (80%) instant cash advance available.`;
    } else {
      reply = `वाहन ${farmer.vehicleNumber} किसान ${farmer.name} का है (टोकन #${farmer.token}, ${farmer.vehicleType})। आपकी उपज (${farmer.commodityQty}) की तौल कांटा #${farmer.weighbridgeNo} पर निर्धारित है। अनुमानित प्रतीक्षा समय लगभग ${farmer.estWaitMins} मिनट है (आगे ${farmer.aheadCount} वाहन)। कुल स्वीकृत राशि ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} है, जिसमें 80% अग्रिम (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) तुरंत उपलब्ध है।`;
    }
    return { reply, category, modelUsed: '🌾 Kisan Sathi AI (Direct Mandi Engine)' };
  }

  // 2. Token / Queue Status
  if (lowerQ.includes('टोकन') || lowerQ.includes('token') || lowerQ.includes('नंबर') || lowerQ.includes('कतार') || lowerQ.includes('आगे') || lowerQ.includes('बारी') || lowerQ.includes('queue') || lowerQ.includes('line')) {
    category = 'queue_status';
    if (isEnglish) {
      reply = `${farmer.name}, your Token Number is #${farmer.token}. There are ${farmer.aheadCount} vehicle(s) ahead of you. Your turn at Weighbridge #${farmer.weighbridgeNo} is estimated in approximately ~${farmer.estWaitMins} minutes.`;
    } else {
      reply = `${farmer.name}, आपका टोकन नंबर #${farmer.token} है। आपके आगे अभी ${farmer.aheadCount} वाहन हैं। कांटा #${farmer.weighbridgeNo} पर आपकी अनुमानित बारी लगभग ${farmer.estWaitMins} मिनट में आएगी।`;
    }
  }
  // 3. Timing / Weighing / ETA
  else if (lowerQ.includes('कब') || lowerQ.includes('when') || lowerQ.includes('समय') || lowerQ.includes('wait') || lowerQ.includes('eta') || lowerQ.includes('तौल') || lowerQ.includes('बिकेगी') || lowerQ.includes('time')) {
    category = 'timing';
    if (isEnglish) {
      reply = `Your crop (${farmer.commodity}) weighing will begin in approximately ~${farmer.estWaitMins} minutes at Weighbridge #${farmer.weighbridgeNo}. Please stay ready with vehicle ${farmer.vehicleNumber}.`;
    } else {
      reply = `आपकी फसल की तौल लगभग ${farmer.estWaitMins} मिनट में कांटा #${farmer.weighbridgeNo} पर शुरू होगी। कृपया अपने वाहन (${farmer.vehicleNumber}) के साथ तैयार रहें।`;
    }
  }
  // 4. Rate / MSP / Price
  else if (lowerQ.includes('भाव') || lowerQ.includes('msp') || lowerQ.includes('रेट') || lowerQ.includes('कीमत') || lowerQ.includes('price') || lowerQ.includes('rate') || lowerQ.includes('गेहूं') || lowerQ.includes('wheat') || lowerQ.includes('सरसों') || lowerQ.includes('mustard')) {
    category = 'msp';
    if (isEnglish) {
      reply = `Today at ${center.name}, the Govt. MSP rate for ${center.todayCrop} is ₹${center.msp.toLocaleString('en-IN')}/Quintal (${center.cropGrade}). Tomorrow's procurement will be Mustard (Gate 1 & 3).`;
    } else {
      reply = `आज ${center.name} में ${center.todayCrop} का सरकारी समर्थन मूल्य (MSP) ₹${center.msp.toLocaleString('en-IN')} प्रति क्विंटल तय है (${center.cropGrade})। कल सरसों की खरीद होगी।`;
    }
  }
  // 5. Payment / Bank Transfer
  else if (lowerQ.includes('भुगतान') || lowerQ.includes('payment') || lowerQ.includes('पैसे') || lowerQ.includes('रुपये') || lowerQ.includes('खाता') || lowerQ.includes('bank') || lowerQ.includes('money') || lowerQ.includes('account')) {
    category = 'payment';
    if (isEnglish) {
      reply = `Your total approved procurement payment is ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} for ${p.quintal || 50} Qtl. You can get an 80% instant cash advance of ₹${(p.advance?.amount || 91000).toLocaleString('en-IN')} directly transferred to your ${p.bank?.name || 'SBI'} bank account within 120 seconds!`;
    } else {
      reply = `आपकी कुल अनुमोदित राशि ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} है। आप बिना किसी इंतज़ार के 80% अग्रिम राशि (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) तुरंत अपने ${p.bank?.name || 'SBI'} बैंक खाते में पा सकते हैं!`;
    }
  }
  // 6. 80% Instant Cash Advance
  else if (lowerQ.includes('अग्रिम') || lowerQ.includes('advance') || lowerQ.includes('लोन') || lowerQ.includes('तुरंत') || lowerQ.includes('80%') || lowerQ.includes('urgent')) {
    category = 'advance_info';
    if (isEnglish) {
      reply = `Under the zero-interest government scheme, you can claim 80% of your approved crop payment (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) within 120 seconds via UPI/IMPS directly to your linked bank account.`;
    } else {
      reply = `सरकारी शून्य-ब्याज योजना के तहत आप अपनी स्वीकृत उपज का 80% (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) 120 सेकंड में UPI/IMPS द्वारा सीधे बैंक खाते में ले सकते हैं।`;
    }
  }
  // 7. Slot Booking
  else if (lowerQ.includes('स्लॉट') || lowerQ.includes('slot') || lowerQ.includes('बुक') || lowerQ.includes('book') || lowerQ.includes('पास') || lowerQ.includes('pass') || lowerQ.includes('reserve')) {
    category = 'slot_booking';
    if (isEnglish) {
      reply = `Today at ${center.name}, available slots are: Morning 09-11 AM (${center.slots?.[0]?.tokensLeft || 8} tokens left) and Afternoon 01-03 PM (${center.slots?.[1]?.tokensLeft || 15} tokens left). You can reserve your token now.`;
    } else {
      reply = `आज ${center.name} में सुबह 09-11 AM (${center.slots?.[0]?.tokensLeft || 8} टोकन) और दोपहर 01-03 PM (${center.slots?.[1]?.tokensLeft || 15} टोकन) के स्लॉट उपलब्ध हैं। आप टोकन बुक कर सकते हैं।`;
    }
  }
  // 8. General Greeting / Fallback
  else {
    if (isEnglish) {
      reply = `Hello ${farmer.name}! I am your 'Sathi' AI assistant for Kota Mandi. You can ask me about your Token Status (#${farmer.token}), Vehicle #${farmer.vehicleNumber}, Remaining Wait Time (~${farmer.estWaitMins} mins), MSP Rates (₹${center.msp}/Qtl), or Claiming your 80% Instant Cash Advance.`;
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
    customBaseUrl = ''
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

  // Refresh dynamic queue metrics
  farmer = getDynamicQueueMetrics(db, farmer.farmerId) || farmer;

  // Language check: English if no Devanagari characters
  const isEnglish = !isHindiText(promptText);

  const systemPrompt = buildSystemPrompt(farmer, center, screenContext, isEnglish);
  let replyText = '';
  let modelUsed = '';
  let action = null;

  // Auto-action: Slot Booking
  if (promptText.includes('स्लॉट बुक') || cleanPrompt.includes('bookslot') || cleanPrompt.includes('reserveslot') || promptText.includes('टोकन बुक')) {
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
  if (promptText.includes('एडवांस भेज दो') || cleanPrompt.includes('claimadvance') || cleanPrompt.includes('sendadvance') || promptText.includes('क्लेम एडवांस')) {
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

  // 1. Google Gemini (Custom Key or Server Key)
  const geminiKey = (provider === 'gemini' && userKey) || serverKeys.gemini;
  if (!replyText && geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
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
      modelUsed = '✨ Google Gemini 1.5 Flash';
    } catch (err) {
      console.warn('Gemini API call failed, falling back:', err.message);
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

  // 4. Fallback to Grounded Kisan Sathi Engine (Hindi & English Support)
  if (!replyText) {
    const fallback = getFallbackReply(promptText, farmer, center, screenContext, isEnglish);
    replyText = fallback.reply;
    modelUsed = fallback.modelUsed;
  }

  const suggestedChips = isEnglish ? [
    "When will my crop be weighed?",
    "What is today's MSP rate?",
    "Check RJ-20-EA-4412 status",
    "How to get 80% advance?"
  ] : [
    "मेरी फसल कब बिकेगी?",
    "आज गेहूं का भाव क्या है?",
    "गाड़ी RJ-20-EA-4412 स्थिति",
    "80% एडवांस कैसे मिलेगा?"
  ];

  return res.json({
    reply: replyText,
    audioText: replyText,
    category: 'llm_response',
    modelUsed,
    suggestedChips,
    action,
    farmerId: farmer.farmerId,
    token: farmer.token,
    vehicleNumber: farmer.vehicleNumber,
    farmerName: farmer.name,
    isEnglish,
    screenContext
  });
});

module.exports = router;
