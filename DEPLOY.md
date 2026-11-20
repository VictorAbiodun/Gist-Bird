# Deploying Gist Bird (Supabase + Vercel)

Pick the **same region family** for both so requests stay fast in Nigeria:
Supabase `eu-west-2` (London) + Vercel `lhr1` (already set in `vercel.json`). Cape Town (`af-south-1` on Supabase, `cpt1` on Vercel) is the alternative; change `regions` in `vercel.json` to match.

## 1. Supabase
1. Create a project (note the project URL and the `anon` and `service_role` keys).
2. Apply the schema, either way:
   - SQL editor: run `supabase/migrations/0001_init.sql`, `0002_schedule_settle.sql`, then `supabase/seed/campus.sql`.
   - or CLI: `supabase link --project-ref <ref>` then `supabase db push` and run `seed/campus.sql` once.
3. Add your school domain: edit and run `supabase/seed/allowed_domains.example.sql`.
4. Dashboard → Database → Extensions: enable `pg_cron`, then re-run `0002_schedule_settle.sql`.
5. Dashboard → Auth:
   - Email provider on, "Confirm email" on, OTP length 6.
   - Email Templates → "Magic Link" and "Confirm signup": include `{{ .Token }}` so the email shows the 6-digit code.
   - URL Configuration → Site URL = your Vercel production URL; add `https://*-<team>.vercel.app/**` for previews.
   - Rate limits: raise the email send limit by adding a custom SMTP (Resend, Brevo, etc.). The built-in sender is only a few emails an hour and will not survive a campus launch.
6. Realtime is enabled for `messages` and `notifications` by the migration. Check Database → Replication.

## 2. Vercel
1. Import the Git repo (Framework: Next.js, auto-detected).
2. Environment variables (Production and Preview):

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **secret**, server only (delete account) |
| `ALLOWED_EMAIL_DOMAINS` | `school.edu.ng` | comma-separated |

3. Deploy. Then set that production URL as the Supabase Site URL (step 1.5).

## 3. Smoke test after deploying
1. Open the site, sign up with a school email, enter the 6-digit code.
2. Finish onboarding (name, interests, favourite spot).
3. Use a second account in another browser: send a paper, set `flight_min_seconds` low in `app_config` while testing, accept it, exchange messages.
4. Try a phone number in a paper (should be blocked) and a non-school email (should be refused).

## Notes
- Never put the `service_role` key in a `NEXT_PUBLIC_` variable.
- CI (`.github/workflows/ci.yml`) runs lint, type-check, tests and build on every push.
