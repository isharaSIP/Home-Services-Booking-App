import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bookingDate } from "../../services/bookingService";
import { getProviderReviews } from "../../services/providerService";

const SORT_OPTIONS = [
  ["recent", "Most Recent"],
  ["highest", "Highest Rated"],
  ["lowest", "Lowest Rated"],
];

const initials = (name) => (name || "Customer")
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

function Stars({ rating, size = 16 }) {
  return (
    <View style={styles.stars} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={size}
          color={star <= rating ? "#F59E0B" : "#CBD5E1"}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }) {
  const name = review.customerName?.trim() || "Customer";
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerAvatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View style={styles.reviewerDetails}>
          <Text style={styles.reviewerName}>{name}</Text>
          <Text style={styles.serviceName} numberOfLines={1}>{review.service}</Text>
        </View>
        <Text style={styles.date}>{bookingDate(review.createdAt)}</Text>
      </View>
      <Stars rating={review.rating} />
      {!!review.comment?.trim() && <Text style={styles.comment}>{review.comment.trim()}</Text>}
    </View>
  );
}

export default function ProviderReviewsScreen({ provider, onBack }) {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState("recent");
  const [result, setResult] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [moreError, setMoreError] = useState("");
  const [shareError, setShareError] = useState("");
  const request = useRef(null);
  const pageRequest = useRef(null);
  const loadingMoreRef = useRef(false);
  const queryKey = `${sort}:${refreshKey}`;
  const currentResult = result?.key === queryKey ? result : null;
  const summary = currentResult?.summary || null;
  const reviews = currentResult?.reviews || [];
  const page = currentResult?.pagination?.page || 1;
  const hasMore = currentResult?.pagination?.hasMore || false;
  const loading = !currentResult;
  const error = currentResult?.error || moreError;

  useEffect(() => {
    request.current?.abort();
    pageRequest.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    loadingMoreRef.current = false;

    getProviderReviews(provider.id, { sort, page: 1, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setMoreError("");
        setResult({ key: queryKey, ...result });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            key: queryKey,
            error: requestError.response?.data?.message || "We couldn’t load reviews. Check your connection and try again.",
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) loadingMoreRef.current = false;
      });

    return () => {
      controller.abort();
      pageRequest.current?.abort();
    };
  }, [provider.id, queryKey, sort]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMoreRef.current || error) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setMoreError("");
    const nextPage = page + 1;
    pageRequest.current?.abort();
    const controller = new AbortController();
    pageRequest.current = controller;
    try {
      const result = await getProviderReviews(provider.id, { sort, page: nextPage, signal: controller.signal });
      if (controller.signal.aborted) return;
      setResult((current) => current?.key === queryKey
        ? { ...current, ...result, reviews: [...current.reviews, ...result.reviews] }
        : current);
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setMoreError(requestError.response?.data?.message || "We couldn’t load more reviews. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [error, hasMore, loading, page, provider.id, queryKey, sort]);

  const retry = () => {
    setMoreError("");
    setRefreshKey((current) => current + 1);
  };

  const share = async () => {
    setShareError("");
    try {
      await Share.share({ message: [provider.name, provider.category, "Ratings & Reviews on FixMate."].filter(Boolean).join(" · ") });
    } catch {
      setShareError("Sharing is unavailable on this device. Please try again.");
    }
  };

  const total = summary?.totalReviews || 0;
  const average = summary?.averageRating;
  const renderSummary = () => (
    <View>
      <View style={styles.providerCard}>
        <View style={styles.providerAvatar}>
          {provider.avatar
            ? <Image accessibilityLabel={`${provider.name} profile photo`} source={{ uri: provider.avatar }} style={styles.providerPhoto} />
            : <Text style={styles.avatarText}>{initials(provider.name)}</Text>}
        </View>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerMeta}>{provider.category}{provider.verified ? " · Verified" : ""}</Text>
        </View>
        <View style={styles.providerRating}>
          <Text style={styles.providerRatingValue}>{average == null ? "—" : average.toFixed(1)} <Text style={styles.outOfFive}>/ 5</Text></Text>
          <Text style={styles.providerReviewCount}>{total} {total === 1 ? "Review" : "Reviews"}</Text>
        </View>
      </View>

      {!summary ? (
        <View style={styles.state}>
          {loading
            ? <ActivityIndicator color="#7047FA" />
            : <><Text accessibilityRole="alert" style={styles.stateText}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable></>}
        </View>
      ) : <>
      <View style={styles.summaryCard}>
        <View style={styles.averageRow}>
          <Text style={styles.average}>{average == null ? "—" : average.toFixed(1)}</Text>
          {average != null && <Text style={styles.outOfFive}>/ 5.0</Text>}
        </View>
        {average != null && <Stars rating={Math.round(average)} size={19} />}
        <Text style={styles.basedOn}>{total ? `Based on ${total} verified ${total === 1 ? "review" : "reviews"}` : "No reviews yet"}</Text>
        <View style={styles.divider} />
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary?.distribution?.[rating] || 0;
          const progress = total ? count / total : 0;
          return (
            <View key={rating} style={styles.distributionRow}>
              <Text style={styles.distributionLabel}>{rating} <Text style={styles.smallStar}>★</Text></Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.reviewsHeading}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Customer Reviews ({total})</Text>
      </View>
      <View style={styles.sortOptions} accessibilityRole="radiogroup">
        {SORT_OPTIONS.map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: sort === value }}
            onPress={() => setSort(value)}
            style={[styles.sortOption, sort === value && styles.sortOptionActive]}
          >
            <Text style={[styles.sortText, sort === value && styles.sortTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!!shareError && <Text accessibilityRole="alert" style={styles.errorText}>{shareError}</Text>}
      </>}
    </View>
  );

  const renderEmpty = () => {
    if (!summary) return null;
    if (loading) return <ActivityIndicator color="#7047FA" style={styles.state} />;
    if (total === 0) return <Text style={styles.emptyText}>No reviews yet.</Text>;
    return null;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to provider profile" style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#252525" />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>Ratings & Reviews</Text>
        <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Share reviews" style={styles.headerButton}>
          <MaterialCommunityIcons name="share-variant-outline" size={21} color="#252525" />
        </Pressable>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={(item, index) => `${item.createdAt}-${item.rating}-${index}`}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={renderSummary}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={loadingMore
          ? <ActivityIndicator color="#7047FA" style={styles.footer} />
          : error && reviews.length > 0
            ? <Pressable onPress={retry} accessibilityRole="button" style={styles.loadMoreError}><Text style={styles.retryText}>Couldn’t load more. Tap to retry.</Text></Pressable>
            : null}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom) }]}
        onEndReached={() => { void loadMore(); }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={loading && refreshKey > 0}
            onRefresh={retry}
            tintColor="#7047FA"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { minHeight: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E8F0" },
  headerButton: { width: 38, height: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F3F8" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#272727" },
  content: { paddingHorizontal: 16, paddingTop: 10, width: "100%", maxWidth: 640, alignSelf: "center", flexGrow: 1 },
  providerCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#EEF0F5" },
  providerAvatar: { width: 42, height: 42, borderRadius: 22, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  providerPhoto: { width: 42, height: 42, borderRadius: 22 },
  avatarText: { color: "#6D4DEF", fontWeight: "600", fontSize: 12 },
  providerDetails: { flex: 1, gap: 3 },
  providerName: { color: "#272727", fontSize: 14, fontWeight: "600" },
  providerMeta: { color: "#64748B", fontSize: 11 },
  providerRating: { alignItems: "flex-end", gap: 3 },
  providerRatingValue: { color: "#272727", fontSize: 14, fontWeight: "600" },
  outOfFive: { color: "#64748B", fontSize: 11, fontWeight: "400" },
  providerReviewCount: { color: "#64748B", fontSize: 9 },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#EEF0F5" },
  averageRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  average: { fontSize: 28, fontWeight: "700", color: "#272727" },
  stars: { flexDirection: "row", alignItems: "center", gap: 1 },
  basedOn: { fontSize: 10, color: "#64748B", marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E2E8F0", marginVertical: 10 },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 },
  distributionLabel: { width: 18, fontSize: 10, color: "#475569" },
  smallStar: { color: "#F59E0B" },
  progressTrack: { flex: 1, height: 6, borderRadius: 4, backgroundColor: "#EDF1F6", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#7047FA" },
  distributionCount: { width: 25, textAlign: "right", color: "#64748B", fontSize: 10 },
  reviewsHeading: { marginBottom: 9 },
  sectionTitle: { color: "#272727", fontSize: 15, fontWeight: "600" },
  sortOptions: { flexDirection: "row", gap: 6, marginBottom: 8 },
  sortOption: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 34, borderRadius: 9, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 4 },
  sortOptionActive: { backgroundColor: "#EEE9FF", borderColor: "#C9BCFF" },
  sortText: { color: "#64748B", fontSize: 10, fontWeight: "500" },
  sortTextActive: { color: "#5B35D5", fontWeight: "600" },
  reviewCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 13, marginTop: 8, borderWidth: 1, borderColor: "#EEF0F5" },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 7 },
  reviewerAvatar: { width: 30, height: 30, borderRadius: 16, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" },
  reviewerDetails: { flex: 1, gap: 2 },
  reviewerName: { color: "#272727", fontSize: 12, fontWeight: "600" },
  serviceName: { color: "#64748B", fontSize: 10 },
  date: { color: "#64748B", fontSize: 9 },
  comment: { color: "#475569", fontSize: 12, lineHeight: 18, marginTop: 6 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 28, paddingHorizontal: 20 },
  stateText: { textAlign: "center", color: "#475569", fontSize: 13 },
  retryButton: { borderRadius: 9, backgroundColor: "#7047FA", paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  emptyText: { color: "#64748B", textAlign: "center", padding: 24, fontSize: 13 },
  footer: { paddingVertical: 18 },
  loadMoreError: { backgroundColor: "#FFFFFF", borderRadius: 9, padding: 12, alignItems: "center", marginTop: 8 },
  errorText: { color: "#B42318", fontSize: 12, marginBottom: 8 },
});
