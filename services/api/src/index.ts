import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import session from 'express-session';
import morgan from 'morgan';
import { config } from './config.js';
import { initializeDatabase, db, getResidentById, getResidentByLogin, getAllResidents, seedDemoResidentsAndBookings } from './db.js';
import { addBookingForResident, getBookingList, getResidentByCredentials, getWeeklyQuotaForResident, toBookingError } from './bookingService.js';
import type { BookingInput, Resident } from './types.js';

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'You must sign in to access this resource.' } });
  }

  return next();
}

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/me', ensureAuthenticated, (req, res) => {
    const resident = getResidentById(Number(req.session.userId));
    if (!resident) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Session does not match any resident.' } });
    }

    return res.json({ id: resident.id, login: resident.login, displayName: resident.display_name });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Username and password are required.' } });
    }

    const resident = getResidentByLogin(username);
    if (!resident) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect username or password.' } });
    }

    const matches = bcrypt.compareSync(password, resident.password_hash);
    if (!matches) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect username or password.' } });
    }

    req.session.userId = resident.id;
    return res.json({ id: resident.id, login: resident.login, displayName: resident.display_name });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get('/api/bookings', ensureAuthenticated, (req, res) => {
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');

    if (!from || !to) {
      return res.status(400).json({ error: { code: 'INVALID_DATE_RANGE', message: 'from and to query params are required.' } });
    }

    return res.json(getBookingList(from, to));
  });

  app.get('/api/me/quota', ensureAuthenticated, (req, res) => {
    const resident = getResidentById(Number(req.session.userId));
    if (!resident) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Resident could not be found.' } });
    }

    return res.json(getWeeklyQuotaForResident(resident.id));
  });

  app.post('/api/bookings', ensureAuthenticated, (req, res) => {
    const payload = req.body as BookingInput;

    try {
      const booking = addBookingForResident(Number(req.session.userId), payload);
      return res.status(201).json(booking);
    } catch (error) {
      const bookingError = toBookingError(error);
      const status = bookingError?.code === 'INVALID_DURATION' || bookingError?.code === 'OUTSIDE_OPENING_HOURS' || bookingError?.code === 'BOOKING_OVERLAP' || bookingError?.code === 'WEEKLY_QUOTA_EXCEEDED' ? 400 : 500;
      return res.status(status).json({ error: bookingError ?? { code: 'UNKNOWN_ERROR', message: 'Booking validation failed.' } });
    }
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  });

  return app;
}

const app = createApp();
initializeDatabase();
seedDemoResidentsAndBookings();

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Vasketavlen API listening on http://localhost:${config.port}`);
  });
}

export default app;
