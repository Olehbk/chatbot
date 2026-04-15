import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash';

/** Returns a Gemini client. Throws at request-time (not build-time) if the key is missing. */
export function getGenAI(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your API key.'
    );
  }
  return new GoogleGenerativeAI(key);
}
