import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";

const AdminSectionPlaceholder = ({ icon, title, description }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.empty}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Nothing here yet</Text>
        <Text style={styles.emptyText}>{description}</Text>
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 20,
  },
});

export default AdminSectionPlaceholder;