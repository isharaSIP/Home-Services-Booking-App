import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const ProviderDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Provider Portal 🛠️</Text>
            <Text style={styles.userName}>{user?.name || "Service Provider"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBadge} onPress={logout}>
            <Text style={styles.logoutBadgeText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>SERVICE PROVIDER DASHBOARD</Text>
          </View>
          <Text style={styles.bannerTitle}>Manage Your Jobs & Orders</Text>
          <Text style={styles.bannerSubtitle}>
            Accept new service bookings and manage your earnings seamlessly.
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$480</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.9 ★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Provider Profile</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{user?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>
              {user?.providerDetails?.category || "General Repairs"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verification Status:</Text>
            <Text style={styles.statusVerified}>Active & Verified ✓</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  logoutBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutBadgeText: {
    color: COLORS.error,
    fontWeight: "bold",
    fontSize: 13,
  },
  banner: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bannerBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  bannerBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "bold",
  },
  bannerTitle: {
    color: COLORS.secondary,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  statusVerified: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.success,
  },
});

export default ProviderDashboard;
