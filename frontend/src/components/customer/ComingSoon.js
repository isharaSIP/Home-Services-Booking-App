import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";

/**
 * Shared "coming soon" body for customer tabs that are not built yet.
 */
const ComingSoon = ({ icon, title, description }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={34} color={COLORS.primary} />
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Coming soon</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  pill: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 260,
    lineHeight: 20,
  },
});

export default ComingSoon;