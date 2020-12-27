import React from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@apollo/client/react/hooks/useQuery";
import { useState } from "react";
import { Text, Switch, View, StyleSheet, TextInput } from "react-native";
import { Button, Divider } from "react-native-elements";
import CustomModal from "../../../util_components/custom_modal";

const CREATE_BODY_STAT = gql`
  mutation($username: String!, $ismale: Boolean!, $bodymass: Int!) {
    createBodystat(input: { bodystat: { username: $username, ismale: $ismale, bodymass: $bodymass } }) {
      clientMutationId
    }
  }
`;

const UPDATE_BODY_STAT = gql`
  mutation($username: String!, $ismale: Boolean!, $bodymass: Int!) {
    updateBodystatByUsername(input: { username: $username, patch: { ismale: $ismale, bodymass: $bodymass } }) {
      clientMutationId
    }
  }
`;
const FETCH_BODY_STAT = gql`
  query($username: String!) {
    bodystat(username: $username) {
      nodeId
      ismale
      bodymass
    }
  }
`;
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modalStyles: {
    marginTop: "20%",
    marginBottom: "20%",
    justifyContent: "flex-start",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

const BodyStatsModal: React.FC<{ visible: boolean; setVisible: (b: boolean) => void; username: string; refetchParent: () => void }> = ({ visible, setVisible, username, refetchParent }) => {
  const [bodymass, setBodymass] = useState<number | undefined>(undefined);
  const [isMale, setIsMale] = useState(true);

  //check if the user has created body stats before (and in that case prefill the inputs)
  const { data, loading, refetch } = useQuery(FETCH_BODY_STAT, {
    variables: { username },
    onCompleted: ({ bodystat }) => {
      if (bodystat.ismale) {
        setIsMale(bodystat.ismale);
        setBodymass(bodystat.bodymass);
      }
    },
  });

  const [updateBodyStats] = useMutation(UPDATE_BODY_STAT, {
    variables: { bodymass, ismale: isMale, username },
    onCompleted: () => {
      refetch();
      refetchParent();
    },
  });
  const [createBodyStats] = useMutation(CREATE_BODY_STAT, {
    variables: { bodymass, ismale: isMale, username },
    onCompleted: () => {
      refetch();
      refetchParent();
    },
  });

  //disabled if still fetching existing body stats, and either update or create based on if the user has created stats befoer
  const bodyStatButton =
    loading || !bodymass ? (
      <Button title={loading ? "Loading" : "Enter a weight"} raised={true} disabled={true} />
    ) : data && data.bodystat ? (
      <Button title="Update body stats" raised={true} onPress={() => updateBodyStats()} />
    ) : (
      <Button title="Create body stats" raised={true} onPress={() => createBodyStats()} />
    );

  return (
    <CustomModal style = {styles.modalStyles} visible={visible} setVisible={setVisible} style={styles.modalStyles}>
      <View style={styles.container}>
        <TextInput
          style={{ textAlign: "center", flex: 1 }}
          value={bodymass ? bodymass.toString() : undefined}
          placeholder="Bodyweight (kg)"
          onChangeText={(text) => setBodymass(parseInt(text))}
          keyboardType={"numeric"}
        />
      </View>
      <Text>Which dataset would you like to use?</Text>
      <View style={styles.row}>
        <Text>Male</Text>
        <Switch value={!isMale} thumbColor={"white"} trackColor={{ false: "blue", true: "pink" }} onValueChange={(value) => setIsMale(!value)}></Switch>
        <Text>Female</Text>
      </View>
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>This data is private (needed for strength calculations)</Text>
        {bodyStatButton}
        <Divider style={{ backgroundColor: "black" }} />
      </View>
    </CustomModal>
  );
};
export default BodyStatsModal;
