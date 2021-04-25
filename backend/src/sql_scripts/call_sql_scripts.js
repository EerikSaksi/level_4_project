const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const exercise_json = require("../strength_level/exercise_metadata");

async function exec_file(fileName, client) {
  const sql = fs.readFileSync(path.resolve(__dirname, fileName), "UTF-8");
  await client.query(sql);
}
async function init_enemies(client) {
  for (var level = 2; level < 300; level++) {
    //decide what the enemy name is (they simply rotate)
    var enemy = "";
    switch (level % 8) {
      case 0:
        enemy = "Mudcrab";
        break;
      case 1:
        enemy = "Earth Golem";
        break;
      case 2:
        enemy = "Fire Devil";
        break;
      case 3:
        enemy = "Frogman, King of Deadlift Leverages";
        break;
      case 4:
        enemy = "Guardian of the Frost Cavern";
        break;
      case 5:
        enemy = "Minotaur";
        break;
      case 6:
        enemy = "Queen of Scorpions";
        break;
      case 7:
        enemy = "Defender on the Air Temple";
        break;
    }

    //insert new enemy level, name and hp calculated based on level
    await client.query(`
      insert into
        "enemy" (level, max_health, name)
      values
        (${level}, ${10 + 5 * level}, '${enemy}');
    `);
  }
}

async function init_exercises(client) {
  exercise_json.exerciseGroups.map((group) => {
    group.exercises.map(async (exercise) => {
      const { id, stringId, bodyPart, weightConnection, type, name, exerciseAliases } = exercise;
      console.log(`
          insert into "exercise" (id, string_id, body_part, weight_connection, exercise_type, name) 
          values (${id}, '${stringId}', '${bodyPart}', '${weightConnection}', '${type}', '${name}');
        `);
      for (const alias of exerciseAliases) {
        console.log(`\ninsert into "exercise_alias" (id, name) values (${id}, '${alias}');`);
      }
    });
  });
}

async function run_all_sql_scripts() {
  const client = new Client("postgres://eerik:Postgrizzly@localhost:5432/rpgym");
  await client.connect();
  await exec_file("permissions.sql", client);
  await init_enemies(client);
  await init_exercises(client);
  await exec_file("hardcoded_values.sql", client);
  await client.end().catch((err) => console.log(err));
}
console.log(init_exercises());
