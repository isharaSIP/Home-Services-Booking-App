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

const CustomerDashboard = () => {
  const { user, logout } = useAuth();

  const services = [
    { id: 1, title: "Plumbing", icon: "🔧" },
    { id: 2, title: "Electrical", icon: "⚡" },
    { id: 3, title: "House Cleaning", icon: "🧹" },
    { id: 4, title: "AC Repair", icon: "❄️" },
    { id: 5, title: "Carpentry", icon: "🪚" },
    { id: 6, title: "Painting", icon: "🎨" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome 👋</Text>
            <Text style={styles.userName}>{user?.name || "Customer"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBadge} onPress={logout}>
            <Text style={styles.logoutBadgeText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Role Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>CUSTOMER DASHBOARD</Text>
          </View>
          <Text style={styles.bannerTitle}>Need a Home Service?</Text>
          <Text style={styles.bannerSubtitle}>
            Book verified experts near you with guaranteed satisfaction.
          </Text>
        </View>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <View style={styles.servicesGrid}>
          {services.map((item) => (
            <TouchableOpacity key={item.id} style={styles.serviceCard}>
              <Text style={styles.serviceIcon}>{item.icon}</Text>
              <Text style={styles.serviceTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Info Summary */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{user?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status:</Text>
            <Text style={styles.statusVerified}>Verified ✓</Text>
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
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bannerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: "48%",
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
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

export default CustomerDashboard;
