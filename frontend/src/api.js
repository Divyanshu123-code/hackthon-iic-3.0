const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

const DEFAULT_FARMER = {
  farmerId: "F1",
  name: "राम लाल जी",
  phone: "+91 98290 12345",
  token: 42,
  date: "2026-09-08",
  mandi: "APMC अनाज मंडी (Kota Mandi)",
  vehicleNumber: "RJ-20-EA-4412",
  vehicleType: "सोनालिका DI 745",
  commodity: "सोयाबीन (Yellow Soy)",
  commodityQty: "68 बोरी (50 Qtl)",
  centerId: "C1",
  stage: "weighing",
  stageIndex: 2,
  aheadCount: 4,
  estWaitMins: 25,
  atGateNumber: 38,
  weighbridgeNo: 3,
  stages: [
    { name: "arrived", label: "पहुंचे / Arrived", status: "done", timestamp: "10:15 AM" },
    { name: "weighing", label: "तौल / Weighing", status: "in_progress", timestamp: "10:45 AM" },
    { name: "grade", label: "गुणवत्ता / Grade", status: "pending", timestamp: null },
    { name: "pass", label: "पास / Pass", status: "pending", timestamp: null }
  ],
  payment: {
    totalApproved: 113750,
    quintal: 50,
    crop: "गेहूं Grade-A",
    lotNumber: "LOT-2026-8849",
    quality: { moisture: "10.8%", purity: "99.4%", shed: "मंडी शेड 4" },
    timeline: [
      { name: "weighed", label: "Weighed & Certified", status: "done", detail: "50.00 Qtl (धर्मकांटा पर्ची #4102)", timestamp: "11:30 AM" },
      { name: "quality_checked", label: "Quality Lab Verified", status: "done", detail: "Moisture 10.8% • Grade-A", timestamp: "11:45 AM" },
      { name: "payment_approved", label: "Payment Bill Approved", status: "done", detail: "₹1,13,750 via PFMS e-Bill", timestamp: "12:05 PM" },
      { name: "dbt_completed", label: "Final DBT Credit", status: "pending", detail: "Remaining ₹22,750 within 48 hrs", timestamp: null }
    ],
    advance: {
      eligible: true,
      amount: 91000,
      percentage: "80%",
      taken: false,
      utr: null,
      timestamp: null
    },
    bank: {
      name: "State Bank of India",
      last4: "4912",
      ifsc: "SBIN000210"
    }
  }
};

const DEFAULT_CENTER = {
  centerId: "C1",
  name: "APMC अनाज मंडी (Kota Mandi)",
  open: true,
  gateOpen: true,
  gateNumber: 2,
  timing: "8:00 AM – 5:00 PM",
  todayCrop: "गेहूं (Wheat)",
  cropQuality: "Sharbati & Lokwan Quality",
  cropGrade: "Grade A Verified",
  msp: 2275,
  totalProcuredTodayQtl: 185,
  totalApprovedAmount: 420875,
  totalAdvanceDisbursed: 91000,
  upcomingDays: [
    { day: "Sat", label: "कल", crop: "सरसों / Mustard", gate: "Gate 1 & Gate 3", timing: "8:00 AM – 4:30 PM", status: "open" },
    { day: "Sun", label: "परसों", crop: "साप्ताहिक अवकाश / Weekly Cleaning", gate: null, timing: null, status: "closed" },
    { day: "Mon", label: "सोमवार", crop: "सोयाबीन / Yellow Soy", gate: "Gate 2", timing: "8:00 AM – 5:00 PM", status: "open" }
  ],
  slots: [
    { id: "morning", label: "सुबह 09 – 11 AM", tokensLeft: 8 },
    { id: "afternoon", label: "दोपहर 01 – 03 PM", tokensLeft: 15 }
  ]
};

export async function getFarmerHome(farmerId = 'F1') {
  try {
    const res = await fetch(`${API_BASE}/farmer/${farmerId}/home`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return { farmer: DEFAULT_FARMER, center: DEFAULT_CENTER };
}

export async function getSchedule(centerId = 'C1') {
  try {
    const res = await fetch(`${API_BASE}/schedule/${centerId}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return DEFAULT_CENTER;
}

export async function bookSlot(centerId = 'C1', farmerId = 'F1', slotId = 'morning') {
  try {
    const res = await fetch(`${API_BASE}/schedule/${centerId}/book-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerId, slotId })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true, slot: slotId, token: DEFAULT_FARMER.token };
}

export async function getQueue(farmerId = 'F1') {
  try {
    const res = await fetch(`${API_BASE}/queue/${farmerId}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    farmer: DEFAULT_FARMER,
    gateNumber: DEFAULT_CENTER.gateNumber,
    aheadCount: DEFAULT_FARMER.aheadCount,
    estWaitMins: DEFAULT_FARMER.estWaitMins,
    atGateNumber: DEFAULT_FARMER.atGateNumber,
    weighbridgeNo: DEFAULT_FARMER.weighbridgeNo,
    stages: DEFAULT_FARMER.stages
  };
}

export async function getPayment(farmerId = 'F1') {
  try {
    const res = await fetch(`${API_BASE}/payment/${farmerId}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    farmer: DEFAULT_FARMER,
    msp: DEFAULT_CENTER.msp,
    payment: DEFAULT_FARMER.payment
  };
}

export async function requestAdvance(farmerId = 'F1') {
  try {
    const res = await fetch(`${API_BASE}/payment/${farmerId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerId })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const adv = { ...DEFAULT_FARMER.payment.advance, taken: true, utr: 'UTR' + Math.floor(100000000 + Math.random() * 900000000), timestamp: new Date().toISOString() };
  return { success: true, advance: adv };
}

// Robust Client-side Mandi Grounded AI Engine (works even when backend is offline)
function getClientMandiReply(query, lang = 'hi') {
  const lower = (query || '').toLowerCase();
  const clean = lower.replace(/[\s\-_]/g, '');

  if (clean.includes('rj20') || clean.includes('4412') || lower.includes('गाड़ी') || lower.includes('वाहन') || lower.includes('vehicle') || lower.includes('ਗੱਡੀ') || lower.includes('गाडी') || lower.includes('ગાડી')) {
    if (lang === 'pa') return 'ਵਾਹਨ RJ-20-EA-4412 (ਟੋਕਨ #214) ਕਿਸਾਨ ਰਾਮੇਸ਼ਵਰ ਚੌਧਰੀ ਦਾ ਹੈ। ਤੁਹਾਡਾ ਵਾਹਨ ਕੰਡੇ #3 \'ਤੇ ਤੋਲ ਲਈ ਨਿਰਧਾਰਿਤ ਹੈ। ਬਾਕੀ ਸਮਾਂ ਲਗਭਗ ~18 ਮਿੰਟ ਹੈ। 80% ਤੁਰੰਤ ਐਡਵਾਂਸ ₹91,000 ਉਪਲਬਧ ਹੈ।';
    if (lang === 'mr') return 'वाहन RJ-20-EA-4412 (टोकन #214) शेतकरी रामेश्वर चौधरी यांचे आहे. आपले पीक वजन काटा #3 वर निश्चित आहे. अंदाजे वेळ सुमारे ~18 मिनिटे आहे. 80% अ‍ॅडव्हान्स ₹91,000 त्वरित उपलब्ध आहे.';
    if (lang === 'gu') return 'વાહન RJ-20-EA-4412 (ટોકન #214) ખેડૂત રામેશ્વર ચૌધરીનું છે. તમારો પાક કાંટા #3 પર તોલ માટે નિર્ધારિત છે. અંદાજિત સમય ~18 મિનિટ છે. 80% એડવાન્સ ₹91,000 તરત ઉપલબ્ધ છે.';
    if (lang === 'en') return 'Vehicle RJ-20-EA-4412 (Token #214) belongs to Rameshwar Choudhary (Tractor Trolley, 50 Qtl Wheat). Designated at Weighbridge #3. Estimated wait is ~18 minutes with 3 vehicles ahead. 80% instant advance of ₹91,000 is ready for bank transfer.';
    return 'वाहन RJ-20-EA-4412 (टोकन #214) किसान रामेश्वर चौधरी का है। आपकी 50 क्विंटल गेहूं की तौल कांटा #3 पर निर्धारित है। अनुमानित प्रतीक्षा समय लगभग 18 मिनट है (आगे 3 वाहन)। कुल राशि ₹1,13,750 में से 80% अग्रिम (₹91,000) तुरंत उपलब्ध है।';
  }

  if (lower.includes('भाव') || lower.includes('msp') || lower.includes('रेट') || lower.includes('price') || lower.includes('ਦਰ') || lower.includes('ਗੇਹੂੰ') || lower.includes('गेहूं') || lower.includes('wheat')) {
    if (lang === 'pa') return 'ਅੱਜ ਕੋਟਾ ਮੰਡੀ ਵਿੱਚ ਗੇਹੂੰ (ਸ਼ਰਬਤੀ A-ਗ੍ਰੇਡ) ਦਾ ਸਰਕਾਰੀ ਐਮ.ਐਸ.ਪੀ ₹2,275 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ। ਕੱਲ੍ਹ ਸਰ੍ਹੋਂ ਦੀ ਖ਼ਰੀਦ ਹੋਵੇਗੀ।';
    if (lang === 'mr') return 'आज कोटा मंडीत गव्हाचा (ग्रेड-A) शासकीय हमीभाव (MSP) ₹2,275 प्रति क्विंटल आहे. उद्या मोहरीची खरेदी होईल.';
    if (lang === 'gu') return 'આજે કોટા મંડીમાં ઘઉંનો (ગ્રેડ-A) સરકારી ટેકાનો ભાવ (MSP) ₹2,275 પ્રતિ ક્વિન્ટલ છે. આવતીકાલે રાઈની ખરીદી થશે.';
    if (lang === 'en') return 'Today at APMC Kota Mandi, the Govt. MSP rate for Wheat (Grade-A Sharbati) is ₹2,275 per Quintal. Tomorrow\'s procurement will be Mustard (Gate 1 & 3).';
    return 'आज कोटा मंडी में गेहूं (ग्रेड-A शरबती) का सरकारी समर्थन मूल्य (MSP) ₹2,275 प्रति क्विंटल तय है। कल सरसों की खरीद होगी (गेट 1 व 3)।';
  }

  if (lower.includes('टोकन') || lower.includes('token') || lower.includes('बारी') || lower.includes('queue') || lower.includes('समय') || lower.includes('wait') || lower.includes('कब')) {
    if (lang === 'pa') return 'ਤੁਹਾਡਾ ਟੋਕਨ ਨੰਬਰ #214 ਹੈ। ਤੁਹਾਡੇ ਅੱਗੇ 3 ਵਾਹਨ ਹਨ। ਕੰਡਾ #3 \'ਤੇ ਤੁਹਾਡੀ ਵਾਰੀ ਲਗਭਗ ~18 ਮਿੰਟਾਂ ਵਿੱਚ ਆਵੇਗੀ।';
    if (lang === 'mr') return 'आपला टोकन क्रमांक #214 आहे. आपल्या पुढे 3 वाहने आहेत. काटा #3 वर आपली पाळी सुमारे ~18 मिनिटांत येईल.';
    if (lang === 'gu') return 'તમારો ટોકન નંબર #214 છે. તમારી આગળ 3 વાહનો છે. કાંટો #3 પર તમારો વારો આશરે ~18 મિનિટમાં આવશે.';
    if (lang === 'en') return 'Your Token is #214. There are 3 vehicles ahead of you at Weighbridge #3. Estimated wait time is ~18 minutes.';
    return 'रामेश्वर जी, आपका टोकन नंबर #214 है। आपके आगे अभी 3 वाहन हैं। कांटा #3 पर आपकी बारी लगभग 18 मिनट में आएगी।';
  }

  if (lower.includes('भुगतान') || lower.includes('payment') || lower.includes('पैसे') || lower.includes('advance') || lower.includes('80%') || lower.includes('अग्रिम')) {
    if (lang === 'pa') return 'ਤੁਹਾਡੀ ਕੁੱਲ ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਰਕਮ ₹1,13,750 ਹੈ। ਤੁਸੀਂ 80% ਐਡਵਾੰਸ (₹91,000) 120 ਸਕਿੰਟਾਂ ਦੇ ਅੰਦਰ ਆਪਣੇ SBI ਖਾਤੇ ਵਿੱਚ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹੋ!';
    if (lang === 'mr') return 'आपली एकूण मंजूर रक्कम ₹1,13,750 आहे. आपण 80% अ‍ॅडव्हान्स (₹91,000) 120 सेकंदात आपल्या SBI खात्यात मिळवू शकता!';
    if (lang === 'gu') return 'તમારી કુલ મંજૂર રકમ ₹1,13,750 છે. તમે 80% એડવાન્સ (₹91,000) 120 સેકન્ડમાં તમારા SBI ખાતામાં મેળવી શકો છો!';
    if (lang === 'en') return 'Your approved procurement amount is ₹1,13,750 (50 Qtl Wheat). You can claim an instant 80% cash advance of ₹91,000 directly to your SBI account within 120 seconds!';
    return 'आपकी कुल अनुमोदित राशि ₹1,13,750 है (50 क्विंटल गेहूं)। आप बिना किसी कागजी देरी के 80% अग्रिम राशि (₹91,000) तुरंत अपने SBI बैंक खाते में 120 सेकंड में प्राप्त कर सकते हैं!';
  }

  if (lang === 'pa') return 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਰਾਮੇਸ਼ਵਰ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਾਥੀ AI ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਟੋਕਨ #214, ਵਾਹਨ RJ-20-EA-4412, ਤੋਲ ਦਾ ਸਮਾਂ (~18 ਮਿੰਟ), ਜਾਂ ₹91,000 ਤੁਰੰਤ ਐਡਵਾਂਸ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।';
  if (lang === 'mr') return 'नमस्कार रामेश्वर जी! मी आपला साथी AI सहाय्यक आहे. आपण टोकन #214, वाहन RJ-20-EA-4412, वजन वेळ (~18 मिनिटे), किंवा ₹91,000 त्वरित अ‍ॅडव्हान्सबद्दल विचारू शकता.';
  if (lang === 'gu') return 'નમસ્તે રામેશ્વર જી! હું તમારો સાથી AI સહાયક છું. તમે ટોકન #214, વાહન RJ-20-EA-4412, તોલ સમય (~18 મિનિટ), અથવા ₹91,000 તરત એડવાન્સ વિશે પૂછી શકો છો.';
  if (lang === 'en') return 'Hello Rameshwar Ji! I am your Sathi AI Mandi Companion. You can ask about your Token #214, Vehicle RJ-20-EA-4412, Wait time (~18 mins), Wheat MSP (₹2,275/Qtl), or Claiming your ₹91,000 (80%) instant cash advance.';
  return 'नमस्ते रामेश्वर जी! मैं आपका साथी AI सहायक हूँ। आप मुझसे अपनी टोकन स्थिति (#214), वाहन RJ-20-EA-4412, कांटा #3 तौल समय (~18 मिनट), आज का गेहूं MSP (₹2,275/Qtl), या 80% तुरंत अग्रिम भुगतान (₹91,000) के बारे में पूछ सकते हैं।';
}

export async function askSathi({
  message,
  screenContext = 'home',
  farmerId = 'F1',
  conversation = [],
  customApiKey = '',
  customProvider = '',
  customBaseUrl = '',
  language = 'hi'
}) {
  const activeKey = customApiKey || (typeof window !== 'undefined' ? localStorage.getItem('sathi_api_key') : '') || import.meta.env.VITE_GEMINI_API_KEY || '';

  // 1. Try Backend API first
  try {
    const res = await fetch(`${API_BASE}/sathi/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        screenContext,
        farmerId,
        conversation,
        customApiKey: activeKey,
        customProvider,
        customBaseUrl,
        language
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend Sathi endpoint unavailable, trying direct client AI...');
  }

  // 2. Direct Browser-side Google Gemini REST API (if key is present)
  if (activeKey) {
    const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    const systemPrompt = `You are साथी (Sathi), the official AI assistant for Indian farmers at APMC Kota Mandi. Respond natively in language: ${language}. Keep answers concise, empathetic, and farmer-friendly (2-3 sentences). Live Context: Farmer Rameshwar Choudhary, Token #214, Vehicle RJ-20-EA-4412, Weighbridge #3 (~18 mins wait, 3 vehicles ahead), Wheat MSP ₹2,275/Qtl, Approved Amount ₹1,13,750 with 80% Instant Cash Advance of ₹91,000 available to SBI bank.`;

    for (const model of geminiModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nFarmer Query: ${message}` }]
                }
              ]
            })
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              reply: text.trim(),
              modelUsed: `✨ Google ${model} (Live AI)`
            };
          }
        }
      } catch (geminiErr) {
        console.warn(`Direct Gemini (${model}) failed:`, geminiErr);
      }
    }
  }

  // 3. Fallback to Grounded Multilingual Mandi Intelligence
  return {
    reply: getClientMandiReply(message, language),
    modelUsed: '🌾 Kisan Sathi AI (Mandi Grounded)'
  };
}

export async function getStaffData() {
  const res = await fetch(`${API_BASE}/staff/data`);
  if (!res.ok) throw new Error('Failed to fetch staff portal data');
  return res.json();
}

export async function updateStaffSchedule(schedulePayload) {
  const res = await fetch(`${API_BASE}/staff/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedulePayload)
  });
  if (!res.ok) throw new Error('Failed to update mandi schedule');
  return res.json();
}

export async function advanceFarmerStage(farmerId = 'F1', stage) {
  const res = await fetch(`${API_BASE}/staff/advance-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId, stage })
  });
  if (!res.ok) throw new Error('Failed to advance farmer stage');
  return res.json();
}

export async function advanceFarmerPayment(farmerId = 'F1', stage) {
  const res = await fetch(`${API_BASE}/staff/advance-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId, stage })
  });
  if (!res.ok) throw new Error('Failed to advance farmer payment');
  return res.json();
}

export async function sendAnnouncement(token, weighbridgeNo, customText) {
  const res = await fetch(`${API_BASE}/staff/announce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, weighbridgeNo, customText })
  });
  if (!res.ok) throw new Error('Failed to broadcast announcement');
  return res.json();
}

export async function resetDemoDb() {
  const res = await fetch(`${API_BASE}/staff/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset demo database');
  return res.json();
}

export function subscribeToStream(onMessage) {
  if (typeof window !== 'undefined' && !!window.EventSource) {
    const eventSource = new EventSource(`${API_BASE}/stream`);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type !== 'CONNECTED') {
          onMessage(parsed);
        }
      } catch (e) {
        onMessage({ type: 'UPDATE' });
      }
    };
    return () => eventSource.close();
  }
  return () => {};
}
