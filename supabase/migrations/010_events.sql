-- Events table
create table public.events (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  description text,
  location    text,
  start_time  timestamptz not null,
  end_time    timestamptz,
  is_recurring boolean    not null default false,
  rrule       text,                          -- raw RRULE string from ICS (recurring only)
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- RLS
alter table public.events enable row level security;

create policy "Events viewable by everyone"
  on public.events for select using (true);

create policy "Authenticated users can insert events"
  on public.events for insert
  with check (auth.uid() = created_by);

create policy "Creator or admin can delete events"
  on public.events for delete
  using (
    auth.uid() = created_by or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Auto-delete expired one-off events daily at 2am UTC
-- Requires pg_cron (enabled by default in Supabase)
select cron.schedule(
  'delete-expired-one-off-events',
  '0 2 * * *',
  $$delete from public.events where is_recurring = false and start_time < now()$$
);
