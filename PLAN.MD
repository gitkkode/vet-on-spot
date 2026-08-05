# VetOnSpot Backend Implementation Plan

> **Scope:** This plan is derived entirely from the `vetonspot-test` Angular admin portal (mock data + UI flows). No backend integration exists yet — all data lives in `mock-data.ts` and is mutated in-memory.
>
> **Goal:** Build the backend systematically, one **Room** at a time. A **Room** is a bounded domain inside the appointment booking system — either a section of the intake form or an operational area (dispatch, calendar, etc.) that reads/writes appointment data.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Recommended Architecture](#2-recommended-architecture)
3. [Implementation Order (Phases)](#3-implementation-order-phases)
4. [Room Index — Build Sequence](#4-room-index--build-sequence)
5. [Phase 0 — Foundation Room](#phase-0--foundation-room)
6. [Phase 1 — Core Identity Rooms](#phase-1--core-identity-rooms)
7. [Phase 2 — Appointment Core Room](#phase-2--appointment-core-room)
8. [Phase 3 — Intake Detail Rooms (Form Sections)](#phase-3--intake-detail-rooms-form-sections)
9. [Phase 4 — Booking Lifecycle Room](#phase-4--booking-lifecycle-room)
10. [Phase 5 — Doctor Operations Rooms](#phase-5--doctor-operations-rooms)
11. [Phase 6 — Dispatch & Assignment Room](#phase-6--dispatch--assignment-room)
12. [Phase 7 — Calendar & List Views Room](#phase-7--calendar--list-views-room)
13. [Phase 8 — Dashboard & Analytics Room](#phase-8--dashboard--analytics-room)
14. [Phase 9 — Transport & Fleet Room](#phase-9--transport--fleet-room)
15. [Phase 10 — Live Map & Geo Room](#phase-10--live-map--geo-room)
16. [Phase 11 — Documents & Media Room](#phase-11--documents--media-room)
17. [Phase 12 — Settings & Configuration Room](#phase-12--settings--configuration-room)
18. [Phase 13 — Frontend Integration Room](#phase-13--frontend-integration-room)
19. [Cross-Cutting Concerns](#cross-cutting-concerns)
20. [API Contract Reference](#api-contract-reference)
21. [Database Schema Overview](#database-schema-overview)
22. [Testing Strategy Per Room](#testing-strategy-per-room)

---

## 1. Current State Summary

### What the frontend already defines

| Area | Source files | Current behavior |
|------|-------------|------------------|
| Routes | `app.routes.ts` | Dashboard, Bookings, Calendar, Doctors, Dispatch, Transport, Live Map, Settings, Login, 3 appointment wizards |
| Booking model | `mock-data.ts` → `Booking` | id, customer, pet summary, type, status, location/geo, schedule, emergency flags, doctor assignment, full `details` (16-section form), history timeline |
| Appointment form | `appointment-form.model.ts` → `PetAppointmentForm` | 16 sections with validation, section status, mandatory vs optional |
| Appointment CRUD | `appointment.service.ts` | create, update, save draft, finalize, edit — all in-memory |
| Auth | `auth.service.ts` | localStorage flag only; no real auth |
| Doctors | `mock-data.ts` → `Doctor` | list, profile, availability, accept/reject requests |
| Vehicles | `mock-data.ts` → `Vehicle` | fleet status, fuel, rides |
| Dispatch | `dispatch.component.ts` | queue, multi-doctor send, admin accept, map distances |
| Geo | `map-markers.ts`, `bangalore-map.ts` | lat/lng, area, ETA, distance calculations |

### Booking status lifecycle (must be preserved)

```
pending → sent → accepted → completed
   ↓        ↓
cancelled  (doctor decline → back to pending if no other doctors requested)
```

### Appointment form sections (= intake rooms)

From `APPOINTMENT_SECTIONS` in `appointment-form.model.ts`:

| # | Section ID | Mandatory | Tag |
|---|-----------|-----------|-----|
| 1 | owner | Yes | Required to book |
| 2 | pet | Yes | Required to book |
| 3 | appointment | Yes | Required to book |
| 4 | health | Yes | Required to book |
| 5 | pastMedical | No | Recommended |
| 6 | vaccination | No | Recommended |
| 7 | deworming | No | Optional |
| 8 | tickFlea | No | Optional |
| 9 | medications | No | Recommended |
| 10 | allergies | No | Recommended |
| 11 | diet | No | Optional |
| 12 | lifestyle | No | Optional |
| 13 | reproductive | No | If Applicable |
| 14 | emergency | No | Important |
| 15 | documents | No | Recommended |
| 16 | doctorNotes | No | Internal Only |

### Three appointment entry flows (all must hit same backend)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/appointments/quick` | `QuickAddAppointmentComponent` | 9-step wizard (primary flow) |
| `/appointments/express` | `ExpressAddAppointmentComponent` | Fast emergency/routine intake |
| `/appointments/new` & `/appointments/edit/:id` | `AddAppointmentComponent` | Full single-page form with all 16 sections |

---

## 2. Recommended Architecture

### Stack recommendation (greenfield — pick before Phase 0)

The frontend has `firebase` in `package.json` but **does not use it yet**. Two viable paths:

| Option | Pros | Cons |
|--------|------|------|
| **A. Node.js + PostgreSQL REST API** | Full control, relational schema fits 16-section form + history + geo queries | More setup |
| **B. Firebase (Firestore + Auth + Storage)** | Fast auth/storage, real-time for dispatch/live map | Complex queries for analytics/calendar; form nesting |

**Recommended:** Option A (Node.js + PostgreSQL) for structured medical data, reporting, and geo queries. Use Firebase Storage (or S3) only for document uploads if preferred.

### Backend module layout (suggested)

```
backend/
├── src/
│   ├── rooms/                    # One folder per Room
│   │   ├── foundation/
│   │   ├── owner/
│   │   ├── pet/
│   │   ├── appointment/
│   │   └── ...
│   ├── shared/                   # DB, auth middleware, errors, validation
│   └── app.ts
├── migrations/
└── tests/
```

### Key design principles

1. **Booking is the aggregate root** — everything appointment-related hangs off `bookings.id`.
2. **Normalize owners & pets** — same owner/pet can appear across multiple bookings (see `getPetVisitHistory`, `getPetMedicationHistory`).
3. **Store full intake as JSONB + normalized tables** — JSONB for fast frontend mapping to `PetAppointmentForm`; normalized tables for search/reporting.
4. **Append-only booking history** — never mutate history entries; mirror `BookingHistoryEntry[]`.
5. **Optimistic UI later** — frontend uses signals; backend should return complete booking objects on every mutation.

---

## 3. Implementation Order (Phases)

Build in this exact order. Each phase unlocks the next.

```
Phase 0  Foundation          → auth, DB, API skeleton, error handling
Phase 1  Owner + Pet Rooms    → customer & pet identity (needed before any booking)
Phase 2  Appointment Core     → create booking shell (schedule, type, mode)
Phase 3  Intake Detail Rooms  → health, medical history, etc. (can parallelize 3a–3m)
Phase 4  Booking Lifecycle    → status transitions, history, cancel, complete
Phase 5  Doctor Operations    → doctor CRUD, availability, accept/reject
Phase 6  Dispatch             → assign, multi-doctor request, admin accept
Phase 7  Calendar & Lists     → filtered queries for bookings workspace
Phase 8  Dashboard Analytics  → aggregated stats & charts
Phase 9  Transport            → vehicle fleet management
Phase 10 Live Map & Geo       → real-time positions, distance/ETA
Phase 11 Documents & Media    → file upload/storage linked to bookings
Phase 12 Settings             → dispatch rules, notifications, admin profile
Phase 13 Frontend Integration → replace mock-data with HTTP services
```

---

## 4. Room Index — Build Sequence

| Order | Room | Phase | Depends on |
|-------|------|-------|------------|
| 0 | Foundation | 0 | — |
| 1 | Owner | 1 | Foundation |
| 2 | Pet | 1 | Owner |
| 3 | Appointment Core | 2 | Owner, Pet |
| 4 | Health | 3 | Appointment Core |
| 5 | Past Medical | 3 | Appointment Core |
| 6 | Vaccination | 3 | Appointment Core |
| 7 | Deworming | 3 | Appointment Core |
| 8 | Tick / Flea | 3 | Appointment Core |
| 9 | Medications | 3 | Appointment Core |
| 10 | Allergies | 3 | Appointment Core |
| 11 | Diet | 3 | Appointment Core |
| 12 | Lifestyle | 3 | Appointment Core |
| 13 | Reproductive | 3 | Appointment Core |
| 14 | Emergency | 3 | Appointment Core |
| 15 | Doctor Notes | 3 | Appointment Core |
| 16 | Booking Lifecycle | 4 | Appointment Core |
| 17 | Doctor Management | 5 | Foundation |
| 18 | Doctor Requests | 5 | Booking Lifecycle, Doctor Management |
| 19 | Dispatch & Assignment | 6 | Doctor Requests, Geo (basic) |
| 20 | Calendar & List Views | 7 | Booking Lifecycle |
| 21 | Dashboard & Analytics | 8 | Booking Lifecycle |
| 22 | Transport & Fleet | 9 | Foundation |
| 23 | Live Map & Geo | 10 | Doctor Management, Transport, Booking Lifecycle |
| 24 | Documents & Media | 11 | Appointment Core, Storage |
| 25 | Settings | 12 | Foundation |
| 26 | Frontend Integration | 13 | All above |

---

## Phase 0 — Foundation Room

### Purpose
Establish the backend platform every other Room depends on.

### Frontend reference
- `auth.service.ts`, `auth.guard.ts`, `login.component.ts`, `logout.component.ts`

### Deliverables

#### 0.1 Project bootstrap
- [ ] Initialize backend project (Node.js/Express or NestJS recommended)
- [ ] PostgreSQL database + migration tool (e.g. Prisma, Drizzle, or Knex)
- [ ] Environment config (`.env`: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`)
- [ ] Health check endpoint: `GET /health`

#### 0.2 Authentication & authorization
- [ ] `POST /auth/login` — email + password → JWT access token
- [ ] `POST /auth/logout` — invalidate refresh token (optional)
- [ ] `GET /auth/me` — current admin user profile
- [ ] Auth middleware — protect all routes except `/auth/login`, `/health`
- [ ] Role enum: `admin` (future: `doctor`, `dispatcher`)

**Frontend mapping:** Replace `AuthService.login()` localStorage hack with real JWT stored in memory + httpOnly cookie or secure localStorage.

**Validation rules (match login UI):**
- Email required, valid format
- Password min 4 chars (upgrade to 8+ in production)

#### 0.3 API conventions
- [ ] Standard response envelope: `{ data, error, meta }`
- [ ] Standard error codes: `400`, `401`, `403`, `404`, `409`, `422`, `500`
- [ ] Pagination: `?page=1&limit=20`
- [ ] Sorting: `?sort=scheduledDate&order=desc`
- [ ] Request ID / correlation ID in logs

#### 0.4 Base entities

```sql
-- admins (portal users)
admins (id, email, password_hash, full_name, created_at, updated_at)

-- audit log (used by every Room later)
audit_logs (id, actor_id, entity_type, entity_id, action, payload_json, created_at)
```

### Acceptance criteria
- Admin can log in from Angular login page (once integrated)
- Protected endpoint returns 401 without token
- Migrations run cleanly on fresh DB

---

## Phase 1 — Core Identity Rooms

---

### Room 1 — Owner

#### Purpose
Store pet owner / customer identity. Reusable across bookings.

#### Frontend reference
- `PetAppointmentForm.owner` — fullName, mobile, email, address, emergencyContact
- `booking.customerName`, `booking.location` (derived from owner)
- Mandatory validation in `validateAppointmentForm()`

#### Data model

```sql
owners (
  id            UUID PK,
  full_name     TEXT NOT NULL,
  mobile        TEXT NOT NULL,
  email         TEXT,
  address       TEXT NOT NULL,
  emergency_contact TEXT,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
-- Index: mobile (lookup returning customers), email
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/owners` | Create owner |
| GET | `/owners/:id` | Get owner by ID |
| PATCH | `/owners/:id` | Update owner |
| GET | `/owners?mobile=` | Find by mobile (returning customer flow) |

#### Business rules
- `full_name`, `mobile`, `address` required for normal bookings
- `email`, `emergency_contact` optional but recommended (see `getUnfilledDetailReminders`)
- On booking create: upsert owner by mobile if exists

#### Acceptance criteria
- Can create owner independently
- Duplicate mobile lookup returns existing owner
- Validation errors match frontend mandatory fields

---

### Room 2 — Pet

#### Purpose
Store pet profile linked to an owner. Enables visit history & medication history across bookings.

#### Frontend reference
- `PetAppointmentForm.pet` — name, species, breed, gender, ageOrDob, weight, colorMarks, microchip, neutered
- `booking.petName`, `booking.petAge`, `booking.petIcon` (derived)
- `isSamePet()`, `getPetVisitHistory()`, `getPetMedicationHistory()`
- Breed lists: `DOG_BREEDS`, `CAT_BREEDS`

#### Data model

```sql
pets (
  id            UUID PK,
  owner_id      UUID FK → owners,
  name          TEXT NOT NULL,
  species       ENUM('Dog','Cat','Bird','Rabbit','Others'),
  breed         TEXT,
  gender        TEXT,
  age_or_dob    TEXT,
  weight        TEXT,
  color_marks   TEXT,
  microchip     TEXT,
  neutered      ENUM('Yes','No') NULL,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/pets` | Create pet (requires owner_id) |
| GET | `/pets/:id` | Get pet |
| PATCH | `/pets/:id` | Update pet |
| GET | `/owners/:ownerId/pets` | List pets for owner |
| GET | `/pets/:id/visit-history` | All bookings for this pet |
| GET | `/pets/:id/medication-history` | Aggregated meds from past visits |

#### Business rules
- Emergency bookings require: name, species (see `validateEmergencyAppointmentForm`)
- Normal bookings require: breed, ageOrDob
- `petIcon` derived from species on backend (same mapping as `speciesIcon()` in mock-data)
- Match returning pets: owner_id + name (case-insensitive) or microchip

#### Acceptance criteria
- Pet linked to owner
- Visit history returns bookings sorted by date desc
- Medication history aggregates from `medications`, `doctorNotes`, `deworming` sections

---

## Phase 2 — Appointment Core Room

### Room 3 — Appointment Core

#### Purpose
Create the booking shell — the central record everything else attaches to.

#### Frontend reference
- `PetAppointmentForm.appointment` — bookingMode, preferredDate, preferredTime, consultationType, doctorPreference, reasonForVisit, additionalNotes
- `Booking` top-level fields: id, type, service, status, scheduledDate/Time, isEmergency, location, geo
- `createBookingFromForm()`, `updateBookingFromForm()`
- Routes: all three appointment wizards

#### Data model

```sql
bookings (
  id                        TEXT PK,          -- e.g. BK-1043 (or UUID with display id)
  owner_id                  UUID FK,
  pet_id                    UUID FK,
  status                    ENUM('pending','sent','accepted','completed','cancelled'),
  type                      ENUM('online','home','clinic'),
  service                   TEXT,
  reason                    TEXT NOT NULL,
  scheduled_date            DATE NOT NULL,
  scheduled_time            TIME NOT NULL,
  location                  TEXT,
  area                      TEXT,
  lat                       DECIMAL,
  lng                       DECIMAL,
  is_emergency              BOOLEAN DEFAULT false,
  must_reach_within_minutes INT,              -- default 60 for emergency
  estimated_arrival_minutes INT,
  assigned_doctor_id        UUID FK → doctors NULL,
  submitted_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ,
  updated_at                TIMESTAMPTZ
)

-- Full form snapshot for fast frontend hydration
booking_intake (
  booking_id    UUID FK PK,
  details_json  JSONB NOT NULL              -- full PetAppointmentForm shape
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings` | Create booking (owner + pet + appointment sections minimum) |
| GET | `/bookings/:id` | Get booking with full details |
| PATCH | `/bookings/:id` | Update booking (draft save — `saveBooking()`) |
| PATCH | `/bookings/:id/intake` | Partial update of intake sections |
| POST | `/bookings/:id/finalize` | Submit/finalize booking (`finalizeBooking()`) |

#### Business rules

**Create (POST /bookings):**
1. Upsert owner + pet
2. Derive `type` from consultationType: Clinic → `clinic`, Online → `online`, else `home`
3. Derive `is_emergency` from bookingMode OR any emergency flag (same logic as `createBookingFromForm`)
4. Set `status = pending`, `submitted_at = now()`
5. Generate booking ID (BK-XXXX sequential)
6. Copy owner.address → location; geocode area/lat/lng if possible
7. Initialize history: `[{ label: 'Booking created', done: true }]`

**Validation (normal mode):**
- owner.fullName, mobile, address
- pet.breed, ageOrDob
- appointment.consultationType, reasonForVisit

**Validation (emergency mode):**
- owner.fullName, mobile, address
- pet.name, species
- appointment.preferredDate, preferredTime, reasonForVisit

**Doctor preference:**
- If `doctorPreference` set at create → store as hint, NOT as assigned doctor until accepted

#### Acceptance criteria
- Create booking from minimal emergency form
- Create booking from full quick-add wizard
- Edit booking preserves id and appends history on meaningful changes
- `GET /bookings/:id` returns shape compatible with frontend `Booking` interface

---

## Phase 3 — Intake Detail Rooms (Form Sections)

These Rooms extend `booking_intake.details_json` and optionally normalized tables. Implement after Appointment Core. **Can be built in parallel** once Room 3 is done.

---

### Room 4 — Health (Current Health Problem)

#### Frontend reference
- `PetAppointmentForm.health` — mainComplaint, symptoms, sinceWhen, severity, appetite, waterIntake, urinationNormal, stoolNormal, symptom booleans, painArea, injuryAccident, problemMediaFiles
- Mandatory section for booking

#### Data model
- Stored in `booking_intake.details_json.health`
- Optional normalized: `booking_health_details (booking_id, ...columns)`

#### API
- `PATCH /bookings/:id/intake/health`

#### Business rules
- Required for normal booking validation: mainComplaint, symptoms, sinceWhen, severity (section complete logic)
- `problemMediaFiles` → file IDs from Documents Room (Phase 11)

---

### Room 5 — Past Medical History

#### Frontend reference
- `PetAppointmentForm.pastMedical` — previousIllnesses, previousSurgeries, previousHospitalization, chronicDiseases[]
- `CHRONIC_DISEASE_OPTIONS` enum list

#### API
- `PATCH /bookings/:id/intake/past-medical`

#### Business rules
- Optional but recommended
- `chronicDiseases` is array of predefined strings

---

### Room 6 — Vaccination History

#### Frontend reference
- `PetAppointmentForm.vaccination` — vaccinated, lastVaccinationDate, vaccineNames, vaccinationCardFiles[]

#### API
- `PATCH /bookings/:id/intake/vaccination`

#### Business rules
- Also populate pet-level vaccination summary for longitudinal records (future)

---

### Room 7 — Deworming History

#### Frontend reference
- `PetAppointmentForm.deworming` — lastDate, medicine

#### API
- `PATCH /bookings/:id/intake/deworming`

---

### Room 8 — Tick / Flea Prevention

#### Frontend reference
- `PetAppointmentForm.tickFlea` — lastTreatmentDate, productUsed

#### API
- `PATCH /bookings/:id/intake/tick-flea`

---

### Room 9 — Current Medications

#### Frontend reference
- `PetAppointmentForm.medications` — medicineName, dosage, sinceWhen, supplements
- Used by `getPetMedicationHistory()`

#### API
- `PATCH /bookings/:id/intake/medications`

#### Business rules
- Medication records feed pet medication history across visits

---

### Room 10 — Allergies

#### Frontend reference
- `PetAppointmentForm.allergies` — medicine, food, environmental

#### API
- `PATCH /bookings/:id/intake/allergies`

---

### Room 11 — Diet Information

#### Frontend reference
- `PetAppointmentForm.diet` — foodType, brandName, feedingFrequency, treatsGiven
- `FOOD_TYPE_OPTIONS` enum

#### API
- `PATCH /bookings/:id/intake/diet`

---

### Room 12 — Lifestyle

#### Frontend reference
- `PetAppointmentForm.lifestyle` — indoorOutdoor, exerciseLevel, contactOtherAnimals, recentTravel, tickExposure

#### API
- `PATCH /bookings/:id/intake/lifestyle`

---

### Room 13 — Reproductive History

#### Frontend reference
- `PetAppointmentForm.reproductive` — pregnant, lastHeatCycle, breedingHistory, numberOfLitters

#### API
- `PATCH /bookings/:id/intake/reproductive`

#### Business rules
- Applicable primarily for non-neutered pets; optional

---

### Room 14 — Emergency Screening

#### Frontend reference
- `PetAppointmentForm.emergency` — isEmergency, bleeding, poisonIngestion, seizures, unconscious, difficultyBreathing
- Drives `is_emergency` flag and SLA (`mustReachWithinMinutes: 60`)

#### API
- `PATCH /bookings/:id/intake/emergency`

#### Business rules
- Any true emergency flag → `bookings.is_emergency = true`
- Emergency bookings get priority in all queues (`sortBookingsByPriority`, `sortAppointmentsForAssign`)

---

### Room 15 — Doctor Notes (Internal)

#### Frontend reference
- `PetAppointmentForm.doctorNotes` — diagnosis, clinicalFindings, treatmentPlan, medicinesPrescribed, labTestsRecommended, followUpDate, nextVaccinationDate, nextDewormingDate
- Tag: "Internal Only" — admin/doctor only, not customer-facing

#### API
- `PATCH /bookings/:id/intake/doctor-notes`
- Requires role: `admin` or assigned doctor

#### Business rules
- Typically filled after visit completion
- Updating doctor notes appends history entry: "Doctor notes updated"

---

### Intake Rooms — Shared acceptance criteria
- [ ] Each section can be PATCHed independently (wizard step save)
- [ ] `GET /bookings/:id` returns merged `details` matching `PetAppointmentForm`
- [ ] Section status (complete/partial/empty) computable server-side OR client keeps logic
- [ ] Draft save (`saveBooking`) does not change booking status
- [ ] Finalize validates mandatory sections

---

## Phase 4 — Booking Lifecycle Room

### Room 16 — Booking Lifecycle

#### Purpose
Manage booking status transitions and immutable history timeline.

#### Frontend reference
- `Booking.status`, `Booking.history[]`
- `getStatusLabel()`, `getAcceptanceLabel()`, `getEmergencySlaLabel()`
- Status filters in bookings page: pending, accepted, completed, cancelled

#### Data model

```sql
booking_history (
  id          UUID PK,
  booking_id  UUID FK,
  time_label  TEXT,           -- display time e.g. "10:49" or "Now"
  label       TEXT NOT NULL,
  done        BOOLEAN,
  created_at  TIMESTAMPTZ DEFAULT now()
)

booking_doctor_requests (
  id          UUID PK,
  booking_id  UUID FK,
  doctor_id   UUID FK,
  status      ENUM('pending','accepted','declined'),
  created_at  TIMESTAMPTZ
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings/:id/cancel` | Cancel booking |
| POST | `/bookings/:id/complete` | Mark visit completed |
| GET | `/bookings/:id/history` | Get history timeline |
| GET | `/bookings` | List with filters (status, type, search, date range) |

#### Status transition rules

| From | Action | To | History label |
|------|--------|-----|---------------|
| pending | dispatch send | sent | "Request sent to Dr. X" |
| sent | doctor accept | accepted | "Accepted by Dr. X" |
| sent | all doctors decline | pending | "Declined by Dr. X" |
| accepted | visit done | completed | "Visit completed" |
| any (before completed) | cancel | cancelled | "Cancelled by admin/customer" |
| accepted | doctor notes saved | accepted | "Doctor notes updated" |

#### List query parameters (Bookings Workspace)
- `status` — pending | sent | accepted | completed | cancelled
- `type` — online | home | clinic
- `search` — pet name, owner name, booking ID
- `dateFrom`, `dateTo`
- `isEmergency` — boolean
- Default sort: emergency first, then submittedAt desc (`sortAppointmentsForAssign`)

#### Acceptance criteria
- History is append-only
- Invalid transitions return 409 Conflict
- Bookings list matches frontend table columns: ID, Name, Submitted, Visit, Type, Status, Doctor

---

## Phase 5 — Doctor Operations Rooms

---

### Room 17 — Doctor Management

#### Purpose
CRUD for veterinarians, availability, location.

#### Frontend reference
- `Doctor` interface, `DOCTORS` array
- `doctors.component.ts` — list, filter by status, add doctor form
- `createDoctorFromForm()`, `DOCTOR_SPECIALTIES`
- `doctor-profile.component.ts` — sidebar, stats, availability toggle

#### Data model

```sql
doctors (
  id            TEXT PK,       -- DR-01
  name          TEXT NOT NULL,
  initials      TEXT,
  specialty     TEXT,
  status        ENUM('available','on-visit','offline'),
  location      TEXT,
  area          TEXT,
  lat           DECIMAL,
  lng           DECIMAL,
  mobile        TEXT,
  email         TEXT,
  rating        DECIMAL DEFAULT 4.5,
  visits_today  INT DEFAULT 0,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/doctors` | List doctors (?status=available) |
| POST | `/doctors` | Create doctor |
| GET | `/doctors/:id` | Get doctor profile |
| PATCH | `/doctors/:id` | Update doctor |
| PATCH | `/doctors/:id/availability` | Set available / offline / on-visit |
| GET | `/doctors/:id/stats?period=today\|yesterday\|weekly\|monthly` | Period stats |
| GET | `/doctors/:id/bookings?period=` | Period bookings |

#### Business rules
- `setDoctorAvailability(false)` → status = offline
- `setDoctorAvailability(true)` → available unless has active accepted booking → on-visit
- Accept booking → if was available, set on-visit + increment visits_today
- Reset visits_today at midnight (cron job)

#### Acceptance criteria
- Doctor list with status filter matches frontend cards
- Add doctor form creates record with generated DR-XX id
- Profile stats match `getDoctorPeriodStats()` shape: total, pending, completed, active, patients

---

### Room 18 — Doctor Requests (Accept / Reject)

#### Purpose
Handle doctor-facing request queue — accept or decline booking requests.

#### Frontend reference
- `getDoctorIncomingRequests()`, `acceptBookingForDoctor()`, `rejectBookingForDoctor()`
- Doctor profile → Requests tab
- `requestedDoctorIds[]` on booking

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/doctors/:id/requests` | Incoming pending requests |
| POST | `/bookings/:id/accept` | Doctor accepts `{ doctorId }` |
| POST | `/bookings/:id/decline` | Doctor declines `{ doctorId }` |

#### Business rules

**Accept:**
- Set `assigned_doctor_id`, `status = accepted`
- Clear `requestedDoctorIds`
- Update doctor status to on-visit if was available
- History: "Accepted by Dr. X" or "Admin accepted on behalf of Dr. X" if `byAdmin=true`

**Decline:**
- Remove doctor from `requestedDoctorIds`
- If no doctors left → `status = pending`
- History: "Declined by Dr. X"

#### Acceptance criteria
- Multiple doctors can be requested simultaneously (`sent` status)
- First accept wins; others auto-declined or notified
- Doctor profile requests tab shows correct count badge

---

## Phase 6 — Dispatch & Assignment Room

### Room 19 — Dispatch & Assignment

#### Purpose
Admin dispatch workflow — queue, map-based doctor selection, send requests, admin override accept.

#### Frontend reference
- `dispatch.component.ts` — incoming queue, map, multi-select doctors, send request, accept for doctor
- `dashboard.component.ts` — assign popup, `assignBookingToDoctor()`
- `getUnassignedBookings()`, `assignBookingToDoctor()`

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dispatch/queue` | pending + sent bookings, emergency first |
| POST | `/bookings/:id/assign` | Send to single doctor (dashboard assign popup) |
| POST | `/bookings/:id/dispatch` | Send to multiple doctors `{ doctorIds[] }` |
| POST | `/bookings/:id/admin-accept` | Admin accepts on behalf of doctor `{ doctorId }` |
| GET | `/dispatch/suggestions/:bookingId` | Nearby available doctors with distance + ETA |

#### Business rules

**Queue ordering:**
1. Emergency first
2. Newest submittedAt first
3. Same as `sortAppointmentsForAssign()`

**Assign (single doctor):**
- status → sent
- requestedDoctorIds → [doctorId]
- History: "Request sent to Dr. X"

**Dispatch (multi doctor):**
- status → sent
- requestedDoctorIds → doctorIds
- History: "Request sent to Dr. A, Dr. B, ..."
- Append pending step: "Waiting for doctor or admin acceptance"

**Suggestions endpoint:**
- Input: booking lat/lng
- Output: doctors where status=available, sorted by distanceKm asc, with etaMin
- Use settings: default search radius km

#### Acceptance criteria
- Queue matches dispatch page incoming queue
- Multi-doctor send works
- Admin accept from dispatch map works (`byAdmin=true`)
- Dashboard assign popup uses `/assign` endpoint

---

## Phase 7 — Calendar & List Views Room

### Room 20 — Calendar & List Views

#### Purpose
Date-based views of bookings for scheduling.

#### Frontend reference
- `calendar.component.ts` — month grid, booking dots, day drawer with acceptance status
- `bookings.component.ts` — full workspace with type tabs, status chips, search, drawer
- `booking-detail.component.ts` — full detail, visit history, medication history, edit

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/bookings/calendar?month=2026-07` | Counts per day + emergency flags |
| GET | `/bookings?scheduledDate=2026-07-05` | All bookings on a date |
| GET | `/bookings/:id` | Full detail with history, details, previous visits |
| GET | `/bookings/:id/previous-visits` | Prior visits for same pet |

#### Calendar response shape

```json
{
  "days": [
    { "date": "2026-07-05", "bookingCount": 3, "hasEmergency": true }
  ]
}
```

#### Booking detail must include
- All top-level Booking fields
- Full `details` (PetAppointmentForm)
- `history[]`
- `previousVisits[]` (completed/cancelled/prior dates)
- `medicationHistory[]`
- `visitCount`

#### Acceptance criteria
- Calendar dots match booking counts per day
- Day drawer shows acceptance labels via `getAcceptanceLabel()`
- Booking detail page loads everything for BK-1038-style rich records

---

## Phase 8 — Dashboard & Analytics Room

### Room 21 — Dashboard & Analytics

#### Purpose
Aggregated metrics, charts, and operational snapshots for admin home.

#### Frontend reference
- `dashboard.component.ts` — period selector (today/yesterday/weekly/monthly/quarterly), stat cards, line chart, donut chart, assign table, today appointments, doctor availability, transport mini chart

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/summary?period=today` | Stat cards: total bookings, change %, home/online/clinic split |
| GET | `/dashboard/chart?period=weekly&filter=all` | Time-series buckets for line chart |
| GET | `/dashboard/donut?period=monthly` | Home vs online percentages |
| GET | `/dashboard/assign-queue?limit=10` | Priority assign table rows |
| GET | `/dashboard/today-appointments?limit=8` | Today's schedule |
| GET | `/dashboard/doctors-status` | Available / on-visit / offline counts |
| GET | `/dashboard/transport-summary` | Fleet stats for mini chart |

#### Business rules
- Period filters match `isInPeriod()` logic in dashboard
- Chart buckets: daily for weekly, weekly for monthly, etc.
- Assign queue: same filter as Room 19 but limited rows
- `awaitingAssignmentCount`: bookings where no assignedDoctor AND status in (pending, sent)

#### Acceptance criteria
- Dashboard loads without client-side aggregation of raw bookings
- Period switch returns correct counts
- Chart data matches frontend spline chart structure

---

## Phase 9 — Transport & Fleet Room

### Room 22 — Transport & Fleet

#### Purpose
Manage vehicles used for home visit dispatch.

#### Frontend reference
- `Vehicle` interface, `VEHICLES` array
- `transport.component.ts` — stats cards, vehicle table, fuel bars, assign/track buttons

#### Data model

```sql
vehicles (
  id                TEXT PK,
  driver_name       TEXT,
  assigned_doctor_id UUID FK NULL,
  status            ENUM('available','on-trip','maintenance','unavailable'),
  area              TEXT,
  lat               DECIMAL,
  lng               DECIMAL,
  rides_today       INT DEFAULT 0,
  km_today          DECIMAL DEFAULT 0,
  fuel_percent      INT,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ
)

vehicle_assignments (
  id          UUID PK,
  vehicle_id  UUID FK,
  booking_id  UUID FK,
  doctor_id   UUID FK,
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vehicles` | List all vehicles |
| GET | `/vehicles/summary` | Available count, total rides, total km, avg fuel |
| POST | `/vehicles/:id/assign` | Assign vehicle to doctor/booking |
| PATCH | `/vehicles/:id/status` | Update status |
| GET | `/vehicles/:id/track` | Current location (future GPS integration) |

#### Acceptance criteria
- Transport page stats match API summary
- Vehicle status pills match frontend classes
- Assign button on available vehicles works

---

## Phase 10 — Live Map & Geo Room

### Room 23 — Live Map & Geo

#### Purpose
Real-time map layers for doctors, vehicles, and active bookings with distance/ETA.

#### Frontend reference
- `live-map.component.ts` — layer toggles, active bookings list, distance rows
- `map-markers.ts` — `bookingGeo()`, `doctorGeo()`, `vehicleGeo()`, `distanceKm()`, `estimateEtaMinutes()`
- `bangalore-map.ts` — area coordinates

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/map/markers?layers=doctors,vehicles,customers` | All map markers |
| GET | `/map/distances/:bookingId` | Doctors & vehicles distance/ETA from booking |
| PATCH | `/doctors/:id/location` | Update doctor GPS |
| PATCH | `/vehicles/:id/location` | Update vehicle GPS |

#### Response — marker shape

```json
{
  "id": "DR-01",
  "type": "doctor",
  "lat": 12.9591,
  "lng": 77.6974,
  "label": "Dr. Anita Rao",
  "status": "on-visit"
}
```

#### Business rules
- Active bookings = status NOT IN (completed, cancelled)
- Offline doctors / maintenance vehicles excluded from map
- Distance: Haversine formula (same as frontend `distanceKm`)
- ETA: distance-based estimate (same as `estimateEtaMinutes`)
- Optional: WebSocket channel `map:updates` for live positions

#### Acceptance criteria
- Live map markers match frontend `buildLiveMapMarkers()`
- Distance sidebar matches `distanceRows()` output
- Layer toggles filter server-side or client-side consistently

---

## Phase 11 — Documents & Media Room

### Room 24 — Documents & Media

#### Purpose
File uploads for intake documents, health photos, vaccination cards.

#### Frontend reference
- `PetAppointmentForm.documents` — prescriptions, bloodTests, xray, ultrasound, vaccinationCard, medicalRecords, problemPhotos
- `health.problemMediaFiles`, `vaccination.vaccinationCardFiles`
- File handlers in `appointment-form.base.ts`: `onProblemMedia()`, `onDocumentFiles()`

#### Data model

```sql
files (
  id            UUID PK,
  booking_id    UUID FK,
  category      TEXT,     -- prescriptions | bloodTests | xray | etc.
  original_name TEXT,
  storage_key   TEXT,
  mime_type     TEXT,
  size_bytes    INT,
  uploaded_by   UUID,
  created_at    TIMESTAMPTZ
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings/:id/files` | Upload file (multipart) `{ category }` |
| GET | `/bookings/:id/files` | List files by category |
| GET | `/files/:id/download` | Signed download URL |
| DELETE | `/files/:id` | Remove file |

#### Business rules
- Max file size configurable (settings)
- Allowed mime types: pdf, jpg, png, mp4
- Store URLs/IDs in intake JSON arrays (replace filename strings)
- Virus scan hook (production)

#### Acceptance criteria
- Upload from wizard document step returns file IDs
- Booking detail shows uploaded documents
- Intake JSON stores references not raw filenames

---

## Phase 12 — Settings & Configuration Room

### Room 25 — Settings

#### Purpose
Admin portal configuration — profile, notifications, dispatch rules, transport thresholds.

#### Frontend reference
- `settings.component.ts` — tabs: profile, notifications, dispatch, transport, account

#### Data model

```sql
admin_settings (
  admin_id                  UUID FK,
  dispatch_radius_km        INT DEFAULT 5,
  request_timeout_minutes   INT DEFAULT 10,
  max_doctors_per_request   INT DEFAULT 3,
  low_fuel_threshold_pct    INT DEFAULT 20,
  maintenance_reminder_km   INT DEFAULT 5000,
  notify_new_booking        BOOLEAN DEFAULT true,
  notify_dispatch_timeout   BOOLEAN DEFAULT true,
  notify_low_fuel           BOOLEAN DEFAULT true
)
```

#### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Get all settings |
| PATCH | `/settings/profile` | Update admin name/email |
| PATCH | `/settings/notifications` | Toggle notification flags |
| PATCH | `/settings/dispatch` | Dispatch rules |
| PATCH | `/settings/transport` | Transport thresholds |

#### Acceptance criteria
- Dispatch room uses settings for radius and max doctors
- Settings persist across sessions
- Profile tab updates admin record from Phase 0

---

## Phase 13 — Frontend Integration Room

### Room 26 — Frontend Integration

#### Purpose
Replace all mock-data usage with real HTTP services — the final mile.

#### Frontend files to refactor (in order)

| Step | File | Change |
|------|------|--------|
| 1 | `auth.service.ts` | Call `/auth/login`, store JWT, attach interceptor |
| 2 | New `api.service.ts` or `http.interceptor.ts` | Base URL, auth header, error handling |
| 3 | New `booking-api.service.ts` | Replace BOOKINGS CRUD |
| 4 | `appointment.service.ts` | Delegate to booking-api instead of mock-data |
| 5 | New `doctor-api.service.ts` | Replace DOCTORS mutations |
| 6 | New `dispatch-api.service.ts` | Queue, assign, dispatch |
| 7 | New `dashboard-api.service.ts` | Summary endpoints |
| 8 | New `vehicle-api.service.ts` | Transport page |
| 9 | New `map-api.service.ts` | Live map markers |
| 10 | New `settings-api.service.ts` | Settings page |
| 11 | `appointment-form.base.ts` | Load booking from API on edit route |
| 12 | Remove direct `BOOKINGS` imports from components | Use services only |

#### Add to `app.config.ts`
- `provideHttpClient(withInterceptors([authInterceptor]))`

#### Environment file
```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:3000/api/v1',
};
```

#### Integration strategy
1. **Strangler pattern** — one page at a time (bookings first, then dashboard, etc.)
2. Feature flag: `USE_MOCK_DATA = false` during migration
3. Keep `mock-data.ts` until all pages migrated, then delete

#### Acceptance criteria
- [ ] No component imports `BOOKINGS`, `DOCTORS`, `VEHICLES` directly
- [ ] All CRUD survives page refresh (persisted in DB)
- [ ] Login required for all admin routes
- [ ] Error toasts on API failures

---

## Cross-Cutting Concerns

### ID generation
| Entity | Format | Example |
|--------|--------|---------|
| Booking | BK-XXXX | BK-1043 |
| Doctor | DR-XX | DR-01 |
| Vehicle | VH-XX | VH-01 |
| Owner/Pet/File | UUID | uuid v4 |

### Emergency SLA
- Default `mustReachWithinMinutes = 60` for all emergency bookings
- Track `estimatedArrivalMinutes` when doctor accepts (optional dispatch input)
- Dashboard and dispatch show SLA label via `getEmergencySlaLabel()`

### Geo coding
- Phase 2: store lat/lng from frontend or area lookup table
- Phase 10: integrate Google Maps / OpenStreetMap geocoding API
- Seed `bangalore_areas` table from `BANGALORE_AREAS` in frontend

### Real-time (optional, post-MVP)
- WebSocket events: `booking:created`, `booking:statusChanged`, `doctor:locationUpdated`
- Powers live dispatch queue refresh without polling

### Security
- Doctor notes endpoint: role-gated
- File download: signed URLs, expire in 15 min
- Rate limit booking creation endpoint
- PII encryption at rest for owner mobile/email (production)

---

## API Contract Reference

### Booking response (must match frontend `Booking` interface)

```typescript
interface BookingResponse {
  id: string;
  customerName: string;
  petName: string;
  petAge: string;
  petIcon: 'dog' | 'cat' | 'bird' | 'rabbit' | 'paw';
  reason: string;
  service: string;
  type: 'online' | 'home' | 'clinic';
  status: 'pending' | 'sent' | 'accepted' | 'completed' | 'cancelled';
  location: string;
  area?: string;
  lat?: number;
  lng?: number;
  scheduledDate: string;       // YYYY-MM-DD
  scheduledTime: string;       // HH:mm
  submittedAt?: string;        // ISO datetime
  createdAt: string;
  isEmergency?: boolean;
  mustReachWithinMinutes?: number;
  estimatedArrivalMinutes?: number;
  assignedDoctor?: string;
  requestedDoctorIds?: string[];
  details?: PetAppointmentForm;
  history: { time: string; label: string; done: boolean }[];
}
```

### Create booking request (minimum)

```json
{
  "owner": {
    "fullName": "Sarah Mitchell",
    "mobile": "+91 98765 43210",
    "address": "Indiranagar 100ft Road, Bangalore"
  },
  "pet": {
    "name": "Max",
    "species": "Dog",
    "breed": "Labrador Retriever",
    "ageOrDob": "3 years"
  },
  "appointment": {
    "bookingMode": "normal",
    "preferredDate": "2026-07-05",
    "preferredTime": "17:30",
    "consultationType": "Home Visit",
    "reasonForVisit": "Limping on front paw"
  }
}
```

---

## Database Schema Overview

```
owners ─────────────┐
                    ├── pets
                    │     │
                    │     └── bookings ─── booking_intake (JSONB)
                    │              │
                    │              ├── booking_history
                    │              ├── booking_doctor_requests
                    │              └── files
                    │
doctors ────────────┼── booking.assigned_doctor_id
       │            │
       └── vehicles (assigned_doctor_id)

admins ─── admin_settings
```

---

## Testing Strategy Per Room

| Room | Unit tests | Integration tests |
|------|-------------|-------------------|
| Foundation | Auth service, JWT validation | Login flow |
| Owner/Pet | Upsert logic, validation | Create owner → pet → booking chain |
| Appointment Core | Emergency detection, type mapping | POST /bookings happy path |
| Intake sections | PATCH merge into JSONB | Wizard step-by-step save |
| Booking Lifecycle | Status machine transitions | Full pending→completed flow |
| Doctor Requests | Accept/decline edge cases | Multi-doctor request scenario |
| Dispatch | Queue sort order | Assign + accept from dispatch |
| Calendar | Date bucket counts | Month query |
| Dashboard | Period aggregation | Summary endpoint |
| Transport | Status transitions | Assign vehicle |
| Live Map | Distance calculation | Markers endpoint |
| Documents | Upload validation | Upload + list |
| Settings | Defaults | PATCH + read |

---

## MVP Cut Line (Minimum to replace mock data)

If you need the **smallest usable backend** first, implement only:

1. **Phase 0** — Foundation (auth + DB)
2. **Phase 1** — Owner + Pet
3. **Phase 2** — Appointment Core (create, get, update, list)
4. **Phase 4** — Booking Lifecycle (status + history)
5. **Phase 5** — Doctor Management + Requests
6. **Phase 6** — Dispatch assign
7. **Phase 13** — Wire bookings + dashboard + dispatch

Defer to v2: Analytics charts, transport GPS, live map WebSocket, documents upload, all optional intake sections (store as empty JSON).

---

## Next Step

**Start with Phase 0 (Foundation Room).** Once auth and DB migrations are running, proceed to Room 1 (Owner) → Room 2 (Pet) → Room 3 (Appointment Core) in strict order. Everything else builds on the booking record created in Room 3.

When ready to implement, pick backend stack (Node+PostgreSQL recommended), scaffold the project alongside `vetonspot-test`, and work Room by Room checking each acceptance criteria against the existing Angular UI.
