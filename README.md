# Frieda Care

Shared app for coordinating mother's care — shopping list, expenses (with receipt
photos), medications, ΚΕΠΑ procedure, pension/allowance tracking, and medical exams.
Two logins only: you and your brother, via Google sign-in.

Stack: Vite + React (plain JS, no framework), Tailwind, Supabase (Postgres + Auth),
Cloudflare Worker + R2 for photo storage, deployed on Vercel. Same pattern as the
Seagonia admin app.

## 1. Supabase project

Using the existing **agop-os** Supabase project (confirmed it only holds a
keepalive project so far — no conflict). All tables below are namespaced/unique
to this app and RLS-gated to `allowed_users`, so it's safe to run alongside
whatever else lands in that project later.

1. In the SQL editor, run `supabase/migrations/0001_init.sql`. This creates all
   tables, RLS policies (only emails in `allowed_users` can read/write anything),
   and seeds the current shopping list / medications / ΚΕΠΑ items / the first
   expense.
2. **Add your brother's email** — run:
   ```sql
   insert into allowed_users (email) values ('his-email@example.com');
   ```
3. Settings → API → copy the Project URL and `anon` public key into `.env`
   (copy `.env.example` → `.env` first).

## 2. Google sign-in

1. In Supabase: Authentication → Providers → Google → enable it.
2. In [Google Cloud Console](https://console.cloud.google.com/): create a project
   (free), then APIs & Services → OAuth consent screen (External, testing mode is
   fine for just the two of you) → Credentials → Create OAuth client ID
   (Web application).
   - Authorized redirect URI: the one Supabase shows you on the Google provider
     screen (`https://<project-ref>.supabase.co/auth/v1/callback`).
3. Paste the Google Client ID + Secret into Supabase's Google provider settings.
4. Add both your Google accounts as **test users** on the OAuth consent screen
   (required while it's in "Testing" mode — no verification/review needed for 2
   people).

## 3. Image uploads (Cloudflare Worker + R2)

Mirrors the Seagonia project's setup.

```bash
cd worker
npx wrangler r2 bucket create frieda-images
npx wrangler secret put UPLOAD_SECRET   # pick a long random string, remember it
npx wrangler deploy
```

Update `worker/wrangler.toml`:
- `PUBLIC_BASE_URL` — connect a custom domain to the R2 bucket (Cloudflare
  dashboard → R2 → frieda-images → Settings → Custom domain), or use the
  `.r2.dev` public URL it gives you to start.
- `ALLOWED_ORIGIN` — your deployed frontend's URL (Vercel gives you this after
  step 4).

Put the worker URL + the same `UPLOAD_SECRET` into `.env` as
`VITE_UPLOAD_WORKER_URL` / `VITE_UPLOAD_SECRET`.

## 4. Local dev

```bash
npm install
npm run dev
```

## 5. Deploy

Push to `github.com/adenadoume/frieda`, then import the repo in Vercel. Framework
preset: Vite. Add the four `VITE_*` env vars from `.env` in Vercel's project
settings. Once deployed, go back and set `ALLOWED_ORIGIN` in `worker/wrangler.toml`
to the real Vercel URL and re-run `wrangler deploy`.

## Notes

- The receipt you already photographed (`FRIEDA/receipt_2026-09-08_market-in.jpg`,
  Market In, €27.01, groceries, 2026-09-08) is pre-seeded as an expense row but
  without the photo attached (the worker wasn't deployed yet when this was written).
  Once uploads are working, either re-add it via the Expenses page or upload it
  manually to R2 and paste the URL into the `receipt_url` column.
- A separate Google Sheets–based expense tracker (`Psychico_House_Expenses.xlsx`)
  was drafted in another session as a quick stopgap — this app supersedes it once
  it's live; no need to keep both in sync.
