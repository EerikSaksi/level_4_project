import React, {useCallback, useState, useEffect} from 'react';
import {
  useWorkoutQuery,
  useRenameWorkoutPlanMutation,
  useDeleteWorkoutPlanMutation,
  useUpdateUserCurrentWorkoutPlanMutation,
} from '../../generated/graphql';
import {ActivityIndicator} from 'react-native-paper';
import {List} from 'react-native-paper';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../workout';
import NewWorkoutPlanDialog from './new_workout_plan_dialog';
import {ScrollView} from 'react-native';
import ListItemWithMenu from './list_item_with_menu';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Select Workout'>;
type Props = {
  navigation: NavigationProp;
};

const WorkoutPlanPicker: React.FC<Props> = ({navigation}) => {
  const {data} = useWorkoutQuery();
  const [workoutPlanNames, setWorkoutPlanNames] = useState<string[]>([]);

  useEffect(() => {
    if (data?.activeUser) {
      setWorkoutPlanNames(
        data.activeUser.workoutPlans.nodes.map(workoutPlan => workoutPlan.name),
      );
    }
  }, [data]);

  const [renameWorkoutPlan] = useRenameWorkoutPlanMutation({});
  const onRename = useCallback((id: number, newName: string) => {
    renameWorkoutPlan({
      variables: {
        name: newName,
        workoutPlanId: id,
      },
      optimisticResponse: {
        updateWorkoutPlan: {
          __typename: 'UpdateWorkoutPlanPayload',
          workoutPlan: {
            __typename: 'WorkoutPlan',
            name: newName,
            id: id,
          },
        },
      },
    });
  }, []);
  const [deleteWorkoutPlan] = useDeleteWorkoutPlanMutation();
  const onDelete = useCallback((id: number) => {
    deleteWorkoutPlan({
      variables: {
        workoutPlanId: id,
      },
      update(cache, {data}) {
        if (data?.deleteWorkoutPlan?.workoutPlan) {
          cache.evict({id: cache.identify(data.deleteWorkoutPlan.workoutPlan)});
        }
      },
      optimisticResponse: {
        deleteWorkoutPlan: {
          __typename: 'DeleteWorkoutPlanPayload',
          workoutPlan: {
            id: id,
            __typename: 'WorkoutPlan',
          },
        },
      },
    });
  }, []);

  const [updateUserCurrentWorkout] = useUpdateUserCurrentWorkoutPlanMutation();
  const onSetDefault = useCallback(
    (id: number) => {
      if (data?.activeUser?.id) {
        updateUserCurrentWorkout({
          variables: {currentWorkoutPlanId: id, userId: data.activeUser.id},
          optimisticResponse: {
            updateUser: {
              __typename: 'UpdateUserPayload',
              user: {
                __typename: 'User',
                id: data.activeUser.id,
                currentWorkoutPlanId: id,
              },
            },
          },
        });
      }
    },
    [data],
  );
  const onListItemPress = useCallback((id: number) => {
    navigation.navigate('Select Workout Day', {workoutPlanId: id});
  }, []);

  if (!data?.activeUser?.id) {
    return <ActivityIndicator />;
  }
  return (
    <ScrollView contentContainerStyle={{flex: 1, alignItems: 'center'}}>
      <List.Section style={{width: '80%'}}>
        {data.activeUser.workoutPlans.nodes.map(workoutPlan => (
          <ListItemWithMenu
            id={workoutPlan.id}
            name={workoutPlan.name}
            key={workoutPlan.id}
            defaults={{
              this: workoutPlan.id === data.activeUser!.currentWorkoutPlanId,
              onSet: onSetDefault,
            }}
            workoutPlanNames={workoutPlanNames}
            onPress={onListItemPress}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
        <NewWorkoutPlanDialog
          userId={data.activeUser.id}
          workoutPlanNames={workoutPlanNames}
        />
      </List.Section>
    </ScrollView>
  );
};
export default WorkoutPlanPicker;
