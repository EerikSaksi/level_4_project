import React, { useRef, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import User from "./components/user";
import Group from "./components/group";
import Workout from "./components/workout";
import { visibleSection } from "./apollo/cache";
import useAnalyticsSender from "./hooks/analytics/use_analytics_sender";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
const Tab = createBottomTabNavigator();

const PERSISTENCE_KEY = "NAVIGATION_STATE";
const App: React.FC<{ username: string }> = ({ username }) => {
  const navigationRef = useRef<any>();
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = useState();
  //init the analytics tracker and sender
  useAnalyticsSender(username);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== "web" && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString ? JSON.parse(savedStateString) : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      }
      catch(e){
        console.log(e)
      }
      finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState = {initialState}
      onStateChange={(state) => {
        const tab = navigationRef.current.getCurrentRoute().name;
        //set the tab as the visible section
        //group is never set as opening group will also open enemy or members. I'm adding "tab" because postgres doesnt like "user" as a variable name
        if (tab !== "Group") visibleSection(tab + "Tab");
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
      }}
    >
      <Tab.Navigator>
        <Tab.Screen name="User" component={User} initialParams={{ username }} />
        <Tab.Screen name="Group" component={Group} initialParams={{ username }} />
        <Tab.Screen name="Workout" component={Workout} initialParams={{ username }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
export default App;
