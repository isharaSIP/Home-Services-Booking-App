import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS } from "../../constants/theme";
import adminService from "../../services/adminService";

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

const STATUS_STYLES = {
  Pending: { bg: "#FEF3DC", text: "#B25E09" },
  pending: { bg: "#FEF3DC", text: "#B25E09" },
  Approved: { bg: "#D1FAE5", text: "#065F46" },
  approved: { bg: "#D1FAE5", text: "#065F46" },
  Rejected: { bg: "#FEE2E2", text: "#991B1B" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

// ---------------------------------------------------------------------------
// Application Card Component
// ---------------------------------------------------------------------------
const ApplicationCard = ({ item, onPress }) => {
  const rawStatus = item.providerDetails?.approvalStatus || (item.isApprovedByAdmin ? "approved" : "pending");
  const formattedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  const badge = STATUS_STYLES[rawStatus] || STATUS_STYLES.Pending;
  const actionLabel = rawStatus === "pending" ? "Review application" : "View application";

  const docCount =
    (item.providerDetails?.nicFront ? 1 : 0) +
    (item.providerDetails?.nicBack ? 1 : 0) +
    (item.providerDetails?.certificates?.length || 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>
            {item.providerDetails?.category || "General Service"} · {item.phone || item.email}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{formattedStatus}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Registered: {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.metaText}>
          {docCount} {docCount === 1 ? "document" : "documents"}
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
// Verification Screen Component
// ---------------------------------------------------------------------------
const VerificationScreen = () => {
  const insets = useSafeAreaInsets();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [newestFirst, setNewestFirst] = useState(true);

  // Popup Modal states
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedTitle, setZoomedTitle] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getProviders("");
      if (data && data.providers) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = providers.filter((item) => {
      const status = item.providerDetails?.approvalStatus || (item.isApprovedByAdmin ? "approved" : "pending");
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

      const matchesFilter = filter === "All" || formattedStatus === filter;
      const matchesQuery =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.providerDetails?.category && item.providerDetails.category.toLowerCase().includes(q));

      return matchesFilter && matchesQuery;
    });

    return list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return newestFirst ? dateB - dateA : dateA - dateB;
    });
  }, [providers, query, filter, newestFirst]);

  const handleAction = async (providerId, providerName, action) => {
    Alert.alert(
      action === "approve" ? "Approve Application" : "Reject Application",
      `Are you sure you want to ${action} ${providerName}'s service provider verification?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approve" ? "Approve" : "Reject",
          style: action === "approve" ? "default" : "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await adminService.verifyProvider(providerId, action);
              Alert.alert(
                "Success",
                res.message || `Provider ${action}d successfully.`
              );
              setSelectedProvider(null);
              setZoomedImage(null);
              fetchProviders();
            } catch (err) {
              Alert.alert(
                "Error",
                err.response?.data?.message || `Failed to ${action} provider.`
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openZoomImage = (imageUri, title) => {
    setZoomedImage(imageUri);
    setZoomedTitle(title);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />

      {/* Header (fixed) */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Provider Verification</Text>
          <Text style={styles.subtitle}>
            {providers.filter((p) => (p.providerDetails?.approvalStatus || "pending") === "pending").length} applications awaiting review
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={fetchProviders}
          accessibilityRole="button"
          accessibilityLabel="Refresh list"
        >
          <MaterialCommunityIcons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Body */}
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
            placeholder="Search provider name, category or phone..."
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
        </View>

        {/* Result count + sort */}
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {filteredResults.length} {filteredResults.length === 1 ? "application" : "applications"}
          </Text>
          <TouchableOpacity
            onPress={() => setNewestFirst((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Change sort order"
          >
            <Text style={styles.sort}>{newestFirst ? "Newest first" : "Oldest first"}</Text>
          </TouchableOpacity>
        </View>

        {/* Loading / List / Empty */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching verification queue...</Text>
          </View>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((item) => (
            <ApplicationCard
              key={item._id}
              item={item}
              onPress={(provider) => {
                setZoomedImage(null);
                setSelectedProvider(provider);
              }}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No applications found</Text>
            <Text style={styles.emptyText}>
              Try a different search query or select another filter tab.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* --------------------------------------------------------------------------- */}
      {/* PROVIDER REVIEW MODAL (WITH EMBEDDED FULLSCREEN ZOOM VIEW)                  */}
      {/* --------------------------------------------------------------------------- */}
      <Modal
        visible={!!selectedProvider}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (zoomedImage) setZoomedImage(null);
          else setSelectedProvider(null);
        }}
      >
        <View style={styles.modalOverlay}>
          {zoomedImage ? (
            /* FULLSCREEN IMAGE ZOOM CONTAINER */
            <View style={styles.fullZoomContainer}>
              <View style={styles.fullZoomHeader}>
                <TouchableOpacity
                  style={styles.fullZoomBackBtn}
                  onPress={() => setZoomedImage(null)}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                  <Text style={styles.fullZoomBackText}>Back to Review</Text>
                </TouchableOpacity>
                <Text style={styles.fullZoomTitle}>{zoomedTitle}</Text>
              </View>

              <Image
                source={{ uri: zoomedImage }}
                style={styles.fullZoomImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            /* PROVIDER DETAILS APPLICATION MODAL */
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {getInitials(selectedProvider?.name || "")}
                    </Text>
                  </View>
                  <View style={styles.modalHeaderTextGroup}>
                    <Text style={styles.modalTitle}>{selectedProvider?.name}</Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedProvider?.providerDetails?.category || "Service Provider"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedProvider(null)}
                >
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {/* Contact & Profile Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Applicant Details</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{selectedProvider?.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{selectedProvider?.phone}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Experience:</Text>
                    <Text style={styles.infoValue}>
                      {selectedProvider?.providerDetails?.experience || "Not specified"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Submission Date:</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(selectedProvider?.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* NIC Documents */}
                <Text style={styles.docsSectionTitle}>National Identity Card (NIC) *</Text>

                <View style={styles.docGrid}>
                  {/* NIC Front */}
                  <View style={styles.docBox}>
                    <Text style={styles.docBoxLabel}>NIC Front</Text>
                    {selectedProvider?.providerDetails?.nicFront ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          openZoomImage(
                            selectedProvider.providerDetails.nicFront,
                            "NIC Front Image"
                          )
                        }
                      >
                        <Image
                          source={{ uri: selectedProvider.providerDetails.nicFront }}
                          style={styles.docImage}
                        />
                        {/* <Text style={styles.zoomHint}>🔍 Tap to view full size</Text> */}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.missingBox}>
                        <Text style={styles.missingText}>No NIC Front Image</Text>
                      </View>
                    )}
                  </View>

                  {/* NIC Back */}
                  <View style={styles.docBox}>
                    <Text style={styles.docBoxLabel}>NIC Back</Text>
                    {selectedProvider?.providerDetails?.nicBack ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          openZoomImage(
                            selectedProvider.providerDetails.nicBack,
                            "NIC Back Image"
                          )
                        }
                      >
                        <Image
                          source={{ uri: selectedProvider.providerDetails.nicBack }}
                          style={styles.docImage}
                        />
                        {/* <Text style={styles.zoomHint}>🔍 Tap to view full size</Text> */}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.missingBox}>
                        <Text style={styles.missingText}>No NIC Back Image</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Optional Certifications */}
                {selectedProvider?.providerDetails?.certificates?.length > 0 && (
                  <View style={styles.certSection}>
                    <Text style={styles.docsSectionTitle}>
                      Certifications & Qualifications ({selectedProvider.providerDetails.certificates.length})
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.certScroll}>
                      {selectedProvider.providerDetails.certificates.map((cert, index) => (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.8}
                          onPress={() =>
                            openZoomImage(cert, `Certificate #${index + 1}`)
                          }
                          style={styles.certCard}
                        >
                          <Image source={{ uri: cert }} style={styles.certImage} />
                          <Text style={styles.zoomHint}>Certificate #{index + 1}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>

              {/* Modal Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.rejectModalBtn}
                  onPress={() =>
                    handleAction(selectedProvider?._id, selectedProvider?.name, "reject")
                  }
                  disabled={actionLoading}
                >
                  <Text style={styles.rejectModalText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveModalBtn}
                  onPress={() =>
                    handleAction(selectedProvider?._id, selectedProvider?.name, "approve")
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={COLORS.secondary} />
                  ) : (
                    <Text style={styles.approveModalText}>✓ Approve Application</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
    marginTop: 6,
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
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // Loader & Empty state
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
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

  // ------------------- POPUP MODAL STYLES -------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalAvatarText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "800",
  },
  modalHeaderTextGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalScroll: {
    marginVertical: 14,
  },
  infoSection: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  docsSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  docGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  docBox: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  docBoxLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  docImage: {
    width: 130,
    height: 95,
    borderRadius: 8,
  },
  zoomHint: {
    fontSize: 11,
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "700",
  },
  missingBox: {
    height: 95,
    justifyContent: "center",
    alignItems: "center",
  },
  missingText: {
    fontSize: 12,
    color: COLORS.error,
    fontStyle: "italic",
  },
  certSection: {
    marginBottom: 16,
  },
  certScroll: {
    flexDirection: "row",
  },
  certCard: {
    marginRight: 12,
    alignItems: "center",
  },
  certImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#CBD5E1",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 10,
  },
  rejectModalBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  rejectModalText: {
    color: COLORS.error,
    fontWeight: "800",
    fontSize: 15,
  },
  approveModalBtn: {
    flex: 2,
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  approveModalText: {
    color: COLORS.secondary,
    fontWeight: "800",
    fontSize: 15,
  },

  // ------------------- FULLSCREEN ZOOM CONTAINER -------------------
  fullZoomContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  fullZoomHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  fullZoomBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  fullZoomBackText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  fullZoomTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  fullZoomImage: {
    width: "100%",
    height: "85%",
  },
});

export default VerificationScreen;