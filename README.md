# Chatbot

A full-stack AI chatbot built with Next.js 15 and Google's Gemini API. Supports multi-turn conversations, file and image uploads, real-time streaming responses, and persistent chat history for signed-in users — all wrapped in a clean dark UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## Features

### Streaming Responses
The chatbot streams its replies in real time, character by character — similar to how ChatGPT displays text. This is achieved by reading a `ReadableStream` from the Gemini API and draining it into the UI using `requestAnimationFrame` for a smooth typing effect that never lags behind.

### File & Image Uploads
Users can attach files directly to their messages. The chatbot handles them differently depending on type:
- **Images and PDFs** are sent to Gemini as base64-encoded inline data, allowing the model to visually analyze the content
- **Text files** (`.txt`, `.csv`, `.json`, `.md`, etc.) are injected as readable content into the message, so Gemini can read and reason about them

### Google OAuth & Anonymous Mode
Authentication is built with NextAuth v5 and Google OAuth. There are two modes:
- **Anonymous** — anyone can open the app and start chatting immediately, no account required. Conversations exist only for the duration of the session and are never saved
- **Signed in** — users who log in with Google get their chat history saved to a database, accessible from any device at any time

The sidebar shows a "Sign in with Google" prompt to anonymous users, and a user profile with sign-out for authenticated ones.

### Persistent Chat History
Signed-in users get a full chat history sidebar with:
- Conversations grouped by date (Today, Yesterday, Previous 7 days, Older)
- Search across all past conversations
- Ability to delete individual chats
- Instant switching between conversations

Each conversation is stored in a PostgreSQL database (hosted on [Neon](https://neon.tech)) via Prisma ORM. Messages are saved as soon as the AI finishes responding.

### Animated UI
- The input field starts **centered on screen** (like Claude's interface) and smoothly animates to the bottom when the first message is sent
- Messages fade and slide in as they appear
- The sidebar slides in and out with a smooth width transition
- The AI's streamed text has an adaptive typing speed — faster when there's a lot buffered, slower when catching up — so it always feels natural

---

## Note on Model Availability

By default, this chatbot uses **Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite-preview`), which is a newer preview model with very high demand. Because of this, you may occasionally receive a `503 Service Unavailable` error instead of a response — this is not a bug, it simply means Google's servers are overloaded for that model at that moment. Waiting a few seconds and retrying usually resolves it.

If you want a more stable experience, you can switch to a different model by setting the `GEMINI_MODEL` environment variable to `gemini-2.0-flash`, which is more widely available.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| AI | Google Gemini API via `@google/generative-ai` |
| Auth | NextAuth v5 with Google OAuth + `@auth/prisma-adapter` |
| Database | PostgreSQL on [Neon](https://neon.tech) |
| ORM | Prisma v5 |
| Styling | Tailwind CSS v3 |
| Deployment | Vercel |

---

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Olehbk/chatbot)

You will need:
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- A **PostgreSQL database** — free tier at [Neon](https://neon.tech) works perfectly
- **Google OAuth credentials** from [Google Cloud Console](https://console.cloud.google.com) (APIs & Services → Credentials → OAuth 2.0 Client ID)
- An **AUTH_SECRET** — generate one with `openssl rand -base64 32`

Set the following environment variables in Vercel:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | Model ID, e.g. `gemini-2.0-flash` |
| `DATABASE_URL` | PostgreSQL connection string from Neon |
| `AUTH_SECRET` | Random secret for session encryption |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_URL` | Your Vercel deployment URL, e.g. `https://your-app.vercel.app` |
