import {
  Button,
  Card,
  CardHeader,
  FluentProvider,
  Input,
  Text,
  webLightTheme,
} from '@fluentui/react-components';
import { CalendarMonthRegular, PersonCircleRegular } from '@fluentui/react-icons';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Booking, BookingInput, Quota, Resident } from './types';

type Language = 'da' | 'en';

const DEMO_ACCOUNTS = [
  { username: 'alice', password: 'password123' },
  { username: 'bruno', password: 'password123' },
  { username: 'cecilie', password: 'password123' },
];

const translations = {
  da: {
    language: 'Sprog',
    signInTitle: 'Log ind i Vasketavlen',
    signInSubtitle: 'Beboere kan reservere vasketid for de næste 30 dage.',
    username: 'Brugernavn',
    password: 'Adgangskode',
    signIn: 'Log ind',
    demoAccounts: 'Demokonti',
    sharedBoard: 'Fælles vaskebord',
    logout: 'Log ud',
    quota: 'Denne uges kvote',
    minutes: 'min',
    left: 'tilbage',
    loading: 'Indlæser...',
    minutesUsed: 'minutter brugt',
    selectedBooking: 'Valgt booking',
    chooseTimes: 'Vælg tidspunkter',
    date: 'Dato',
    start: 'Start',
    end: 'Slut',
    duration: 'Varighed',
    invalidSelection: 'Ugyldigt valg',
    createBooking: 'Opret booking',
    next30Days: 'Næste 30 dage',
    available: 'Ledig',
    bookedBy: 'Booket af',
    signedInAs: 'Logget ind som',
    loggedOut: 'Logget ud.',
    bookingConfirmed: 'Booking bekræftet for',
    unableToSignIn: 'Kunne ikke logge ind.',
    unableToBook: 'Kunne ikke oprette booking.',
    invalidCredentials: 'Ugyldige loginoplysninger.',
  },
  en: {
    language: 'Language',
    signInTitle: 'Sign in to Vasketavlen',
    signInSubtitle: 'Residents can reserve laundry time for the next 30 days.',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign in',
    demoAccounts: 'Demo accounts',
    sharedBoard: 'Shared laundry booking board',
    logout: 'Log out',
    quota: "This week's quota",
    minutes: 'min',
    left: 'left',
    loading: 'Loading...',
    minutesUsed: 'minutes used',
    selectedBooking: 'Selected booking',
    chooseTimes: 'Choose times',
    date: 'Date',
    start: 'Start',
    end: 'End',
    duration: 'Duration',
    invalidSelection: 'Invalid selection',
    createBooking: 'Create booking',
    next30Days: 'Next 30 days',
    available: 'Available',
    bookedBy: 'Booked by',
    signedInAs: 'Signed in as',
    loggedOut: 'Logged out successfully.',
    bookingConfirmed: 'Booking confirmed for',
    unableToSignIn: 'Unable to sign in.',
    unableToBook: 'Unable to create booking.',
    invalidCredentials: 'Invalid credentials.',
  },
} as const;

const defaultBooking: BookingInput = {
  date: formatDate(new Date()),
  startTime: '09:00',
  endTime: '10:00',
};

export function App() {
  const [language, setLanguage] = useState<Language>('da');
  const [user, setUser] = useState<Resident | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loginForm, setLoginForm] = useState({ username: 'alice', password: 'password123' });
  const [bookingForm, setBookingForm] = useState<BookingInput>(defaultBooking);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const t = translations[language];
  const locale = language === 'da' ? 'da-DK' : 'en-GB';

  useEffect(() => {
    void refreshSession();
  }, []);

  const days = useMemo(() => buildCalendarDays(30), []);

  async function refreshSession() {
    const currentUser = await api.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      await refreshBookingData();
    }
  }

  async function refreshBookingData() {
    const from = formatDate(addDays(new Date(), -1));
    const to = formatDate(addDays(new Date(), 29));
    const [bookingData, quotaData] = await Promise.all([
      api.getBookings({ from, to }),
      api.getQuota(),
    ]);

    setBookings(bookingData);
    setQuota(quotaData);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      const resident = await api.login({
        username: loginForm.username,
        password: loginForm.password,
      });
      setUser(resident);
      setStatusMessage(`${t.signedInAs} ${resident.displayName}.`);
      await refreshBookingData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : t.unableToSignIn;
      setError(message);
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setQuota(null);
    setBookings([]);
    setStatusMessage(t.loggedOut);
  }

  async function handleBookingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      const result = await api.createBooking(bookingForm);
      setStatusMessage(`${t.bookingConfirmed} ${result.resident_name}.`);
      await refreshBookingData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : t.unableToBook;
      setError(message);
    }
  }

  const durationMinutes = calculateDurationMinutes(bookingForm.startTime, bookingForm.endTime);

  if (!user) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className="page-shell login-shell">
          <div className="language-picker login-language-picker">
            <label htmlFor="language-select">{t.language}</label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              <option value="da">Dansk</option>
              <option value="en">English</option>
            </select>
          </div>

          <Card className="login-card">
            <CardHeader
              header={<Text weight="semibold" size={900}>{t.signInTitle}</Text>}
              description={<Text>{t.signInSubtitle}</Text>}
            />
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                {t.username}
                <Input value={loginForm.username} onChange={(_, data) => setLoginForm((current) => ({ ...current, username: data.value }))} />
              </label>
              <label>
                {t.password}
                <Input type="password" value={loginForm.password} onChange={(_, data) => setLoginForm((current) => ({ ...current, password: data.value }))} />
              </label>
              <Button appearance="primary" type="submit">{t.signIn}</Button>
            </form>

            <div className="demo-box">
              <Text weight="semibold">{t.demoAccounts}</Text>
              <ul>
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.username}>
                    {account.username} / {account.password}
                  </li>
                ))}
              </ul>
            </div>
            {error ? <div className="notice error">{error}</div> : null}
          </Card>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="page-shell">
        <header className="topbar">
          <div className="brand-wrap">
            <CalendarMonthRegular className="brand-icon" />
            <div>
              <Text weight="semibold" size={700}>Vasketavlen</Text>
              <Text block>{t.sharedBoard}</Text>
            </div>
          </div>

          <div className="profile-wrap">
            <div className="language-picker">
              <label htmlFor="language-select-topbar">{t.language}</label>
              <select
                id="language-select-topbar"
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="da">Dansk</option>
                <option value="en">English</option>
              </select>
            </div>

            <PersonCircleRegular className="profile-icon" />
            <span>{user.displayName}</span>
            <Button appearance="secondary" onClick={handleLogout}>{t.logout}</Button>
          </div>
        </header>

        <main className="main-panel">
          <section className="summary-row">
            <Card className="summary-card">
              <Text weight="semibold">{t.quota}</Text>
              <Text size={900}>{quota ? `${quota.remainingMinutes} ${t.minutes} ${t.left}` : t.loading}</Text>
              <Text>{quota ? `${quota.usedMinutes} / ${quota.totalMinutes} ${t.minutesUsed}` : ''}</Text>
            </Card>
            <Card className="summary-card">
              <Text weight="semibold">{t.selectedBooking}</Text>
              <Text size={900}>{durationMinutes > 0 ? `${durationMinutes} ${t.minutes}` : t.chooseTimes}</Text>
              <Text>{bookingForm.date} {bookingForm.startTime} - {bookingForm.endTime}</Text>
            </Card>
          </section>

          <div className="content-grid">
            <Card className="booking-card">
              <CardHeader header={<Text weight="semibold">{t.createBooking}</Text>} />
              <form className="booking-form" onSubmit={handleBookingSubmit}>
                <label>
                  {t.date}
                  <Input type="date" value={bookingForm.date} onChange={(_, data) => setBookingForm((current) => ({ ...current, date: data.value }))} />
                </label>
                <div className="time-row">
                  <label>
                    {t.start}
                    <Input type="time" value={bookingForm.startTime} onChange={(_, data) => setBookingForm((current) => ({ ...current, startTime: data.value }))} />
                  </label>
                  <label>
                    {t.end}
                    <Input type="time" value={bookingForm.endTime} onChange={(_, data) => setBookingForm((current) => ({ ...current, endTime: data.value }))} />
                  </label>
                </div>
                <Text>{t.duration}: {durationMinutes > 0 ? `${durationMinutes} ${t.minutes}` : t.invalidSelection}</Text>
                <Button appearance="primary" type="submit" disabled={durationMinutes <= 0}>{t.createBooking}</Button>
              </form>
              {error ? <div className="notice error">{error}</div> : null}
              {statusMessage ? <div className="notice success">{statusMessage}</div> : null}
            </Card>

            <Card className="calendar-card">
              <CardHeader header={<Text weight="semibold">{t.next30Days}</Text>} />
              <div className="calendar-grid">
                {days.map((day) => {
                  const dayBookings = bookings.filter((booking) => booking.start.startsWith(formatDate(day)));
                  return (
                    <div key={formatDate(day)} className="day-panel">
                      <Text weight="semibold">{day.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</Text>
                      {dayBookings.length === 0 ? <span className="available">{t.available}</span> : dayBookings.map((booking) => (
                        <div key={booking.id} className="booking-pill">
                          <strong>{booking.resident_name}</strong>
                          <span>{booking.start.slice(11, 16)}–{booking.end.slice(11, 16)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </FluentProvider>
  );
}

function buildCalendarDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let index = 0; index < count; index += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    days.push(day);
  }
  return days;
}

function addDays(date: Date, count: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    return 0;
  }

  const start = new Date(`2024-01-01T${startTime}:00`);
  const end = new Date(`2024-01-01T${endTime}:00`);
  const minutes = (end.getTime() - start.getTime()) / 60000;
  return minutes > 0 ? minutes : 0;
}
