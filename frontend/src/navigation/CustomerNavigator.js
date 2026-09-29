import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerDashboard from "../screens/customer/CustomerDashboard";

const Stack = createNativeStackNavigator();

const CustomerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
    </Stack.Navigator>
  );
};

export default CustomerNavigator;
