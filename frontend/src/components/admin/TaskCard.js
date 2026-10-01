import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../../constants/theme";

const TONES = {
  purple: {
    tileBg: "#EDE9FE",
    tileIcon: COLORS.primary,
    badgeBg: COLORS.primary,
    badgeText: "#FFFFFF",
  },
  red: {
    tileBg: "#E0ECFF",
    tileIcon: "#3B6FE0",
    badgeBg: "#FDE8E8",
    badgeText: "#D93A3A",
  },
};

const TaskCard = ({
  icon,
  title,
  subtitle,
  badge,
  actionLabel,
  onPress,
  tone = "purple",
  badgeTone = tone,
}) => {
  const t = TONES[tone];
  const b = TONES[badgeTone];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.tile, { backgroundColor: t.tileBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={t.tileIcon} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: b.badgeBg }]}>
          <Text style={[styles.badgeText, { color: b.badgeText }]}>{badge}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.action}
        activeOpacity={0.8}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, marginLeft: 14 },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  badge: {
    minWidth: 38,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
  },
  badgeText: { fontSize: 13, fontWeight: "800" },
  action: {
    backgroundColor: "#EEEAFD",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  actionText: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
});

export default TaskCard;