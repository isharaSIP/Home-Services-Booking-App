import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StatusBar, StyleSheet, Alert } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { COLORS, SHADOWS } from "../../constants/theme";
import Avatar from "../../components/provider/Avatar";
import ScreenHeader from "../../components/provider/ScreenHeader";
import { CONVERSATIONS } from "../../constants/providerData";

const ProviderMessagesScreen = () => {
  const focused = useIsFocused();
  const [chats, setChats] = useState(CONVERSATIONS);

  const openChat = (chat) => {
    // Opening a chat clears its unread badge.
    setChats((list) => list.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
    // TODO: navigate to the chat screen once it exists.
    Alert.alert(chat.name, "Chat conversations are coming soon.");
  };

  return (
    <View style={styles.screen}>
      {focused && <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />}

      <ScreenHeader title="Messages" subtitle="Customer and support chats" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {chats.map((chat, index) => (
            <Pressable
              key={chat.id}
              onPress={() => openChat(chat)}
              style={({ pressed }) => [
                styles.row,
                index < chats.length - 1 && styles.rowDivider,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${chat.name}, ${chat.unread ? chat.unread + " unread" : "no unread"}`}
            >
              <Avatar name={chat.name} size={50} radius={15} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>
                    {chat.name}
                  </Text>
                  <Text style={styles.time}>{chat.time}</Text>
                </View>
                <Text style={styles.context} numberOfLines={1}>
                  {chat.context}
                </Text>
                <View style={styles.previewRow}>
                  <Text
                    style={[styles.preview, chat.unread > 0 && styles.previewUnread]}
                    numberOfLines={1}
                  >
                    {chat.preview}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    overflow: "hidden",
    ...SHADOWS.small,
  },
  row: { flexDirection: "row", alignItems: "center", padding: 16 },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  pressed: { backgroundColor: "#F8F7FF" },
  rowBody: { flex: 1, marginLeft: 14 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  time: { fontSize: 12, color: COLORS.textMuted },
  context: { fontSize: 13, fontWeight: "600", color: COLORS.primary, marginTop: 3 },
  previewRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  preview: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  previewUnread: { color: COLORS.textPrimary, fontWeight: "600" },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
});

export default ProviderMessagesScreen;
