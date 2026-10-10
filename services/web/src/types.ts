export type Resident = {
  id: number;
  login: string;
  displayName: string;
};

export type Booking = {
  id: number;
  resident_id: number;
  resident_name: string;
  start: string;
  end: string;
  duration_minutes: number;
  created_at: string;
};

export type Quota = {
  usedMinutes: number;
  remainingMinutes: number;
  totalMinutes: number;
};

export type BookingInput = {
  date: string;
  startTime: string;
  endTime: string;
};
