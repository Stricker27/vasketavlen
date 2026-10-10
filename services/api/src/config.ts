import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export const config = {
  port: Number(env.PORT ?? '3001'),
  sessionSecret: env.SESSION_SECRET ?? 'dev-session-secret',
  databasePath: env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data', 'vasketavlen.sqlite'),
  frontendUrl: env.FRONTEND_URL ?? 'http://localhost:5173',
  appTimezone: env.APP_TIMEZONE ?? 'Europe/Copenhagen',
};
