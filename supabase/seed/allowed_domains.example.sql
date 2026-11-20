-- Run once in the Supabase SQL editor with your real school domain(s). Lowercase only.
insert into public.allowed_domains (domain) values ('school.edu.ng')
on conflict do nothing;
