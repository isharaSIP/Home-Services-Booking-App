import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getProviders } from '../../services/providerService';
import { bookingPrice } from '../../services/bookingService';
import { distanceKm } from '../../utils/exploreProviders';
import { LocationEditor } from './ProfileScreen';
import ProviderProfileModal from './ProviderProfileModal';
const CATEGORIES = [['Plumbing', 'water-outline'], ['Electrical', 'flash-outline'], ['Cleaning', 'spray-bottle'], ['Painting', 'brush'], ['Gardening', 'leaf'], ['Appliance Repair', 'washing-machine']];
const getInitials = name => (name || '').split(/\s+/).slice(0, 2).map(n => n[0]).join('');
const CustomerDashboard = ({
  navigation
}) => {
  const {
      user
    } = useAuth(),
    insets = useSafeAreaInsets();
  const [providers, setProviders] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [locationOpen, setLocationOpen] = useState(false),
    [profile, setProfile] = useState(null);
  const request = useRef(null);
  const load = useCallback(() => {
    request.current?.abort();
    const c = new AbortController();
    request.current = c;
    setLoading(true);
    setError('');
    return getProviders(c.signal).then(rows => {
      if (!c.signal.aborted) setProviders(rows);
    }).catch(e => {
      if (!c.signal.aborted) setError(e.response?.data?.message || 'Providers could not load. Please try again.');
    }).finally(() => {
      if (!c.signal.aborted) setLoading(false);
    });
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
    return () => request.current?.abort();
  }, [load]));
  const goExplore = category => navigation.navigate('Explore', {
    category: typeof category === 'string' ? category : 'All'
  });
  const place = [user.location?.address, user.location?.city].filter(Boolean).join(', ') || 'Set your location';
  const nearby = providers.map(p => ({
    ...p,
    distance: distanceKm(p, user.location)
  })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.name.localeCompare(b.name)).slice(0, 5);
  return <View style={styles.screen}><StatusBar barStyle="light-content" backgroundColor={COLORS.primary} /><ScrollView contentContainerStyle={[styles.scrollContent, {
      maxWidth: 760,
      width: '100%',
      alignSelf: 'center'
    }]} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}><View style={[styles.hero, {
        paddingTop: insets.top + 16
      }]}><View style={styles.heroTop}><View style={[styles.heroText, {
            minWidth: 0
          }]}><Text style={styles.greeting}>Hello, {(user.name || 'there').split(' ')[0]}</Text><Pressable accessibilityRole="button" accessibilityLabel="Update your location" onPress={() => setLocationOpen(true)} style={styles.locationRow}><MaterialCommunityIcons accessible={false} name="map-marker-outline" size={18} color="#FFF" /><Text numberOfLines={1} style={[styles.locationText, {
                flexShrink: 1
              }]}>{place}</Text><MaterialCommunityIcons accessible={false} name="chevron-down" size={18} color="#FFF" /></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="View booking updates" onPress={() => navigation.navigate('Bookings')} style={styles.bell}><MaterialCommunityIcons accessible={false} name="bell-outline" size={24} color="#FFF" /></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="Search services" onPress={() => goExplore()} style={styles.search}><MaterialCommunityIcons accessible={false} name="magnify" size={24} color={COLORS.primary} /><Text style={styles.searchText}>What service do you need?</Text></Pressable></View><View style={styles.categoriesCard}><View style={styles.sectionRow}><Text style={styles.cardTitle}>Service categories</Text><Pressable accessibilityRole="button" onPress={() => goExplore()}><Text style={styles.link}>See all</Text></Pressable></View><View style={styles.categoryGrid}>{CATEGORIES.map(([name, icon]) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={'Explore ' + name} onPress={() => goExplore(name)} style={styles.category}><View style={styles.categoryIcon}><MaterialCommunityIcons accessible={false} name={icon} size={24} color={COLORS.primary} /></View><Text style={styles.categoryName}>{name}</Text><Text style={styles.categoryPros}>{loading ? 'Loading…' : error ? 'Browse providers' : providers.filter(p => p.category.toLowerCase() === name.toLowerCase()).length + ' professionals'}</Text></Pressable>)}</View></View><View style={[styles.sectionRow, styles.sectionPad, styles.nearbyHeader]}><Text style={styles.sectionTitle}>{user.location?.latitude != null ? 'Nearby professionals' : 'Verified professionals'}</Text><Pressable accessibilityRole="button" onPress={() => goExplore()}><Text style={styles.link}>Explore all</Text></Pressable></View><View style={styles.sectionPad}>{loading && <ActivityIndicator color={COLORS.primary} />}{!!error && <View style={styles.proCard}><Text accessibilityRole="alert" style={{
            flex: 1,
            color: COLORS.error
          }}>{error}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Try again</Text></Pressable></View>}{!loading && !error && !nearby.length && <Text style={styles.proMeta}>No verified providers are available yet. Pull down to refresh.</Text>}{!error && nearby.map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={'View ' + p.name + "'s profile"} onPress={() => setProfile(p)} style={styles.proCard}><View style={styles.proAvatar}><Text style={styles.proAvatarText}>{getInitials(p.name)}</Text></View><View style={styles.proInfo}><Text style={styles.proName}>{p.name}</Text><Text style={styles.proMeta}>{p.category} · {p.distance == null ? p.serviceArea || 'Area not listed' : p.distance.toFixed(1) + ' km away'}</Text><Text style={[styles.proMeta, {
              color: COLORS.primary
            }]}>{bookingPrice(p)}</Text></View><View style={styles.proRating}><MaterialCommunityIcons accessible={false} name="star" size={14} color="#F59E0B" /><Text style={styles.proRatingText}>{p.rating == null ? 'New' : p.rating.toFixed(1)}</Text></View></Pressable>)}</View></ScrollView>{locationOpen && <LocationEditor onClose={() => setLocationOpen(false)} />}{profile && <ProviderProfileModal visible provider={profile} onTrackBookings={() => navigation.navigate("Bookings")} onClose={() => setProfile(null)} navigation={navigation} />}</View>;
};
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 28
  },
  // Hero
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 49
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  heroText: {
    flex: 1,
    paddingRight: 12
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    alignSelf: "flex-start"
  },
  locationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    marginLeft: 4
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF"
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: COLORS.secondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 12
  },
  searchText: {
    fontSize: 15,
    color: COLORS.disabledText
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
    ...SHADOWS.small
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary
  },
  link: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18
  },
  category: {
    width: "33.333%",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center"
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 10,
    textAlign: "center"
  },
  categoryPros: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center"
  },
  // Sections
  sectionPad: {
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary
  },
  nearbyHeader: {
    marginTop: 26,
    marginBottom: 14
  },
  // Popular services
  serviceList: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 12
  },
  serviceCard: {
    width: 172,
    minHeight: 160,
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 16,
    ...SHADOWS.small
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center"
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 18
  },
  serviceMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: "auto",
    paddingTop: 14
  },
  // Nearby professionals
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small
  },
  proAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEEAFD",
    alignItems: "center",
    justifyContent: "center"
  },
  proAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary
  },
  proInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  proName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary
  },
  proMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3
  },
  proRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3DC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 3
  },
  proRatingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B25E09"
  }
});
export default CustomerDashboard;
