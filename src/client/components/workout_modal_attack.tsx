import { gql, useQuery } from "@apollo/client";
import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Button } from "react-native-elements";
import SpriteBattle from "../sprites/sprite_battle";
import SpriteHealthBar from "../sprites/sprite_health_bar";
import SpriteSelector from "../sprites/sprite_selector";
import Loading from "../util_components/loading";

const STRENGTH = gql`
  query($username: String) {
    calculateStrengthStats(inputUsername: $username) {
      dph
    }
  }
`;

const styles = StyleSheet.create({
  textView: {
    flex: 1,
    textAlign: "center",
  },
});
const WorkoutModalAttack: React.FC<{ hits: number; skillTitle: string | undefined; username: string; setVisible: (val: boolean) => void; data: any }> = ({
  hits,
  skillTitle,
  username,
  setVisible,
  data,
}) => {
  //fetch strength stats. If we also loaded enemy starts, then start hitting
  const { data: strengthData } = useQuery(STRENGTH, {
    variables: {username},
    fetchPolicy: 'no-cache'
  });
  const [deliveredHits, setDeliveredHits] = useState(0);
  if (!strengthData){
    return (<Loading/>)
  }
  return (
    <React.Fragment>
      <SpriteBattle deliveredHits = {deliveredHits} setDeliveredHits = {setDeliveredHits} skillTitle = {skillTitle} dph = {strengthData.calculateStrengthStats.dph} currentHealth = {data.user.groupByGroupname.battleByNameAndBattleNumber.currentHealth}  maxHealth = {data.user.groupByGroupname.battleByNameAndBattleNumber.enemyByEnemyLevel.maxHealth} enemyName = {data.user.groupByGroupname.battleByNameAndBattleNumber.enemyByEnemyLevel.name} hits = {hits}/>
      <View style={styles.textView}>
        {hits === deliveredHits ? <Button title="Close" onPress={() => setVisible(false)} /> : <Button title="Skip animations" onPress={() => setDeliveredHits(hits)} />}
      </View>
    </React.Fragment>
  );
};
export default WorkoutModalAttack;
