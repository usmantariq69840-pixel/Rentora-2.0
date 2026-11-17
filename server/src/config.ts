import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-secret',
  /** Optional: a key in .env is used when no key has been saved from the website's AI settings page. */
  geminiApiKey: (process.env.GEMINI_API_KEY ?? '').trim(),
  /** Only changed by the automated tests, which point this at a local fake Gemini server. */
  geminiBaseUrl: (process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com').replace(/\/+$/, ''),
  isProduction: process.env.NODE_ENV === 'production',
};
