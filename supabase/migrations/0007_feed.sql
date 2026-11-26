-- Twitter/X-style Feed tables for Gist Bird
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  university text,
  reply_to_id uuid REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  quote_of_id uuid REFERENCES public.feed_posts (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_posts_created_idx ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_uni_created_idx ON public.feed_posts (university, created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_reply_idx ON public.feed_posts (reply_to_id, created_at ASC);
CREATE INDEX IF NOT EXISTS feed_posts_author_idx ON public.feed_posts (author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.feed_likes (
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feed_reposts (
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feed_bookmarks (
  post_id uuid NOT NULL REFERENCES public.feed_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY feed_posts_read ON public.feed_posts FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY feed_posts_insert ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY feed_posts_delete ON public.feed_posts FOR DELETE TO authenticated USING (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY feed_likes_all ON public.feed_likes FOR ALL TO authenticated USING (true) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY feed_reposts_all ON public.feed_reposts FOR ALL TO authenticated USING (true) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY feed_bookmarks_own ON public.feed_bookmarks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
