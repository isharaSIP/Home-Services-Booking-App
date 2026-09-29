import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/theme";

import AuthNavigator from "./AuthNavigator";
import CustomerNavigator from "./CustomerNavigator";
import ProviderNavigator from "./ProviderNavigator";
import AdminNavigator from "./AdminNavigator";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : userRole === "provider" ? (
        <Stack.Screen name="ProviderNavigator" component={ProviderNavigator} />
      ) : userRole === "admin" ? (
        <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="CustomerNavigator" component={CustomerNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
  },
});

export default RootNavigator;
