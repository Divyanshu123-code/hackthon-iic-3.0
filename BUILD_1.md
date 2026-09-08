# Build Doc — Mock Prototype

## Scope
Mock prototype only. Not production. Goal: demo-able flow for judges.

## Modules to build
1. Farmer App (read-side) — Schedule, Queue, Payment status, AI assistant (Sathi), Financial aid (mock), Marketplace (mock)
2. Staff Portal (write-side) — mark center open/crop, advance farmer stage
3. Shared backend/DB (mock/sim data)

## Status
- Not started.

## Decisions Log
- Stack: React (frontend) + Node/Express (backend) + mock JSON DB (no real DB, file-based)

- MVP cut: All 3 (Schedule, Queue, Payment) built lightly/functionally, none deep. Financial aid + Marketplace = static mock only.

## MVP Feature List (lightweight but real data flow)
- Staff Portal: set center open/closed + crop, advance farmer stage (dropdown/buttons)
- Farmer App:
  - Schedule screen (reads live)
  - Queue screen (position, basic ETA — simple calc not ML)
  - Payment screen (stage log, reads live)
  - Sathi assistant (basic chatbot, canned/rule-based responses tied to screen context)
  - Financial aid screen — static mock UI, canned response
  - Marketplace screen — static mock UI, canned response
- Backend: Express API, JSON file as DB, shared between staff portal writes + farmer app reads

## Team Split (2 people, parallel work via shared API contract)

### You — Backend + Staff Portal
- Express API + JSON mock DB
- Endpoints: schedule (get/set), queue (get/advance stage), payment (get/advance stage), sathi (basic rule-based reply)
- Staff Portal UI (simple, low priority on design — functional only)
- Own the API contract (below) — teammate builds against it without waiting on you

### Teammate — Farmer App (frontend)
- React app: Schedule screen, Queue screen, Payment screen, Sathi chat widget, Financial aid (static), Marketplace (static)
- Builds against API contract below using mock/dummy data first, swaps to real API once backend ready
- Owns UI/UX polish (this side is judged on demo appeal most)

## API Contract — SUPERSEDED
See API_CONTRACT.md (matched exactly to real UI prototype fields/screens). Use that file, not this section.

## Build Order
1. Finalize API contract (today) — both agree, no changes after
2. You: scaffold Express + JSON DB + endpoints (dummy data ok initially)
3. Teammate: scaffold React app with static/dummy data matching contract shape
4. Connect: teammate points frontend calls to your live endpoints
5. Staff portal (you) — build after core API done
6. Integration + demo polish

## Repo Structure (locked: monorepo)
```
/project-root
  /backend    ← you
  /frontend   ← teammate
  README.md
```

## Implementation Plan — Backend (you)

### Step 1: Scaffold
```
/backend
  server.js
  /data
    db.json          ← mock DB (schedule, queue, payment arrays)
  /routes
    schedule.js
    queue.js
    payment.js
    staff.js
    sathi.js
  package.json
```
- `npm init -y`
- `npm i express cors`
- Read/write `db.json` on each request (fs.readFileSync/writeFileSync) — simplest mock DB, no ORM needed

### Step 2: db.json seed structure
```json
{
  "centers": [{ "centerId": "C1", "open": true, "crop": "Wheat", "date": "2026-09-10" }],
  "farmers": [
    { "farmerId": "F1", "centerId": "C1", "stage": "arrived",
      "stages": [{ "name": "arrived", "status": "done", "timestamp": "..." }] }
  ]
}
```

### Step 3: Build routes (in order)
1. `GET /api/schedule/:centerId` — return matching center object
2. `GET /api/queue/:farmerId` — return farmer.stage + calc position/eta (simple: count farmers ahead in same stage, eta = position * avg 5min)
3. `GET /api/payment/:farmerId` — return farmer.stages array
4. `POST /api/staff/schedule` — update center object in db.json
5. `POST /api/staff/advance-stage` — push next stage into farmer.stages, update farmer.stage
6. `POST /api/sathi/query` — simple if/else or keyword match on `message` + `screenContext`, return canned reply (no real NLP needed for MVP)

### Step 4: Test each endpoint with curl/Postman before telling teammate it's ready

### Step 5: Staff Portal UI (after API works)
- Single React or plain HTML page, 2 forms:
  - Update schedule (centerId, open toggle, crop dropdown, date)
  - Advance farmer stage (farmerId dropdown, "advance to next stage" button)
- No auth needed for MVP (mention "auth in production" in pitch)

---

## Frontend Plan
See separate file: FRONTEND.md (teammate's doc)

## Sync Point
Both push to monorepo. Test integration together once:
- Backend: all 6 endpoints working (curl-tested)
- Frontend: all screens built with dummy data
Then swap frontend dummy data → real fetch calls. This is the only step requiring both of you together.

## Next Decision Needed
- Nothing — begin building
