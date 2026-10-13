import React, { useEffect, useState } from "react";
import { StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/theme";
import { getProvider } from "../services/providerService";
import ProviderProfileModal from "../screens/customer/ProviderProfileModal";

import CustomerDashboard from "../screens/customer/CustomerDashboard";
import ExploreScreen from "../screens/customer/ExploreScreen";
import BookingsScreen from "../screens/customer/BookingsScreen";
import MessagesScreen from "../screens/customer/MessagesScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TAB_ICONS = {
  Home: require('../../assets/images/booking/nav-imgSvg.svg'),
  Explore: require('../../assets/images/booking/nav-imgSvg1.svg'),
  Bookings: require('../../assets/images/booking/nav-imgSvg2.svg'),
  Messages: require('../../assets/images/booking/nav-imgSvg3.svg'),
  Profile: require('../../assets/images/booking/nav-imgSvg4.svg'),
};



// [route name, label, outline icon, filled icon, screen]
const TABS = [
  ["Home", "Home", "home-variant-outline", "home-variant", CustomerDashboard],
  ["Explore", "Explore", "compass-outline", "compass", ExploreScreen],
  ["Bookings", "Bookings", "clipboard-text-outline", "clipboard-text", BookingsScreen],
  ["Messages", "Messages", "message-text-outline", "message-text", MessagesScreen],
  ["Profile", "Profile", "account-outline", "account", ProfileScreen],
];

const CustomerTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === "ios" ? 60 + insets.bottom : 65 + Math.max(0, insets.bottom),
            paddingBottom: Math.max(8, insets.bottom),
          },
        ],
        tabBarItemStyle: styles.item,
      }}
    >
      {TABS.map(([name, label, , , component]) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label,

            tabBarBadgeStyle: styles.badge,
            tabBarIcon: ({ color }) => (
              <Image accessible={false} source={TAB_ICONS[name]} tintColor={color} style={{ width: 22, height: 22 }} contentFit="contain" />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

function ProviderProfileRoute({ navigation, route }) {
  const providerId = route.params?.providerId;
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(Boolean(providerId));
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!providerId) return undefined;
    const controller = new AbortController();
    getProvider(providerId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setProvider(result);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || "Unable to load this profile. Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [providerId, retryKey]);

  const retry = () => {
    setProvider(null);
    setLoading(true);
    setError("");
    setRetryKey((current) => current + 1);
  };

  return (
    <ProviderProfileModal
      visible
      provider={provider}
      loading={loading}
      error={providerId ? error : "Provider not found."}
      onClose={() => navigation.goBack()}
      onRetry={retry}
      onTrackBookings={() => navigation.navigate("CustomerTabs", { screen: "Bookings" })}
    />
  );
}

const CustomerNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
    <Stack.Screen
      name="ProviderProfile"
      component={ProviderProfileRoute}
      options={{ animation: "slide_from_right" }}
    />
  </Stack.Navigator>
);

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
