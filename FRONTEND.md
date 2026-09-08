# Frontend Implementation Plan — Farmer App (Teammate)

## Stack
React (or Vite+React) — no other framework needed for MVP

## Setup
```
npx create-react-app frontend
```
or
```
npm create vite@latest frontend -- --template react
```

## Folder Structure
```
/frontend/src
  /pages
    Schedule.jsx
    Queue.jsx
    Payment.jsx
    FinancialAid.jsx   (static mock)
    Marketplace.jsx    (static mock)
  /components
    SathiWidget.jsx    (floating chat icon, present on all pages)
    NavBar.jsx
  api.js               (all fetch calls in one file)
```

## API Contract (build against this — backend teammate owns these exact endpoints)
```
GET  /api/schedule/:centerId    → { open: bool, crop: string, date: string }
GET  /api/queue/:farmerId       → { position: number, etaMins: number, stage: string }
GET  /api/payment/:farmerId     → { stages: [{name, status, timestamp}] }
POST /api/sathi/query           → { message, screenContext } → { reply }
```
(staff-only POST endpoints are backend/staff-portal side, not needed in this app)

## Build Order
1. NavBar + React Router shell — all pages reachable, empty content ok
2. Schedule / Queue / Payment screens — build with HARDCODED dummy data matching contract shape above. Do not wait for backend.
   Example dummy data for Queue:
   ```js
   { position: 3, etaMins: 15, stage: "weighed" }
   ```
3. FinancialAid.jsx + Marketplace.jsx — fully static UI, canned text/cards, no API calls at all
4. SathiWidget.jsx — floating icon bottom-right, opens chat box on click, sends `{message, screenContext}`, shows reply. Start with a dummy/local reply function, swap to real fetch later.
5. Once backend is live: edit api.js only — replace dummy data functions with real fetch() calls to the URLs above. Screens should not need changes if dummy data shape matched contract.

## UI Guidelines (judged heavily — polish this)
- Mobile-first layout (most farmers use phones)
- Color coding: green = done, yellow = in progress, grey = pending (use on Payment + Queue stage displays)
- Loading spinners/states on data fetch
- Keep it simple/clean — no need for heavy design system, but consistent spacing/colors

## Screens — what each should show

### Schedule.jsx
- Center open/closed status
- Today's crop being procured
- Date

### Queue.jsx
- Farmer's queue position
- ETA in minutes
- Current stage (arrived/weighed/graded/approved)

### Payment.jsx
- Stage log/timeline: arrived → weighed → graded → approved → payment initiated → paid
- Status + timestamp per stage
- Color-coded (see above)

### FinancialAid.jsx (static mock)
- Card: "You may be eligible for a loan against your pending payment" — canned amount/button, no real logic
- Card: "Insurance deadline reminder" — canned example

### Marketplace.jsx (static mock)
- List of 2-3 fake fertilizer/seed suppliers with fake prices
- "Verified supplier" badge — just UI, no real verification

### SathiWidget.jsx
- Floating chat icon on every screen
- On open, shows chat box, aware of which screen it was opened from (screenContext)
- Text input + dummy/canned reply for now

## Sync Point With Backend
When backend is ready:
- Only file to change: api.js
- Replace dummy functions with real fetch() calls to the 4 GET/POST endpoints above
- Test each screen still renders correctly with real data
