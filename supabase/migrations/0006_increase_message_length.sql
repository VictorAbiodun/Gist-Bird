-- Allow longer chat messages (up to 50,000 characters instead of 1,000)
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_body_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_body_check CHECK (char_length(body) between 1 and 50000);
