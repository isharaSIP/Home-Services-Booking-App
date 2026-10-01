import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS } from "../../constants/theme";

// ---------------------------------------------------------------------------
// Placeholder data. Replace with a call to adminService once the backend
// exposes the reports endpoint. One entry per period in the dropdown.
// ---------------------------------------------------------------------------
const PERIODS = {
  "Last 7 days": {
    stats: {
      total: { value: "742", dir: "up", good: true, note: "5.1% vs prior" },
      completed: { value: "641", dir: "up", good: true, note: "4.3% vs prior" },
      cancelled: { value: "41", dir: "down", good: true, note: "1.2% vs prior" },
      rating: { value: "4.74", dir: "up", good: true, note: "0.02 points" },
    },
    labels: ["24 Sep", "27 Sep", "30 Sep"],
    bookings: [96, 104, 99, 110, 108, 118, 107],
    cancellations: [6, 5, 6, 5, 7, 5, 7],
    customers: [0, 0.2, 0.5, 0.7, 0.9, 1.0, 1.2],
    providers: [0, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7],
  },
  "Last 30 days": {
    stats: {
      total: { value: "3,148", dir: "up", good: true, note: "12.4% vs prior" },
      completed: { value: "2,712", dir: "up", good: true, note: "9.1% vs prior" },
      cancelled: { value: "184", dir: "down", good: true, note: "2.3% vs prior" },
      rating: { value: "4.72", dir: "up", good: true, note: "0.08 points" },
    },
    labels: ["1 Sep", "15 Sep", "30 Sep"],
    bookings: [88, 98, 94, 112, 106, 120, 132],
    cancellations: [5, 5, 5, 6, 6, 7, 6],
    customers: [0, 0.6, 1.5, 2.4, 3.1, 3.7, 4.2],
    providers: [0, 0.4, 0.8, 1.5, 1.9, 2.4, 2.8],
  },
  "Last 90 days": {
    stats: {
      total: { value: "9,214", dir: "up", good: true, note: "18.6% vs prior" },
      completed: { value: "7,968", dir: "up", good: true, note: "16.2% vs prior" },
      cancelled: { value: "576", dir: "down", good: true, note: "4.1% vs prior" },
      rating: { value: "4.69", dir: "up", good: true, note: "0.11 points" },
    },
    labels: ["2 Jul", "15 Aug", "30 Sep"],
    bookings: [82, 90, 96, 101, 108, 117, 126],
    cancellations: [7, 7, 6, 7, 6, 6, 6],
    customers: [0, 2.1, 4.3, 6.0, 8.2, 10.4, 11.3],
    providers: [0, 1.4, 2.8, 4.1, 5.5, 6.9, 7.9],
  },
};

const PERIOD_OPTIONS = Object.keys(PERIODS);

const PURPLE = COLORS.primary;
const PURPLE_LIGHT = "#B9A6F8";
const GRAY = "#A0A8BC";
const GOOD = "#0F8A5F";
const BAD = "#D93A3A";

// ---------------------------------------------------------------------------
// Minimal line chart built from plain Views (no extra packages needed).
// ---------------------------------------------------------------------------
const Segment = ({ x1, y1, x2, y2, color, thickness }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return null;
  const angle = Math.atan2(dy, dx);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - thickness / 2,
        width: length,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: color,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
};

const DashedSegment = ({ x1, y1, x2, y2, color, thickness, dash = 6, gap = 5 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return null;
  const step = dash + gap;
  const count = Math.ceil(length / step);
  const parts = [];
  for (let k = 0; k < count; k++) {
    const t0 = (k * step) / length;
    const t1 = Math.min((k * step + dash) / length, 1);
    parts.push(
      <Segment
        key={k}
        x1={x1 + dx * t0}
        y1={y1 + dy * t0}
        x2={x1 + dx * t1}
        y2={y1 + dy * t1}
        color={color}
        thickness={thickness}
      />
    );
  }
  return <>{parts}</>;
};

const LineChart = ({ series, labels, min, max, height = 150 }) => {
  const [width, setWidth] = useState(0);
  const padX = 10;
  const padY = 12;
  const plotW = Math.max(width - padX * 2, 0);
  const plotH = height - padY * 2;

  const toPoints = (data) =>
    data.map((v, i) => ({
      x: padX + (data.length > 1 ? i / (data.length - 1) : 0) * plotW,
      y: padY + (1 - (v - min) / (max - min)) * plotH,
    }));

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            {/* Faint grid lines */}
            {[0, 1 / 3, 2 / 3].map((f) => (
              <DashedSegment
                key={f}
                x1={0}
                x2={width}
                y1={padY + plotH * f}
                y2={padY + plotH * f}
                color="#EEF0F6"
                thickness={1}
                dash={5}
                gap={5}
              />
            ))}

            {/* Axes */}
            <View style={[chartStyles.axisY, { height }]} />
            <View style={chartStyles.axisX} />

            {/* Series */}
            {series.map((s, si) => {
              const pts = toPoints(s.data);
              return (
                <React.Fragment key={si}>
                  {pts.slice(0, -1).map((p, i) =>
                    s.dashed ? (
                      <DashedSegment
                        key={`d${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={pts[i + 1].x}
                        y2={pts[i + 1].y}
                        color={s.color}
                        thickness={2}
                      />
                    ) : (
                      <Segment
                        key={`s${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={pts[i + 1].x}
                        y2={pts[i + 1].y}
                        color={s.color}
                        thickness={3}
                      />
                    )
                  )}
                  {/* Round the joints of solid lines */}
                  {!s.dashed &&
                    pts.map((p, i) => (
                      <View
                        key={`j${i}`}
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          left: p.x - 1.5,
                          top: p.y - 1.5,
                          width: 3,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: s.color,
                        }}
                      />
                    ))}
                </React.Fragment>
              );
            })}
          </>
        )}
      </View>

      <View style={chartStyles.labels}>
        {labels.map((l) => (
          <Text key={l} style={chartStyles.label}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  axisY: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 1,
    backgroundColor: "#D8DDE8",
  },
  axisX: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "#D8DDE8",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
const StatTile = ({ label, value, dir, good, note }) => {
  const color = good ? GOOD : BAD;
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <View style={styles.trendRow}>
        <MaterialCommunityIcons
          name={dir === "up" ? "arrow-up" : "arrow-down"}
          size={13}
          color={color}
        />
        <Text style={[styles.trendText, { color }]}>{note}</Text>
      </View>
    </View>
  );
};

const LegendItem = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const niceMax = (values, factor, step) => Math.ceil((Math.max(...values) * factor) / step) * step;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState("Last 30 days");
  const [menuOpen, setMenuOpen] = useState(false);

  const d = PERIODS[period];
  const bookingsMax = niceMax([...d.bookings, ...d.cancellations], 1.1, 10);
  const growthMax = niceMax([...d.customers, ...d.providers], 1.15, 0.5);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />

      {/* Header (fixed, does not scroll) */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Reports & analytics</Text>
          <Text style={styles.subtitle}>Platform performance overview</Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => Alert.alert("More options", "Coming soon.")}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Everything below scrolls */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setMenuOpen(false)}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          <Text style={styles.periodTitle}>Performance period</Text>
          <View>
            <TouchableOpacity
              style={styles.periodPill}
              onPress={() => setMenuOpen((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Performance period, ${period}`}
            >
              <Text style={styles.periodPillText}>{period}</Text>
              <MaterialCommunityIcons name="menu-down" size={18} color={PURPLE} />
            </TouchableOpacity>
            {menuOpen && (
              <View style={styles.menu}>
                {PERIOD_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={styles.menuItem}
                    onPress={() => {
                      setPeriod(p);
                      setMenuOpen(false);
                    }}
                  >
                    <Text style={[styles.menuText, p === period && styles.menuTextActive]}>
                      {p}
                    </Text>
                    {p === period && (
                      <MaterialCommunityIcons name="check" size={16} color={PURPLE} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Stat tiles */}
        <View style={styles.grid}>
          <StatTile label="Total bookings" {...d.stats.total} />
          <StatTile label="Completed" {...d.stats.completed} />
          <StatTile label="Cancellations" {...d.stats.cancelled} />
          <StatTile label="Average rating" {...d.stats.rating} />
        </View>

        {/* Booking performance */}
        <Text style={styles.sectionTitle}>Booking performance</Text>
        <View style={styles.chartCard}>
          <LineChart
            labels={d.labels}
            min={0}
            max={bookingsMax}
            series={[
              { data: d.bookings, color: PURPLE },
              { data: d.cancellations, color: PURPLE_LIGHT, dashed: true },
            ]}
          />
          <View style={[styles.legend, styles.legendLeft]}>
            <LegendItem color={PURPLE} label="Bookings" />
            <LegendItem color={PURPLE_LIGHT} label="Cancellations" />
          </View>
        </View>

        {/* User growth */}
        <Text style={styles.sectionTitle}>User growth</Text>
        <View style={styles.chartCard}>
          <View style={[styles.legend, styles.legendSpread]}>
            <LegendItem color={PURPLE} label="Customers" />
            <LegendItem color={GRAY} label="Providers" />
          </View>
          <LineChart
            labels={d.labels}
            min={0}
            max={growthMax}
            series={[
              { data: d.providers, color: GRAY },
              { data: d.customers, color: PURPLE },
            ]}
          />
          <Text style={styles.caption}>Growth since the start of the period</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll area
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },

  // Period selector
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    zIndex: 10,
  },
  periodTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE9FE",
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 11,
  },
  periodPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: PURPLE,
  },
  menu: {
    position: "absolute",
    top: 48,
    right: 0,
    minWidth: 170,
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    zIndex: 20,
    ...SHADOWS.medium,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  menuTextActive: {
    fontWeight: "800",
    color: PURPLE,
  },

  // Stat tiles
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 16,
    ...SHADOWS.small,
  },
  tileLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 2,
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 26,
    marginBottom: 14,
  },
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 18,
    ...SHADOWS.small,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendLeft: {
    gap: 18,
    marginTop: 16,
  },
  legendSpread: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 12,
  },
});

export default ReportsScreen;