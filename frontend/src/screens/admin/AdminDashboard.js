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

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>System Administrator ⚡</Text>
            <Text style={styles.userName}>{user?.name || "Admin"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBadge} onPress={logout}>
            <Text style={styles.logoutBadgeText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>ADMIN CONTROL PANEL</Text>
          </View>
          <Text style={styles.bannerTitle}>FixMate System Overview</Text>
          <Text style={styles.bannerSubtitle}>
            Manage users, approve service providers, monitor system bookings & security.
          </Text>
        </View>

        {/* System Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>38</Text>
            <Text style={styles.statLabel}>Active Providers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>310</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>

        {/* Admin Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Admin Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Admin Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Privilege:</Text>
            <Text style={styles.roleAdmin}>SUPER ADMIN</Text>
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
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bannerBadge: {
    backgroundColor: "#EF4444",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
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
  roleAdmin: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.error,
  },
});

export default AdminDashboard;
