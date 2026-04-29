-- Profiles table (one per user, linked to auth.users)
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text not null,
  is_admin         boolean not null default false,
  notify_on_upvote boolean not null default false,
  created_at       timestamptz default now(),
  constraint profiles_username_unique unique (username)
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup (handles email + OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '_', 'g');
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix::text;
  end loop;
  insert into public.profiles (id, username) values (new.id, final_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Game follows
create table if not exists public.user_game_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  game_id    uuid not null references public.games(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, game_id)
);

alter table public.user_game_follows enable row level security;

create policy "Follows are public" on public.user_game_follows
  for select using (true);

create policy "Users manage own follows" on public.user_game_follows
  for all using (auth.uid() = user_id);

-- Bookmarks
create table if not exists public.bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  setup_id   uuid not null references public.setups(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, setup_id)
);

alter table public.bookmarks enable row level security;

create policy "Users manage own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);

-- Add creator_id and is_public to setups
alter table public.setups add column if not exists creator_id uuid references auth.users(id);
alter table public.setups add column if not exists is_public boolean not null default true;

-- Private setups only visible to their creator; public setups visible to all
drop policy if exists "Public setups are viewable by everyone" on public.setups;
create policy "Setup visibility" on public.setups
  for select using (is_public = true or auth.uid() = creator_id);

-- Add user_id to ratings (nullable for backward compat with old PIN-era votes)
alter table public.ratings add column if not exists user_id uuid references auth.users(id);

-- Partial unique index: one vote per authenticated user per setup
drop index if exists ratings_user_setup_idx;
create unique index ratings_user_setup_idx on public.ratings (user_id, setup_id)
  where user_id is not null;

-- Tighten ratings policies: auth required to vote
drop policy if exists "Public ratings insert" on public.ratings;
drop policy if exists "Public ratings delete" on public.ratings;

create policy "Authenticated users can rate" on public.ratings
  for insert with check (auth.uid() = user_id);

create policy "Users delete own ratings" on public.ratings
  for delete using (auth.uid() = user_id);

-- Gate setup details (sections + fields) behind authentication
drop policy if exists "Public read setup_sections" on public.setup_sections;
create policy "Authenticated read setup_sections" on public.setup_sections
  for select using (auth.role() = 'authenticated');

drop policy if exists "Public read setup_fields" on public.setup_fields;
create policy "Authenticated read setup_fields" on public.setup_fields
  for select using (auth.role() = 'authenticated');
