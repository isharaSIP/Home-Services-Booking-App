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
// exposes the verification queue endpoint.
// ---------------------------------------------------------------------------
const QUEUE_TOTAL = 38;

const APPLICATIONS = [
  {
    id: "AP-2291",
    name: "Sahan Wickramasinghe",
    category: "Appliance Repair",
    location: "Colombo 06",
    submittedAt: "2026-09-14",
    documents: 3,
    status: "Pending",
  },
  {
    id: "AP-2288",
    name: "Menaka Rajapaksha",
    category: "Cleaning",
    location: "Nugegoda",
    submittedAt: "2026-09-13",
    documents: 2,
    status: "Under Review",
  },
  {
    id: "AP-2284",
    name: "Pradeep Kumarasiri",
    category: "Electrical",
    location: "Kandy",
    submittedAt: "2026-09-12",
    documents: 4,
    status: "Changes Requested",
  },
  {
    id: "AP-2279",
    name: "Nimali Fernando",
    category: "Plumbing",
    location: "Dehiwala",
    submittedAt: "2026-09-11",
    documents: 3,
    status: "Pending",
  },
  {
    id: "AP-2273",
    name: "Kasun Perera",
    category: "Carpentry",
    location: "Galle",
    submittedAt: "2026-09-10",
    documents: 2,
    status: "Under Review",
  },
];

const FILTERS = ["All", "Pending", "Under Review", "Changes Requested"];

const STATUS_STYLES = {
  Pending: { bg: "#FEF3DC", text: "#B25E09" },
  "Under Review": { bg: "#E3EDFD", text: "#2F5FD0" },
  "Changes Requested": { bg: "#E3EDFD", text: "#2F5FD0" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

// ---------------------------------------------------------------------------
// Application card
// ---------------------------------------------------------------------------
const ApplicationCard = ({ item, onPress }) => {
  const badge = STATUS_STYLES[item.status] || STATUS_STYLES.Pending;
  const actionLabel =
    item.status === "Pending" ? "Review application" : "View application";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>
            {item.category} · {item.location}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {item.id} · {formatDate(item.submittedAt)}
        </Text>
        <Text style={styles.metaText}>
          {item.documents} {item.documents === 1 ? "document" : "documents"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.action}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} for ${item.name}`}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const VerificationScreen = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [newestFirst, setNewestFirst] = useState(true);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = APPLICATIONS.filter((a) => {
      const matchesFilter = filter === "All" || a.status === filter;
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    return list.sort((a, b) =>
      newestFirst
        ? b.submittedAt.localeCompare(a.submittedAt)
        : a.submittedAt.localeCompare(b.submittedAt)
    );
  }, [query, filter, newestFirst]);

  const openApplication = (item) => {
    // TODO: navigate to the application details screen once it exists.
    Alert.alert(item.id, `Details for ${item.name} are coming soon.`);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />

      {/* Header (fixed, does not scroll) */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Provider verification</Text>
          <Text style={styles.subtitle}>{QUEUE_TOTAL} applications in the queue</Text>
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
            placeholder="Search provider, category or ID"
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
            {results.length} {results.length === 1 ? "application" : "applications"}
          </Text>
          <TouchableOpacity
            onPress={() => setNewestFirst((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Change sort order"
          >
            <Text style={styles.sort}>{newestFirst ? "Newest first" : "Oldest first"}</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {results.length > 0 ? (
          results.map((item) => (
            <ApplicationCard key={item.id} item={item} onPress={openApplication} />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No applications found</Text>
            <Text style={styles.emptyText}>
              Try a different search or choose another status.
            </Text>
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
  title: {
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
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
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
  category: {
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.inputBorder,
    marginTop: 18,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
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

export default VerificationScreen;