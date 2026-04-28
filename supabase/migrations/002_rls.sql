-- Enable RLS on all tables
alter table games enable row level security;
alter table categories enable row level security;
alter table setups enable row level security;
alter table setup_sections enable row level security;
alter table setup_fields enable row level security;

-- Allow anonymous SELECT on all tables (public browsing)
create policy "public read games"          on games          for select using (true);
create policy "public read categories"     on categories     for select using (true);
create policy "public read setups"         on setups         for select using (true);
create policy "public read setup_sections" on setup_sections for select using (true);
create policy "public read setup_fields"   on setup_fields   for select using (true);

-- No direct INSERT/UPDATE/DELETE for anon role.
-- All writes go through the submit-setup Edge Function which uses the service role key.
-- The service role bypasses RLS entirely, so no additional write policies are needed.
