import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../../constants/theme";

const TREND_GREEN = "#0F8A5F";

const StatCard = ({ label, value, trend, trendUp = false }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    <View style={styles.trendRow}>
      {trendUp && (
        <MaterialCommunityIcons
          name="arrow-up"
          size={13}
          color={TREND_GREEN}
          style={styles.trendIcon}
        />
      )}
      <Text style={styles.trend}>{trend}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...SHADOWS.small,
  },
  label: { fontSize: 13, color: COLORS.textMuted },
  value: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  trendRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  trendIcon: { marginRight: 2 },
  trend: { fontSize: 12, fontWeight: "700", color: TREND_GREEN },
});

export default StatCard;