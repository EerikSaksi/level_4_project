import React, {useEffect, useState} from 'react';
import {useQuery, gql} from '@apollo/client';
import {Text, FlatList} from 'react-native';
import Loading from '../../../util_components/loading';
import {slugify} from '../../../util_components/slug';
import ExerciseSearchResult from './exercise_search_result';

const EXERCISE_SEARCH = gql`query($input: String!){
  exercises(filter: {slugName: {includesInsensitive: $input}}, orderBy: POPULARITY_RANKING_ASC, first: 8){
    nodes{
      slugName
    }
  }
}`;

const USER_EXERCISE_SEARCH = gql`query($username: String!){
	user(username: $username){
    userExercisesByUsername{
      nodes{
        slugName
      }
    }
  }
}`


const ExerciseSearch: React.FC<{input: string, username: string, onlyShowTracked: boolean, refetchParent: () => void}> = ({input, username, onlyShowTracked, refetchParent}) => {
  //the user will enter search normally, so slugify their input to be compatible with the slugged exercises
  const [sluggedInput, setSluggedInput] = useState("");
  useEffect(() => {
    setSluggedInput(slugify(input));
  }, [input]);

  const {data} = useQuery(EXERCISE_SEARCH, {
    variables: {input: sluggedInput},
    skip: input === "" && onlyShowTracked
  });

  const {data: userData} = useQuery(USER_EXERCISE_SEARCH, {
    variables: {username, input: sluggedInput},
    skip: !onlyShowTracked
  });


  //if the user is inputting something and the requested search (user data when we only want tracked exercises or data when we want either) is undefined then loading
  if ((input !== "" && !onlyShowTracked && !data) || (onlyShowTracked && !userData)) {
    return (<Loading />)
  }

  //either example search or actual search
  const exercises =
    onlyShowTracked
      ? userData.user.userExercisesByUsername.nodes.map(exercise => exercise.slugName)
      : input === ""
        ? ["bench-press", "deadlift", "squat", "shoulder-press", "pull-ups", "dumbbell-bench-press", "barbell-curl", "dumbbell-curl"]
        //map the search that the user wants
        : data.exercises.nodes.map(exercise => exercise.slugName);

  //const exercises = ["bench-press"]

  return (
    <React.Fragment>
      {!onlyShowTracked && input === ""
        ?
        <Text style={{fontSize: 20, textAlign: 'center'}}>
          Most popular searches
          </Text>
        : undefined}
        <FlatList data={exercises} style={{width: '100%'}} keyExtractor = {(item) => item}
        renderItem={({item}) => <ExerciseSearchResult  exerciseSlug={item} username={username} refetchParent = {refetchParent} />
        }
      >
      </FlatList>
    </React.Fragment>
  );
};
export default ExerciseSearch;
