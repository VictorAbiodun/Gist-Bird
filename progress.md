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

### Phase 7: WhatsApp-Style UX, Real-Time Notifications & Merged Chats
- **Merged duplicate chat threads**: Guaranteed single unified conversation thread per user pair when accepting letters.
- **WhatsApp-style in-app toast banners & Web Push**: Subscriptions via VAPID + `web-push`, background lock-screen notifications with quick actions ("Reply", "Mark as read"), and top toast banners.
- **Optimistic saves & client cache**: Instant UI updates with offline guard for profile changes and daily rewards; Service Worker stale-while-revalidate navigation across tabs.
- **Auto-submitting OTP**: Seamless 6-digit email confirmation code verification.
- **Bird-themed typing indicator**: Native looping animated SVG (`BirdTypingAnimation.tsx` & `/icons/bird-typing.svg`) showing a pigeon pecking at seeds in real-time when the chat partner types via Supabase Realtime broadcast.
- **WhatsApp message timestamps & date dividers**: Day separator pills ("Today", "Yesterday", weekday), formatted 12-hour timestamps docked at bottom-right, and haptic feedback on send.

### Phase 8: Campus Tree Filtering & WhatsApp Blue Read Receipts
- **Living Tree Campus Filter**: Segmented switch on `/home` tree allowing students to toggle between `🌍 All Campuses` and `🏫 My Campus` (e.g. "RUN" or "UNILAG") with live counts and empty-state guidance.
- **Enriched Inbox & Letter Crest**: Author's university metadata attached to unaccepted papers; `CinematicLetterReader` displays the author's official university name and local NARR crest logo.
- **Blue Read Receipts**: Double checkmark turns WhatsApp Blue (`#34B7F1`) when the other person opens the chat window or views incoming messages, powered by Realtime broadcast + database receipt synchronization.

### Phase 9: Custom Bird Message Reactions
- **7 Vector Bird Emojis**: Added Heart, Laugh, Shock, Cry, Shy, Side-eye, and Shy Moon vector SVGs in `public/emojis/`.
- **Floating WhatsApp-Style Reaction Bar**: Tap any message bubble to trigger a floating reaction bar with spring pop animation.
- **Docked Reaction Badges**: Displayed beneath message bubbles with aggregate count, primary highlight for personal reaction, and tap-to-toggle.
- **Real-Time Synchronized**: Realtime broadcast across clients with database persistence via `toggleMessageReaction`.

### Phase 10: Offline Queueing, Bird Sound Effects & Fly Away (Leave Chat)
- **Offline Message Queue (`offlineQueue.ts`)**: Messages sent while offline or during patchy campus network drops queue safely in `localStorage` and flush sequentially as soon as connectivity returns.
- **Synthesized Bird & Chat Sounds (`sounds.ts`)**: Zero-asset Web Audio API tones for sending, receiving (two-note bird chirp), and new paper landings on the tree, with a mute/unmute toggle in the chat header.
- **Fly Away (`leaveChat`)**: Graceful unmatch/leave-chat confirmation modal that cleans up the conversation, notifies the other client via Realtime broadcast, and returns to `/chats`.
- **Friend Profile Preview (`getFriendProfilePreview`)**: Tapping a friend's avatar or name in a chat header (or tapping their avatar on `/chats`) opens the full `ProfilePreviewModal` showing their tree scene/photo, bio, university & crest, age, gender, topics, XP, achievements, and gifts.





