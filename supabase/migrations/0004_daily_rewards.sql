-- Finite Paper Balance & Daily Rewards
-- Removes automatic daily paper refill by raising daily_papers cap so the server-side
-- finite balance ledger (5 initial free papers + claimed daily rewards - sent papers) governs sending.
update public.app_config set value = '9999' where key = 'daily_papers';
