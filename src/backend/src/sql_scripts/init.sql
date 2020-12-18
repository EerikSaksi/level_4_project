DROP SCHEMA public CASCADE;
create schema public;

create table "group" (
  name varchar(32) not null primary key,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
create table "user" (
  username varchar(32) primary key not null,
  groupName varchar(32) REFERENCES "group" ON DELETE set null,
  googleID varchar(64) not null unique,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON "user" (groupName);

alter table "group"
add column creator_username varchar(32) not null unique REFERENCES "user" ON DELETE set null;

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
  slug_name varchar(32) not null primary key,
  popularity_ranking integer unique
);

create table "user_exercise" (
  slug_name varchar(32) not null REFERENCES "exercise" ON DELETE cascade not null,
  username varchar(32) not null  REFERENCES "user" ON DELETE cascade not null,
  repetitions integer not null,
  liftmass float not null,
  strongerPercentage integer not null,
  groupName varchar(32),
  battle_number integer,
  primary key(slug_name, username),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (groupName, battle_number) REFERENCES "battle"(groupName, battle_number) on delete set null
);

create index on "user_exercise" (slug_name);
create index on "user_exercise" (username);
create index on "user_exercise" (groupName, battle_number);

CREATE FUNCTION active_user() RETURNS "user" AS $$
  select * from "user" where googleID = current_setting('user.googleID')
$$ LANGUAGE sql stable STRICT;


CREATE TYPE strengthStats AS (
  average_strength numeric,
  num_exercises numeric,
  DPH numeric
);

CREATE FUNCTION calculate_strength_stats(input_username varchar(32))
  RETURNS strengthStats AS $$
DECLARE
 result strengthStats;
BEGIN
  select round(avg(strongerpercentage), 2) as average_strength, count (*) as num_exercises into result from "user_exercise" 
                    where "user_exercise".username = input_username;
  select round(result.average_strength / 100 * result.num_exercises, 2) into result.DPH;
  return result;
END
$$ language plpgsql stable;