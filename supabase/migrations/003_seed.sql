-- Seed common racing games
insert into games (name, slug) values
  ('Forza Motorsport',    'forza-motorsport'),
  ('Forza Horizon 5',     'forza-horizon-5'),
  ('Gran Turismo 7',      'gran-turismo-7'),
  ('F1 24',               'f1-24'),
  ('iRacing',             'iracing'),
  ('Assetto Corsa',       'assetto-corsa'),
  ('Need for Speed Heat', 'need-for-speed-heat')
on conflict (slug) do nothing;

-- Seed common build categories
insert into categories (name) values
  ('Street'),
  ('Drift'),
  ('Rally'),
  ('Grip'),
  ('Drag'),
  ('Time Attack'),
  ('Off-Road')
on conflict (name) do nothing;
