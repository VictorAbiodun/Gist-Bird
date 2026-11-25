# Gist Bird — Development Progress

## Completed Phases & Milestones

### Phase 1: Living Tree Environment
- Built the living Message Tree canvas on `/home` (`TreeScene.tsx`) with animated ambient clouds, falling leaves, swaying branches, and Chief Coo mascot interactions.
- Preserved full-screen responsive layout and touch-friendly campus map aesthetics.

### Phase 2: Real-Time Hanging Envelopes
- Connected the tree branches to the authenticated user's Supabase inbox (`get_inbox` RPC + Realtime `papers` table subscription).
- Styled sealed (`envelope.svg`) and opened (`envelope-open.svg`) envelopes hanging across tree canopy anchor points (`TreeMessageLeaves.tsx`).

### Phase 3: Cinematic Letter Opening, Reading & Accepting
- Implemented `CinematicLetterReader.tsx` with smooth Framer Motion transitions: envelope detachment, center zoom, flap opening (`envelope-open.svg`), emerging parchment sheet, sender profile metadata, and full scrollable message body.
- Added **KEEP LETTER** (marks `accepted` in Supabase, creates a chat thread, removes envelope from tree, refreshes router) and **CLOSE LETTER** (returns envelope to branch without accepting).
- Retired the legacy `/inbox` tab in favor of the living tree on `/home` (`TabBar.tsx`, `/inbox` redirects to `/home`).

### Phase 4: Fast Dev Deliveries, Mobile App Tightness & Push Notifications
- Configured development paper delivery times to **15–20 seconds** (`0003_dev_flight_time.sql`, `campus.ts`, `bird.ts`).
- Tightened mobile app layout (`AppShell.tsx`, `globals.css`, `layout.tsx`) with `interactiveWidget: 'resizes-content'`, overscroll lock, and `visualViewport`-aware `ChatThread.tsx` so the keyboard never pushes the chat screen off-view.
- Added custom **Paper** and **Map** icons (`Icon.tsx`) and compact Home paper badge.
- Added Apple iOS "Add to Home Screen" & Android "Install App" prompts (`InstallPrompt.tsx`) and real-time phone notifications showing sender name & message text (`PushNotificationManager.tsx`, `sw.js`, `chat.ts`).

### Phase 5: Finite Papers & 20-Day Daily Streak Rewards
- Switched to finite papers: new users start with **5 free papers** (`INITIAL_FREE_PAPERS = 5`) and existing users retain their 5 papers (`FINITE_ECONOMY_CUTOFF`).
- Built the 20-day streak reward modal (`DailyRewardModal.tsx`, `HomeRewardsBar.tsx`, `rewards.ts`) with custom SVGs (Flame, Coin, Chest, Whistle, Mug, Flower, Bird Seed, Gold Bar).

### Phase 6: Profile, My Profile Editor, Preview & Onboarding Scroll Pickers
- Redesigned `/me` (`ProfileView.tsx`) with sky/mint header, coins card, 2×2 real stats grid, and feature rows (excluding premium card).
- Built `/me/edit` (`EditProfileView.tsx`) with Avatar & Photo picker, Username, User Tag, Bio, Topics of interest, **University name**, Country, Age, Gender, Favourite spot, and Bird name.
- Built the rich public **Profile Preview** (`ProfilePreviewModal.tsx`) showing Message Tree + Avatar scene, `Customize` CTA, **University Logo/Crest** (`UniversityLogo.tsx`) replacing country flag, **University** section replacing "Languages spoken", Achievements, and Gifts received.
- Added **Nigerian Universities scroll-wheel picker** (80+ private, federal, and state universities with official crest colors & monograms in `universities.ts`) and **3-wheel Date of Birth & Age scroll picker** (`ScrollWheelPicker.tsx`) to both Sign Up / Onboarding (`ProfileWizard.tsx`) and Edit Profile (`EditProfileView.tsx`).
