import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProviderDashboard from "../screens/provider/ProviderDashboard";

const Stack = createNativeStackNavigator();

const ProviderNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProviderDashboard" component={ProviderDashboard} />
    </Stack.Navigator>
  );
};

export default ProviderNavigator;
