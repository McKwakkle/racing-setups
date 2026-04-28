create table ratings (
  id         uuid primary key default gen_random_uuid(),
  setup_id   uuid not null references setups(id) on delete cascade,
  value      smallint not null check (value in (1, -1)),
  created_at timestamptz default now()
);

alter table ratings enable row level security;

create policy "Public ratings read"   on ratings for select using (true);
create policy "Public ratings insert" on ratings for insert with check (true);
