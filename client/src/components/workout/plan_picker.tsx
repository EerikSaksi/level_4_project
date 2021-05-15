import React, { useEffect } from "react";
import { useWorkoutQuery, useUpsertCurrentWorkoutPlanMutation, useDeleteCurrentWorkoutPlanMutation } from "../../generated/graphql";
import { ActivityIndicator, Checkbox } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { List } from "react-native-paper";
import { cache } from "../../apollo/cache";
import { Text } from "react-native";

const WorkoutPlanPicker: React.FC = () => {
  const navigation = useNavigation();
  const { data } = useWorkoutQuery({
    fetchPolicy: "cache-first",
  });
  useEffect(() => {
    if (data?.activeUser?.userCurrentWorkoutPlan?.workoutPlan) {
      //navigation.navigate("Select Workout Day", { days: data.activeUser.userCurrentWorkoutPlan.workoutPlan.workoutPlanDays.nodes });
    }
  }, [data]);
  const [upsertCurrentWorkoutPlan] = useUpsertCurrentWorkoutPlanMutation();
  const [deleteCurrentWorkoutPlanMutation] = useDeleteCurrentWorkoutPlanMutation({
    onCompleted: (data) => {
      console.log(data)
    }
  });

  if (!data?.activeUser) {
    return <ActivityIndicator />;
  }
  return (
    <List.Section>
      {data.activeUser.workoutPlans.nodes.map((plan) => (
        <List.Item
          key={plan.id}
          title={plan.name}
          right={() => (
            <Checkbox
              status={plan.id === data.activeUser?.userCurrentWorkoutPlan?.workoutPlan?.id ? "checked" : "unchecked"}
              onPress={() => {
                if (data.activeUser) {
                  if (plan.id === data.activeUser?.userCurrentWorkoutPlan?.workoutPlan?.id) {
                    deleteCurrentWorkoutPlanMutation({ variables: { userId: data.activeUser.id } });
                  }
                  else{
                    upsertCurrentWorkoutPlan({ variables: { userId: data.activeUser.id, workoutPlanId: plan.id } });
                  }
                }
              }}
            />
          )}
        />
      ))}
    </List.Section>
  );
};
export default WorkoutPlanPicker;
