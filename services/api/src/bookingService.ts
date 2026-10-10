import bcrypt from 'bcryptjs';
import { db, getBookingsInRange, getResidentById, getResidentQuota, hasBookingOverlap, createBookingForResident } from './db.js';
import type { Booking, BookingInput, BookingValidationError, Resident } from './types.js';

export const OPENING_HOUR_START = 8 * 60;
export const OPENING_HOUR_END = 20 * 60;
export const WEEKLY_QUOTA_MINUTES = 6 * 60;

export function parseLocalDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const dayIndex = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayIndex);
  return start;
}

export function formatDateForApiRange(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getResidentByCredentials(username: string, password: string): Resident | undefined {
  const resident = db
    .prepare('SELECT * FROM residents WHERE login = ?')
    .get(username) as Resident | undefined;

  if (!resident) {
    return undefined;
  }

  if (!bcrypt.compareSync(password, resident.password_hash)) {
    return undefined;
  }

  return resident;
}

export function validateBookingInterval(input: BookingInput): BookingValidationError | null {
  const start = parseLocalDateTime(input.date, input.startTime);
  const end = parseLocalDateTime(input.date, input.endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;

  if (durationMinutes <= 0) {
    return { code: 'INVALID_DURATION', message: 'Booking end time must be later than the start time.' };
  }

  const openingStartMinutes = start.getHours() * 60 + start.getMinutes();
  const openingEndMinutes = end.getHours() * 60 + end.getMinutes();

  if (openingStartMinutes < OPENING_HOUR_START || openingEndMinutes > OPENING_HOUR_END) {
    return { code: 'OUTSIDE_OPENING_HOURS', message: 'Bookings must be between 08:00 and 20:00.' };
  }

  return null;
}

export function getBookingList(from: string, to: string): Booking[] {
  return getBookingsInRange(from, to);
}

export function getWeeklyQuotaForResident(residentId: number) {
  const weekStart = getWeekStart(new Date());
  const usedMinutes = getResidentQuota(residentId, formatDateForApiRange(weekStart));
  const remainingMinutes = Math.max(0, WEEKLY_QUOTA_MINUTES - usedMinutes);

  return {
    usedMinutes,
    remainingMinutes,
    totalMinutes: WEEKLY_QUOTA_MINUTES,
  };
}

export function addBookingForResident(residentId: number, input: BookingInput) {
  const validationError = validateBookingInterval(input);
  if (validationError) {
    throw new Error(JSON.stringify(validationError));
  }

  const start = parseLocalDateTime(input.date, input.startTime);
  const end = parseLocalDateTime(input.date, input.endTime);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  const resident = getResidentById(residentId);
  if (!resident) {
    throw new Error(JSON.stringify({ code: 'INVALID_RESIDENT', message: 'Resident not found.' }));
  }

  const weekStart = getWeekStart(start);
  const weekStartIso = formatDateForApiRange(weekStart);
  const usedMinutes = getResidentQuota(residentId, weekStartIso);

  if (usedMinutes + durationMinutes > WEEKLY_QUOTA_MINUTES) {
    throw new Error(JSON.stringify({ code: 'WEEKLY_QUOTA_EXCEEDED', message: 'This booking would exceed the resident weekly quota.' }));
  }

  const startIso = `${input.date}T${input.startTime}:00`;
  const endIso = `${input.date}T${input.endTime}:00`;

  if (hasBookingOverlap(residentId, startIso, endIso)) {
    throw new Error(JSON.stringify({ code: 'BOOKING_OVERLAP', message: 'This time overlaps an existing booking.' }));
  }

  const details = createBookingForResident(residentId, startIso, endIso, durationMinutes);
  const booking = db.prepare('SELECT b.*, r.display_name AS resident_name FROM bookings b JOIN residents r ON r.id = b.resident_id WHERE b.id = ?').get(details.lastInsertRowid) as Booking;

  return booking;
}

export function toBookingError(error: unknown): BookingValidationError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  try {
    const parsed = JSON.parse(error.message) as BookingValidationError;
    if (parsed && typeof parsed.code === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
