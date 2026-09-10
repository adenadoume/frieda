# Frieda Care

Shared app for coordinating mother's care — shopping list, expenses (with receipt
photos), medications, ΚΕΠΑ procedure, pension/allowance tracking, and medical exams.
Two logins only: you and your brother, via Google sign-in (through Clerk).

Stack: Vite + React (plain JS, no framework), Tailwind, Clerk (auth) + Supabase
(Postgres, via Supabase's official Clerk third-party-auth integration for RLS),
Cloudflare Pages (hosting) + Cloudflare Worker + R2 (photo storage) — everything
on one Cloudflare account. DB/storage pattern mirrors the Seagonia admin app;
auth is Clerk instead of Supabase Auth, hosting is Cloudflare Pages instead of
Vercel (no strong reason for Vercel here, and this consolidates with the R2/Worker
setup already in place).

## 1. Supabase project

Using the existing **agop-os** Supabase project (confirmed it only holds a
keepalive project so far — no conflict). All tables below are namespaced/unique
to this app and RLS-gated to `allowed_users`, so it's safe to run alongside
whatever else lands in that project later.

1. In the SQL editor, run `supabase/migrations/0001_init.sql`. This creates all
   tables, RLS policies (only emails in `allowed_users` can read/write anything —
   both your and your brother's emails are already seeded in there), and seeds
   the current shopping list / medications / ΚΕΠΑ items / the first expense.
2. Settings → API → copy the Project URL and `anon` public key into `.env`
   (copy `.env.example` → `.env` first).

## 2. Auth — Clerk + Google, wired into Supabase

Auth is Clerk, not Supabase Auth. Clerk provides its own shared Google connection,
so **no Google Cloud Console project is needed** for this.

**A. Clerk dashboard** (clerk.com — free tier is plenty for 2 users)
1. Create an application (e.g. "Frieda Care").
2. **User & Authentication → Social Connections** → enable **Google** (Clerk's
   built-in shared credentials — no setup needed on Google's side).
3. **User & Authentication → Email, Phone, Username** → turn off email/password
   and any other sign-in method, so Google is the only option shown.
4. **Sessions → Customize session token** → add a claim so Supabase's RLS can see
   the user's email:
   ```json
   { "email": "{{user.primary_email_address}}" }
   ```
5. **API Keys** → copy the **Publishable key** into `.env` as
   `VITE_CLERK_PUBLISHABLE_KEY`. Also note the **Frontend API URL** shown there
   (looks like `https://xxx.clerk.accounts.dev`, or your custom domain) — you'll
   need it in the next step.

**B. Supabase dashboard**
6. **Authentication → Sign In / Providers → Third Party Auth** → Add provider →
   **Clerk** → paste the Frontend API URL from step 5. This lets Supabase verify
   Clerk's JWTs (via Clerk's public JWKS) without any shared secret.
7. That's it on the Supabase side — `is_allowed_user()` in the migration already
   reads `auth.jwt() ->> 'email'`, which now comes from Clerk's token.

**C. Test users**
8. While the app isn't "published" beyond your Clerk application's own user list,
   sign-in is open to anyone with a Google account by default — restriction to
   just the two of you happens at the app/DB level via `allowed_users`, not at
   Clerk's level. (If you want Clerk itself to also gate sign-up, Clerk →
   Restrictions → allowlist by email — optional, since `allowed_users` + RLS
   already enforce it.)

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
- `ALLOWED_ORIGIN` — your deployed frontend's URL (Cloudflare Pages gives you
  this after step 5, e.g. `https://frieda.pages.dev` or a custom domain).

Put the worker URL + the same `UPLOAD_SECRET` into `.env` as
`VITE_UPLOAD_WORKER_URL` / `VITE_UPLOAD_SECRET`.

## 4. Local dev

```bash
npm install
npm run dev
```

## 5. Deploy (Cloudflare Pages)

Code's already pushed to `github.com/adenadoume/frieda`.

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
   → pick the `adenadoume/frieda` repo.
2. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave as `/` (the app is at the repo root; `worker/` is
     ignored by this build — it's deployed separately with `wrangler deploy`)
3. Add the five `VITE_*` env vars under **Settings → Environment variables**
   (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_UPLOAD_WORKER_URL`, `VITE_UPLOAD_SECRET`).
4. Deploy. You'll get a `*.pages.dev` URL (or attach a custom domain).
5. Once deployed:
   - Add that URL to Clerk → **Domains** so sign-in works from production, not
     just localhost.
   - Set `ALLOWED_ORIGIN` in `worker/wrangler.toml` to the real Pages URL and
     re-run `wrangler deploy` (from `worker/`).

The `public/_redirects` file (`/* /index.html 200`) handles client-side routing
so refreshing on e.g. `/expenses` doesn't 404 — Cloudflare Pages picks it up
automatically from the build output.

## Notes

- The receipt you already photographed (`FRIEDA/receipt_2026-09-08_market-in.jpg`,
  Market In, €27.01, groceries, 2026-09-08) is pre-seeded as an expense row but
  without the photo attached (the worker wasn't deployed yet when this was written).
  Once uploads are working, either re-add it via the Expenses page or upload it
  manually to R2 and paste the URL into the `receipt_url` column.
- A separate Google Sheets–based expense tracker (`Psychico_House_Expenses.xlsx`)
  was drafted in another session as a quick stopgap — this app supersedes it once
  it's live; no need to keep both in sync.
