# Gauge

A personal finance tracker - subscriptions, everyday expenses, and per-category budgets in one place, with an AI-generated spending insight. Next.js + Supabase (Postgres + Auth) + Magic UI, deployed on Vercel.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier is fine).
2. Once it's ready, open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates the `subscriptions`, `expenses`, `budgets`, `ai_insights`, `debts`, `user_settings`, and `debt_advice` tables, all with Row Level Security so each user only ever sees their own rows.
3. Open **Project Settings -> Data API**. Copy the **Project URL**.
4. Open **Project Settings -> API Keys**. Copy the **anon / publishable** key (not the service role key).

## 2. Enable Google sign-in

1. In the Supabase dashboard: **Authentication -> Sign In / Providers -> Google** - toggle it on.
2. You need a Google OAuth Client ID/Secret. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create an OAuth consent screen (External, add your email as a test user if it's in testing mode).
   - Create an OAuth Client ID of type "Web application".
   - Add this **Authorized redirect URI** (Supabase shows the exact value on the same provider settings page, format is `https://<your-project-ref>.supabase.co/auth/v1/callback`).
3. Paste the Google Client ID and Secret into Supabase's Google provider settings and save.
4. In Supabase **Authentication -> URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (update to your production URL after deploying).
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and, later, `https://<your-vercel-domain>/auth/callback`.

## 3. Get an OpenRouter API key (for the AI spending insight and debt payoff advice)

1. Sign up at [openrouter.ai](https://openrouter.ai) and create an API key under **Keys**.
2. Without this, the Overview tab's insight card and the Debts tab's payoff advice just show a placeholder message - everything else works fine without it.

## 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENROUTER_API_KEY=...
```

## 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should land on `/login`, sign in with Google, and land on `/dashboard`.

## 6. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), import the GitHub repo.
3. Add the same environment variables in the Vercel project's Settings -> Environment Variables.
4. Deploy, then go back to Supabase's URL Configuration and add `https://<your-vercel-domain>/auth/callback` to Redirect URLs (and update Site URL) so Google sign-in works in production too.

## Project structure

- `app/login` - Google sign-in page.
- `app/auth/callback` - exchanges the OAuth code for a session.
- `app/dashboard/layout.tsx` - shared header + tab navigation (Overview / Subscriptions / Expenses / Budgets / Debts).
- `app/dashboard/page.tsx` - Overview: period-based spend estimate, AI insight, budget progress.
- `app/dashboard/subscriptions` - recurring subscriptions list, add/edit/pause/delete.
- `app/dashboard/expenses` - one-off dated spending.
- `app/dashboard/budgets` - per-category monthly budget caps.
- `app/dashboard/debts` - debts (credit cards, BNPL, loans) with due dates/interest rates, monthly income, and AI payoff-priority advice. Statement upload/parsing is a planned fast-follow, not built yet.
- `lib/supabase` - browser/server Supabase clients + the session-refresh helper used by `proxy.ts`.
- `lib/finance-summary.ts` - combines subscriptions + this month's expenses into per-category totals (base currency: MYR).
- `lib/ai-insight.ts` - generates (and caches, once per 24h) the AI spending insight via OpenRouter.
- `lib/debt-advice.ts` - same caching pattern, generates AI debt-payoff advice from debts + income + spending.
- `supabase/schema.sql` - the full database schema to run once in a fresh Supabase project.
- `supabase/migrations/` - incremental migrations, for applying changes to an already-running project.
