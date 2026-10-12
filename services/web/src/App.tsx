import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Booking, BookingInput, Quota, Resident } from './types';

type Language = 'da' | 'en';
type Tab = 'oversigt' | 'booking' | 'maskiner' | 'profil';

const DEMO_ACCOUNTS = [
  { username: 'alice', password: 'password123', label: 'Alice (Lejl. 12)' },
  { username: 'bruno', password: 'password123', label: 'Bruno (Lejl. 14)' },
  { username: 'cecilie', password: 'password123', label: 'Cecilie (Lejl. 18)' },
];

const translations = {
  da: {
    language: 'Sprog',
    signInTitle: 'Log ind i Vasketavlen',
    signInSubtitle: 'Beboere kan reservere vasketid for de næste 30 dage.',
    username: 'Brugernavn',
    usernameOrEmail: 'Brugernavn eller E-mail',
    password: 'Adgangskode',
    signIn: 'Log ind',
    demoAccounts: 'Demokonti',
    overview: 'Oversigt',
    booking: 'Booking',
    machines: 'Maskiner',
    profile: 'Profil',
    address: 'Nordborggade 36, 8000 Aarhus C',
    needWashToday: 'Brug for at vaske i dag?',
    bookNow: 'Reserver vasketid',
    weeklyQuota: 'Ugens vaskekvote',
    minutesUsed: 'minutter brugt',
    minutesLeft: 'min tilbage',
    myBookings: 'Dine aktive bookinger',
    noBookings: 'Du har ingen aktive bookinger',
    machineStatusNow: 'Maskinestatus lige nu',
    occupied: 'Optaget',
    available: 'Ledig',
    minLeft: 'min tilbage',
    reserveSlot: 'Reserver tid',
    date: 'Dato',
    startTime: 'Starttidspunkt',
    endTime: 'Sluttidspunkt',
    duration: 'Varighed',
    min: 'min',
    confirmBooking: 'Bekræft reservation',
    bookingsOnDate: 'Bookinger på denne dato',
    noBookingsOnDate: 'Ingen bookinger denne dag - alt er ledigt!',
    equipmentOverview: 'Vaskeriets maskiner',
    filterTip: 'Tip: Husk at tømme fnugfilteret i tørretumbleren efter brug.',
    apartment: 'Lejlighed',
    rules: 'Regler for vaskeriet',
    rule1: 'Vis hensyn og tøm maskinen umiddelbart efter programmet er slut.',
    rule2: 'Vask er tilladt mellem kl. 07:00 og 22:00.',
    rule3: 'Husk altid at efterlade vaskerummet pænt og ryddeligt.',
    signOut: 'Log ud',
    loggedOut: 'Du er nu logget ud.',
    bookingSuccess: 'Reservation bekræftet!',
    bookingError: 'Kunne ikke oprette reservation.',
    authError: 'Forkert brugernavn eller adgangskode.',
    toastMessage: 'Vaskemaskine 2 er færdig om 10 min',
    previousDays: 'Forrige dage',
    nextDays: 'Næste dage',
    page: 'Side',
    of: 'af',
    maxAdvanceBooking: 'Du kan kun reservere en vasketid op til 30 dage frem i tiden.',
    slotAlreadyBooked: 'Tidspunktet overlapper med en eksisterende reservation.',
    slotAlreadyBookedBy: 'Tidspunktet er allerede reserveret af',
    slotOccupied: 'Tidspunktet er optaget',
  },
  en: {
    language: 'Language',
    signInTitle: 'Sign in to Vasketavlen',
    signInSubtitle: 'Residents can reserve laundry slots for the next 30 days.',
    username: 'Username',
    usernameOrEmail: 'Username or email',
    password: 'Password',
    signIn: 'Sign in',
    demoAccounts: 'Demo accounts',
    overview: 'Overview',
    booking: 'Booking',
    machines: 'Machines',
    profile: 'Profile',
    address: 'Nordborggade 36, 8000 Aarhus C',
    needWashToday: 'Need to do laundry today?',
    bookNow: 'Reserve slot',
    weeklyQuota: 'Weekly wash quota',
    minutesUsed: 'minutes used',
    minutesLeft: 'min left',
    myBookings: 'Your active bookings',
    noBookings: 'You have no active bookings',
    machineStatusNow: 'Machine status right now',
    occupied: 'Occupied',
    available: 'Available',
    minLeft: 'min left',
    reserveSlot: 'Reserve slot',
    date: 'Date',
    startTime: 'Start time',
    endTime: 'End time',
    duration: 'Duration',
    min: 'min',
    confirmBooking: 'Confirm reservation',
    bookingsOnDate: 'Bookings on this date',
    noBookingsOnDate: 'No bookings on this day - completely open!',
    equipmentOverview: 'Laundry machines',
    filterTip: 'Tip: Remember to clean the dryer lint filter after every use.',
    apartment: 'Apartment',
    rules: 'Laundry rules',
    rule1: 'Be considerate and empty the machine promptly when done.',
    rule2: 'Laundry is permitted between 07:00 and 22:00.',
    rule3: 'Always leave the laundry room clean and tidy.',
    signOut: 'Sign out',
    loggedOut: 'You have been logged out.',
    bookingSuccess: 'Reservation confirmed!',
    bookingError: 'Could not create reservation.',
    authError: 'Invalid username or password.',
    toastMessage: 'Washing machine 2 finishes in 10 min',
    previousDays: 'Previous days',
    nextDays: 'Next days',
    page: 'Page',
    of: 'of',
    maxAdvanceBooking: 'You can only book a slot up to 30 days in advance.',
    slotAlreadyBooked: 'This time slot overlaps with an existing booking.',
    slotAlreadyBookedBy: 'This time slot is already booked by',
    slotOccupied: 'Time slot occupied',
  },
};

const MACHINE_DATA = [
  { id: 'vm1', name: 'Vaskemaskine 1', type: 'washer', status: 'occupied', program: '60°C Bomuld', minutesLeft: 35 },
  { id: 'vm2', name: 'Vaskemaskine 2', type: 'washer', status: 'occupied', program: '40°C Kulørt', minutesLeft: 10 },
  { id: 'vm3', name: 'Vaskemaskine 3', type: 'washer', status: 'available', program: 'Klar til start', minutesLeft: 0 },
  { id: 'vm4', name: 'Vaskemaskine 4', type: 'washer', status: 'available', program: 'Klar til start', minutesLeft: 0 },
  { id: 'tt1', name: 'Tørretumbler 1', type: 'dryer', status: 'occupied', program: 'Skabstørt', minutesLeft: 18 },
  { id: 'tt2', name: 'Tørretumbler 2', type: 'dryer', status: 'available', program: 'Klar til start', minutesLeft: 0 },
];

const defaultBooking: BookingInput = {
  date: formatDate(new Date()),
  startTime: '08:00',
  endTime: '10:00',
};

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('oversigt');
  const [language, setLanguage] = useState<Language>('da');
  const [showToast, setShowToast] = useState(true);

  const [user, setUser] = useState<Resident | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loginForm, setLoginForm] = useState({ username: 'alice', password: 'password123' });
  const [bookingForm, setBookingForm] = useState<BookingInput>(defaultBooking);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = translations[language];
  const locale = language === 'da' ? 'da-DK' : 'en-GB';

  const days = useMemo(() => buildCalendarDays(30), []);
  const minBookingDate = useMemo(() => (days.length > 0 ? formatDate(days[0]) : ''), [days]);
  const maxBookingDate = useMemo(() => (days.length > 0 ? formatDate(days[days.length - 1]) : ''), [days]);

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(days.length / PAGE_SIZE);
  const [calendarPage, setCalendarPage] = useState(0);

  useEffect(() => {
    const idx = days.findIndex((d) => formatDate(d) === bookingForm.date);
    if (idx !== -1) {
      setCalendarPage(Math.floor(idx / PAGE_SIZE));
    }
  }, [bookingForm.date, days]);

  const visibleDays = useMemo(() => {
    const start = calendarPage * PAGE_SIZE;
    return days.slice(start, start + PAGE_SIZE);
  }, [days, calendarPage]);

  const currentMonthLabel = useMemo(() => {
    if (visibleDays.length === 0) return '';
    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    const firstMonth = first.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    const lastMonth = last.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    if (firstMonth === lastMonth) {
      return firstMonth.charAt(0).toUpperCase() + firstMonth.slice(1);
    }
    const firstShort = first.toLocaleDateString(locale, { month: 'short' });
    const lastShort = last.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    return `${firstShort.charAt(0).toUpperCase() + firstShort.slice(1)} – ${lastShort.charAt(0).toUpperCase() + lastShort.slice(1)}`;
  }, [visibleDays, locale]);

  async function refreshBookingData() {
    setIsRefreshing(true);
    try {
      const from = formatDate(addDays(new Date(), -1));
      const to = formatDate(addDays(new Date(), 30));
      const [bookingData, quotaData] = await Promise.all([
        api.getBookings({ from, to }),
        api.getQuota(),
      ]);

      setBookings(bookingData);
      setQuota(quotaData);
    } catch {
      // Keep existing data
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function refreshSession() {
      try {
        const currentUser = await api.getCurrentUser();
        if (!isMounted) return;
        setUser(currentUser);
        if (currentUser) {
          await refreshBookingData();
        }
      } catch {
        // Not logged in
      }
    }
    void refreshSession();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin(event?: React.FormEvent) {
    if (event) event.preventDefault();
    setError('');
    setStatusMessage('');

    try {
      const resident = await api.login({
        username: loginForm.username,
        password: loginForm.password,
      });
      setUser(resident);
      setActiveTab('oversigt');
      await refreshBookingData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : t.authError;
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

  const durationMinutes = calculateDurationMinutes(bookingForm.startTime, bookingForm.endTime);

  const overlappingBooking = useMemo(() => {
    const startIso = `${bookingForm.date}T${bookingForm.startTime}:00`;
    const endIso = `${bookingForm.date}T${bookingForm.endTime}:00`;
    return bookings.find((b) => b.start < endIso && b.end > startIso);
  }, [bookings, bookingForm.date, bookingForm.startTime, bookingForm.endTime]);

  async function handleBookingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (bookingForm.date < minBookingDate || bookingForm.date > maxBookingDate) {
      setError(t.maxAdvanceBooking);
      return;
    }

    if (overlappingBooking) {
      setError(
        overlappingBooking.resident_name
          ? `${t.slotAlreadyBookedBy} ${overlappingBooking.resident_name} (${overlappingBooking.start.slice(11, 16)}–${overlappingBooking.end.slice(11, 16)}).`
          : t.slotAlreadyBooked,
      );
      return;
    }

    try {
      const result = await api.createBooking(bookingForm);
      setStatusMessage(`${t.bookingSuccess} (${result.start.slice(11, 16)}–${result.end.slice(11, 16)})`);
      await refreshBookingData();
      setActiveTab('oversigt');
    } catch (caughtError) {
      let message = t.bookingError;
      if (caughtError instanceof Error) {
        if (caughtError.message.includes('overlap') || caughtError.message.includes('BOOKING_OVERLAP') || caughtError.message.includes('optaget')) {
          message = t.slotAlreadyBooked;
        } else {
          message = caughtError.message;
        }
      }
      setError(message);
    }
  }

  const userBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter((b) => b.resident_id === user.id);
  }, [bookings, user]);

  const selectedDateBookings = useMemo(() => {
    return bookings.filter((b) => b.start.startsWith(bookingForm.date));
  }, [bookings, bookingForm.date]);

  const quotaPercent = useMemo(() => {
    if (!quota || quota.totalMinutes === 0) return 0;
    return Math.min(100, Math.round((quota.usedMinutes / quota.totalMinutes) * 100));
  }, [quota]);

  return (
    <div className="min-h-screen bg-slate-900/15 backdrop-blur-sm flex justify-center items-center p-0 md:p-6 text-slate-800 antialiased font-sans">
      <div className="w-full max-w-md bg-white min-h-screen md:min-h-[880px] md:h-[880px] shadow-2xl md:rounded-[40px] border border-cyan-100/80 flex flex-col relative overflow-hidden">
        {/* Status Bar */}
        <div className="px-6 pt-3 pb-2 flex justify-between items-center text-xs font-bold text-slate-400 select-none bg-white font-mono tracking-tight">
          <span>09:41</span>
          <div className="flex items-center gap-2 font-sans font-normal">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C7.5 3 3.6 4.8 0.8 7.7l1.4 1.4C4.6 6.6 8.1 5 12 5s7.4 1.6 9.8 4.1l1.4-1.4C20.4 4.8 16.5 3 12 3zm0 4C8.6 7 5.6 8.4 3.4 10.7l1.4 1.4C6.5 10.4 9.1 9 12 9s5.5 1.4 7.2 3.1l1.4-1.4C18.4 8.4 15.4 7 12 7zm0 4c-2.2 0-4.2.9-5.7 2.4l1.4 1.4C8.8 13.7 10.3 13 12 13s3.2.7 4.3 1.8l1.4-1.4C16.2 11.9 14.2 11 12 11zm0 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-full bg-slate-400 rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Header - only shown when logged in */}
        {user && (
          <header className="px-5 py-3 border-b border-cyan-100/80 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3.5">
              <img src="/logo-white.png" alt="Vasketavlen logo" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="font-bold text-slate-900 text-lg leading-tight font-display">Vasketavlen</h1>
                <p className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                  <svg className="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t.address}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowToast((prev) => !prev)}
                aria-label="Notifikationer"
                className="relative p-2 text-cyan-800 hover:text-cyan-950 bg-cyan-50 hover:bg-cyan-100 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {showToast && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <button
                onClick={refreshBookingData}
                disabled={isRefreshing}
                aria-label="Opdater data"
                className={`p-2 text-cyan-800 hover:text-cyan-950 bg-cyan-50 hover:bg-cyan-100 rounded-full transition ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24">
          {/* Status / Alert Messages */}
          {error && (
            <div className="m-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-rose-500 font-bold ml-2">&times;</button>
            </div>
          )}

          {statusMessage && (
            <div className="m-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex justify-between items-center">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="text-emerald-600 font-bold ml-2">&times;</button>
            </div>
          )}

          {!user ? (
            /* Login View */
            <div className="p-6 space-y-6">
              <div className="text-center pt-4">
                <img src="/logo-white.png" alt="Logo" className="w-36 h-36 mx-auto mb-4 object-contain" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">{t.signInTitle}</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-sans">{t.signInSubtitle}</p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between p-3 bg-cyan-50/70 rounded-2xl border border-cyan-100">
                <label htmlFor="language-select" className="text-xs font-semibold text-slate-700">
                  {t.language}
                </label>
                <select
                  id="language-select"
                  aria-label={t.language}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-white border border-cyan-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="da">Dansk</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.username}</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.password}</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-600 to-blue-700 hover:from-cyan-600 hover:to-blue-800 text-white font-bold text-sm shadow-md shadow-cyan-500/25 transition active:scale-[0.99]"
                >
                  {t.signIn}
                </button>
              </form>

              {/* Demo Accounts */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">{t.demoAccounts}</p>
                <div className="grid grid-cols-1 gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => {
                        setLoginForm({ username: account.username, password: account.password });
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-cyan-50/50 hover:border-cyan-200 transition text-left"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{account.label}</p>
                        <p className="text-[11px] text-slate-400 font-mono">user: {account.username} / pass: {account.password}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-100 px-2 py-1 rounded-lg">
                        Vælg
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Logged in views */
            <div>
              {/* TAB 1: OVERSIGT */}
              {activeTab === 'oversigt' && (
                <div className="p-5 space-y-5 animate-fadeIn">
                  {/* Hero Quick Action */}
                  <div className="bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 rounded-3xl p-5 text-white shadow-xl shadow-cyan-900/15 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-cyan-100 text-xs font-medium">{t.needWashToday}</p>
                      <h2 className="text-xl font-bold mt-0.5 leading-snug font-display">Hej, {user.displayName}</h2>
                      <p className="text-xs text-cyan-100/90 mt-1">Du har 2 ledige vaskemaskiner lige nu i kælderen.</p>
                      <button
                        onClick={() => setActiveTab('booking')}
                        className="mt-4 px-4 py-2 bg-white text-cyan-700 font-bold rounded-xl text-xs shadow-md hover:bg-cyan-50 transition active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {t.bookNow}
                      </button>
                    </div>
                  </div>

                  {/* Quota Card */}
                  <div className="bg-white rounded-3xl p-4 border border-cyan-100/80 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-700">{t.weeklyQuota}</span>
                      <span className="text-xs font-bold text-cyan-700 font-mono">
                        {quota ? `${quota.usedMinutes} / ${quota.totalMinutes} min` : '120 / 300 min'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${quotaPercent || 40}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-mono">
                      {quota ? `${quota.remainingMinutes} ${t.minutesLeft}` : `180 ${t.minutesLeft}`}
                    </p>
                  </div>

                  {/* Active Bookings */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.myBookings}</h3>
                      <button onClick={() => setActiveTab('booking')} className="text-xs text-cyan-600 font-semibold">
                        + Ny
                      </button>
                    </div>

                    {userBookings.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
                        <p className="text-xs text-slate-400">{t.noBookings}</p>
                      </div>
                    ) : (
                      userBookings.map((b) => (
                        <div key={b.id} className="p-3.5 rounded-2xl bg-cyan-50/40 border border-cyan-100/80 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{b.start.slice(0, 10)}</p>
                              <p className="text-[11px] text-slate-500 font-bold font-mono">
                                {b.start.slice(11, 16)} – {b.end.slice(11, 16)} ({b.duration_minutes} min)
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            Aktiv
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Machine Status Snapshot */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.machineStatusNow}</h3>
                      <button onClick={() => setActiveTab('maskiner')} className="text-xs text-cyan-600 font-semibold">
                        Se alle
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {MACHINE_DATA.slice(0, 4).map((m) => (
                        <div key={m.id} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                          <div>
                            <span className={`inline-block w-2 h-2 rounded-full mb-1.5 ${m.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <p className="text-xs font-bold text-slate-800">{m.name}</p>
                            <p className="text-[11px] text-slate-400">{m.program}</p>
                          </div>
                          <p className={`text-[11px] font-bold mt-2 font-mono ${m.status === 'available' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {m.status === 'available' ? t.available : `${m.minutesLeft} ${t.minLeft}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BOOKING */}
              {activeTab === 'booking' && (
                <div className="p-5 space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">{t.reserveSlot}</h2>
                    <p className="text-xs text-slate-400 font-sans">Vælg dato og tidspunkt for din næste vask</p>
                  </div>

                  {/* Calendar day selector with pagination (up to 30 days ahead) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-bold text-slate-700 capitalize font-display">
                        {currentMonthLabel}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-slate-400">
                        {t.page} {calendarPage + 1} {t.of} {totalPages}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCalendarPage((p) => Math.max(0, p - 1))}
                        disabled={calendarPage === 0}
                        aria-label={t.previousDays}
                        className="h-14 w-8 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-25 disabled:pointer-events-none transition flex-shrink-0 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex-1 grid grid-cols-5 gap-1.5">
                        {visibleDays.map((d) => {
                          const dStr = formatDate(d);
                          const isSelected = bookingForm.date === dStr;
                          const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
                          const dayNum = d.getDate();

                          return (
                            <button
                              key={dStr}
                              type="button"
                              onClick={() => setBookingForm({ ...bookingForm, date: dStr })}
                              className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition ${
                                isSelected
                                  ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-200'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:border-cyan-300 shadow-sm'
                              }`}
                            >
                              <span className="text-[10px] uppercase font-bold tracking-tight opacity-80">{dayName}</span>
                              <span className="text-sm font-bold font-mono mt-0.5">{dayNum}</span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCalendarPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={calendarPage >= totalPages - 1}
                        aria-label={t.nextDays}
                        className="h-14 w-8 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-25 disabled:pointer-events-none transition flex-shrink-0 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Booking Form */}
                  <form onSubmit={handleBookingSubmit} className="bg-white rounded-3xl p-5 border border-cyan-100 shadow-sm space-y-4">
                    <div>
                      <label htmlFor="booking-date" className="block text-xs font-semibold text-slate-700 mb-1">{t.date}</label>
                      <input
                        id="booking-date"
                        type="date"
                        min={minBookingDate}
                        max={maxBookingDate}
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="booking-start-time" className="block text-xs font-semibold text-slate-700 mb-1">{t.startTime}</label>
                        <select
                          id="booking-start-time"
                          value={bookingForm.startTime}
                          onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        >
                          {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="booking-end-time" className="block text-xs font-semibold text-slate-700 mb-1">{t.endTime}</label>
                        <select
                          id="booking-end-time"
                          value={bookingForm.endTime}
                          onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        >
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 bg-cyan-50/60 p-2.5 rounded-xl">
                      <span>{t.duration}:</span>
                      <strong className="text-cyan-700 font-mono font-bold text-sm">{durationMinutes} {t.min}</strong>
                    </div>

                    {overlappingBooking && (
                      <div className="flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                        <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="font-bold">{t.slotOccupied}</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            {overlappingBooking.resident_name
                              ? `${t.slotAlreadyBookedBy} ${overlappingBooking.resident_name} (${overlappingBooking.start.slice(11, 16)}–${overlappingBooking.end.slice(11, 16)})`
                              : t.slotAlreadyBooked}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={durationMinutes <= 0 || Boolean(overlappingBooking)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-600 to-blue-700 hover:from-cyan-600 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-cyan-500/25 transition active:scale-[0.99] disabled:opacity-50"
                    >
                      {overlappingBooking ? t.slotOccupied : t.confirmBooking}
                    </button>
                  </form>

                  {/* Day overview */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.bookingsOnDate} ({bookingForm.date})</h3>
                    {selectedDateBookings.length === 0 ? (
                      <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 text-center">
                        {t.noBookingsOnDate}
                      </p>
                    ) : (
                      selectedDateBookings.map((b) => (
                        <div key={b.id} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{b.resident_name}</p>
                            <p className="text-[11px] text-slate-500 font-bold font-mono">{b.start.slice(11, 16)} – {b.end.slice(11, 16)}</p>
                          </div>
                          <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {b.duration_minutes} min
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MASKINER */}
              {activeTab === 'maskiner' && (
                <div className="p-5 space-y-4 animate-fadeIn">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">{t.equipmentOverview}</h2>
                    <p className="text-xs text-slate-400">Realtidsstatus på vaskeriets udstyr</p>
                  </div>

                  <div className="space-y-2.5">
                    {MACHINE_DATA.map((m) => (
                      <div key={m.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" strokeWidth="2" />
                              <circle cx="12" cy="12" r="4" strokeWidth="2" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{m.name}</p>
                            <p className="text-[11px] text-slate-400">{m.program}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[11px] font-bold font-mono px-2.5 py-1 rounded-full ${m.status === 'available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {m.status === 'available' ? t.available : `${m.minutesLeft} ${t.minLeft}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-cyan-100 text-xs text-slate-600 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t.filterTip}</span>
                  </div>
                </div>
              )}

              {/* TAB 4: PROFIL */}
              {activeTab === 'profil' && (
                <div className="p-5 space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-cyan-50/60 border border-cyan-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-cyan-200">
                      {user.displayName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{user.displayName}</h2>
                      <p className="text-xs text-slate-500">@{user.login} &bull; Nordborggade 36</p>
                    </div>
                  </div>

                  {/* Settings / Language */}
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="profile-lang-select" className="text-xs font-semibold text-slate-700">
                        {t.language}
                      </label>
                      <select
                        id="profile-lang-select"
                        aria-label={t.language}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="da">Dansk</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">Kvote grænse</span>
                      <span className="text-xs text-slate-500 font-medium">300 minutter / uge</span>
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2">
                    <h3 className="text-xs font-bold text-slate-800">{t.rules}</h3>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      <li>{t.rule1}</li>
                      <li>{t.rule2}</li>
                      <li>{t.rule3}</li>
                    </ul>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t.signOut}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Floating Notification Toast */}
        {user && showToast && (
          <div className="absolute bottom-20 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-2xl flex items-center justify-between shadow-xl shadow-slate-900/20 border border-slate-800 animate-slide-up z-30">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span>{t.toastMessage}</span>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Luk besked"
            >
              &times;
            </button>
          </div>
        )}

        {/* Bottom Tab Navigation */}
        {user && (
          <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-cyan-100/80 px-6 py-2.5 flex justify-between items-center z-20">
            <button
              onClick={() => setActiveTab('oversigt')}
              className={`flex flex-col items-center gap-1 transition ${activeTab === 'oversigt' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-[10px] font-semibold tracking-tight">{t.overview}</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex flex-col items-center gap-1 transition ${activeTab === 'booking' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-semibold tracking-tight">{t.booking}</span>
            </button>

            <button
              onClick={() => setActiveTab('maskiner')}
              className={`flex flex-col items-center gap-1 transition ${activeTab === 'maskiner' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" strokeWidth="2" />
              </svg>
              <span className="text-[10px] font-semibold tracking-tight">{t.machines}</span>
            </button>

            <button
              onClick={() => setActiveTab('profil')}
              className={`flex flex-col items-center gap-1 transition ${activeTab === 'profil' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] font-semibold tracking-tight">{t.profile}</span>
            </button>
          </nav>
        )}
      </div>
    </div>
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
