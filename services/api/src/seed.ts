import { initializeDatabase, seedDemoResidentsAndBookings } from './db.js';

initializeDatabase();
seedDemoResidentsAndBookings();
console.log('Seeded demo residents and sample bookings.');
