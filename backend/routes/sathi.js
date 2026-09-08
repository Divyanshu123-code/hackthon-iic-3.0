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

// Build Live Mandi Grounding Context for the LLM
function buildSystemPrompt(farmer, center, screenContext) {
  const p = farmer.payment || {};
  const advanceTaken = p.advance && p.advance.taken;

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
- Moisture: ${p.quality?.moisture || '10.8%'} (मानक 12% से कम - उत्कृष्ट) | Purity: ${p.quality?.purity || '99.4%'} | Shed: ${p.quality?.shed || 'मंडी शेड 4'}
- 80% Instant Cash Advance Facility: ${advanceTaken ? 'अग्रिम ₹91,000 पहले ही आपके बैंक खाते में भेजा जा चुका है (UTR: ' + (p.advance?.utr || 'SBI982341209') + ')' : '₹91,000 (80%) तुरंत शून्य-ब्याज पर 120 सेकंड में UPI/IMPS द्वारा आपके खाते में उपलब्ध है'}
- Linked Bank: ${p.bank?.name || 'State Bank of India'} (खाता •••• ${p.bank?.last4 || '4912'}, IFSC: ${p.bank?.ifsc || 'SBIN000210'})
- Mandi Tax/Fee: ₹0 (सरकारी छूट - किसान से कोई शुल्क नहीं)

=== CURRENT SCREEN CONTEXT ===
- Farmer is currently viewing screen: "${screenContext}" (options: home / schedule / queue / payment / financial_aid / marketplace)

=== CORE INSTRUCTIONS ===
1. Answer the farmer's question directly using the LIVE facts above.
2. If asked when their crop will be weighed/sold, mention their token #${farmer.token}, ~${farmer.estWaitMins} minutes wait, and weighbridge #${farmer.weighbridgeNo}.
3. If asked about money or payments, reassure them with their approved amount (₹${(p.totalApproved || 113750).toLocaleString('en-IN')}) and explain the 80% instant cash advance option.
4. If asked about rates, quote today's MSP (₹${center.msp}/Qtl) for ${center.todayCrop}.
5. If the farmer asks to book a slot, confirm that the morning or afternoon slot can be reserved.
6. Always maintain a cheerful, respectful, farmer-friendly tone with respectful Hindi words ("जी", "किसान भाई").
`.trim();
}

// Fallback High-Quality Sathi Agricultural Response Generator
function getFallbackReply(q, farmer, center, screenContext) {
  let reply = '';
  let category = 'general';
  const p = farmer.payment || {};

  if (q.includes('टोकन') || q.includes('token') || q.includes('नंबर') || q.includes('कतार') || q.includes('आगे') || q.includes('बारी') || q.includes('queue')) {
    category = 'queue_status';
    reply = `${farmer.name}, आपका टोकन नंबर #${farmer.token} है। आपके आगे अभी ${farmer.aheadCount} वाहन हैं। कांटा #${farmer.weighbridgeNo} पर आपकी अनुमानित बारी लगभग ${farmer.estWaitMins} मिनट में आएगी।`;
  } else if (q.includes('कब') || q.includes('when') || q.includes('समय') || q.includes('wait') || q.includes('eta') || q.includes('तौल') || q.includes('बिकेगी')) {
    category = 'timing';
    reply = `आपकी फसल की तौल लगभग ${farmer.estWaitMins} मिनट में कांटा #${farmer.weighbridgeNo} पर शुरू होगी। कृपया अपने ट्रैक्टर (${farmer.vehicleNumber}) के साथ तैयार रहें।`;
  } else if (q.includes('भाव') || q.includes('msp') || q.includes('रेट') || q.includes('कीमत') || q.includes('price') || q.includes('गेहूं') || q.includes('wheat') || q.includes('सरसों')) {
    category = 'msp';
    reply = `आज ${center.name} में ${center.todayCrop} का सरकारी समर्थन मूल्य (MSP) ₹${center.msp.toLocaleString('en-IN')} प्रति क्विंटल तय है (${center.cropGrade})। कल सरसों की खरीद होगी।`;
  } else if (q.includes('भुगतान') || q.includes('payment') || q.includes('पैसे') || q.includes('रुपये') || q.includes('खाता') || q.includes('bank') || q.includes('रुपया')) {
    category = 'payment';
    reply = `आपकी कुल अनुमोदित राशि ₹${(p.totalApproved || 113750).toLocaleString('en-IN')} है। आप बिना किसी इंतज़ार के 80% अग्रिम राशि (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) तुरंत अपने ${p.bank?.name || 'SBI'} बैंक खाते में पा सकते हैं!`;
  } else if (q.includes('अग्रिम') || q.includes('advance') || q.includes('लोन') || q.includes('तुरंत') || q.includes('80%')) {
    category = 'advance_info';
    reply = `सरकारी शून्य-ब्याज योजना के तहत आप अपनी स्वीकृत उपज का 80% (₹${(p.advance?.amount || 91000).toLocaleString('en-IN')}) 120 सेकंड में UPI/IMPS द्वारा सीधे बैंक खाते में ले सकते हैं।`;
  } else if (q.includes('स्लॉट') || q.includes('slot') || q.includes('बुक') || q.includes('book') || q.includes('पास') || q.includes('pass')) {
    category = 'slot_booking';
    reply = `आज ${center.name} में सुबह 09-11 AM (${center.slots?.[0]?.tokensLeft || 8} टोकन) और दोपहर 01-03 PM (${center.slots?.[1]?.tokensLeft || 15} टोकन) के स्लॉट उपलब्ध हैं। आप 'स्लॉट बुक करें' पर क्लिक कर सकते हैं।`;
  } else if (q.includes('मंडी') || q.includes('समय') || q.includes('गेट') || q.includes('gate') || q.includes('open') || q.includes('खुली')) {
    category = 'center_info';
    reply = `${center.name} आज खुली है (${center.timing})। मुख्य प्रवेश गेट #${center.gateNumber} है। आज केवल ${center.todayCrop} की खरीद की जा रही है।`;
  } else {
    reply = `नमस्ते ${farmer.name}! मैं आपका 'साथी' AI सहायक हूँ। आप मुझसे अपनी टोकन स्थिति (#${farmer.token}), तौल का समय (~${farmer.estWaitMins} मिनट), आज का MSP भाव (₹${center.msp}), या 80% तुरंत भुगतान के बारे में पूछ सकते हैं।`;
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
  let farmer = db.farmers.find(f => f.farmerId === farmerId) || db.farmers[0];
  const center = db.centers.find(c => c.centerId === (farmer ? farmer.centerId : 'C1')) || db.centers[0];

  farmer = getDynamicQueueMetrics(db, farmer.farmerId) || farmer;

  const promptText = (message || '').trim();
  if (!promptText) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemPrompt = buildSystemPrompt(farmer, center, screenContext);
  let replyText = '';
  let modelUsed = '';
  let action = null;

  // Auto-action detection: Slot Booking
  if (promptText.includes('स्लॉट बुक') || promptText.includes('book slot') || promptText.includes('reserve slot') || promptText.includes('टोकन बुक')) {
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

  // Auto-action detection: Cash Advance
  if (promptText.includes('एडवांस भेज दो') || promptText.includes('पैसे ट्रांसफर') || promptText.includes('क्लेम एडवांस')) {
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

      // Prepare conversation history for Gemini
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

  // 4. Fallback to Kisan Sathi Grounded AI Engine
  if (!replyText) {
    const fallback = getFallbackReply(promptText.toLowerCase(), farmer, center, screenContext);
    replyText = fallback.reply;
    modelUsed = fallback.modelUsed;
  }

  const suggestedChips = [
    "मेरी फसल कब बिकेगी?",
    "आज गेहूं का भाव क्या है?",
    "मेरा टोकन नंबर क्या है?",
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
    screenContext
  });
});

module.exports = router;
