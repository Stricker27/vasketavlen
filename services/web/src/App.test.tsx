import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

test('renders the login screen and allows switching language', () => {
  render(<App />);

  expect(screen.getByText(/log ind i vasketavlen/i)).toBeInTheDocument();
  expect(screen.getByText(/demokonti/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/sprog/i), { target: { value: 'en' } });

  expect(screen.getByText(/sign in to vasketavlen/i)).toBeInTheDocument();
  expect(screen.getByText(/demo accounts/i)).toBeInTheDocument();
});
