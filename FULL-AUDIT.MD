# VetOnSpot Admin Frontend — Full Integration Audit

> **Scope:** `vetonspot-test` Angular admin portal  
> **Auditor perspective:** Senior architect — page-by-page API mapping, integration gaps, and build order  
> **Date:** August 2026  
> **Backend target:** `https://api.doobydev.com/api/v1` (Express + Firebase Firestore)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Architecture](#2-application-architecture)
3. [Integration Status Matrix](#3-integration-status-matrix)
4. [Cross-Cutting Concerns](#4-cross-cutting-concerns)
5. [Shared Services — Current vs Required](#5-shared-services--current-vs-required)
6. [Page-by-Page Audit](#6-page-by-page-audit)
7. [Appointment Wizards — Deep Audit](#7-appointment-wizards--deep-audit)
8. [Shared Components Audit](#8-shared-components-audit)
9. [Data Models & API Contracts](#9-data-models--api-contracts)
10. [Master API Catalog (All Endpoints)](#10-master-api-catalog-all-endpoints)
11. [Frontend Services To Create](#11-frontend-services-to-create)
12. [Gaps, Risks & Technical Debt](#12-gaps-risks--technical-debt)
13. [Recommended Wiring Order](#13-recommended-wiring-order)

---

## 1. Executive Summary

### What exists

| Layer | Status |
|-------|--------|
| **UI / UX** | ~95% complete — 14 routes, 3 appointment wizards, full admin shell |
| **Client routing & guards** | Complete |
| **Firebase Auth (login/logout)** | Wired — `AuthService`, guards, interceptor |
| **HttpClient + auth interceptor** | Wired — token attached to all API calls |
| **Business data (bookings, doctors, etc.)** | **0% API** — 100% in-memory `mock-data.ts` |
| **File uploads** | UI only — stores filenames locally, no Storage API |
| **Settings / header profile** | Static hardcoded values |
| **Payments** | Not in UI yet |

### Bottom line

The frontend is a **complete prototype** running on **`mock-data.ts`**. Firebase auth is the only live integration. Every operational page needs a corresponding API service and mock-data removal.

**Estimated integration effort:** 11 API domains · **54 REST endpoints total** · 14 pages · 3 wizards · 5 shared components

### API endpoint totals

| Scope | Count | Notes |
|-------|------:|-------|
| **Total REST endpoints needed** | **54** | Full frontend integration (all pages + wizards + settings) |
| MVP — core operations | **43** | Bookings, doctors, dispatch, dashboard, calendar, settings |
| Future / optional | **11** | Payments, file delete, GPS track, live location, owner lookup, vehicle assign |
| Already exists on backend | **1** | `GET /auth/me` (skeleton only — rest not built) |
| **Still to build on backend** | **53** | Remaining endpoints |

#### By HTTP method

| Method | Count |
|--------|------:|
| GET | 30 |
| POST | 13 |
| PATCH | 10 |
| DELETE | 1 |
| **Total** | **54** |

#### By domain

| Domain | Endpoints |
|--------|----------:|
| Auth | 1 |
| Bookings | 10 |
| Dispatch & booking lifecycle | 7 |
| Owners & pets | 3 |
| Doctors | 7 |
| Vehicles | 5 |
| Map & geo | 4 |
| Dashboard | 7 |
| Files | 3 |
| Payments | 2 |
| Settings | 5 |
| **Total** | **54** |

---

## 2. Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  vetonspot-test (Angular 22 · standalone components · signals)   │
├─────────────────────────────────────────────────────────────────┤
│  Routes (app.routes.ts)                                          │
│    ├── Public: login, logout                                     │
│    └── Protected (authGuard): AdminLayoutComponent               │
│          ├── dashboard, bookings, calendar, doctors, dispatch    │
│          ├── transport, live-map, settings                       │
│          └── appointments/* (express, quick, new, edit)          │
├─────────────────────────────────────────────────────────────────┤
│  Services                                                        │
│    ├── AuthService          ✅ Firebase Auth                     │
│    ├── AppointmentService   ❌ mock-data (form state + CRUD)     │
│    └── (missing) booking-api, doctor-api, dispatch-api, etc.   │
├─────────────────────────────────────────────────────────────────┤
│  Data layer                                                      │
│    ├── mock-data.ts         ❌ BOOKINGS, DOCTORS, VEHICLES       │
│    ├── appointment-form.model.ts  ✅ form types + validation     │
│    ├── map-markers.ts       ❌ geo helpers over mock data        │
│    └── bangalore-map.ts     ✅ static area coordinates           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              https://api.doobydev.com/api/v1  (+ Firebase Auth token)
```

### Route map

| Route | Component | Guard | Data source today |
|-------|-----------|-------|-------------------|
| `/login` | LoginComponent | guestGuard | Firebase Auth |
| `/logout` | LogoutComponent | none | Firebase Auth |
| `/dashboard` | DashboardComponent | authGuard | mock-data |
| `/bookings` | BookingsComponent | authGuard | mock-data |
| `/bookings/:id` | BookingDetailComponent | authGuard | mock-data |
| `/calendar` | CalendarComponent | authGuard | mock-data |
| `/doctors` | DoctorsComponent | authGuard | mock-data |
| `/doctors/:id` | DoctorProfileComponent | authGuard | mock-data |
| `/dispatch` | DispatchComponent | authGuard | mock-data |
| `/transport` | TransportComponent | authGuard | mock-data |
| `/live-map` | LiveMapComponent | authGuard | mock-data |
| `/settings` | SettingsComponent | authGuard | static HTML |
| `/appointments/express` | ExpressAddAppointmentComponent | authGuard | mock-data via AppointmentService |
| `/appointments/quick` | QuickAddAppointmentComponent | authGuard | mock-data via AppointmentService |
| `/appointments/new` | AddAppointmentComponent | authGuard | mock-data via AppointmentService |
| `/appointments/edit/:id` | AddAppointmentComponent | authGuard | mock-data via AppointmentService |

---

## 3. Integration Status Matrix

| Feature area | UI done | API exists (backend) | Frontend wired | Priority |
|--------------|---------|---------------------|----------------|----------|
| Auth login/logout | ✅ | Partial (`GET /auth/me`) | ✅ Firebase | P0 — done |
| Auth profile in header | ✅ static | `GET /auth/me` | ❌ | P2 |
| Bookings list | ✅ | ❌ | ❌ | P1 |
| Booking detail | ✅ | ❌ | ❌ | P1 |
| Appointment create/edit | ✅ | ❌ | ❌ | P1 |
| Booking lifecycle (cancel/complete) | partial UI | ❌ | ❌ | P1 |
| Doctors list + add | ✅ | ❌ | ❌ | P2 |
| Doctor profile | ✅ | ❌ | ❌ | P2 |
| Doctor accept/reject | ✅ | ❌ | ❌ | P2 |
| Dispatch queue + assign | ✅ | ❌ | ❌ | P2 |
| Dashboard analytics | ✅ | ❌ | ❌ | P3 |
| Calendar | ✅ | ❌ | ❌ | P2 |
| Transport | ✅ | ❌ | ❌ | P3 |
| Live map | ✅ | ❌ | ❌ | P3 |
| Settings | ✅ static | ❌ | ❌ | P3 |
| File uploads | ✅ UI | ❌ | ❌ | P3 |
| Payments | ❌ no UI | ❌ | ❌ | P4 |
| Header search | ✅ UI only | ❌ global search | ❌ | P4 |
| Notifications bell | ✅ UI only | ❌ | ❌ | P4 |

---

## 4. Cross-Cutting Concerns

### 4.1 Authentication

| Item | Current | Required |
|------|---------|----------|
| Login | Firebase `signInWithEmailAndPassword` | ✅ Done |
| Logout | Firebase `signOut` | ✅ Done |
| Route guards | `authGuard` / `guestGuard` wait for Firebase | ✅ Done |
| API token | `authInterceptor` → `Authorization: Bearer` | ✅ Done |
| Profile | Hardcoded "Admin User" / "AD" | `GET /api/v1/auth/me` |
| Password change | Settings tab — no action | Firebase `updatePassword` or backend endpoint |
| Forgot password | Link disabled | Firebase `sendPasswordResetEmail` (optional) |

### 4.2 Environment

| File | Used when | `apiUrl` |
|------|-----------|----------|
| `environment.ts` | `ng build` (production) | `https://api.doobydev.com/api/v1` |
| `environment.development.ts` | `ng serve` | `https://api.doobydev.com/api/v1` |

Both point to production API (server-only workflow).

### 4.3 Error handling — missing

No global HTTP error interceptor. Need:
- 401 → redirect to login
- 403 → toast "Access denied"
- 5xx → toast "Server error"
- Loading states on all API calls

### 4.4 Real-time — not implemented

Dispatch queue, live map, and dashboard assign table would benefit from:
- WebSocket or Firestore listeners (future)
- For MVP: polling every 30s on dispatch/dashboard

### 4.5 Mock data files to remove (when done)

| File | Used by |
|------|---------|
| `src/app/data/mock-data.ts` | 12+ components, AppointmentService |
| Direct `BOOKINGS` / `DOCTORS` / `VEHICLES` imports | Every operational page |

---

## 5. Shared Services — Current vs Required

### 5.1 `AuthService` — ✅ Done

```
login(email, password)     → Firebase Auth
logout()                   → Firebase Auth
idToken()                  → for interceptor
waitUntilReady()           → for guards
```

**Still needed:**
```
getProfile()               → GET /api/v1/auth/me
```

---

### 5.2 `AppointmentService` — ❌ Must refactor

**Current role:** Form state machine + mock CRUD

| Method | Current behavior | Required API |
|--------|-----------------|--------------|
| `saveBooking()` | `createBookingFromForm` / `updateBookingFromForm` on mock | `POST /bookings` or `PATCH /bookings/:id` |
| `finalizeBooking()` | Same + navigate | `POST /bookings` or `POST /bookings/:id/finalize` |
| `getBookings()` | Returns `BOOKINGS` array | `GET /bookings` via BookingApiService |
| Edit load (`appointment-form.base`) | `BOOKINGS.find(id)` | `GET /bookings/:id` |

**Keep in AppointmentService:** form signals, navigation, validation orchestration  
**Move to BookingApiService:** all HTTP calls

---

### 5.3 Services to create

| Service | Responsibility |
|---------|----------------|
| `BookingApiService` | Bookings CRUD, list, filters, calendar, lifecycle |
| `DoctorApiService` | Doctors CRUD, stats, requests, availability |
| `DispatchApiService` | Queue, assign, multi-dispatch, suggestions |
| `DashboardApiService` | Summary, charts, assign queue, today appointments |
| `VehicleApiService` | Vehicles list, summary, assign, track |
| `MapApiService` | Markers, distances, location updates |
| `SettingsApiService` | Profile, notifications, dispatch rules, transport |
| `FileApiService` | Upload to Firebase Storage via backend |
| `PaymentApiService` | Record payment (future UI) |

---

## 6. Page-by-Page Audit

---

### 6.1 Login — `/login`

**Component:** `pages/login/login.component.ts`  
**Guard:** `guestGuard`  
**Integration:** ✅ Firebase Auth wired

| User action | API needed | Status |
|-------------|-----------|--------|
| Sign in | Firebase Auth (client-side) | ✅ Done |
| Forgot password | Firebase `sendPasswordResetEmail` | ❌ Not wired (link disabled) |

**No backend REST call required for login itself.**

---

### 6.2 Logout — `/logout`

**Component:** `pages/logout/logout.component.ts`

| User action | API needed | Status |
|-------------|-----------|--------|
| Sign out | Firebase Auth | ✅ Done |

---

### 6.3 Dashboard — `/dashboard`

**Component:** `pages/dashboard/dashboard.component.ts` (~1250 lines)  
**Mock imports:** `BOOKINGS`, `DOCTORS`, `VEHICLES`, `assignBookingToDoctor`, sorting helpers

#### UI sections & data needs

| Section | Data consumed | Computed client-side |
|---------|--------------|---------------------|
| Period selector | today/yesterday/weekly/monthly/quarterly | Filters bookings by date range |
| Stat cards | booking counts, change % | Mix of real + `PERIOD_META` demo fallbacks |
| Line chart | bookings by type over time | `buildChartBuckets()` |
| Donut chart | home vs online split | Falls back to demo if no data |
| Assign appointments table | pending/sent/accepted bookings | `sortAppointmentsForAssign()` |
| Today's appointments | bookings where `scheduledDate === today` | Client filter |
| Doctor availability cards | doctors by status | Client filter on DOCTORS |
| Transport mini chart | vehicle rides/km | Client from VEHICLES |

#### User actions

| Action | Current (mock) | API required |
|--------|---------------|--------------|
| Change period | Client filter | `GET /dashboard/summary?period=` |
| View chart | Client aggregate | `GET /dashboard/chart?period=&filter=` |
| Assign doctor (popup) | `assignBookingToDoctor()` | `POST /bookings/:id/assign` `{ doctorId }` |
| Edit booking | Navigate to wizard | `GET /bookings/:id` (on wizard load) |
| Toggle action menu | UI only | — |

#### APIs needed

```
GET  /api/v1/dashboard/summary?period=today|yesterday|weekly|monthly|quarterly
GET  /api/v1/dashboard/chart?period=&filter=all|home|online|clinic
GET  /api/v1/dashboard/donut?period=
GET  /api/v1/dashboard/assign-queue?limit=10
GET  /api/v1/dashboard/today-appointments?limit=8
GET  /api/v1/dashboard/doctors-status
GET  /api/v1/dashboard/transport-summary
POST /api/v1/bookings/:id/assign          { doctorId }
GET  /api/v1/doctors?status=available     (assign popup doctor list)
```

#### Frontend files to change

- `dashboard.component.ts` — replace all `BOOKINGS`/`DOCTORS`/`VEHICLES` with API calls
- Create `dashboard-api.service.ts`

#### Gaps

- `PERIOD_META` uses hardcoded demo totals when no bookings — backend should return real counts
- `quarterly` period not in backend plan — add or map to monthly server-side
- No loading/error states

---

### 6.4 Bookings Workspace — `/bookings`

**Component:** `pages/bookings/bookings.component.ts`

#### UI features

| Feature | Implementation today |
|---------|---------------------|
| Type tabs | all / home / online / clinic |
| Status chips | all / pending / accepted / completed (+ cancelled in types, not chips) |
| Search | pet, owner, ID, service, reason, location, doctor |
| Pagination | client-side slice |
| Side drawer | booking preview on row click |
| Query params | `?status=` and `?type=` on init |

#### User actions

| Action | API required |
|--------|-------------|
| Load list | `GET /bookings?status=&type=&search=&page=&limit=` |
| Filter by type/status | Query params on GET |
| Search | `?search=` query param |
| Open drawer | Uses filtered list (no extra call) or `GET /bookings/:id` for full detail |
| New appointment | Navigate to wizard |
| Edit appointment | Navigate to wizard with `GET /bookings/:id` |
| View full record | Navigate to `/bookings/:id` |

#### APIs needed

```
GET /api/v1/bookings
    ?status=pending|accepted|completed|cancelled|sent
    &type=home|online|clinic
    &search=
    &page=0
    &limit=10
    &sort=emergency,submittedAt
```

#### Response shape (per row)

Must match `Booking` interface from `mock-data.ts`:
`id, customerName, petName, petAge, petIcon, reason, service, type, status, location, area, scheduledDate, scheduledTime, submittedAt, isEmergency, assignedDoctor, ...`

#### Frontend files to change

- `bookings.component.ts`
- Create `booking-api.service.ts`

#### Gaps

- `cancelled` status in filter types but **not shown in status chips** — add chip or remove from type
- Pagination is client-side — backend should support `page`/`limit`
- Drawer shows summary only — no API for partial vs full (acceptable)

---

### 6.5 Booking Detail — `/bookings/:id`

**Component:** `pages/bookings/booking-detail.component.ts`

#### UI sections

| Section | Data source |
|---------|------------|
| Hero (pet, owner, status, type) | `getBookingById(id)` |
| Current booking summary | booking top-level fields |
| History timeline | `booking.history[]` |
| Full intake details | `booking.details` → `getFilledFormDetails()` |
| Previous visits | `getPreviousPetVisits()` |
| Medication history | `getPetMedicationHistory()` |
| Visit count badge | `getPetVisitHistory().length` |

#### User actions

| Action | API required |
|--------|-------------|
| Load booking | `GET /bookings/:id` |
| Edit appointment | Navigate to wizard |
| View other visit | Navigate to `/bookings/:otherId` |
| Go back | Router only |

#### APIs needed

```
GET /api/v1/bookings/:id
    → full Booking + details + history

GET /api/v1/bookings/:id/previous-visits   (or embedded in above)
GET /api/v1/pets/:ownerId/:petId/visit-history
GET /api/v1/pets/:ownerId/:petId/medication-history
```

#### Gaps

- **No Cancel booking button** — need `POST /bookings/:id/cancel`
- **No Record Payment button** — need `POST /payments` (future)
- **No Complete visit button** — need `POST /bookings/:id/complete`
- Edit doctor notes on completed visits — `PATCH /bookings/:id/intake/doctorNotes`

---

### 6.6 Calendar — `/calendar`

**Component:** `pages/calendar/calendar.component.ts`

#### UI features

| Feature | Data |
|---------|------|
| Month grid | booking count per day + emergency flag |
| Day drawer | all bookings on selected date |
| Month navigation | client date math |
| Booking cards | acceptance status, emergency, type |
| Deep link | `?date=` and `?booking=` query params |

#### User actions

| Action | API required |
|--------|-------------|
| Load month | `GET /bookings/calendar?month=YYYY-MM` |
| Select day | `GET /bookings?scheduledDate=YYYY-MM-DD` |
| View booking detail | Navigate to `/bookings/:id?from=calendar` |

#### APIs needed

```
GET /api/v1/bookings/calendar?month=2026-08
    → { days: [{ date, bookingCount, hasEmergency }] }

GET /api/v1/bookings?scheduledDate=2026-08-05
    → Booking[] sorted by time, emergency first
```

#### Frontend files to change

- `calendar.component.ts`

---

### 6.7 Doctors List — `/doctors`

**Component:** `pages/doctors/doctors.component.ts`

#### UI features

| Feature | Data |
|---------|------|
| Filter bar | all / available / on-visit / offline |
| Doctor cards | name, specialty, status, location, visitsToday, rating |
| Add doctor modal | form: name, specialty, location, mobile, email, rating |

#### User actions

| Action | Current (mock) | API required |
|--------|---------------|--------------|
| Load list | `DOCTORS` | `GET /doctors?status=` |
| Filter by status | Client filter | Query param |
| Add doctor | `createDoctorFromForm()` | `POST /doctors` |
| View profile | Navigate | `GET /doctors/:id` |

#### APIs needed

```
GET  /api/v1/doctors
GET  /api/v1/doctors?status=available|on-visit|offline
POST /api/v1/doctors
     { name, specialty, location, mobile, email, rating }
```

#### Response shape

Must match `Doctor` interface: `id, name, initials, specialty, status, location, area, lat, lng, visitsToday, rating, ...`

#### Gaps

- Add doctor form collects mobile/email but mock `Doctor` display doesn't show them — backend should store
- No edit/delete doctor in UI

---

### 6.8 Doctor Profile — `/doctors/:id`

**Component:** `pages/doctors/doctor-profile.component.ts`

#### Tabs & data

| Tab | Data functions (all mock) |
|-----|--------------------------|
| Dashboard | `getDoctorPeriodStats`, pending/completed tasks, week appointments, total patients |
| Requests | `getDoctorIncomingRequests` — bookings with status `sent` |
| Appointments | `getDoctorPeriodBookings` filtered by period |
| History | `getDoctorAllHistory` |

#### User actions

| Action | Current (mock) | API required |
|--------|---------------|--------------|
| Load profile | `getDoctorById(id)` | `GET /doctors/:id` |
| Change availability | `setDoctorAvailability()` | `PATCH /doctors/:id/availability` |
| Accept request | `acceptBookingForDoctor()` | `POST /bookings/:id/accept` `{ doctorId }` |
| Reject request | `rejectBookingForDoctor()` | `POST /bookings/:id/decline` `{ doctorId }` |
| View booking | Navigate to booking detail | `GET /bookings/:id` |
| Period filter | Client filter | `GET /doctors/:id/stats?period=today` |

#### APIs needed

```
GET   /api/v1/doctors/:id
PATCH /api/v1/doctors/:id/availability     { status: available|offline|on-visit }
GET   /api/v1/doctors/:id/requests
GET   /api/v1/doctors/:id/stats?period=today|yesterday|weekly|monthly
GET   /api/v1/doctors/:id/bookings?period=
POST  /api/v1/bookings/:id/accept          { doctorId }
POST  /api/v1/bookings/:id/decline         { doctorId }
```

#### Stats response shape

```typescript
{ total, pending, completed, active, patients }
```

---

### 6.9 Dispatch — `/dispatch`

**Component:** `pages/dispatch/dispatch.component.ts`

#### UI sections

| Section | Data |
|---------|------|
| Incoming queue | bookings status `pending` or `sent`, emergency first |
| Map | `buildDispatchMapMarkers(booking, doctors, vehicles)` |
| Selected booking stats | distance/ETA from client geo math |
| Nearby doctors list | available doctors sorted by distance |
| Nearby vehicles list | available/on-trip vehicles by distance |
| Multi-select doctors | checkbox selection |
| Send request button | mutates booking to `sent` |
| Accept for doctor | admin accepts on behalf of doctor |

#### User actions

| Action | Current (mock) | API required |
|--------|---------------|--------------|
| Load queue | Filter BOOKINGS | `GET /dispatch/queue` |
| Select booking | UI state | — |
| Select doctors on map | UI state | — |
| Send request | Set status sent + requestedDoctorIds | `POST /bookings/:id/dispatch` `{ doctorIds[] }` |
| Accept for doctor | `acceptBookingForDoctor(byAdmin=true)` | `POST /bookings/:id/admin-accept` `{ doctorId }` |
| Distance/ETA | Client Haversine | `GET /dispatch/suggestions/:bookingId` (optional — can stay client-side) |

#### APIs needed

```
GET  /api/v1/dispatch/queue
POST /api/v1/bookings/:id/dispatch         { doctorIds: string[] }
POST /api/v1/bookings/:id/admin-accept     { doctorId }
GET  /api/v1/dispatch/suggestions/:bookingId
GET  /api/v1/doctors?status=available
GET  /api/v1/vehicles?status=available,on-trip
```

#### Real-time note

Queue should refresh after dispatch actions — refetch queue or optimistic update + WebSocket later.

---

### 6.10 Transport — `/transport`

**Component:** `pages/transport/transport.component.ts`

#### UI sections

| Section | Data |
|---------|------|
| Stat cards | available count, total rides, total km, avg fuel |
| Vehicle table | all vehicles with driver, doctor, status, fuel bar |
| Actions | Track (on-trip) / Assign (available) — **buttons not wired** |

#### APIs needed

```
GET   /api/v1/vehicles
GET   /api/v1/vehicles/summary
PATCH /api/v1/vehicles/:id/status
POST  /api/v1/vehicles/:id/assign       { doctorId?, bookingId? }
GET   /api/v1/vehicles/:id/track        (future GPS)
```

#### Gaps

- Assign and Track buttons are **UI placeholders** — no click handlers
- No add/edit vehicle in UI

---

### 6.11 Live Map — `/live-map`

**Component:** `pages/live-map/live-map.component.ts`

#### UI features

| Feature | Data |
|---------|------|
| Layer toggles | doctors / vehicles / bookings |
| Active bookings sidebar | non-completed, non-cancelled |
| Map markers | `buildLiveMapMarkers()` |
| Distance sidebar | Haversine from booking to all doctors/vehicles |
| Focus booking | highlight on map |

#### APIs needed

```
GET /api/v1/map/markers?layers=doctors,vehicles,customers
GET /api/v1/map/distances/:bookingId
PATCH /api/v1/doctors/:id/location       { lat, lng }   (future live GPS)
PATCH /api/v1/vehicles/:id/location      { lat, lng }
```

#### Note

Geo distance math can remain **client-side** using lat/lng from API response — same as `map-markers.ts` today.

---

### 6.12 Settings — `/settings`

**Component:** `pages/settings/settings.component.ts`

#### Tabs — all static, no save handlers

| Tab | Fields | API needed |
|-----|--------|-----------|
| Profile | fullName, email | `GET/PATCH /settings/profile` |
| Notifications | 3 toggles | `GET/PATCH /settings/notifications` |
| Dispatch | radius, timeout, max doctors | `GET/PATCH /settings/dispatch` |
| Transport | fuel threshold, maintenance km | `GET/PATCH /settings/transport` |
| Account | current/new password | Firebase `updatePassword` |

#### APIs needed

```
GET   /api/v1/settings
PATCH /api/v1/settings/profile         { fullName, email }
PATCH /api/v1/settings/notifications   { notifyNewBooking, notifyDispatchTimeout, notifyLowFuel }
PATCH /api/v1/settings/dispatch        { dispatchRadiusKm, requestTimeoutMinutes, maxDoctorsPerRequest }
PATCH /api/v1/settings/transport       { lowFuelThresholdPct, maintenanceReminderKm }
```

#### Gaps

- All inputs use hardcoded `value=""` — not bound to component state
- Save buttons have no `(click)` handlers
- Entire page is **UI shell only**

---

## 7. Appointment Wizards — Deep Audit

Three entry points, one data model (`PetAppointmentForm`), one service (`AppointmentService`).

| Route | Component | Steps | Primary use |
|-------|-----------|-------|-------------|
| `/appointments/quick` | QuickAddAppointmentComponent | 9 steps | Main wizard (header + dashboard entry) |
| `/appointments/express` | ExpressAddAppointmentComponent | Single page | Fast emergency/routine |
| `/appointments/new` | AddAppointmentComponent | Single page all sections | Full form |
| `/appointments/edit/:id` | AddAppointmentComponent | Same | Edit existing |

### 7.1 Form sections (16 rooms → one `details` JSON)

| # | Section ID | Mandatory | Stored in |
|---|-----------|-----------|-----------|
| 1 | owner | Yes | `details.owner` |
| 2 | pet | Yes | `details.pet` |
| 3 | appointment | Yes | `details.appointment` |
| 4 | health | Yes | `details.health` |
| 5 | pastMedical | No | `details.pastMedical` |
| 6 | vaccination | No | `details.vaccination` |
| 7 | deworming | No | `details.deworming` |
| 8 | tickFlea | No | `details.tickFlea` |
| 9 | medications | No | `details.medications` |
| 10 | allergies | No | `details.allergies` |
| 11 | diet | No | `details.diet` |
| 12 | lifestyle | No | `details.lifestyle` |
| 13 | reproductive | No | `details.reproductive` |
| 14 | emergency | Important | `details.emergency` + `isEmergency` flag |
| 15 | documents | No | `details.documents` + file URLs |
| 16 | doctorNotes | Internal | `details.doctorNotes` |

### 7.2 Wizard user actions → APIs

| Action | Method | Endpoint |
|--------|--------|----------|
| Start create | — | Navigate only |
| Load for edit | GET | `/bookings/:id` |
| Save draft (per step) | PATCH | `/bookings/:id` or `/bookings/:id/intake` |
| Submit / finalize | POST or PATCH | `/bookings` or `/bookings/:id/finalize` |
| Cancel wizard | — | Navigate only |
| Upload problem photos | POST multipart | `/bookings/:id/files` `{ category: 'problemPhotos' }` |
| Upload documents | POST multipart | `/bookings/:id/files` `{ category: 'prescriptions'|'xray'|... }` |
| Upload vaccination card | POST multipart | `/bookings/:id/files` `{ category: 'vaccinationCard' }` |

### 7.3 Supporting data loaded in wizards

| Data | Current source | API needed |
|------|---------------|------------|
| Doctor picker list | `DOCTORS` | `GET /doctors?status=available` |
| Breed lists | Static in `appointment-form.model.ts` | No API (keep static) |
| Chronic disease options | Static | No API |
| Time/date options | Static picker options | No API |

### 7.4 Validation (must match backend)

From `appointment-form.model.ts`:

**Normal mode required:** owner.fullName, mobile, address · pet.breed, ageOrDob · appointment.consultationType, reasonForVisit

**Emergency mode required:** owner.fullName, mobile, address · pet.name, species · appointment.preferredDate, preferredTime, reasonForVisit

Backend must return `422 { errors: string[] }` with same messages.

### 7.5 Create booking request body

```json
{
  "owner": { "fullName", "mobile", "email", "address", "emergencyContact" },
  "pet": { "name", "species", "breed", "gender", "ageOrDob", "weight", ... },
  "appointment": { "bookingMode", "preferredDate", "preferredTime", "consultationType", ... },
  "health": { ... },
  "...all other sections": { ... }
}
```

Backend upserts owner + pet, creates booking, stores full object as `details`.

### 7.6 Files to change

- `appointment.service.ts` — delegate to BookingApiService
- `appointment-form.base.ts` — load edit via API not `BOOKINGS.find`
- `add-appointment.component.ts` — remove direct BOOKINGS import
- `booking-api.service.ts` — **create new**

---

## 8. Shared Components Audit

### 8.1 Header — `components/header/header.component.ts`

| Element | Current | API needed |
|---------|---------|------------|
| Search input | Non-functional | `GET /bookings?search=` or global search endpoint |
| Add New Appointment | `appointmentService.startQuickCreate()` | Navigate only (wizard handles API) |
| Messages icon | Non-functional | Future messaging API |
| Notifications bell | Static badge dot | Future notifications API |
| User avatar "AD" | Hardcoded | `GET /auth/me` → fullName, initials |

---

### 8.2 Sidebar — `components/sidebar/sidebar.component.ts`

Static nav links — no API needed.

---

### 8.3 Admin Layout — `layout/admin-layout.component.ts`

Shell only — hosts sidebar + header + router-outlet. No API.

---

### 8.4 Bangalore Map — `components/bangalore-map/bangalore-map.component.ts`

Presentational — receives markers as `@Input()`. Parent pages supply data from API.

---

### 8.5 Pickers (date, time, select)

Static options + doctor list from `DOCTORS`. Doctor picker needs `GET /doctors`.

---

## 9. Data Models & API Contracts

### 9.1 Core entities (from `mock-data.ts`)

#### `Booking`

```typescript
interface Booking {
  id: string;                    // displayId e.g. BK-1043
  customerName: string;
  petName: string;
  petAge: string;
  petIcon: 'dog'|'cat'|'bird'|'rabbit'|'paw';
  reason: string;
  service: string;
  type: 'online'|'home'|'clinic';
  status: 'pending'|'sent'|'accepted'|'completed'|'cancelled';
  location: string;
  area?: string;
  lat?: number;
  lng?: number;
  scheduledDate: string;         // YYYY-MM-DD
  scheduledTime: string;         // HH:mm
  submittedAt?: string;          // ISO
  createdAt: string;
  isEmergency?: boolean;
  mustReachWithinMinutes?: number;
  estimatedArrivalMinutes?: number;
  assignedDoctor?: string;
  requestedDoctorIds?: string[];
  details?: PetAppointmentForm;
  history: { time: string; label: string; done: boolean }[];
  paymentStatus?: 'unpaid'|'paid'|'partial'|'waived';  // future
}
```

#### `Doctor`

```typescript
interface Doctor {
  id: string;                    // DR-01
  name: string;
  initials: string;
  specialty: string;
  status: 'available'|'on-visit'|'offline';
  location: string;
  area?: string;
  lat?: number;
  lng?: number;
  visitsToday: number;
  rating: number;
  distanceKm?: number;           // computed client or server
}
```

#### `Vehicle`

```typescript
interface Vehicle {
  id: string;                    // VH-01
  driver?: string;
  assignedDoctor?: string;
  status: 'available'|'on-trip'|'maintenance'|'unavailable';
  area?: string;
  lat?: number;
  lng?: number;
  ridesToday: number;
  kmToday: number;
  fuelPercent: number;
}
```

### 9.2 Standard API response envelope

```typescript
// Success
{ success: true, data: T, meta?: { page, limit, total } }

// Error
{ success: false, message: string, errors?: string[] }
```

---

## 10. Master API Catalog (All Endpoints)

> **Total: 54 unique REST endpoints** under `/api/v1`  
> Login/logout use **Firebase Auth client SDK** — not counted above.

| Priority | Endpoints | When |
|----------|----------:|------|
| P0 — Auth | 1 | Done (skeleton) |
| P1 — Bookings + wizards + list + detail + calendar | 10 | Phase 3–4 |
| P1 — Dispatch + lifecycle | 7 | Phase 5–6 |
| P2 — Doctors | 7 | Phase 5 |
| P2 — Dashboard | 7 | Phase 7 |
| P2 — Owners & pets history | 3 | Phase 3 |
| P3 — Vehicles + map | 9 | Phase 8 |
| P3 — Settings | 5 | Phase 9 |
| P3 — Files | 3 | Phase 10 |
| P4 — Payments | 2 | Phase 11 (UI not built yet) |

### Auth
| Method | Path | Used by |
|--------|------|---------|
| GET | `/auth/me` | Header, settings profile |

### Bookings
| Method | Path | Used by |
|--------|------|---------|
| GET | `/bookings` | Bookings, dashboard filters |
| POST | `/bookings` | Appointment wizards (create) |
| GET | `/bookings/:id` | Detail, edit load |
| PATCH | `/bookings/:id` | Wizard save draft |
| PATCH | `/bookings/:id/intake` | Partial section update |
| POST | `/bookings/:id/finalize` | Wizard submit |
| POST | `/bookings/:id/cancel` | Detail (UI missing) |
| POST | `/bookings/:id/complete` | Detail (UI missing) |
| GET | `/bookings/calendar?month=` | Calendar |
| GET | `/bookings/:id/previous-visits` | Booking detail |

> `GET /bookings` also serves calendar day drawer via `?scheduledDate=`, list filters via `?status=&type=&search=&page=&limit=`, and header search via `?search=` — same route, different query params.

### Booking lifecycle / dispatch
| Method | Path | Used by |
|--------|------|---------|
| GET | `/dispatch/queue` | Dispatch |
| POST | `/bookings/:id/assign` | Dashboard assign popup |
| POST | `/bookings/:id/dispatch` | Dispatch multi-send |
| POST | `/bookings/:id/admin-accept` | Dispatch accept |
| POST | `/bookings/:id/accept` | Doctor profile |
| POST | `/bookings/:id/decline` | Doctor profile |
| GET | `/dispatch/suggestions/:bookingId` | Dispatch map |

### Owners & pets
| Method | Path | Used by |
|--------|------|---------|
| GET | `/owners?mobile=` | Returning customer lookup (future) |
| GET | `/pets/:ownerId/:petId/visit-history` | Booking detail |
| GET | `/pets/:ownerId/:petId/medication-history` | Booking detail |

### Doctors
| Method | Path | Used by |
|--------|------|---------|
| GET | `/doctors` | Doctors list, dispatch, wizards, dashboard |
| POST | `/doctors` | Add doctor modal |
| GET | `/doctors/:id` | Doctor profile |
| PATCH | `/doctors/:id/availability` | Doctor profile |
| GET | `/doctors/:id/requests` | Doctor profile requests tab |
| GET | `/doctors/:id/stats?period=` | Doctor profile dashboard |
| GET | `/doctors/:id/bookings?period=` | Doctor profile appointments tab |

### Vehicles
| Method | Path | Used by |
|--------|------|---------|
| GET | `/vehicles` | Transport, dispatch, live map |
| GET | `/vehicles/summary` | Transport stat cards |
| PATCH | `/vehicles/:id/status` | Transport (future) |
| POST | `/vehicles/:id/assign` | Transport assign button (future) |
| GET | `/vehicles/:id/track` | Transport track button (future GPS) |

### Map
| Method | Path | Used by |
|--------|------|---------|
| GET | `/map/markers?layers=` | Live map, dispatch |
| GET | `/map/distances/:bookingId` | Live map sidebar (optional — client can compute) |
| PATCH | `/doctors/:id/location` | Live map — future live GPS |
| PATCH | `/vehicles/:id/location` | Live map — future live GPS |

### Dashboard
| Method | Path | Used by |
|--------|------|---------|
| GET | `/dashboard/summary?period=` | Dashboard stat cards |
| GET | `/dashboard/chart?period=&filter=` | Dashboard line chart |
| GET | `/dashboard/donut?period=` | Dashboard home vs online donut |
| GET | `/dashboard/assign-queue?limit=` | Dashboard assign table |
| GET | `/dashboard/today-appointments?limit=` | Dashboard today section |
| GET | `/dashboard/doctors-status` | Dashboard doctor cards |
| GET | `/dashboard/transport-summary` | Dashboard transport chart |

### Files
| Method | Path | Used by |
|--------|------|---------|
| POST | `/bookings/:id/files` | Appointment wizards (upload) |
| GET | `/bookings/:id/files` | Booking detail |
| DELETE | `/files/:id` | Booking detail (future) |

### Payments (future UI)
| Method | Path | Used by |
|--------|------|---------|
| POST | `/payments` | Record payment on booking |
| GET | `/payments?bookingId=` | Booking detail |

### Settings
| Method | Path | Used by |
|--------|------|---------|
| GET | `/settings` | Settings page load |
| PATCH | `/settings/profile` | Settings profile tab |
| PATCH | `/settings/notifications` | Settings notifications tab |
| PATCH | `/settings/dispatch` | Settings dispatch tab |
| PATCH | `/settings/transport` | Settings transport tab |

### Endpoint count summary

| Domain | GET | POST | PATCH | DELETE | Subtotal |
|--------|----:|-----:|------:|-------:|---------:|
| Auth | 1 | — | — | — | **1** |
| Bookings | 4 | 4 | 2 | — | **10** |
| Dispatch & lifecycle | 2 | 5 | — | — | **7** |
| Owners & pets | 3 | — | — | — | **3** |
| Doctors | 5 | 1 | 1 | — | **7** |
| Vehicles | 3 | 1 | 1 | — | **5** |
| Map & geo | 2 | — | 2 | — | **4** |
| Dashboard | 7 | — | — | — | **7** |
| Files | 1 | 1 | — | 1 | **3** |
| Payments | 1 | 1 | — | — | **2** |
| Settings | 1 | — | 4 | — | **5** |
| **Total** | **30** | **13** | **10** | **1** | **54** |

**54 REST endpoints** across **11 domains** (excluding Firebase Auth login/logout).

---

## 11. Frontend Services To Create

### Priority 1 — Bookings (unblocks 6 pages + 3 wizards)

```typescript
// booking-api.service.ts
getBookings(params): Observable<Booking[]>
getBooking(id): Observable<Booking>
createBooking(form: PetAppointmentForm): Observable<Booking>
updateBooking(id, form): Observable<Booking>
finalizeBooking(id, form): Observable<Booking>
cancelBooking(id): Observable<Booking>
completeBooking(id): Observable<Booking>
getCalendarMonth(month: string): Observable<CalendarDay[]>
getPreviousVisits(id): Observable<Booking[]>
```

### Priority 2 — Doctors + Dispatch

```typescript
// doctor-api.service.ts
getDoctors(status?): Observable<Doctor[]>
getDoctor(id): Observable<Doctor>
createDoctor(form): Observable<Doctor>
updateAvailability(id, status): Observable<Doctor>
getRequests(id): Observable<Booking[]>
getStats(id, period): Observable<DoctorStats>
acceptBooking(bookingId, doctorId): Observable<Booking>
declineBooking(bookingId, doctorId): Observable<Booking>

// dispatch-api.service.ts
getQueue(): Observable<Booking[]>
assignDoctor(bookingId, doctorId): Observable<Booking>
dispatchDoctors(bookingId, doctorIds): Observable<Booking>
adminAccept(bookingId, doctorId): Observable<Booking>
getSuggestions(bookingId): Observable<DispatchSuggestion[]>
```

### Priority 3 — Dashboard, Calendar, Map, Transport, Settings

Create corresponding `*-api.service.ts` files per domain above.

---

## 12. Gaps, Risks & Technical Debt

### 12.1 Critical gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| All pages use `mock-data.ts` | No persistence, refresh loses changes | Wire BookingApiService first |
| Settings page non-functional | Save buttons do nothing | Wire SettingsApiService + ngModel |
| Transport Assign/Track buttons | No handlers | Add click handlers + API |
| No cancel/complete on booking detail | Can't close booking lifecycle | Add UI buttons + API |
| Header search non-functional | Poor UX | Wire to bookings search |
| No error/loading states | Silent failures on API | Add interceptors + page loaders |
| Dashboard demo data fallback | Misleading stats when empty | Backend must return zeros not demos |
| `bookingsVersion` signal pattern | Works for mock refresh | Replace with API refetch or signals from service |

### 12.2 Architecture risks

| Risk | Mitigation |
|------|-----------|
| `mock-data.ts` is 2000+ lines — tight coupling | Delete incrementally per page |
| Client-side aggregation on dashboard/calendar | Move to backend endpoints for performance |
| Geo calculations client-side | Acceptable for MVP; optional server `/map/distances` |
| Single `AppointmentService` does too much | Split form state vs HTTP |
| No pagination on backend yet | Add `page`/`limit` to `GET /bookings` |
| Firestore index missing for new query | Add to `firestore.indexes.json` as queries added |

### 12.3 Security notes

| Item | Status |
|------|--------|
| Firebase token on all API calls | ✅ Interceptor wired |
| Backend verifies token | ✅ `auth.middleware.js` exists |
| Role-based access (admin vs doctor) | ❌ Not implemented — future |
| Service account key in repo | ⚠️ Ensure `.gitignore` + never commit |

### 12.4 UI features with no backend plan yet

| Feature | Location |
|---------|----------|
| Header messages icon | header |
| Notifications bell + badge | header |
| Forgot password link | login |
| Global header search | header |
| Payment recording | not in UI |
| Doctor edit/delete | doctors page |
| Vehicle CRUD | transport page |

---

## 13. Recommended Wiring Order

Match `IMPLEMENTATION-ORDER-PHASES.MD` — frontend wiring per phase:

```
Step 1  ✅ Auth (done)
Step 2  Create booking-api.service.ts
Step 3  Wire appointment wizards → POST/PATCH /bookings
Step 4  Wire bookings list + detail → GET /bookings
Step 5  Wire booking lifecycle → cancel, complete, history
Step 6  Create doctor-api.service.ts → doctors list + profile
Step 7  Wire doctor accept/reject + availability
Step 8  Create dispatch-api.service.ts → dispatch page + dashboard assign
Step 9  Wire calendar → GET /bookings/calendar
Step 10 Create dashboard-api.service.ts → dashboard charts/stats
Step 11 Create vehicle-api.service.ts + map-api.service.ts
Step 12 Wire settings page
Step 13 Add file upload to wizards
Step 14 Add payment UI + API
Step 15 Remove mock-data.ts entirely
Step 16 Add error interceptor + loading states globally
```

### Definition of done (full integration)

- [ ] Zero imports from `mock-data.ts` in any component
- [ ] All 14 routes load data from API
- [ ] Create booking → visible in bookings list after refresh
- [ ] Assign doctor → status changes persist
- [ ] Doctor accept/reject → persists
- [ ] Calendar shows real booking counts
- [ ] Settings save/load from Firestore
- [ ] File uploads return Storage URLs in booking details

---

## Appendix A — Mock Data Mutation Functions To Replace

| Mock function | Replace with API |
|--------------|-----------------|
| `createBookingFromForm()` | `POST /bookings` |
| `updateBookingFromForm()` | `PATCH /bookings/:id` |
| `assignBookingToDoctor()` | `POST /bookings/:id/assign` |
| `acceptBookingForDoctor()` | `POST /bookings/:id/accept` or `/admin-accept` |
| `rejectBookingForDoctor()` | `POST /bookings/:id/decline` |
| `createDoctorFromForm()` | `POST /doctors` |
| `setDoctorAvailability()` | `PATCH /doctors/:id/availability` |
| `getBookingById()` | `GET /bookings/:id` |
| `getDoctorById()` | `GET /doctors/:id` |
| `getDoctorIncomingRequests()` | `GET /doctors/:id/requests` |
| `getDoctorPeriodStats()` | `GET /doctors/:id/stats` |
| `getPetVisitHistory()` | `GET /pets/.../visit-history` |
| `getPetMedicationHistory()` | `GET /pets/.../medication-history` |
| `sortBookingsByPriority()` | Server-side sort (keep client as fallback) |

---

## Appendix B — Files Touching Mock Data (must change)

| File | Mock usage |
|------|-----------|
| `services/appointment.service.ts` | BOOKINGS CRUD |
| `pages/dashboard/dashboard.component.ts` | BOOKINGS, DOCTORS, VEHICLES, assign |
| `pages/bookings/bookings.component.ts` | BOOKINGS list |
| `pages/bookings/booking-detail.component.ts` | getBookingById, visit history |
| `pages/calendar/calendar.component.ts` | BOOKINGS by date |
| `pages/doctors/doctors.component.ts` | DOCTORS, createDoctor |
| `pages/doctors/doctor-profile.component.ts` | All doctor/booking helpers |
| `pages/dispatch/dispatch.component.ts` | BOOKINGS, DOCTORS, VEHICLES, dispatch |
| `pages/transport/transport.component.ts` | VEHICLES |
| `pages/live-map/live-map.component.ts` | BOOKINGS, DOCTORS, VEHICLES |
| `pages/add-appointment/appointment-form.base.ts` | BOOKINGS, DOCTORS |
| `pages/add-appointment/add-appointment.component.ts` | BOOKINGS, DOCTORS |
| `components/picker/appointment-picker-options.ts` | Doctor type import |
| `data/map-markers.ts` | Booking, Doctor, Vehicle types |

**Total: 14 files** require migration off mock data.

---

*End of audit. Use with `IMPLEMENTATION-ORDER-PHASES.MD` for build sequence and `FULLPLAN.MD` for backend schema detail.*
