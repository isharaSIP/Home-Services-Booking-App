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
// exposes the complaints endpoint.
// ---------------------------------------------------------------------------
const OPEN_TOTAL = 17;
const HIGH_PRIORITY_TOTAL = 5;

const COMPLAINTS = [
  {
    id: "CMP-3321",
    title: "Incomplete work",
    booking: "BK-20918",
    customer: "Thilini Abeysekara",
    provider: "Lasantha Kumara",
    priority: "High",
    status: "Submitted",
    createdAt: "2026-09-17",
  },
  {
    id: "CMP-3318",
    title: "Pricing dispute",
    booking: "BK-20886",
    customer: "Kasuni Perera",
    provider: "Nuwan Fernando",
    priority: "High",
    status: "Under Review",
    createdAt: "2026-09-16",
  },
  {
    id: "CMP-3312",
    title: "Late arrival",
    booking: "BK-20871",
    customer: "Dilani Jayawardena",
    provider: "Chamara Silva",
    priority: "Medium",
    status: "Under Review",
    createdAt: "2026-09-15",
  },
  {
    id: "CMP-3305",
    title: "Refund request",
    booking: "BK-20840",
    customer: "Ruwan Senanayake",
    provider: "Ishara Perera",
    priority: "Low",
    status: "Resolved",
    createdAt: "2026-09-12",
  },
];

const FILTERS = ["All", "Submitted", "Under Review", "Resolved"];

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const PRIORITY_STYLES = {
  High: { label: "High priority", bg: "#FDE8E8", text: "#C93B4B" },
  Medium: { label: "Medium priority", bg: "#EDE9FE", text: COLORS.primary },
  Low: { label: "Low priority", bg: "#EEF1F5", text: COLORS.textMuted },
};

const STATUS_STYLES = {
  Submitted: { bg: "#FEF3DC", text: "#B25E09" },
  "Under Review": { bg: "#E3EDFD", text: "#2F5FD0" },
  Resolved: { bg: "#DDF5EA", text: "#0F8A5F" },
};

// ---------------------------------------------------------------------------
// Complaint card
// ---------------------------------------------------------------------------
const ComplaintCard = ({ item, onPress }) => {
  const priority = PRIORITY_STYLES[item.priority];
  const status = STATUS_STYLES[item.status];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>
          {item.id} · {item.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: priority.bg }]}>
          <Text style={[styles.badgeText, { color: priority.text }]}>{priority.label}</Text>
        </View>
      </View>

      <View style={[styles.row, styles.secondRow]}>
        <Text style={styles.booking}>Booking {item.booking}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.text }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.party}>
        Customer · <Text style={styles.partyName}>{item.customer}</Text>
      </Text>
      <Text style={[styles.party, styles.partySpacing]}>
        Provider · <Text style={styles.partyName}>{item.provider}</Text>
      </Text>

      <TouchableOpacity
        style={styles.action}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Open case ${item.id}`}
      >
        <Text style={styles.actionText}>Open case</Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ComplaintsScreen = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [priorityFirst, setPriorityFirst] = useState(true);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = COMPLAINTS.filter((c) => {
      const matchesFilter = filter === "All" || c.status === filter;
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.booking.toLowerCase().includes(q) ||
        c.customer.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    return list.sort((a, b) => {
      if (priorityFirst) {
        const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (diff !== 0) return diff;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [query, filter, priorityFirst]);

  const openCase = (item) => {
    // TODO: navigate to the case details screen once it exists.
    Alert.alert(item.id, `Details for "${item.title}" are coming soon.`);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />

      {/* Header (fixed, does not scroll) */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Complaints</Text>
          <Text style={styles.subtitle}>
            {OPEN_TOTAL} open · {HIGH_PRIORITY_TOTAL} marked high priority
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
        {/* Search */}
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search complaint, customer or provider"
            placeholderTextColor={COLORS.disabledText}
            returnKeyType="search"
            autoCorrect={false}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsScroll}
          >
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => Alert.alert("Filters", "More filters are coming soon.")}
            accessibilityRole="button"
            accessibilityLabel="More filters"
          >
            <MaterialCommunityIcons name="filter-variant" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Result count + sort */}
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {results.length} {results.length === 1 ? "case" : "cases"}
          </Text>
          <TouchableOpacity
            onPress={() => setPriorityFirst((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Change sort order"
          >
            <Text style={styles.sort}>{priorityFirst ? "Priority first" : "Newest first"}</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {results.length > 0 ? (
          results.map((item) => <ComplaintCard key={item.id} item={item} onPress={openCase} />)
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No cases found</Text>
            <Text style={styles.emptyText}>Try a different search or choose another status.</Text>
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
    marginTop: 14,
    gap: 8,
  },
  chipsScroll: {
    flex: 1,
  },
  chips: {
    gap: 8,
    paddingRight: 4,
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

  // Count + sort
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 12,
  },
  count: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sort: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secondRow: {
    marginTop: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  booking: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    marginRight: 10,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.inputBorder,
    marginTop: 16,
    marginBottom: 14,
  },
  party: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  partySpacing: {
    marginTop: 4,
  },
  partyName: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  action: {
    backgroundColor: "#EEEAFD",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
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

export default ComplaintsScreen;