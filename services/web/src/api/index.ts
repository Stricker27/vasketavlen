import { mockClient } from './mockData';
import type { Booking, BookingInput, Quota, Resident } from '../types';

export interface ApiClient {
  login: (credentials: { username: string; password: string }) => Promise<Resident>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<Resident | null>;
  getBookings: (params: { from: string; to: string }) => Promise<Booking[]>;
  getQuota: () => Promise<Quota>;
  createBooking: (booking: BookingInput) => Promise<Booking>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed.' } }));
    throw new Error(error.error?.message ?? 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export const api: ApiClient = USE_MOCK ? mockClient : {
  async login(credentials) {
    return fetchJson<Resident>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  async logout() {
    await fetchJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  },
  async getCurrentUser() {
    try {
      return await fetchJson<Resident>('/api/me');
    } catch {
      return null;
    }
  },
  async getBookings(params) {
    const query = new URLSearchParams(params);
    return fetchJson<Booking[]>(`/api/bookings?${query.toString()}`);
  },
  async getQuota() {
    return fetchJson<Quota>('/api/me/quota');
  },
  async createBooking(booking) {
    return fetchJson<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },
};
