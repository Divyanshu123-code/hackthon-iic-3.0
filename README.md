# Sahayak (सहायक) — Kisan e-Procurement & Mandi Companion
> **National Agriculture Market (e-NAM) & APMC Digital Procurement Platform**  
> *Empowering Indian farmers with live token queues, instant 80% DBT advance payouts, multilingual voice AI, and transparent mandi operations.*

---

## 📌 Problem Statement

Agricultural procurement in Indian APMC (Agricultural Produce Market Committee) mandis faces critical structural bottlenecks:

1. **Unpredictable Physical Queues & Yard Congestion**:
   Farmers wait 12 to 36 hours in tractor queues outside mandi gates without visibility into real-time weighbridge traffic, gate status, or unloading schedules.
2. **Opaque Quality Grading & Middlemen Exploitation**:
   Discretionary manual inspection creates disputes over moisture levels, purity, and grade categorization, often forcing distress sales below the Minimum Support Price (MSP).
3. **Liquidity Crunch & Delayed DBT Payouts**:
   Farmers urgently need working capital for diesel, transport, and next-season inputs (seeds/fertilizers), but traditional PFMS / direct bank transfers take days to process.
4. **Language & Digital Literacy Barriers**:
   Existing government portals are desktop-centric and text-heavy, alienating smallholders and regional farmers who communicate primarily through spoken regional languages.
5. **Disconnected Mandi Yard Administration**:
   Mandi operators and weighbridge staff lack real-time digital tools to regulate truck inflow, announce queue turns, and update daily procurement schedules dynamically.

---

## 💡 What We Planned to Solve the Problem

To address these challenges comprehensively, we designed **Sahayak (सहायक)** around five core pillars:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAHAYAK ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                                 │
          ▼                                                 ▼
┌───────────────────────────┐                     ┌───────────────────────────┐
│   Farmer Mobile PWA       │                     │  Mandi Web Workstation    │
│  (React 18 + Khadi Design)│                     │ (Desktop Portal + Staff)  │
└─────────────┬─────────────┘                     └─────────────┬─────────────┘
              │                                                 │
              ├─────────────── Server-Sent Events ──────────────┤
              │              (Real-Time SSE Sync)               │
              ▼                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Node.js Express API & Dynamic Queue Engine                  │
│       (Token Allocation • 4-Stage Pipeline • PFMS / Instant DBT Advance)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               Sathi (साथी) Multilingual Grounded Voice AI                    │
│    (Gemini 1.5 Flash • Groq Llama 3.3 • Web Speech TTS & STT in 5 Languages) │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Dual-Interface Accessibility**:
   - **Mobile PWA (Farmer View)**: Touch-optimized, vernacular, high-contrast tactile cards with visual progress steppers and voice guidance.
   - **Desktop Web Portal (Yard View)**: Wide-screen administrative dashboard with multi-column analytics, electronic queue boards, and printer-ready pass issuance.
2. **Live Digital Token & Weighbridge Queue System**:
   Time-window slot reservation (Morning/Afternoon), automated queue calculation, and priority QR gate passes to eliminate physical congestion.
3. **Instant 80% Cash Advance Facility**:
   Zero-interest government-subsidized immediate advance disbursed within 120 seconds directly to the farmer's linked Aadhaar/bank account upon weighment certification.
4. **Multilingual Voice AI Companion ("साथी / Sathi")**:
   Spoken AI assistant supporting 5 regional languages (Hindi, English, Punjabi, Marathi, Gujarati), grounded directly on live APMC data.
5. **Bidirectional Real-Time Synchronization**:
   Server-Sent Events (SSE) to update farmer queues, gate status, and PA loudspeaker announcements in real time without manual page refreshes.

---

## 🛠️ What We Made (Built Features & Modules)

### 1. 📱 Farmer Mobile Application (PWA)
- **Authentic Mandi Pass (`FarmerHome.jsx`)**: Displays verified farmer identity, APMC pass number, registered tractor details, crop weight, token number, and live auction times.
- **Schedule & Live Mandi Status (`Schedule.jsx`)**: Real-time gate open/closed indicators, operating hours, crop inflow volume, and notified MSP rates (Wheat, Soybean, Mustard).
- **Gate Entry Slip & Live Queue Board (`Queue.jsx`)**:
  - 3-column electronic yard status (Tractors ahead, gate priority, estimated wait time in minutes).
  - 4-Stage Mandi Pipeline Tracker: `Gate Entry (Arrived)` &rarr; `Weighbridge (Weighing)` &rarr; `Quality Grading` &rarr; `Pass & DBT Settlement`.
  - Advance slot booking with digital QR gate pass.
- **Payment & Instant Advance Desk (`Payment.jsx`)**: Transparent breakdown of crop value, moisture/purity specs, 4-step payment timeline, and one-tap 80% instant cash advance claim.
- **e-NAM Live Auction Slips (`Marketplace.jsx`)**: Interactive live trade slips showing active registered corporate buyers (e.g., ITC e-Choupal, Patanjali Agro), current bid rates vs. MSP, and 1-click bid acceptance.
- **NABARD-APMC Credit Passbook (`FinancialAid.jsx`)**: Integrated farmer credit ledger with pre-approved ₹1.50L credit limit, Kisan Credit Card (KCC) vouchers, e-NWR warehouse receipt advance (75%), and PMFBY crop insurance support.

### 2. 🖥️ Mandi Desktop Web Portal (`DesktopPortal.jsx`)
- Wide-screen operational dashboard for mandis and desktop users.
- Live key metrics banner (Total Daily Inflow, Active Token Number, Approved DBT Payouts, Yard Capacity).
- Embedded search engine (by Token No., Vehicle Plate `RJ-20-EA-4412`, or Farmer ID).
- Printable daily gate passes and full ledger views.

### 3. 🛠️ APMC Mandi Staff & Operator Desk (`StaffPortal.jsx`)
- **Gate & Yard Operations**: Real-time toggle of mandi open/closed status, operating hours, notified commodities, and benchmark MSP.
- **Live Queue & Token Controller**: Interactive operator table to inspect all arriving tractors and advance farmer stages in real time.
- **PA Loudspeaker Announcements**: Trigger audio broadcasts to specific weighbridge lanes (e.g., *"Token #42 proceed to Weighbridge Gate 3"*).
- **PFMS / DBT Settlement Desk**: One-click advance disbursement approvals and database reset tools for live demonstrations.

### 4. 🎙️ Sathi (साथी) Multilingual Voice AI Assistant (`SathiWidget.jsx`)
- **5 Indian Languages**: Full native support for **Hindi (हिन्दी)**, **English**, **Punjabi (ਪੰਜਾਬੀ)**, **Marathi (मराठी)**, and **Gujarati (ગુજરાતી)**.
- **Voice-First Interaction**: Integrated Web Speech API for voice recognition (speech-to-text) and accent-matched audio readouts (text-to-speech).
- **Grounded Responses**: Dynamically injects live database facts (farmer's exact vehicle number, queue position, weighbridge lane, approved amount, MSP) into the LLM system prompt.
- **Multi-Model Support**: Powered by Google Gemini 1.5 Flash, Groq Llama-3.3 70B, OpenAI GPT-4o-mini, with a deterministic offline fallback engine.

---

## 🧰 What We Used (Tech Stack & Tools)

| Component | Technologies & Libraries |
|---|---|
| **Frontend Framework** | React 18, Vite 5, JavaScript (ES6+) |
| **Styling & UI Design** | Tailwind CSS, Google Material Symbols, Custom Khadi & Terracotta Design Tokens |
| **Typography** | Google Fonts (*Inter*, *Outfit*, *Noto Sans Devanagari / Gurmukhi / Gujarati*) |
| **Localization (i18n)** | Custom React `LanguageContext` with dynamic 5-language translation dictionary |
| **Speech & Audio** | Browser Native Web Speech API (`SpeechRecognition`, `SpeechSynthesisUtterance`) |
| **Backend API** | Node.js, Express.js, RESTful API architecture |
| **Real-Time Streaming** | Server-Sent Events (SSE) via Node.js `EventEmitter` for live push updates |
| **Database & State Engine**| Reactive JSON Database (`db.js`, `db.json`, `seed.json`) with dynamic queue math |
| **AI / LLM Providers** | Google Generative AI (`@google/generative-ai`), Groq SDK, OpenAI SDK (`openai`) |
| **Tooling & Version Control**| Git, GitHub Monorepo, npm, Chrome DevTools |

---

## 🔮 Future Features to Add (Roadmap)

1. **📷 Computer Vision Grain Grading (AI Grain Quality Scanner)**:
   - Allow farmers to snap a photo of their grain sample (wheat, soybean, mustard) to estimate moisture content, grain size, and purity percentage before reaching the mandi.
2. **⚖️ IoT Weighbridge & RFID Gate Automation**:
   - Direct integration with industrial weighbridge load cells (digitally signing weight tickets) and automated boom barrier entry via vehicle RFID tags.
3. **📞 Offline IVR & Dial-In Voice Bot (No-Internet Fallback)**:
   - A toll-free phone number where farmers with basic feature phones can dial in, speak in their regional dialect, and check their token number and weighment status via automated IVR.
4. **🔗 Blockchain e-NWR & Smart Contract Escrow**:
   - Cryptographically signed electronic warehouse receipts (e-NWR) enabling instant commodity pledging and automated escrow release upon quality acceptance.
5. **🗺️ Inter-Mandi Arbitrage & Price Forecasting**:
   - AI-driven price prediction models comparing daily prices across adjacent district mandis to recommend optimal selling times and locations.
6. **💬 WhatsApp & Telegram Notification Bot**:
   - Automated push alerts sent to the farmer's WhatsApp when their vehicle is 2 turns away from the weighbridge scale.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### 1. Start the Backend API (Port 5001)
```bash
cd backend
npm install
npm start
```
- **Backend API Server**: `http://localhost:5001`
- **API Health Check**: `http://localhost:5001/api/health`

### 2. Start the Frontend React App (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
- **Sahayak Application**: [http://localhost:3000](http://localhost:3000)
- The app automatically adapts to Mobile PWA or Desktop Web Portal depending on screen size, with instant view toggling available on the top bar.

---

## 👥 Contributors & Hackathon Submission
- **Project**: Sahayak (सहायक) — Kisan e-Procurement Platform
- **Category**: Agri-Tech, e-Governance, Public Digital Infrastructure (DPI)
- **Repository**: [https://github.com/Divyanshu123-code/hackthon-iic-3.0](https://github.com/Divyanshu123-code/hackthon-iic-3.0)
