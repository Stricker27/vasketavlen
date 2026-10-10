# Integration hand-off

## Backend
- Project folder: services/api
- Run command: npm --prefix services/api run dev
- Build command: npm --prefix services/api run build
- Health endpoint: http://localhost:3001/api/health
- API routes:
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
  - GET /api/me
  - GET /api/me/quota
  - POST /api/bookings

## Frontend
- Project folder: services/web
- Dev command: npm --prefix services/web run dev -- --host 0.0.0.0
- Build command: npm --prefix services/web run build
- API seam: services/web/src/api/index.ts
- Mock files to replace later: services/web/src/api/mockData.ts
- Live-data switch: VITE_API_URL environment variable; default http://localhost:3001

## Database
- Type: SQLite
- Database path: services/api/data/vasketavlen.sqlite
- Connection env vars: DATABASE_PATH, SESSION_SECRET, FRONTEND_URL, APP_TIMEZONE
- Migration tooling: none for this local build; create schema migrations in a future integration pass only
- Explicit rule: no seed data in migrations; demo data stays in local seed scripts only

## Shared configuration
- Shared types: local app types in services/web/src/types.ts and services/api/src/types.ts
- Local session auth: express-session with cookie-based session
- Core app behavior: weekly quota 360 minutes, open hours 08:00-20:00, half-open overlap checks

## Services
- Essential: frontend web app, backend API, SQLite store
- Enhancement: local network hosting / browser-based evaluation

## Verification checklist
- Backend: npm --prefix services/api run test
- Frontend: npm --prefix services/web run test -- --run
- Smoke check: curl http://localhost:3001/api/health and load http://localhost:5173
