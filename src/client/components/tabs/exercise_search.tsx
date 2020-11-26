import React, {useEffect, useState} from 'react';
import {useQuery, gql} from '@apollo/client';
import {Text, FlatList} from 'react-native';
import Loading from '../../util_components/loading';
import {slugify} from '../../util_components/slug';
const EXERCISE_SEARCH = gql`query($input: String!){
  exercises(filter: {slugName: {includesInsensitive: $input}}, orderBy: POPULARITY_RANKING_ASC, first: 5){
    nodes{
      slugName
    }
  }
}`;
const ExerciseSearch: React.FC<{input: string;}> = ({input}) => {
  const [sluggedInput, setSluggedInput] = useState("");
  useEffect(() => {
    setSluggedInput(slugify(input));
  }, [input]);
  const {data} = useQuery(EXERCISE_SEARCH, {
    variables: {input: sluggedInput},
    skip: input === ""
  });

  if (!data && input !== "") {
    return (<Loading />);
  }

  //either example search or actual search
  const exercises = input === ""
    ? ["bench-press", "deadlift", "squat", "shoulder-press", "pull-ups"]
    : data.exercises.nodes.map(exercise => exercise.slugName);

  return (
    <React.Fragment>
      {input === ""
        ?
        <Text style={{fontSize: 20, }}>
          Most popular searches
          </Text>
        : undefined}
      <FlatList data={exercises} style={{width: '100%'}}
        renderItem={({item}) => {
          return <ExerciseSearchResult item />;
        }}
      >
      </FlatList>
    </React.Fragment>
  );
};
export default ExerciseSearch;
