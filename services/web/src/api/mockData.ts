import type { Booking, BookingInput, Quota, Resident } from '../types';

export type MockApiClient = {
  login: (credentials: { username: string; password: string }) => Promise<Resident>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<Resident | null>;
  getBookings: (params: { from: string; to: string }) => Promise<Booking[]>;
  getQuota: () => Promise<Quota>;
  createBooking: (booking: BookingInput) => Promise<Booking>;
};

const sampleResidents: Resident[] = [
  { id: 1, login: 'alice', displayName: 'Alice Sørensen' },
  { id: 2, login: 'bruno', displayName: 'Bruno Hansen' },
  { id: 3, login: 'cecilie', displayName: 'Cecilie Madsen' },
];

const today = new Date();
const makeBooking = (id: number, residentId: number, dayOffset: number, startHour: number, durationMinutes: number): Booking => {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  return {
    id,
    resident_id: residentId,
    resident_name: sampleResidents[residentId - 1]?.displayName ?? 'Resident',
    start: toISOStringNoMs(start),
    end: toISOStringNoMs(end),
    duration_minutes: durationMinutes,
    created_at: new Date().toISOString(),
  };
};

const mockBookings: Booking[] = [
  makeBooking(1, 1, 0, 9, 120),
  makeBooking(2, 2, 1, 10, 90),
  makeBooking(3, 3, 3, 13, 150),
];

export const mockClient: MockApiClient = {
  async login({ username, password }) {
    const resident = sampleResidents.find((item) => item.login === username && password === 'password123');
    if (!resident) {
      throw new Error('Invalid credentials');
    }
    return resident;
  },
  async logout() {
    return;
  },
  async getCurrentUser() {
    return sampleResidents[0];
  },
  async getBookings() {
    return mockBookings;
  },
  async getQuota() {
    return { usedMinutes: 120, remainingMinutes: 240, totalMinutes: 360 };
  },
  async createBooking(booking) {
    const startIso = `${booking.date}T${booking.startTime}:00`;
    const endIso = `${booking.date}T${booking.endTime}:00`;

    const hasOverlap = mockBookings.some((b) => b.start < endIso && b.end > startIso);
    if (hasOverlap) {
      throw new Error('Tidspunktet overlapper med en eksisterende reservation.');
    }

    const duration = Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
    const newBooking: Booking = {
      id: Date.now(),
      resident_id: 1,
      resident_name: 'Alice Sørensen',
      start: startIso,
      end: endIso,
      duration_minutes: duration,
      created_at: new Date().toISOString(),
    };
    mockBookings.push(newBooking);
    return newBooking;
  },
};

function toISOStringNoMs(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 19);
}
