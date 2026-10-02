import React from "react";
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
import { useAuth } from "../../context/AuthContext";

// ---------------------------------------------------------------------------
// Placeholder data. Replace with API data when the backend endpoints exist.
// ---------------------------------------------------------------------------
const LOCATION = "Nugegoda, Colombo 05";
const HAS_UNREAD_NOTIFICATIONS = true;

const CATEGORIES = [
  { id: "plumbing", name: "Plumbing", icon: "water-outline", pros: "240+ pros" },
  { id: "electrical", name: "Electrical", icon: "flash-outline", pros: "186+ pros" },
  { id: "cleaning", name: "Cleaning", icon: "spray-bottle", pros: "310+ pros" },
  { id: "painting", name: "Painting", icon: "brush", pros: "128+ pros" },
  { id: "gardening", name: "Gardening", icon: "leaf", pros: "94+ pros" },
  { id: "appliance", name: "Appliance Repair", icon: "washing-machine", pros: "112+ pros" },
];

const POPULAR_SERVICES = [
  { id: "tap", title: "Leaking tap repair", icon: "water-outline", duration: "Avg. 45 min", price: "Rs. 2,500" },
  { id: "clean", title: "Full home deep clean", icon: "spray-bottle", duration: "Avg. 4 hrs", price: "Rs. 12,000" },
  { id: "fan", title: "Ceiling fan repair", icon: "fan", duration: "Avg. 1 hr", price: "Rs. 1,800" },
  { id: "paint", title: "Single room painting", icon: "brush", duration: "Avg. 1 day", price: "Rs. 15,000" },
];

const NEARBY_PROS = [
  { id: "p1", name: "Arjun Perera", category: "Plumbing", distance: "1.2 km", rating: 4.8, jobs: 412 },
  { id: "p2", name: "Sanduni Rathnayake", category: "Cleaning", distance: "2.4 km", rating: 4.9, jobs: 268 },
  { id: "p3", name: "Lasantha Kumara", category: "Appliance Repair", distance: "3.1 km", rating: 4.7, jobs: 190 },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const CustomerDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const firstName = (user?.name || "there").trim().split(/\s+/)[0];

  const goExplore = () => navigation.navigate("Explore");
  const comingSoon = (title) => Alert.alert(title, "Coming soon.");

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => comingSoon("Change location")}
                accessibilityRole="button"
                accessibilityLabel={`Location ${LOCATION}`}
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={16}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.locationText}>{LOCATION}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="rgba(255,255,255,0.9)"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bell}
              onPress={() => comingSoon("Notifications")}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
              {HAS_UNREAD_NOTIFICATIONS && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.search}
            activeOpacity={0.9}
            onPress={goExplore}
            accessibilityRole="search"
            accessibilityLabel="Search for a service"
          >
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.primary} />
            <Text style={styles.searchText}>What service do you need?</Text>
          </TouchableOpacity>
        </View>

        {/* Service categories (overlaps the hero) */}
        <View style={styles.categoriesCard}>
          <View style={styles.sectionRow}>
            <Text style={styles.cardTitle}>Service categories</Text>
            <TouchableOpacity onPress={goExplore} accessibilityRole="link">
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.category}
                activeOpacity={0.8}
                onPress={goExplore}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${c.pros}`}
              >
                <View style={styles.categoryIcon}>
                  <MaterialCommunityIcons name={c.icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryName}>{c.name}</Text>
                <Text style={styles.categoryPros}>{c.pros}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular services */}
        <View style={[styles.sectionRow, styles.sectionPad]}>
          <Text style={styles.sectionTitle}>Popular services</Text>
          <TouchableOpacity style={styles.linkRow} onPress={goExplore} accessibilityRole="link">
            <Text style={styles.link}>See all</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.serviceList}
        >
          {POPULAR_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.serviceCard}
              activeOpacity={0.85}
              onPress={goExplore}
              accessibilityRole="button"
              accessibilityLabel={s.title}
            >
              <View style={styles.serviceIcon}>
                <MaterialCommunityIcons name={s.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.serviceTitle}>{s.title}</Text>
              <Text style={styles.serviceMeta}>{s.duration}</Text>
              <Text style={styles.servicePrice}>from {s.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Nearby professionals */}
        <View style={[styles.sectionRow, styles.sectionPad, styles.nearbyHeader]}>
          <Text style={styles.sectionTitle}>Nearby professionals</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => comingSoon("Map view")}
            accessibilityRole="link"
          >
            <Text style={styles.link}>View map</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionPad}>
          {NEARBY_PROS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.proCard}
              activeOpacity={0.85}
              onPress={() => comingSoon(p.name)}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${p.category}, ${p.distance} away`}
            >
              <View style={styles.proAvatar}>
                <Text style={styles.proAvatarText}>{getInitials(p.name)}</Text>
              </View>
              <View style={styles.proInfo}>
                <Text style={styles.proName}>{p.name}</Text>
                <Text style={styles.proMeta}>
                  {p.category} · {p.distance} away
                </Text>
              </View>
              <View style={styles.proRating}>
                <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.proRatingText}>{p.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    paddingBottom: 28,
  },

  // Hero
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 49,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroText: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  locationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    marginLeft: 4,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: COLORS.secondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
    color: COLORS.disabledText,
  },

  // Categories card
  categoriesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 26,
    marginHorizontal: 20,
    marginTop: -29,
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 16,
    ...SHADOWS.small,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  link: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
  },
  category: {
    width: "33.333%",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 10,
    textAlign: "center",
  },
  categoryPros: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center",
  },

  // Sections
  sectionPad: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  nearbyHeader: {
    marginTop: 26,
    marginBottom: 14,
  },

  // Popular services
  serviceList: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 12,
  },
  serviceCard: {
    width: 172,
    minHeight: 160,
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 16,
    ...SHADOWS.small,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 18,
  },
  serviceMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: "auto",
    paddingTop: 14,
  },

  // Nearby professionals
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  proAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center",
  },
  proAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  proInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  proName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  proMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  proRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3DC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 3,
  },
  proRatingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B25E09",
  },
});

export default CustomerDashboard;