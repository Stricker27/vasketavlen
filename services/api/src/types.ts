export type Resident = {
  id: number;
  login: string;
  display_name: string;
  password_hash: string;
  created_at: string;
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

export type BookingInput = {
  date: string;
  startTime: string;
  endTime: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type BookingErrorCode =
  | 'INVALID_DURATION'
  | 'OUTSIDE_OPENING_HOURS'
  | 'BOOKING_OVERLAP'
  | 'WEEKLY_QUOTA_EXCEEDED';

export type BookingValidationError = {
  code: BookingErrorCode;
  message: string;
};
