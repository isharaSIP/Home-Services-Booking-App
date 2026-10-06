import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { availabilityLabel } from '../../utils/exploreProviders';

const verifiedIcon = require('../../../assets/images/explore/imgSvg2.svg');
const starIcon = require('../../../assets/images/explore/imgSvg3.svg');

function Section({ title, children }) {
  return <View style={styles.card}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

// Public directory data only: never render account documents or earnings here.
export default function ProviderProfileModal({ visible, provider, loading, error, onClose, onRetry }) {
  const insets = useSafeAreaInsets();
  const p = provider;
  const initials = (p?.name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
    <View style={[styles.screen, { paddingTop: insets.top }]} accessibilityViewIsModal>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to Explore" style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <Text accessibilityRole="header" style={styles.title}>Provider profile</Text>
      </View>
      {loading ? <View style={styles.state}><ActivityIndicator size="large" color="#7047FF" /><Text style={styles.muted}>Loading profile…</Text></View> : error ? <View style={styles.state}><Text accessibilityRole="alert" style={styles.body}>{error}</Text><Pressable onPress={onRetry} accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>Try again</Text></Pressable></View> : p && <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom) }]}>
        <View style={styles.card}>
          <View style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text>{p.verified && <Image source={verifiedIcon} style={styles.verifiedIcon} contentFit="contain" />}</View>
            <View style={styles.flex}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.category}>{p.category}{p.experience ? ` · ${p.experience}` : ''}</Text>
              <View style={styles.ratingRow}><Image source={starIcon} style={styles.star} /><Text style={styles.rating}>{p.rating == null ? 'New professional' : `${p.rating.toFixed(1)} (${p.reviewCount})`}</Text></View>
              {p.verified && <View style={styles.badge}><Text style={styles.badgeText}>●  Verified provider</Text></View>}
            </View>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{p.rating == null ? '—' : p.rating.toFixed(1)}</Text><Text style={styles.statLabel}>Rating</Text></View>
            <View style={[styles.stat, styles.statBorder]}><Text style={styles.statValue}>{p.reviewCount || 0}</Text><Text style={styles.statLabel}>Reviews</Text></View>
          </View>
        </View>
        <Section title="About"><Text style={styles.body}>{p.bio || 'This provider hasn’t added an introduction yet.'}</Text>{!!p.experience && <View style={styles.detail}><Text style={styles.muted}>Experience</Text><Text style={styles.body}>{p.experience}</Text></View>}{!!p.qualifications && <View style={styles.detail}><Text style={styles.muted}>Qualifications</Text><Text style={styles.body}>{p.qualifications}</Text></View>}</Section>
        <Section title="Services & pricing"><View style={styles.service}><View style={styles.flex}><Text style={styles.serviceName}>{p.category}</Text><Text style={styles.muted}>{p.price == null ? 'Ask the provider for a quote' : `per ${p.priceUnit}`}</Text></View><Text style={styles.price}>{p.price == null ? 'On request' : `LKR ${p.price.toLocaleString('en-US')}`}</Text></View></Section>
        <Section title="Service area & availability"><View style={styles.detail}><Text style={styles.muted}>Service area</Text><Text style={styles.body}>{p.serviceArea || 'Service area not listed'}</Text></View><View style={styles.detail}><Text style={styles.muted}>Next availability</Text><Text style={styles.body}>{availabilityLabel(p.nextAvailableAt)}</Text></View></Section>
        <Section title="Customer reviews"><View style={styles.reviewSummary}><Image source={starIcon} style={styles.largeStar} /><Text style={styles.reviewScore}>{p.rating == null ? '—' : p.rating.toFixed(1)}</Text><Text style={styles.muted}>{p.reviewCount || 0} {(p.reviewCount || 0) === 1 ? 'review' : 'reviews'}</Text></View><Text style={styles.body}>{p.reviewCount > 0 ? 'Written reviews are not available yet.' : 'No customer reviews yet.'}</Text></Section>
      </ScrollView>}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#ECECF1' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 34, lineHeight: 38, color: '#7047FF' },
  title: { fontSize: 19, fontWeight: '700', color: '#2A2A2A' },
  content: { padding: 20, gap: 16, width: '100%', maxWidth: 600, alignSelf: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.04)' },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#F0EBFF', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#7047FF', fontWeight: '700', fontSize: 22 },
  verifiedIcon: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, backgroundColor: '#FFF', borderRadius: 12 },
  flex: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontWeight: '700', color: '#2A2A2A' },
  category: { fontSize: 12.5, lineHeight: 19, color: '#7047FF', marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  star: { width: 14, height: 14 },
  rating: { fontSize: 12, color: '#2A2A2A' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#E5F5EF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginTop: 7 },
  badgeText: { fontSize: 11, color: '#079C73', fontWeight: '600' },
  stats: { flexDirection: 'row', marginTop: 18, backgroundColor: '#F6F6F9', borderRadius: 16, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#ECECF1' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#2A2A2A' },
  statLabel: { fontSize: 11, color: '#6E6E76' },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: '#2A2A2A', marginBottom: 12 },
  body: { fontSize: 13, lineHeight: 21, color: '#45454D' },
  muted: { fontSize: 11.5, lineHeight: 18, color: '#6E6E76' },
  detail: { gap: 3, marginTop: 8 },
  service: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  serviceName: { fontSize: 13, lineHeight: 20, fontWeight: '500', color: '#2A2A2A' },
  price: { fontSize: 13, fontWeight: '700', color: '#2A2A2A', maxWidth: '48%' },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  largeStar: { width: 20, height: 20 },
  reviewScore: { fontSize: 24, fontWeight: '700', color: '#2A2A2A' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  button: { backgroundColor: '#7047FF', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
