import React from "react";
import { View, Text, Pressable, ScrollView, StatusBar, StyleSheet, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/provider/Avatar";
import ScreenHeader, { BellButton } from "../../components/provider/ScreenHeader";
import { PROVIDER, EARNINGS, SERVICES, formatMoney } from "../../constants/providerData";

const GREEN = "#0F8A5F";
const STAR = "#E59A0C";

// ---------------------------------------------------------------------------
// Earnings bar chart (plain Views, no extra packages)
// ---------------------------------------------------------------------------
const EarningsChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.amount));
  return (
    <View style={chart.row}>
      {data.map((d, i) => {
        const height = Math.max(14, Math.round((d.amount / max) * 100));
        const current = i === data.length - 1;
        return (
          <View key={d.label} style={chart.col}>
            <Text style={[chart.value, current && chart.valueCurrent]}>
              {(d.amount / 1000).toFixed(1)}k
            </Text>
            <View style={[chart.bar, { height }, current && chart.barCurrent]} />
            <Text style={chart.label}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const chart = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 150,
    marginTop: 18,
    gap: 12,
    paddingHorizontal: 4,
  },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", maxWidth: 52, borderRadius: 12, backgroundColor: "#DCD3FB", marginTop: 6 },
  barCurrent: { backgroundColor: COLORS.primary },
  value: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  valueCurrent: { color: COLORS.primary },
  label: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ProviderProfileScreen = () => {
  const { user, logout } = useAuth();
  const focused = useIsFocused();
  const name = user?.name || "Service Provider";
  const comingSoon = (title) => Alert.alert(title, "Coming soon.");

  const confirmLogout = () =>
    Alert.alert("Log out", "Are you sure you want to log out of this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);

  return (
    <View style={styles.screen}>
      {focused && <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />}

      <ScreenHeader title="Profile & earnings">
        <Pressable
          onPress={() => comingSoon("Edit profile")}
          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <BellButton />
      </ScreenHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.profileTop}>
            <View>
              <Avatar
                name={name}
                uri={user?.avatar || user?.profileImage}
                size={72}
                radius={18}
                fontSize={24}
              />
              {PROVIDER.verified && (
                <View style={styles.verifyBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={22} color={COLORS.primary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.profileRole} numberOfLines={1}>
                {PROVIDER.category} · {PROVIDER.experience}
              </Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="star" size={16} color={STAR} />
                <Text style={styles.ratingText}>
                  {PROVIDER.rating.toFixed(1)} <Text style={styles.reviewText}>({PROVIDER.reviews})</Text>
                </Text>
                {PROVIDER.verified && (
                  <View style={styles.verifiedPill}>
                    <View style={styles.verifiedDot} />
                    <Text style={styles.verifiedText}>Verified provider</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsPanel}>
            {[
              [String(PROVIDER.jobsDone), "Jobs done"],
              [`${PROVIDER.acceptance}%`, "Acceptance"],
              [PROVIDER.rating.toFixed(1), "Rating"],
            ].map(([value, label], i) => (
              <View key={label} style={[styles.stat, i > 0 && styles.statDivider]}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Earnings */}
        <View style={[styles.card, styles.cardSpaced]}>
          <View style={styles.earningsTop}>
            <View>
              <Text style={styles.mutedSmall}>Earnings this month</Text>
              <Text style={styles.earningsValue}>{formatMoney(EARNINGS.month)}</Text>
            </View>
            <View style={styles.pendingCol}>
              <Text style={styles.mutedSmall}>Pending</Text>
              <Text style={styles.pendingValue}>{formatMoney(EARNINGS.pendingPayout)}</Text>
            </View>
          </View>

          <EarningsChart data={EARNINGS.weeks} />

          <Pressable
            onPress={() => comingSoon("Transaction history")}
            style={({ pressed }) => [styles.historyBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={20} color={COLORS.textPrimary} />
            <Text style={styles.historyText}>View transaction history</Text>
          </Pressable>
        </View>

        {/* Services & pricing */}
        <View style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>Services & pricing</Text>
          {SERVICES.map((s, i) => (
            <View key={s.id} style={[styles.serviceRow, i < SERVICES.length - 1 && styles.serviceDivider]}>
              <View style={styles.serviceText}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceUnit}>{s.unit}</Text>
              </View>
              <Text style={styles.servicePrice}>{formatMoney(s.price)}</Text>
            </View>
          ))}
        </View>

        {/* Log out */}
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="logout" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  pressed: { opacity: 0.85 },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
  },
  editText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    ...SHADOWS.small,
  },
  cardSpaced: { marginTop: 14 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },

  // Profile
  profileTop: { flexDirection: "row", alignItems: "center" },
  verifyBadge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  profileRole: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginTop: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" },
  ratingText: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary },
  reviewText: { fontWeight: "500", color: COLORS.textMuted },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DDF5EA",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  verifiedText: { fontSize: 11, fontWeight: "800", color: GREEN },

  statsPanel: {
    flexDirection: "row",
    backgroundColor: "#F4F5F9",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: COLORS.disabledBg },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },

  // Earnings
  earningsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mutedSmall: { fontSize: 13, color: COLORS.textMuted },
  earningsValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  pendingCol: { alignItems: "flex-end" },
  pendingValue: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginTop: 4 },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginTop: 18,
  },
  historyText: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },

  // Services
  serviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  serviceDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.inputBorder },
  serviceText: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  serviceUnit: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  servicePrice: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FDE8E8",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 18,
  },
  logoutText: { fontSize: 15, fontWeight: "800", color: COLORS.error },
});

export default ProviderProfileScreen;
