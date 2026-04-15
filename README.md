# Chatbot

A full-stack AI chatbot built with Next.js 15 and Google's Gemini API. Supports multi-turn conversations, file/image uploads, streaming responses, and persistent chat history for signed-in users.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

- **Streaming responses** — text appears word by word, like ChatGPT
- **File & image uploads** — attach photos, PDFs, or text files for Gemini to analyze
- **Google OAuth** — sign in with Google to save and revisit chat history
- **Anonymous mode** — chat without signing in; history is not saved
- **Persistent chat history** — conversations are grouped by date in the sidebar
- **Dark UI** — clean dark interface with smooth animations

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Auth:** NextAuth v5 with Google OAuth
- **Database:** PostgreSQL via [Neon](https://neon.tech) + Prisma ORM
- **Styling:** Tailwind CSS v3

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Olehbk/chatbot.git
cd chatbot
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Get from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | Model ID, e.g. `gemini-2.0-flash` |
| `DATABASE_URL` | PostgreSQL connection string (e.g. from [Neon](https://neon.tech)) |
| `AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

To create Google OAuth credentials, go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push the repo to GitHub
2. Import it in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` in **Settings → Environment Variables**
4. Add your Vercel domain to the Google OAuth client's authorized redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Add `AUTH_URL=https://your-app.vercel.app` as an environment variable in Vercel

Vercel will run `prisma generate` automatically via the `postinstall` script.
