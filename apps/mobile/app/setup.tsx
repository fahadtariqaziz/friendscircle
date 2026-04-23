import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useState, useCallback, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./_layout";
import {
  updateProfile,
  getUniversities,
  getCampuses,
  uploadImage,
} from "@friendscircle/supabase";
import { VIBE_KEY, GOALS_KEY, VIBES, GOALS } from "./onboarding";

const { width: W, height: H } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Per-step accent colors ───────────────────────────────────────
const STEP_CONFIG = [
  { label: "Name",       emoji: "👋", color: "#6C5CE7" },
  { label: "University", emoji: "🏫", color: "#00CEC9" },
  { label: "Interests",  emoji: "🎯", color: "#FDCB6E" },
  { label: "Photo",      emoji: "📸", color: "#FF6B6B" },
  { label: "Done",       emoji: "🎉", color: "#55EFC4" },
];

const INTERESTS = [
  { label: "Coding",       emoji: "💻" },
  { label: "Sports",       emoji: "⚽" },
  { label: "Music",        emoji: "🎵" },
  { label: "Art",          emoji: "🎨" },
  { label: "Gaming",       emoji: "🎮" },
  { label: "Photography",  emoji: "📸" },
  { label: "Travel",       emoji: "✈️" },
  { label: "Reading",      emoji: "📚" },
  { label: "Cooking",      emoji: "🍳" },
  { label: "Fitness",      emoji: "💪" },
  { label: "Movies",       emoji: "🎬" },
  { label: "Anime",        emoji: "⛩️" },
  { label: "Business",     emoji: "💼" },
  { label: "Design",       emoji: "✏️" },
  { label: "Writing",      emoji: "📝" },
  { label: "Science",      emoji: "🔬" },
  { label: "Fashion",      emoji: "👗" },
  { label: "Cricket",      emoji: "🏏" },
];

// ─── Confetti (custom Reanimated particles) ───────────────────────
const CONFETTI_COLORS = ["#6C5CE7", "#55EFC4", "#FF6B6B", "#FDCB6E", "#00CEC9", "#A29BFE", "#74B9FF"];

// Pre-compute particle configs so they're stable across renders
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  startX: (i / 32) * W + (i % 5) * 8,
  driftX: ((i % 7) - 3) * 40,
  size: 5 + (i % 4) * 2.5,
  speed: 900 + (i % 6) * 200,
  delay: (i % 5) * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotationEnd: 200 + (i % 4) * 200,
  isRect: i % 3 !== 0,
}));

function ConfettiParticle({ config }: { config: typeof PARTICLES[0] }) {
  const y = useSharedValue(-30);
  const x = useSharedValue(config.startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const { speed, delay, driftX, rotationEnd } = config;
    opacity.value = withDelay(delay, withTiming(1, { duration: 80 }));
    y.value = withDelay(delay, withTiming(H * 0.55, { duration: speed, easing: Easing.in(Easing.quad) }));
    x.value = withDelay(delay, withTiming(config.startX + driftX, { duration: speed }));
    rotation.value = withDelay(delay, withTiming(rotationEnd, { duration: speed }));
    opacity.value = withDelay(
      delay + speed * 0.55,
      withTiming(0, { duration: speed * 0.45 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: x.value,
    top: y.value,
    width: config.size,
    height: config.isRect ? config.size * 0.4 : config.size,
    borderRadius: config.isRect ? 1 : config.size / 2,
    backgroundColor: config.color,
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <Animated.View style={style} />;
}

function Confetti() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((config, i) => (
        <ConfettiParticle key={i} config={config} />
      ))}
    </View>
  );
}

// ─── Background orb ───────────────────────────────────────────────
function Orb({ color, size, x, y, delay = 0 }: {
  color: string; size: number; x: number; y: number; delay?: number;
}) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.16, { duration: 1000 }));
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
    <Animated.View style={[style, {
      position: "absolute", width: size, height: size,
      borderRadius: size / 2, backgroundColor: color, left: x, top: y,
    }]} />
  );
}

// ─── Segmented step bar (5 segments, first pre-filled) ───────────
function StepSegment({ filled, active, color }: {
  filled: boolean; active: boolean; color: string;
}) {
  const width = useSharedValue(filled && !active ? 1 : 0);

  useEffect(() => {
    width.value = withTiming(filled ? 1 : 0, {
      duration: active ? 450 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  return (
    <View style={styles.segmentTrack}>
      <Animated.View style={[styles.segmentFill, fillStyle, { backgroundColor: color }]} />
    </View>
  );
}

function StepBar({ current, color }: { current: number; color: string }) {
  return (
    <View style={styles.stepBar}>
      {/* Segment 0: Pre-filled "Vibe" from onboarding (endowed progress) */}
      <View style={styles.segmentTrack}>
        <View style={[styles.segmentFill, { width: "100%", backgroundColor: "#55EFC4" }]} />
      </View>
      {/* Segments 1-4: Setup steps */}
      {[0, 1, 2, 3].map((i) => (
        <StepSegment key={i} filled={i <= current} active={i === current} color={color} />
      ))}
    </View>
  );
}

// ─── Mini card preview (builds up above CTA each step) ───────────
function MiniCardPreview({ step, name, uniShort, interests, avatarUri, color }: {
  step: number; name: string; uniShort: string;
  interests: string[]; avatarUri: string | null; color: string;
}) {
  const initials = name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.miniCard}>
      <LinearGradient colors={["#151530", "#0F0F22"]} style={styles.miniCardInner}>
        {/* Avatar */}
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.miniCardAvatar} />
        ) : (
          <View style={[styles.miniCardAvatarPlaceholder, { backgroundColor: color + "25" }]}>
            <Text style={{ fontSize: 13, fontWeight: "800", color }}>
              {initials || "?"}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.miniCardName} numberOfLines={1}>
              {name || "Your Name"}
            </Text>
            <View style={styles.miniCardNewBadge}>
              <Text style={styles.miniCardNewText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.miniCardSub} numberOfLines={1}>
            {uniShort ? `🏫 ${uniShort}` : "add your uni →"}
          </Text>
          {interests.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.miniCardInterestRow}>
              {interests.map((label) => {
                const item = INTERESTS.find((i) => i.label === label);
                return item ? (
                  <View key={label} style={[styles.miniCardInterestChip, { backgroundColor: color + "18", borderColor: color + "30" }]}>
                    <Text style={{ fontSize: 10 }}>{item.emoji}</Text>
                    <Text style={[styles.miniCardInterestChipLabel, { color }]}>{label}</Text>
                  </View>
                ) : null;
              })}
            </Animated.View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Interest chip with bouncy animation ─────────────────────────
function InterestChip({ item, active, onToggle, color }: {
  item: { label: string; emoji: string };
  active: boolean;
  onToggle: () => void;
  color: string;
}) {
  const scale = useSharedValue(1);
  const chipStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(0.92, { duration: 70 }),
        withSpring(1, { damping: 14, stiffness: 220 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } else {
      scale.value = withSequence(
        withTiming(0.88, { duration: 70 }),
        withSpring(1.08, { damping: 6, stiffness: 280 }),
        withSpring(1.0, { damping: 14, stiffness: 220 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  }, [active, scale, onToggle]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.interestChip,
        active && { backgroundColor: color + "22", borderColor: color },
        chipStyle,
      ]}
    >
      <Text style={styles.interestEmoji}>{item.emoji}</Text>
      <Text style={[styles.interestLabel, active && { color, fontWeight: "700" }]}>
        {item.label}
      </Text>
    </AnimatedPressable>
  );
}

// ─── Step 0: Name ─────────────────────────────────────────────────
function NameStep({ value, onChange, color }: {
  value: string; onChange: (v: string) => void; color: string;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const borderProgress = useSharedValue(0);
  const glowHue = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    borderProgress.value = withTiming(focused ? 1 : 0, { duration: 220 });
    if (focused) {
      glowHue.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        -1, true
      );
    }
  }, [focused]);

  const inputWrapStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      glowHue.value,
      [0, 1],
      ["#6C5CE7", "#A29BFE"]
    );
    return {
      borderColor: focused ? borderColor : "#1E1E38",
      shadowOpacity: borderProgress.value * 0.35,
      shadowRadius: 14,
    };
  });

  const initials = value.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Animated.View
      entering={SlideInRight.duration(320)}
      exiting={SlideOutLeft.duration(260)}
      style={styles.stepContent}
    >
      <Orb color={color} size={220} x={-80} y={-40} />
      <Orb color="#A29BFE" size={140} x={W - 100} y={60} delay={300} />

      <Animated.Text entering={FadeIn.delay(80).duration(500)} style={styles.stepEmoji}>
        👋
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(160).duration(500)} style={styles.stepTitle}>
        What should{"\n"}we call you?
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(260).duration(500)} style={styles.stepSubtitle}>
        This is how classmates will find you.
      </Animated.Text>

      <Animated.View
        entering={FadeIn.delay(340).duration(400)}
        style={[styles.inputWrap, inputWrapStyle, { shadowColor: color }]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="e.g. Fatima Khan"
          placeholderTextColor="#333"
          value={value}
          onChangeText={onChange}
          returnKeyType="done"
          autoCapitalize="words"
          maxLength={50}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Animated.View>

      {value.trim().length >= 2 && (
        <Animated.View entering={FadeIn.duration(350)} style={styles.namePreview}>
          <LinearGradient colors={[color + "22", color + "10"]} style={styles.namePreviewGrad}>
            <View style={[styles.namePreviewAvatar, { backgroundColor: color + "30" }]}>
              <Text style={[styles.namePreviewInitials, { color }]}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.namePreviewHint}>Your card will show as</Text>
              <Text style={styles.namePreviewName}>{value.trim()}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Step 1: University ───────────────────────────────────────────
type University = { id: string; name: string; short_name: string; city: string };
type Campus = { id: string; name: string };

function UniversityStep({ selected, onSelect, color, firstName, onCustomText, initialSearch = "" }: {
  selected: { uni: University; campus: Campus | null } | null;
  onSelect: (uni: University, campus: Campus | null) => void;
  onCustomText: (text: string) => void;
  initialSearch?: string;
  color: string;
  firstName: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(selected?.uni ?? null);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(selected?.campus ?? null);
  const [loading, setLoading] = useState(true);

  // Notify parent of current typed text (for free-text fallback)
  useEffect(() => {
    if (!selectedUni) onCustomText(search);
  }, [search, selectedUni]);

  useEffect(() => {
    getUniversities().then(({ data }) => {
      if (data) setUniversities(data as University[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedUni) { setCampuses([]); return; }
    getCampuses(selectedUni.id).then(({ data }) => {
      if (data) setCampuses(data as Campus[]);
    });
  }, [selectedUni?.id]);

  const filtered = universities.filter((u) => {
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const haystack = `${u.name} ${u.short_name} ${u.city}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });

  const pickUni = useCallback((uni: University) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedUni(uni);
    setSelectedCampus(null);
    onSelect(uni, null);
    setSearch("");
    onCustomText(""); // clear custom text when a real uni is picked
  }, [onSelect, onCustomText]);

  const pickCampus = useCallback((campus: Campus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCampus(campus);
    if (selectedUni) onSelect(selectedUni, campus);
  }, [selectedUni, onSelect]);

  return (
    <Animated.View
      entering={SlideInRight.duration(320)}
      exiting={SlideOutLeft.duration(260)}
      style={styles.stepContent}
    >
      <Orb color={color} size={200} x={-60} y={-30} />
      <Orb color="#A29BFE" size={120} x={W - 80} y={80} delay={200} />

      <Animated.Text entering={FadeIn.delay(80).duration(500)} style={styles.stepEmoji}>🏫</Animated.Text>
      <Animated.Text entering={FadeIn.delay(160).duration(500)} style={styles.stepTitle}>
        {firstName ? `Nice, ${firstName}!\nWhere do you study?` : "Where do\nyou study?"}
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(260).duration(500)} style={styles.stepSubtitle}>
        Find your campus crew and uni-specific posts.
      </Animated.Text>

      {selectedUni ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.selectedUniCard}>
          <LinearGradient colors={[color + "20", color + "08"]} style={styles.selectedUniGrad}>
            <View style={styles.selectedUniRow}>
              <View style={[styles.uniBadge, { backgroundColor: color + "20" }]}>
                <Text style={[styles.uniBadgeText, { color }]}>
                  {selectedUni.short_name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedUniName}>{selectedUni.name}</Text>
                <Text style={styles.selectedUniCity}>{selectedUni.short_name} · {selectedUni.city}</Text>
              </View>
              <Pressable onPress={() => { setSelectedUni(null); setSelectedCampus(null); }}>
                <Text style={[styles.changeText, { color }]}>Change</Text>
              </Pressable>
            </View>

            {campuses.length > 0 && (
              <View style={styles.campusRow}>
                <Text style={styles.campusTitle}>Select campus:</Text>
                <View style={styles.campusChipsWrap}>
                  {campuses.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => pickCampus(c)}
                      style={[styles.campusChip, selectedCampus?.id === c.id && { backgroundColor: color, borderColor: color }]}
                    >
                      <Text style={[styles.campusChipText, selectedCampus?.id === c.id && { color: "#fff" }]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      ) : (
        <>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Search university..."
              placeholderTextColor="#333"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          {loading ? (
            <ActivityIndicator color={color} style={{ marginTop: 20 }} />
          ) : (
            <ScrollView style={styles.uniList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filtered.slice(0, 12).map((u, i) => (
                <Animated.View key={u.id} entering={FadeIn.delay(i * 30).duration(280)}>
                  <Pressable style={styles.uniItem} onPress={() => pickUni(u)}>
                    <View style={[styles.uniBadge, { backgroundColor: color + "18" }]}>
                      <Text style={[styles.uniBadgeText, { color }]}>{u.short_name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uniName} numberOfLines={1}>{u.name}</Text>
                      <Text style={styles.uniCity}>{u.city}</Text>
                    </View>
                    <Text style={{ color: "#333", fontSize: 18 }}>›</Text>
                  </Pressable>
                </Animated.View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </>
      )}
    </Animated.View>
  );
}

// ─── Step 2: Interests ────────────────────────────────────────────
function InterestsStep({ selected, onToggle, color, firstName }: {
  selected: string[]; onToggle: (label: string) => void; color: string; firstName: string;
}) {
  const handleToggle = useCallback((label: string) => {
    if (!selected.includes(label) && selected.length >= 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    onToggle(label);
  }, [selected, onToggle]);

  return (
    <Animated.View
      entering={SlideInRight.duration(320)}
      exiting={SlideOutLeft.duration(260)}
      style={styles.stepContent}
    >
      <Orb color={color} size={180} x={-50} y={-20} />
      <Orb color="#FF6B6B" size={120} x={W - 70} y={100} delay={200} />

      <Animated.Text entering={FadeIn.delay(80).duration(500)} style={styles.stepEmoji}>🎯</Animated.Text>
      <Animated.Text entering={FadeIn.delay(160).duration(500)} style={styles.stepTitle}>
        What's your scene?
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(260).duration(500)} style={styles.stepSubtitle}>
        {firstName ? `${firstName}, pick up to 8 — we'll make your feed 🔥` : "Pick up to 8 — we'll make your feed fire"}
      </Animated.Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ width: "100%" }}
        contentContainerStyle={{ paddingTop: 10 }}
      >
        <View style={styles.interestGrid}>
          {INTERESTS.map((item, i) => (
            <Animated.View key={item.label} entering={FadeIn.delay(280 + i * 22).duration(280)}>
              <InterestChip
                item={item}
                active={selected.includes(item.label)}
                onToggle={() => handleToggle(item.label)}
                color={color}
              />
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.interestCountRow}>
        <View style={[styles.interestCountPill, { backgroundColor: selected.length >= 8 ? color + "22" : "#111126" }]}>
          <Text style={[styles.interestCountText, selected.length >= 8 && { color }]}>
            {selected.length}/8{selected.length >= 8 ? " — you're maxed! ✓" : " selected"}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Step 3: Photo ────────────────────────────────────────────────
function PhotoStep({ avatarUri, uploading, onPick, color, firstName }: {
  avatarUri: string | null; uploading: boolean; onPick: () => void; color: string; firstName: string;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!avatarUri) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true
      );
    } else {
      pulse.value = withSpring(1);
    }
  }, [avatarUri]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View
      entering={SlideInRight.duration(320)}
      exiting={SlideOutLeft.duration(260)}
      style={styles.stepContent}
    >
      <Orb color={color} size={200} x={-60} y={20} />
      <Orb color="#FDCB6E" size={140} x={W - 80} y={60} delay={300} />

      <Animated.Text entering={FadeIn.delay(80).duration(500)} style={styles.stepEmoji}>📸</Animated.Text>
      <Animated.Text entering={FadeIn.delay(160).duration(500)} style={styles.stepTitle}>
        Drop a photo
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(260).duration(500)} style={styles.stepSubtitle}>
        {firstName
          ? `Lowkey, ${firstName} — faces get 3× more hellos.\nNo pressure though.`
          : "Faces get 3× more hellos. No pressure though."}
      </Animated.Text>

      <Pressable onPress={onPick} disabled={uploading}>
        <View style={styles.avatarPickerContainer}>
          <Animated.View style={[styles.avatarPickerWrap, pulseStyle]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
            ) : (
              <LinearGradient colors={["#1E1A3A", "#141428"]} style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 52 }}>👤</Text>
              </LinearGradient>
            )}
          </Animated.View>
          {/* Badge lives outside overflow:hidden so it's never clipped */}
          {!avatarUri && (
            <View style={[styles.avatarAddBadge, { backgroundColor: color }]}>
              <Text style={{ fontSize: 18, color: "#fff", fontWeight: "800", lineHeight: 22 }}>+</Text>
            </View>
          )}
          {avatarUri && (
            <View style={[styles.avatarEditBadge, { backgroundColor: color }]}>
              {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 14 }}>📷</Text>}
            </View>
          )}
        </View>
      </Pressable>

      {avatarUri ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.photoSuccessRow}>
          <View style={[styles.photoSuccessBadge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
            <Text style={[styles.photoSuccessText, { color }]}>✓ Looking good!</Text>
          </View>
          <Pressable onPress={onPick}>
            <Text style={styles.photoChangeText}>Change photo</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.Text entering={FadeIn.delay(400).duration(400)} style={styles.photoHint}>
          Tap to choose from gallery
        </Animated.Text>
      )}

      {!avatarUri && (
        <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.photoSkipNote}>
          <Text style={styles.photoSkipNoteText}>
            real talk: faceless profiles get ghosted 👻
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Step 4: Celebration ──────────────────────────────────────────
function CelebrationStep({ name, vibeId, goalIds, avatarUri, uniName }: {
  name: string; vibeId: string; goalIds: string[];
  avatarUri: string | null; uniName: string;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 70 }));
    opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const vibe = VIBES.find((v) => v.id === vibeId);
  const goals = GOALS.filter((g) => goalIds.includes(g.id));
  const initials = name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Animated.View entering={SlideInRight.duration(320)} style={styles.stepContent}>
      {/* Confetti burst */}
      <Confetti />

      <Orb color="#55EFC4" size={220} x={-70} y={-30} />
      <Orb color="#6C5CE7" size={140} x={W - 90} y={80} delay={200} />

      <Animated.Text style={[{ fontSize: 68, textAlign: "center", zIndex: 1 }, emojiStyle]}>
        🎉
      </Animated.Text>

      <Animated.Text entering={FadeIn.delay(300).duration(600)} style={styles.celebTitle}>
        You're in, {name || "friend"}!
      </Animated.Text>

      <Animated.Text entering={FadeIn.delay(440).duration(500)} style={styles.celebSubtitle}>
        Your card is live — classmates can already find you 👀
      </Animated.Text>

      {/* Real intro card */}
      <Animated.View entering={FadeIn.delay(580).springify().damping(12)} style={styles.introCardPreview}>
        <LinearGradient colors={["#1E1A3A", "#141428"]} style={styles.introCardGrad}>
          <View style={styles.introCardAvatarRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.introCardAvatarImg} />
            ) : (
              <LinearGradient colors={["#6C5CE7", "#A29BFE"]} style={styles.introCardAvatar}>
                <Text style={{ fontSize: initials ? 16 : 20, fontWeight: "800", color: "#fff" }}>
                  {initials || "👤"}
                </Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.introCardName} numberOfLines={1}>{name}</Text>
              {uniName ? <Text style={styles.introCardUni} numberOfLines={1}>🏫 {uniName}</Text> : null}
            </View>
            <View style={styles.introCardNewBadge}>
              <Text style={styles.introCardNewText}>NEW</Text>
            </View>
          </View>

          {vibe && (
            <View style={[styles.introCardVibeBadge, { backgroundColor: vibe.color + "20", borderColor: vibe.color + "40" }]}>
              <Text style={{ fontSize: 15 }}>{vibe.emoji}</Text>
              <Text style={[styles.introCardVibeText, { color: vibe.color }]}>{vibe.label}</Text>
            </View>
          )}

          {goals.length > 0 && (
            <View>
              <Text style={styles.introCardLookingFor}>Looking for:</Text>
              <View style={styles.introCardGoalRow}>
                {goals.map((g) => (
                  <View key={g.id} style={[styles.introCardGoalChip, { backgroundColor: g.color + "20" }]}>
                    <Text style={{ fontSize: 11 }}>{g.emoji}</Text>
                    <Text style={[styles.introCardGoalText, { color: g.color }]}>{g.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.introCardHelloBtn}>
            <Text style={styles.introCardHelloText}>👋  Say Hello</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.Text entering={FadeIn.delay(900).duration(400)} style={styles.celebNote}>
        🔒 You can hide this anytime from profile settings
      </Animated.Text>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export default function SetupScreen() {
  const { user, markProfileComplete } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [goingForward, setGoingForward] = useState(true);
  const [name, setName] = useState("");
  const [uniData, setUniData] = useState<{
    uni: { id: string; name: string; short_name: string; city: string };
    campus: { id: string; name: string } | null;
  } | null>(null);
  const [customUniText, setCustomUniText] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vibeId, setVibeId] = useState<string>("");
  const [goalIds, setGoalIds] = useState<string[]>([]);

  const currentColor = STEP_CONFIG[Math.min(step, STEP_CONFIG.length - 1)].color;
  // First name for personalization (cap at 12 chars to avoid overflow)
  const rawFirst = name.trim().split(" ")[0] ?? "";
  const firstName = rawFirst.length > 12 ? rawFirst.slice(0, 12) : rawFirst;

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(VIBE_KEY),
      SecureStore.getItemAsync(GOALS_KEY),
    ]).then(([v, g]) => {
      if (v) setVibeId(v);
      if (g) { try { setGoalIds(JSON.parse(g)); } catch {} }
    });
  }, []);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      // React Native FormData requires { uri, name, type } — not a plain URI string
      const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const type = asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`;
      const file = { uri: asset.uri, name: `avatar.${ext}`, type } as unknown as File;
      const uploadResult = await uploadImage(file, "avatars");
      setAvatarUri(uploadResult.secure_url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Upload Failed", e?.message ?? "Could not upload photo. Check your internet and try again.");
    }
    setUploadingAvatar(false);
  }, []);

  const toggleInterest = useCallback((label: string) => {
    setInterests((prev) => {
      if (prev.includes(label)) return prev.filter((i) => i !== label);
      if (prev.length >= 8) return prev;
      return [...prev, label];
    });
  }, []);

  const canContinue = useCallback(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return uniData !== null || customUniText.trim().length >= 2;
    if (step === 2) return interests.length >= 1;
    if (step === 3) return !uploadingAvatar;
    return true;
  }, [step, name, uniData, customUniText, uploadingAvatar, interests]);

  const saveAndFinish = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: name.trim(),
      ...(uniData?.uni && { university_id: uniData.uni.id }),
      ...(uniData?.campus && { campus_id: uniData.campus.id }),
      ...(interests.length > 0 && { interests }),
      ...(avatarUri && { avatar_url: avatarUri }),
      ...(vibeId && { vibe: vibeId }),
      ...(goalIds.length > 0 && { looking_for: goalIds }),
    });
    if (error) {
      setSaving(false);
      Alert.alert("Error", "Could not save profile. Please check your internet and try again.");
      return;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(VIBE_KEY),
      SecureStore.deleteItemAsync(GOALS_KEY),
    ]);
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    setSaving(false);
    markProfileComplete();
    setGoingForward(true);
    setStep(4);
  }, [user, name, uniData, interests, avatarUri, vibeId, goalIds, markProfileComplete, queryClient]);

  const next = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(withSpring(0.92), withSpring(1));
    if (step === 3) {
      await saveAndFinish();
    } else if (step === 4) {
      router.replace("/(tabs)");
    } else {
      setGoingForward(true);
      setStep((s) => s + 1);
    }
  }, [step, btnScale, saveAndFinish, router]);

  const back = useCallback(() => {
    if (step > 0 && step < 4) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGoingForward(false);
      setStep((s) => s - 1);
    }
  }, [step]);

  const skip = useCallback(() => {
    if (step === 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 3) saveAndFinish();
    else { setGoingForward(true); setStep((s) => s + 1); }
  }, [step, saveAndFinish]);

  const renderStep = () => {
    switch (step) {
      case 0: return <NameStep key="name" value={name} onChange={setName} color={currentColor} />;
      case 1: return (
        <UniversityStep
          key="uni"
          selected={uniData}
          onSelect={(uni, campus) => { setUniData({ uni, campus }); setCustomUniText(""); }}
          onCustomText={setCustomUniText}
          initialSearch={customUniText}
          color={currentColor}
          firstName={firstName}
        />
      );
      case 2: return (
        <InterestsStep
          key="interests"
          selected={interests}
          onToggle={toggleInterest}
          color={currentColor}
          firstName={firstName}
        />
      );
      case 3: return (
        <PhotoStep
          key="photo"
          avatarUri={avatarUri}
          uploading={uploadingAvatar}
          onPick={handlePickPhoto}
          color={currentColor}
          firstName={firstName}
        />
      );
      case 4: return (
        <CelebrationStep
          key="done"
          name={name}
          vibeId={vibeId}
          goalIds={goalIds}
          avatarUri={avatarUri}
          uniName={uniData?.uni?.short_name ?? customUniText.trim()}
        />
      );
      default: return null;
    }
  };

  const showBack = step > 0 && step < 4;
  const showSkip = false;
  const isFinal = step === 4;

  const ctaLabel = saving
    ? "Saving..."
    : isFinal
    ? "Let's go 🚀"
    : step === 3
    ? (uploadingAvatar ? "Uploading..." : "Finish setup →")
    : "Continue →";

  return (
    <LinearGradient colors={["#0A0A18", "#0F0F1A"]} style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }}>
          <View style={styles.header}>
            {showBack ? (
              <Pressable onPress={back} style={styles.navIconBtn} hitSlop={12}>
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>
            ) : <View style={styles.navIconBtn} />}

            <Text style={[styles.stepNameLabel, { color: step < 4 ? currentColor : "transparent" }]}>
              {step < 4 ? STEP_CONFIG[step].label : ""}
            </Text>

            {showSkip ? (
              <Pressable onPress={skip} hitSlop={12} style={styles.navIconBtn}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : <View style={styles.navIconBtn} />}
          </View>

          {/* 5-segment bar (1 pre-filled = endowed progress) */}
          {step < 4 && <StepBar current={step} color={currentColor} />}
        </View>

        {/* Step content */}
        <View style={{ flex: 1, overflow: "hidden" }}>{renderStep()}</View>

        {/* Mini card preview (builds up above CTA) */}
        {step < 4 && step >= 0 && (
          <MiniCardPreview
            step={step}
            name={name}
            uniShort={uniData?.uni?.short_name ?? customUniText.trim()}
            interests={interests}
            avatarUri={avatarUri}
            color={currentColor}
          />
        )}

        {/* CTA */}
        <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 16 }]}>
          <AnimatedPressable
              style={[styles.ctaBtn, btnStyle, !canContinue() && styles.ctaBtnDisabled]}
              onPress={next}
              disabled={!canContinue() || saving}
            >
              <LinearGradient
                colors={isFinal ? ["#55EFC4", "#00CEC9"] : [currentColor, currentColor + "BB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {saving || uploadingAvatar
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.ctaText}>{ctaLabel}</Text>
                }
              </LinearGradient>
            </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  navIconBtn: { width: 44, alignItems: "center" },
  backArrow: { fontSize: 32, color: "#555", lineHeight: 38 },
  skipText: { color: "#444", fontSize: 14, fontWeight: "600", textAlign: "right" },
  stepNameLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // Step bar
  stepBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 6,
    paddingTop: 2,
    gap: 5,
  },
  segmentTrack: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: "#1A1A30", overflow: "hidden",
  },
  segmentFill: { height: "100%", borderRadius: 2 },

  // Mini card preview
  miniCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E1E38",
  },
  miniCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  miniCardAvatar: { width: 40, height: 40, borderRadius: 20 },
  miniCardAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  miniCardName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  miniCardSub: { fontSize: 11, color: "#555", marginTop: 2 },
  miniCardNewBadge: {
    backgroundColor: "#55EFC415",
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: "#55EFC430",
  },
  miniCardNewText: { fontSize: 9, fontWeight: "800", color: "#55EFC4" },
  miniCardInterestRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4,
  },
  miniCardInterestChip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1,
  },
  miniCardInterestChipLabel: { fontSize: 9, fontWeight: "700" },

  // Step content
  stepContent: {
    flex: 1, paddingHorizontal: 24, paddingTop: 8,
    alignItems: "center", overflow: "hidden",
  },
  stepEmoji: { fontSize: 52, textAlign: "center", marginBottom: 10 },
  stepTitle: {
    fontSize: 28, fontWeight: "800", color: "#fff",
    textAlign: "center", lineHeight: 36, marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 14, color: "#666", textAlign: "center",
    lineHeight: 21, marginBottom: 22,
  },

  // Name preview
  namePreview: { width: "100%", marginTop: 14, borderRadius: 14, overflow: "hidden", zIndex: 1 },
  namePreviewGrad: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 14, borderRadius: 14,
  },
  namePreviewAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  namePreviewInitials: { fontSize: 14, fontWeight: "800" },
  namePreviewHint: { fontSize: 10, color: "#666", marginBottom: 2 },
  namePreviewName: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Input
  inputWrap: {
    width: "100%", backgroundColor: "#0E0E20",
    borderRadius: 16, borderWidth: 1.5, borderColor: "#1E1E38",
    marginBottom: 12, shadowOffset: { width: 0, height: 0 },
    shadowColor: "#6C5CE7", zIndex: 1,
  },
  input: { color: "#fff", fontSize: 17, paddingHorizontal: 18, paddingVertical: 16 },

  // University
  selectedUniCard: { width: "100%", borderRadius: 16, overflow: "hidden", zIndex: 1 },
  selectedUniGrad: {
    padding: 16, borderWidth: 1, borderColor: "#6C5CE718",
    borderRadius: 16, gap: 12,
  },
  selectedUniRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectedUniName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  selectedUniCity: { fontSize: 12, color: "#888", marginTop: 2 },
  changeText: { fontSize: 14, fontWeight: "600" },
  campusRow: { gap: 8 },
  campusTitle: { fontSize: 12, color: "#777", fontWeight: "600" },
  campusChipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  campusChip: {
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#0F0F1A",
    borderRadius: 20, borderWidth: 1, borderColor: "#2A2A48",
  },
  campusChipText: { fontSize: 13, color: "#888", fontWeight: "600" },
  uniList: { width: "100%", maxHeight: 240 },
  uniItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#13132A",
  },
  uniBadge: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  uniBadgeText: { fontSize: 12, fontWeight: "800" },
  uniName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  uniCity: { fontSize: 12, color: "#555", marginTop: 1 },
  noResultsWrap: { alignItems: "center", marginTop: 24, gap: 4 },
  noResults: { color: "#888", textAlign: "center", fontSize: 14, fontWeight: "600" },
  noResultsSub: { color: "#444", textAlign: "center", fontSize: 12 },

  // Interests
  interestGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 9, justifyContent: "center", paddingBottom: 8,
  },
  interestChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 13, paddingVertical: 9,
    backgroundColor: "#0E0E20", borderRadius: 24,
    borderWidth: 1.5, borderColor: "#1E1E38",
  },
  interestEmoji: { fontSize: 15 },
  interestLabel: { fontSize: 13, color: "#666", fontWeight: "600" },
  interestCountRow: { paddingVertical: 6 },
  interestCountPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: "#1E1E38",
  },
  interestCountText: { fontSize: 13, fontWeight: "700", color: "#444", textAlign: "center" },

  // Photo
  avatarPickerContainer: {
    width: 152, height: 152,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },
  avatarPickerWrap: {
    width: 136, height: 136, borderRadius: 68,
    overflow: "hidden",
  },
  avatarPreview: { width: 136, height: 136, borderRadius: 68 },
  avatarPlaceholder: {
    width: 136, height: 136, borderRadius: 68,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#252545",
  },
  avatarAddBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#0A0A18",
  },
  avatarEditBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "#0A0A18",
  },
  photoSuccessRow: { alignItems: "center", gap: 8 },
  photoSuccessBadge: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  photoSuccessText: { fontSize: 14, fontWeight: "700" },
  photoChangeText: { color: "#444", fontSize: 13, fontWeight: "500" },
  photoHint: { color: "#444", fontSize: 14, textAlign: "center" },
  photoSkipNote: {
    marginTop: 18, paddingHorizontal: 20, paddingVertical: 11,
    backgroundColor: "#FDCB6E08", borderRadius: 12,
    borderWidth: 1, borderColor: "#FDCB6E18",
  },
  photoSkipNoteText: { fontSize: 13, color: "#FDCB6E", textAlign: "center", fontWeight: "500" },

  // Celebration
  celebTitle: {
    fontSize: 32, fontWeight: "800", color: "#fff",
    textAlign: "center", lineHeight: 40, marginTop: 10, marginBottom: 6,
    letterSpacing: -0.5, zIndex: 1,
  },
  celebSubtitle: {
    fontSize: 15, color: "#888", textAlign: "center",
    lineHeight: 22, marginBottom: 16, zIndex: 1,
  },
  celebNote: { fontSize: 12, color: "#2A2A48", textAlign: "center", marginTop: 10 },

  // Intro card (celebration)
  introCardPreview: { width: "100%", borderRadius: 20, overflow: "hidden", zIndex: 1 },
  introCardGrad: { padding: 16, borderWidth: 1, borderColor: "#6C5CE718", borderRadius: 20, gap: 10 },
  introCardAvatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  introCardAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  introCardAvatarImg: { width: 46, height: 46, borderRadius: 23 },
  introCardName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  introCardUni: { fontSize: 12, color: "#555", marginTop: 1 },
  introCardNewBadge: {
    backgroundColor: "#55EFC418", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#55EFC435",
  },
  introCardNewText: { fontSize: 10, fontWeight: "800", color: "#55EFC4" },
  introCardVibeBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    alignSelf: "flex-start", paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  introCardVibeText: { fontSize: 12, fontWeight: "700" },
  introCardLookingFor: { fontSize: 11, color: "#444", marginBottom: 5, fontWeight: "600" },
  introCardGoalRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  introCardGoalChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10,
  },
  introCardGoalText: { fontSize: 11, fontWeight: "600" },
  introCardHelloBtn: {
    backgroundColor: "#6C5CE7", borderRadius: 11,
    paddingVertical: 10, alignItems: "center",
  },
  introCardHelloText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // CTA
  ctaArea: { paddingHorizontal: 20, paddingTop: 8 },
  ctaBtn: { borderRadius: 16, overflow: "hidden" },
  ctaBtnDisabled: { opacity: 0.38 },
  ctaGradient: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
  skipUniBtn: { paddingVertical: 16, alignItems: "center" },
  skipUniBtnText: { color: "#444", fontSize: 15, fontWeight: "500" },
});
