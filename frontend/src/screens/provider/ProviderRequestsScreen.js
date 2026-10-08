import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StatusBar, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { COLORS, SHADOWS } from "../../constants/theme";
import { useProviderData } from "../../context/ProviderContext";
import Avatar from "../../components/provider/Avatar";
import ScreenHeader, { BellButton } from "../../components/provider/ScreenHeader";
import { bookingPreference, bookingPrice } from "../../services/bookingService";

const NOTICE_MS = 3000;

// ---------------------------------------------------------------------------
// Request card
// ---------------------------------------------------------------------------
const Detail = ({ label, value, strong, align }) => (
  <View style={[styles.detail, align === "right" && styles.detailRight]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, strong && styles.detailStrong]}>{value}</Text>
  </View>
);

const RequestCard = ({ item, onAccept, onReject, busy }) => {
  const [expanded, setExpanded] = useState(false), [rejecting, setRejecting] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar name={item.customer} size={48} radius={14} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.customer}</Text>
          <Text style={styles.service}>{item.service}</Text>
        </View>
        {item.urgent ? (
          <View style={[styles.tag, styles.tagUrgent]}>
            <View style={styles.urgentDot} />
            <Text style={styles.tagUrgentText}>Urgent</Text>
          </View>
        ) : (
          <View style={[styles.tag, styles.tagStandard]}>
            <Text style={styles.tagStandardText}>Standard</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
        {item.description}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Detail label="Preferred date" value={item.date} />
          <Detail label="Time" value={bookingPreference(item)} />
        </View>
        <View style={[styles.detailRow, styles.detailRowSpaced]}>
          <View style={styles.locationCol}>
            <Detail label="Location" value={item.location} />
          </View>
          <Detail label="Pricing" value={bookingPrice(item)} strong align="right" />
        </View>
      </View>

      {item.photos > 0 && (
        <View style={styles.photoRow}>
          <MaterialCommunityIcons name="image-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.photoText}>
            {item.photos} {item.photos === 1 ? "photo" : "photos"} attached
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={({ pressed }) => [styles.btn, styles.btnDetails, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnDetailsText}>{expanded ? "Less" : "Details"}</Text>
        </Pressable>
        <Pressable
          disabled={busy} onPress={() => setRejecting(true)}
          style={({ pressed }) => [styles.btn, styles.btnReject, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnRejectText}>Reject</Text>
        </Pressable>
        <Pressable
          disabled={busy || item.status !== 'pending'} onPress={() => onAccept(item)}
          style={({ pressed }) => [styles.btn, styles.btnAccept, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnAcceptText}>{busy ? "Saving…" : item.status === "time_proposed" ? "Awaiting reply" : "Accept"}</Text>
        </Pressable>
      </View>
      {rejecting && <View style={styles.details}><Text style={styles.description}>Reject this request? The customer will see that you declined.</Text><Pressable accessibilityRole="button" disabled={busy} style={styles.btn} onPress={async () => { if (await onReject(item)) setRejecting(false); }}><Text style={styles.btnRejectText}>Confirm rejection</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} style={styles.btn} onPress={() => setRejecting(false)}><Text>Keep request</Text></Pressable></View>}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ProviderRequestsScreen = () => {
  const focused = useIsFocused();
  const { requests, acceptRequest, rejectRequest, pendingCount, loading, error, busy, load } = useProviderData();
  const [notice, setNotice] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showNotice = useCallback((message) => {
    setNotice(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), NOTICE_MS);
  }, []);

  const handleAccept = async item => {
    const updated = await acceptRequest(item.id);
    if (updated) showNotice(updated.status === 'awaiting_quote' ? 'Appointment accepted. A quote is still required before work.' : 'Appointment accepted.');
  };
  const handleReject = async item => {
    const updated = await rejectRequest(item.id);
    if (updated) showNotice('Request rejected.');
    return updated;
  };

  return (
    <View style={styles.screen}>
      {focused && <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />}

      <ScreenHeader
        title="Booking requests"
        subtitle={
          pendingCount === 0
            ? "No requests waiting"
            : `${pendingCount} awaiting your response`
        }
      >
        <BellButton />
      </ScreenHeader>

      <View style={styles.body}>
        {!!notice && (
          <View style={styles.notice}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
            <Text accessibilityLiveRegion="polite" style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading && <ActivityIndicator accessibilityLabel="Loading requests" color={COLORS.primary} />}
          {!!error && <Text accessibilityRole="alert" style={styles.btnRejectText}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={busy || loading} onPress={load} style={styles.btn}><Text style={styles.service}>Refresh requests</Text></Pressable>
          {requests.length > 0 ? (
            requests.map((item) => (
              <RequestCard
                key={item.id}
                item={item}
                busy={busy}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))
          ) : !loading && !error && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="check-all" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>You’re all caught up</Text>
              <Text style={styles.emptyText}>
                New booking requests will show up here when customers send them.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  pressed: { opacity: 0.85 },

  notice: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DDF5EA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...SHADOWS.small,
  },
  noticeText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0F8A5F" },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  cardInfo: { flex: 1, marginLeft: 14, marginRight: 8 },
  name: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  service: { fontSize: 14, fontWeight: "700", color: COLORS.primary, marginTop: 4 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagUrgent: { backgroundColor: "#FDE8E8" },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D93A3A" },
  tagUrgentText: { fontSize: 12, fontWeight: "800", color: "#D93A3A" },
  tagStandard: { backgroundColor: "#EFEFF4" },
  tagStandardText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textPrimary,
    marginTop: 14,
  },

  details: {
    backgroundColor: "#F4F5F9",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  detailRow: { flexDirection: "row" },
  detailRowSpaced: { marginTop: 12 },
  detail: { flex: 1 },
  detailRight: { alignItems: "flex-end", flex: 1, marginLeft: 10 },
  locationCol: { flex: 1 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted },
  detailValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginTop: 3 },
  detailStrong: { fontWeight: "800" },

  photoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  photoText: { fontSize: 13, color: COLORS.textMuted },

  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: {
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDetails: {
    flex: 0.8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
  },
  btnDetailsText: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  btnReject: {
    flex: 1,
    backgroundColor: "#FDE8E8",
    borderWidth: 1,
    borderColor: "#F4B9B9",
  },
  btnRejectText: { fontSize: 14, fontWeight: "800", color: "#D93A3A" },
  btnAccept: { flex: 1, backgroundColor: COLORS.primary, ...SHADOWS.medium },
  btnAcceptText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },

  // Empty
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});

export default ProviderRequestsScreen;
