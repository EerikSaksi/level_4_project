--updates the current battle and group for the users workout/exercise log
CREATE FUNCTION update_battle_to_current()
  RETURNS TRIGGER AS $$
  BEGIN
    select groupName into NEW.groupName from "user" where username = NEW.username;
    select battle_number into NEW.battle_number from "group" where name = 'Dream Team';
    return NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercise_to_current_battle
before insert on "user_exercise"
FOR EACH ROW 
EXECUTE PROCEDURE update_battle_to_current();


--check if there exist at least 2 members, in which case we initialize the first battle
CREATE FUNCTION check_member_count()
  RETURNS TRIGGER AS 
  $BODY$
  DECLARE
  num_members integer;
  BEGIN
    --user left group
    if OLD.groupName != null then
      --count members in old group
      select count(*) into num_members from "user" where groupName = OLD.groupName;
      --scale the health down (4 to 3 members means scale by 3/4)
      update "battle" 
      set current_health =  current_health * ((num_members - 1) / num_members),
      max_health = max_health * ((num_members - 1) / (num_members))
      where groupName = NEW.groupName and battle_number = (select battle_number from "group" where name = NEW.groupName);
    end if;

    --count members
    select count(*) into num_members from "user" where groupName = new.groupName;

    --should have battle
    if 2 <= num_members then  
      --check if this group has a battle yet, if not create one
      if not exists(select 1 from "battle" where battle_number = 1 and groupName = new.groupName) then
        insert into "battle"(groupName) values (new.groupName);
        raise notice 'update "group" set battle_number = 1 where name = NEW.groupName;';
        update "group" set battle_number = 1 where name = NEW.groupName;
      end if;
      --scale the health of the current enemy (if we went from 3 to 4 members then scale by 4/3)
      update "battle" 
      set current_health =  current_health * (num_members / (num_members - 1)),
      max_health = max_health * (num_members / (num_members - 1))
      where groupName = NEW.groupName and battle_number = (select battle_number from "group" where name = NEW.groupName);
    end if; 
    return NEW;
  END;
  $BODY$
LANGUAGE plpgsql;

CREATE TRIGGER check_member_count_on_user_join
after update of groupName on "user"
FOR EACH ROW 
EXECUTE PROCEDURE check_member_count();


--calculates how much damage this workout dealt based on the users current damage and the difficulty (which is calculated to hits) 
CREATE FUNCTION calculate_total_damage()
  RETURNS TRIGGER AS 
  $BODY$
  DECLARE
  
  hits integer;
  gn character varying(32);
  bn integer;
  new_current_health integer;
  new_enemy_level integer;
  BEGIN
    --load group and battle info to this table (so we can select when this battle was created)
    select groupName into gn from "user" where username = NEW.username;
    select battle_number into bn from "group" where name = gn;
    NEW.groupName = gn;
    NEW.battle_number = bn;

    --calculate hits and thus the damage that this dealt
    hits =  ((10 - NEW.average_rir) / 10.0 * NEW.sets);
    NEW.total_damage = (select dph from calculate_strength_stats(NEW.username)) * hits; 

    --subtract the dealt damage from the group's current battle
    update "battle"
    set current_health = current_health - NEW.total_damage 
    where battle_number = NEW.battle_number and groupName = gn;

    --get the updated health and current level from the current battle
    select enemy_level, current_health into new_enemy_level, new_current_health
      from "battle" 
      where battle_number = NEW.battle_number and groupName = gn;

    --if we dealt the killing blow then create a new battle with the next enemy
    if new_current_health <= 0 then
      new_enemy_level = new_enemy_level + 1;
      bn = bn + 1;
      select max_health into new_current_health from "enemy" where level = new_enemy_level;
      insert into "battle"(groupName, battle_number, enemy_level, current_health) values (gn, bn, new_enemy_level, new_current_health);
      update "group" set battle_number = battle_number + 1 where name = gn;
    end if;
    return NEW;
  END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insert_total_damage
before insert on "workout"
FOR EACH ROW 
EXECUTE PROCEDURE calculate_total_damage();
