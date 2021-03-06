--! Previous: sha1:59171950d15d2f1df34f59959090196480343472
--! Hash: sha1:c85acade02840f5ae74a84fba7f3ae0dcfd80c0c

-- Enter migration here
alter table "completed_workout_exercise" drop column if exists volumes cascade;

do $$
  begin
  drop table if exists volume cascade;
  exception 
    when sqlstate '42809' then
      raise notice '';
end $$;

do $$
  begin
  drop type if exists volume cascade;
  exception 
    when sqlstate '2BP01' then
      raise notice '';
end $$;
create table volume(
  weight double precision not null,
  reps smallint not null
);
grant all on volume to public;
ALTER TABLE "completed_workout_exercise" ADD COLUMN volumes public.volume[] NOT NULL; 

ALTER TABLE "workout_plan_day" alter column workout_plan_id set not null;

alter TABLE "workout_plan_exercise" drop COLUMN if exists ordering;
ALTER TABLE "workout_plan_exercise" ADD COLUMN ordering smallint not null;

alter TABLE "workout_plan_exercise" drop COLUMN if exists workout_plan_day_id;
ALTER TABLE "workout_plan_exercise" ADD COLUMN workout_plan_day_id integer not null references "workout_plan_day"(id) on delete cascade;
create index if not exists workout_plan_exercise_workout_plan_day_idx on "workout_plan_exercise"(workout_plan_day_id);

alter table "workout_plan_day" drop column if exists workout_exercises cascade;
alter table "workout_plan_exercise" alter column sets type smallint;
alter table "workout_plan_exercise" alter column reps type smallint;

ALTER TABLE "workout_plan_exercise" drop CONSTRAINT if exists unique_ordering_workout_plan_day_id;
ALTER TABLE "workout_plan_exercise" ADD CONSTRAINT unique_ordering UNIQUE (ordering, workout_plan_day_id) DEFERRABLE INITIALLY DEFERRED;

alter TABLE "workout_plan_exercise" drop COLUMN if exists id;
ALTER TABLE "workout_plan_exercise" ADD COLUMN id integer primary key generated always as identity;
