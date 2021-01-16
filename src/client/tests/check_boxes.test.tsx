import React from "react";
import renderer from "react-test-renderer";
import Checkboxes from "../components/check_boxes";
describe("<Checkboxes />", () => {
  jest.mock("react-native-elements", () => {
    return { CheckBox: <></> };
  });
  it("has 1 child", async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const tree = renderer.create(<Checkboxes setAllChecksFilled={(arg: boolean) => {}} />).toJSON();
    expect(tree).toMatchSnapshot("");
  });
});
