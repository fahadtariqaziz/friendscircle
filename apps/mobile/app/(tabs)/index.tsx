import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback, useEffect, useMemo, useRef, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPosts,
  getProfile,
  getNotifications,
  getUserLikedIds,
  getBatchLikesCount,
  toggleLike,
  getNewMembers,
  sendHello,
  getSentHellos,
  getComments,
  createComment,
} from "@friendscircle/supabase";
import { VIBES, GOALS } from "../onboarding";
import { theme } from "@friendscircle/ui";
import { getTimeAgo } from "@friendscircle/shared";
import {
  Heart,
  MessageCircle,
  Bell,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  ArrowRight,
  Zap,
  Flame,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Send,
  Home,
  Users,
  Briefcase,
  Clock,
  BookOpen,
  Car,
  FileText,
} from "lucide-react-native";
import { useAuth } from "../_layout";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: W } = Dimensions.get("window");

// ─── Constants ───────────────────────────────────────────────────

const FILTER_CONFIG = [
  { id: "For You", emoji: "✨", label: "For You" },
  { id: "Hot", emoji: "🔥", label: "Hot" },
  { id: "Campus", emoji: "🏫", label: "Campus" },
  { id: "Fresh", emoji: "🆕", label: "Fresh" },
] as const;

const LEVEL_CONFIG = [
  { name: "Freshman", threshold: 0, next: 100, color: "#A29BFE" },
  { name: "Sophomore", threshold: 100, next: 300, color: "#6C5CE7" },
  { name: "Junior", threshold: 300, next: 600, color: "#00CEC9" },
  { name: "Senior", threshold: 600, next: 1000, color: "#FDCB6E" },
  { name: "Alumni", threshold: 1000, next: 2000, color: "#FF6B6B" },
  { name: "Legend", threshold: 2000, next: 99999, color: "#FFD700" },
];

const DAILY_SPARKS = [
  { emoji: "☕", prompt: "What's the best chai spot near campus?", xp: 50 },
  { emoji: "📚", prompt: "Rate a teacher who actually makes sense", xp: 75 },
  { emoji: "🎯", prompt: "Share a study hack that actually works", xp: 50 },
  { emoji: "😂", prompt: "What's the most absurd thing that happened on campus?", xp: 40 },
  { emoji: "💡", prompt: "Which subject surprised you the most this semester?", xp: 50 },
  { emoji: "🚗", prompt: "Going home for the weekend? Share or find a ride", xp: 60 },
  { emoji: "🏆", prompt: "What's your biggest W this semester?", xp: 50 },
];

const DAILY_MISSIONS_CONFIG = [
  { id: "open", label: "Open the app", xp: 5, emoji: "📱", auto: true },
  { id: "like", label: "Like 3 posts", xp: 15, emoji: "❤️" },
  { id: "read", label: "Scroll through 5 posts", xp: 10, emoji: "👁" },
  { id: "share", label: "Share something today", xp: 50, emoji: "✨", bonus: true },
];

const TOP_CATEGORIES = [
  { type: "teacher_review", emoji: "⭐", label: "Reviews", color: "#FDCB6E", xp: 75 },
  { type: "olx", emoji: "🛒", label: "OLX", color: "#55EFC4", xp: 30 },
  { type: "ride_share", emoji: "🚗", label: "Rides", color: "#00CEC9", xp: 60 },
  { type: "event", emoji: "📅", label: "Events", color: "#FF6B6B", xp: 40 },
  { type: "lost_found", emoji: "🔍", label: "Lost & Found", color: "#A29BFE", xp: 25 },
  { type: "past_paper", emoji: "📄", label: "Past Papers", color: "#6C5CE7", xp: 35 },
  { type: "memory", emoji: "📸", label: "Memories", color: "#FDCB6E", xp: 30 },
];

const POST_TYPE_CONFIG: Record<string, { bg: string; text: string; emoji: string; label: string }> = {
  teacher_review: { bg: "#FDCB6E20", text: "#FDCB6E", emoji: "⭐", label: "Teacher Review" },
  olx: { bg: "#FDCB6E20", text: "#FDCB6E", emoji: "🛒", label: "Student OLX" },
  books: { bg: "#00CEC920", text: "#00CEC9", emoji: "📚", label: "Books" },
  lost_found: { bg: "#FF6B6B20", text: "#FF6B6B", emoji: "🔍", label: "Lost & Found" },
  ride_share: { bg: "#55EFC420", text: "#55EFC4", emoji: "🚗", label: "Ride Share" },
  roommate: { bg: "#00CEC920", text: "#00CEC9", emoji: "🏠", label: "Roommate" },
  event: { bg: "#FF6B6B20", text: "#FF6B6B", emoji: "📅", label: "Event" },
  past_paper: { bg: "#A29BFE20", text: "#A29BFE", emoji: "📄", label: "Past Paper" },
  freelance: { bg: "#6C5CE720", text: "#6C5CE7", emoji: "💼", label: "Freelance" },
  job: { bg: "#55EFC420", text: "#55EFC4", emoji: "💰", label: "Job" },
  memory: { bg: "#FDCB6E20", text: "#FDCB6E", emoji: "📸", label: "Memory" },
  friend_circle: { bg: "#6C5CE720", text: "#6C5CE7", emoji: "👥", label: "Circle" },
};

// ─── Helpers ─────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function getDayName(): string {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}

function getLevelConfig(level: string) {
  return LEVEL_CONFIG.find((c) => c.name === level) || LEVEL_CONFIG[0];
}

function getNextLevelConfig(level: string) {
  const idx = LEVEL_CONFIG.findIndex((c) => c.name === level);
  return idx >= 0 && idx < LEVEL_CONFIG.length - 1 ? LEVEL_CONFIG[idx + 1] : null;
}

function getPostBadge(post: any, likesCount: number): { label: string; color: string } | null {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  const commentCount = post.comments?.[0]?.count || 0;
  const engagement = likesCount + commentCount;

  if (engagement >= 5) return { label: "🔥 Hot", color: "#FF6B6B" };
  if (engagement >= 2 && ageHours < 2) return { label: "⚡ Rising", color: "#FDCB6E" };
  if (ageHours < 1 && engagement === 0) return { label: "🆕 Fresh", color: "#55EFC4" };
  if ((post.post_type === "event" || post.post_type === "ride_share") && ageHours < 6) {
    return { label: "⏰ Live", color: "#A29BFE" };
  }
  return null;
}

// ─── Streak Hook ─────────────────────────────────────────────────

const STREAK_KEY = "fc_streak_v1";
const STREAK_DATE_KEY = "fc_streak_date_v1";

function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function checkStreak() {
      try {
        const today = new Date().toDateString();
        const lastDate = await SecureStore.getItemAsync(STREAK_DATE_KEY);
        const stored = parseInt(await SecureStore.getItemAsync(STREAK_KEY) || "0", 10);

        if (lastDate === today) { setStreak(stored); return; }

        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastDate === yesterday ? stored + 1 : 1;

        await SecureStore.setItemAsync(STREAK_DATE_KEY, today);
        await SecureStore.setItemAsync(STREAK_KEY, String(newStreak));
        setStreak(newStreak);
      } catch {
        setStreak(1);
      }
    }
    checkStreak();
  }, []);

  return streak;
}

// ─── Floating Background Orb ─────────────────────────────────────

function Orb({ color, size, x, y, delay = 0 }: {
  color: string; size: number; x: number; y: number; delay?: number;
}) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.14, { duration: 1000 }));
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(16, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, {
        position: "absolute", width: size, height: size,
        borderRadius: size / 2, backgroundColor: color, left: x, top: y,
      }]}
    />
  );
}

// ─── Animated Bell ───────────────────────────────────────────────

function AnimatedBell({ unreadCount, onPress }: { unreadCount: number; onPress: () => void }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (unreadCount > 0) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 60 }),
          withTiming(12, { duration: 60 }),
          withTiming(-8, { duration: 60 }),
          withTiming(8, { duration: 60 }),
          withTiming(0, { duration: 100 }),
        ),
        3, false,
      );
    }
  }, [unreadCount]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.bellButton}>
      <Animated.View style={bellStyle}>
        <Bell color={theme.colors.dark.textSecondary} size={22} />
      </Animated.View>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Home Header ─────────────────────────────────────────────────

function HomeHeader({
  profile,
  profileLoading,
  unreadCount,
  streak,
}: {
  profile: any;
  profileLoading: boolean;
  unreadCount: number;
  streak: number;
}) {
  const router = useRouter();
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";
  const points = profile?.points || 0;
  const level = profile?.level || "Freshman";
  const cfg = getLevelConfig(level);
  const nextCfg = getNextLevelConfig(level);
  const progress = nextCfg ? Math.min((points - cfg.threshold) / (nextCfg.threshold - cfg.threshold), 1) : 1;

  const barWidth = useSharedValue(0);
  const BAR_MAX = W - 200;

  useEffect(() => {
    if (!profileLoading) {
      barWidth.value = withDelay(700, withTiming(progress * BAR_MAX, {
        duration: 1200, easing: Easing.out(Easing.cubic),
      }));
    }
  }, [profileLoading, progress, BAR_MAX]);

  const barStyle = useAnimatedStyle(() => ({ width: barWidth.value }));

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
      <Pressable onPress={() => router.push("/(tabs)/profile")} style={styles.headerLeft}>
        <View style={styles.avatarContainer}>
          {profileLoading ? (
            <View style={[styles.avatar, { backgroundColor: "#1E1E38" }]} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.full_name?.[0]?.toUpperCase() || "?"}</Text>
            </LinearGradient>
          )}
        </View>
        <View>
          {profileLoading ? (
            <>
              <View style={styles.skeletonLineSmall} />
              <View style={[styles.skeletonLineSmall, { width: 80, marginTop: 5, height: 14 }]} />
            </>
          ) : (
            <>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.nameText}>{firstName}</Text>
              {/* XP Progress inline */}
              <View style={styles.xpRow}>
                <View style={[styles.xpLevelDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.xpLevelLabel, { color: cfg.color }]}>{level}</Text>
                <View style={styles.xpBarTrack}>
                  <Animated.View style={[styles.xpBarFill, { backgroundColor: cfg.color }, barStyle]} />
                </View>
                <Zap color={cfg.color} size={9} />
                <Text style={[styles.xpValue, { color: cfg.color }]}>{points}</Text>
              </View>
            </>
          )}
        </View>
      </Pressable>

      <View style={styles.headerRight}>
        {streak > 0 && (
          <Animated.View entering={FadeIn.delay(500)} style={styles.streakBadge}>
            <Flame color="#FF6B6B" size={13} fill="#FF6B6B" />
            <Text style={styles.streakText}>{streak}</Text>
          </Animated.View>
        )}
        <AnimatedBell
          unreadCount={unreadCount}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/threads");
          }}
        />
      </View>
    </Animated.View>
  );
}

// ─── Campus Pulse Bar ────────────────────────────────────────────

function CampusPulseBar({
  postsToday,
  newMembersCount,
  uniName,
}: {
  postsToday: number;
  newMembersCount: number;
  uniName?: string;
}) {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View entering={FadeInUp.delay(150)} style={styles.pulseBar}>
      <LinearGradient colors={["#1A1A38", "#12122A"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.pulseLeft}>
        <Animated.View style={[styles.pulseDot, pulseStyle]} />
        <Text style={styles.pulseLabel}>
          {uniName ? uniName : "Campus"} is buzzing
        </Text>
      </View>
      <View style={styles.pulseStats}>
        {postsToday > 0 && (
          <View style={styles.pulseStat}>
            <Text style={styles.pulseStatNum}>{postsToday}</Text>
            <Text style={styles.pulseStatLabel}>posts</Text>
          </View>
        )}
        {newMembersCount > 0 && (
          <View style={styles.pulseStat}>
            <Text style={[styles.pulseStatNum, { color: "#55EFC4" }]}>{newMembersCount}</Text>
            <Text style={styles.pulseStatLabel}>new</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Daily Missions Card ─────────────────────────────────────────

const MISSIONS_KEY = "fc_missions_v1";
const MISSIONS_DATE_KEY = "fc_missions_date_v1";

function DailyMissionsCard({
  sessionLikes,
  postsLoaded,
  onNavigateCreate,
}: {
  sessionLikes: number;
  postsLoaded: number;
  onNavigateCreate: () => void;
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(["open"]));
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const today = new Date().toDateString();
        const storedDate = await SecureStore.getItemAsync(MISSIONS_DATE_KEY);
        if (storedDate !== today) {
          await SecureStore.setItemAsync(MISSIONS_DATE_KEY, today);
          await SecureStore.setItemAsync(MISSIONS_KEY, JSON.stringify(["open"]));
          setCompleted(new Set(["open"]));
        } else {
          const raw = await SecureStore.getItemAsync(MISSIONS_KEY);
          setCompleted(new Set(raw ? JSON.parse(raw) : ["open"]));
        }
        setLoaded(true);
      } catch {
        setLoaded(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const next = new Set(completed);
    let changed = false;
    if (sessionLikes >= 3 && !next.has("like")) { next.add("like"); changed = true; }
    if (postsLoaded >= 5 && !next.has("read")) { next.add("read"); changed = true; }
    if (changed) {
      setCompleted(next);
      SecureStore.setItemAsync(MISSIONS_KEY, JSON.stringify([...next])).catch(() => {});
    }
  }, [sessionLikes, postsLoaded, loaded]);

  const markDone = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      SecureStore.setItemAsync(MISSIONS_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const earnedXp = DAILY_MISSIONS_CONFIG.filter((m) => completed.has(m.id)).reduce((s, m) => s + m.xp, 0);
  const totalXp = DAILY_MISSIONS_CONFIG.reduce((s, m) => s + m.xp, 0);
  const progress = earnedXp / totalXp;
  const completedCount = DAILY_MISSIONS_CONFIG.filter((m) => completed.has(m.id)).length;

  if (!loaded) return null;

  return (
    <Animated.View entering={FadeInUp.delay(250).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((e) => !e);
        }}
        style={styles.missionsCard}
      >
        <LinearGradient colors={["#1C1C38", "#141430"]} style={StyleSheet.absoluteFillObject} />

        <View style={styles.missionsHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.missionsTitleIcon}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
            </View>
            <View>
              <Text style={styles.missionsTitle}>Daily Missions</Text>
              <Text style={styles.missionsSubtitle}>{earnedXp}/{totalXp} XP today</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.missionsBadge}>
              <Text style={styles.missionsBadgeText}>{completedCount}/{DAILY_MISSIONS_CONFIG.length}</Text>
            </View>
            {expanded ? <ChevronUp color="#555" size={16} /> : <ChevronDown color="#555" size={16} />}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.missionsProgressBg}>
          <LinearGradient
            colors={["#6C5CE7", "#A29BFE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.missionsProgressFill, { width: `${progress * 100}%` as any }]}
          />
        </View>

        {expanded && (
          <View style={{ gap: 6, marginTop: 12 }}>
            {DAILY_MISSIONS_CONFIG.map((m) => {
              const done = completed.has(m.id);
              const isBonus = !!(m as any).bonus;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    if (m.id === "share" && !done) {
                      markDone("share");
                      onNavigateCreate();
                    }
                  }}
                  style={[
                    styles.missionRow,
                    done && styles.missionRowDone,
                    isBonus && !done && styles.missionRowBonus,
                  ]}
                >
                  <View style={styles.missionCheck}>
                    {done ? (
                      <Check color="#55EFC4" size={14} />
                    ) : (
                      <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
                    )}
                  </View>
                  <Text style={[styles.missionLabel, done && styles.missionLabelDone]}>
                    {m.label}
                  </Text>
                  <View style={[styles.missionXpBadge, done && styles.missionXpBadgeDone]}>
                    <Text style={[styles.missionXpText, done && styles.missionXpTextDone]}>
                      {done ? "✓ " : "+"}{m.xp} XP
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Smart Filter Tabs ───────────────────────────────────────────

function SmartFilterTabs({ active, onChange }: {
  active: string;
  onChange: (f: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {FILTER_CONFIG.map((f) => {
        const isActive = active === f.id;
        if (isActive) {
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(f.id);
              }}
              style={{ overflow: "hidden", borderRadius: 999 }}
            >
              <LinearGradient
                colors={["#6C5CE7", "#8B7CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterPillActive}
              >
                <Text style={{ fontSize: 12 }}>{f.emoji}</Text>
                <Text style={styles.filterPillTextActive}>{f.label}</Text>
              </LinearGradient>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={f.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(f.id);
            }}
            style={styles.filterPill}
          >
            <Text style={{ fontSize: 12 }}>{f.emoji}</Text>
            <Text style={styles.filterPillText}>{f.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Daily Spark Card ─────────────────────────────────────────────

function DailySparkCard() {
  const router = useRouter();
  const spark = DAILY_SPARKS[new Date().getDay()];
  const scale = useSharedValue(1);
  const sparkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const shine = useSharedValue(-200);
  useEffect(() => {
    shine.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(W + 200, { duration: 1800, easing: Easing.linear }),
          withTiming(-200, { duration: 0 }),
        ),
        -1, false,
      ),
    );
  }, []);
  const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value }] }));

  return (
    <Animated.View entering={FadeInUp.delay(100).springify()}>
      <View style={styles.sparkSectionRow}>
        <Text style={styles.sectionTitle}>DAILY SPARK</Text>
        <View style={styles.sparkDayBadge}>
          <Text style={styles.sparkDayText}>{getDayName()}</Text>
        </View>
      </View>

      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/create");
        }}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={[styles.sparkCard, sparkStyle]}
      >
        <LinearGradient
          colors={["#2D1B5A", "#1E1A40", "#141428"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Shine sweep */}
        <Animated.View
          pointerEvents="none"
          style={[styles.sparkShine, shineStyle]}
        />
        {/* Top glow line */}
        <LinearGradient
          colors={["#6C5CE750", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sparkTopGlow}
          pointerEvents="none"
        />

        <View style={styles.sparkContent}>
          <Text style={{ fontSize: 52, marginBottom: 14 }}>{spark.emoji}</Text>
          <Text style={styles.sparkPrompt}>"{spark.prompt}"</Text>
          <View style={styles.sparkFooter}>
            <View style={styles.sparkXpBadge}>
              <Zap color="#FDCB6E" size={12} />
              <Text style={styles.sparkXpText}>+{spark.xp} XP</Text>
            </View>
            <View style={styles.sparkCta}>
              <Text style={styles.sparkCtaText}>Share your take</Text>
              <ArrowRight color="#6C5CE7" size={14} />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─── Category Chip (isolated so hooks work correctly) ─────────────

function CategoryChip({ cat }: { cat: typeof TOP_CATEGORIES[0] }) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const chipStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(tabs)/create");
      }}
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[styles.catChip, chipStyle, { borderColor: cat.color + "35" }]}
    >
      <LinearGradient
        colors={[cat.color + "18", "transparent"]}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
      <Text style={[styles.catChipLabel, { color: cat.color }]}>{cat.label}</Text>
      <View style={[styles.catChipXpBadge, { backgroundColor: cat.color + "20" }]}>
        <Zap color={cat.color} size={9} />
        <Text style={[styles.catChipXpText, { color: cat.color }]}>+{cat.xp}</Text>
      </View>
    </AnimatedPressable>
  );
}

function CategoryStrip() {
  return (
    <Animated.View entering={FadeInUp.delay(250).springify()}>
      <Text style={styles.sectionTitle}>EXPLORE CAMPUS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {TOP_CATEGORIES.map((cat) => (
          <CategoryChip key={cat.type} cat={cat} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── New Member Card ─────────────────────────────────────────────

const CARD_W = 188;

const NewMemberCard = memo(function NewMemberCard({
  member,
  sentHello,
  currentUserId,
  onHello,
}: {
  member: any;
  sentHello: boolean;
  currentUserId: string;
  onHello: (id: string) => void;
}) {
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const vibeObj = VIBES.find((v) => v.id === member.vibe);
  const goalObjs = GOALS.filter((g) => (member.looking_for || []).includes(g.id));
  const initials = (member.full_name || "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleHello = useCallback(() => {
    if (sentHello) return;
    scale.value = withSequence(withSpring(0.9), withSpring(1));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onHello(member.id);
  }, [sentHello, member.id, onHello, scale]);

  return (
    <Animated.View entering={FadeIn.springify().damping(16)} style={styles.nmCard}>
      <LinearGradient colors={["#181830", "#111128"]} style={styles.nmCardInner}>
        <View style={styles.nmAvatarWrap}>
          {member.avatar_url ? (
            <Image source={{ uri: member.avatar_url }} style={styles.nmAvatar} />
          ) : (
            <LinearGradient colors={["#6C5CE7", "#A29BFE"]} style={styles.nmAvatar}>
              <Text style={styles.nmInitials}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={styles.nmNewBadge}>
            <Text style={styles.nmNewText}>NEW</Text>
          </View>
        </View>

        <Text style={styles.nmName} numberOfLines={1}>{member.full_name}</Text>
        {member.universities?.short_name && (
          <Text style={styles.nmUni} numberOfLines={1}>🏫 {member.universities.short_name}</Text>
        )}

        {vibeObj && (
          <View style={[styles.nmVibeBadge, { backgroundColor: vibeObj.color + "18", borderColor: vibeObj.color + "35" }]}>
            <Text style={{ fontSize: 13 }}>{vibeObj.emoji}</Text>
            <Text style={[styles.nmVibeText, { color: vibeObj.color }]}>{vibeObj.label}</Text>
          </View>
        )}

        {goalObjs.length > 0 && (
          <View style={styles.nmGoalRow}>
            {goalObjs.slice(0, 2).map((g) => (
              <View key={g.id} style={[styles.nmGoalChip, { backgroundColor: g.color + "15" }]}>
                <Text style={{ fontSize: 10 }}>{g.emoji}</Text>
                <Text style={[styles.nmGoalText, { color: g.color }]}>{g.label}</Text>
              </View>
            ))}
          </View>
        )}

        <AnimatedPressable
          onPress={handleHello}
          style={[styles.nmHelloBtn, btnStyle, sentHello && styles.nmHelloBtnSent]}
        >
          {sentHello ? (
            <>
              <Text style={{ fontSize: 13 }}>✓</Text>
              <Text style={[styles.nmHelloBtnText, { color: "#55EFC4" }]}>Said Hello!</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13 }}>👋</Text>
              <Text style={styles.nmHelloBtnText}>Say Hello</Text>
            </>
          )}
        </AnimatedPressable>
      </LinearGradient>
    </Animated.View>
  );
});

// ─── New Members Section ──────────────────────────────────────────

function NewMembersSection({
  currentUserId,
  universityId,
  onCountChange,
}: {
  currentUserId: string;
  universityId?: string;
  onCountChange?: (count: number) => void;
}) {
  const queryClient = useQueryClient();
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());

  const { data: members } = useQuery({
    queryKey: ["newMembers", universityId],
    queryFn: async () => {
      const { data } = await getNewMembers(currentUserId, universityId);
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (members !== undefined) {
      onCountChange?.(members.length);
    }
  }, [members?.length]);

  const { data: sentHellos } = useQuery({
    queryKey: ["sentHellos", currentUserId],
    queryFn: async () => {
      const { data } = await getSentHellos(currentUserId);
      return new Set((data || []).map((r: any) => r.to_user_id as string));
    },
    staleTime: 5 * 60 * 1000,
  });

  const allSent = useMemo(() => {
    const merged = new Set(sentHellos || []);
    sentSet.forEach((id) => merged.add(id));
    return merged;
  }, [sentHellos, sentSet]);

  const handleHello = useCallback(async (toUserId: string) => {
    setSentSet((prev) => new Set([...prev, toUserId]));
    await sendHello(currentUserId, toUserId);
    queryClient.invalidateQueries({ queryKey: ["sentHellos"] });
  }, [currentUserId, queryClient]);

  if (!members || members.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()}>
      <View style={styles.nmHeader}>
        <View>
          <Text style={styles.nmTitle}>New Members 👋</Text>
          <Text style={styles.nmSubtitle}>Say hello to your new classmates</Text>
        </View>
        <View style={styles.nmCountBadge}>
          <Text style={styles.nmCountText}>{members.length} new</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, gap: 10 }}
      >
        {members.map((member: any) => (
          <NewMemberCard
            key={member.id}
            member={member}
            sentHello={allSent.has(member.id)}
            currentUserId={currentUserId}
            onHello={handleHello}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Post Metadata ────────────────────────────────────────────────

function MetaChip({ icon, label, value, color }: { icon?: React.ReactNode; label?: string; value: string; color: string }) {
  return (
    <View style={[styles.metaChip, { backgroundColor: color + "12" }]}>
      {icon}
      {label ? (
        <Text style={styles.metaChipContent}>
          <Text style={[styles.metaChipLabel, { color: color + "99" }]}>{label} </Text>
          <Text style={[styles.metaChipValue, { color }]}>{value}</Text>
        </Text>
      ) : (
        <Text style={[styles.metaChipValue, { color }]}>{value}</Text>
      )}
    </View>
  );
}

function PostMetadata({ post }: { post: any }) {
  const meta = post.metadata;
  if (!meta) return null;
  const type = post.post_type;

  if (type === "olx") {
    if (!meta.price && !meta.condition && !meta.category) return null;
    return (
      <View style={styles.metaWrap}>
        {meta.price != null && (
          <MetaChip value={`Rs. ${Number(meta.price).toLocaleString()}`} color="#55EFC4" />
        )}
        {meta.condition && <MetaChip label="Condition" value={meta.condition} color="#A29BFE" />}
        {meta.category && <MetaChip label="Category" value={meta.category} color="#FDCB6E" />}
      </View>
    );
  }

  if (type === "books") {
    if (!meta.action && !meta.book_title && !meta.price) return null;
    const actionColor = meta.action === "buy" ? "#6C5CE7" : "#55EFC4";
    return (
      <View style={styles.metaWrap}>
        {meta.action && (
          <View style={[styles.metaStatusBadge, { backgroundColor: actionColor + "20" }]}>
            <Text style={{ color: actionColor, fontSize: 11, fontWeight: "700" }}>
              {meta.action === "buy" ? "BUYING" : "SELLING"}
            </Text>
          </View>
        )}
        {meta.price != null && <MetaChip value={`Rs. ${Number(meta.price).toLocaleString()}`} color="#55EFC4" />}
        {meta.condition && <MetaChip label="Condition" value={meta.condition} color="#A29BFE" />}
        {meta.author && <MetaChip icon={<BookOpen color="#FDCB6E" size={12} />} label="Author" value={meta.author} color="#FDCB6E" />}
        {meta.subject && <MetaChip label="Subject" value={meta.subject} color="#00CEC9" />}
      </View>
    );
  }

  if (type === "teacher_review") {
    if (!meta.teacher_name) return null;
    return (
      <View style={styles.metaCard}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.metaCardTitle}>{meta.teacher_name}</Text>
          {meta.rating != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} color="#FDCB6E" size={12} fill={s <= meta.rating ? "#FDCB6E" : "transparent"} />
              ))}
            </View>
          )}
        </View>
        <View style={styles.metaWrap}>
          {meta.course && <MetaChip label="Course" value={meta.course} color="#A29BFE" />}
          {meta.difficulty != null && <MetaChip label="Difficulty" value={`${meta.difficulty}/5`} color="#FF6B6B" />}
        </View>
      </View>
    );
  }

  if (type === "roommate") {
    if (!meta.hostel_name && !meta.space_for && !meta.rent_range) return null;
    return (
      <View style={styles.metaWrap}>
        {meta.hostel_name && <MetaChip icon={<Home color="#A29BFE" size={12} />} label="Hostel" value={meta.hostel_name} color="#A29BFE" />}
        {meta.space_for != null && <MetaChip icon={<Users color="#00CEC9" size={12} />} label="Space for" value={`${meta.space_for}`} color="#00CEC9" />}
        {meta.rent_range && <MetaChip icon={<DollarSign color="#55EFC4" size={12} />} label="Rent" value={meta.rent_range} color="#55EFC4" />}
      </View>
    );
  }

  if (type === "ride_share") {
    if (!meta.from_location && !meta.to_location) return null;
    return (
      <View style={styles.metaCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Car color="#55EFC4" size={14} />
          <Text style={styles.metaCardTitle}>
            {meta.from_location || "?"} → {meta.to_location || "?"}
          </Text>
        </View>
        <View style={styles.metaWrap}>
          {meta.date && <MetaChip icon={<Calendar color="#FDCB6E" size={12} />} value={meta.date} color="#FDCB6E" />}
          {meta.seats_available != null && <MetaChip icon={<Users color="#00CEC9" size={12} />} label="Seats" value={`${meta.seats_available}`} color="#00CEC9" />}
        </View>
      </View>
    );
  }

  if (type === "event") {
    if (!meta.venue && !meta.event_date && !meta.event_time) return null;
    return (
      <View style={styles.metaWrap}>
        {meta.event_date && <MetaChip icon={<Calendar color="#FF6B6B" size={12} />} value={meta.event_date} color="#FF6B6B" />}
        {meta.event_time && <MetaChip icon={<Clock color="#FDCB6E" size={12} />} value={meta.event_time} color="#FDCB6E" />}
        {meta.venue && <MetaChip icon={<MapPin color="#A29BFE" size={12} />} label="Venue" value={meta.venue} color="#A29BFE" />}
      </View>
    );
  }

  if (type === "lost_found") {
    const lostType = meta.type || meta.status;
    if (!lostType) return null;
    const isLost = lostType === "lost";
    const badgeColor = isLost ? "#FF6B6B" : "#55EFC4";
    return (
      <View style={styles.metaWrap}>
        <View style={[styles.metaStatusBadge, { backgroundColor: badgeColor + "20" }]}>
          <Text style={{ color: badgeColor, fontSize: 11, fontWeight: "700" }}>
            {isLost ? "LOST" : "FOUND"}
          </Text>
        </View>
        {meta.location && <MetaChip icon={<MapPin color="#A29BFE" size={12} />} value={meta.location} color="#A29BFE" />}
        {meta.date_occurred && <MetaChip icon={<Calendar color="#FDCB6E" size={12} />} value={meta.date_occurred} color="#FDCB6E" />}
      </View>
    );
  }

  if (type === "past_paper") {
    if (!meta.course && !meta.year) return null;
    return (
      <View style={styles.metaWrap}>
        {meta.course && <MetaChip icon={<FileText color="#A29BFE" size={12} />} label="Course" value={meta.course} color="#A29BFE" />}
        {meta.year && <MetaChip icon={<Calendar color="#FDCB6E" size={12} />} label="Semester" value={meta.year} color="#FDCB6E" />}
      </View>
    );
  }

  if (type === "freelance") {
    if (!meta.type && !meta.assignment_type && !meta.budget_range) return null;
    const isNeedHelp = meta.type === "need_help";
    const typeColor = isNeedHelp ? "#6C5CE7" : "#00CEC9";
    return (
      <View style={styles.metaWrap}>
        {meta.type && (
          <View style={[styles.metaStatusBadge, { backgroundColor: typeColor + "20" }]}>
            <Text style={{ color: typeColor, fontSize: 11, fontWeight: "700" }}>
              {isNeedHelp ? "NEED HELP" : "CAN HELP"}
            </Text>
          </View>
        )}
        {meta.assignment_type && <MetaChip label="Type" value={meta.assignment_type} color="#A29BFE" />}
        {meta.budget_range && <MetaChip icon={<DollarSign color="#55EFC4" size={12} />} label="Budget" value={meta.budget_range} color="#55EFC4" />}
        {meta.deadline && <MetaChip icon={<Clock color="#FF6B6B" size={12} />} label="Due" value={meta.deadline} color="#FF6B6B" />}
      </View>
    );
  }

  if (type === "job") {
    if (!meta.company && !meta.job_type) return null;
    return (
      <View style={styles.metaWrap}>
        {meta.company && <MetaChip icon={<Briefcase color="#6C5CE7" size={12} />} value={meta.company} color="#6C5CE7" />}
        {meta.job_type && (
          <View style={[styles.metaStatusBadge, { backgroundColor: "#A29BFE20" }]}>
            <Text style={{ color: "#A29BFE", fontSize: 11, fontWeight: "700" }}>
              {meta.job_type.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        )}
        {meta.salary_range && <MetaChip icon={<DollarSign color="#55EFC4" size={12} />} label="Salary" value={meta.salary_range} color="#55EFC4" />}
        {meta.location && <MetaChip icon={<MapPin color="#FDCB6E" size={12} />} value={meta.location} color="#FDCB6E" />}
      </View>
    );
  }

  if (type === "memory") {
    if (!meta.spot_name) return null;
    return (
      <View style={styles.metaWrap}>
        <MetaChip icon={<MapPin color="#FF6B6B" size={12} />} label="Spot" value={meta.spot_name} color="#FF6B6B" />
      </View>
    );
  }

  return null;
}

// ─── Comment Section ────────────────────────────────────────────

const QUICK_REACTIONS = ["❤️", "🔥", "😂", "😮", "👏", "💯"];

function CommentAvatar({ avatarUrl, name, size = 32 }: { avatarUrl?: string; name?: string; size?: number }) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: size * 0.35, fontWeight: "700" }}>
        {name?.[0]?.toUpperCase() || "?"}
      </Text>
    </LinearGradient>
  );
}

function CommentSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 20 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10, opacity: 0.5 - i * 0.08 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#1E1E38" }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ width: 100 + i * 20, height: 12, borderRadius: 6, backgroundColor: "#1E1E38" }} />
            <View style={{ width: "80%", height: 10, borderRadius: 5, backgroundColor: "#1E1E38" }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyComments({ onFocus }: { onFocus: () => void }) {
  return (
    <Animated.View entering={FadeIn.delay(100)} style={cStyles.emptyWrap}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
      <Text style={cStyles.emptyTitle}>Start the conversation</Text>
      <Text style={cStyles.emptySubtitle}>Be the first to share your thoughts!</Text>
      <Pressable onPress={onFocus} style={cStyles.emptyBtn}>
        <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cStyles.emptyBtnInner}>
          <Text style={cStyles.emptyBtnText}>Write a comment</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const CommentRow = memo(function CommentRow({
  comment,
  isReply,
  isOP,
  liked,
  likesCount,
  replyCount,
  expanded,
  onLike,
  onReply,
  onToggle,
  idx,
}: {
  comment: any;
  isReply?: boolean;
  isOP: boolean;
  liked: boolean;
  likesCount: number;
  replyCount: number;
  expanded: boolean;
  onLike: (id: string) => void;
  onReply: (c: any) => void;
  onToggle?: () => void;
  idx: number;
}) {
  const likeScale = useSharedValue(1);
  const likeAnim = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

  const doLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withSequence(
      withSpring(1.5, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    onLike(comment.id);
  };

  const isOptimistic = !!(comment as any)._optimistic;
  const sz = isReply ? 26 : 32;

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(idx * 40, 200)).springify().damping(16)}>
      <View style={[cStyles.row, isReply && cStyles.replyRow, isOptimistic && { opacity: 0.6 }]}>
        {/* Thread line */}
        {isReply && <View style={cStyles.threadLine} />}

        <CommentAvatar avatarUrl={comment.profiles?.avatar_url} name={comment.profiles?.full_name} size={sz} />

        <View style={{ flex: 1 }}>
          {/* Name + OP + Time */}
          <View style={cStyles.nameRow}>
            <Text style={cStyles.cName}>{comment.profiles?.full_name || "Anonymous"}</Text>
            {isOP && (
              <LinearGradient colors={["#6C5CE730", "#6C5CE710"]} style={cStyles.opBadge}>
                <Text style={cStyles.opText}>Author</Text>
              </LinearGradient>
            )}
            <Text style={cStyles.cTime}>· {getTimeAgo(comment.created_at)}</Text>
          </View>

          {/* Reply @mention */}
          {isReply && comment._replyToName && (
            <Text style={cStyles.mention}>@{comment._replyToName} </Text>
          )}

          {/* Body */}
          <Text style={cStyles.cBody}>{comment.body}</Text>

          {/* Actions */}
          <View style={cStyles.cActions}>
            <Pressable onPress={doLike} style={cStyles.cActBtn} hitSlop={8}>
              <Animated.View style={likeAnim}>
                <Heart color={liked ? "#FF6B6B" : "#555"} fill={liked ? "#FF6B6B" : "transparent"} size={14} />
              </Animated.View>
              {likesCount > 0 && (
                <Text style={[cStyles.cActText, liked && { color: "#FF6B6B" }]}>{likesCount}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => onReply(comment)} style={cStyles.cActBtn} hitSlop={8}>
              <Text style={cStyles.replyLabel}>Reply</Text>
            </Pressable>
          </View>

          {/* Expand replies */}
          {!isReply && replyCount > 0 && (
            <Pressable onPress={onToggle} style={cStyles.expandBtn}>
              <View style={cStyles.expandLine} />
              <Text style={cStyles.expandText}>
                {expanded ? "Hide replies" : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
              </Text>
              {expanded
                ? <ChevronUp color="#6C5CE7" size={13} />
                : <ChevronDown color="#6C5CE7" size={13} />
              }
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

function CommentModal({
  postId,
  postAuthorId,
  visible,
  onClose,
  onCommentAdded,
  userId,
}: {
  postId: string | null;
  postAuthorId?: string | null;
  visible: boolean;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
  userId: string;
}) {
  const [allComments, setAllComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const inputRef = useRef<TextInput>(null);

  // Organize into threads
  const topLevel = useMemo(
    () => allComments.filter((c) => !c.parent_id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [allComments],
  );

  const repliesByParent = useMemo(() => {
    const map: Record<string, any[]> = {};
    allComments
      .filter((c) => c.parent_id)
      .forEach((c) => {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c);
      });
    Object.values(map).forEach((arr) => arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    return map;
  }, [allComments]);

  // Load comments + like data
  useEffect(() => {
    if (!visible || !postId) return;
    setLoading(true);
    setExpandedThreads(new Set());
    setReplyingTo(null);
    setLikedSet(new Set());
    setLikeCounts({});

    getComments(postId).then(async ({ data }) => {
      const items = data || [];
      setAllComments(items);
      setLoading(false);

      if (items.length > 0) {
        const ids = items.map((c: any) => c.id);
        const [userLiked, counts] = await Promise.all([
          getUserLikedIds(userId, "comment", ids),
          getBatchLikesCount("comment", ids),
        ]);
        setLikedSet(userLiked);
        const countsObj: Record<string, number> = {};
        counts.forEach((v, k) => { countsObj[k] = v; });
        setLikeCounts(countsObj);
      }
    });
  }, [visible, postId, userId]);

  // Like handler
  const handleLikeComment = useCallback(
    async (commentId: string) => {
      const wasLiked = likedSet.has(commentId);
      setLikedSet((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(commentId) : next.add(commentId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] || 0) + (wasLiked ? -1 : 1)),
      }));
      try {
        await toggleLike(userId, "comment", commentId);
      } catch {
        setLikedSet((prev) => {
          const next = new Set(prev);
          wasLiked ? next.add(commentId) : next.delete(commentId);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [commentId]: Math.max(0, (prev[commentId] || 0) + (wasLiked ? 1 : -1)),
        }));
      }
    },
    [userId, likedSet],
  );

  const handleReply = useCallback((comment: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReplyingTo(comment);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const cancelReply = useCallback(() => setReplyingTo(null), []);

  const toggleThread = useCallback((parentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      next.has(parentId) ? next.delete(parentId) : next.add(parentId);
      return next;
    });
  }, []);

  // Send comment
  const handleSend = async () => {
    if (!text.trim() || !postId || sending) return;
    setSending(true);

    const commentData: Record<string, any> = {
      post_id: postId,
      user_id: userId,
      body: text.trim(),
    };

    if (replyingTo) {
      commentData.parent_id = replyingTo.parent_id || replyingTo.id;
    }

    // Optimistic insert
    const optId = `opt-${Date.now()}`;
    const optComment: any = {
      id: optId,
      ...commentData,
      created_at: new Date().toISOString(),
      profiles: { full_name: "You", avatar_url: null },
      _optimistic: true,
    };
    if (replyingTo) {
      optComment._replyToName = replyingTo.profiles?.full_name;
    }

    setAllComments((prev) => [...prev, optComment]);
    setText("");

    if (replyingTo) {
      const threadId = replyingTo.parent_id || replyingTo.id;
      setExpandedThreads((prev) => new Set([...prev, threadId]));
    }
    setReplyingTo(null);

    const { data, error } = await createComment(commentData);
    setSending(false);

    if (!error && data) {
      setAllComments((prev) => prev.map((c) => (c.id === optId ? { ...data, _replyToName: optComment._replyToName } : c)));
      onCommentAdded?.(postId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setAllComments((prev) => prev.filter((c) => c.id !== optId));
    }
  };

  const handleQuickReaction = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText((prev) => prev + emoji);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Build flat list data
  const listData = useMemo(() => {
    const result: any[] = [];
    topLevel.forEach((comment) => {
      const replies = repliesByParent[comment.id] || [];
      result.push({ _type: "comment", _data: comment, _replyCount: replies.length });
      if (expandedThreads.has(comment.id)) {
        replies.forEach((reply) => {
          // Attach reply-to name for @mention
          const parentComment = allComments.find((c) => c.id === comment.id);
          const replyToName = reply._replyToName || parentComment?.profiles?.full_name;
          result.push({ _type: "reply", _data: { ...reply, _replyToName: replyToName }, _replyCount: 0 });
        });
      }
    });
    return result;
  }, [topLevel, repliesByParent, expandedThreads, allComments]);

  const totalCount = allComments.length;

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const c = item._data;
      const isReply = item._type === "reply";
      const isOP = c.user_id === postAuthorId;
      return (
        <CommentRow
          comment={c}
          isReply={isReply}
          isOP={isOP}
          liked={likedSet.has(c.id)}
          likesCount={likeCounts[c.id] || 0}
          replyCount={item._replyCount}
          expanded={expandedThreads.has(c.id)}
          onLike={handleLikeComment}
          onReply={handleReply}
          onToggle={isReply ? undefined : () => toggleThread(c.id)}
          idx={index}
        />
      );
    },
    [likedSet, likeCounts, expandedThreads, postAuthorId, handleLikeComment, handleReply, toggleThread],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable onPress={onClose} style={cStyles.overlay} />
        <View style={cStyles.sheet}>
          {/* Drag handle */}
          <View style={cStyles.dragHandleWrap}>
            <View style={cStyles.dragHandle} />
          </View>

          {/* Header */}
          <View style={cStyles.header}>
            <View style={cStyles.headerLeft}>
              <Text style={cStyles.headerTitle}>Comments</Text>
              {totalCount > 0 && (
                <View style={cStyles.countBadge}>
                  <Text style={cStyles.countText}>{totalCount}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={cStyles.closeBtn}>
              <X color="#888" size={20} />
            </Pressable>
          </View>

          {/* Comments list */}
          {loading ? (
            <CommentSkeleton />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item._data.id}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, flexGrow: 1 }}
              ListEmptyComponent={<EmptyComments onFocus={() => inputRef.current?.focus()} />}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Reply context banner */}
          {replyingTo && (
            <Animated.View entering={FadeInUp.duration(200)} style={cStyles.replyBanner}>
              <View style={cStyles.replyBannerLeft}>
                <View style={cStyles.replyBannerLine} />
                <Text style={cStyles.replyBannerText} numberOfLines={1}>
                  Replying to <Text style={cStyles.replyBannerName}>{replyingTo.profiles?.full_name || "someone"}</Text>
                </Text>
              </View>
              <Pressable onPress={cancelReply} hitSlop={10}>
                <X color="#888" size={16} />
              </Pressable>
            </Animated.View>
          )}

          {/* Quick reactions */}
          <View style={cStyles.reactionsRow}>
            {QUICK_REACTIONS.map((emoji) => (
              <Pressable key={emoji} onPress={() => handleQuickReaction(emoji)} style={cStyles.reactionBtn}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Input */}
          <View style={cStyles.inputRow}>
            <TextInput
              ref={inputRef}
              placeholder={replyingTo ? `Reply to ${replyingTo.profiles?.full_name || "..."}` : "Add a comment..."}
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              style={cStyles.input}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim() || sending}
              style={({ pressed }) => [cStyles.sendBtn, (!text.trim() || sending) && { opacity: 0.3 }, pressed && { transform: [{ scale: 0.9 }] }]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Send color="#fff" size={16} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#0E0E22",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: 340,
    borderTopWidth: 1,
    borderTopColor: "#1E1E38",
  },
  dragHandleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  countBadge: {
    backgroundColor: "#6C5CE720",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { color: "#6C5CE7", fontSize: 12, fontWeight: "700" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A30",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  emptySubtitle: { color: "#666", fontSize: 14, marginBottom: 20 },
  emptyBtn: { borderRadius: 12, overflow: "hidden" },
  emptyBtnInner: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Comment row
  row: { flexDirection: "row", gap: 10, paddingVertical: 12 },
  replyRow: { paddingLeft: 42, paddingVertical: 8 },
  threadLine: {
    position: "absolute",
    left: 15,
    top: -4,
    bottom: 4,
    width: 2,
    backgroundColor: "#6C5CE730",
    borderRadius: 1,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cName: { color: "#fff", fontSize: 13, fontWeight: "700" },
  opBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#6C5CE740",
  },
  opText: { color: "#6C5CE7", fontSize: 10, fontWeight: "700" },
  cTime: { color: "#555", fontSize: 11 },
  mention: { color: "#6C5CE7", fontSize: 13, fontWeight: "600", marginTop: 1 },
  cBody: { color: "#D0D0E0", fontSize: 14, lineHeight: 20, marginTop: 3 },
  cActions: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
  cActBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 28 },
  cActText: { color: "#555", fontSize: 12, fontWeight: "600" },
  replyLabel: { color: "#666", fontSize: 12, fontWeight: "700" },

  // Expand replies
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  expandLine: { width: 24, height: 1, backgroundColor: "#6C5CE740" },
  expandText: { color: "#6C5CE7", fontSize: 12, fontWeight: "600" },

  // Reply banner
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#141430",
    borderTopWidth: 1,
    borderTopColor: "#1E1E38",
  },
  replyBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  replyBannerLine: { width: 3, height: 16, borderRadius: 2, backgroundColor: "#6C5CE7" },
  replyBannerText: { color: "#888", fontSize: 13, flex: 1 },
  replyBannerName: { color: "#fff", fontWeight: "700" },

  // Quick reactions
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E1E38",
  },
  reactionBtn: {
    width: 42,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A30",
    alignItems: "center",
    justifyContent: "center",
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#1A1A30",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#2A2A45",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Post Card ────────────────────────────────────────────────────

function PostImage({ uri }: { uri: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.postImageWrap}>
      {loading && (
        <View style={styles.postImagePlaceholder}>
          <ActivityIndicator color={theme.colors.primary.DEFAULT} size="small" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={styles.postImage}
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
}

const PostCard = memo(function PostCard({
  post,
  index,
  liked,
  likesCount,
  commentCount,
  onLike,
  onComment,
}: {
  post: any;
  index: number;
  liked: boolean;
  likesCount: number;
  commentCount: number;
  onLike: (postId: string) => void;
  onComment: (postId: string, authorId?: string) => void;
}) {
  const scale = useSharedValue(1);
  const likeScale = useSharedValue(1);
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.friend_circle;
  const badge = getPostBadge(post, likesCount);
  const hasImage = post.image_urls?.length > 0;

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const likeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    onLike(post.id);
  };

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index * 70, 350)).springify().damping(14)}>
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={[styles.postCard, cardStyle]}
      >
        {/* Gradient fill */}
        <LinearGradient
          colors={["#1E1E38", "#16162A"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Content area with left accent strip */}
        <View style={styles.postContentArea}>
          <View style={[styles.postAccentStrip, { backgroundColor: typeConfig.text }]} />

          {/* Type badge + badge + time */}
          <View style={styles.postTopRow}>
            <View style={styles.postTopLeft}>
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                <Text style={{ fontSize: 11 }}>{typeConfig.emoji}</Text>
                <Text style={[styles.typeBadgeText, { color: typeConfig.text }]}>{typeConfig.label}</Text>
              </View>
              {badge && (
                <View style={[styles.engagementBadge, { backgroundColor: badge.color + "20" }]}>
                  <Text style={[styles.engagementBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>{getTimeAgo(post.created_at)}</Text>
          </View>

          {/* Author */}
          <View style={styles.postAuthor}>
            {post.profiles?.avatar_url ? (
              <Image source={{ uri: post.profiles.avatar_url }} style={styles.postAvatar} />
            ) : (
              <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>
                  {post.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                </Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.postAuthorName}>{post.profiles?.full_name || "Anonymous"}</Text>
              <Text style={styles.postUni}>{post.universities?.short_name || ""}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.postTitle}>{post.title}</Text>
        </View>

        {/* Image (outside content area so accent strip doesn't extend behind it) */}
        {hasImage && <PostImage uri={post.image_urls[0]} />}

        {/* Bottom content area */}
        <View style={styles.postBottomArea}>
          {/* Body */}
          {post.body ? (
            <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>
          ) : null}

          {/* Type-specific metadata */}
          <PostMetadata post={post} />

          {/* Actions */}
          <View style={styles.postActions}>
            <Pressable onPress={handleLike} style={styles.actionRow}>
              <Animated.View style={likeStyle}>
                <Heart
                  color={liked ? "#FF6B6B" : theme.colors.dark.textMuted}
                  fill={liked ? "#FF6B6B" : "transparent"}
                  size={18}
                />
              </Animated.View>
              <Text style={[styles.actionCount, liked && { color: "#FF6B6B" }]}>{likesCount}</Text>
            </Pressable>
            <Pressable onPress={() => onComment(post.id, post.user_id)} style={styles.actionRow}>
              <MessageCircle color={theme.colors.dark.textMuted} size={18} />
              <Text style={styles.actionCount}>{commentCount}</Text>
            </Pressable>
            {likesCount === 0 && commentCount === 0 && (
              <Text style={styles.beFirstText}>Be first to interact · earn XP</Text>
            )}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Main Home Screen ────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const streak = useStreak();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("For You");
  const [sessionLikes, setSessionLikes] = useState(0);
  const [newMembersCount, setNewMembersCount] = useState(0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentPostAuthorId, setCommentPostAuthorId] = useState<string | null>(null);
  const [optimisticCommentCounts, setOptimisticCommentCounts] = useState<Record<string, number>>({});

  const handleOpenComments = useCallback((postId: string, authorId?: string) => {
    setCommentPostId(postId);
    setCommentPostAuthorId(authorId || null);
  }, []);

  const handleCommentAdded = useCallback((postId: string) => {
    setOptimisticCommentCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + 1,
    }));
  }, []);

  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { liked: boolean; count: number }>>({});

  // ─── Queries ───

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });
  const profile = profileData?.data as any;

  const { data: notifData } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user,
  });
  const unreadCount = (notifData?.data as any[])?.filter((n: any) => !n.read).length || 0;

  const buildFilters = useCallback(() => {
    const base: Record<string, any> = { page: 1, limit: 20 };
    if (activeFilter === "Campus" && profile?.university_id) {
      base.university_id = profile.university_id;
    }
    return base;
  }, [activeFilter, profile?.university_id]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", "home", activeFilter, profile?.university_id],
    queryFn: () => getPosts(buildFilters()),
  });

  const rawPosts = (data?.data as any[]) || [];
  const postIds = useMemo(() => rawPosts.map((p) => p.id), [rawPosts]);

  const { data: likedIdsSet } = useQuery({
    queryKey: ["likedIds", "post", user?.id, postIds],
    queryFn: () => getUserLikedIds(user!.id, "post", postIds),
    enabled: !!user && postIds.length > 0,
  });

  const { data: likesCountMap } = useQuery({
    queryKey: ["likesCount", "post", postIds],
    queryFn: () => getBatchLikesCount("post", postIds),
    enabled: postIds.length > 0,
  });

  // ─── Display posts (sorted for "Hot", filtered for "Fresh") ───

  const posts = useMemo(() => {
    if (activeFilter === "Hot") {
      return [...rawPosts].sort((a, b) => {
        const aLikes = optimisticLikes[a.id]?.count ?? likesCountMap?.get(a.id) ?? 0;
        const bLikes = optimisticLikes[b.id]?.count ?? likesCountMap?.get(b.id) ?? 0;
        const aScore = aLikes + (a.comments?.[0]?.count || 0);
        const bScore = bLikes + (b.comments?.[0]?.count || 0);
        return bScore - aScore;
      });
    }
    if (activeFilter === "Fresh") {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return rawPosts.filter((p) => new Date(p.created_at).getTime() > cutoff);
    }
    return rawPosts;
  }, [rawPosts, activeFilter, likesCountMap, optimisticLikes]);

  // ─── Posts today (for campus pulse) ───

  const postsToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rawPosts.filter((p) => new Date(p.created_at) >= today).length;
  }, [rawPosts]);

  // ─── Like handler (refs keep callback stable to prevent PostCard re-renders) ───

  const optimisticLikesRef = useRef(optimisticLikes);
  optimisticLikesRef.current = optimisticLikes;
  const likedIdsSetRef = useRef(likedIdsSet);
  likedIdsSetRef.current = likedIdsSet;
  const likesCountMapRef = useRef(likesCountMap);
  likesCountMapRef.current = likesCountMap;

  const handleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const currentLiked = optimisticLikesRef.current[postId]?.liked ?? likedIdsSetRef.current?.has(postId) ?? false;
    const currentCount = optimisticLikesRef.current[postId]?.count ?? likesCountMapRef.current?.get(postId) ?? 0;

    setOptimisticLikes((prev) => ({
      ...prev,
      [postId]: {
        liked: !currentLiked,
        count: currentLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
      },
    }));

    if (!currentLiked) {
      setSessionLikes((prev) => prev + 1);
    }

    try {
      await toggleLike(user.id, "post", postId);
    } catch {
      setOptimisticLikes((prev) => ({
        ...prev,
        [postId]: { liked: currentLiked, count: currentCount },
      }));
    }
  }, [user]);

  const isPostLiked = useCallback(
    (postId: string) => optimisticLikes[postId]?.liked ?? likedIdsSet?.has(postId) ?? false,
    [optimisticLikes, likedIdsSet],
  );

  const getPostLikesCount = useCallback(
    (postId: string) => optimisticLikes[postId]?.count ?? likesCountMap?.get(postId) ?? 0,
    [optimisticLikes, likesCountMap],
  );

  // ─── Refresh ───

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setOptimisticLikes({});
    setOptimisticCommentCounts({});
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["likedIds"] }),
      queryClient.invalidateQueries({ queryKey: ["likesCount"] }),
    ]);
    setRefreshing(false);
  }, [refetch, queryClient]);

  // ─── Render helpers ───

  const getPostCommentCount = useCallback(
    (postId: string, post: any) => (post.comments?.[0]?.count || 0) + (optimisticCommentCounts[postId] || 0),
    [optimisticCommentCounts],
  );

  const renderPost = useCallback(
    ({ item: post, index }: { item: any; index: number }) => (
      <PostCard
        post={post}
        index={index}
        liked={isPostLiked(post.id)}
        likesCount={getPostLikesCount(post.id)}
        commentCount={getPostCommentCount(post.id, post)}
        onLike={handleLike}
        onComment={handleOpenComments}
      />
    ),
    [isPostLiked, getPostLikesCount, getPostCommentCount, handleLike, handleOpenComments],
  );

  const navigateCreate = useCallback(() => router.push("/(tabs)/create"), [router]);

  const headerElement = useMemo(() => (
    <View style={{ gap: 10, marginBottom: 4 }}>
      <HomeHeader
        profile={profile}
        profileLoading={profileLoading}
        unreadCount={unreadCount}
        streak={streak}
      />
      {!profileLoading && (
        <CampusPulseBar
          postsToday={postsToday}
          newMembersCount={newMembersCount}
          uniName={profile?.universities?.short_name}
        />
      )}
      {user && (
        <NewMembersSection
          currentUserId={user.id}
          universityId={profile?.university_id}
          onCountChange={setNewMembersCount}
        />
      )}
      <DailyMissionsCard
        sessionLikes={sessionLikes}
        postsLoaded={posts.length}
        onNavigateCreate={navigateCreate}
      />
      <SmartFilterTabs active={activeFilter} onChange={setActiveFilter} />
    </View>
  ), [profile, profileLoading, unreadCount, streak, postsToday, newMembersCount, user, sessionLikes, posts.length, activeFilter, navigateCreate]);

  const renderEmpty = () => {
    if (isError) {
      return (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>Pull down to try again.</Text>
        </View>
      );
    }
    if (activeFilter === "Fresh") {
      return (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
          <Text style={{ fontSize: 44 }}>🆕</Text>
          <Text style={styles.emptyTitle}>Nothing posted in 24h</Text>
          <Text style={styles.emptySubtitle}>Be the first to share something fresh!</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/create")}
            style={styles.emptyCtaBtn}
          >
            <LinearGradient colors={["#6C5CE7", "#8B7CF6"]} style={styles.emptyCtaBtnInner}>
              <Text style={styles.emptyCtaBtnText}>Post now · earn XP 🚀</Text>
            </LinearGradient>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={{ gap: 16 }}>
        <DailySparkCard />
        <CategoryStrip />
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: 16, paddingTop: insets.top + 8, gap: 12 }}>
      <HomeHeader profile={null} profileLoading unreadCount={0} streak={0} />
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          entering={FadeInUp.delay(i * 100).springify()}
          style={styles.skeletonCard}
        >
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: "60%" }]} />
          <View style={[styles.skeletonLine, { width: "80%", height: 12 }]} />
        </Animated.View>
      ))}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#0D0D1F", "#0F0F1A"]} style={StyleSheet.absoluteFillObject} />
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Orb color="#6C5CE7" size={260} x={-80} y={-60} />
          <Orb color="#00CEC9" size={180} x={W - 100} y={120} delay={400} />
        </View>
        {renderSkeleton()}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0D0D1F", "#0F0F1A", "#0A0A14"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Orb color="#6C5CE7" size={260} x={-80} y={-60} />
        <Orb color="#00CEC9" size={180} x={W - 100} y={120} delay={400} />
        <Orb color="#FF6B6B" size={140} x={W * 0.2} y={500} delay={800} />
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 100,
        }}
        style={{ flex: 1, backgroundColor: "transparent" }}
        ListHeaderComponent={headerElement}
        ListEmptyComponent={renderEmpty}
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
      {user && (
        <CommentModal
          postId={commentPostId}
          postAuthorId={commentPostAuthorId}
          visible={!!commentPostId}
          onClose={() => setCommentPostId(null)}
          onCommentAdded={handleCommentAdded}
          userId={user.id}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarContainer: {
    shadowColor: theme.colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary.DEFAULT + "50",
  },
  avatarText: { color: "white", fontWeight: "700", fontSize: 16 },
  greetingText: { color: theme.colors.dark.textMuted, fontSize: 11, fontWeight: "500" },
  nameText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // XP row (inline in header)
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  xpLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  xpLevelLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  xpBarTrack: {
    flex: 1,
    maxWidth: 70,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#ffffff15",
    overflow: "hidden",
  },
  xpBarFill: {
    height: 3,
    borderRadius: 2,
  },
  xpValue: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Streak badge
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF6B6B18",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FF6B6B30",
  },
  streakText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "800",
  },

  // Bell
  bellButton: { position: "relative", padding: 8 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: theme.colors.accent.coral,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.dark.bg,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Campus Pulse Bar
  pulseBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6C5CE720",
  },
  pulseLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#55EFC4",
  },
  pulseLabel: {
    color: theme.colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  pulseStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pulseStat: {
    alignItems: "center",
  },
  pulseStatNum: {
    color: "#6C5CE7",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  pulseStatLabel: {
    color: theme.colors.dark.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },

  // New Members
  nmHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  nmTitle: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  nmSubtitle: { color: "#555", fontSize: 12, marginTop: 2 },
  nmCountBadge: {
    backgroundColor: "#6C5CE720",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#6C5CE730",
  },
  nmCountText: { color: "#6C5CE7", fontSize: 12, fontWeight: "700" },
  nmCard: {
    width: CARD_W,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  nmCardInner: {
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#6C5CE720",
    borderRadius: 18,
  },
  nmAvatarWrap: { position: "relative", alignSelf: "flex-start", marginBottom: 4 },
  nmAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#6C5CE740",
  },
  nmInitials: { color: "#fff", fontSize: 18, fontWeight: "800" },
  nmNewBadge: {
    position: "absolute",
    bottom: -2,
    right: -6,
    backgroundColor: "#55EFC4",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#111128",
  },
  nmNewText: { fontSize: 8, fontWeight: "900", color: "#000", letterSpacing: 0.5 },
  nmName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  nmUni: { color: "#666", fontSize: 11, marginTop: -4 },
  nmVibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  nmVibeText: { fontSize: 11, fontWeight: "700" },
  nmGoalRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  nmGoalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nmGoalText: { fontSize: 10, fontWeight: "600" },
  nmHelloBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#6C5CE7",
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 4,
  },
  nmHelloBtnSent: { backgroundColor: "#55EFC420", borderWidth: 1, borderColor: "#55EFC440" },
  nmHelloBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Daily Missions Card
  missionsCard: {
    borderRadius: 18,
    padding: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6C5CE725",
  },
  missionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  missionsTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6C5CE720",
    alignItems: "center",
    justifyContent: "center",
  },
  missionsTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  missionsSubtitle: { color: theme.colors.dark.textMuted, fontSize: 11, marginTop: 1 },
  missionsBadge: {
    backgroundColor: "#6C5CE725",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  missionsBadgeText: { color: "#A29BFE", fontSize: 11, fontWeight: "700" },
  missionsProgressBg: {
    height: 4,
    backgroundColor: "#ffffff10",
    borderRadius: 2,
    overflow: "hidden",
  },
  missionsProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff06",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  missionRowDone: { backgroundColor: "#55EFC408" },
  missionRowBonus: { backgroundColor: "#FDCB6E08", borderWidth: 1, borderColor: "#FDCB6E20" },
  missionCheck: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  missionLabel: { flex: 1, color: theme.colors.dark.textSecondary, fontSize: 13, fontWeight: "500" },
  missionLabelDone: { textDecorationLine: "line-through", color: "#444" },
  missionXpBadge: {
    backgroundColor: "#6C5CE720",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  missionXpBadgeDone: { backgroundColor: "#55EFC420" },
  missionXpText: { color: "#A29BFE", fontSize: 11, fontWeight: "700" },
  missionXpTextDone: { color: "#55EFC4" },

  // Smart Filter Tabs
  filterRow: {
    gap: 8,
    paddingRight: 4,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.dark.surface,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  filterPillActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterPillText: { color: theme.colors.dark.textSecondary, fontSize: 13, fontWeight: "600" },
  filterPillTextActive: { color: "white", fontSize: 13, fontWeight: "700" },

  // Daily Spark Card
  sparkSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sparkDayBadge: {
    backgroundColor: "#6C5CE720",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#6C5CE730",
  },
  sparkDayText: { color: "#A29BFE", fontSize: 11, fontWeight: "700" },
  sparkCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6C5CE730",
    minHeight: 200,
  },
  sparkShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    transform: [{ skewX: "-20deg" }],
  },
  sparkTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sparkContent: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkPrompt: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  sparkFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  sparkXpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FDCB6E20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FDCB6E30",
  },
  sparkXpText: { color: "#FDCB6E", fontSize: 12, fontWeight: "700" },
  sparkCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#6C5CE725",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#6C5CE740",
  },
  sparkCtaText: { color: "#A29BFE", fontSize: 13, fontWeight: "700" },

  // Category Strip
  catChip: {
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 90,
    borderWidth: 1,
    overflow: "hidden",
  },
  catChipLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  catChipXpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catChipXpText: { fontSize: 10, fontWeight: "700" },

  // Section label
  sectionTitle: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 10,
  },

  // Post Card
  postCard: {
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#ffffff10",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  postContentArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    position: "relative",
  },
  postBottomArea: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  postAccentStrip: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  postTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  postTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  engagementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  engagementBadgeText: { fontSize: 10, fontWeight: "700" },
  timeText: { color: theme.colors.dark.textMuted, fontSize: 11 },
  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { color: "white", fontWeight: "bold", fontSize: 13 },
  postAuthorName: { color: theme.colors.dark.textPrimary, fontWeight: "600", fontSize: 13 },
  postUni: { color: theme.colors.dark.textMuted, fontSize: 11 },
  postTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 22,
  },
  postImageWrap: {
    width: "100%",
    height: 200,
    backgroundColor: "#0D0D20",
    position: "relative",
  },
  postImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  postImage: {
    width: "100%",
    height: 200,
  },
  postBody: {
    color: theme.colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#ffffff08",
  },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { color: theme.colors.dark.textMuted, fontSize: 13, fontWeight: "500" },
  beFirstText: {
    color: "#6C5CE7",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: "auto" as any,
  },

  // Metadata
  metaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  metaCard: {
    marginTop: 8,
    backgroundColor: theme.colors.dark.surfaceLight,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  metaCardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaChipContent: {
    fontSize: 11,
  },
  metaChipLabel: {
    fontWeight: "500",
    fontSize: 11,
  },
  metaChipValue: {
    fontWeight: "700",
    fontSize: 11,
  },
  metaStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.dark.surfaceLight,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  metaText: { color: theme.colors.dark.textSecondary, fontSize: 12, fontWeight: "500" },
  lostFoundBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  // Empty state
  emptyTitle: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  emptySubtitle: {
    color: theme.colors.dark.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyCtaBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  emptyCtaBtnInner: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  emptyCtaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Skeleton
  skeletonLineSmall: {
    height: 10, width: 60, borderRadius: 5,
    backgroundColor: theme.colors.dark.surfaceLight,
  },
  skeletonCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.surfaceLight,
    width: "100%",
  },
});
