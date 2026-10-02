import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

import CustomerDashboard from "../screens/customer/CustomerDashboard";
import ExploreScreen from "../screens/customer/ExploreScreen";
import BookingsScreen from "../screens/customer/BookingsScreen";
import MessagesScreen from "../screens/customer/MessagesScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";

const Tab = createBottomTabNavigator();

// Placeholder until unread messages come from the backend.
const UNREAD_MESSAGES = 2;

// [route name, label, outline icon, filled icon, screen]
const TABS = [
  ["Home", "Home", "home-variant-outline", "home-variant", CustomerDashboard],
  ["Explore", "Explore", "compass-outline", "compass", ExploreScreen],
  ["Bookings", "Bookings", "clipboard-text-outline", "clipboard-text", BookingsScreen],
  ["Messages", "Messages", "message-text-outline", "message-text", MessagesScreen],
  ["Profile", "Profile", "account-outline", "account", ProfileScreen],
];

const CustomerNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.item,
      }}
    >
      {TABS.map(([name, label, outline, filled, component]) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label,
            tabBarBadge: name === "Messages" && UNREAD_MESSAGES > 0 ? UNREAD_MESSAGES : undefined,
            tabBarBadgeStyle: styles.badge,
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons name={focused ? filled : outline} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.secondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.inputBorder,
    paddingTop: 6,
  },
  item: { paddingVertical: 2 },
  label: { fontSize: 11, fontWeight: "600" },
  badge: {
    backgroundColor: COLORS.primary,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});

export default CustomerNavigator;