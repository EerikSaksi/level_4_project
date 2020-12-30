import React, {useState, useEffect, useRef} from 'react'
import {gql, useMutation, useQuery} from '@apollo/client'
import {TextInput, Text, StyleSheet, TouchableOpacity, Animated, ImageBackground} from 'react-native'
import CenteredView from '../util_components/centered_view'
import {generateShadow} from 'react-native-shadow-generator'
import {SocialIcon} from 'react-native-elements'

const CREATE_USER = gql`mutation createuser($username: String!){
  createUser(username: $username)
}`


const USER = gql`query user($username: String!){
  user(username: $username){
    nodeId
    username
  }
}`


var styles = StyleSheet.create({
  input: {
    //backgroundColor: "white",
    width: '50%',
    textAlign: 'center',
    marginBottom: '2%',
    ...generateShadow(24)
  },
  text: {
    color: 'white',
    marginBottom: '2%',
  },
  button: {
    ...generateShadow(24),
    backgroundColor: "#DDDDDD",
    width: '50%',
  },
  image: {
    flex: 1,
    position: 'relative',
    resizeMode: 'cover',
  }
})

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const CreateUser: React.FC<{refetchUser: () => void, googleID: string | undefined, setGoogleID: (arg: string | undefined) => void}> = ({refetchUser, googleID, setGoogleID}) => {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const greenPixelValue = useRef<Animated.Value>(new Animated.Value(0)).current;

  //if succesfully created then user data exists for the current google user
  const [createUser] = useMutation(CREATE_USER, {
    variables: {username},
    onCompleted: (data) => {
      if (data.createUser){
        refetchUser()
      }
    },
  })

  //check if username exists
  const {data: userData, loading: userLoading} = useQuery(USER, {
    variables: {username},
    skip: username === ""
  })

  useEffect(() => {
    //contains disallowed characters
    if (username.length && username.match(/^[a-zA-Z0-9._]+$/) === null) {
      setError("Only characters, numbers and _ are allowed.")
    }
    else if (username.length >= 20) {
      setError("Username too long")
    }
    //not checking if userData 
    else if (!userLoading && userData && userData.user) {
      setError("Username taken")
    }
    else {
      setError("")
    }
  }, [username, userData])

  const submit = async () => {
    if (error.length === 0 && username.length !== 0) {
      createUser()
    }
  }
  useEffect(() => {
    //animate to red green or white depending on the current
    if (!username.length) {
      Animated.timing(greenPixelValue, {toValue: 0, useNativeDriver: false}).start()
    }
    else if (error.length !== 0) {
      Animated.timing(greenPixelValue, {toValue: 2, useNativeDriver: false}).start()
    }
    else {
      Animated.timing(greenPixelValue, {toValue: 1, useNativeDriver: false}).start()
    }
  }, [error, username])

  const backgroundColor = username.length === 0 ? 'white' : greenPixelValue.interpolate(
    {
      inputRange: [0, 1, 2],
      outputRange: ['white', 'lime', 'red']
    }
  )
  const content = googleID 
    ?
      <CenteredView>
        <Text style={styles.text}>
          {error}
        </Text>
        <AnimatedTextInput autoFocus = {true} onEndEditing={submit} style={[styles.input, {backgroundColor}]} value={username} placeholder="Enter username" onChangeText={(e) => setUsername(e)}>
        </AnimatedTextInput>
        <TouchableOpacity style={styles.button} disabled={error.length !== 0 || username.length === 0} onPress={submit} >
          <Text>
            Submit
          </Text>
        </TouchableOpacity>
      </CenteredView>
    :
      <CenteredView>
        <SocialIcon
          type="google"
          title={"Sign in with Google"}
          button
          style={{ width: "50%", ...generateShadow(24) }}
          onPress={async () => {
            setGoogleID("dne");
            refetchUser();
            //initAsync()
            ////get the token id and fetch data with it
            //const result: GoogleSignInAuthResult = await signInAsync();
            //setGoogleID(result.user!.uid)
          }}
        />
      </CenteredView>

  return (
    <ImageBackground imageStyle={{ zIndex: -1 }} style={styles.image}  source={require("./assets/squat.jpeg")}>
      <CenteredView>
        {content}
      </CenteredView>
    </ImageBackground>
  )
}
export default CreateUser
