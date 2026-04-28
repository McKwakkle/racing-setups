-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Games
create table games (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz default now()
);

-- Categories (drift, street, rally, grip, etc.)
create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);

-- Setups
create table setups (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references games(id),
  car_name     text not null,
  title        text not null,
  category_id  uuid references categories(id),
  control_type text not null check (control_type in ('wheel', 'remote')),
  author_name  text,
  notes        text,
  created_at   timestamptz default now()
);

-- Sections within a setup (e.g. "Suspension", "Tires", "Aero")
create table setup_sections (
  id         uuid primary key default gen_random_uuid(),
  setup_id   uuid not null references setups(id) on delete cascade,
  name       text not null,
  sort_order integer default 0
);

-- Key-value fields within a section
create table setup_fields (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references setup_sections(id) on delete cascade,
  field_name  text not null,
  field_value text not null,
  sort_order  integer default 0
);
