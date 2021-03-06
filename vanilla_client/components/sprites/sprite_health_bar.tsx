import React from "react";
import { StyleSheet, View, Text, ViewStyle } from "react-native";
import {Animated} from 'react-native'
const styles = StyleSheet.create({
  container:{
    width: '100%'
  },
  outline: {
    borderWidth: 1,
    borderColor: "black",
    height: 20,
  },
  text: {
    textAlign: 'center'
  }
});
const SpriteHealthBar: React.FC<{ currentHealth: number; maxHealth: number, style?: ViewStyle }> = ({ currentHealth, maxHealth, style }) => {
  return (
    <View style = {style}>
      <Text style = { styles.text }>
        {`${currentHealth.toFixed(2)}/${maxHealth.toFixed(2)}`}
      </Text>
      <View style={styles.outline}>
        <View style = {{ backgroundColor: 'red', width: `${Math.max(currentHealth / maxHealth * 100, 0)}%`, height: '100%' }}>
        </View>
      </View>
    </View>
  );
};
export default SpriteHealthBar;
