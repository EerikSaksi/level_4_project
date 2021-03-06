import React, {useRef, useEffect, useState} from 'react';
import {
  CompletedWorkoutExerciseInput,
  useSaveWorkoutMutation,
  ExerciseIdAndSetInput
} from '../../../../generated/graphql';
import {Button, Portal, Dialog} from 'react-native-paper';
import {View, Text} from 'react-native';
import {ExerciseSetVolumes} from './use_local_volumes';
import {WorkoutDayNavigationProp} from './day';

const transformVolumeToPayload = (
  exerciseSetVolumes: ExerciseSetVolumes,
  completedWorkoutId: number,
): ExerciseIdAndSetInput => {
  const toReturn: ExerciseIdAndSetInput[] = [];
  for (const [_, {exerciseId, }] of Object.entries(exerciseSetVolumes)) {
    //filter sets that were not completed, and cast to Volume (where reps and sets must be defined)
    const filteredVolumes = volumes.filter(volume => volume.weight && volume.reps)
  }
  return toReturn;
};
const WorkoutTimer: React.FC<{
  exerciseSetVolumes: ExerciseSetVolumes;
  appUserId: number;
  navigation: WorkoutDayNavigationProp;
}> = ({exerciseSetVolumes, appUserId, navigation}) => {
  const startTime = useRef<Date | undefined>();
  const [minutes, setMinutes] = useState<undefined | number>();
  const [dialogVisible, setDialogVisible] = useState(false);
  const closeDialog = () => setDialogVisible(false);

  const saveWorkout = useSaveWorkoutMutation({
    variables: {
    }
  })

  useEffect(() => {
    if (!startTime.current) {
      //user has tracked a lift, then start the timer
      for (const [_, {volumes}] of Object.entries(exerciseSetVolumes)) {
        if (volumes.some(volume => volume.weight || volume.reps)) {
          startTime.current = new Date();
          setMinutes(0);
          break;
        }
      }
    }
    const interval = setInterval(() => {
      if (startTime.current) {
        setMinutes(Math.floor((+new Date() - +startTime.current) / 60000));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [startTime, exerciseSetVolumes]);

  if (minutes === undefined) {
    return null;
  }
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        flex: 1,
        justifyContent: 'center',
        padding: 8,
      }}>
      <Button
        mode="contained"
        labelStyle={{fontSize: 18}}
        icon="stop-circle"
        onPress={() => setDialogVisible(true)}>
        <Text style={{fontSize: 14}}>{minutes} min</Text>
      </Button>
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>Do you want to end your workout?</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button mode="contained" onPress={() => {closeDialog(); createCompletedWorkout()}}>
              End
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};
export default WorkoutTimer;
