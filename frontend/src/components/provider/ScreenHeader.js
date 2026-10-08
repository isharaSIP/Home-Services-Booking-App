import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";

/** White tile with a bell icon and a purple unread dot. */
export const BellButton = ({ onPress }) => (
  <Pressable
    onPress={onPress || (() => Alert.alert("Notifications", "Coming soon."))}
    accessibilityRole="button"
    accessibilityLabel="Notifications"
    style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
  >
    <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textPrimary} />
    <View style={styles.dot} />
  </Pressable>
);

/**
 * Fixed white header used by the provider tabs.
 * `children` render on the right (buttons).
 */
const ScreenHeader = ({ title, subtitle, children }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  text: { flex: 1, paddingRight: 12 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  pressed: { opacity: 0.8 },
});

export default ScreenHeader;
