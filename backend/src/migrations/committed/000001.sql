--! Previous: -
--! Hash: sha1:098815c5614167785ee8893db3da508584fa2991

create table "group" (
  name varchar(32) not null primary key,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  password TEXT,
  is_password_protected boolean GENERATED ALWAYS as (password is not null) stored
);


create table "user" (
  username varchar(32) primary key,
  password TEXT,
  groupName varchar(32) REFERENCES "group" ON DELETE set null,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON "user" (groupName);

create table "enemy" (
  level integer primary key,
  max_health float,
  name varchar(64)
);

create table "battle" (
  enemy_level integer not null REFERENCES "enemy" default 1,
  groupName varchar(32) not null references "group",
  battle_number integer not null default 1, 
  current_health float not null default 10,
  max_health float not null default 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  primary key (groupName, battle_number)
);
create index on "battle"(groupName);
create index on "battle"(enemy_level);

alter table "group"
add column "battle_number" integer; 

alter table "group"
add FOREIGN KEY (name, battle_number) REFERENCES "battle"(groupName, battle_number) on delete set null;

create index on "group"(name, battle_number);

create table "bodystat" (
  username varchar(32) not null REFERENCES "user" ON DELETE cascade not null,
  isMale boolean not null,  
  bodymass integer not null check (bodymass > 0),
  primary key(username),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

create table "workout" (
  id serial primary key,
  average_rir integer not null,
  groupName varchar(32) not null,
  battle_number integer not null,
  sets integer not null,
  hits integer GENERATED ALWAYS as ((10 - average_rir) / 10.0 * sets) stored,
  total_damage float not null,
  username varchar(32) not null references "user" on delete cascade,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (groupName, battle_number) REFERENCES "battle"(groupName, battle_number) on delete set null
);

create index on "workout" (username);
create index on "workout" (groupName, battle_number);

CREATE INDEX ON "bodystat" (username);

create table "exercise" (
  id integer primary key,
  string_id varchar unique not null,
  body_part varchar not null,
  weight_connection varchar not null,
  exercise_type varchar not null,
  name varchar not null
);

create table "exercise_alias" (
  id integer references "exercise",
  name varchar not null
);
create index on "exercise_alias" (id);


create table "user_exercise" (
  id integer  not null REFERENCES "exercise" ON DELETE cascade not null,
  username varchar(32) not null REFERENCES "user" ON DELETE cascade not null,
  repetitions integer not null,
  liftmass float not null,
  strongerPercentage integer not null,
  groupName varchar(32),
  battle_number integer,
  primary key(id, username),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (groupName, battle_number) REFERENCES "battle"(groupName, battle_number) on delete set null
);

create index on "user_exercise" (id);
create index on "user_exercise" (username);
create index on "user_exercise" (groupName, battle_number);

create table "chat_message" (
  id serial primary key,
  username varchar(32) not null references "user",
  text_content varchar(255) not null,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  groupName varchar(32) not null references "group"
);
create index on "chat_message" (username);
create index on "chat_message" (groupName);

create type section_and_time_spent as (
  section varchar,
  time_spent float
);
create table "session_analytics" (
  id serial primary key,
  username varchar(32) not null references "user",
  analytics section_and_time_spent[] not null,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
create index on "session_analytics" (username);

create function active_user() returns "user" as $$
  select * from "user" where username = 'orek'
$$ language sql stable;

CREATE EXTENSION pgcrypto;
CREATE FUNCTION join_group(input_groupname varchar(32), input_password TEXT) RETURNS boolean as $$
declare
succeeded integer;
begin
  select 1 into succeeded from "group" where name = input_groupname 
    and (
    password is null
    or password = crypt(input_password, password)
  );
  if succeeded then
    update "user"
    set groupName = input_groupname
    where username = (select username from active_user());
  end if;
  return succeeded;
end
$$ LANGUAGE plpgsql volatile;



--sets current users group 
CREATE FUNCTION join_random_public_group() RETURNS boolean as 
$BODY$
declare
chosen_group_name varchar(32);
begin
  --finds the group with the least members, and breaks ties by taking the older one
  SELECT "group".name into chosen_group_name
  FROM "group" inner join "user" on "user".groupName = "group".name 
  where not "group".is_password_protected
  group by "group".name
  order by count("user"), "group".created_at DESC
  limit 1;
  if chosen_group_name is NULL then 
    return false;
  end if ;
  update "user"
  set groupName = chosen_group_name
  where username = (select username from active_user());
  return true;
end
$BODY$ LANGUAGE plpgsql volatile;

CREATE TYPE strengthStats AS (
  average_strength numeric,
  num_exercises numeric,
  DPH numeric
);

CREATE or replace FUNCTION calculate_strength_stats()
  RETURNS strengthStats AS $$
DECLARE
 result strengthStats;
BEGIN
  select coalesce(round(avg(strongerpercentage), 2), 0) as average_strength, count (*) as num_exercises into result from "user_exercise" 
    where "user_exercise".username = (select username from active_user());
  if result.num_exercises = 0 then
    result.DPH = 0;
  else
    select round((result.average_strength / 100) * ln(result.num_exercises + 1) * 2.5, 2) into result.DPH;
  end if;
return result;
END
$$ language plpgsql stable;

create function nullify_group()
 returns void as $$
declare
  old_groupName varchar(32);
begin
  --get the old group
  select groupName into old_groupName from "user" where username = (select username from active_user());
  update "user" set groupName = null where username = (select username from active_user());

  --if no more users left then delete group
  if (select count(*) from "user" where groupName = old_groupName) = 0 then
    delete from "group" where name = old_groupName;
  end if;
end $$ language plpgsql volatile;


create type public.jwt_token as (
  exp integer,
  username varchar
);

create function authenticate(
  input_username text,
  input_password text
) returns jwt_token as $$
declare
  authenticated_user "user"; 
begin
  select u.* into authenticated_user
    from "user" as u
    where u.username = input_username;

  if authenticated_user.password = crypt(input_password, authenticated_user.password) then
    return (
      extract(epoch from now() + interval '50 days'),
      authenticated_user.username
    )::jwt_token;
  else
    return null;
  end if;
end;
$$ language plpgsql strict security definer;

create function create_user(
  username text,
  password text
) returns void as $$
begin
  insert into "user"(username, password) values (username, crypt(password, gen_salt('bf')));
end;
$$ language plpgsql strict security definer;
