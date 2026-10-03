import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StatusBar,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { COLORS, SHADOWS } from "../../constants/theme";
import ScreenHeader, { BellButton } from "../../components/provider/ScreenHeader";
import providerService from "../../services/providerService";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Working-day chips are shown Monday first; values are weekday numbers.
const WORKING_ORDER = [1, 2, 3, 4, 5, 6, 0];

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d) => addDays(d, -d.getDay());

const weekLabel = (start) => {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTH_LONG[start.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]}`;
};

const formatTime = (mins) => {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

const GREEN = "#0F8A5F";
const TYPE_STYLES = {
  available: { label: "Available", bg: "#DDF5EA", text: GREEN, accent: "#10B981" },
  booked: { label: "Booked", bg: "#EEEAFD", text: COLORS.primary, accent: COLORS.primary },
};
const DOT_COLORS = { available: "#10B981", booked: COLORS.primary, off: "#D9DDE7" };

const START_OPTIONS = Array.from({ length: 12 }, (_, i) => (7 + i) * 60); // 7 AM – 6 PM
const DURATION_OPTIONS = [60, 120, 180, 240];

// ---------------------------------------------------------------------------
// Add availability sheet
// ---------------------------------------------------------------------------
const AddSlotSheet = ({ visible, title, existing, onClose, onAdd, submitting }) => {
  const insets = useSafeAreaInsets();
  const [start, setStart] = useState(9 * 60);
  const [duration, setDuration] = useState(120);

  const end = start + duration;
  const conflict = existing.some((s) => start < s.end && end > s.start);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Add availability</Text>
              <Text style={styles.sheetSub}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.sheetLabel}>Start time</Text>
          <View style={styles.chipWrap}>
            {START_OPTIONS.map((m) => {
              const active = m === start;
              return (
                <Pressable
                  key={m}
                  onPress={() => setStart(m)}
                  style={[styles.optChip, active && styles.optChipActive]}
                >
                  <Text style={[styles.optText, active && styles.optTextActive]}>{formatTime(m)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sheetLabel}>Duration</Text>
          <View style={styles.chipWrap}>
            {DURATION_OPTIONS.map((m) => {
              const active = m === duration;
              return (
                <Pressable
                  key={m}
                  onPress={() => setDuration(m)}
                  style={[styles.optChip, active && styles.optChipActive]}
                >
                  <Text style={[styles.optText, active && styles.optTextActive]}>
                    {m / 60} {m === 60 ? "hr" : "hrs"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.summary, conflict && styles.summaryError]}>
            <MaterialCommunityIcons
              name={conflict ? "alert-circle-outline" : "clock-outline"}
              size={18}
              color={conflict ? COLORS.error : COLORS.primary}
            />
            <Text style={[styles.summaryText, conflict && { color: COLORS.error }]}>
              {conflict
                ? "This overlaps another slot on this day."
                : `${formatTime(start)} – ${formatTime(end)}`}
            </Text>
          </View>

          <View style={styles.sheetFooter}>
            <Pressable onPress={onClose} style={[styles.sheetBtn, styles.sheetCancel]}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={conflict || submitting}
              onPress={() => onAdd(start, end)}
              style={[styles.sheetBtn, styles.sheetSave, (conflict || submitting) && { opacity: 0.45 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sheetSaveText}>Add slot</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ProviderCalendarScreen = () => {
  const focused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  });

  // Real availability data state stored in MongoDB
  const [working, setWorking] = useState({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
  const [offDates, setOffDates] = useState([]); // Array of dateKeys marked unavailable e.g. ["2026-10-05"]
  const [allSlots, setAllSlots] = useState([]); // Array of slot objects from MongoDB
  const [sheetOpen, setSheetOpen] = useState(false);

  const selKey = dateKey(selected);
  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Fetch real availability from MongoDB
  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const data = await providerService.getAvailability();
      if (data) {
        if (data.workingDays) setWorking(data.workingDays);
        if (Array.isArray(data.offDates)) setOffDates(data.offDates);
        if (Array.isArray(data.slots)) setAllSlots(data.slots);
      }
    } catch (err) {
      console.error("Fetch Availability Error:", err);
      Alert.alert("Error", "Failed to load availability data from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (focused) {
      fetchAvailability();
    }
  }, [focused, fetchAvailability]);

  const isOff = useMemo(() => offDates.includes(selKey), [offDates, selKey]);

  const isOpenDay = useCallback(
    (d) => !!working[d.getDay()] && !offDates.includes(dateKey(d)),
    [working, offDates]
  );

  const slotsFor = useCallback(
    (d) => {
      const k = dateKey(d);
      return allSlots
        .filter((s) => s.dateKey === k)
        .sort((a, b) => a.start - b.start);
    },
    [allSlots]
  );

  const statusFor = useCallback(
    (d) => {
      if (!isOpenDay(d)) return "off";
      const slots = slotsFor(d);
      if (slots.some((s) => s.type === "booked")) return "booked";
      if (slots.length > 0) return "available";
      return "available"; // Working day defaults to available
    },
    [isOpenDay, slotsFor]
  );

  const selectedOpen = isOpenDay(selected);
  const selectedSlots = selectedOpen ? slotsFor(selected) : [];
  const bookedCount = selectedSlots.filter((s) => s.type === "booked").length;
  const openCount = selectedSlots.length - bookedCount;
  const dayTitle = `${DAY_SHORT[selected.getDay()]}, ${selected.getDate()} ${MONTH_SHORT[selected.getMonth()]}`;

  const shiftWeek = (n) => setSelected((d) => addDays(d, n * 7));

  // Update working days in database
  const toggleWorking = async (idx) => {
    const nextWorking = { ...working, [idx]: !working[idx] };
    setWorking(nextWorking);

    try {
      await providerService.updateWorkingDays(nextWorking);
    } catch (err) {
      Alert.alert("Error", "Failed to update working days.");
      setWorking(working); // Revert on failure
    }
  };

  // Toggle day availability (Mark Available / Mark Unavailable) in database
  const handleToggleOff = async () => {
    if (!isOff && !working[selected.getDay()]) {
      Alert.alert("Already unavailable", `${DAY_LONG[selected.getDay()]} is not one of your working days.`);
      return;
    }
    if (!isOff && bookedCount > 0) {
      Alert.alert(
        "Can't mark unavailable",
        `You have ${bookedCount} booked ${bookedCount === 1 ? "job" : "jobs"} on this day. Reschedule or cancel ${bookedCount === 1 ? "it" : "them"} first.`
      );
      return;
    }

    try {
      const res = await providerService.toggleOffDate(selKey);
      if (res && Array.isArray(res.offDates)) {
        setOffDates(res.offDates);
        Alert.alert("Availability Updated", res.message || "Date availability saved.");
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update date availability.");
    }
  };

  const openAddSheet = () => {
    if (!selectedOpen) {
      Alert.alert(
        "Day is unavailable",
        isOff
          ? "Mark this day as available before adding slots."
          : `Turn on ${DAY_LONG[selected.getDay()]} in Working days first.`
      );
      return;
    }
    setSheetOpen(true);
  };

  // Save new time slot to database
  const handleAdd = async (start, end) => {
    try {
      setSubmitting(true);
      const res = await providerService.addSlot({
        dateKey: selKey,
        start,
        end,
        title: "Open for bookings",
      });

      if (res && Array.isArray(res.slots)) {
        setAllSlots(res.slots);
        setSheetOpen(false);
        Alert.alert("Success 🎉", "Availability slot added successfully.");
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to add slot.");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove custom slot from database
  const handleSlotPress = (slot) => {
    const slotId = slot._id || slot.id;
    if (!slotId) return;

    Alert.alert("Remove availability?", `${formatTime(slot.start)} – ${formatTime(slot.end)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await providerService.removeSlot(slotId);
            if (res && Array.isArray(res.slots)) {
              setAllSlots(res.slots);
              Alert.alert("Removed", "Slot removed from database.");
            }
          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to remove slot.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      {focused && <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />}

      <ScreenHeader
        title="Availability"
        subtitle={`${MONTH_LONG[selected.getMonth()]} ${selected.getFullYear()}`}
      >
        <BellButton />
      </ScreenHeader>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading calendar availability...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Week card */}
          <View style={styles.card}>
            <View style={styles.weekHeader}>
              <Pressable
                onPress={() => shiftWeek(-1)}
                style={styles.navBtn}
                accessibilityRole="button"
                accessibilityLabel="Previous week"
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color={COLORS.textPrimary} />
              </Pressable>
              <Text style={styles.weekText}>{weekLabel(weekStart)}</Text>
              <Pressable
                onPress={() => shiftWeek(1)}
                style={styles.navBtn}
                accessibilityRole="button"
                accessibilityLabel="Next week"
              >
                <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.daysRow}>
              {days.map((d) => {
                const status = statusFor(d);
                const active = dateKey(d) === selKey;
                const labelColor = active
                  ? "#FFFFFF"
                  : status === "off"
                  ? COLORS.disabledText
                  : status === "booked"
                  ? COLORS.primary
                  : COLORS.textPrimary;
                return (
                  <Pressable
                    key={dateKey(d)}
                    onPress={() => setSelected(d)}
                    style={[styles.dayPill, active && styles.dayPillActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`${DAY_LONG[d.getDay()]} ${d.getDate()}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.dayName, { color: labelColor }, !active && { opacity: 0.85 }]}>
                      {DAY_SHORT[d.getDay()]}
                    </Text>
                    <Text style={[styles.dayNum, { color: labelColor }]}>{d.getDate()}</Text>
                    <View
                      style={[
                        styles.dayDot,
                        { backgroundColor: active ? "#FFFFFF" : DOT_COLORS[status] },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legend}>
              {[
                ["Available", DOT_COLORS.available],
                ["Booked", DOT_COLORS.booked],
                ["Unavailable", DOT_COLORS.off],
              ].map(([label, color]) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Working days */}
          <View style={[styles.card, styles.cardSpaced]}>
            <Text style={styles.cardTitle}>Working days</Text>
            <View style={styles.workRow}>
              {WORKING_ORDER.map((idx) => {
                const on = !!working[idx];
                return (
                  <Pressable
                    key={idx}
                    onPress={() => toggleWorking(idx)}
                    style={[styles.workChip, on && styles.workChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.workText, on && styles.workTextOn]}>{DAY_SHORT[idx]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Selected day */}
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{dayTitle}</Text>
            <Text style={styles.dayCount}>
              {selectedOpen ? `${bookedCount} booked · ${openCount} open` : "Unavailable"}
            </Text>
          </View>

          {selectedOpen && selectedSlots.length > 0 &&
            selectedSlots.map((slot) => {
              const tone = TYPE_STYLES[slot.type] || TYPE_STYLES.available;
              return (
                <Pressable
                  key={slot._id || slot.id || `${slot.start}-${slot.end}`}
                  onPress={() => handleSlotPress(slot)}
                  style={[styles.slot, { borderLeftColor: tone.accent }]}
                >
                  <View style={styles.slotTime}>
                    <Text style={styles.slotStart}>{formatTime(slot.start)}</Text>
                    <Text style={styles.slotEnd}>{formatTime(slot.end)}</Text>
                  </View>
                  <View style={styles.slotBody}>
                    <Text style={styles.slotTitle} numberOfLines={1}>
                      {slot.title || "Open for bookings"}
                    </Text>
                    {!!slot.customer && (
                      <Text style={styles.slotSub} numberOfLines={1}>
                        {slot.customer}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: tone.text }]} />
                    <Text style={[styles.statusText, { color: tone.text }]}>{tone.label}</Text>
                  </View>
                </Pressable>
              );
            })}

          {(!selectedOpen || selectedSlots.length === 0) && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="calendar-remove-outline" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {isOff ? "Marked unavailable" : !working[selected.getDay()] ? "Not a working day" : "No custom slots yet"}
              </Text>
              <Text style={styles.emptyText}>
                {isOff
                  ? "Tap Mark available to open this day again."
                  : !working[selected.getDay()]
                  ? `Turn on ${DAY_SHORT[selected.getDay()]} in Working days to accept bookings.`
                  : "Add specific time slots or leave open for full-day bookings."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Sticky actions */}
      {!loading && (
        <View style={styles.actionBar}>
          <Pressable
            onPress={handleToggleOff}
            style={({ pressed }) => [styles.actionBtn, styles.actionOutline, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={isOff ? "calendar-check-outline" : "calendar-remove-outline"}
              size={18}
              color={COLORS.textPrimary}
            />
            <Text style={styles.actionOutlineText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {isOff ? "Mark available" : "Mark unavailable"}
            </Text>
          </Pressable>
          <Pressable
            onPress={openAddSheet}
            style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.actionPrimaryText} numberOfLines={1}>
              Add availability
            </Text>
          </Pressable>
        </View>
      )}

      <AddSlotSheet
        key={sheetOpen ? selKey : "closed"}
        visible={sheetOpen}
        title={dayTitle}
        existing={selectedSlots}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAdd}
        submitting={submitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted, fontWeight: "600" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  pressed: { opacity: 0.85 },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    ...SHADOWS.small,
  },
  cardSpaced: { marginTop: 14 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },

  // Week
  weekHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  weekText: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  daysRow: { flexDirection: "row", gap: 6, marginTop: 16 },
  dayPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
  },
  dayPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayName: { fontSize: 11, fontWeight: "600" },
  dayNum: { fontSize: 17, fontWeight: "800", marginTop: 3 },
  dayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  legend: {
    flexDirection: "row",
    gap: 18,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.inputBorder,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: COLORS.textMuted },

  // Working days
  workRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  workChip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  workChipOn: { backgroundColor: "#EEEAFD", borderColor: "#CFC3FA" },
  workText: { fontSize: 13, fontWeight: "700", color: COLORS.disabledText },
  workTextOn: { color: COLORS.primary },

  // Day list
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
  },
  dayTitle: { fontSize: 19, fontWeight: "800", color: COLORS.textPrimary },
  dayCount: { fontSize: 13, color: COLORS.textMuted },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  slotTime: { width: 78 },
  slotStart: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  slotEnd: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  slotBody: { flex: 1, paddingHorizontal: 8 },
  slotTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  slotSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800" },

  empty: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 6, lineHeight: 19 },

  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.secondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.inputBorder,
  },
  actionBtn: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionOutline: {
    flex: 1,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
  },
  actionOutlineText: { flexShrink: 1, fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  actionPrimary: { flex: 1.25, backgroundColor: COLORS.primary, ...SHADOWS.medium },
  actionPrimaryText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },

  // Sheet
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,15,45,0.55)" },
  sheet: {
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.inputBorder,
    marginBottom: 14,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  sheetSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 16, marginBottom: 10 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optChip: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
  },
  optChipActive: { backgroundColor: "#EEEAFD", borderColor: "#CFC3FA" },
  optText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  optTextActive: { color: COLORS.primary },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F4F5F9",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  summaryError: { backgroundColor: "#FDE8E8" },
  summaryText: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  sheetFooter: { flexDirection: "row", gap: 12, marginTop: 18 },
  sheetBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sheetCancel: { borderWidth: 1, borderColor: COLORS.inputBorder },
  sheetCancelText: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  sheetSave: { backgroundColor: COLORS.primary },
  sheetSaveText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});

export default ProviderCalendarScreen;
