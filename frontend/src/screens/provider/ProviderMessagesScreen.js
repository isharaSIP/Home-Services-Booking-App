import React from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenHeader from '../../components/provider/ScreenHeader';
import MessagesScreen from '../customer/MessagesScreen';
import { COLORS } from '../../constants/theme';

// Reuse the existing booking chat and its ownership, retry and draft handling.
export default function ProviderMessagesScreen() {
  return <View style={styles.screen}><ScreenHeader title="Messages" subtitle="Booking conversations" /><MessagesScreen embedded /></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: COLORS.background } });
