--! Previous: sha1:0e29834cee7768a4e869c40469fb59627884fe91
--! Hash: sha1:ceabe0aefbed3f44156f6f38eff3df2573d152ab

drop table if exists completed_workout cascade;
CREATE TABLE public.completed_workout  (
    id integer primary key generated always as identity,
    app_user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enter migration here
alter TABLE app_user drop COLUMN if exists total_xp;
ALTER TABLE app_user ADD COLUMN total_xp integer not null default 0;

alter TABLE app_user drop COLUMN if exists level;

ALTER TABLE app_user ADD COLUMN level integer GENERATED ALWAYS AS (floor(total_xp / 20)) STORED;

drop function if exists create_completed_workout;

comment on column completed_workout_exercise.completed_workout_id is E'@omit create';
alter table completed_workout_exercise  drop column if exists volumes cascade;
drop table if exists volume cascade;

drop table if exists completed_set cascade;
create table completed_set(
  id integer primary key generated always as identity,
  weight smallint not null check (weight > 0),
  reps smallint not null check (reps > 0),
  completed_workout_exercise_id integer not null references completed_workout_exercise(id) on delete cascade
);
comment on column completed_set.id is E'@omit create';
comment on column completed_set.completed_workout_exercise_id is E'@omit create';
create index if not exists completed_set_completed_workout_exercise_idx on "completed_set"(completed_workout_exercise_id);
grant all on completed_set to public;



drop table if exists workout_plan cascade;
CREATE TABLE public.workout_plan (
    id integer NOT NULL,
    name character varying NOT NULL,
    app_user_id integer NOT NULL default current_user_id(),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT non_empty_name CHECK ((((name)::text = ''::text) IS FALSE))
);








drop type if exists exercise_id_and_sets cascade;
create type exercise_id_and_sets as (
  exercise_id integer,
  completed_sets completed_set[]
);


delete from completed_workout_exercise;
alter table completed_workout_exercise drop column if exists completed_workout_id cascade;
ALTER TABLE completed_workout_exercise ADD COLUMN completed_workout_id integer not null references completed_workout(id) on delete cascade;
;

alter table completed_workout_exercise enable row level security;
drop policy if exists completed_workout_exercise_select_policy on completed_workout_exercise;
CREATE POLICY completed_workout_exercise_select_policy ON completed_workout_exercise FOR SELECT USING (true);
drop policy if exists completed_workout_exercise_insert_policy on completed_workout_exercise;
create POLICY completed_workout_exercise_insert_policy ON completed_workout_exercise FOR insert with check (id in (select completed_workout_exercise.id from completed_workout join completed_workout_exercise on completed_workout.id = completed_workout_exercise.completed_workout_id where app_user_id = (select current_user_id())));
drop policy if exists completed_workout_exercise_update_policy on completed_workout_exercise;
CREATE POLICY completed_workout_exercise_update_policy ON completed_workout_exercise FOR update USING (id in (select completed_workout_exercise.id from completed_workout join completed_workout_exercise on completed_workout.id = completed_workout_exercise.completed_workout_id where app_user_id = (select current_user_id())));
drop policy if exists completed_workout_exercise_delete_policy on completed_workout_exercise;
CREATE POLICY completed_workout_exercise_delete_policy ON completed_workout_exercise FOR delete USING (id in (select completed_workout_exercise.id from completed_workout join completed_workout_exercise on completed_workout.id = completed_workout_exercise.completed_workout_id where app_user_id = (select current_user_id())));

alter table completed_set enable row level security;
drop policy if exists completed_set_select_policy on completed_set;
CREATE POLICY completed_set_select_policy ON completed_set FOR SELECT USING (true);
drop policy if exists completed_set_insert_policy on completed_set;
create POLICY completed_set_insert_policy ON completed_set FOR insert with check (id in (select completed_set.id from completed_workout join completed_workout_exercise on completed_workout.id = completed_workout_exercise.completed_workout_id join completed_set on completed_workout_exercise.id = completed_set.completed_workout_exercise_id where app_user_id = (select current_user_id())));
drop policy if exists completed_set_update_policy on completed_set;
CREATE POLICY completed_set_update_policy ON completed_set FOR update USING (id in (select completed_set.id from completed_workout join completed_workout_exercise on completed_workout.id = completed_workout_exercise.completed_workout_id join completed_set on completed_workout_exercise.id = completed_set.completed_workout_exercise_id where app_user_id = (select current_user_id())));
drop policy if exists completed_set_delete_policy on completed_set;
CREATE POLICY completed_set_delete_policy ON completed_set FOR delete USING (id in (select completed_set.id from completed_workout join completed_workout_exercise on completed_workout.id = completed_workout_exercise.completed_workout_id join completed_set on completed_workout_exercise.id = completed_set.completed_workout_exercise_id where app_user_id = (select current_user_id())));

create index if not exists completed_workout_exercise_completed_workout_idx on "completed_workout_exercise"(completed_workout_id);

drop function if exists save_workout cascade;
create or replace function save_workout(exercise_ids_and_sets exercise_id_and_sets[]) returns void as $$
declare
  id_and_sets exercise_id_and_sets;
  set completed_set;
  workout_id integer;
  exercise_id integer;
begin
  insert into completed_workout(app_user_id) values ((select current_user_id())) returning id into workout_id;
  foreach id_and_sets in array exercise_ids_and_sets loop
    insert into completed_workout_exercise(completed_workout_id, exercise_id) values (workout_id, id_and_sets.exercise_id) returning id into exercise_id;
    foreach set in array id_and_sets.completed_sets loop
      insert into completed_set(completed_workout_exercise_id, reps, weight) values (exercise_id, set.reps, set.weight);
    end loop;
  end loop;
end; $$ language plpgsql security definer;
