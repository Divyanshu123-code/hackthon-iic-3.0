# Kisan Mandi — Agri-Procurement Platform (Full Monorepo)

A demo-ready, full-stack monorepo for the **Kisan Mandi Agri-Procurement Platform**, built according to `BUILD_1.md`, `FRONTEND.md`, and `API_CONTRACT.md`, with the high-fidelity UI design from the Stitch prototype.

---

## 🚀 Quick Start

### 1. Start the Backend API (Port 5001)
```bash
cd backend
npm install
npm start
```
- 🛠️ **Staff Control Desk**: [http://localhost:5001/staff](http://localhost:5001/staff)
- 📋 **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

### 2. Start the React + Vite Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
- 📱 **Farmer App (React + Vite)**: [http://localhost:3000](http://localhost:3000)

---

## 📁 Monorepo Architecture

```
/
├── API_CONTRACT.md              # Canonical API specification
├── BUILD_1.md                   # Architecture & System Scope
├── FRONTEND.md                  # Frontend teammate plan
├── stitch_agri_procurement_demo_prototype/ # Raw Stitch prototype design assets
│
├── backend/                     # Backend API & JSON DB Engine
│   ├── server.js                # Express app (API + SSE Stream)
│   ├── package.json
│   ├── test-api.js              # Automated 10-point test runner
│   ├── data/
│   │   ├── db.js                # JSON read/write/reset & dynamic queue math
│   │   ├── db.json              # Mock multi-farmer database
│   │   └── seed.json            # Pristine initial database seed
│   ├── routes/
│   │   ├── farmer.js            # GET /api/farmer/:farmerId/home, POST checkin
│   │   ├── schedule.js          # GET /api/schedule/:centerId, POST book-slot
│   │   ├── queue.js             # GET /api/queue/:farmerId, GET board
│   │   ├── payment.js           # GET /api/payment/:farmerId, POST advance
│   │   ├── sathi.js             # POST /api/sathi/query (Bilingual AI Assistant)
│   │   └── staff.js             # Staff operations & PA announcements
│   └── public/
│       ├── index.html           # Full Stitch UI (HTML/JS preview)
│       └── staff.html           # Staff Operations Control Desk
│
└── frontend/                    # Standalone React 18 + Vite App
    ├── package.json
    ├── vite.config.js           # Configured with proxy to http://localhost:5001
    ├── index.html
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx              # Main App orchestrator with live SSE sync
    │   ├── index.css            # Tailwind typography, colors & animations
    │   ├── api.js               # Centralized API client
    │   ├── components/
    │   │   ├── Header.jsx       # Mandi branding & staff desk launcher
    │   │   ├── NavBar.jsx       # Fixed bottom mobile nav
    │   │   ├── SathiWidget.jsx  # Floating AI chatbot with voice synthesis
    │   │   ├── QrModal.jsx      # Gate Priority Entry QR pass modal
    │   │   └── AdvanceModal.jsx # 80% Instant Cash IMPS transfer modal
    │   └── pages/
    │       ├── FarmerHome.jsx   # 5 giant action tiles & greetings
    │       ├── Schedule.jsx     # Open/closed status & MSP card
    │       ├── Queue.jsx        # Token hero, Advance Booking & 4-step stepper
    │       ├── Payment.jsx      # Payment status & 80% Instant cash card
    │       ├── FinancialAid.jsx # KCC limit & crop insurance
    │       └── Marketplace.jsx  # Verified seeds & nano urea
```

---

## 🌾 Live Interactive Demo Workflow

1. Open the **React Farmer App**: [http://localhost:3000](http://localhost:3000) (or mobile viewport).
2. In a second window, open the **Staff Control Desk**: [http://localhost:5001/staff](http://localhost:5001/staff).
3. Test the live flow:
   - **Queue Live**: Open the **Queue (नंबर)** tab in the Farmer App.
   - **Advance Booking**: In the Queue tab, select morning/afternoon slot and click `🔒 टोकन अभी ब्लॉक करें • Block Token Now` to reserve a slot and view the QR Pass.
   - **Staff Advancement**: On the Staff Desk, click **Advance ⏩** on Ram Lal Ji (Token #42) -> Watch the Farmer App progress stepper move in real time via Server-Sent Events!
   - **Instant Advance**: On the **Payments (रुपये)** tab, click `⚡ तुरंत पैसे लें / Get Money Now` -> Confirm transfer -> Receive ₹91,000 instant IMPS payout to SBI account.
   - **Sathi AI**: Click `बोलिए / Speak` -> Ask *"मेरी फसल कब बिकेगी?"* or *"आज गेहूं का भाव क्या है?"* -> Sathi responds with live data and Hindi audio readout!
