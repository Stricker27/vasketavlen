**Status**: In Progress
**Created**: 2026-10-10
**Mode**: Local Development

## 1. Project Overview

Vasketavlen is a shared laundry-booking board for residents in one building. The first version runs locally and stores its data persistently on the host machine. Residents sign in, see the next 30 days including today, and book available laundry time immediately.

## 2. Requirements

- Show a clear calendar for today and the following 29 days, including each booking and the resident who made it.
- Allow authenticated residents to create bookings between 08:00 and 20:00 local time.
- Collect booking date, start time, end time, and duration. Keep duration synchronized with the selected start and end times.
- Reject bookings outside opening hours, bookings that overlap an existing booking, and bookings that exceed the resident's remaining six-hour quota in a calendar week.
- Allow the weekly quota to be used across multiple bookings. A successful booking is confirmed immediately.
- Include demo accounts for local evaluation. Demo credentials are for development only.
- Keep shared booking data in a persistent local database. Cloud hosting and Azure deployment are out of scope for this version.

## 3. Architecture

- Run a React single-page frontend and a TypeScript/Express HTTP API as separate local development processes.
- The frontend reads and writes booking data only through the API; it does not keep authoritative booking state in browser storage.
- The API owns authentication, weekly quota calculation, opening-hour validation, overlap checks, and booking persistence.
- Configure the local host so the same running instance can serve the residents' devices on the building's local network when desired. No public internet endpoint or cloud resource is required.
- Use the building's local timezone consistently for calendar-day boundaries, opening hours, and weekly quota calculations.

## 4. Services

| Service | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite | Login and responsive 30-day laundry calendar; booking form and remaining weekly quota. |
| Backend API | Node.js, TypeScript, Express | Demo authentication, booking rules, resident identity, and calendar API. |

## 5. Data Stores

- SQLite database stored in a configurable local data directory and retained across app restarts.
- `residents`: resident identifier, display name, login name, and password hash.
- `bookings`: resident identifier, start and end timestamps, derived duration, and creation timestamp.
- Initialize a small set of clearly documented demo residents and bookings for local evaluation. Do not store plaintext passwords.
- Enforce booking rules in the API within a database transaction so simultaneous requests cannot create conflicting reservations or exceed the same resident's weekly quota.
- Backups are local file copies; no external data service or cloud storage is provisioned.

## 6. Design System & UI

**Component Library**: Fluent UI v9

- Present the calendar as the primary view, with a compact date navigator for the 30-day window and a clear distinction between available and booked periods.
- Show the resident's display name on each booked period. Do not expose login names or credentials in the calendar.
- Provide a login screen and a booking form with date, start time, end time, and duration controls. Recalculate duration as times change and show the resident's remaining weekly allowance before submission.
- Use the same opening-hours and availability constraints in the controls and in API error states. After a successful booking, update the calendar and confirm the reservation immediately.
- Keep the interface usable on phone and desktop widths, with keyboard-accessible calendar navigation and form validation.

## 7. API and Booking Rules

- `POST /api/auth/login`: authenticate a demo or local resident and issue a session suitable for local use.
- `POST /api/auth/logout`: end the current session.
- `GET /api/bookings?from=...&to=...`: return bookings in the visible calendar range with resident display names.
- `GET /api/me/quota`: return the signed-in resident's used and remaining booking time for the current calendar week.
- `POST /api/bookings`: validate the requested interval, quota, and overlap atomically, then persist and return the confirmed booking.
- Use half-open booking intervals (`start < otherEnd && end > otherStart`) so adjacent bookings are allowed while true overlaps are rejected.
- Derive duration from start and end timestamps on the server; never trust a client-supplied duration for quota enforcement.
- Return actionable validation errors for closed hours, overlap, invalid duration, and weekly quota exhaustion.

## 8. Local Development and Verification

- Provide local setup commands for installing dependencies, initializing the SQLite database, starting the API, and starting the frontend.
- Keep local configuration in environment variables with safe development defaults; persist the database outside ephemeral build output.
- Seed demo residents and bookings through an idempotent development seed command.
- Verify login/logout, 30-day range boundaries, opening-hour boundaries, adjacent versus overlapping bookings, concurrent booking attempts, weekly quota across multiple bookings, and persistence after API restart.
- Add API integration tests for booking validation and focused frontend tests for calendar and booking-form behavior.

## 9. Deployment and Scope

- Local development and local-network demonstration only.
- No Azure resources, cloud database, public hosting, production identity provider, or cloud deployment pipeline in this release.
- Treat demo credentials and local session configuration as development-only; production hardening and external exposure require a separately approved plan.