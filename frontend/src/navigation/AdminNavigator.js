import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminDashboard from "../screens/admin/AdminDashboard";

const Stack = createNativeStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
