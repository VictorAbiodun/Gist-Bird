# Gist Bird

> 🚀 **Live App:** [https://gist-bird.vercel.app](https://gist-bird.vercel.app)

A campus pen-pal app. Write a short paper, Chief Coo the pigeon carries it across the campus map to another verified student, and if they say hi, a chat opens. Built from the Figma design (Direction B, Green-White-Green).

**Stack:** Next.js 14 (App Router, TypeScript) · Tailwind · Supabase (Auth email codes, Postgres with row level security, Realtime) · installable PWA. Fonts are self-hosted to save data.

> **Deploying?** See [DEPLOY.md](DEPLOY.md) for the Supabase and Vercel setup.

## Run it

```bash
npm install
cp .env.example .env.local      # fill in your Supabase keys
npm run dev
```

1. Create a Supabase project.
2. In the SQL editor run, in order: `supabase/migrations/0001_init.sql`, then `supabase/seed/campus.sql`.
3. Add your school domain: `insert into allowed_domains values ('your-school.edu.ng');` and set `ALLOWED_EMAIL_DOMAINS` in `.env.local`.
4. Auth → Email: keep "Confirm email" on and edit the **Magic Link / OTP email template** so it includes `{{ .Token }}` (the 6-digit code). The app signs people in with that code.
5. Realtime: the migration adds `messages` and `notifications` to the `supabase_realtime` publication.
6. Optional but recommended: schedule `select settle_papers();` every minute with pg_cron. Without it, papers settle lazily whenever someone loads Inbox, Sent or a paper.

```bash
npm test                 # unit tests (campus graph, flight time, contact filter)
npm run lint && npm run build
npm run db:gen-seed      # regenerate supabase/seed/campus.sql from src/data/campus.json
```

## How it fits together

| Design screen | Code |
|---|---|
| A · Entry and trust | `(public)/welcome, email, verify, rules`, `onboarding` (`ProfileWizard`) |
| B · Home (home bird image) | `(app)/home`, `/map` |
| B · Write, flight, delivered, returned | `/write` (`WriteForm`), `/flight/[id]` (`FlightTracker`) |
| B · Sent, inbox, paper card | `/sent`, `/inbox`, `/paper/[id]` (`PaperActions`) |
| B · Chats | `/chats`, `/chat/[id]` (`ChatThread`, realtime) |
| C · Safety and account | `/report`, `/me`, `/settings/*`, `/notifications`, paused state in `(app)/layout` |
| D · States | `Empty` component, offline banner, friendly error copy in `src/lib/errors.ts` |

**Rules live in the database, not just the UI** (`supabase/migrations/0001_init.sql`):

- The only write path is a set of `security definer` functions (`send_paper`, `accept_paper`, `send_message`, `report_user`, and so on). Tables have no insert, update or delete policies.
- The school email stays in `auth.users`. A trigger rejects signups from domains not in `allowed_domains`.
- Daily paper limit (resets at midnight Lagos time), 20 to 280 characters, contact-info block (phone numbers, links, handles) in papers and in the first 10 chat messages, blocks in both directions, account pause with an end date.
- A paper's life: `flying` → `landed` → `opened` → `accepted` (chat opens), or passed to the next student. After 3 passes, or 24 hours held, it comes `returned` to the author.
- Flight time follows campus roads (`campus_spots` / `campus_edges`) and is tunable in `app_config`. `src/lib/campus.ts` mirrors the SQL; `src/data/campus.json` is the single source for both.
- The contact filter exists twice: `src/lib/contentFilter.ts` (instant feedback while typing) and `contains_contact_info` in SQL (the one that counts). Keep them in sync.

## Decisions I made that you may want to change

- **Anonymity removed, per your change.** Everyone chooses a real name or an alias. Papers, chats and notifications show it.
- **The recipient sees the sender's name on the closed paper card.** Say so if you want it hidden until opened.
- **Destination on the flight map** is the recipient's favourite spot. With a name, that can make someone findable. Set `show_destination` to `false` in `app_config` to hide it.
- **Reveal screens were dropped** (they only existed for anonymity).
- **Placeholders in `app_config`:** 9 papers a day, flight about 30 s per 100 map units (roughly 4 minutes across campus), 3 passes, 24 hour hold.

## Not done yet

- **Push notifications.** In-app notifications work. Web Push (service worker, VAPID keys, a `push_subscriptions` table) is the next piece.
- **Real artwork.** `public/mascot/*.svg` and `public/images/home-bird.svg` are placeholders drawn in code. Export your Figma images with the same names, or edit `src/lib/assets.ts`. The flying bird on the map (`fly.svg`) needs a proper pose too.
- **Moderation tools.** Reports are stored in `reports`. There is no staff dashboard; use the Supabase table editor for now. Strikes and pauses are set by hand (`profiles.strikes`, `status`, `paused_until`).
- **Open decisions:** age policy, data-retention wording, the support contact for the "kind check-in" screen. Numbers spelled out in words ("zero eight zero…") slip past the filter; reports cover that.
- **Chat unread counts** and typing indicators.
- **Campus map.** Coordinates and edges are my reading of the landmark list. Check `src/data/campus.json` against the real campus.

## What was tested

- 25 unit tests (graph, flight time, filter). The TypeScript and SQL contact filters agree on 20 sample messages.
- The full paper lifecycle ran against a real Postgres 16 with a stand-in for Supabase auth: domain block, daily limit, contact block, body hidden until opened, pass, accept, chat, outsiders can't read messages, block hides chats, report resolves the right person.
- `lint`, type-check and production build pass; the server redirects to a setup page when Supabase isn't configured.
- **Not tested:** a live Supabase project, the UI in a browser, and Realtime. Please try the flow end to end with two accounts.
