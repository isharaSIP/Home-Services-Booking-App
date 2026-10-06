import React, { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { bookingService, BOOKING_TIMES, bookingWhen } from "../../services/bookingService";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
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

        <ProviderBookings />

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

function ProviderBookings() {
  const [rows, setRows] = useState([]), [date, setDate] = useState(''), [time, setTime] = useState('08:00');
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [message, setMessage] = useState('');
  const request = useRef(null), lock = useRef(false);
  const load = useCallback(async () => { request.current?.abort(); const controller = new AbortController(); request.current = controller; try { const result = await bookingService.list(controller.signal); if (!controller.signal.aborted) setRows(result); } catch (e) { if (!controller.signal.aborted) setMessage(e.response?.data?.message || 'Unable to load requests.'); } finally { if (!controller.signal.aborted) setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); const timer = setInterval(load, 30000); return () => { clearInterval(timer); request.current?.abort(); }; }, [load]));
  async function publish() {
    if (lock.current) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setMessage('Enter a date as YYYY-MM-DD.'); return; }
    const start = new Date(date + 'T' + time + ':00+05:30');
    if (!Number.isFinite(start.getTime()) || new Date(start.getTime() + 19800000).toISOString().slice(0, 10) !== date || start <= new Date()) { setMessage('Choose a valid future date and time.'); return; }
    lock.current = true; setBusy(true);
    try { await bookingService.publishSlot(start.toISOString()); setMessage('Published: ' + bookingWhen(start) + '. Customers can now request this appointment.'); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not publish this appointment.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function update(id, action) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { const result = await bookingService.update(id, { action }); setRows(items => items.map(b => b.id === id ? result : b)); setMessage('Booking updated to ' + result.status + '.'); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not update booking.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const actions = { pending: [['confirm', 'Accept request'], ['reject', 'Decline']], confirmed: [['start', 'Start job']], ongoing: [['complete', 'Mark completed']] };
  return <View style={styles.infoCard}><Text style={styles.infoCardTitle}>Appointment availability</Text><Text style={{ color: COLORS.textMuted, marginBottom: 10 }}>Publish individual appointments in Sri Lanka time (up to 90 days ahead). Only published times appear to customers.</Text><TextInput accessibilityLabel="Appointment date YYYY-MM-DD" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} maxLength={10} style={{ borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 10, padding: 12, marginBottom: 10 }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{BOOKING_TIMES.map(t => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: time === t }} key={t} onPress={() => setTime(t)} style={{ padding: 12, borderRadius: 8, backgroundColor: time === t ? COLORS.primary : COLORS.inputBg }}><Text style={{ color: time === t ? '#FFF' : COLORS.textPrimary }}>{t}</Text></TouchableOpacity>)}</View><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={publish} style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, marginVertical: 12 }}><Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '600' }}>{busy ? 'Saving…' : 'Publish appointment'}</Text></TouchableOpacity>{!!message && <Text accessibilityRole="alert" style={{ color: COLORS.textPrimary, marginBottom: 12 }}>{message}</Text>}<Text style={styles.infoCardTitle}>Booking requests</Text>{loading && <ActivityIndicator color={COLORS.primary} />}<TouchableOpacity accessibilityRole="button" onPress={load}><Text style={{ color: COLORS.primary, marginBottom: 12 }}>Refresh requests</Text></TouchableOpacity>{!loading && rows.length === 0 && <Text>No requests yet.</Text>}{rows.map(b => <View key={b.id} style={{ borderTopWidth: 1, borderTopColor: COLORS.inputBorder, paddingVertical: 14, gap: 6 }}><Text style={{ fontWeight: '700' }}>{b.customerName} · {b.status.toUpperCase()}</Text><Text>{bookingWhen(b.startsAt)}</Text><Text>{b.service}</Text><Text>{b.problem}</Text><Text>{b.location}</Text>{!!b.notes && <Text>{b.notes}</Text>}<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{(actions[b.status] || []).map(([action, label]) => <TouchableOpacity key={action} accessibilityRole="button" disabled={busy} onPress={() => update(b.id, action)} style={{ padding: 12, backgroundColor: COLORS.inputBg, borderRadius: 8 }}><Text style={{ color: COLORS.primary }}>{label}</Text></TouchableOpacity>)}</View></View>)}</View>;
}

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
