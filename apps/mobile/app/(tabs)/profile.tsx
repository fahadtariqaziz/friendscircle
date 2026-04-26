import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Share,
  Image,
} from "react-native";
import {
  LogOut,
  Bell,
  HelpCircle,
  ChevronRight,
  Edit3,
  X,
  Send,
  Camera,
  Share2,
  Info,
  Trash2,
  Clock,
} from "lucide-react-native";
import { theme } from "@friendscircle/ui";
import {
  LEVEL_THRESHOLDS,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_EMOJIS,
} from "@friendscircle/shared";
import { getTimeAgo } from "@friendscircle/shared";
import {
  signOut,
  deleteAccount,
  getProfile,
  getMyPosts,
  getMyComments,
  createReport,
  updateProfile,
  uploadImage,
  getUniversities,
  getCampuses,
  deletePost,
} from "@friendscircle/supabase";
import * as Notifications from "expo-notifications";
import { registerForPushNotifications } from "../../lib/notifications";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../_layout";
import { useState, useEffect, useCallback, Fragment } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Constants ───────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  Freshman: "#B0B0CC",
  Sophomore: "#55EFC4",
  Junior: "#6C5CE7",
  Senior: "#FDCB6E",
  Alumni: "#FF6B6B",
  Legend: "#A29BFE",
};

const LEVEL_ICONS: Record<string, string> = {
  Freshman: "\u{1F331}",
  Sophomore: "\u{1F33F}",
  Junior: "\u26A1",
  Senior: "\u{1F525}",
  Alumni: "\u{1F451}",
  Legend: "\u{1F48E}",
};

const LEVELS_ARRAY = ["Freshman", "Sophomore", "Junior", "Senior", "Alumni", "Legend"];
const LEVELS_SHORT = ["Fr", "So", "Jr", "Se", "Al", "Le"];

const INTEREST_COLORS = [
  "#6C5CE7", "#00CEC9", "#FF6B6B", "#FDCB6E", "#55EFC4", "#A29BFE",
];

const PRESET_INTERESTS = [
  "Coding", "Sports", "Music", "Art", "Gaming", "Photography",
  "Travel", "Reading", "Cooking", "Fitness", "Movies", "Anime",
  "Business", "Design", "Writing", "Science", "Fashion", "Cricket",
];

const POST_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#55EFC420", text: "#55EFC4" },
  pending: { bg: "#FDCB6E20", text: "#FDCB6E" },
  rejected: { bg: "#FF6B6B20", text: "#FF6B6B" },
};

const POST_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  olx:             { emoji: "🛍️", label: "Student OLX",          color: "#FDCB6E" },
  books:           { emoji: "📚", label: "Books",                 color: "#00CEC9" },
  lost_found:      { emoji: "🔎", label: "Lost & Found",          color: "#FF6B6B" },
  teacher_review:  { emoji: "⭐", label: "Teacher Review",        color: "#FDCB6E" },
  past_paper:      { emoji: "📄", label: "Past Paper",            color: "#A29BFE" },
  roommate:        { emoji: "🏠", label: "Roommate",              color: "#00CEC9" },
  ride_share:      { emoji: "🚗", label: "Ride Share",            color: "#55EFC4" },
  freelance:       { emoji: "💼", label: "Freelance Assignment",  color: "#6C5CE7" },
  job:             { emoji: "💰", label: "Job",                   color: "#55EFC4" },
  event:           { emoji: "🎉", label: "Event",                 color: "#FF6B6B" },
  memory:          { emoji: "📸", label: "Memory",                color: "#FDCB6E" },
  friend_circle:   { emoji: "👥", label: "Friend Circle",         color: "#A29BFE" },
};

function getExpiryInfo(expiresAt: string | null): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Expired", urgent: true };
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return { label: "Expires today", urgent: true };
  if (days === 1) return { label: "1 day left", urgent: true };
  if (days <= 7) return { label: `${days}d left`, urgent: true };
  return { label: `${days}d left`, urgent: false };
}

// ─── Floating Particle (header) ──────────────────────────────────

function FloatingParticle({ size, left, delay, color }: {
  size: number; left: number; delay: number; color: string;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(0.25, { duration: 1500 });
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        withTiming(20, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
    translateX.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-15, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      left: `${left}%` as any,
      top: 30 + delay * 15,
    }, style]} />
  );
}

// ─── Page Background Orb ─────────────────────────────────────────

function Orb({ size, top, left, color, delay = 0 }: {
  size: number; top: number; left: number; color: string; delay?: number;
}) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
          withTiming(16, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      ),
    );
  }, []);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left, opacity: 0.16 }, orbStyle]}
    />
  );
}

// ─── Stat Card ───────────────────────────────────────────────────

function StatCard({ emoji, value, label, color, delay }: {
  emoji: string; value: number; label: string; color: string; delay: number;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={{ flex: 1 }}>
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.93, { duration: 100 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }}
      >
        <Animated.View style={[styles.statCard, cardStyle]}>
          <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.statAccentBar, { backgroundColor: color }]} />
          <View style={styles.statInner}>
            <View style={[styles.statEmojiBox, { backgroundColor: color + "18" }]}>
              <Text style={{ fontSize: 18 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={[styles.statLabel, { color }]} numberOfLines={1}>{label}</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Level Journey Dots ──────────────────────────────────────────

function LevelJourney({ currentLevel }: { currentLevel: string }) {
  const currentIdx = LEVELS_ARRAY.indexOf(currentLevel);

  return (
    <View style={styles.journeyRow}>
      {LEVELS_ARRAY.map((lvl, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const color = LEVEL_COLORS[lvl];
        return (
          <Fragment key={lvl}>
            <View style={styles.journeyStop}>
              <View style={[
                styles.journeyDot,
                (isPast || isCurrent) && { backgroundColor: color },
                isCurrent && styles.journeyDotCurrent,
              ]} />
              <Text style={[
                styles.journeyLabel,
                { color: isPast ? color + "80" : isCurrent ? color : "#3D3D5A" },
                isCurrent && { fontWeight: "700" },
              ]}>
                {LEVELS_SHORT[i]}
              </Text>
            </View>
            {i < LEVELS_ARRAY.length - 1 && (
              <View style={[styles.journeyLine, { backgroundColor: isPast ? color + "50" : "#2D2D4A" }]} />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

// ─── Animated Progress Bar with Shimmer ─────────────────────────

function AnimatedProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = useSharedValue(0);
  const shimmerX = useSharedValue(-100);

  useEffect(() => {
    width.value = withTiming(Math.min(progress, 100), { duration: 1000, easing: Easing.out(Easing.cubic) });
    shimmerX.value = withDelay(800, withRepeat(
      withTiming(320, { duration: 2000, easing: Easing.linear }),
      -1, false,
    ));
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fillStyle]}>
        <LinearGradient
          colors={[color, color + "90"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.progressShimmer, shimmerStyle]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.22)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Profile Checklist ───────────────────────────────────────────

function ProfileChecklist({ profile, onEdit }: { profile: any; onEdit: () => void }) {
  const tasks = [
    { label: "Add your name", done: !!profile?.full_name, xp: 5 },
    { label: "Upload a photo", done: !!profile?.avatar_url, xp: 10 },
    { label: "Add your university", done: !!profile?.university_id, xp: 10 },
    { label: "Write a bio", done: !!profile?.bio?.trim(), xp: 10 },
    { label: "Pick 3+ interests", done: (profile?.interests?.length || 0) >= 3, xp: 15 },
  ];
  const completed = tasks.filter((t) => t.done).length;
  const earnedXP = tasks.filter((t) => t.done).reduce((s, t) => s + t.xp, 0);
  const progress = (completed / tasks.length) * 100;

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.checklistCard}>
      <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.checklistHeader}>
        <View>
          <Text style={styles.checklistTitle}>Complete Your Profile</Text>
          <Text style={styles.checklistSub}>
            {completed}/{tasks.length} done · <Text style={{ color: "#FDCB6E" }}>+{earnedXP} XP earned</Text>
          </Text>
        </View>
        <Text style={{ fontSize: 26 }}>🎯</Text>
      </View>

      {/* Mini progress bar */}
      <View style={styles.checklistTrack}>
        <View style={[styles.checklistFill, { width: `${progress}%` }]}>
          <LinearGradient colors={["#6C5CE7", "#A29BFE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
        </View>
      </View>

      {tasks.map((task, i) => (
        <Pressable key={task.label} onPress={onEdit} style={[styles.checklistItem, i < tasks.length - 1 && styles.checklistDivider]}>
          <View style={[styles.checklistCheck, task.done && styles.checklistCheckDone]}>
            {task.done && <Text style={{ fontSize: 10, color: "#55EFC4" }}>✓</Text>}
          </View>
          <Text style={[styles.checklistLabel, task.done && styles.checklistLabelDone]}>{task.label}</Text>
          <View style={[styles.xpChip, { backgroundColor: task.done ? "#55EFC418" : "#ffffff10" }]}>
            <Text style={[styles.xpChipText, { color: task.done ? "#55EFC4" : theme.colors.dark.textMuted }]}>
              +{task.xp} XP
            </Text>
          </View>
        </Pressable>
      ))}
    </Animated.View>
  );
}

// ─── Interest Chips ──────────────────────────────────────────────

function InterestChips({ interests }: { interests: string[] }) {
  if (!interests || interests.length === 0) return null;
  return (
    <Animated.View entering={FadeInUp.delay(320).springify()} style={{ marginTop: 20 }}>
      <View style={styles.sectionLabelRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>INTERESTS</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {interests.map((interest, i) => {
          const color = INTEREST_COLORS[i % INTEREST_COLORS.length];
          return (
            <View key={interest} style={[styles.chip, { backgroundColor: color + "18", borderColor: color + "35" }]}>
              <Text style={[styles.chipText, { color }]}>{interest}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────

function DeleteConfirmModal({
  visible,
  title,
  onCancel,
  onDelete,
  deleting,
}: {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={deleteModalStyles.overlay}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={deleteModalStyles.card}>
          <LinearGradient colors={["#1E1E3A", "#141430"]} style={StyleSheet.absoluteFillObject} />
          <View style={deleteModalStyles.iconWrap}>
            <Trash2 color="#FF6B6B" size={28} />
          </View>
          <Text style={deleteModalStyles.title}>Delete Post</Text>
          <Text style={deleteModalStyles.desc}>
            Delete "<Text style={{ color: "#fff", fontWeight: "600" }}>{title}</Text>"?{"\n"}This cannot be undone.
          </Text>
          <View style={deleteModalStyles.btnRow}>
            <Pressable onPress={onCancel} style={deleteModalStyles.cancelBtn} disabled={deleting}>
              <Text style={deleteModalStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={deleteModalStyles.deleteBtn} disabled={deleting}>
              <LinearGradient colors={["#FF6B6B", "#FF4757"]} style={deleteModalStyles.deleteBtnInner}>
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={deleteModalStyles.deleteText}>Delete</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const deleteModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A45",
    overflow: "hidden",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B6B15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  desc: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1A1A30",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A45",
  },
  cancelText: {
    color: "#999",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  deleteBtnInner: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  deleteText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

// ─── My Posts Section ────────────────────────────────────────────

function MyPostsSection({ posts, userId, onDeleted }: {
  posts: any[];
  userId: string;
  onDeleted: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const displayPosts = expanded ? posts : posts.slice(0, 5);

  const handleDelete = (post: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteTarget(post);
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const { error } = await deletePost(deleteTarget.id);
    setDeletingId(null);
    setDeleteTarget(null);
    if (error) {
      Alert.alert("Error", "Could not delete post. Try again.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDeleted();
    }
  }, [deleteTarget, onDeleted]);

  if (!posts || posts.length === 0) {
    return (
      <Animated.View entering={FadeInUp.delay(370).springify()} style={{ marginHorizontal: 16, marginTop: 20 }}>
        <View style={styles.sectionLabelRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionLabel}>MY POSTS</Text>
        </View>
        <View style={[styles.activityCard, { alignItems: "center", padding: 32 }]}>
          <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
          <Text style={{ fontSize: 32, marginBottom: 10 }}>📭</Text>
          <Text style={{ color: "#555", fontSize: 13, textAlign: "center" }}>
            You haven't posted anything yet.{"\n"}Your posts will appear here.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(370).springify()} style={{ marginHorizontal: 16, marginTop: 20 }}>
      <View style={[styles.sectionLabelRow, { justifyContent: "space-between" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionLabel}>MY POSTS ({posts.length})</Text>
        </View>
        <Text style={{ color: "#555", fontSize: 10 }}>⏱ Posts auto-delete after 30 days</Text>
      </View>
      <View style={styles.activityCard}>
        <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
        {displayPosts.map((post, idx) => {
          const statusConfig = POST_STATUS_COLORS[post.status] || POST_STATUS_COLORS.pending;
          const typeMeta = POST_TYPE_META[post.post_type] || { emoji: "📝", label: post.post_type, color: "#6C5CE7" };
          const expiry = getExpiryInfo(post.expires_at);
          const isDeleting = deletingId === post.id;
          return (
            <View key={post.id} style={[styles.myPostItem, idx < displayPosts.length - 1 && styles.activityDivider]}>
              {/* Type emoji bubble */}
              <View style={[styles.myPostTypeBubble, { backgroundColor: typeMeta.color + "18" }]}>
                <Text style={{ fontSize: 16 }}>{typeMeta.emoji}</Text>
              </View>
              {/* Content */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.activityTitle} numberOfLines={1}>{post.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                  <Text style={[styles.activityMeta, { color: typeMeta.color + "AA" }]}>{typeMeta.label}</Text>
                  <Text style={styles.activityMeta}>·</Text>
                  <Text style={styles.activityMeta}>{getTimeAgo(post.created_at)}</Text>
                  {expiry && (
                    <>
                      <Text style={styles.activityMeta}>·</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Clock color={expiry.urgent ? "#FF6B6B" : "#555"} size={10} />
                        <Text style={[styles.activityMeta, expiry.urgent && { color: "#FF6B6B" }]}>
                          {expiry.label}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              {/* Status + Delete */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.statusText, { color: statusConfig.text }]}>{post.status}</Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(post)}
                  disabled={isDeleting}
                  style={styles.myPostDeleteBtn}
                >
                  {isDeleting
                    ? <ActivityIndicator color="#FF6B6B" size="small" />
                    : <Trash2 color="#FF6B6B" size={15} />}
                </Pressable>
              </View>
            </View>
          );
        })}
        {/* Show more / show less */}
        {posts.length > 5 && (
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.myPostShowMore}>
            <Text style={styles.myPostShowMoreText}>
              {expanded ? "Show less" : `Show ${posts.length - 5} more posts`}
            </Text>
          </Pressable>
        )}
      </View>
      <DeleteConfirmModal
        visible={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onCancel={() => setDeleteTarget(null)}
        onDelete={confirmDelete}
        deleting={!!deletingId}
      />
    </Animated.View>
  );
}

// ─── Share Modal ─────────────────────────────────────────────────

function ShareModal({ visible, profile, postsCount, commentsCount, onClose }: {
  visible: boolean;
  profile: any;
  postsCount: number;
  commentsCount: number;
  onClose: () => void;
}) {
  const levelColor = LEVEL_COLORS[profile?.level || "Freshman"] || LEVEL_COLORS.Freshman;
  const levelIcon = LEVEL_ICONS[profile?.level || "Freshman"] || LEVEL_ICONS.Freshman;
  const [sharing, setSharing] = useState(false);

  const handleShareProfile = async () => {
    setSharing(true);
    try {
      const profileUrl = `https://friendscircle.app/profile/${profile?.id}`;
      const name = profile?.full_name || "A student";

      await Share.share({
        title: `${name} on FriendsCircle`,
        // message is used on Android (URL embedded in text for link preview)
        // url is used on iOS (shared as link with OG preview)
        message: `${name} is on FriendsCircle \u2013 Pakistan's university platform!\n\n${profileUrl}`,
        url: profileUrl,
      });
    } catch {
      // dismissed
    }
    setSharing(false);
  };

  const handleShareApp = async () => {
    setSharing(true);
    try {
      const appUrl = "https://friendscircle.app/invite";

      await Share.share({
        title: "Join FriendsCircle!",
        message:
          `Join me on FriendsCircle \u2013 Pakistan's #1 university social platform!\n\n` +
          `\u2705 Rate professors\n` +
          `\u2705 Student OLX & Books\n` +
          `\u2705 Find roommates & rides\n` +
          `\u2705 Past papers & study help\n\n` +
          appUrl,
        url: appUrl,
      });
    } catch {
      // dismissed
    }
    setSharing(false);
  };

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
        {/* Header */}
        <LinearGradient colors={["#1A1235", "#0F0F1A"]} style={styles.shareModalHeader}>
          <Text style={styles.shareModalTitle}>Share</Text>
          <Pressable onPress={onClose} style={styles.shareModalClose}>
            <X color="#666" size={20} />
          </Pressable>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
          {/* ── Profile preview card ── */}
          <View>
            <Text style={styles.shareOptionLabel}>PROFILE CARD PREVIEW</Text>
            <View style={styles.sharePreviewCard}>
              <LinearGradient
                colors={[levelColor + "25", "#1A1A32", "#121220"]}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Brand */}
              <View style={styles.sharePreviewBrand}>
                <Text style={{ fontSize: 16 }}>🎓</Text>
                <Text style={styles.sharePreviewBrandText}>FriendsCircle</Text>
              </View>
              {/* Profile */}
              <View style={styles.sharePreviewProfile}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.sharePreviewAvatar} />
                ) : (
                  <LinearGradient colors={[levelColor, levelColor + "70"]} style={styles.sharePreviewAvatar}>
                    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{initials}</Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.sharePreviewName} numberOfLines={1}>
                    {profile?.full_name || "Your Name"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <View style={[styles.sharePreviewLevelBadge, { backgroundColor: levelColor + "25", borderColor: levelColor + "50" }]}>
                      <Text style={{ fontSize: 12 }}>{levelIcon}</Text>
                      <Text style={[styles.sharePreviewLevel, { color: levelColor }]}>{profile?.level || "Freshman"}</Text>
                    </View>
                    {profile?.universities?.short_name && (
                      <Text style={styles.sharePreviewUni}>🏫 {profile.universities.short_name}</Text>
                    )}
                  </View>
                </View>
              </View>
              {profile?.bio ? (
                <Text style={styles.sharePreviewBio} numberOfLines={2}>"{profile.bio}"</Text>
              ) : null}
              <View style={styles.sharePreviewStats}>
                {[
                  { label: "Posts", val: postsCount, emoji: "📝" },
                  { label: "Comments", val: commentsCount, emoji: "💬" },
                  { label: "XP", val: profile?.points || 0, emoji: "⚡" },
                ].map((s) => (
                  <View key={s.label} style={styles.sharePreviewStat}>
                    <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                    <Text style={styles.sharePreviewStatNum}>{s.val}</Text>
                    <Text style={styles.sharePreviewStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Share options ── */}
          <View style={{ gap: 12 }}>
            <Text style={styles.shareOptionLabel}>SHARE OPTIONS</Text>

            {/* Share Profile */}
            <Pressable onPress={handleShareProfile} disabled={sharing} style={styles.shareOptionBtn}>
              <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={StyleSheet.absoluteFillObject} />
              <View style={styles.shareOptionIcon}>
                <Text style={{ fontSize: 22 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareOptionTitle}>Share My Profile</Text>
                <Text style={styles.shareOptionSub}>Send your profile card to friends</Text>
              </View>
              <Share2 color="rgba(255,255,255,0.7)" size={18} />
            </Pressable>

            {/* Share App */}
            <Pressable onPress={handleShareApp} disabled={sharing} style={styles.shareOptionBtnOutline}>
              <View style={styles.shareOptionIcon}>
                <Text style={{ fontSize: 22 }}>🎓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.shareOptionTitle, { color: "#A29BFE" }]}>Share the App</Text>
                <Text style={styles.shareOptionSub}>Invite friends to join FriendsCircle</Text>
              </View>
              <Share2 color="#6C5CE7" size={18} />
            </Pressable>
          </View>

          {/* Platform hint */}
          <View style={styles.sharePlatformRow}>
            {["WhatsApp", "Instagram", "Twitter", "Telegram"].map((p, i) => (
              <View key={p} style={styles.sharePlatformChip}>
                <Text style={styles.sharePlatformText}>{p}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.shareHintText}>Works with WhatsApp, Instagram, and any app on your phone</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── About Modal ──────────────────────────────────────────────────

const APP_FEATURES = [
  { emoji: "⭐", label: "Teacher Reviews", desc: "Rate professors honestly" },
  { emoji: "🛒", label: "Student OLX", desc: "Buy & sell on campus" },
  { emoji: "🔍", label: "Lost & Found", desc: "Never lose anything again" },
  { emoji: "🚗", label: "Ride Share", desc: "Split rides with students" },
  { emoji: "🏠", label: "Roommate Finder", desc: "Find your perfect match" },
  { emoji: "📅", label: "Campus Events", desc: "Never miss a moment" },
  { emoji: "📄", label: "Past Papers", desc: "Ace your exams" },
  { emoji: "👥", label: "Friend Circles", desc: "Build your inner squad" },
];

// ─── Delete Account Modal ─────────────────────────────────────────

function DeleteAccountModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Final Confirmation",
      "This is irreversible. All your posts, comments, likes, and profile data will be permanently erased.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete Everything",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { error } = await deleteAccount();
            setDeleting(false);
            if (error) {
              Alert.alert("Error", "Failed to delete account. Please try again or contact support@friendscircle.app");
            } else {
              onClose();
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
        {/* Header */}
        <LinearGradient colors={["#2A1020", "#1A1235", "#0F0F1A"]} style={{ paddingTop: 20, paddingBottom: 32, alignItems: "center" }}>
          <Pressable onPress={onClose} style={styles.aboutCloseBtn}>
            <X color="#666" size={20} />
          </Pressable>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#FF475718", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "#FF475730" }}>
            <Text style={{ fontSize: 38 }}>⚠️</Text>
          </View>
          <Text style={{ color: "#FF4757", fontSize: 22, fontWeight: "800", marginBottom: 6 }}>Delete Account</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", paddingHorizontal: 40 }}>
            Please read carefully before proceeding
          </Text>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* What will be deleted */}
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 12 }}>WHAT WILL BE DELETED</Text>
          <View style={{ backgroundColor: "#1E1E3A", borderRadius: 16, borderWidth: 1, borderColor: "#FF475715", overflow: "hidden", marginBottom: 24 }}>
            <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
            {[
              { emoji: "📝", text: "All your posts and memories" },
              { emoji: "💬", text: "All your comments" },
              { emoji: "❤️", text: "All your likes" },
              { emoji: "👤", text: "Your profile and avatar" },
              { emoji: "⚡", text: "Your XP and level progress" },
              { emoji: "🔔", text: "Your notification history" },
            ].map((item, i, arr) => (
              <View key={item.text} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: "#ffffff0A" }}>
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Warning card */}
          <View style={{ backgroundColor: "#FF475710", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#FF475720", marginBottom: 32 }}>
            <Text style={{ color: "#FF6B6B", fontSize: 14, fontWeight: "600", marginBottom: 4 }}>This action cannot be undone</Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 20 }}>
              Once your account is deleted, there is no way to recover your data. If you're having issues, consider reaching out to our support team first.
            </Text>
          </View>

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={{ backgroundColor: "#FF4757", borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: deleting ? 0.6 : 1 }}
            accessibilityRole="button"
            accessibilityLabel="Delete my account permanently"
          >
            {deleting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Trash2 color="#fff" size={18} />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Delete My Account</Text>
              </>
            )}
          </Pressable>

          {/* Cancel link */}
          <Pressable onPress={onClose} style={{ alignItems: "center", marginTop: 16, paddingVertical: 12 }}>
            <Text style={{ color: theme.colors.primary.light, fontSize: 15, fontWeight: "600" }}>Keep My Account</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── About Modal ─────────────────────────────────────────────────

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Hero ── */}
          <LinearGradient colors={["#2D1B5A", "#1A1235", "#0F0F1A"]} style={styles.aboutHero}>
            <Pressable onPress={onClose} style={styles.aboutCloseBtn}>
              <X color="#666" size={20} />
            </Pressable>
            <View style={styles.aboutLogoWrap}>
              <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={styles.aboutLogo}>
                <Text style={{ fontSize: 44 }}>🎓</Text>
              </LinearGradient>
            </View>
            <Text style={styles.aboutAppName}>FriendsCircle</Text>
            <Text style={styles.aboutTagline}>Pakistan's University Social Platform</Text>
            <View style={styles.aboutVersionBadge}>
              <Text style={styles.aboutVersionText}>Version 1.0.0 · Beta</Text>
            </View>
          </LinearGradient>

          {/* ── Stats ── */}
          <View style={styles.aboutStatsRow}>
            {[
              { num: "15+", label: "Universities" },
              { num: "gradually growing", label: "Students" },
              { num: "gradually growing", label: "Posts" },
            ].map((s) => (
              <View key={s.label} style={styles.aboutStatItem}>
                <Text style={styles.aboutStatNum}>{s.num}</Text>
                <Text style={styles.aboutStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Features ── */}
          <View style={{ padding: 20 }}>
            <Text style={styles.aboutSectionTitle}>WHAT YOU CAN DO</Text>
            <View style={styles.aboutFeaturesGrid}>
              {APP_FEATURES.map((f) => (
                <View key={f.label} style={styles.aboutFeatureCard}>
                  <LinearGradient colors={["#1E1E3A", "#14142A"]} style={StyleSheet.absoluteFillObject} />
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>{f.emoji}</Text>
                  <Text style={styles.aboutFeatureTitle}>{f.label}</Text>
                  <Text style={styles.aboutFeatureDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Mission ── */}
          <View style={styles.aboutMissionCard}>
            <LinearGradient colors={["#6C5CE715", "#00CEC910"]} style={StyleSheet.absoluteFillObject} />
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🇵🇰</Text>
            <Text style={styles.aboutMissionTitle}>Built for Pakistani Students</Text>
            <Text style={styles.aboutMissionText}>
              FriendsCircle was built to connect university students across Pakistan — to make campus life easier, more social, and more rewarding. Every feature is designed around real student needs.
            </Text>
          </View>

          {/* ── Made with love ── */}
          <View style={{ alignItems: "center", paddingVertical: 32, paddingBottom: 50 }}>
            <Text style={styles.aboutMadeWith}>Made with ❤️ in Pakistan</Text>
            <Text style={styles.aboutCopyright}>© 2026 FriendsCircle. All rights reserved.</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Help & Support Modal ─────────────────────────────────────────

const FAQ_ITEMS = [
  { q: "How do I earn XP?", a: "Create posts, leave comments, and get likes. Each action rewards XP that levels you up!" },
  { q: "Why is my post pending?", a: "All posts are reviewed by admins before going live. This usually takes a few minutes." },
  { q: "How do I change my university?", a: "Go to Edit Profile and type your university name in the University field." },
  { q: "Can I delete my account?", a: "Yes — go to your Profile, scroll to Support, and tap 'Delete Account'. This will permanently remove all your data." },
];

function HelpSupportModal({ visible, userId, onClose }: {
  visible: boolean;
  userId: string;
  onClose: () => void;
}) {
  const [feedbackCategory, setFeedbackCategory] = useState("bug");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!userId || !feedbackSubject.trim() || !feedbackDescription.trim()) {
      Alert.alert("Missing fields", "Please fill in both subject and description.");
      return;
    }
    setSubmitting(true);
    const { error } = await createReport({
      user_id: userId,
      category: feedbackCategory,
      subject: feedbackSubject.trim(),
      description: feedbackDescription.trim(),
    });
    setSubmitting(false);
    if (error) {
      Alert.alert("Error", "Failed to submit. Please try again.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Submitted! 🎉", "Thanks for your feedback. We'll review it soon.");
      setFeedbackSubject("");
      setFeedbackDescription("");
      setFeedbackCategory("bug");
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0F0F1A" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <LinearGradient colors={["#00CEC920", "#0F0F1A"]} style={styles.helpHeader}>
            <Pressable onPress={onClose} style={styles.aboutCloseBtn}>
              <X color="#666" size={20} />
            </Pressable>
            <View style={styles.helpHeaderIcon}>
              <Text style={{ fontSize: 36 }}>🛟</Text>
            </View>
            <Text style={styles.helpHeaderTitle}>Help & Support</Text>
            <Text style={styles.helpHeaderSub}>We're here to help. Find answers or send us a message.</Text>
          </LinearGradient>

          {/* ── Quick FAQs ── */}
          <View style={{ padding: 20 }}>
            <Text style={styles.aboutSectionTitle}>FREQUENTLY ASKED</Text>
            <View style={styles.faqList}>
              {FAQ_ITEMS.map((item, i) => (
                <View key={i}>
                  <Pressable
                    onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    style={[styles.faqItem, expandedFaq === i && styles.faqItemOpen]}
                  >
                    <LinearGradient colors={["#1C1C35", "#141428"]} style={StyleSheet.absoluteFillObject} />
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Text style={{ color: "#555", fontSize: 16 }}>{expandedFaq === i ? "−" : "+"}</Text>
                  </Pressable>
                  {expandedFaq === i && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{item.a}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* ── Send feedback ── */}
            <Text style={[styles.aboutSectionTitle, { marginTop: 24 }]}>SEND FEEDBACK</Text>

            {/* Category */}
            <View style={styles.helpCategoryRow}>
              {REPORT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setFeedbackCategory(cat)}
                  style={[styles.helpCategoryChip, feedbackCategory === cat && styles.helpCategoryChipActive]}
                >
                  <Text style={{ fontSize: 16 }}>{REPORT_CATEGORY_EMOJIS[cat]}</Text>
                  <Text style={[styles.helpCategoryText, feedbackCategory === cat && styles.helpCategoryTextActive]}>
                    {REPORT_CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Subject */}
            <Text style={styles.helpInputLabel}>Subject</Text>
            <TextInput
              placeholder="Brief summary of your issue"
              placeholderTextColor="#444"
              value={feedbackSubject}
              onChangeText={setFeedbackSubject}
              maxLength={100}
              style={styles.helpInput}
            />

            {/* Description */}
            <Text style={styles.helpInputLabel}>Description</Text>
            <TextInput
              placeholder="Tell us more in detail..."
              placeholderTextColor="#444"
              value={feedbackDescription}
              onChangeText={setFeedbackDescription}
              multiline
              maxLength={1000}
              style={[styles.helpInput, { minHeight: 120, textAlignVertical: "top" }]}
            />
            <Text style={styles.helpCharCount}>{feedbackDescription.length}/1000</Text>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!feedbackSubject.trim() || !feedbackDescription.trim() || submitting}
            >
              <LinearGradient
                colors={feedbackSubject.trim() && feedbackDescription.trim() && !submitting
                  ? ["#00CEC9", "#00B5B0"]
                  : ["#1C1C32", "#1C1C32"]}
                style={styles.helpSubmitBtn}
              >
                {submitting
                  ? <ActivityIndicator color="white" size="small" />
                  : <Send color="white" size={18} />}
                <Text style={styles.helpSubmitText}>{submitting ? "Submitting..." : "Submit Feedback"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Edit Profile Modal ──────────────────────────────────────────

function EditProfileModal({ visible, profile, userId, onClose }: {
  visible: boolean; profile: any; userId: string; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
  const [universityText, setUniversityText] = useState(profile?.universities?.name || profile?.universities?.short_name || "");
  const [campusText, setCampusText] = useState(profile?.campuses?.name || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: uniData } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    enabled: visible,
  });
  const universities = (uniData?.data as any[]) || [];

  useEffect(() => {
    if (visible) {
      setFullName(profile?.full_name || "");
      setBio(profile?.bio || "");
      setSelectedInterests(profile?.interests || []);
      setAvatarUri(profile?.avatar_url || null);
      setUniversityText(profile?.universities?.name || profile?.universities?.short_name || "");
      setCampusText(profile?.campuses?.name || "");
    }
  }, [visible, profile]);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileObj = { uri: asset.uri, name: `avatar_${Date.now()}.jpg`, type: "image/jpeg" } as unknown as File;
      const uploadResult = await uploadImage(fileObj, "avatars");
      setAvatarUri(uploadResult.secure_url);
    } catch {
      Alert.alert("Upload Failed", "Could not upload avatar.");
    }
    setUploadingAvatar(false);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : prev.length < 8 ? [...prev, interest] : prev,
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, any> = {};
    if (fullName.trim()) updates.full_name = fullName.trim();
    if (bio.trim() !== (profile?.bio || "")) updates.bio = bio.trim();
    if (avatarUri !== profile?.avatar_url) updates.avatar_url = avatarUri;
    if (universityText.trim()) {
      const q = universityText.trim().toLowerCase();
      const matched = universities.find(
        (u: any) => u.name.toLowerCase() === q || u.short_name.toLowerCase() === q || u.name.toLowerCase().includes(q) || u.short_name.toLowerCase().includes(q),
      );
      if (matched && matched.id !== profile?.university_id) {
        updates.university_id = matched.id;
        if (campusText.trim()) {
          const { data: campusList } = await getCampuses(matched.id);
          const cq = campusText.trim().toLowerCase();
          const matchedCampus = (campusList || []).find(
            (c: any) => c.name.toLowerCase() === cq || c.name.toLowerCase().includes(cq),
          );
          if (matchedCampus) updates.campus_id = matchedCampus.id;
        }
      }
    }
    if (JSON.stringify(selectedInterests) !== JSON.stringify(profile?.interests || [])) {
      updates.interests = selectedInterests;
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await updateProfile(userId, updates);
      if (error) {
        Alert.alert("Error", "Failed to update profile.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        onClose();
      }
    } else {
      onClose();
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0F0F1A" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <LinearGradient colors={["#1A1235", "#0F0F1A"]} style={styles.shareModalHeader}>
          <Text style={styles.shareModalTitle}>Edit Profile</Text>
          <Pressable onPress={onClose} style={styles.shareModalClose}>
            <X color="#666" size={20} />
          </Pressable>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Avatar ── */}
          <View style={styles.editAvatarSection}>
            <Pressable onPress={handlePickAvatar} style={styles.editAvatarWrap}>
              <View style={styles.editAvatarRing}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.editAvatarImg} />
                ) : (
                  <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={styles.editAvatarImg}>
                    <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>{fullName?.[0]?.toUpperCase() || "?"}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.editCameraBtn}>
                {uploadingAvatar ? <ActivityIndicator color="white" size="small" /> : <Camera color="white" size={16} />}
              </View>
            </Pressable>
            <Text style={styles.editAvatarHint}>Tap to change photo</Text>
          </View>

          <View style={{ paddingHorizontal: 16 }}>

            {/* ── Personal Info Card ── */}
            <View style={styles.editSectionLabel}>
              <View style={styles.editSectionDot} />
              <Text style={styles.editSectionLabelText}>PERSONAL INFO</Text>
            </View>
            <View style={styles.editCard}>
              <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
              <View style={styles.editFieldWrap}>
                <Text style={styles.editFieldLabel}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor="#3D3D5A"
                  style={styles.editFieldInput}
                  maxLength={50}
                />
              </View>
              <View style={styles.editFieldDivider} />
              <View style={styles.editFieldWrap}>
                <Text style={styles.editFieldLabel}>Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#3D3D5A"
                  multiline
                  maxLength={200}
                  style={[styles.editFieldInput, { minHeight: 68, textAlignVertical: "top" }]}
                />
                <Text style={styles.editFieldCount}>{bio.length}/200</Text>
              </View>
            </View>

            {/* ── Campus Card ── */}
            <View style={[styles.editSectionLabel, { marginTop: 20 }]}>
              <View style={styles.editSectionDot} />
              <Text style={styles.editSectionLabelText}>CAMPUS</Text>
            </View>
            <View style={styles.editCard}>
              <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
              <View style={styles.editFieldWrap}>
                <Text style={styles.editFieldLabel}>University</Text>
                <TextInput
                  value={universityText}
                  onChangeText={setUniversityText}
                  placeholder="e.g. NUST, LUMS, FAST..."
                  placeholderTextColor="#3D3D5A"
                  style={styles.editFieldInput}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.editFieldDivider} />
              <View style={styles.editFieldWrap}>
                <Text style={styles.editFieldLabel}>Campus</Text>
                <TextInput
                  value={campusText}
                  onChangeText={setCampusText}
                  placeholder="e.g. Main Campus, Islamabad..."
                  placeholderTextColor="#3D3D5A"
                  style={styles.editFieldInput}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* ── Interests ── */}
            <View style={[styles.editSectionLabel, { marginTop: 20 }]}>
              <View style={styles.editSectionDot} />
              <Text style={styles.editSectionLabelText}>INTERESTS ({selectedInterests.length}/8)</Text>
            </View>
            <View style={styles.editInterestGrid}>
              {PRESET_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[styles.editInterestChip, isSelected && styles.editInterestChipActive]}
                  >
                    {isSelected && (
                      <LinearGradient colors={["#6C5CE740", "#8B7CF620"]} style={StyleSheet.absoluteFillObject} />
                    )}
                    <Text style={[styles.editInterestText, isSelected && styles.editInterestTextActive]}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Save ── */}
            <Pressable onPress={handleSave} disabled={saving} style={{ marginTop: 28, marginBottom: 12 }}>
              <LinearGradient
                colors={saving ? ["#1C1C32", "#1C1C32"] : ["#6C5CE7", "#8B7CF6"]}
                style={styles.editSaveBtn}
              >
                {saving && <ActivityIndicator color="white" size="small" />}
                <Text style={styles.editSaveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Profile Screen ──────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });
  const { data: postsData } = useQuery({
    queryKey: ["myPosts", user?.id],
    queryFn: () => getMyPosts(user!.id),
    enabled: !!user,
  });
  const { data: commentsData } = useQuery({
    queryKey: ["myComments", user?.id],
    queryFn: () => getMyComments(user!.id),
    enabled: !!user,
  });

  const profile = profileData?.data as any;
  const university = profile?.universities;
  const campus = profile?.campuses;
  const level = profile?.level || "Freshman";
  const points = profile?.points || 0;
  const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS.Freshman;
  const levelIcon = LEVEL_ICONS[level] || LEVEL_ICONS.Freshman;
  const myPosts = (postsData?.data as any[]) || [];
  const postsCount = myPosts.length;
  const commentsCount = (commentsData?.data as any[])?.length || 0;

  const thresholds = Object.entries(LEVEL_THRESHOLDS);
  const currentLevelIndex = thresholds.findIndex(([l]) => l === level);
  const nextLevel = thresholds[currentLevelIndex + 1];
  const progress = nextLevel
    ? ((points - (thresholds[currentLevelIndex]?.[1] || 0)) / ((nextLevel[1] as number) - (thresholds[currentLevelIndex]?.[1] || 0))) * 100
    : 100;

  // Profile completion check
  const completedTasks = [
    !!profile?.full_name,
    !!profile?.avatar_url,
    !!profile?.university_id,
    !!profile?.bio?.trim(),
    (profile?.interests?.length || 0) >= 3,
  ].filter(Boolean).length;
  const isProfileIncomplete = completedTasks < 5;

  // Avatar glow animation
  const glowOpacity = useSharedValue(0.28);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.28, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signOut();
  };

  const SETTINGS_PREFERENCES = [
    {
      icon: Bell,
      label: "Notifications",
      iconColor: "#6C5CE7",
      iconBg: "#6C5CE720",
      onPress: async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          Alert.alert("Notifications Enabled", "You'll receive alerts for comments, likes, and approvals.", [
            { text: "OK" },
            { text: "Disable", style: "destructive", onPress: () => Alert.alert("Disable", "Go to Settings > FriendsCircle > Notifications.") },
          ]);
        } else {
          Alert.alert("Notifications Disabled", "Enable push notifications to stay updated.", [
            { text: "Not Now" },
            { text: "Enable", onPress: async () => {
              const { status: s } = await Notifications.requestPermissionsAsync();
              if (s === "granted" && user) {
                await registerForPushNotifications(user.id);
                Alert.alert("Success", "Push notifications enabled!");
              }
            } },
          ]);
        }
      },
    },
  ];

  const SETTINGS_SUPPORT = [
    { icon: HelpCircle, label: "Help & Support", iconColor: "#55EFC4", iconBg: "#55EFC420", onPress: () => setShowFeedback(true) },
    { icon: Share2, label: "Share App", iconColor: "#FDCB6E", iconBg: "#FDCB6E20", onPress: () => setShowShare(true) },
    { icon: Info, label: "About FriendsCircle", iconColor: "#A29BFE", iconBg: "#A29BFE20", onPress: () => setShowAbout(true) },
    { icon: Trash2, label: "Delete Account", iconColor: "#FF4757", iconBg: "#FF475720", onPress: () => setShowDeleteAccount(true) },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Page Background */}
      <LinearGradient colors={["#1A1235", "#0F0F1A", "#0F0F1A"]} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFillObject} />
      <Orb size={260} top={320} left={-100} color="#6C5CE7" />
      <Orb size={200} top={560} left={SCREEN_WIDTH - 80} color="#00CEC9" delay={1200} />
      <Orb size={150} top={820} left={SCREEN_WIDTH / 2 - 75} color="#A29BFE" delay={2200} />

      <ScrollView style={{ flex: 1, backgroundColor: "transparent" }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ─── HERO ─── */}
        <LinearGradient
          colors={[levelColor + "CC", levelColor + "35", "transparent"]}
          locations={[0, 0.55, 1]}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          <FloatingParticle size={28} left={12} delay={0} color={levelColor + "50"} />
          <FloatingParticle size={18} left={72} delay={1} color="#A29BFE40" />
          <FloatingParticle size={22} left={45} delay={2} color="#55EFC430" />
          <FloatingParticle size={16} left={88} delay={3} color="#FF6B6B25" />

          {/* Avatar */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarContainer}>
            {/* Glow ring */}
            <Animated.View style={[styles.avatarGlow, { backgroundColor: levelColor }, glowStyle]} />
            {/* Border ring + avatar */}
            <View style={[styles.avatarRing, { borderColor: levelColor }]}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={[levelColor, levelColor + "70"]} style={styles.avatarPlaceholder}>
                  {profile?.full_name ? (
                    <Text style={styles.avatarLetter}>{profile.full_name[0].toUpperCase()}</Text>
                  ) : (
                    <Camera color="rgba(255,255,255,0.6)" size={30} />
                  )}
                </LinearGradient>
              )}
            </View>
            {/* Level badge corner */}
            <View style={[styles.levelCornerBadge, { backgroundColor: levelColor + "25", borderColor: levelColor + "60" }]}>
              <Text style={{ fontSize: 14 }}>{levelIcon}</Text>
            </View>
          </Animated.View>

          {/* Name + university + bio */}
          <Animated.View entering={FadeInUp.delay(160).springify()} style={{ alignItems: "center", paddingHorizontal: 24 }}>
            <Text style={styles.profileName}>
              {profile?.full_name || "Your Name"}
            </Text>
            {university && (
              <Text style={styles.profileUni}>
                🏫 {university.short_name}{campus ? ` · ${campus.name}` : ""}
              </Text>
            )}
            {profile?.bio ? (
              <Text style={styles.profileBio} numberOfLines={2}>{profile.bio}</Text>
            ) : null}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(220).springify()} style={styles.quickActions}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEditProfile(true); }}
              style={styles.editBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <Edit3 color="white" size={15} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowShare(true); }}
              style={styles.shareBtn}
            >
              <Share2 color={theme.colors.primary.light} size={15} />
              <Text style={styles.shareBtnText}>Share</Text>
            </Pressable>
          </Animated.View>
        </LinearGradient>

        {/* ─── STATS GRID ─── */}
        <View style={styles.statsGrid}>
          <StatCard emoji="📝" value={postsCount} label="Posts" color="#6C5CE7" delay={150} />
          <StatCard emoji="💬" value={commentsCount} label="Comments" color="#00CEC9" delay={250} />
          <StatCard emoji="⚡" value={points} label="XP" color="#FDCB6E" delay={350} />
        </View>

        {/* ─── PROFILE CHECKLIST ─── */}
        {isProfileIncomplete && (
          <ProfileChecklist profile={profile} onEdit={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEditProfile(true); }} />
        )}

        {/* ─── LEVEL CARD ─── */}
        <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.levelCard}>
          <LinearGradient colors={[levelColor + "18", "#1C1C32", "#16162A"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.levelHighlight} />
          <View style={styles.levelTop}>
            <View style={[styles.levelIconWrap, { backgroundColor: levelColor + "20", borderColor: levelColor + "40" }]}>
              <LinearGradient colors={[levelColor + "30", levelColor + "08"]} style={StyleSheet.absoluteFillObject} />
              <Text style={{ fontSize: 32 }}>{levelIcon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.levelMeta}>YOUR LEVEL</Text>
              <Text style={[styles.levelName, { color: levelColor }]}>{level}</Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: levelColor + "20", borderColor: levelColor + "40" }]}>
              <Text style={{ fontSize: 12 }}>⚡</Text>
              <Text style={[styles.xpBadgeText, { color: levelColor }]}>{points}</Text>
            </View>
          </View>

          <AnimatedProgressBar progress={progress} color={levelColor} />
          <Text style={styles.levelHint}>
            {nextLevel ? `${(nextLevel[1] as number) - points} XP to ${nextLevel[0]}` : "Max level! 🏆"}
          </Text>

          <LevelJourney currentLevel={level} />
        </Animated.View>

        {/* ─── INTERESTS ─── */}
        <InterestChips interests={profile?.interests || []} />

        {/* ─── MY POSTS ─── */}
        <MyPostsSection
          posts={myPosts}
          userId={user?.id || ""}
          onDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ["myPosts", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
          }}
        />

        {/* ─── SETTINGS ─── */}
        <Animated.View entering={FadeInUp.delay(430).springify()} style={{ marginTop: 24 }}>
          {/* Preferences group */}
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabel}>PREFERENCES</Text>
          </View>
          <View style={[styles.settingsCard, { marginBottom: 16 }]}>
            <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
            {SETTINGS_PREFERENCES.map((item, i) => (
              <Pressable key={item.label} onPress={item.onPress} style={[styles.settingsItem, i < SETTINGS_PREFERENCES.length - 1 && styles.settingsDivider]}>
                <View style={styles.settingsLeft}>
                  <LinearGradient colors={[item.iconColor + "25", item.iconColor + "12"]} style={[styles.settingsIconBg, { borderColor: item.iconColor + "20" }]}>
                    <item.icon color={item.iconColor} size={17} />
                  </LinearGradient>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                </View>
                <ChevronRight color={theme.colors.dark.textMuted} size={17} />
              </Pressable>
            ))}
          </View>

          {/* Support group */}
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabel}>SUPPORT</Text>
          </View>
          <View style={styles.settingsCard}>
            <LinearGradient colors={["#1E1E3A", "#16162A"]} style={StyleSheet.absoluteFillObject} />
            {SETTINGS_SUPPORT.map((item, i) => (
              <Pressable key={item.label} onPress={item.onPress} style={[styles.settingsItem, i < SETTINGS_SUPPORT.length - 1 && styles.settingsDivider]}>
                <View style={styles.settingsLeft}>
                  <LinearGradient colors={[item.iconColor + "25", item.iconColor + "12"]} style={[styles.settingsIconBg, { borderColor: item.iconColor + "20" }]}>
                    <item.icon color={item.iconColor} size={17} />
                  </LinearGradient>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                </View>
                <ChevronRight color={theme.colors.dark.textMuted} size={17} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ─── SIGN OUT ─── */}
        <Animated.View entering={FadeInUp.delay(490).springify()} style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable onPress={handleSignOut} style={styles.signOutButton} accessibilityRole="button" accessibilityLabel="Sign out">
            <LogOut color={theme.colors.accent.coral} size={17} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal visible={showEditProfile} profile={profile} userId={user?.id || ""} onClose={() => setShowEditProfile(false)} />
      <ShareModal visible={showShare} profile={profile} postsCount={postsCount} commentsCount={commentsCount} onClose={() => setShowShare(false)} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
      <HelpSupportModal visible={showFeedback} userId={user?.id || ""} onClose={() => setShowFeedback(false)} />
      <DeleteAccountModal visible={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Hero
  hero: {
    alignItems: "center",
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  avatarContainer: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  avatarGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    padding: 3,
    overflow: "hidden",
  },
  avatarImage: { flex: 1, borderRadius: 51 },
  avatarPlaceholder: { flex: 1, borderRadius: 51, alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "white", fontSize: 36, fontWeight: "800" },
  levelCornerBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1235",
  },

  profileName: { color: "#fff", fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  profileUni: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center", marginBottom: 6 },
  profileBio: { color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 2 },

  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  editBtnText: { color: "white", fontSize: 14, fontWeight: "700" },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  shareBtnText: { color: theme.colors.primary.light, fontSize: 14, fontWeight: "600" },

  // Stats
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -14,
    gap: 10,
    zIndex: 1,
  },
  statCard: {
    borderRadius: 14,
    padding: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  statInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 1, letterSpacing: 0.3 },

  // Checklist
  checklistCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6C5CE722",
  },
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 12,
  },
  checklistTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  checklistSub: { color: theme.colors.dark.textMuted, fontSize: 12, marginTop: 3 },
  checklistTrack: {
    height: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#ffffff10",
    borderRadius: 999,
    overflow: "hidden",
  },
  checklistFill: { height: "100%", borderRadius: 999, overflow: "hidden", minWidth: 4 },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  checklistDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ffffff08" },
  checklistCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#3D3D5A",
    alignItems: "center",
    justifyContent: "center",
  },
  checklistCheckDone: { backgroundColor: "#55EFC418", borderColor: "#55EFC4" },
  checklistLabel: { flex: 1, color: theme.colors.dark.textPrimary, fontSize: 13, fontWeight: "500" },
  checklistLabelDone: { color: theme.colors.dark.textMuted, textDecorationLine: "line-through" },
  xpChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  xpChipText: { fontSize: 11, fontWeight: "700" },

  // Level card
  levelCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  levelHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  levelTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  levelIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  levelMeta: { color: theme.colors.dark.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  levelName: { fontSize: 20, fontWeight: "800" },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  xpBadgeText: { fontSize: 13, fontWeight: "700" },

  // Progress
  progressTrack: {
    height: 8,
    backgroundColor: "#ffffff10",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
    minWidth: 8,
  },
  progressShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
  },
  levelHint: { color: theme.colors.dark.textMuted, fontSize: 12, marginTop: 8 },

  // Journey
  journeyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ffffff08",
  },
  journeyStop: { alignItems: "center", gap: 4 },
  journeyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#2D2D4A",
  },
  journeyDotCurrent: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  journeyLabel: { fontSize: 9, fontWeight: "500" },
  journeyLine: { flex: 1, height: 2, marginTop: 2.5, marginBottom: 13 },

  // Section labels
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#6C5CE7" },
  sectionLabel: { color: theme.colors.dark.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },

  // Interests
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },

  // Activity / My Posts
  activityCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  activityDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ffffff08" },
  activityDot: { width: 7, height: 7, borderRadius: 3.5 },
  activityTitle: { color: theme.colors.dark.textPrimary, fontSize: 13, fontWeight: "500" },
  activityMeta: { color: theme.colors.dark.textMuted, fontSize: 10, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  myPostItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  myPostTypeBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  myPostDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FF6B6B15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF6B6B25",
  },
  myPostShowMore: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ffffff08",
  },
  myPostShowMoreText: {
    color: "#6C5CE7",
    fontSize: 12,
    fontWeight: "600",
  },

  // Settings
  settingsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  settingsItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  settingsDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ffffff0A" },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  settingsLabel: { color: theme.colors.dark.textPrimary, fontSize: 15, fontWeight: "500" },

  // Sign Out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent.coral + "12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.accent.coral + "25",
  },
  signOutText: { color: theme.colors.accent.coral, fontSize: 15, fontWeight: "600" },

  // ─── Edit Profile Modal ────────────────────────────────────────
  editAvatarSection: { alignItems: "center", paddingVertical: 28 },
  editAvatarWrap: { position: "relative" },
  editAvatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: "#6C5CE7",
    padding: 3,
    overflow: "hidden",
  },
  editAvatarImg: { flex: 1, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  editCameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F0F1A",
  },
  editAvatarHint: { color: "#555", fontSize: 12, marginTop: 10 },
  editSectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  editSectionDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#6C5CE7" },
  editSectionLabelText: { color: "#555", fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  editCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  editFieldWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  editFieldLabel: { color: "#555", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  editFieldInput: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  editFieldDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#ffffff08", marginHorizontal: 16 },
  editFieldCount: { color: "#333", fontSize: 10, textAlign: "right", marginTop: 4 },
  editInterestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  editInterestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1C1C35",
    borderWidth: 1,
    borderColor: "#ffffff12",
    overflow: "hidden",
  },
  editInterestChipActive: {
    borderColor: "#6C5CE760",
  },
  editInterestText: { color: "#555", fontSize: 13, fontWeight: "600" },
  editInterestTextActive: { color: "#A29BFE", fontWeight: "700" },
  editSaveBtn: {
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  editSaveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // ─── Share Modal ───────────────────────────────────────────────
  shareModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff08",
  },
  shareModalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  shareModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff0E",
    alignItems: "center",
    justifyContent: "center",
  },
  shareOptionLabel: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  sharePreviewCard: {
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  sharePreviewBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  sharePreviewBrandText: {
    color: "#A29BFE",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sharePreviewProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  sharePreviewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  sharePreviewName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  sharePreviewLevelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sharePreviewLevel: { fontSize: 11, fontWeight: "700" },
  sharePreviewUni: { color: "#666", fontSize: 11 },
  sharePreviewBio: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
    marginBottom: 14,
  },
  sharePreviewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ffffff08",
  },
  sharePreviewStat: { alignItems: "center", gap: 2 },
  sharePreviewStatNum: { color: "#fff", fontSize: 15, fontWeight: "800" },
  sharePreviewStatLabel: { color: "#555", fontSize: 10, fontWeight: "600" },

  shareOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  shareOptionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#1C1C35",
    borderWidth: 1,
    borderColor: "#6C5CE740",
  },
  shareOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareOptionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  shareOptionSub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },

  sharePlatformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  sharePlatformChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#ffffff08",
    borderWidth: 1,
    borderColor: "#ffffff12",
  },
  sharePlatformText: { color: "#555", fontSize: 11, fontWeight: "600" },
  shareHintText: {
    color: "#444",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },

  // ─── About Modal ───────────────────────────────────────────────
  aboutHero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: "relative",
  },
  aboutCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff0E",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutLogoWrap: {
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
    marginTop: 16,
  },
  aboutLogo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutAppName: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 },
  aboutTagline: { color: "#A29BFE", fontSize: 14, fontWeight: "600", textAlign: "center" },
  aboutVersionBadge: {
    marginTop: 12,
    backgroundColor: "#6C5CE720",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#6C5CE740",
  },
  aboutVersionText: { color: "#8B7CF6", fontSize: 12, fontWeight: "600" },

  aboutStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: "#1C1C35",
    borderRadius: 16,
    marginTop: -1,
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  aboutStatItem: { alignItems: "center" },
  aboutStatNum: { color: "#fff", fontSize: 22, fontWeight: "900" },
  aboutStatLabel: { color: "#555", fontSize: 11, fontWeight: "600", marginTop: 2 },

  aboutSectionTitle: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  aboutFeaturesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  aboutFeatureCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  aboutFeatureTitle: { color: "#fff", fontSize: 12, fontWeight: "700", marginBottom: 3 },
  aboutFeatureDesc: { color: "#555", fontSize: 11, lineHeight: 15 },

  aboutMissionCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6C5CE720",
    alignItems: "center",
  },
  aboutMissionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  aboutMissionText: { color: "#777", fontSize: 13, lineHeight: 20, textAlign: "center" },

  aboutMadeWith: { color: "#555", fontSize: 13, marginBottom: 4 },
  aboutCopyright: { color: "#333", fontSize: 11, marginBottom: 20 },
  aboutDoneBtn: { borderRadius: 14, overflow: "hidden" },
  aboutDoneBtnInner: { paddingHorizontal: 40, paddingVertical: 13, borderRadius: 14 },
  aboutDoneBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // ─── Help & Support Modal ──────────────────────────────────────
  helpHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff06",
  },
  helpHeaderIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#00CEC915",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#00CEC930",
  },
  helpHeaderTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 6 },
  helpHeaderSub: { color: "#666", fontSize: 13, textAlign: "center", lineHeight: 19 },

  faqList: { gap: 2 },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 2,
  },
  faqItemOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  faqQuestion: { color: theme.colors.dark.textPrimary, fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 },
  faqAnswer: {
    backgroundColor: "#141428",
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 14,
    marginBottom: 2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#1C1C35",
  },
  faqAnswerText: { color: "#777", fontSize: 12, lineHeight: 18 },

  helpCategoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  helpCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1C1C32",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  helpCategoryChipActive: {
    backgroundColor: "#00CEC920",
    borderColor: "#00CEC950",
  },
  helpCategoryText: { color: "#666", fontSize: 12, fontWeight: "600" },
  helpCategoryTextActive: { color: "#00CEC9" },

  helpInputLabel: { color: "#555", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  helpInput: {
    backgroundColor: "#1C1C32",
    borderRadius: 12,
    padding: 14,
    color: theme.colors.dark.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  helpCharCount: { color: "#333", fontSize: 10, textAlign: "right", marginTop: 4 },
  helpSubmitBtn: {
    borderRadius: 14,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  helpSubmitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
