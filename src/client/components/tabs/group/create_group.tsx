import { gql, useMutation } from "@apollo/client";
import React, { useState } from "react";
import { StyleSheet, View, Switch, Text } from "react-native";
import { Button, Input } from "react-native-elements";
import CustomModal from "../../../util_components/custom_modal";
import globalStyles from "../../../style/global";
const styles = StyleSheet.create({
  row: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: "60%",
  },
});
const GROUP_TAKEN = gql`
  mutation($groupName: String!, $password: String) {
    createGroup(input: { group: { name: $groupName, password: $password } }) {
      group {
        name
      }
    }
  }
`;
const CreateGroup: React.FC<{ visible: boolean; setVisible: (arg: boolean) => void; refetchParentGroup: () => void }> = ({ visible, setVisible, refetchParentGroup }) => {
  const [newGroupName, setNewGroupName] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [createGroup] = useMutation(GROUP_TAKEN, {
    variables: { groupName: newGroupName, password: isPasswordProtected ? password : undefined },
    onCompleted: (data) => {
      if (!data.createGroup.group) {
        alert(`"${newGroupName}" has already been taken`);
      } else {
        refetchParentGroup();
      }
    },
  });
  return (
    <CustomModal visible={visible} setVisible={setVisible}>
      <View style={styles.row}>
        <Input style={globalStyles.text} placeholder="Team Name" value={newGroupName} onChangeText={(v) => setNewGroupName(v)} />
      </View>
      <View style={styles.row}>
        <Text>Requires password?</Text>
        <Switch value={isPasswordProtected} onValueChange={(v) => setIsPasswordProtected(v)} />
      </View>
      <View style={styles.row}>
        <Input style={globalStyles.text} disabled={!isPasswordProtected} placeholder="Password" value={password} onChangeText={(v) => setPassword(v)} secureTextEntry={true} textContentType="password" />
      </View>
      <Button disabled={newGroupName === "" || (isPasswordProtected && password === "")} title="Create Team" onPress={() => createGroup()} />
    </CustomModal>
  );
};
export default CreateGroup;
