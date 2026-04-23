import {
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  FadeIn,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "./_layout";

// ─── Keys ────────────────────────────────────────────────────────
export const ONBOARDING_KEY = "fc_onboarding_v1";
export const VIBE_KEY = "fc_vibe_v1";
export const GOALS_KEY = "fc_goals_v1";

const { width: W, height: H } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Vibe Data ───────────────────────────────────────────────────
export const VIBES = [
  { id: "study_grinder", emoji: "📚", label: "Study Grinder", desc: "Library is home", color: "#A29BFE" },
  { id: "social_butterfly", emoji: "🦋", label: "Social Butterfly", desc: "Knows everyone", color: "#FF6B6B" },
  { id: "tech_geek", emoji: "💻", label: "Tech Geek", desc: "Building the future", color: "#00CEC9" },
  { id: "sports_fanatic", emoji: "🏃", label: "Sports Fanatic", desc: "Always on the field", color: "#55EFC4" },
  { id: "creative_soul", emoji: "🎨", label: "Creative Soul", desc: "Art is everything", color: "#FDCB6E" },
  { id: "night_owl", emoji: "🌙", label: "Night Owl", desc: "Peaks after midnight", color: "#6C5CE7" },
  { id: "chai_philosopher", emoji: "☕", label: "Chai Lover", desc: "Deep convos only", color: "#E17055" },
  { id: "entrepreneur", emoji: "🚀", label: "Entrepreneur", desc: "Side hustle always on", color: "#74B9FF" },
];

// ─── Goals Data ──────────────────────────────────────────────────
export const GOALS = [
  { id: "study_partners", emoji: "📖", label: "Study Partners", color: "#A29BFE" },
  { id: "new_friends", emoji: "🤝", label: "New Friends", color: "#FF6B6B" },
  { id: "roommate", emoji: "🏠", label: "Roommate", color: "#55EFC4" },
  { id: "jobs", emoji: "💼", label: "Jobs & Gigs", color: "#FDCB6E" },
  { id: "gaming", emoji: "🎮", label: "Gaming Crew", color: "#6C5CE7" },
  { id: "music", emoji: "🎵", label: "Jam Session", color: "#00CEC9" },
  { id: "rides", emoji: "🚗", label: "Ride Shares", color: "#74B9FF" },
  { id: "food", emoji: "🍕", label: "Food Buddies", color: "#E17055" },
];

// ─── Animated Floating Orb ───────────────────────────────────────
function FloatingOrb({ color, size, x, y, delay }: {
  color: string; size: number; x: number; y: number; delay: number;
}) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);

  useState(() => {
    opacity.value = withDelay(delay, withTiming(0.2, { duration: 1500 }));
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-24, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
          withTiming(24, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true
      )
    );
  });

  return (
    <Animated.View
      style={[useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: ty.value }] })),
        { position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color, left: x, top: y }
      ]}
    />
  );
}

// ─── Vibe Card (single-select) ───────────────────────────────────
function VibeCard({ vibe, selected, onSelect }: {
  vibe: typeof VIBES[0]; selected: boolean; onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 11, stiffness: 120 });
    glowOpacity.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect();
      }}
      style={[
        styles.vibeCard,
        { borderColor: selected ? vibe.color : "#252540" },
        selected && { backgroundColor: vibe.color + "18" },
        cardStyle,
      ]}
    >
      {/* Glow bg */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: vibe.color + "10" }, glowStyle]}
      />
      <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
      <Text style={[styles.vibeLabel, selected && { color: vibe.color }]}>{vibe.label}</Text>
      <Text style={styles.vibeDesc}>{vibe.desc}</Text>
      {selected && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.vibeCheckmark, { backgroundColor: vibe.color }]}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>✓</Text>
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

// ─── Goal Chip (multi-select) ────────────────────────────────────
function GoalChip({ goal, selected, onToggle }: {
  goal: typeof GOALS[0]; selected: boolean; onToggle: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.08 : 1, { damping: 12, stiffness: 140 });
  }, [selected]);

  const chipStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={[
        styles.goalChip,
        {
          borderColor: selected ? goal.color : "#252540",
          backgroundColor: selected ? goal.color + "22" : "#16162A",
        },
        chipStyle,
      ]}
    >
      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
      <Text style={[styles.goalLabel, selected && { color: goal.color }]}>{goal.label}</Text>
      {selected && <Text style={[styles.goalCheck, { color: goal.color }]}>✓</Text>}
    </AnimatedPressable>
  );
}

// ─── Slide 0: Welcome ─────────────────────────────────────────────
function WelcomeSlide() {
  const pulse = useSharedValue(1);

  useState(() => {
    pulse.value = withRepeat(
      withSequence(withSpring(1.08, { damping: 8 }), withSpring(1, { damping: 8 })),
      -1, true
    );
  });

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.slideWrap}>
      <FloatingOrb color="#6C5CE7" size={260} x={-80} y={-40} delay={0} />
      <FloatingOrb color="#FF6B6B" size={180} x={W - 110} y={80} delay={600} />
      <FloatingOrb color="#00CEC9" size={120} x={W * 0.25} y={H * 0.5} delay={300} />

      <View style={styles.slideInner}>
        <Animated.View entering={FadeIn.delay(100).duration(700)} style={styles.logoArea}>
          <Animated.View style={[styles.logoBubble, logoStyle]}>
            <LinearGradient colors={["#3D2FA0", "#1E1A4A"]} style={styles.logoBubbleInner}>
              <Text style={{ fontSize: 52 }}>🎓</Text>
            </LinearGradient>
          </Animated.View>
          <View style={styles.logoRing} />
          <View style={[styles.logoRing, styles.logoRing2]} />
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(300).duration(700)} style={styles.welcomeTitle}>
          {"FriendsCircle"}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(450).duration(700)} style={styles.welcomeTagline}>
          Your university's social home.{"\n"}Connect. Share. Rise.
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(650).duration(600)} style={styles.statsRow}>
          {[["🎓", "15K+", "Students"], ["🏫", "50+", "Universities"], ["📝", "100K+", "Posts"]].map(([icon, val, label]) => (
            <View key={label} style={styles.statBox}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(850).duration(500)} style={styles.swipeHint}>
          swipe to continue →
        </Animated.Text>
      </View>
    </View>
  );
}

// ─── Slide 1: Vibe Picker ────────────────────────────────────────
function VibeSlide({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.slideWrap}>
      <FloatingOrb color="#A29BFE" size={200} x={-60} y={20} delay={0} />
      <FloatingOrb color="#6C5CE7" size={140} x={W - 90} y={H * 0.4} delay={400} />

      <View style={[styles.slideInner, { paddingTop: 0 }]}>
        <Animated.Text entering={FadeIn.delay(100).duration(500)} style={styles.slideEmoji}>
          ✨
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(200).duration(500)} style={styles.slideTitle}>
          What's your{"\n"}campus vibe?
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(320).duration(500)} style={styles.slideSubtitle}>
          This shows on your intro card — be honest 😄
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.vibeGrid}>
          {VIBES.map((vibe, i) => (
            <Animated.View
              key={vibe.id}
              entering={FadeIn.delay(400 + i * 40).springify().damping(14)}
            >
              <VibeCard
                vibe={vibe}
                selected={selected === vibe.id}
                onSelect={() => onSelect(vibe.id)}
              />
            </Animated.View>
          ))}
        </Animated.View>

        {selected ? (
          <Animated.Text entering={FadeIn.duration(300)} style={styles.selectionHint}>
            {VIBES.find((v) => v.id === selected)?.emoji} {VIBES.find((v) => v.id === selected)?.label} selected
          </Animated.Text>
        ) : (
          <Text style={styles.selectionHintEmpty}>Pick one to continue</Text>
        )}
      </View>
    </View>
  );
}

// ─── Slide 2: Goals Picker ───────────────────────────────────────
function GoalsSlide({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.slideWrap}>
      <FloatingOrb color="#FF6B6B" size={180} x={-50} y={30} delay={0} />
      <FloatingOrb color="#FDCB6E" size={130} x={W - 80} y={H * 0.35} delay={300} />

      <View style={[styles.slideInner, { paddingTop: 0 }]}>
        <Animated.Text entering={FadeIn.delay(100).duration(500)} style={styles.slideEmoji}>
          🎯
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(200).duration(500)} style={styles.slideTitle}>
          What brings{"\n"}you here?
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(320).duration(500)} style={styles.slideSubtitle}>
          Pick up to 3 — others will see this on your card
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.goalGrid}>
          {GOALS.map((goal, i) => (
            <Animated.View
              key={goal.id}
              entering={FadeIn.delay(400 + i * 45).springify().damping(14)}
            >
              <GoalChip
                goal={goal}
                selected={selected.includes(goal.id)}
                onToggle={() => {
                  if (!selected.includes(goal.id) && selected.length >= 3) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    return;
                  }
                  onToggle(goal.id);
                }}
              />
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(800).duration(400)} style={styles.goalCounter}>
          <Text style={[
            styles.goalCounterText,
            { color: selected.length >= 3 ? "#55EFC4" : "#555" }
          ]}>
            {selected.length}/3 selected
            {selected.length >= 3 ? " ✓ Max reached" : ""}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Slide 3: Ready ───────────────────────────────────────────────
function ReadySlide({ vibeId, goalIds }: { vibeId: string; goalIds: string[] }) {
  const vibeObj = VIBES.find((v) => v.id === vibeId);
  const goalObjs = GOALS.filter((g) => goalIds.includes(g.id));

  return (
    <View style={styles.slideWrap}>
      <FloatingOrb color="#55EFC4" size={200} x={-60} y={40} delay={0} />
      <FloatingOrb color="#FDCB6E" size={140} x={W - 90} y={100} delay={300} />
      <FloatingOrb color="#6C5CE7" size={100} x={W * 0.3} y={H * 0.55} delay={200} />

      <View style={[styles.slideInner, { paddingTop: 0 }]}>
        <Animated.Text entering={FadeIn.delay(100).duration(600)} style={styles.slideEmoji}>
          🚀
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(200).duration(600)} style={styles.slideTitle}>
          Almost there!{"\n"}One last step
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(320).duration(600)} style={styles.slideSubtitle}>
          Add your name, university & photo — then your intro card goes live and classmates can say hello!
        </Animated.Text>

        {/* Summary of picked vibe/goals */}
        {vibeObj && (
          <Animated.View entering={FadeIn.delay(450).duration(400)} style={styles.readySummary}>
            <View style={[styles.readyVibeBadge, { backgroundColor: vibeObj.color + "20", borderColor: vibeObj.color + "40" }]}>
              <Text style={{ fontSize: 20 }}>{vibeObj.emoji}</Text>
              <Text style={[styles.readyVibeText, { color: vibeObj.color }]}>{vibeObj.label}</Text>
            </View>
            {goalObjs.length > 0 && (
              <View style={styles.readyGoalRow}>
                {goalObjs.map((g) => (
                  <View key={g.id} style={[styles.readyGoalChip, { backgroundColor: g.color + "18" }]}>
                    <Text style={{ fontSize: 12 }}>{g.emoji}</Text>
                    <Text style={[styles.readyGoalText, { color: g.color }]}>{g.label}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.readySavedHint}>✓ Your vibe & goals are saved</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.readyFeatures}>
          {[
            { emoji: "👋", text: "Classmates can say hello to you" },
            { emoji: "🔍", text: "Find people with matching goals" },
            { emoji: "📝", text: "Share posts with your university" },
          ].map((item, i) => (
            <Animated.View
              key={item.text}
              entering={FadeIn.delay(650 + i * 80).duration(400)}
              style={styles.readyFeatureRow}
            >
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              <Text style={styles.readyFeatureText}>{item.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Main Onboarding Screen ───────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markOnboardingDone } = useAuth();

  const [index, setIndex] = useState(0);
  const [goingForward, setGoingForward] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleSelectVibe = useCallback((id: string) => {
    setSelectedVibe((prev) => (prev === id ? "" : id));
  }, []);

  const handleToggleGoal = useCallback((id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }, []);

  const canProceed = useCallback(() => {
    if (index === 1) return selectedVibe !== ""; // vibe required
    return true; // goals and other slides: can skip
  }, [index, selectedVibe]);

  const complete = useCallback(async () => {
    await Promise.all([
      SecureStore.setItemAsync(ONBOARDING_KEY, "1"),
      selectedVibe ? SecureStore.setItemAsync(VIBE_KEY, selectedVibe) : Promise.resolve(),
      selectedGoals.length > 0
        ? SecureStore.setItemAsync(GOALS_KEY, JSON.stringify(selectedGoals))
        : Promise.resolve(),
    ]);
    markOnboardingDone(); // update _layout state before navigating
    router.replace("/auth");
  }, [selectedVibe, selectedGoals, router, markOnboardingDone]);

  const next = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSequence(withSpring(0.92), withSpring(1));
    if (index < 3) {
      setGoingForward(true);
      setIndex(index + 1);
    } else {
      complete();
    }
  }, [index, btnScale, complete]);

  const back = useCallback(() => {
    if (index > 0) {
      setGoingForward(false);
      setIndex(index - 1);
    }
  }, [index]);

  const isLast = index === 3;
  const TOTAL = 4;

  const renderSlide = () => {
    switch (index) {
      case 0: return <WelcomeSlide />;
      case 1: return <VibeSlide selected={selectedVibe} onSelect={handleSelectVibe} />;
      case 2: return <GoalsSlide selected={selectedGoals} onToggle={handleToggleGoal} />;
      case 3: return <ReadySlide vibeId={selectedVibe} goalIds={selectedGoals} />;
      default: return null;
    }
  };

  return (
    <LinearGradient colors={["#0A0A18", "#0F0F1A"]} style={styles.root}>
      {/* Top nav */}
      <View style={[styles.topNav, { paddingTop: insets.top + 12 }]}>
        {index > 0 ? (
          <Pressable onPress={back} style={styles.navBtn}>
            <Text style={styles.navBtnBack}>‹</Text>
          </Pressable>
        ) : <View style={styles.navBtn} />}

        {/* Progress dots */}
        <View style={styles.dots}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive, i < index && styles.dotDone]} />
          ))}
        </View>

        <View style={styles.navBtn} />
      </View>

      {/* Slide */}
      <Animated.View
        key={index}
        entering={goingForward ? SlideInRight.duration(340) : SlideInLeft.duration(340)}
        exiting={goingForward ? SlideOutLeft.duration(280) : SlideOutRight.duration(280)}
        style={{ flex: 1 }}
      >
        {renderSlide()}
      </Animated.View>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 24 }]}>
        <AnimatedPressable
          style={[styles.ctaBtn, btnStyle, !canProceed() && styles.ctaBtnDisabled]}
          onPress={next}
          disabled={!canProceed()}
        >
          <LinearGradient
            colors={isLast ? ["#55EFC4", "#00CEC9"] : ["#6C5CE7", "#5245C2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {isLast
                ? "Set Up Profile →"
                : index === 1 && !selectedVibe
                ? "Pick a vibe first"
                : "Continue →"}
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const CARD_W = (W - 56 - 10) / 2;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBtn: { width: 60, alignItems: "flex-start" },
  navBtnBack: { color: "#888", fontSize: 30, lineHeight: 34 },
  navSkip: { color: "#555", fontSize: 15, fontWeight: "500" },

  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#252545" },
  dotActive: { width: 22, height: 6, borderRadius: 3, backgroundColor: "#6C5CE7" },
  dotDone: { backgroundColor: "#55EFC430" },

  slideWrap: { flex: 1, overflow: "hidden" },
  slideInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Welcome slide
  logoArea: { alignItems: "center", justifyContent: "center", marginBottom: 28, width: 130, height: 130 },
  logoBubble: { width: 100, height: 100, borderRadius: 28, overflow: "hidden", zIndex: 1 },
  logoBubbleInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#6C5CE730",
  },
  logoRing2: { width: 140, height: 140, borderRadius: 70, borderColor: "#6C5CE715" },

  welcomeTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 10,
  },
  welcomeTagline: {
    fontSize: 16,
    color: "#7070A0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    gap: 0,
    backgroundColor: "#12122A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6C5CE720",
    overflow: "hidden",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#6C5CE715",
    gap: 2,
  },
  statVal: { fontSize: 18, fontWeight: "800", color: "#6C5CE7" },
  statLabel: { fontSize: 11, color: "#555", fontWeight: "500" },
  swipeHint: { color: "#333", fontSize: 13, marginTop: 24, letterSpacing: 0.3 },

  // Shared slide
  slideEmoji: { fontSize: 52, textAlign: "center", marginBottom: 12 },
  slideTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 14,
    color: "#6060A0",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  // Vibe grid
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    width: "100%",
  },
  vibeCard: {
    width: CARD_W,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#111126",
    alignItems: "flex-start",
    gap: 3,
    position: "relative",
  },
  vibeEmoji: { fontSize: 28, marginBottom: 2 },
  vibeLabel: { fontSize: 13, fontWeight: "700", color: "#ccc" },
  vibeDesc: { fontSize: 11, color: "#555" },
  vibeCheckmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionHint: { color: "#55EFC4", fontSize: 13, marginTop: 14, fontWeight: "600" },
  selectionHintEmpty: { color: "#444", fontSize: 13, marginTop: 14 },

  // Goal chips
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    width: "100%",
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  goalEmoji: { fontSize: 16 },
  goalLabel: { fontSize: 13, fontWeight: "600", color: "#888" },
  goalCheck: { fontSize: 11, fontWeight: "800", marginLeft: 2 },
  goalCounter: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#111126",
    borderRadius: 12,
  },
  goalCounterText: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  // Ready slide
  readySummary: {
    width: "100%",
    backgroundColor: "#111126",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#6C5CE720",
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  readyVibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  readyVibeText: { fontSize: 14, fontWeight: "700" },
  readyGoalRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  readyGoalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  readyGoalText: { fontSize: 12, fontWeight: "600" },
  readySavedHint: { fontSize: 12, color: "#55EFC4", fontWeight: "600" },
  readyFeatures: { width: "100%", gap: 10 },
  readyFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#111126",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#1E1E38",
  },
  readyFeatureText: { fontSize: 14, color: "#aaa", fontWeight: "500" },

  // CTA
  cta: { paddingHorizontal: 24, paddingTop: 12 },
  ctaBtn: { borderRadius: 16, overflow: "hidden" },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaGradient: { paddingVertical: 17, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
});
