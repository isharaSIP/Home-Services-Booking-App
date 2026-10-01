import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
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
// exposes the users endpoint.
// ---------------------------------------------------------------------------
const TOTALS = {
  customers: 12480,
  customersGrowth: 4.2,
  providers: 1946,
  providersGrowth: 2.8,
};

const ACCOUNTS = [
  {
    id: "US-10482",
    name: "Nadeesha Wijesinghe",
    email: "nadeesha.w@example.com",
    type: "Customer",
    location: "Nugegoda",
    joined: "2024-03",
    bookings: 24,
    complaints: 0,
    rating: null,
    status: "Active",
  },
  {
    id: "US-10471",
    name: "Arjun Perera",
    email: "arjun.perera@example.com",
    type: "Provider",
    category: "Plumbing",
    location: "Nugegoda",
    joined: "2023-01",
    bookings: 412,
    complaints: 1,
    rating: 4.8,
    status: "Active",
  },
  {
    id: "US-10466",
    name: "Imesh Gunawardena",
    email: "imesh.g@example.com",
    type: "Customer",
    location: "Kandy",
    joined: "2025-07",
    bookings: 9,
    complaints: 2,
    rating: null,
    status: "Suspended",
  },
  {
    id: "US-10459",
    name: "Sanduni Rathnayake",
    email: "sanduni.r@example.com",
    type: "Provider",
    category: "Cleaning",
    location: "Galle",
    joined: "2022-11",
    bookings: 268,
    complaints: 0,
    rating: 4.9,
    status: "Active",
  },
];

const FILTERS = [
  { label: "All accounts", value: "All" },
  { label: "Customers", value: "Customer" },
  { label: "Providers", value: "Provider" },
];

const STATUS_STYLES = {
  Active: { bg: "#DDF5EA", text: "#0F8A5F" },
  Suspended: { bg: "#FDE8E8", text: "#C93B4B" },
};

const TYPE_STYLES = {
  Customer: { bg: "#E0ECFF", text: "#3B6FE0" },
  Provider: { bg: "#EDE9FE", text: COLORS.primary },
};

const TREND_GREEN = "#0F8A5F";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatJoined = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

const formatNumber = (n) => n.toLocaleString("en-US");

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

// ---------------------------------------------------------------------------
// Summary tile
// ---------------------------------------------------------------------------
const SummaryTile = ({ label, value, growth }) => (
  <View style={styles.tile}>
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={styles.tileValue}>{value}</Text>
    <View style={styles.trendRow}>
      <MaterialCommunityIcons name="arrow-up" size={13} color={TREND_GREEN} />
      <Text style={styles.trendText}>{growth}%</Text>
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Account card
// ---------------------------------------------------------------------------
const AccountCard = ({ item, onPress }) => {
  const typeTone = TYPE_STYLES[item.type];
  const status = STATUS_STYLES[item.status] || STATUS_STYLES.Active;
  const subtitle =
    item.type === "Provider"
      ? `Provider · ${item.category} · ${item.location}`
      : `Customer · ${item.location}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: typeTone.bg }]}>
          <Text style={[styles.avatarText, { color: typeTone.text }]}>
            {getInitials(item.name)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.text }]}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.idLine}>
        {item.id} · joined {formatJoined(item.joined)}
      </Text>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <Text style={[styles.statText, styles.statLeft]}>
          {item.bookings} {item.bookings === 1 ? "booking" : "bookings"}
        </Text>
        <Text style={[styles.statText, styles.statCenter]}>
          {item.complaints} {item.complaints === 1 ? "complaint" : "complaints"}
        </Text>
        <Text style={[styles.statText, styles.statRight]}>
          ★ {item.rating != null ? item.rating.toFixed(1) : "—"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.action}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`View account for ${item.name}`}
      >
        <Text style={styles.actionText}>View account</Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const UsersScreen = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const totalAccounts = TOTALS.customers + TOTALS.providers;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ACCOUNTS.filter((a) => {
      const matchesFilter = filter === "All" || a.type === filter;
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const openAccount = (item) => {
    // TODO: navigate to the account details screen once it exists.
    Alert.alert(item.id, `Details for ${item.name} are coming soon.`);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />

      {/* Header (fixed, does not scroll) */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Users & providers</Text>
          <Text style={styles.subtitle}>
            {formatNumber(totalAccounts)} accounts on the platform
          </Text>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary tiles */}
        <View style={styles.tiles}>
          <SummaryTile
            label="Customers"
            value={formatNumber(TOTALS.customers)}
            growth={TOTALS.customersGrowth}
          />
          <SummaryTile
            label="Providers"
            value={formatNumber(TOTALS.providers)}
            growth={TOTALS.providersGrowth}
          />
        </View>

        {/* Search */}
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, email or account ID"
            placeholderTextColor={COLORS.disabledText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.disabledText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          <View style={styles.chips}>
            {FILTERS.map((f) => {
              const active = f.value === filter;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f.value)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => Alert.alert("Filters", "More filters are coming soon.")}
            accessibilityRole="button"
            accessibilityLabel="More filters"
          >
            <MaterialCommunityIcons name="filter-variant" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Result count */}
        <Text style={styles.count}>
          {results.length} matching {results.length === 1 ? "account" : "accounts"}
        </Text>

        {/* List */}
        {results.length > 0 ? (
          results.map((item) => <AccountCard key={item.id} item={item} onPress={openAccount} />)
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No accounts found</Text>
            <Text style={styles.emptyText}>Try a different search or choose another group.</Text>
          </View>
        )}
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
    paddingTop: 18,
    paddingBottom: 24,
  },

  // Summary tiles
  tiles: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  tile: {
    flex: 1,
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
    color: TREND_GREEN,
    marginLeft: 2,
  },

  // Search
  search: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },

  // Chips
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 8,
  },
  chips: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#EDE9FE",
    borderColor: "#CFC3FA",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Count
  count: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 18,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitleText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  idLine: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.inputBorder,
    marginTop: 16,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  statLeft: {
    textAlign: "left",
  },
  statCenter: {
    textAlign: "center",
  },
  statRight: {
    textAlign: "right",
  },
  action: {
    backgroundColor: "#EEEAFD",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // Empty state
  empty: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
});

export default UsersScreen;