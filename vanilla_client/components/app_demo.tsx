import React, { useState, useRef, Suspense } from "react";
import { ScrollView, StyleSheet, View, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StrongerCharacter from "./app_demo/stronger_character";
import CreateUser from "./app_demo/create_user";
import AttackingCharacters from "./app_demo/attacking_characters";

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  view: {
    width: width,
  },
  arrow: {
    position: "absolute",
    right: 0,
    top: "50%",
  },
});
const EmptyWidthView = () => <View style={styles.view} />;
const AppDemo: React.FC<{ refetchUser: () => void }> = ({ refetchUser }) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);
  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.x)}
      horizontal={true}
      decelerationRate={0}
      snapToInterval={width}
      snapToAlignment={"center"}
      persistentScrollbar
    >
      <SafeAreaView style={styles.view}>
        <StrongerCharacter inView={scrollOffset < width} />
        <TouchableOpacity
          style={styles.arrow}
          onPress={() => scrollViewRef?.current?.scrollTo({ x: scrollOffset + width, animated: true })}
        >
        </TouchableOpacity>
      </SafeAreaView>
      <SafeAreaView style={styles.view}>
        {width * 0.05 <= scrollOffset && scrollOffset <= width * 1.95 ? (
          <Suspense fallback={<EmptyWidthView />}>
            <AttackingCharacters />
          </Suspense>
        ) : (
          <EmptyWidthView />
        )}

        <TouchableOpacity
          style={styles.arrow}
          onPress={() => scrollViewRef?.current?.scrollTo({ x: scrollOffset + width, animated: true })}
        >
        </TouchableOpacity>
      </SafeAreaView>
      <View style={styles.view}>
        {1.8 * width <= scrollOffset ? (
          <Suspense fallback={<EmptyWidthView />}>
            <CreateUser refetchUser={refetchUser} />
          </Suspense>
        ) : (
          <EmptyWidthView />
        )}
      </View>
    </ScrollView>
  );
};
export default AppDemo;
