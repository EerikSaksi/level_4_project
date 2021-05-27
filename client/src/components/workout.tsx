import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import WorkoutPlanPicker from "./workout/plan_picker";
import WorkoutDayPicker from "./workout/plan_picker/day_picker";
import WorkoutDay from "./workout/plan_picker/day_picker/day";
import { WorkoutDayFragment, WorkoutPlanExerciseFragment} from "generated/graphql";
import {NavigatorScreenParams} from "@react-navigation/native";


type RootStackParamList = {
  "Select Workout": undefined;
  "Select Workout Day": NavigatorScreenParams<{ days: WorkoutDayFragment[] }>;
  "Workout":  NavigatorScreenParams<{ exercises: WorkoutPlanExerciseFragment[], name: string}>;
};
const Stack = createStackNavigator<RootStackParamList>();

const Workout: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Select Workout" >
      <Stack.Screen name="Select Workout" component={WorkoutPlanPicker} />
      <Stack.Screen name="Select Workout Day" component={WorkoutDayPicker} />
      <Stack.Screen name="Workout" component={WorkoutDay} 
        options={({ route }) => ({ title: route.params.name })}
      />
    </Stack.Navigator>
  );
};
export 
default Workout;