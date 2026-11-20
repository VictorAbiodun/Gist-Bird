-- Settle papers every minute (landing, 24h hold expiry, returns) using pg_cron where available.
-- On Supabase, enable the extension once: Dashboard → Database → Extensions → pg_cron.
-- If pg_cron is not enabled, nothing breaks: papers also settle lazily whenever someone loads
-- Inbox, Sent or a paper page.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'gist-bird-settle-papers';
    perform cron.schedule('gist-bird-settle-papers', '* * * * *', 'select public.settle_papers()');
  else
    raise notice 'pg_cron is not enabled; skipping the settle schedule (lazy settling still works).';
  end if;
end $$;
