# VetOnSpot — Full Production Plan

> **Stack:** Node.js + Express (`doobydev-api`) · Firebase Firestore (database) · Firebase Auth (email + password) · Firebase Storage (files)
>
> **Explicitly skipped:** OTP / phone verification · Razorpay or any payment gateway
>
> **Payments approach:** When a payment happens (cash, UPI, card, etc.), admin records it manually → save a document in Firestore `payments` collection. No online checkout.
>
> **Sources read:** `vetonspot-test` (Angular admin UI) · `doobydev-api` (existing Express + Firebase stub)

---

## Table of Contents

1. [Part 1 — What We Have Today](#part-1--what-we-have-today)
2. [Part 2 — What We Need First (Before Any Feature Code)](#part-2--what-we-need-first-before-any-feature-code)
3. [Part 3 — Target Architecture](#part-3--target-architecture)
4. [Part 4 — Firebase Setup Checklist](#part-4--firebase-setup-checklist)
5. [Part 5 — Firestore Collections & Document Shapes](#part-5--firestore-collections--document-shapes)
6. [Part 6 — Firestore Indexes (Required)](#part-6--firestore-indexes-required)
7. [Part 7 — Auth (Email + Password, No OTP)](#part-7--auth-email--password-no-otp)
8. [Part 8 — Payments (Record Only, No Gateway)](#part-8--payments-record-only-no-gateway)
9. [Part 9 — Express API Structure](#part-9--express-api-structure)
10. [Part 10 — Master Build Order](#part-10--master-build-order)
11. [Part 11 — Room-by-Room: Frontend + Backend](#part-11--room-by-room-frontend--backend)
12. [Part 12 — Appointment Deep Dive (Primary Feature)](#part-12--appointment-deep-dive-primary-feature)
13. [Part 13 — Seed Data & Migration from Mock](#part-13--seed-data--migration-from-mock)
14. [Part 14 — Security Rules](#part-14--security-rules)
15. [Part 15 — Deployment Checklist](#part-15--deployment-checklist)
16. [Part 16 — MVP vs Full Production](#part-16--mvp-vs-full-production)
17. [Part 17 — Is This Possible?](#part-17--is-this-possible)

---

# Part 1 — What We Have Today

## 1.1 `doobydev-api` (Backend — starting point)

| File | What it does |
|------|-------------|
| `server.js` | Express app on port **3700**, CORS, JSON body parser |
| `firebase.js` | Initializes `firebase-admin` with `serviceAccountKey.json`, exports `db` (Firestore) and `admin` |
| `package.json` | express, cors, firebase-admin, dotenv, helmet, morgan (helmet/morgan/dotenv installed but **not wired yet**) |

### Existing API routes (all on `sample` collection — placeholder only)

| Method | Route | Action |
|--------|-------|--------|
| GET | `/` | App info |
| GET | `/health` | Health check |
| POST | `/api/save` | Add doc to `sample` |
| GET | `/api/list` | List all `sample` docs |
| GET | `/api/list/:id` | Get one `sample` doc |
| PUT | `/api/update/:id` | Update `sample` doc |
| DELETE | `/api/delete/:id` | Delete `sample` doc |

### What `doobydev-api` does NOT have yet

- Authentication / authorization
- Real collections (bookings, doctors, owners, etc.)
- Validation, error handling middleware
- File upload (Firebase Storage)
- Business logic (dispatch, status machine, etc.)
- Firestore indexes
- Security rules
- Structured folder layout (routes, controllers, services)
- Payment recording
- Any connection to the Angular frontend

**Verdict:** `doobydev-api` is a **working Firebase-connected skeleton**. Extend it — do not start a second backend.

---

## 1.2 `vetonspot-test` (Frontend — complete UI, zero backend)

| Area | Status |
|------|--------|
| Admin portal UI | ✅ Complete (Dashboard, Bookings, Calendar, Doctors, Dispatch, Transport, Live Map, Settings) |
| Appointment wizards | ✅ 3 flows: Quick (9-step), Express, Full form |
| 16-section intake form | ✅ Defined in `appointment-form.model.ts` |
| Mock data | ✅ `mock-data.ts` — all CRUD in memory |
| Auth | ❌ Fake localStorage login |
| API calls | ❌ None — no HttpClient integration |
| Firebase client SDK | ❌ In package.json but unused |

### Pages that need backend

| Route | Component | Backend needed |
|-------|-----------|----------------|
| `/login` | Login | Firebase Auth email/password |
| `/dashboard` | Dashboard | Bookings stats, assign queue, doctors, vehicles |
| `/bookings` | Bookings list | Filtered booking list + search |
| `/bookings/:id` | Booking detail | Full booking + history + pet visits |
| `/calendar` | Calendar | Bookings by date |
| `/doctors` | Doctors list | Doctor CRUD |
| `/doctors/:id` | Doctor profile | Stats, requests, accept/reject |
| `/dispatch` | Dispatch | Queue, assign, multi-doctor send |
| `/transport` | Transport | Vehicle list + stats |
| `/live-map` | Live map | Markers (doctors, vehicles, bookings) |
| `/settings` | Settings | Admin profile + dispatch rules |
| `/appointments/*` | Appointment wizards | Create/update booking + intake |

---

# Part 2 — What We Need First (Before Any Feature Code)

Complete these **in order** before writing booking/doctor routes.

## Step 0 — Decisions (one-time)

| Decision | Choice for this project |
|----------|--------------------------|
| Backend repo | Extend `doobydev-api` |
| Database | Firebase Firestore |
| Auth | Firebase Auth — email + password only |
| File storage | Firebase Storage |
| Payments | Firestore record only — no Razorpay |
| OTP | **Skipped completely** |
| Frontend API base URL | `http://localhost:3700/api/v1` (dev) |

## Step 1 — Firebase Console setup

1. Create or select Firebase project (e.g. `vetonspot-prod` / `vetonspot-dev`)
2. Enable **Authentication** → Sign-in method → **Email/Password** → Enable
3. Do **NOT** enable Phone / OTP sign-in
4. Enable **Firestore Database** → Start in **production mode** (we add rules later)
5. Enable **Storage** → default bucket
6. Register a **Web app** in Firebase Console (for Angular client config)

## Step 2 — Service account (backend)

1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key → save as `doobydev-api/serviceAccountKey.json`
3. **Never commit this file** — add to `.gitignore`
4. `firebase.js` already loads it — no change needed to init pattern

## Step 3 — Environment variables

Create `doobydev-api/.env`:

```env
PORT=3700
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200

# Firebase (optional if using serviceAccountKey.json file)
# FIREBASE_PROJECT_ID=your-project-id

# Counter doc for booking IDs (optional path override)
FIRESTORE_COUNTERS_COLLECTION=_counters
```

Create `vetonspot-test/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3700/api/v1',
  firebase: {
    apiKey: '...',
    authDomain: '....firebaseapp.com',
    projectId: '...',
    storageBucket: '....appspot.com',
    messagingSenderId: '...',
    appId: '...',
  },
};
```

## Step 4 — Restructure `doobydev-api` folders

```
doobydev-api/
├── firebase.js                  # keep as-is
├── server.js                    # slim entry — mount routes only
├── .env
├── serviceAccountKey.json       # gitignored
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.js       # verify Firebase ID token
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── bookings.routes.js
│   │   ├── owners.routes.js
│   │   ├── pets.routes.js
│   │   ├── doctors.routes.js
│   │   ├── dispatch.routes.js
│   │   ├── vehicles.routes.js
│   │   ├── payments.routes.js
│   │   ├── files.routes.js
│   │   ├── dashboard.routes.js
│   │   └── settings.routes.js
│   ├── services/
│   │   ├── booking.service.js
│   │   ├── doctor.service.js
│   │   ├── counter.service.js       # BK-1043 ID generation
│   │   └── geo.service.js
│   └── utils/
│       ├── response.js
│       └── booking-mapper.js          # Firestore doc → frontend Booking shape
└── scripts/
    └── seed.js                        # seed doctors, areas from mock-data
```

## Step 5 — Wire middleware in `server.js`

- [ ] `require('dotenv').config()`
- [ ] `helmet()`
- [ ] `cors({ origin: process.env.CORS_ORIGIN })`
- [ ] `morgan('dev')`
- [ ] Mount `/api/v1/*` routes
- [ ] Global error handler
- [ ] Remove or deprecate `/api/save`, `/api/list` sample routes after real routes exist

## Step 6 — Angular HTTP setup

- [ ] Add `provideHttpClient()` in `app.config.ts`
- [ ] Create `auth.interceptor.ts` — attach Firebase ID token to every API request
- [ ] Create `environment.ts` with `apiUrl` + Firebase client config

## Step 7 — Firestore indexes

Deploy indexes from Part 6 **before** testing filtered queries (Firestore will error without them).

## Step 8 — First admin user

1. Firebase Console → Authentication → Add user manually (email + password)
2. Firestore `admins/{uid}` doc:

```json
{
  "email": "admin@vetonspot.com",
  "fullName": "Admin User",
  "role": "admin",
  "createdAt": "<timestamp>"
}
```

No OTP step — user signs in with email + password directly.

---

# Part 3 — Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    vetonspot-test (Angular)                  │
│  Login → Firebase Auth (email/password) → ID Token          │
│  All pages → HttpClient → Express API + Bearer token        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST /api/v1
┌──────────────────────────▼──────────────────────────────────┐
│                    doobydev-api (Express)                    │
│  auth.middleware → verifyIdToken()                           │
│  routes → services → Firestore reads/writes                  │
│  files → Firebase Storage upload                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  Firebase Auth      Firestore DB      Firebase Storage
  (users)            (all data)        (documents/photos)
```

### Data flow for appointment booking

```
1. Admin fills wizard (Angular) → PetAppointmentForm in memory
2. Submit → POST /api/v1/bookings
3. Express validates → upsert owner + pet → create booking doc + intake subdoc
4. Firestore stores booking → returns Booking shape
5. Angular updates list / navigates to dashboard
6. Optional: POST /api/v1/payments if fee collected at booking time
```

---

# Part 4 — Firebase Setup Checklist

## 4.1 Firebase Console — full checklist

| # | Task | Where | Done? |
|---|------|-------|-------|
| 1 | Create Firebase project | Console | ☐ |
| 2 | Enable Email/Password auth | Authentication → Sign-in | ☐ |
| 3 | Disable Phone auth (OTP) | Authentication → Sign-in | ☐ |
| 4 | Create Firestore database | Firestore → Create | ☐ |
| 5 | Create Storage bucket | Storage → Get started | ☐ |
| 6 | Download service account key | Project Settings → Service Accounts | ☐ |
| 7 | Register web app | Project Settings → Your apps | ☐ |
| 8 | Copy web app config to Angular environment | `environment.ts` | ☐ |
| 9 | Deploy Firestore indexes | Part 6 below | ☐ |
| 10 | Deploy Firestore security rules | Part 14 below | ☐ |
| 11 | Deploy Storage security rules | Part 14 below | ☐ |
| 12 | Create first admin user | Authentication → Users | ☐ |

## 4.2 Keys & secrets summary

| Key / file | Used by | Purpose |
|------------|---------|---------|
| `serviceAccountKey.json` | Express (`firebase-admin`) | Server-side Firestore + Storage + Auth admin |
| Web `apiKey` | Angular (`firebase` client) | Client-side Firebase Auth |
| `projectId` | Both | Firestore namespace |
| `storageBucket` | Both | File uploads |
| Firebase ID Token (runtime) | Angular → Express header | `Authorization: Bearer <token>` |

**Important:** The web `apiKey` is not a secret (it's public in Angular). Real security comes from Firebase Auth tokens + Firestore rules + Express auth middleware.

## 4.3 Angular Firebase client packages (already in package.json)

```bash
# Already installed in vetonspot-test
firebase  # v12.17.0
```

Initialize in Angular:

```typescript
// app.config.ts or dedicated firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from './environments/environment';

const app = initializeApp(environment.firebase);
export const auth = getAuth(app);
```

---

# Part 5 — Firestore Collections & Document Shapes

## Collection map

```
/admins/{uid}
/owners/{ownerId}
/owners/{ownerId}/pets/{petId}
/bookings/{bookingId}
/bookings/{bookingId}/history/{historyId}
/bookings/{bookingId}/doctorRequests/{requestId}
/doctors/{doctorId}
/vehicles/{vehicleId}
/payments/{paymentId}
/settings/global
/areas/{areaId}                          # Bangalore areas for geo
/_counters/bookings                      # atomic ID counter
/files/{fileId}                          # metadata; binary in Storage
```

## 5.1 `bookings/{bookingId}` — main document

```javascript
{
  // Display ID (matches frontend)
  displayId: "BK-1043",

  // References
  ownerId: "abc123",
  petId: "def456",

  // Summary (denormalized for list views — avoids joins)
  customerName: "Sarah Mitchell",
  petName: "Max",
  petAge: "3 years",
  petIcon: "dog",                        // dog|cat|bird|rabbit|paw
  reason: "Limping on front paw",
  service: "Home Visit",
  type: "home",                          // online|home|clinic
  status: "pending",                     // pending|sent|accepted|completed|cancelled

  // Schedule
  scheduledDate: "2026-07-05",           // YYYY-MM-DD
  scheduledTime: "17:30",                // HH:mm
  submittedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Location
  location: "Indiranagar 100ft Road, Bangalore",
  area: "Indiranagar",
  lat: 12.9784,
  lng: 77.6408,

  // Emergency
  isEmergency: false,
  mustReachWithinMinutes: null,        // 60 when emergency
  estimatedArrivalMinutes: null,

  // Doctor assignment
  assignedDoctorId: null,
  assignedDoctorName: null,
  requestedDoctorIds: [],

  // Full intake form (entire PetAppointmentForm — all 16 sections)
  details: { /* PetAppointmentForm object */ },

  // Payment link (optional)
  paymentId: null,
  paymentStatus: "unpaid"              // unpaid|paid|partial|waived
}
```

## 5.2 `bookings/{bookingId}/history/{historyId}`

```javascript
{
  time: "10:49",           // display label
  label: "Booking created",
  done: true,
  createdAt: Timestamp
}
```

## 5.3 `owners/{ownerId}`

```javascript
{
  fullName: "Sarah Mitchell",
  mobile: "+91 9876543210",
  email: "sarah@email.com",
  address: "Indiranagar 100ft Road, Bangalore",
  emergencyContact: "Raj Sharma",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 5.4 `owners/{ownerId}/pets/{petId}`

```javascript
{
  name: "Max",
  species: "Dog",
  breed: "Labrador Retriever",
  gender: "Male",
  ageOrDob: "3 years",
  weight: "32 kg",
  colorMarks: "Golden",
  microchip: "",
  neutered: "Yes",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 5.5 `doctors/{doctorId}`

```javascript
{
  displayId: "DR-01",
  name: "Dr. Anita Rao",
  initials: "AR",
  specialty: "General Practice",
  status: "available",                   // available|on-visit|offline
  location: "Marathahalli, Bangalore",
  area: "Marathahalli",
  lat: 12.9591,
  lng: 77.6974,
  mobile: "",
  email: "",
  rating: 4.9,
  visitsToday: 6,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 5.6 `vehicles/{vehicleId}`

```javascript
{
  displayId: "VH-01",
  driver: "Raj Patel",
  assignedDoctorId: "DR-01",
  assignedDoctorName: "Dr. Anita Rao",
  status: "on-trip",                     // available|on-trip|maintenance|unavailable
  area: "Marathahalli",
  lat: 12.957,
  lng: 77.692,
  ridesToday: 5,
  kmToday: 42,
  fuelPercent: 68,
  updatedAt: Timestamp
}
```

## 5.7 `payments/{paymentId}` — no gateway, record only

```javascript
{
  bookingId: "BK-1043",
  bookingDisplayId: "BK-1043",
  ownerId: "abc123",
  amount: 1500,
  currency: "INR",
  method: "cash",                        // cash|upi|card|bank_transfer|other
  status: "paid",                        // paid|partial|refunded|waived
  referenceNote: "Paid at clinic counter",  // UPI ref, receipt no, etc.
  recordedBy: "adminUid",
  paidAt: Timestamp,
  createdAt: Timestamp
}
```

## 5.8 `settings/global`

```javascript
{
  dispatchRadiusKm: 5,
  requestTimeoutMinutes: 10,
  maxDoctorsPerRequest: 3,
  lowFuelThresholdPct: 20,
  maintenanceReminderKm: 5000,
  notifyNewBooking: true,
  notifyDispatchTimeout: true,
  notifyLowFuel: true,
  updatedAt: Timestamp
}
```

---

# Part 6 — Firestore Indexes (Required)

Create `doobydev-api/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "isEmergency", "order": "DESCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "scheduledDate", "order": "ASCENDING" },
        { "fieldPath": "scheduledTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedDoctorId", "order": "ASCENDING" },
        { "fieldPath": "scheduledDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "petId", "order": "ASCENDING" },
        { "fieldPath": "scheduledDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isEmergency", "order": "DESCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "owners",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mobile", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "payments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "bookingId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy:

```bash
firebase deploy --only firestore:indexes
```

> Firestore will also prompt you with index-creation links in the console when a query fails — copy those into this file as you build.

---

# Part 7 — Auth (Email + Password, No OTP)

## Flow

```
Register (one-time setup):
  Firebase Console OR POST /api/v1/auth/register (admin only)
  → create Firebase Auth user (email + password)
  → create Firestore admins/{uid} doc

Login (every session):
  Angular → signInWithEmailAndPassword(auth, email, password)
  → getIdToken()
  → store token in memory
  → all API calls: Authorization: Bearer <token>

Express middleware:
  admin.auth().verifyIdToken(token)
  → req.user = { uid, email }
  → check admins/{uid} exists
```

## Backend routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Admin only (first setup: open) | Create admin user |
| POST | `/api/v1/auth/login` | Public | Optional server-side login (or use client-only Firebase Auth) |
| GET | `/api/v1/auth/me` | Required | Return admin profile from Firestore |

## Frontend changes

| File | Change |
|------|--------|
| `auth.service.ts` | Replace localStorage with Firebase `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged` |
| `auth.guard.ts` | Check Firebase auth state + valid token |
| `login.component.ts` | Keep email + password form — wire to Firebase Auth |
| New `auth.interceptor.ts` | Attach token to HttpClient requests |

## Explicitly NOT building

- Phone OTP verification
- SMS OTP
- Email verification link requirement (optional — can enable later in Firebase Console)
- Forgot password UI (Firebase `sendPasswordResetEmail` can be added later — one line)

---

# Part 8 — Payments (Record Only, No Gateway)

## Rule

**No Razorpay. No Stripe. No payment gateway integration.**

When money is collected (at clinic, on visit, UPI to clinic account, etc.), admin records it in the system.

## When to save a payment

| Trigger | Who | Action |
|---------|-----|--------|
| Admin marks booking as paid | Admin on booking detail | POST `/api/v1/payments` |
| Fee collected during appointment create | Admin on wizard submit | POST `/api/v1/payments` after booking create |
| Partial payment | Admin | POST with `status: "partial"` + amount |

## Backend routes

| Method | Path | Body | Action |
|--------|------|------|--------|
| POST | `/api/v1/payments` | `{ bookingId, amount, method, referenceNote?, status? }` | Create payment doc |
| GET | `/api/v1/payments?bookingId=` | — | List payments for booking |
| GET | `/api/v1/payments/:id` | — | Get one payment |
| PATCH | `/api/v1/payments/:id` | `{ status, referenceNote }` | Update (e.g. mark refunded) |

## Side effects on booking

When payment saved with `status: "paid"`:

```javascript
await bookingRef.update({
  paymentId: paymentDoc.id,
  paymentStatus: "paid",
  updatedAt: FieldValue.serverTimestamp()
});
// Append history entry: "Payment recorded — ₹1500 (cash)"
```

## Frontend (future UI — not in mock yet)

Add to booking detail page:
- "Record Payment" button → modal with amount, method, note
- Payment status badge on booking list

---

# Part 9 — Express API Structure

Base URL: `http://localhost:3700/api/v1`

## Complete route map

### Auth
```
POST   /auth/register
GET    /auth/me
```

### Owners & Pets
```
POST   /owners
GET    /owners/:id
PATCH  /owners/:id
GET    /owners?mobile=
POST   /owners/:ownerId/pets
GET    /owners/:ownerId/pets
GET    /pets/:ownerId/:petId
PATCH  /pets/:ownerId/:petId
GET    /pets/:ownerId/:petId/visit-history
GET    /pets/:ownerId/:petId/medication-history
```

### Bookings (Appointments)
```
POST   /bookings                          # create
GET    /bookings                          # list + filters
GET    /bookings/:id                      # detail + history
PATCH  /bookings/:id                      # update / draft save
PATCH  /bookings/:id/intake               # partial intake update
POST   /bookings/:id/finalize             # submit
POST   /bookings/:id/cancel               # cancel
POST   /bookings/:id/complete             # mark completed
GET    /bookings/calendar?month=2026-07   # calendar view
```

### Booking lifecycle / dispatch
```
GET    /dispatch/queue
POST   /bookings/:id/assign               # single doctor
POST   /bookings/:id/dispatch             # multi doctor { doctorIds[] }
POST   /bookings/:id/admin-accept         # admin accepts for doctor
POST   /bookings/:id/accept               # doctor accepts
POST   /bookings/:id/decline              # doctor declines
GET    /dispatch/suggestions/:bookingId   # nearby doctors + distance
```

### Doctors
```
GET    /doctors
POST   /doctors
GET    /doctors/:id
PATCH  /doctors/:id
PATCH  /doctors/:id/availability
GET    /doctors/:id/stats?period=today
GET    /doctors/:id/bookings?period=today
GET    /doctors/:id/requests
```

### Vehicles
```
GET    /vehicles
GET    /vehicles/summary
PATCH  /vehicles/:id/status
POST   /vehicles/:id/assign
```

### Map
```
GET    /map/markers?layers=doctors,vehicles,customers
GET    /map/distances/:bookingId
PATCH  /doctors/:id/location
PATCH  /vehicles/:id/location
```

### Files
```
POST   /bookings/:id/files                # multipart upload → Storage
GET    /bookings/:id/files
DELETE /files/:id
```

### Payments
```
POST   /payments
GET    /payments?bookingId=
GET    /payments/:id
PATCH  /payments/:id
```

### Dashboard
```
GET    /dashboard/summary?period=today
GET    /dashboard/chart?period=weekly
GET    /dashboard/assign-queue?limit=10
GET    /dashboard/today-appointments?limit=8
```

### Settings
```
GET    /settings
PATCH  /settings/profile
PATCH  /settings/dispatch
PATCH  /settings/notifications
PATCH  /settings/transport
```

---

# Part 10 — Master Build Order

Build in this exact sequence. Each step unlocks the next.

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE A — SETUP (Part 2)                                     │
│ Firebase project · service account · env · folder structure  │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE B — AUTH                                               │
│ Firebase Auth email/password · auth middleware · login UI    │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE C — OWNERS + PETS                                      │
│ Firestore collections · upsert by mobile · pet subcollection │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE D — APPOINTMENTS (CORE)          ← PRIMARY MILESTONE   │
│ Create · update · list · get · intake JSON · ID counter      │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE E — BOOKING LIFECYCLE                                    │
│ Status machine · history subcollection · cancel · complete   │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE F — DOCTORS                                            │
│ CRUD · availability · stats · requests                       │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE G — DISPATCH                                           │
│ Queue · assign · multi-send · accept/decline                 │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE H — BOOKINGS UI WIRING                                 │
│ Bookings list · detail · calendar · appointment wizards      │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE I — DASHBOARD + DOCTORS UI                             │
│ Dashboard stats · doctor profile · assign popup              │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE J — TRANSPORT + LIVE MAP                               │
│ Vehicles · map markers · geo distances                       │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE K — FILES + PAYMENTS                                   │
│ Storage uploads · payment recording                          │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE L — SETTINGS + POLISH                                  │
│ Settings API · seed script · security rules · deploy         │
└─────────────────────────────────────────────────────────────┘
```

---

# Part 11 — Room-by-Room: Frontend + Backend

For each room: what exists in UI, what to build in Express, what to change in Angular.

---

## Room 0 — Foundation

| Layer | Work |
|-------|------|
| **Backend** | Restructure `doobydev-api`, wire helmet/cors/morgan/dotenv, error middleware, response helper |
| **Frontend** | `provideHttpClient`, `environment.ts`, Firebase init |
| **Firebase** | Project, Firestore, Storage, service account, indexes file |
| **Done when** | `GET /health` works, Angular can reach API, Firebase Auth login works |

---

## Room 1 — Auth

| Layer | Work |
|-------|------|
| **Backend** | `auth.middleware.js`, `GET /auth/me`, optional `POST /auth/register` |
| **Frontend** | Rewrite `auth.service.ts` with Firebase Auth, update `auth.guard.ts`, auth interceptor |
| **Firebase** | Enable email/password, create first admin user |
| **Done when** | Login persists across refresh, protected routes redirect to login, API returns 401 without token |

---

## Room 2 — Owner

| Layer | Work |
|-------|------|
| **Backend** | `owners` collection CRUD, lookup by mobile, upsert helper |
| **Frontend** | No UI change — owner fields already in appointment wizards |
| **Done when** | POST owner + GET by mobile works |

---

## Room 3 — Pet

| Layer | Work |
|-------|------|
| **Backend** | `owners/{id}/pets` subcollection, visit-history query across bookings |
| **Frontend** | No UI change — pet fields in wizards; booking detail shows visit history |
| **Done when** | Pet linked to owner, visit history returns past bookings |

---

## Room 4 — Appointment Core (Booking Create)

| Layer | Work |
|-------|------|
| **Backend** | `POST /bookings`, `PATCH /bookings/:id`, counter service for BK-XXXX IDs, store full `details` JSON |
| **Frontend** | `booking-api.service.ts`, update `appointment.service.ts` to call API instead of mock |
| **Done when** | Quick-add wizard submit creates real Firestore booking |

---

## Rooms 5–18 — Intake Sections

All stored inside `bookings.details` JSON. Optional `PATCH /bookings/:id/intake` with section key.

| Room | Section | Backend | Frontend |
|------|---------|---------|----------|
| 5 | health | Merge into `details.health` | Already in wizard step 5 |
| 6 | pastMedical | `details.pastMedical` | Wizard step 6 |
| 7 | vaccination | `details.vaccination` | Wizard accordion |
| 8 | deworming | `details.deworming` | Wizard accordion |
| 9 | tickFlea | `details.tickFlea` | Wizard accordion |
| 10 | medications | `details.medications` | Wizard accordion |
| 11 | allergies | `details.allergies` | Wizard accordion |
| 12 | diet | `details.diet` | Wizard accordion |
| 13 | lifestyle | `details.lifestyle` | Wizard accordion |
| 14 | reproductive | `details.reproductive` | Wizard accordion |
| 15 | emergency | `details.emergency` + `isEmergency` flag | Step 1 + express mode |
| 16 | documents | `details.documents` + Storage URLs | Step 8 + file inputs |
| 17 | doctorNotes | `details.doctorNotes` | Full form + post-visit |
| 18 | appointment meta | `details.appointment` | Step 4 |

**Strategy:** Store entire `PetAppointmentForm` as `details` on every save. No need for 16 separate Firestore collections — one JSON field is enough for Firebase.

---

## Room 19 — Booking Lifecycle

| Layer | Work |
|-------|------|
| **Backend** | Status transitions, `history` subcollection, cancel/complete endpoints, list filters |
| **Frontend** | `bookings.component.ts` → API list; add Cancel button on detail page |
| **Done when** | Status filters work, history timeline shows real events, data survives refresh |

---

## Room 20 — Doctors

| Layer | Work |
|-------|------|
| **Backend** | `doctors` CRUD, availability patch, period stats queries |
| **Frontend** | `doctors.component.ts` + `doctor-profile.component.ts` → API |
| **Done when** | Add doctor form saves to Firestore, profile tabs show real data |

---

## Room 21 — Doctor Requests

| Layer | Work |
|-------|------|
| **Backend** | accept/decline endpoints, `doctorRequests` subcollection or `requestedDoctorIds` array |
| **Frontend** | Doctor profile Requests tab → API accept/reject |
| **Done when** | Accept moves booking to `accepted`, decline removes doctor from request list |

---

## Room 22 — Dispatch

| Layer | Work |
|-------|------|
| **Backend** | `/dispatch/queue`, assign, multi-dispatch, suggestions with geo |
| **Frontend** | `dispatch.component.ts` + dashboard assign popup → API |
| **Done when** | Send request updates booking status to `sent`, queue refreshes from Firestore |

---

## Room 23 — Calendar & Bookings Views

| Layer | Work |
|-------|------|
| **Backend** | `/bookings/calendar`, filtered list, detail with previous visits |
| **Frontend** | `calendar.component.ts`, `booking-detail.component.ts` → API |
| **Done when** | Calendar dots match real booking counts per day |

---

## Room 24 — Dashboard

| Layer | Work |
|-------|------|
| **Backend** | `/dashboard/*` aggregation endpoints |
| **Frontend** | `dashboard.component.ts` → API (replace in-memory BOOKINGS filtering) |
| **Done when** | Stats cards and assign table load from API |

---

## Room 25 — Transport

| Layer | Work |
|-------|------|
| **Backend** | `vehicles` CRUD + summary |
| **Frontend** | `transport.component.ts` → API |
| **Done when** | Vehicle table loads from Firestore |

---

## Room 26 — Live Map

| Layer | Work |
|-------|------|
| **Backend** | `/map/markers`, `/map/distances/:bookingId`, location patch endpoints |
| **Frontend** | `live-map.component.ts` → API |
| **Done when** | Map markers from Firestore, distance/ETA calculated server-side or client-side |

---

## Room 27 — Files & Documents

| Layer | Work |
|-------|------|
| **Backend** | Multer + Firebase Storage upload, save URLs in `details.documents` |
| **Frontend** | Wire `onProblemMedia()`, `onDocumentFiles()` to upload API |
| **Done when** | Uploaded file URLs stored in booking, not just filenames |

---

## Room 28 — Payments

| Layer | Work |
|-------|------|
| **Backend** | `payments` collection, link to booking |
| **Frontend** | Add "Record Payment" UI on booking detail (new — not in mock) |
| **Done when** | Payment doc saved in Firestore, booking shows `paymentStatus: paid` |

---

## Room 29 — Settings

| Layer | Work |
|-------|------|
| **Backend** | `settings/global` doc, PATCH endpoints |
| **Frontend** | `settings.component.ts` → API |
| **Done when** | Dispatch radius saved and used by suggestions endpoint |

---

# Part 12 — Appointment Deep Dive (Primary Feature)

This is the most important flow. Build backend and frontend together in these sub-steps.

## Step 12.1 — Backend: booking counter

```javascript
// counter.service.js — atomic transaction
async function nextBookingId() {
  const ref = db.collection('_counters').doc('bookings');
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const next = (doc.data()?.value ?? 1040) + 1;
    tx.set(ref, { value: next }, { merge: true });
    return `BK-${next}`;
  });
}
```

## Step 12.2 — Backend: create booking service

```
createBooking(form: PetAppointmentForm):
  1. Validate (normal vs emergency rules from appointment-form.model.ts)
  2. upsertOwner(form.owner) → ownerId
  3. upsertPet(ownerId, form.pet) → petId
  4. displayId = nextBookingId()
  5. Derive: type, isEmergency, service, location, lat/lng
  6. Write bookings/{autoId} with details = form
  7. Write history: "Booking created"
  8. Return mapped Booking response
```

## Step 12.3 — Backend: update booking service

```
updateBooking(id, form):
  1. Load existing booking
  2. Update owner + pet if changed
  3. Merge details JSON
  4. Recompute isEmergency, type, summary fields
  5. updatedAt = now
  6. Return mapped Booking
```

## Step 12.4 — Backend: booking mapper

Map Firestore doc → frontend `Booking` interface (exact shape from `mock-data.ts`):

```javascript
function toBookingResponse(doc, historyDocs) {
  const d = doc.data();
  return {
    id: d.displayId,
    customerName: d.customerName,
    petName: d.petName,
    // ... all fields matching mock-data Booking interface
    details: d.details,
    history: historyDocs.map(h => h.data())
  };
}
```

## Step 12.5 — Frontend: booking API service

Create `vetonspot-test/src/app/services/booking-api.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private base = `${environment.apiUrl}/bookings`;

  create(form: PetAppointmentForm): Observable<Booking> { ... }
  update(id: string, form: PetAppointmentForm): Observable<Booking> { ... }
  getById(id: string): Observable<Booking> { ... }
  list(params: BookingListParams): Observable<Booking[]> { ... }
  cancel(id: string): Observable<Booking> { ... }
  finalize(id: string, form: PetAppointmentForm): Observable<Booking> { ... }
}
```

## Step 12.6 — Frontend: update appointment.service.ts

Replace mock calls:

| Current (mock) | Replace with |
|----------------|-------------|
| `createBookingFromForm(form)` | `bookingApi.create(form)` |
| `updateBookingFromForm(id, form)` | `bookingApi.update(id, form)` |
| `getBookings()` | `bookingApi.list()` |
| `BOOKINGS.find(...)` on edit | `bookingApi.getById(id)` |

Keep signals (`form`, `editingBookingId`, `bookingsVersion`) — only change the data source.

## Step 12.7 — Frontend: wire each wizard

| Component | Submit action | API call |
|-----------|--------------|----------|
| `QuickAddAppointmentComponent` | Final step submit | `POST /bookings` |
| `ExpressAddAppointmentComponent` | Submit button | `POST /bookings` (emergency validation) |
| `AddAppointmentComponent` | Save / Submit buttons | `PATCH /bookings/:id` or `POST /bookings` |
| Edit route `/appointments/edit/:id` | Load on init | `GET /bookings/:id` → `bookingToForm()` |

## Step 12.8 — Validation parity

Copy validation rules from `appointment-form.model.ts` to backend:

- `validateAppointmentForm()` → normal mode
- `validateEmergencyAppointmentForm()` → emergency mode

Backend must reject invalid submits with `422` and `{ errors: string[] }` — same messages as frontend.

## Step 12.9 — Appointment completion checklist

- [ ] Create normal booking from quick wizard → appears in Firestore
- [ ] Create emergency booking from express wizard → `isEmergency: true`
- [ ] Edit booking → updates Firestore, same displayId
- [ ] Bookings list loads from API with status filters
- [ ] Booking detail shows full `details` + history
- [ ] Page refresh does not lose data
- [ ] Pet visit history shows previous bookings for same owner+pet

---

# Part 13 — Seed Data & Migration from Mock

Run once after Firestore collections exist.

## `scripts/seed.js` should insert:

| Collection | Source | Count |
|------------|--------|-------|
| `doctors` | `DOCTORS` from mock-data.ts | 6 doctors |
| `areas` | `BANGALORE_AREAS` from bangalore-map.ts | ~15 areas |
| `vehicles` | `VEHICLES` from mock-data.ts | 6 vehicles |
| `settings/global` | Default dispatch settings | 1 doc |
| `bookings` (optional) | Sample from `BOOKINGS` | 5–10 for demo |

## Counter initialization

```javascript
await db.collection('_counters').doc('bookings').set({ value: 1043 });
await db.collection('_counters').doc('doctors').set({ value: 6 });
await db.collection('_counters').doc('vehicles').set({ value: 6 });
```

---

# Part 14 — Security Rules

## Firestore rules (production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /admins/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if false;  // admin docs created by server only
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

> All Firestore access goes through Express (admin SDK bypasses rules). Rules protect against direct client Firestore access if you add it later.

## Storage rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /bookings/{bookingId}/{fileName} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

# Part 15 — Deployment Checklist

| # | Task |
|---|------|
| 1 | Deploy Express to Railway / Render / VPS / Cloud Run |
| 2 | Set env vars on host (no serviceAccountKey in repo — use env JSON or secret manager) |
| 3 | Deploy Firestore indexes |
| 4 | Deploy Firestore + Storage rules |
| 5 | Build Angular: `ng build --configuration production` |
| 6 | Host Angular on Firebase Hosting / Netlify / VPS |
| 7 | Update `CORS_ORIGIN` to production Angular URL |
| 8 | Update Angular `environment.prod.ts` with production API URL |
| 9 | Create production admin user in Firebase Auth |
| 10 | Run seed script on production Firestore (doctors + areas only, not test bookings) |

---

# Part 16 — MVP vs Full Production

## MVP (minimum to go live with appointments)

| Phase | Include |
|-------|---------|
| A | Setup |
| B | Auth |
| C | Owners + Pets |
| D | Appointments CRUD |
| E | Booking lifecycle (list, status, history) |
| F | Doctors list (read-only seed data OK) |
| H | Wire bookings + appointment wizards |

**Skip for MVP:** Dispatch, dashboard charts, transport, live map, files upload, payments UI, settings

## Full production (complete admin portal)

All phases A through L — every room wired to Firestore.

---

# Part 17 — Is This Possible?

## Yes — this is absolutely possible.

Here is why, based on what already exists:

| Factor | Assessment |
|--------|------------|
| **Frontend** | ✅ 100% built — UI, forms, validation, all pages ready. Only needs HttpClient wiring. |
| **Backend skeleton** | ✅ `doobydev-api` already runs Express + Firebase Admin + Firestore connected. |
| **Database choice (Firebase)** | ✅ Fits this app — document model matches nested `PetAppointmentForm`, no complex SQL joins needed. |
| **Auth without OTP** | ✅ Firebase Auth email/password is built-in — zero custom auth code needed. |
| **Payments without Razorpay** | ✅ Simple Firestore `payments` collection — no gateway complexity. |
| **Team backend experience** | ✅ Minimal backend needed — CRUD + status machine. No microservices required. |
| **Existing plan** | ✅ `PLAN.MD` room structure maps 1:1 to this Firebase plan — same features, different storage. |

## Realistic timeline estimate

| Scope | Estimate (1 developer) |
|-------|----------------------|
| Setup + Auth | 2–3 days |
| Owners + Pets + Booking CRUD | 4–5 days |
| Booking lifecycle + list/detail UI | 3–4 days |
| Doctors + Dispatch | 4–5 days |
| Dashboard + Calendar | 3–4 days |
| Transport + Map + Files + Payments | 4–5 days |
| Testing + deploy | 3–4 days |
| **MVP (appointments working)** | **~2 weeks** |
| **Full production** | **~5–6 weeks** |

## Risks to watch

| Risk | Mitigation |
|------|------------|
| Firestore query limits (no full-text search) | Denormalize search fields on booking doc; filter client-side for MVP |
| No SQL joins | Denormalize `customerName`, `petName`, `assignedDoctorName` on booking doc (already planned) |
| Dashboard analytics on Firestore | Pre-aggregate in Express or use multiple queries + merge in service layer |
| File uploads | Use Firebase Storage — already in Firebase project setup |
| `serviceAccountKey.json` security | Gitignore + use secret manager in production |

## Final answer

**Yes — you can make this a fully productive VetOnSpot admin application** using:

- **Node.js + Express** (`doobydev-api` — extend, don't restart)
- **Firebase Firestore** as the only database
- **Firebase Auth** with email + password (no OTP)
- **Firebase Storage** for documents
- **Manual payment records** in Firestore (no Razorpay)

The frontend is already done. The backend skeleton is already connected to Firebase. The remaining work is systematic: follow the phase order in Part 10, start with Part 2 setup checklist, then Auth, then Appointments (Part 12).

**Start here:** Complete Part 2 (Firebase setup + folder structure) → Part 7 (Auth) → Part 12 (Appointments).
