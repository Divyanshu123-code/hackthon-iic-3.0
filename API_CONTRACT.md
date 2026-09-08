# API Contract — matched to UI prototype (stitch_agri_procurement_demo_prototype)

Screens seen: farmer_home, schedule_open_today_status, queue_live_token_42_progress, payment_live_transfer_advance

---

## db.json schema

```json
{
  "farmers": [
    {
      "farmerId": "F1",
      "name": "राम लाल जी",
      "token": 42,
      "date": "2026-09-08",
      "mandi": "Solan Mandi",
      "vehicleNumber": "RJ-20-EA-4412",
      "vehicleType": "सोनालिका DI 745",
      "commodity": "सोयाबीन (Yellow Soy)",
      "commodityQty": "68 बोरी",
      "centerId": "C1",
      "stage": "weighing",
      "stageIndex": 2,
      "aheadCount": 4,
      "estWaitMins": 25,
      "atGateNumber": 38,
      "weighbridgeNo": 3,
      "stages": [
        { "name": "arrived", "label": "पहुंचे / Arrived", "status": "done", "timestamp": "10:15 AM" },
        { "name": "weighing", "label": "तौल / Weighing", "status": "in_progress", "timestamp": null },
        { "name": "grade", "label": "गुणवत्ता / Grade", "status": "pending", "timestamp": null },
        { "name": "pass", "label": "पास / Pass", "status": "pending", "timestamp": null }
      ],
      "payment": {
        "totalApproved": 113750,
        "quintal": 50,
        "crop": "गेहूं Grade-A",
        "lotNumber": "LOT-2024-8849",
        "quality": { "moisture": "10.8%", "purity": "99.4%", "shed": "मंडी शेड 4" },
        "timeline": [
          { "name": "weighed", "label": "Weighed & Certified", "status": "done", "detail": "50.00 Qtl (धर्मकांटा पर्ची #4102)", "timestamp": "11:30 AM" },
          { "name": "bill", "label": "Bill Generated", "status": "done", "detail": "ई-मंडी बिल #EM-99210 • ₹2,275/Qtl", "timestamp": "11:30 AM" },
          { "name": "transfer", "label": "Bank Transfer", "status": "in_progress", "detail": "मंडी ट्रेजरी द्वारा RTGS/NEFT प्रेषित", "timestamp": null },
          { "name": "credited", "label": "Credited to Account", "status": "pending", "detail": "अनुमानित समय: 24-48 घंटे", "timestamp": null }
        ],
        "advance": { "available": true, "percent": 80, "amount": 91000, "feePercent": 0 },
        "bank": { "name": "SBI Bank", "last4": "4912", "ifsc": "SBIN000210" },
        "mandiTax": 0
      }
    }
  ],
  "centers": [
    {
      "centerId": "C1",
      "name": "APMC अनाज मंडी (Kota Mandi)",
      "open": true,
      "gateOpen": true,
      "gateNumber": 2,
      "timing": "8:00 AM – 5:00 PM",
      "todayCrop": "गेहूं (Wheat)",
      "cropQuality": "Sharbati & Lokwan Quality",
      "cropGrade": "Grade A Verified",
      "msp": 2275,
      "upcomingDays": [
        { "day": "Sat", "label": "कल", "crop": "सरसों / Mustard", "gate": "Gate 1 & Gate 3", "timing": "8:00 AM – 4:30 PM", "status": "open" },
        { "day": "Sun", "label": "परसों", "crop": "साप्ताहिक अवकाश / Weekly Cleaning", "gate": null, "timing": null, "status": "closed" }
      ],
      "slots": [
        { "id": "morning", "label": "सुबह 09 – 11 AM", "tokensLeft": 8 },
        { "id": "afternoon", "label": "दोपहर 01 – 03 PM", "tokensLeft": 15 }
      ]
    }
  ]
}
```

---

## Endpoints

```
GET  /api/farmer/:farmerId/home
  → { name, token, date, mandi }

GET  /api/schedule/:centerId
  → full center object (open, gate, timing, todayCrop, msp, upcomingDays, slots)

POST /api/schedule/:centerId/book-slot
  body: { farmerId, slotId }
  → { success, updatedToken }

GET  /api/queue/:farmerId
  → { token, aheadCount, estWaitMins, atGateNumber, stage, stageIndex, stages, vehicleNumber, vehicleType, weighbridgeNo, commodity }

GET  /api/payment/:farmerId
  → farmer.payment object (totalApproved, quintal, crop, lotNumber, quality, timeline, advance, bank, mandiTax)

POST /api/payment/:farmerId/advance
  body: { farmerId }
  → { success, amountCredited, remainingPercent }
  (mock only — instantly flips advance.taken = true, no real bank call)

POST /api/sathi/query
  body: { message, screenContext, farmerId }
  → { reply }
  (rule-based: match keywords like "कब"/token/"भुगतान" etc, pull live values from farmer object into templated reply)

--- Staff Portal (write side) ---

POST /api/staff/schedule
  body: { centerId, open, gateOpen, todayCrop, msp, timing }
  → updates center object

POST /api/staff/advance-stage
  body: { farmerId, stage }   // one of: arrived, weighing, grade, pass
  → pushes/updates farmer.stages + farmer.stage + farmer.stageIndex

POST /api/staff/advance-payment
  body: { farmerId, stage }   // one of: weighed, bill, transfer, credited
  → updates farmer.payment.timeline
```

---

## Notes for backend build
- All amounts in ₹ (numbers, format on frontend)
- Bilingual labels (Hindi primary / English secondary) — store both strings directly in db.json as shown, no i18n engine needed for MVP
- `stageIndex` (0-3) drives the queue progress-stepper UI directly
- Advance/loan feature is fully mock — no real NBFC call, just flips a flag and returns fake success
