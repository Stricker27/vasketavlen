import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import type { Booking, Resident } from './types.js';

export const databaseDir = dirname(config.databasePath);
mkdirSync(databaseDir, { recursive: true });

export const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_resident_id
      ON bookings (resident_id, start, end);
  `);

  return db;
}

export function resetDatabase() {
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM sqlite_sequence WHERE name = 'bookings';
    DELETE FROM residents;
    DELETE FROM sqlite_sequence WHERE name = 'residents';
  `);
}

export function getResidentByLogin(login: string): Resident | undefined {
  return db.prepare('SELECT * FROM residents WHERE login = ?').get(login) as Resident | undefined;
}

export function getResidentById(id: number): Resident | undefined {
  return db.prepare('SELECT * FROM residents WHERE id = ?').get(id) as Resident | undefined;
}

export function getAllResidents(): Resident[] {
  return db.prepare('SELECT * FROM residents ORDER BY display_name').all() as Resident[];
}

export function insertResident(login: string, displayName: string, password: string) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO residents (login, display_name, password_hash) VALUES (?, ?, ?)',
  );

  return result.run(login, displayName, passwordHash);
}

export function getBookingsInRange(start: string, end: string): Booking[] {
  return db
    .prepare(
      `SELECT b.*, r.display_name AS resident_name
       FROM bookings b
       JOIN residents r ON r.id = b.resident_id
       WHERE b.start < ? AND b.end > ?
       ORDER BY b.start ASC`,
    )
    .all(end, start) as Booking[];
}

export function getResidentQuota(residentId: number, weekStart: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(duration_minutes),0) AS total_minutes
       FROM bookings
       WHERE resident_id = ? AND start >= ? AND start < date(?, '+7 days')`,
    )
    .get(residentId, weekStart, weekStart) as { total_minutes: number } | undefined;

  return Number(row?.total_minutes ?? 0);
}

export function hasBookingOverlap(residentId: number, start: string, end: string): boolean {
  const match = db
    .prepare(
      `SELECT 1
       FROM bookings
       WHERE resident_id = ? AND start < ? AND end > ?
       LIMIT 1`,
    )
    .get(residentId, end, start) as { 1: number } | undefined;

  return Boolean(match);
}

export function createBookingForResident(residentId: number, start: string, end: string, durationMinutes: number) {
  return db.prepare(
    'INSERT INTO bookings (resident_id, start, end, duration_minutes) VALUES (?, ?, ?, ?)',
  ).run(residentId, start, end, durationMinutes);
}

export function seedDemoResidentsAndBookings() {
  const defaultResidents = [
    { login: 'alice', displayName: 'Alice Sørensen', password: 'password123' },
    { login: 'bruno', displayName: 'Bruno Hansen', password: 'password123' },
    { login: 'cecilie', displayName: 'Cecilie Madsen', password: 'password123' },
  ];

  for (const resident of defaultResidents) {
    const existing = getResidentByLogin(resident.login);
    if (!existing) {
      insertResident(resident.login, resident.displayName, resident.password);
    }
  }

  const count = db.prepare('SELECT COUNT(*) AS total FROM bookings').get() as { total: number };
  if (count.total > 0) {
    return;
  }

  const residents = getAllResidents();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 2);

  const sampleBookings = [
    { resident: 'alice', dayOffset: 0, startHour: 9, duration: 120 },
    { resident: 'bruno', dayOffset: 1, startHour: 10, duration: 150 },
    { resident: 'cecilie', dayOffset: 2, startHour: 13, duration: 90 },
  ];

  for (const booking of sampleBookings) {
    const resident = residents.find((entry) => entry.login === booking.resident);
    if (!resident) continue;

    const startDateTime = new Date(startDate);
    startDateTime.setDate(startDateTime.getDate() + booking.dayOffset);
    startDateTime.setHours(booking.startHour, 0, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + booking.duration);

    createBookingForResident(
      resident.id,
      toLocalISOString(startDateTime),
      toLocalISOString(endDateTime),
      booking.duration,
    );
  }
}

export function toLocalISOString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
