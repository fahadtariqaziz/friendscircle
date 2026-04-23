import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  MessageCircle,
  Heart,
  CheckCircle,
  Bell,
  BellOff,
} from "lucide-react-native";
import { theme } from "@friendscircle/ui";
import { getTimeAgo } from "@friendscircle/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyComments,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@friendscircle/supabase";
import { useAuth } from "../_layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useCallback, useState, useEffect, memo } from "react";
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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SEGMENTS = ["My Threads", "Notifications"] as const;
type Segment = (typeof SEGMENTS)[number];

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

// ─── Segment Toggle ─────────────────────────────────────────────

function SegmentToggle({
  active,
  onChange,
  unreadCount,
}: {
  active: Segment;
  onChange: (s: Segment) => void;
  unreadCount: number;
}) {
  return (
    <View style={styles.segmentRow}>
      {SEGMENTS.map((seg) => {
        const isActive = active === seg;
        return (
          <Pressable
            key={seg}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(seg);
            }}
            style={styles.segmentItem}
          >
            {isActive && (
              <LinearGradient
                colors={["#6C5CE7", "#8B7CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
              {seg}
            </Text>
            {seg === "Notifications" && unreadCount > 0 && (
              <View style={styles.segmentBadge}>
                <Text style={styles.segmentBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Notification Icon ──────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  if (type === "like" || type === "post_like") {
    return <Heart color="#FF6B6B" fill="#FF6B6B" size={16} />;
  }
  if (type === "comment" || type === "post_comment") {
    return <MessageCircle color={theme.colors.primary.DEFAULT} size={16} />;
  }
  if (type === "post_approved" || type === "approval") {
    return <CheckCircle color="#55EFC4" size={16} />;
  }
  return <Bell color={theme.colors.dark.textMuted} size={16} />;
}

function getNotifIconBg(type: string): string {
  if (type === "like" || type === "post_like") return "#FF6B6B20";
  if (type === "comment" || type === "post_comment") return theme.colors.primary.DEFAULT + "20";
  if (type === "post_approved" || type === "approval") return "#55EFC420";
  return theme.colors.dark.surfaceLight;
}

function getNotifColor(type: string): string {
  if (type === "like" || type === "post_like") return "#FF6B6B";
  if (type === "comment" || type === "post_comment") return "#6C5CE7";
  if (type === "post_approved" || type === "approval") return "#55EFC4";
  return "#A29BFE";
}

// ─── Thread Card ────────────────────────────────────────────────

const ThreadCard = memo(function ThreadCard({ item, index }: { item: { post: any; comments: any[] }; index: number }) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index * 60, 400)).springify()}>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[styles.threadCard, cardStyle]}
      >
        <LinearGradient
          colors={["#1E1E3A", "#16162A"]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Left accent strip */}
        <View style={styles.threadAccentStrip} />

        <View style={styles.threadContent}>
          {/* Post Context */}
          <View style={styles.threadHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.threadPostTitle} numberOfLines={2}>
                {item.post.title}
              </Text>
              <Text style={styles.threadPostAuthor}>
                by {item.post.profiles?.full_name || "Unknown"}
              </Text>
            </View>
            <View style={styles.commentCountBadge}>
              <MessageCircle color={theme.colors.primary.light} size={12} />
              <Text style={styles.commentCountText}>{item.comments.length}</Text>
            </View>
          </View>

          {/* User's Comments */}
          <View style={styles.threadCommentsContainer}>
            {item.comments.slice(0, 3).map((comment: any) => (
              <View key={comment.id} style={styles.threadComment}>
                <View style={styles.threadCommentDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.threadCommentBody}>{comment.body}</Text>
                  <Text style={styles.threadCommentTime}>{getTimeAgo(comment.created_at)}</Text>
                </View>
              </View>
            ))}
            {item.comments.length > 3 && (
              <Text style={styles.threadMoreText}>+{item.comments.length - 3} more</Text>
            )}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Notification Card ──────────────────────────────────────────

const NotificationCard = memo(function NotificationCard({
  notification,
  index,
  onRead,
}: {
  notification: any;
  index: number;
  onRead: (id: string) => void;
}) {
  const scale = useSharedValue(1);
  const isUnread = !notification.read;
  const notifType = notification.type || notification.data?.type || "";
  const notifColor = getNotifColor(notifType);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index * 50, 400)).springify()}>
      <AnimatedPressable
        onPress={() => {
          if (isUnread) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRead(notification.id);
          }
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[
          styles.notifCard,
          isUnread && { borderLeftWidth: 3, borderLeftColor: notifColor },
          cardStyle,
        ]}
      >
        <LinearGradient
          colors={isUnread ? [notifColor + "14", "#16162A"] : ["#1A1A2E", "#16162A"]}
          style={StyleSheet.absoluteFillObject}
        />
        {isUnread && <View style={[styles.unreadDot, { backgroundColor: notifColor }]} />}
        <View style={[styles.notifIconBg, { backgroundColor: getNotifIconBg(notifType) }]}>
          <NotificationIcon type={notifType} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.notifTitle, isUnread && { color: "white" }]}>
            {notification.title || "Notification"}
          </Text>
          {notification.body && (
            <Text style={styles.notifBody} numberOfLines={2}>
              {notification.body}
            </Text>
          )}
          <Text style={styles.notifTime}>{getTimeAgo(notification.created_at)}</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Empty States ───────────────────────────────────────────────

function ThreadsEmpty() {
  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <LinearGradient
          colors={["#6C5CE740", "#6C5CE710"]}
          style={StyleSheet.absoluteFillObject}
        />
        <MessageCircle color={theme.colors.primary.light} size={36} />
      </View>
      <Text style={styles.emptyTitle}>No threads yet</Text>
      <Text style={styles.emptySubtitle}>
        When you comment on posts, your conversations will appear here.
      </Text>
    </Animated.View>
  );
}

function NotificationsEmpty() {
  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <LinearGradient
          colors={["#55EFC440", "#55EFC410"]}
          style={StyleSheet.absoluteFillObject}
        />
        <BellOff color="#55EFC4" size={36} />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>
        You have no notifications. They'll show up when someone interacts with your posts.
      </Text>
    </Animated.View>
  );
}

// ─── Main Threads Screen ────────────────────────────────────────

export default function ThreadsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeSegment, setActiveSegment] = useState<Segment>("My Threads");
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: commentsData,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["myComments", user?.id],
    queryFn: () => getMyComments(user!.id),
    enabled: !!user,
  });
  const comments = (commentsData?.data as any[]) || [];

  const {
    data: notifData,
    isLoading: notifLoading,
    refetch: refetchNotifs,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user,
  });
  const notifications = (notifData?.data as any[]) || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const threads = useMemo(() => {
    const grouped = comments.reduce<Record<string, { post: any; comments: any[] }>>(
      (acc, comment) => {
        const postId = comment.post_id;
        if (!postId || !comment.posts) return acc;
        if (!acc[postId]) {
          acc[postId] = { post: comment.posts, comments: [] };
        }
        acc[postId].comments.push(comment);
        return acc;
      },
      {},
    );
    return Object.values(grouped);
  }, [comments]);

  const handleMarkRead = useCallback(
    async (notifId: string) => {
      await markNotificationRead(notifId);
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    [user?.id, queryClient],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markAllNotificationsRead(user.id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  }, [user, queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeSegment === "My Threads") {
      await refetchComments();
    } else {
      await refetchNotifs();
    }
    setRefreshing(false);
  }, [activeSegment, refetchComments, refetchNotifs]);

  const renderThread = useCallback(
    ({ item, index }: { item: { post: any; comments: any[] }; index: number }) => (
      <ThreadCard item={item} index={index} />
    ),
    []
  );

  const renderNotification = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <NotificationCard notification={item} index={index} onRead={handleMarkRead} />
    ),
    [handleMarkRead]
  );

  const threadKeyExtractor = useCallback((item: { post: any }) => item.post.id, []);
  const notifKeyExtractor = useCallback((item: any) => item.id, []);

  const isLoading = activeSegment === "My Threads" ? commentsLoading : notifLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["#1A1A35", "#0F0F1A"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.screenTitle}>Activity</Text>
        <ActivityIndicator color={theme.colors.primary.DEFAULT} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <LinearGradient
        colors={["#1A1A35", "#0F0F1A", "#0F0F1A"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Orb size={220} top={-80} left={-60} color="#6C5CE7" />
      <Orb size={160} top={280} left={SCREEN_WIDTH - 80} color="#00CEC9" delay={1000} />
      <Orb size={130} top={560} left={-30} color="#FF6B6B" delay={1800} />

      <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Activity</Text>
          {activeSegment === "Notifications" && unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Segment Toggle */}
        <SegmentToggle
          active={activeSegment}
          onChange={setActiveSegment}
          unreadCount={unreadCount}
        />

        {/* Content */}
        {activeSegment === "My Threads" ? (
          threads.length === 0 ? (
            <ThreadsEmpty />
          ) : (
            <FlatList
              data={threads}
              renderItem={renderThread}
              keyExtractor={threadKeyExtractor}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary.DEFAULT}
                />
              }
              removeClippedSubviews
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          )
        ) : notifications.length === 0 ? (
          <NotificationsEmpty />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={notifKeyExtractor}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary.DEFAULT}
              />
            }
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  screenTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  markAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primary.DEFAULT + "20",
    borderWidth: 1,
    borderColor: theme.colors.primary.DEFAULT + "30",
  },
  markAllText: {
    color: theme.colors.primary.light,
    fontSize: 12,
    fontWeight: "600",
  },

  // Segments
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#1C1C32",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#6C5CE725",
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
    overflow: "hidden",
  },
  segmentText: {
    color: theme.colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "white",
    fontWeight: "700",
  },
  segmentBadge: {
    backgroundColor: theme.colors.accent.coral,
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  segmentBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  // Thread Card
  threadCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#6C5CE722",
    overflow: "hidden",
  },
  threadAccentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#6C5CE7",
  },
  threadContent: {
    padding: 16,
    paddingLeft: 20,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  threadPostTitle: {
    color: theme.colors.dark.textPrimary,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 20,
  },
  threadPostAuthor: {
    color: theme.colors.dark.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  commentCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primary.DEFAULT + "18",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary.DEFAULT + "25",
  },
  commentCountText: {
    color: theme.colors.primary.light,
    fontSize: 11,
    fontWeight: "700",
  },
  threadCommentsContainer: {
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary.DEFAULT + "35",
    paddingLeft: 12,
    gap: 10,
  },
  threadComment: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  threadCommentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.DEFAULT + "60",
    marginTop: 6,
  },
  threadCommentBody: {
    color: theme.colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  threadCommentTime: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  threadMoreText: {
    color: theme.colors.primary.light,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 14,
  },

  // Notification Card
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#6C5CE718",
    overflow: "hidden",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    color: theme.colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  notifBody: {
    color: theme.colors.dark.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  emptyTitle: {
    color: theme.colors.dark.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.colors.dark.textSecondary,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
