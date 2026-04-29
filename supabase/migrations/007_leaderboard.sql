create view game_top_authors as
select game_id, author_name, upvote_count
from (
  select
    s.game_id,
    s.author_name,
    count(r.id) as upvote_count,
    row_number() over (partition by s.game_id order by count(r.id) desc) as rn
  from setups s
  join ratings r on r.setup_id = s.id and r.value = 1
  where s.author_name is not null and trim(s.author_name) != ''
  group by s.game_id, s.author_name
) ranked
where rn = 1;

grant select on game_top_authors to anon;
