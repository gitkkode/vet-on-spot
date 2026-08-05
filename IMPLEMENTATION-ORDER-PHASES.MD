# VetOnSpot — Final Implementation Order (Phases · Room by Room)

> **Stack:** Node.js + Express (`doobydev-api`) · Firebase Firestore · Firebase Auth (email + password, no OTP) · Firebase Storage
>
> **Rule:** Implement phases **in order**. Do not skip ahead — each phase depends on the previous one.
>
> **Legend:** `[BE]` backend · `[FE]` frontend · `[FB]` Firebase console/setup · `[✓]` done when checkbox complete

---

## Quick Reference — Phase Map

| Phase | Name | Rooms | Unlock |
|-------|------|-------|--------|
| **0** | Prerequisites | — | Everything |
| **1** | Foundation | Room 0 | Auth |
| **2** | Auth | Room 1 | Data |
| **3** | Identity | Rooms 2–3 | Bookings |
| **4** | Booking Core | Room 4 + 5–18 | Lifecycle |
| **5** | Booking Lifecycle | Room 19 | Operations |
| **6** | Doctors | Rooms 20–21 | Dispatch |
| **7** | Dispatch | Room 22 | Full booking ops |
| **8** | Bookings UI | Room 23 | Admin can manage bookings |
| **9** | Dashboard & Doctors UI | Rooms 24 + 20–21 FE | Admin home live |
| **10** | Transport & Map | Rooms 25–26 | Fleet + geo |
| **11** | Files & Payments | Rooms 27–28 | Documents + fees |
| **12** | Settings & Launch | Room 29 + polish | Production |

---

# PHASE 0 — Prerequisites (Do First)

**Goal:** Firebase project + both repos ready. No feature code yet.

| # | Task | Owner |
|---|------|-------|
| 0.1 | `[FB]` Create Firebase project | Dev |
| 0.2 | `[FB]` Enable Auth → Email/Password only (disable Phone/OTP) | Dev |
| 0.3 | `[FB]` Create Firestore database (production mode) | Dev |
| 0.4 | `[FB]` Enable Storage bucket | Dev |
| 0.5 | `[FB]` Download `serviceAccountKey.json` → `doobydev-api/` (gitignore it) | Dev |
| 0.6 | `[FB]` Register web app → copy config to Angular `environment.ts` | Dev |
| 0.7 | `[BE]` Create `doobydev-api/.env` (PORT, CORS_ORIGIN) | Dev |
| 0.8 | `[FE]` Create `vetonspot-test/src/environments/environment.ts` (apiUrl + firebase) | Dev |
| 0.9 | `[FB]` Create first admin in Auth + `admins/{uid}` doc in Firestore | Dev |

**✓ Phase 0 done when:** Firebase console ready, both env files exist, admin user can exist in Auth.

---

# PHASE 1 — Foundation

## Room 0 — Foundation

**Depends on:** Phase 0  
**Blocks:** Room 1 (Auth)

### Backend `[BE]` — `doobydev-api`

- [ ] Restructure folders: `src/middleware`, `src/routes`, `src/services`, `src/utils`, `scripts/`
- [ ] Wire `dotenv`, `helmet`, `cors`, `morgan` in `server.js`
- [ ] Add global error middleware + standard `{ success, data, error }` response helper
- [ ] Mount routes under `/api/v1`
- [ ] Keep `GET /` and `GET /health` working
- [ ] Deprecate `/api/save`, `/api/list` sample routes (remove after real routes exist)

### Frontend `[FE]` — `vetonspot-test`

- [ ] Add `provideHttpClient()` in `app.config.ts`
- [ ] Initialize Firebase client SDK from `environment.firebase`
- [ ] Verify Angular dev server runs (`ng serve`)

### Firebase `[FB]`

- [ ] Add `firestore.indexes.json` (from FULLPLAN.MD Part 6)
- [ ] Add `firestore.rules` + `storage.rules` stubs (tighten in Phase 12)

**✓ Room 0 done when:** `GET http://localhost:3700/health` returns OK · Angular loads · folder structure in place.

---

# PHASE 2 — Auth

## Room 1 — Auth

**Depends on:** Room 0  
**Blocks:** All protected API routes + admin login

### Backend `[BE]`

- [ ] `src/middleware/auth.middleware.js` — verify Firebase ID token via `admin.auth().verifyIdToken()`
- [ ] `GET /api/v1/auth/me` — return admin profile from `admins/{uid}`
- [ ] Optional: `POST /api/v1/auth/register` — create admin (first-time setup only)
- [ ] Apply auth middleware to all `/api/v1/*` except `/health`

### Frontend `[FE]`

- [ ] Rewrite `auth.service.ts` — `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`, `getIdToken()`
- [ ] Update `auth.guard.ts` + `guestGuard` — use Firebase auth state
- [ ] Create `auth.interceptor.ts` — attach `Authorization: Bearer <token>`
- [ ] Wire `login.component.ts` to real Firebase login
- [ ] Wire `logout.component.ts` to Firebase signOut

**✓ Room 1 done when:** Login works · refresh keeps session · API without token returns 401 · `/dashboard` requires login.

---

# PHASE 3 — Identity (Owners & Pets)

## Room 2 — Owner

**Depends on:** Room 1  
**Blocks:** Room 4 (bookings need owner)

### Backend `[BE]`

- [ ] Firestore collection: `owners`
- [ ] `POST /api/v1/owners` — create
- [ ] `GET /api/v1/owners/:id` — get
- [ ] `PATCH /api/v1/owners/:id` — update
- [ ] `GET /api/v1/owners?mobile=` — lookup returning customer
- [ ] `upsertOwner(form.owner)` helper — match by mobile

### Frontend `[FE]`

- [ ] No new UI — owner fields already in appointment wizards

**✓ Room 2 done when:** Owner CRUD works via Postman · upsert by mobile returns same ownerId.

---

## Room 3 — Pet

**Depends on:** Room 2  
**Blocks:** Room 4

### Backend `[BE]`

- [ ] Subcollection: `owners/{ownerId}/pets/{petId}`
- [ ] `POST /api/v1/owners/:ownerId/pets` — create
- [ ] `GET /api/v1/owners/:ownerId/pets` — list
- [ ] `PATCH /api/v1/pets/:ownerId/:petId` — update
- [ ] `GET /api/v1/pets/:ownerId/:petId/visit-history` — past bookings for pet
- [ ] `GET /api/v1/pets/:ownerId/:petId/medication-history` — aggregate from booking details

### Frontend `[FE]`

- [ ] No new UI yet — pet fields in wizards

**✓ Room 3 done when:** Pet linked to owner · visit-history query returns bookings sorted by date.

---

# PHASE 4 — Booking Core (Appointments)

## Room 4 — Appointment Core

**Depends on:** Rooms 2, 3  
**Blocks:** Rooms 5–19 · **PRIMARY MILESTONE**

### Backend `[BE]`

- [ ] Firestore collection: `bookings` + subcollection `history`
- [ ] `src/services/counter.service.js` — atomic `BK-XXXX` ID generation
- [ ] `src/services/booking.service.js` — create, update, get, list
- [ ] `src/utils/booking-mapper.js` — Firestore doc → frontend `Booking` shape
- [ ] `POST /api/v1/bookings` — create (upsert owner + pet + booking + initial history)
- [ ] `GET /api/v1/bookings/:id` — get with details + history
- [ ] `PATCH /api/v1/bookings/:id` — draft save / update
- [ ] `GET /api/v1/bookings` — list with basic filters
- [ ] Validation: normal vs emergency rules (mirror `appointment-form.model.ts`)
- [ ] Derive on create: `type`, `isEmergency`, `service`, `location`, denormalized summary fields
- [ ] Store full `PetAppointmentForm` in `bookings.details` JSON

### Frontend `[FE]`

- [ ] Create `booking-api.service.ts`
- [ ] Update `appointment.service.ts` — replace mock `createBookingFromForm` / `updateBookingFromForm` with API calls
- [ ] Wire **Quick Add** wizard submit → `POST /bookings`
- [ ] Wire **Express** wizard submit → `POST /bookings`
- [ ] Wire **Full form** save/submit → `POST` or `PATCH /bookings/:id`
- [ ] Edit route `/appointments/edit/:id` → `GET /bookings/:id` on load

**✓ Room 4 done when:** Submit wizard → booking in Firestore → survives page refresh.

---

## Rooms 5–18 — Intake Sections

**Depends on:** Room 4  
**Strategy:** All sections live inside `bookings.details` — one JSON field. No separate Firestore collections per section.

Implement **with Room 4** (same PATCH) — not as 14 separate backend projects.

| Room | Section ID | Required for book? | Backend | Frontend (already built) |
|------|-----------|-------------------|---------|--------------------------|
| **5** | health | Yes | `details.health` | Quick wizard step 5 |
| **6** | pastMedical | Recommended | `details.pastMedical` | Wizard step 6 |
| **7** | vaccination | Recommended | `details.vaccination` | Accordion |
| **8** | deworming | Optional | `details.deworming` | Accordion |
| **9** | tickFlea | Optional | `details.tickFlea` | Accordion |
| **10** | medications | Recommended | `details.medications` | Accordion |
| **11** | allergies | Recommended | `details.allergies` | Accordion |
| **12** | diet | Optional | `details.diet` | Accordion |
| **13** | lifestyle | Optional | `details.lifestyle` | Accordion |
| **14** | reproductive | If applicable | `details.reproductive` | Accordion |
| **15** | emergency | Important | `details.emergency` + `isEmergency` flag | Step 1 / express |
| **16** | documents | Recommended | `details.documents` | Step 8 — filenames now, URLs in Phase 11 |
| **17** | doctorNotes | Internal | `details.doctorNotes` | Full form / post-visit |
| **18** | appointment | Yes | `details.appointment` | Step 4 |

### Backend `[BE]`

- [ ] `PATCH /api/v1/bookings/:id/intake` — optional partial merge by section key
- [ ] Emergency flags → recompute `isEmergency`, `mustReachWithinMinutes: 60`

### Frontend `[FE]`

- [ ] Wizard step saves call `PATCH /bookings/:id` (draft) or batch on submit
- [ ] Keep existing validation in `appointment-form.model.ts`

**✓ Rooms 5–18 done when:** Full 16-section form round-trips to Firestore and back without data loss.

---

# PHASE 5 — Booking Lifecycle

## Room 19 — Booking Lifecycle

**Depends on:** Room 4  
**Blocks:** Dispatch, Calendar, Dashboard lists

### Backend `[BE]`

- [ ] Status machine: `pending` → `sent` → `accepted` → `completed` / `cancelled`
- [ ] Append-only `bookings/{id}/history/{historyId}` subcollection
- [ ] `POST /api/v1/bookings/:id/cancel`
- [ ] `POST /api/v1/bookings/:id/complete`
- [ ] `POST /api/v1/bookings/:id/finalize` — submit draft
- [ ] List filters: `status`, `type`, `search`, `dateFrom`, `dateTo`, `isEmergency`
- [ ] Sort: emergency first, then `submittedAt` desc
- [ ] Deploy Firestore indexes for filtered queries

### Frontend `[FE]`

- [ ] `bookings.component.ts` → `GET /bookings` with filters (replace `BOOKINGS` import)
- [ ] `booking-detail.component.ts` → `GET /bookings/:id`
- [ ] Add **Cancel booking** button on detail page (new UI)
- [ ] History timeline from API response

**✓ Room 19 done when:** Status filters work · cancel updates Firestore · history shows real events · data persists after refresh.

---

# PHASE 6 — Doctors

## Room 20 — Doctor Management

**Depends on:** Room 1  
**Blocks:** Room 21, Dispatch

### Backend `[BE]`

- [ ] Firestore collection: `doctors`
- [ ] Counter: `DR-XX` display IDs
- [ ] `GET /api/v1/doctors` — list (?status=available)
- [ ] `POST /api/v1/doctors` — create
- [ ] `GET /api/v1/doctors/:id` — profile
- [ ] `PATCH /api/v1/doctors/:id` — update
- [ ] `PATCH /api/v1/doctors/:id/availability` — available / offline / on-visit
- [ ] `GET /api/v1/doctors/:id/stats?period=today|yesterday|weekly|monthly`
- [ ] `GET /api/v1/doctors/:id/bookings?period=`
- [ ] `scripts/seed.js` — seed 6 doctors from mock-data

### Frontend `[FE]`

- [ ] `doctors.component.ts` → API (list, filter, add doctor form)
- [ ] `doctor-profile.component.ts` → API (dashboard tab, stats, availability select)

**✓ Room 20 done when:** Add doctor saves to Firestore · profile loads real data · seed script populates doctors.

---

## Room 21 — Doctor Requests

**Depends on:** Rooms 19, 20  
**Blocks:** Room 22 (Dispatch)

### Backend `[BE]`

- [ ] `requestedDoctorIds[]` on booking doc (or `doctorRequests` subcollection)
- [ ] `GET /api/v1/doctors/:id/requests` — incoming sent bookings
- [ ] `POST /api/v1/bookings/:id/accept` — `{ doctorId }`
- [ ] `POST /api/v1/bookings/:id/decline` — `{ doctorId }`
- [ ] Accept: set `assignedDoctorId`, status `accepted`, history entry, doctor → on-visit
- [ ] Decline: remove from requested list; if empty → status `pending`

### Frontend `[FE]`

- [ ] Doctor profile **Requests** tab → accept/reject calls API
- [ ] Request count badge from real data

**✓ Room 21 done when:** Accept moves booking to accepted · decline returns booking to pending when last doctor declines.

---

# PHASE 7 — Dispatch

## Room 22 — Dispatch & Assignment

**Depends on:** Rooms 19, 20, 21  
**Blocks:** Dashboard assign table (full ops)

### Backend `[BE]`

- [ ] `GET /api/v1/dispatch/queue` — pending + sent, emergency first
- [ ] `POST /api/v1/bookings/:id/assign` — single doctor → status `sent`
- [ ] `POST /api/v1/bookings/:id/dispatch` — `{ doctorIds[] }` multi-send
- [ ] `POST /api/v1/bookings/:id/admin-accept` — admin accepts for doctor
- [ ] `GET /api/v1/dispatch/suggestions/:bookingId` — nearby doctors + distance + ETA
- [ ] `src/services/geo.service.js` — Haversine distance (mirror `map-markers.ts`)

### Frontend `[FE]`

- [ ] `dispatch.component.ts` → queue, send request, admin accept
- [ ] `dashboard.component.ts` assign popup → `POST /assign`

**✓ Room 22 done when:** Dispatch queue live from Firestore · assign changes status to sent · map distances work.

---

# PHASE 8 — Bookings UI (Full Wiring)

## Room 23 — Calendar & Bookings Views

**Depends on:** Room 19  
**Can run parallel with Phase 7 if lifecycle is done**

### Backend `[BE]`

- [ ] `GET /api/v1/bookings/calendar?month=YYYY-MM` — per-day counts + emergency flags
- [ ] `GET /api/v1/bookings?scheduledDate=` — bookings on a date
- [ ] `GET /api/v1/bookings/:id/previous-visits` — same pet prior visits

### Frontend `[FE]`

- [ ] `calendar.component.ts` → calendar API + day drawer
- [ ] `booking-detail.component.ts` → visit history, medication history from API
- [ ] Remove remaining direct `BOOKINGS` / `mock-data` imports from bookings pages

**✓ Room 23 done when:** Calendar dots match real counts · detail page fully API-driven.

---

# PHASE 9 — Dashboard & Doctors UI

## Room 24 — Dashboard

**Depends on:** Rooms 19, 22 (for assign queue)

### Backend `[BE]`

- [ ] `GET /api/v1/dashboard/summary?period=today|yesterday|weekly|monthly|quarterly`
- [ ] `GET /api/v1/dashboard/chart?period=&filter=`
- [ ] `GET /api/v1/dashboard/assign-queue?limit=10`
- [ ] `GET /api/v1/dashboard/today-appointments?limit=8`
- [ ] `GET /api/v1/dashboard/doctors-status` — available / on-visit / offline counts

### Frontend `[FE]`

- [ ] `dashboard.component.ts` → all dashboard endpoints (replace in-memory filtering)
- [ ] Stat cards, line chart, donut, assign table, today appointments

**✓ Room 24 done when:** Dashboard loads entirely from API · period switch updates stats.

---

# PHASE 10 — Transport & Live Map

## Room 25 — Transport

**Depends on:** Room 1

### Backend `[BE]`

- [ ] Firestore collection: `vehicles`
- [ ] `GET /api/v1/vehicles` — list
- [ ] `GET /api/v1/vehicles/summary` — stats cards
- [ ] `PATCH /api/v1/vehicles/:id/status`
- [ ] `POST /api/v1/vehicles/:id/assign` — assign to doctor/booking
- [ ] Seed vehicles from mock-data

### Frontend `[FE]`

- [ ] `transport.component.ts` → API

**✓ Room 25 done when:** Vehicle table + stat cards from Firestore.

---

## Room 26 — Live Map

**Depends on:** Rooms 20, 25, 19

### Backend `[BE]`

- [ ] `GET /api/v1/map/markers?layers=doctors,vehicles,customers`
- [ ] `GET /api/v1/map/distances/:bookingId`
- [ ] `PATCH /api/v1/doctors/:id/location` — lat/lng
- [ ] `PATCH /api/v1/vehicles/:id/location`
- [ ] Seed `areas` collection from `bangalore-map.ts`

### Frontend `[FE]`

- [ ] `live-map.component.ts` → markers + distance sidebar from API

**✓ Room 26 done when:** Map layers toggle · active bookings show on map · distances match booking location.

---

# PHASE 11 — Files & Payments

## Room 27 — Files & Documents

**Depends on:** Room 4  
**Note:** Room 16 (documents) stores filenames until this phase adds real uploads

### Backend `[BE]`

- [ ] Firebase Storage upload (multer → admin SDK)
- [ ] `POST /api/v1/bookings/:id/files` — multipart `{ category }`
- [ ] `GET /api/v1/bookings/:id/files`
- [ ] `DELETE /api/v1/files/:id`
- [ ] Save Storage URLs into `details.documents` and `details.health.problemMediaFiles`

### Frontend `[FE]`

- [ ] Wire `onProblemMedia()`, `onDocumentFiles()`, `onVaccinationFiles()` in `appointment-form.base.ts` to upload API

**✓ Room 27 done when:** Uploaded files persist as URLs in Firestore · downloadable from booking detail.

---

## Room 28 — Payments (Record Only — No Razorpay)

**Depends on:** Room 4

### Backend `[BE]`

- [ ] Firestore collection: `payments`
- [ ] `POST /api/v1/payments` — `{ bookingId, amount, method, referenceNote?, status? }`
- [ ] `GET /api/v1/payments?bookingId=`
- [ ] `PATCH /api/v1/payments/:id`
- [ ] On paid: update booking `paymentStatus`, append history entry

### Frontend `[FE]`

- [ ] Add **Record Payment** modal on `booking-detail.component.ts` (new UI)
- [ ] Show payment status badge on bookings list

**✓ Room 28 done when:** Manual payment saved in Firestore · booking shows paid status.

---

# PHASE 12 — Settings & Launch

## Room 29 — Settings

**Depends on:** Room 1

### Backend `[BE]`

- [ ] Firestore doc: `settings/global`
- [ ] `GET /api/v1/settings`
- [ ] `PATCH /api/v1/settings/profile`
- [ ] `PATCH /api/v1/settings/notifications`
- [ ] `PATCH /api/v1/settings/dispatch` — radius, timeout, max doctors
- [ ] `PATCH /api/v1/settings/transport` — fuel threshold, maintenance km
- [ ] Dispatch suggestions use `dispatchRadiusKm` from settings

### Frontend `[FE]`

- [ ] `settings.component.ts` → API for all tabs

**✓ Room 29 done when:** Settings save and load from Firestore.

---

## Launch Checklist (End of Phase 12)

### Backend polish `[BE]`

- [ ] Remove all mock/sample routes from `server.js`
- [ ] Deploy Firestore indexes
- [ ] Deploy Firestore + Storage security rules
- [ ] Run `scripts/seed.js` (doctors, areas, vehicles, settings — not fake bookings in prod)
- [ ] Production env vars + hosted Express

### Frontend polish `[FE]`

- [ ] Remove all direct imports of `BOOKINGS`, `DOCTORS`, `VEHICLES` from components
- [ ] `environment.prod.ts` with production API URL
- [ ] Build and deploy Angular app

### Final integration test

- [ ] Login → create appointment → appears in bookings → assign doctor → accept → complete → record payment
- [ ] Calendar, dashboard, dispatch, doctors, transport, live map all load from API
- [ ] Page refresh never loses data

**✓ Project done when:** Full admin portal runs on Express + Firebase with zero mock data.

---

# Dependency Graph (Visual)

```
Phase 0 (Prerequisites)
    └── Room 0 (Foundation)
            └── Room 1 (Auth)
                    ├── Room 2 (Owner)
                    │       └── Room 3 (Pet)
                    │               └── Room 4 (Booking Core)
                    │                       ├── Rooms 5–18 (Intake — same phase)
                    │                       └── Room 19 (Lifecycle)
                    │                               ├── Room 23 (Calendar/Bookings UI)
                    │                               ├── Room 22 (Dispatch) ← needs Room 20, 21
                    │                               └── Room 24 (Dashboard)
                    ├── Room 20 (Doctors)
                    │       └── Room 21 (Doctor Requests)
                    │               └── Room 22 (Dispatch)
                    ├── Room 25 (Transport)
                    │       └── Room 26 (Live Map) ← also needs 19, 20
                    ├── Room 27 (Files) ← needs Room 4
                    ├── Room 28 (Payments) ← needs Room 4
                    └── Room 29 (Settings)
```

---

# MVP Shortcut (Go Live Faster)

If you need a **working product sooner**, stop after these phases:

| Stop after | You get |
|------------|---------|
| Phase 2 | Login works |
| Phase 4 | Create/edit appointments in Firestore |
| Phase 5 | Bookings list + status + history |
| Phase 8 | Full bookings + calendar UI wired |

**Defer to v2:** Dispatch (7), Dashboard charts (9), Transport (10), Live Map (10), Files (11), Payments UI (11), Settings (12).

---

# Later Extensions (Not in This Order)

Build **after** Phase 12 is complete:

| Extension | How |
|-----------|-----|
| **Doctor web app** | Same Angular app + role guard (`admin` vs `doctor`) · hide admin routes · doctor sees only their profile/requests |
| **Customer app** | New Angular/React app · same Express API + Firebase · customer Auth role · booking create + track status |
| **OTP** | Enable later in Firebase Phone Auth if needed |
| **Razorpay** | Add gateway room later · until then Room 28 (manual payment record) is enough |
| **Push / SMS notifications** | New room · triggered from booking status changes |

---

# Start Here

```
1. Complete PHASE 0 (Firebase + env files)
2. Complete PHASE 1 → Room 0 (Foundation)
3. Complete PHASE 2 → Room 1 (Auth)
4. Complete PHASE 3 → Rooms 2–3 (Owner + Pet)
5. Complete PHASE 4 → Room 4 + Rooms 5–18 (Bookings)
6. Continue phase by phase — do not skip
```

**First line of code:** restructure `doobydev-api/server.js` and wire Firebase Auth login in `vetonspot-test`.
