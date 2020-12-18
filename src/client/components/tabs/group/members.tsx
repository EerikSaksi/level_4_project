import React, { useCallback, useState } from "react";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import BattlePicker from "./battle_selector";
import { FlatList } from "react-native-gesture-handler";
import { View, StyleSheet, Text, Switch } from "react-native";
import { generateShadow } from "react-native-shadow-generator";
import { useFocusEffect } from "@react-navigation/native";

const ALL_WORKOUTS = gql`
  query($groupname: String!) {
    group(name: $groupname) {
      nodeId
      battlesByGroupname {
        nodes {
          nodeId
          workoutsByGroupnameAndBattleNumber {
            nodes {
              nodeId
              totalDamage
              username
            }
          }
        }
      }
    }
  }
`;
const WORKOUTS_BY_BATTLE = gql`
  query($groupname: String!, $battleNumber: Int!) {
    battle(groupname: $groupname, battleNumber: $battleNumber) {
      nodeId
      workoutsByGroupnameAndBattleNumber {
        nodes {
          nodeId
          username
          totalDamage
        }
      }
    }
  }
`;

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  col: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    flex: 2,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    ...generateShadow(10),
    margin: "2%",
  },
  listContainer: {
    flex: 10,
  },
  listText: {
    fontSize: 20,
    textAlign: "center",
  },
  listHeading: {
    fontSize: 30,
    textAlign: "center",
  },
});

//convert all passed workout nodes to [username, totalDamage] pairs ordered by totalDamage
type workoutNode = { username: string; totalDamage: number };
const sortByTotalDamage = (data: any) => {
  var dict = {};
  //accumulate damage
  data.forEach((node: workoutNode) => {
    dict[node.username] ? (dict[node.username] += node.totalDamage) : (dict[node.username] = node.totalDamage);
  });
  // Create items array
  var asArray = Object.keys(dict).map((username): [string, number] => {
    return [username, dict[username]];
  });
  //sort descending by total damage
  asArray.sort((a, b) => b[1] - a[1]);
  return asArray;
};

type NavigationProps = { params: { groupname: string } };
const Members: React.FC<{ route: NavigationProps }> = ({ route }) => {
  const { groupname } = route.params;
  const [battleNumber, setBattleNumber] = useState<number | undefined>(undefined);
  const [showAllStats, setShowAllStats] = useState<boolean>(false);
  const [usersOrderedByDamage, setUsersOrderedByDamage] = useState<[string, number][]>();

  //fetch the workouts by current battle by default
  const [fetchWorkoutsByBattle] = useLazyQuery(WORKOUTS_BY_BATTLE, {
    variables: { groupname, battleNumber: battleNumber },
    onCompleted: (data) => setUsersOrderedByDamage(sortByTotalDamage(data.battle.workoutsByGroupnameAndBattleNumber.nodes)),
  });
  const [fetchAllWorkouts] = useLazyQuery(ALL_WORKOUTS, {
    variables: { groupname, battleNumber },
    onCompleted: (data) => {
      const allWorkouts = data.group.battlesByGroupname.nodes.flatMap((node) => node.workoutsByGroupnameAndBattleNumber.nodes);
      setUsersOrderedByDamage(sortByTotalDamage(allWorkouts));
    },
  });
  useFocusEffect(
    useCallback(() => {
      //if we have a valid battleNumber and we want stats on that battle
      if (battleNumber && !showAllStats) {
        fetchWorkoutsByBattle();
      } else if (showAllStats) {
        fetchAllWorkouts();
      }
    }, [battleNumber, showAllStats])
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.row}>
        <View style={styles.col}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text>All battles</Text>
            </View>
            <View style={styles.col}>
              <Switch value={showAllStats} onValueChange={(v) => setShowAllStats(v)} />
            </View>
          </View>
        </View>
        <View style = { styles.picker }>
          <BattlePicker battleNumber={battleNumber} setBattleNumber={setBattleNumber} groupname={groupname} />
        </View>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={usersOrderedByDamage}
          keyExtractor={(item, index) => item[0] + item[1].toString()}
          renderItem={({ item }) => (
            <View style={styles.container}>
              <View style={styles.row}>
                <Text style={styles.listHeading}>{`${item[0]}`}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.listText}>{`${item[1]} damage in ${showAllStats ? "all battles" : "Battle " + battleNumber} `}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
};
export default Members;