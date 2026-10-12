import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { App } from './App';
import { api } from './api';

test('renders the login screen and allows switching language', () => {
  render(<App />);

  expect(screen.getByText(/log ind i vasketavlen/i)).toBeInTheDocument();
  expect(screen.getByText(/demokonti/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/sprog/i), { target: { value: 'en' } });

  expect(screen.getByText(/sign in to vasketavlen/i)).toBeInTheDocument();
  expect(screen.getByText(/demo accounts/i)).toBeInTheDocument();
});

test('allows paginating through 30 days in booking calendar and enforces 30 days on date picker', async () => {
  vi.spyOn(api, 'getCurrentUser').mockResolvedValue({
    id: 1,
    login: 'alice',
    displayName: 'Alice Test',
  });
  vi.spyOn(api, 'getBookings').mockResolvedValue([]);
  vi.spyOn(api, 'getQuota').mockResolvedValue({
    usedMinutes: 60,
    remainingMinutes: 240,
    totalMinutes: 300,
  });

  render(<App />);

  const bookingTab = await screen.findByRole('button', { name: /booking/i });
  fireEvent.click(bookingTab);

  expect(screen.getByText(/side 1 af 6/i)).toBeInTheDocument();

  const prevBtn = screen.getByRole('button', { name: /forrige dage/i });
  const nextBtn = screen.getByRole('button', { name: /næste dage/i });

  expect(prevBtn).toBeDisabled();
  expect(nextBtn).toBeEnabled();

  fireEvent.click(nextBtn);
  expect(screen.getByText(/side 2 af 6/i)).toBeInTheDocument();
  expect(prevBtn).toBeEnabled();

  const dateInput = screen.getByLabelText(/dato/i) as HTMLInputElement;
  expect(dateInput).toHaveAttribute('min');
  expect(dateInput).toHaveAttribute('max');
});
