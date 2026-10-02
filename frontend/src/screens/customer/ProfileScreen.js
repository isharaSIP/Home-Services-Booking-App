import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/**
 * Profile is "coming soon", but it keeps the account details and the
 * Logout action so customers can still sign out.
 */
const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const confirmLogout = () =>
    Alert.alert("Log out", "Do you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Customer"}</Text>
        {!!user?.email && <Text style={styles.meta}>{user.email}</Text>}
        {!!user?.phone && <Text style={styles.meta}>{user.phone}</Text>}
      </View>

      <View style={styles.soon}>
        <MaterialCommunityIcons name="account-cog-outline" size={22} color={COLORS.primary} />
        <View style={styles.soonText}>
          <Text style={styles.soonTitle}>Profile settings</Text>
          <Text style={styles.soonSub}>Edit details, addresses and payments — coming soon.</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Soon</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={18} color={COLORS.error} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 18 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    ...SHADOWS.small,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 14 },
  meta: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  soon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    gap: 12,
    ...SHADOWS.small,
  },
  soonText: { flex: 1 },
  soonTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  soonSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  pill: { backgroundColor: "#EDE9FE", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FDE8E8",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 22,
  },
  logoutText: { fontSize: 15, fontWeight: "800", color: COLORS.error },
});

export default ProfileScreen;