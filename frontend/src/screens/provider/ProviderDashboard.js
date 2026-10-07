import React, { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { bookingService, BOOKING_TIMES, bookingWhen, money } from "../../services/bookingService";
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
import { BookingCharges } from '../customer/BookingsScreen';
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
  const [quoteFor, setQuoteFor] = useState(null);
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
  const actions = { pending: [['confirm', 'Accept request'], ['reject', 'Decline']], inspection_confirmed: [['inspect', 'Mark inspection performed']], confirmed: [['start', 'Start job']], ongoing: [['complete', 'Mark completed']] };
  return <View style={styles.infoCard}><PricingEditor /><Text style={styles.infoCardTitle}>Received payments: {money(rows.filter(b => b.payment?.status === 'paid').reduce((sum, b) => sum + b.invoice.totalMinor, 0))}</Text><Text style={styles.infoCardTitle}>Appointment availability</Text><Text style={{ color: COLORS.textMuted, marginBottom: 10 }}>Publish individual appointments in Sri Lanka time (up to 90 days ahead). Only published times appear to customers.</Text><TextInput accessibilityLabel="Appointment date YYYY-MM-DD" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} maxLength={10} style={{ borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 10, padding: 12, marginBottom: 10 }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{BOOKING_TIMES.map(t => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: time === t }} key={t} onPress={() => setTime(t)} style={{ padding: 12, borderRadius: 8, backgroundColor: time === t ? COLORS.primary : COLORS.inputBg }}><Text style={{ color: time === t ? '#FFF' : COLORS.textPrimary }}>{t}</Text></TouchableOpacity>)}</View><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={publish} style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, marginVertical: 12 }}><Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '600' }}>{busy ? 'Saving…' : 'Publish appointment'}</Text></TouchableOpacity>{!!message && <Text accessibilityRole="alert" style={{ color: COLORS.textPrimary, marginBottom: 12 }}>{message}</Text>}<Text style={styles.infoCardTitle}>Booking requests</Text>{loading && <ActivityIndicator color={COLORS.primary} />}<TouchableOpacity accessibilityRole="button" onPress={load}><Text style={{ color: COLORS.primary, marginBottom: 12 }}>Refresh requests</Text></TouchableOpacity>{!loading && rows.length === 0 && <Text>No requests yet.</Text>}{rows.map(b => <View key={b.id} style={{ borderTopWidth: 1, borderTopColor: COLORS.inputBorder, paddingVertical: 14, gap: 6 }}><Text style={{ fontWeight: '700' }}>{b.customerName} · {b.status.toUpperCase()}</Text><Text>{bookingWhen(b.startsAt)}</Text><Text>{b.service}</Text><Text>{b.problem}</Text><Text>{b.location}</Text>{!!b.notes && <Text>{b.notes}</Text>}<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{(actions[b.status] || []).filter(([action]) => action !== 'confirm' || b.pricing?.type === 'inspection' || b.quote?.status === 'accepted').map(([action, label]) => <TouchableOpacity key={action} accessibilityRole="button" disabled={busy} onPress={() => update(b.id, action)} style={{ padding: 12, backgroundColor: COLORS.inputBg, borderRadius: 8 }}><Text style={{ color: COLORS.primary }}>{label}</Text></TouchableOpacity>)}</View>{['pending', 'confirmed', 'inspecting', 'ongoing', 'quote_pending'].includes(b.status) && (b.pricing?.type !== 'inspection' || b.inspectionPerformed) && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => setQuoteFor(b.id)} style={{ paddingVertical: 12 }}><Text style={{ color: COLORS.primary }}>Send / revise itemised quote</Text></TouchableOpacity>}{quoteFor === b.id && <QuoteEditor booking={b} onClose={() => setQuoteFor(null)} onUpdate={result => { setRows(items => items.map(row => row.id === result.id ? result : row)); setQuoteFor(null); }} />}<BookingCharges booking={b} provider onUpdate={result => setRows(items => items.map(row => row.id === result.id ? result : row))} /></View>)}</View>;
}

const fieldStyle = { borderWidth: 1, borderColor: '#DAD6E8', backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginVertical: 6, color: '#272727' };
function Action({ label, onPress, disabled }) { return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ padding: 14, borderRadius: 10, backgroundColor: disabled ? '#AAA' : COLORS.primary, marginVertical: 6 }}><Text style={{ color: '#FFF', textAlign: 'center' }}>{label}</Text></TouchableOpacity>; }
function PricingEditor() {
  const [type, setType] = useState('fixed'), [amount, setAmount] = useState(''), [min, setMin] = useState(''), [max, setMax] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [inclusions, setInclusions] = useState(''), [exclusions, setExclusions] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useFocusEffect(useCallback(() => { const controller = new AbortController(); bookingService.pricing(controller.signal).then(p => { if (!p || controller.signal.aborted) return; setBankDetails(p.bankDetails || ''); setType(p.type); setAmount(String((p.amountMinor ?? p.inspectionFeeMinor ?? 0) / 100)); setMin(String((p.minMinor || 0) / 100)); setMax(String((p.maxMinor || 0) / 100)); setInclusions(p.inclusions); setExclusions(p.exclusions); }).catch(e => { if (!controller.signal.aborted) setMessage(e.response?.data?.message || 'Unable to load pricing.'); }); return () => controller.abort(); }, []));
  async function save() {
    if (lock.current) return;
    if (!inclusions.trim() || (type === 'estimate' ? !min.trim() || !max.trim() : !amount.trim())) { setMessage('Enter the price and included scope.'); return; }
    lock.current = true; setBusy(true);
    try { await bookingService.savePricing({ bankDetails, type, amount: Number(amount), inspectionFee: Number(amount), min: Number(min), max: Number(max), inclusions, exclusions }); setMessage('Pricing published. Existing bookings keep their agreed pricing.'); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not save pricing.'); } finally { lock.current = false; setBusy(false); }
  }
  return <View style={{ marginBottom: 24 }}><Text style={styles.infoCardTitle}>Service pricing</Text><Text>Publish pricing before customers book. Include every mandatory charge in the total.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['fixed', 'estimate', 'inspection'].map(t => <TouchableOpacity key={t} accessibilityRole="button" accessibilityState={{ selected: type === t }} onPress={() => setType(t)} style={{ padding: 12, backgroundColor: type === t ? '#E8DEFF' : '#FFF', borderRadius: 8 }}><Text>{t === 'fixed' ? 'Fixed price' : t === 'estimate' ? 'Estimated range' : 'Inspection fee'}</Text></TouchableOpacity>)}</View>{type === 'estimate' ? <><TextInput accessibilityLabel="Minimum estimate LKR" placeholder="Minimum estimate (LKR)" keyboardType="decimal-pad" value={min} onChangeText={setMin} style={fieldStyle} /><TextInput accessibilityLabel="Maximum estimate LKR" placeholder="Maximum estimate (LKR)" keyboardType="decimal-pad" value={max} onChangeText={setMax} style={fieldStyle} /></> : <TextInput accessibilityLabel="Price LKR" placeholder={type === 'fixed' ? 'Fixed total (LKR)' : 'Inspection fee (LKR)'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={fieldStyle} />}<TextInput accessibilityLabel="Included scope" placeholder="What is included?" multiline maxLength={1000} value={inclusions} onChangeText={setInclusions} style={fieldStyle} /><TextInput accessibilityLabel="Excluded work" placeholder="What is excluded? (optional)" multiline maxLength={1000} value={exclusions} onChangeText={setExclusions} style={fieldStyle} /><TextInput accessibilityLabel="Bank transfer instructions" placeholder="Bank name, branch, account holder and account number (optional; shown only to booked customers)" multiline maxLength={1000} value={bankDetails} onChangeText={setBankDetails} style={fieldStyle} /><Action label={busy ? 'Saving…' : 'Publish pricing'} disabled={busy} onPress={save} />{!!message && <Text accessibilityRole="alert">{message}</Text>}</View>;
}
function QuoteEditor({ booking, onUpdate, onClose }) {
  const [scope, setScope] = useState(booking.quote?.scope || booking.problem), [items, setItems] = useState([{ description: 'Labour', amount: '' }]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  async function send() {
    if (lock.current) return;
    if (items.some(item => !item.amount.trim())) { setError('Enter an amount for every item.'); return; }
    lock.current = true; setBusy(true);
    try { onUpdate(await bookingService.update(booking.id, { action: 'quote', scope, items: items.map(item => ({ ...item, amount: Number(item.amount) })) })); }
    catch (e) { setError(e.response?.data?.message || 'Unable to send quote.'); } finally { lock.current = false; setBusy(false); }
  }
  return <View style={{ padding: 12, backgroundColor: '#F3EEFF', borderRadius: 12 }}><Text style={styles.infoCardTitle}>Itemised quote</Text><Text>Enter the complete replacement total, not just the extra charge. Include labour, materials and any taxes. Work pauses until the customer decides.</Text>{booking.inspectionPerformed && <Text>The agreed inspection fee of {money(booking.pricing?.inspectionFeeMinor)} is added automatically. Do not add it again.</Text>}<TextInput accessibilityLabel="Quote scope" value={scope} onChangeText={setScope} maxLength={2000} multiline style={fieldStyle} />{items.map((item, i) => <View key={i}><TextInput accessibilityLabel={'Charge description ' + (i + 1)} placeholder="Charge description" value={item.description} maxLength={200} onChangeText={description => setItems(rows => rows.map((row, n) => n === i ? { ...row, description } : row))} style={fieldStyle} /><TextInput accessibilityLabel={'Charge amount ' + (i + 1)} placeholder="Amount (LKR)" keyboardType="decimal-pad" value={item.amount} onChangeText={amount => setItems(rows => rows.map((row, n) => n === i ? { ...row, amount } : row))} style={fieldStyle} />{items.length > 1 && <Action label="Remove charge" onPress={() => setItems(rows => rows.filter((_, n) => n !== i))} />}</View>)}<Action label="Add charge" disabled={items.length >= 20 || busy} onPress={() => setItems([...items, { description: '', amount: '' }])} /><Action label={busy ? 'Sending…' : 'Send quote for approval'} disabled={busy} onPress={send} /><Action label="Close quote editor" disabled={busy} onPress={onClose} />{!!error && <Text accessibilityRole="alert">{error}</Text>}</View>;
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
