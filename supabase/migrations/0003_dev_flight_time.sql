-- Development Phase: Fast Paper Deliveries (15-20 seconds)
-- Sets minimum flight time to 15s and maximum to 20s so test papers land promptly.
update public.app_config set value = '15' where key = 'flight_min_seconds';
update public.app_config set value = '20' where key = 'flight_max_seconds';
update public.app_config set value = '6' where key = 'flight_seconds_per_100_units';
