import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import {
  Search,
  ArrowLeft,
  X,
  Heart,
  MessageCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react-native";
import { theme } from "@friendscircle/ui";
import { getTimeAgo } from "@friendscircle/shared";
import { useState, useCallback, useEffect, useRef, memo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getPosts } from "@friendscircle/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Features Config ────────────────────────────────────────────

const FEATURES = [
  { type: "friend_circle", label: "Friends Circle",       emoji: "👥", color: "#6C5CE7", desc: "Your inner squad" },
  { type: "olx",           label: "Student OLX",          emoji: "🛍️", color: "#FDCB6E", desc: "Buy & sell on campus" },
  { type: "books",         label: "Books",                emoji: "📚", color: "#00CEC9", desc: "Buy & sell textbooks" },
  { type: "lost_found",   label: "Lost & Found",          emoji: "🔎", color: "#FF6B6B", desc: "Find lost items" },
  { type: "teacher_review", label: "Teacher Reviews",     emoji: "⭐", color: "#FDCB6E", desc: "Rate your professors" },
  { type: "past_paper",   label: "Past Papers",           emoji: "📄", color: "#A29BFE", desc: "Exam resources" },
  { type: "roommate",     label: "Roommate Finder",       emoji: "🏠", color: "#00CEC9", desc: "Find roommates" },
  { type: "ride_share",   label: "Ride Share",            emoji: "🚗", color: "#55EFC4", desc: "Split rides" },
  { type: "freelance",    label: "Freelance Assignments", emoji: "💼", color: "#6C5CE7", desc: "Help with assignments" },
  { type: "job",          label: "Jobs",                  emoji: "💰", color: "#55EFC4", desc: "Find opportunities" },
  { type: "event",        label: "Events",                emoji: "🎉", color: "#FF6B6B", desc: "Campus happenings" },
  { type: "memory",       label: "Uni Memories",          emoji: "📸", color: "#FDCB6E", desc: "Share moments" },
];

// ─── Floating Orb ───────────────────────────────────────────────

function Orb({
  size,
  top,
  left,
  color,
  delay = 0,
}: {
  size: number;
  top: number;
  left: number;
  color: string;
  delay?: number;
}) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
          withTiming(16, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          opacity: 0.18,
        },
        orbStyle,
      ]}
    />
  );
}

// ─── Trending Card ──────────────────────────────────────────────

const TrendingCard = memo(function TrendingCard({ post, index }: { post: any; index: number }) {
  const scale = useSharedValue(1);
  const [imgLoading, setImgLoading] = useState(true);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const feature = FEATURES.find((f) => f.type === post.post_type);
  const typeColor = feature?.color || "#6C5CE7";

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).springify()}>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[styles.trendingCard, cardStyle]}
      >
        <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
        {post.image_urls?.length > 0 ? (
          <View>
            <Image
              source={{ uri: post.image_urls[0] }}
              style={styles.trendingImage}
              resizeMode="cover"
              onLoadEnd={() => setImgLoading(false)}
            />
            {imgLoading && (
              <View style={{ ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#1C1C32" }}>
                <ActivityIndicator color={typeColor} size="small" />
              </View>
            )}
          </View>
        ) : (
          <LinearGradient
            colors={["#252540", "#1C1C32"]}
            style={styles.trendingImage}
          >
            <Text style={{ fontSize: 38 }}>{feature?.emoji || "\u{1F4DD}"}</Text>
          </LinearGradient>
        )}
        <View style={styles.trendingContent}>
          <View style={styles.trendingTypePill}>
            <Text style={{ fontSize: 10 }}>{feature?.emoji || "\u{1F4DD}"}</Text>
            <Text style={styles.trendingTypeText}>
              {feature?.label || "Post"}
            </Text>
          </View>
          <Text style={styles.trendingTitle} numberOfLines={2}>
            {post.title}
          </Text>
          <View style={styles.trendingMeta}>
            <Text style={styles.trendingAuthor}>{post.profiles?.full_name || "Anonymous"}</Text>
            <Text style={styles.trendingTime}>{getTimeAgo(post.created_at)}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Category Tile ──────────────────────────────────────────────

const CategoryTile = memo(function CategoryTile({
  feature,
  index,
  isHero,
  onPress,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
  isHero: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 60, 500)).springify()}
      style={isHero ? styles.heroTileWrapper : styles.normalTileWrapper}
    >
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[styles.categoryTile, isHero && styles.heroTile, cardStyle]}
      >
        <LinearGradient
          colors={["#1E1E3A", "#16162A"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{
          flexDirection: isHero ? "row" : "column",
          alignItems: isHero ? "center" : "flex-start",
          gap: isHero ? 14 : 0,
        }}>
          <View style={[styles.tileEmojiBg, { backgroundColor: feature.color + "20" }, !isHero && { marginBottom: 10 }]}>
            <Text style={{ fontSize: isHero ? 28 : 22 }}>{feature.emoji}</Text>
          </View>
          <View style={{ flex: isHero ? 1 : undefined }}>
            <Text style={styles.tileLabel}>{feature.label}</Text>
            <Text style={styles.tileDesc}>{feature.desc}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Search Bar ─────────────────────────────────────────────────

function SearchBar({
  value,
  onChangeText,
  onFocus,
  onCancel,
  isFocused,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onCancel: () => void;
  isFocused: boolean;
}) {
  const borderAnim = useSharedValue(0);

  useEffect(() => {
    borderAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderAnim.value,
      [0, 1],
      ["#6C5CE730", theme.colors.primary.DEFAULT + "80"],
    ),
  }));

  return (
    <View style={styles.searchRow}>
      <Animated.View style={[styles.searchContainer, containerStyle]}>
        <Search color={isFocused ? theme.colors.primary.light : theme.colors.dark.textMuted} size={18} />
        <TextInput
          placeholder="Search posts, teachers, courses..."
          placeholderTextColor={theme.colors.dark.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          style={styles.searchInput}
          accessibilityLabel="Search posts"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText("")}>
            <X color={theme.colors.dark.textMuted} size={16} />
          </Pressable>
        )}
      </Animated.View>
      {isFocused && (
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Category Detail View ───────────────────────────────────────

function CategoryDetail({
  feature,
  onBack,
}: {
  feature: (typeof FEATURES)[0];
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const CATEGORY_PAGE_SIZE = 20;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", "explore", feature.type],
    queryFn: ({ pageParam = 1 }) =>
      getPosts({ post_type: feature.type as any, page: pageParam, limit: CATEGORY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const items = (lastPage?.data as any[]) || [];
      return items.length >= CATEGORY_PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    enabled: true,
  });

  const posts = (data?.pages ?? []).flatMap((page) => (page?.data as any[]) || []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderPost = useCallback(
    ({ item: post, index }: { item: any; index: number }) => (
      <Animated.View entering={FadeInUp.delay(Math.min(index * 60, 400)).springify()}>
        <View style={[styles.detailPostCard, { borderColor: feature.color + "25" }]}>
          <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
          {/* Left accent strip */}
          <View style={[styles.detailPostAccent, { backgroundColor: feature.color }]} />
          <View style={styles.detailPostContent}>
            <View style={styles.detailAuthorRow}>
              {post.profiles?.avatar_url ? (
                <Image source={{ uri: post.profiles.avatar_url }} style={styles.detailAvatar} />
              ) : (
                <LinearGradient
                  colors={[feature.color, feature.color + "80"]}
                  style={styles.detailAvatar}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
                    {post.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                  </Text>
                </LinearGradient>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.detailAuthorName}>{post.profiles?.full_name || "Anonymous"}</Text>
                <Text style={styles.detailAuthorMeta}>
                  {post.universities?.short_name || ""}
                  {post.universities?.short_name ? " \u00B7 " : ""}
                  {getTimeAgo(post.created_at)}
                </Text>
              </View>
            </View>
            <Text style={styles.detailPostTitle}>{post.title}</Text>
            {post.image_urls?.length > 0 && (
              <Image
                source={{ uri: post.image_urls[0] }}
                style={styles.detailPostImage}
                resizeMode="cover"
              />
            )}
            {post.body ? (
              <Text style={styles.detailPostBody} numberOfLines={3}>
                {post.body}
              </Text>
            ) : null}
            <View style={[styles.detailActionsRow, { borderTopColor: feature.color + "18" }]}>
              <View style={styles.detailAction}>
                <Heart color={theme.colors.dark.textMuted} size={15} />
              </View>
              <View style={styles.detailAction}>
                <MessageCircle color={theme.colors.dark.textMuted} size={15} />
                <Text style={styles.detailActionText}>{post.comments?.[0]?.count || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    ),
    [feature.color],
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <LinearGradient
        colors={["#1A1235", "#0F0F1A", "#0F0F1A"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Orb size={240} top={-60} left={-60} color={feature.color} />
      <Orb size={160} top={350} left={SCREEN_WIDTH - 80} color={feature.color} delay={1000} />

      {/* Header */}
      <LinearGradient
        colors={[feature.color + "70", feature.color + "25", "transparent"]}
        locations={[0, 0.6, 1]}
        style={[styles.detailHeader, { paddingTop: insets.top + 8 }]}
      >
        <Pressable onPress={onBack} style={[styles.backButton, { borderColor: feature.color + "40", backgroundColor: feature.color + "15" }]} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft color={feature.color} size={20} />
        </Pressable>
        <View style={styles.detailHeaderContent}>
          <View style={[styles.detailHeaderEmoji, { backgroundColor: feature.color + "25" }]}>
            <Text style={{ fontSize: 38 }}>{feature.emoji}</Text>
          </View>
          <View>
            <Text style={styles.detailHeaderTitle}>{feature.label}</Text>
            <Text style={[styles.detailHeaderCount, { color: feature.color }]}>
              {isLoading ? "Loading..." : `${posts.length} posts`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <ActivityIndicator color={feature.color} size="large" />
        </View>
      ) : isError ? (
        <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{"\u26A0\uFE0F"}</Text>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Failed to load</Text>
          <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, marginTop: 4, textAlign: "center" }}>
            Pull down to try again.
          </Text>
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={feature.color} />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={feature.color} style={{ paddingVertical: 20 }} />
            ) : null
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      ) : (
        <Animated.View entering={FadeInUp.springify()} style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
          <View style={[styles.emptyIconBg, { backgroundColor: feature.color + "15" }]}>
            <LinearGradient colors={[feature.color + "40", feature.color + "10"]} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 40 }}>{feature.emoji}</Text>
          </View>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 6 }}>
            No {feature.label.toLowerCase()} yet
          </Text>
          <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, textAlign: "center" }}>
            Be the first to post in this category!
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Explore Screen ────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Trending posts
  const { data: trendingData } = useQuery({
    queryKey: ["posts", "trending"],
    queryFn: () => getPosts({ page: 1, limit: 5 }),
  });
  const trendingPosts = (trendingData?.data as any[]) || [];

  // Search
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["posts", "search", debouncedSearch],
    queryFn: () => getPosts({ search: debouncedSearch, page: 1, limit: 20 }),
    enabled: debouncedSearch.length >= 2,
  });
  const searchResults = (searchData?.data as any[]) || [];

  // Category detail
  if (selectedType) {
    const feature = FEATURES.find((f) => f.type === selectedType)!;
    return <CategoryDetail feature={feature} onBack={() => setSelectedType(null)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <LinearGradient
        colors={["#1A1A35", "#0F0F1A", "#0F0F1A"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Orb size={220} top={-70} left={-60} color="#6C5CE7" />
      <Orb size={160} top={400} left={SCREEN_WIDTH - 80} color="#00CEC9" delay={900} />
      <Orb size={130} top={750} left={20} color="#FF6B6B" delay={1700} />

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16 }}>
          {/* Title */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.titleRow}>
            <Text style={styles.screenTitle}>Explore</Text>
            <View style={styles.titleBadge}>
              <Sparkles color="#FDCB6E" size={14} />
              <Text style={styles.titleBadgeText}>Discover</Text>
            </View>
          </Animated.View>

          {/* Search */}
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onCancel={() => {
              setSearch("");
              setSearchFocused(false);
            }}
            isFocused={searchFocused}
          />
        </View>

        {/* Search Results */}
        {debouncedSearch.length >= 2 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {searchLoading ? (
              <ActivityIndicator color={theme.colors.primary.DEFAULT} style={{ marginTop: 40 }} />
            ) : searchResults.length > 0 ? (
              <>
                <Text style={styles.resultCount}>
                  {searchResults.length} results for &quot;{search}&quot;
                </Text>
                {searchResults.map((post: any, index: number) => {
                  const feature = FEATURES.find((f) => f.type === post.post_type);
                  const typeColor = feature?.color || "#6C5CE7";
                  return (
                    <Animated.View key={post.id} entering={FadeInUp.delay(index * 60).springify()}>
                      <View style={styles.searchResultCard}>
                        <View>
                          <View style={styles.searchResultTypePill}>
                            <Text style={{ fontSize: 11 }}>{feature?.emoji || "\u{1F4DD}"}</Text>
                            <Text style={styles.searchResultTypeText}>
                              {feature?.label || "Post"}
                            </Text>
                          </View>
                          <Text style={styles.searchResultTitle}>{post.title}</Text>
                          {post.body ? (
                            <Text style={styles.searchResultBody} numberOfLines={2}>{post.body}</Text>
                          ) : null}
                          <Text style={styles.searchResultMeta}>
                            {post.profiles?.full_name || "Anonymous"} · {getTimeAgo(post.created_at)}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>{"\u{1F50D}"}</Text>
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  No results found
                </Text>
                <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 13, marginTop: 4 }}>
                  Try a different search term
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Trending Section */}
            {trendingPosts.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <View style={styles.sectionHeader}>
                  <TrendingUp color={theme.colors.accent.coral} size={16} />
                  <Text style={styles.sectionLabel}>TRENDING NOW</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                >
                  {trendingPosts.map((post, index) => (
                    <TrendingCard key={post.id} post={post} index={index} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Categories Grid */}
            <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>BROWSE CATEGORIES</Text>
              </View>
              <View style={styles.bentoGrid}>
                {FEATURES.map((feature, index) => (
                  <CategoryTile
                    key={feature.type}
                    feature={feature}
                    index={index}
                    isHero={index < 2}
                    onPress={() => setSelectedType(feature.type)}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Title
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  screenTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FDCB6E15",
    borderWidth: 1,
    borderColor: "#FDCB6E30",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  titleBadgeText: {
    color: "#FDCB6E",
    fontSize: 12,
    fontWeight: "700",
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C32",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: theme.colors.dark.textPrimary,
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelText: {
    color: theme.colors.primary.light,
    fontSize: 14,
    fontWeight: "600",
  },

  // Search Results
  resultCount: {
    color: theme.colors.dark.textMuted,
    fontSize: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  searchResultCard: {
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffffff08",
    overflow: "hidden",
    backgroundColor: "#1C1C32",
    padding: 14,
  },
  searchResultTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#ffffff10",
    marginBottom: 8,
  },
  searchResultTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.dark.textMuted,
  },
  searchResultTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 21,
  },
  searchResultBody: {
    color: theme.colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  searchResultMeta: {
    color: theme.colors.dark.textMuted,
    fontSize: 11,
    marginTop: 8,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    color: theme.colors.dark.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  // Trending
  trendingCard: {
    width: 240,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  trendingImage: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  trendingContent: {
    padding: 12,
  },
  trendingTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#ffffff10",
    marginBottom: 8,
  },
  trendingTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.dark.textMuted,
  },
  trendingTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
  },
  trendingMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  trendingAuthor: {
    color: theme.colors.dark.textSecondary,
    fontSize: 11,
  },
  trendingTime: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
  },

  // Bento Grid
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroTileWrapper: {
    width: "100%",
  },
  normalTileWrapper: {
    width: "48%" as any,
  },
  categoryTile: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffffff08",
    overflow: "hidden",
  },
  heroTile: {
    paddingVertical: 20,
  },
  tileEmojiBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
    color: theme.colors.dark.textPrimary,
  },
  tileDesc: {
    color: theme.colors.dark.textMuted,
    fontSize: 11,
    marginTop: 1,
  },

  // Category Detail
  detailHeader: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  detailHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailHeaderEmoji: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  detailHeaderTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },
  detailHeaderCount: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  detailPostCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailPostAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  detailPostContent: {
    padding: 16,
    paddingLeft: 20,
  },
  detailAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  detailAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  detailAuthorName: {
    color: theme.colors.dark.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  detailAuthorMeta: {
    color: theme.colors.dark.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  detailPostTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 22,
  },
  detailPostImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10,
  },
  detailPostBody: {
    color: theme.colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  detailActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  detailAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailActionText: {
    color: theme.colors.dark.textMuted,
    fontSize: 12,
  },

  // Empty state
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
});
