# SubTrack

Track every subscription you pay for - AI tools, Google, CapCut, anything - in one place. Next.js + Supabase (Postgres + Auth) + Magic UI, deployed on Vercel.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier is fine).
2. Once it's ready, open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates the `subscriptions` table with Row Level Security so each user only ever sees their own rows.
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

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the two values with what you copied in step 1:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should land on `/login`, sign in with Google, and land on `/dashboard`.

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), import the GitHub repo.
3. Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Settings -> Environment Variables.
4. Deploy, then go back to Supabase's URL Configuration and add `https://<your-vercel-domain>/auth/callback` to Redirect URLs (and update Site URL) so Google sign-in works in production too.

## Project structure

- `app/login` - Google sign-in page.
- `app/auth/callback` - exchanges the OAuth code for a session.
- `app/dashboard` - the subscription list, add/edit/delete, and total monthly spend.
- `lib/supabase` - browser/server Supabase clients + the session-refresh helper used by `proxy.ts`.
- `supabase/schema.sql` - the database schema to run once in Supabase.
