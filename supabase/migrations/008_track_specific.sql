alter table setups add column if not exists is_track_specific boolean NOT NULL DEFAULT false;
alter table setups add column if not exists lap_time text;
alter table setups add column if not exists track_conditions text;
