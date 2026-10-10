# Vasketavlen

A local shared laundry-booking board for residents in a building.

## Local development

1. Install dependencies:
   npm --prefix services/api install
   npm --prefix services/web install
2. Start the API:
   npm run dev:api
3. In a second terminal, start the frontend:
   npm run dev:web
4. Open the browser at http://localhost:5173

## Demo accounts

- alice / password123
- bruno / password123
- cecilie / password123

## Included features

- 30-day calendar view
- Resident login and session-based auth
- Booking validation for opening hours, overlap prevention, and weekly quota rules
- SQLite persistence with local demo seed data

## Verification

- API tests: npm --prefix services/api run test
- Frontend test: npm --prefix services/web run test -- --run
- Frontend build: npm --prefix services/web run build
- API build: npm --prefix services/api run build
