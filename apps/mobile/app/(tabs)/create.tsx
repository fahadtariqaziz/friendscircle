import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
} from "react-native";
import { theme } from "@friendscircle/ui";
import { POINTS } from "@friendscircle/shared";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPost, uploadImage, getProfile, awardPoints } from "@friendscircle/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../_layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Camera,
  X,
  Send,
  Star,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  ZoomIn,
  FadeOut,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: W } = Dimensions.get("window");

// ─── Floating Orb ────────────────────────────────────────────────
function Orb({ color, size, x, y, delay = 0 }: {
  color: string; size: number; x: number; y: number; delay?: number;
}) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.18, { duration: 1000 }));
    ty.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-14, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(14, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value, transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={[style, {
      position: "absolute", width: size, height: size,
      borderRadius: size / 2, backgroundColor: color, left: x, top: y,
    }]} />
  );
}

// ─── Post Type Config ───────────────────────────────────────────

const POST_TYPES = [
  { type: "olx",                label: "Student OLX",          emoji: "🛍️", color: "#FDCB6E", desc: "Buy & sell on campus" },
  { type: "books",              label: "Books",                 emoji: "📚", color: "#00CEC9", desc: "Buy & sell textbooks" },
  { type: "lost_found",        label: "Lost & Found",          emoji: "🔎", color: "#FF6B6B", desc: "Help find lost items" },
  { type: "teacher_review",    label: "Teacher Review",        emoji: "⭐", color: "#FDCB6E", desc: "Rate your professors" },
  { type: "past_paper",        label: "Past Paper",            emoji: "📄", color: "#A29BFE", desc: "Share exam resources" },
  { type: "roommate",          label: "Roommate",              emoji: "🏠", color: "#00CEC9", desc: "Find living mates" },
  { type: "ride_share",        label: "Ride Share",            emoji: "🚗", color: "#55EFC4", desc: "Split travel costs" },
  { type: "freelance",         label: "Freelance",             emoji: "💼", color: "#6C5CE7", desc: "Help with assignments" },
  { type: "job",               label: "Job",                   emoji: "💰", color: "#55EFC4", desc: "Post opportunities" },
  { type: "event",             label: "Event",                 emoji: "🎉", color: "#FF6B6B", desc: "Campus happenings" },
  { type: "memory",            label: "Memory",                emoji: "📸", color: "#FDCB6E", desc: "Share uni moments" },
];

// ─── Type Selector Card ─────────────────────────────────────────

function TypeCard({
  item,
  index,
  onSelect,
}: {
  item: typeof POST_TYPES[0];
  index: number;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(Math.min(index * 60, 500)).duration(350)}
      style={styles.typeCardWrapper}
    >
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect();
        }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={[styles.typeCard, { borderColor: item.color + "40" }, cardStyle]}
      >
        <LinearGradient
          colors={[item.color + "18", item.color + "06"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Left accent strip */}
        <View style={[styles.typeAccentStrip, { backgroundColor: item.color }]} />
        <View style={[styles.typeEmojiBg, { backgroundColor: item.color + "25" }]}>
          <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Text style={styles.typeLabel} numberOfLines={1}>{item.label}</Text>
          <Text style={[styles.typeDesc, { color: item.color + "AA" }]} numberOfLines={2}>{item.desc}</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─── Star Rating Input ──────────────────────────────────────────

function StarRatingInput({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRate(i);
          }}
        >
          <Star
            color="#FDCB6E"
            fill={i <= rating ? "#FDCB6E" : "transparent"}
            size={28}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Image Picker Section ───────────────────────────────────────

function ImagePickerSection({
  images, onAdd, onRemove, color,
}: {
  images: { uri: string; uploading?: boolean }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  color: string;
}) {
  return (
    <View style={styles.imageSection}>
      <Text style={[styles.inputLabel, { color: color }]}>📷  Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {images.map((img, index) => (
            <Animated.View key={index} entering={FadeIn.springify()}>
              <View style={styles.imageThumb}>
                <Image source={{ uri: img.uri }} style={styles.imageThumbImg} />
                {img.uploading ? (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color="white" size="small" />
                  </View>
                ) : (
                  <Pressable onPress={() => onRemove(index)} style={styles.imageRemoveBtn}>
                    <X color="white" size={14} />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          ))}
          {images.length < 5 && (
            <Pressable onPress={onAdd} style={[styles.addImageBtn, { borderColor: color + "50" }]}>
              <Camera color={color} size={22} />
              <Text style={[styles.addImageText, { color }]}>Add</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Metadata Fields ────────────────────────────────────────────

function MetadataFields({
  type,
  metadata,
  onChange,
}: {
  type: string;
  metadata: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  const renderInput = (key: string, label: string, placeholder: string, keyboardType?: any) => (
    <View key={key} style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.dark.textMuted}
        value={metadata[key]?.toString() || ""}
        onChangeText={(v) => onChange(key, keyboardType === "numeric" ? (v ? Number(v) : "") : v)}
        keyboardType={keyboardType || "default"}
        style={styles.metaInput}
      />
    </View>
  );

  const renderPicker = (key: string, label: string, options: string[]) => (
    <View key={key} style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerRow}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onChange(key, opt)}
            style={[
              styles.pickerPill,
              metadata[key] === opt && styles.pickerPillActive,
            ]}
          >
            <Text style={[
              styles.pickerPillText,
              metadata[key] === opt && styles.pickerPillTextActive,
            ]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  switch (type) {
    case "books":
      return (
        <View>
          {renderPicker("action", "I want to", ["sell", "buy"])}
          {renderInput("book_title", "Book Title *", "e.g. Engineering Mathematics Vol 2")}
          {renderInput("author", "Author (optional)", "e.g. Erwin Kreyszig")}
          {renderInput("subject", "Subject / Course", "e.g. Calculus, CS101")}
          {metadata.action !== "buy" && renderInput("price", "Price (PKR)", "e.g. 800", "numeric")}
          {metadata.action !== "buy" && renderPicker("condition", "Condition", ["New", "Good", "Fair", "Poor"])}
        </View>
      );
    case "olx":
      return (
        <View>
          {renderInput("price", "Price (PKR)", "e.g. 5000", "numeric")}
          {renderPicker("condition", "Condition", ["New", "Like New", "Used"])}
          {renderInput("category", "Category", "e.g. Electronics, Books")}
        </View>
      );
    case "teacher_review":
      return (
        <View>
          {renderInput("teacher_name", "Teacher Name", "e.g. Dr. Ahmed")}
          {renderInput("course", "Course", "e.g. CS101 - Intro to Programming")}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Rating</Text>
            <StarRatingInput
              rating={metadata.rating || 0}
              onRate={(r) => onChange("rating", r)}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Difficulty</Text>
            <StarRatingInput
              rating={metadata.difficulty || 0}
              onRate={(r) => onChange("difficulty", r)}
            />
          </View>
        </View>
      );
    case "ride_share":
      return (
        <View>
          {renderInput("from_location", "From", "e.g. NUST H-12")}
          {renderInput("to_location", "To", "e.g. Saddar")}
          {renderInput("date", "Date", "e.g. 2025-01-15")}
          {renderInput("seats_available", "Seats Available", "e.g. 3", "numeric")}
        </View>
      );
    case "event":
      return (
        <View>
          {renderInput("venue", "Venue", "e.g. Auditorium Hall")}
          {renderInput("event_date", "Date", "e.g. 2025-01-20")}
          {renderInput("event_time", "Time", "e.g. 5:00 PM")}
        </View>
      );
    case "lost_found":
      return (
        <View>
          {renderPicker("type", "Type", ["lost", "found"])}
          {renderInput("location", "Location", "e.g. Library 2nd Floor")}
          {renderInput("date_occurred", "Date", "When did it happen?")}
        </View>
      );
    case "roommate":
      return (
        <View>
          {renderInput("hostel_name", "Hostel / Area", "e.g. Boys Hostel 5")}
          {renderInput("space_for", "Space For", "How many people?", "numeric")}
          {renderInput("rent_range", "Rent Range", "e.g. 15,000 - 20,000")}
        </View>
      );
    case "past_paper":
      return (
        <View>
          {renderInput("course", "Course", "e.g. CS201 - Data Structures")}
          {renderInput("year", "Year / Semester", "e.g. Fall 2026")}
        </View>
      );
    case "freelance":
      return (
        <View>
          {renderPicker("type", "I am", ["need_help", "can_help"])}
          {renderInput("assignment_type", "Assignment Type", "e.g. Report, Presentation, Code")}
          {renderInput("budget_range", "Budget Range (PKR)", "e.g. 1,000 - 5,000")}
          {renderInput("deadline", "Deadline", "e.g. Jan 30, 2025")}
        </View>
      );
    case "job":
      return (
        <View>
          {renderInput("company", "Company", "e.g. TechCorp")}
          {renderPicker("job_type", "Job Type", ["internship", "part_time", "full_time", "remote"])}
          {renderInput("salary_range", "Salary Range (optional)", "e.g. 50,000 - 80,000")}
          {renderInput("location", "Location", "e.g. Islamabad")}
        </View>
      );
    case "memory":
      return (
        <View>
          {renderInput("spot_name", "Spot Name", "e.g. Cafeteria, Library Steps")}
        </View>
      );
    default:
      return null;
  }
}

// ─── Success Modal ──────────────────────────────────────────────

function SuccessModal({
  visible,
  postType,
  onDone,
}: {
  visible: boolean;
  postType: string | null;
  onDone: () => void;
}) {
  const config = POST_TYPES.find((pt) => pt.type === postType);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (visible) {
      ringScale.value = withDelay(400, withTiming(2.5, { duration: 800, easing: Easing.out(Easing.cubic) }));
      ringOpacity.value = withDelay(400, withTiming(0, { duration: 800 }));
    } else {
      ringScale.value = 0;
      ringOpacity.value = 0.6;
    }
  }, [visible]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={successStyles.overlay}>
        <View style={successStyles.content}>
          {/* Ripple ring */}
          <Animated.View style={[successStyles.ring, ringStyle]} />

          {/* Check circle */}
          <Animated.View entering={ZoomIn.delay(100).springify().damping(12)} style={successStyles.checkCircle}>
            <LinearGradient
              colors={[config?.color || "#6C5CE7", (config?.color || "#6C5CE7") + "99"]}
              style={successStyles.checkGradient}
            >
              <Text style={{ fontSize: 40 }}>✓</Text>
            </LinearGradient>
          </Animated.View>

          {/* Text */}
          <Animated.Text entering={FadeInUp.delay(250).springify()} style={successStyles.title}>
            Posted!
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(350).springify()} style={successStyles.subtitle}>
            Your {config?.label?.toLowerCase() || "post"} is live now
          </Animated.Text>

          {/* XP Badge */}
          <Animated.View entering={ZoomIn.delay(450).springify()} style={successStyles.xpBadge}>
            <LinearGradient
              colors={["#FDCB6E30", "#FDCB6E10"]}
              style={successStyles.xpGradient}
            >
              <Text style={{ fontSize: 16 }}>⚡</Text>
              <Text style={successStyles.xpText}>+10 XP earned</Text>
            </LinearGradient>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeInUp.delay(550).springify()} style={successStyles.btnRow}>
            <Pressable onPress={onDone} style={successStyles.doneBtn}>
              <LinearGradient
                colors={[config?.color || "#6C5CE7", (config?.color || "#6C5CE7") + "BB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={successStyles.doneBtnGradient}
              >
                <Text style={successStyles.doneBtnText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 20, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 100,
    width: "100%",
  },
  ring: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#6C5CE7",
    top: -10,
  },
  checkCircle: {
    marginBottom: 24,
  },
  checkGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    marginBottom: 20,
  },
  xpBadge: {
    marginBottom: 32,
  },
  xpGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FDCB6E30",
  },
  xpText: {
    color: "#FDCB6E",
    fontSize: 15,
    fontWeight: "700",
  },
  btnRow: {
    width: "100%",
    gap: 10,
  },
  doneBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  doneBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

// ─── Main Create Screen ─────────────────────────────────────────

export default function CreateScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });
  const profile = profileData?.data as any;

  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [images, setImages] = useState<{ uri: string; publicId?: string; uploading?: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTypeRef = useRef<string | null>(null);

  const selectedConfig = POST_TYPES.find((pt) => pt.type === selectedType);

  const handleMetadataChange = useCallback((key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const index = images.length;
    setImages((prev) => [...prev, { uri: asset.uri, uploading: true }]);

    try {
      const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const type = asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`;
      const file = { uri: asset.uri, name: `post.${ext}`, type } as unknown as File;
      const uploaded = await uploadImage(file, "posts");
      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { uri: uploaded.secure_url, publicId: uploaded.public_id, uploading: false } : img,
        ),
      );
    } catch {
      setImages((prev) => prev.filter((_, i) => i !== index));
      Alert.alert("Upload Failed", "Could not upload image. Try again.");
    }
  }, [images.length]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !selectedType) return;
    if (!user) {
      Alert.alert("Error", "You must be logged in to post.");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = images.filter((i) => !i.uploading).map((i) => i.uri);
      const postData: Record<string, any> = {
        user_id: user.id,
        post_type: selectedType,
        title: title.trim(),
        body: body.trim() || null,
        status: "approved",
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      };

      if (profile?.university_id) {
        postData.university_id = profile.university_id;
      }
      if (profile?.campus_id) {
        postData.campus_id = profile.campus_id;
      }

      const { error } = await createPost(postData);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        successTypeRef.current = selectedType;
        setShowSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        awardPoints(user.id, POINTS.POST_CREATE).catch(() => {});
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDone = useCallback(() => {
    setShowSuccess(false);
    setTitle("");
    setBody("");
    setSelectedType(null);
    setMetadata({});
    setImages([]);
    router.push("/(tabs)");
  }, [router]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(null);
    setTitle("");
    setBody("");
    setMetadata({});
    setImages([]);
  };

  // ─── Step 1: Type Selection ───
  if (!selectedType) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#0D0D1F", "#0F0F1A", "#0A0A14"]} style={StyleSheet.absoluteFillObject} />
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Orb color="#6C5CE7" size={220} x={-70} y={-50} />
          <Orb color="#FF6B6B" size={150} x={W - 90} y={60} delay={400} />
          <Orb color="#00CEC9" size={120} x={W * 0.3} y={420} delay={700} />
        </View>
        <ScrollView
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 24 }}>
            <Text style={styles.screenEmoji}>✨</Text>
            <Text style={styles.screenTitle}>Create Post</Text>
            <Text style={styles.screenSubtitle}>What would you like to share today?</Text>
          </Animated.View>

          <View style={styles.typeGrid}>
            {POST_TYPES.map((pt, index) => (
              <TypeCard key={pt.type} item={pt} index={index} onSelect={() => setSelectedType(pt.type)} />
            ))}
          </View>
        </ScrollView>
        <SuccessModal visible={showSuccess} postType={successTypeRef.current} onDone={handleSuccessDone} />
      </View>
    );
  }

  // ─── Step 2: Post Form ───
  const canSubmit = title.trim().length > 0 && !loading && !images.some((i) => i.uploading);
  const accentColor = selectedConfig!.color;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#0D0D1F", "#0F0F1A", "#0A0A14"]} style={StyleSheet.absoluteFillObject} />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Orb color={accentColor} size={200} x={-60} y={-30} />
        <Orb color="#6C5CE7" size={140} x={W - 80} y={180} delay={300} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "transparent" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={{ backgroundColor: "transparent" }}
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.formHeader}>
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <ChevronLeft color="white" size={22} />
            </Pressable>
            <LinearGradient
              colors={[accentColor + "30", accentColor + "10"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.formTypeBadge, { borderColor: accentColor + "40", borderWidth: 1 }]}
            >
              <Text style={{ fontSize: 20 }}>{selectedConfig!.emoji}</Text>
              <Text style={[styles.formTypeText, { color: accentColor }]}>
                {selectedConfig!.label}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Accent divider */}
          <LinearGradient
            colors={[accentColor, accentColor + "00"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 2, borderRadius: 1, marginBottom: 20 }}
          />

          {/* Form card */}
          <Animated.View entering={FadeInUp.delay(80).springify()} style={[styles.formCard, { borderColor: accentColor + "20" }]}>
            <ImagePickerSection
              images={images}
              onAdd={handlePickImage}
              onRemove={handleRemoveImage}
              color={accentColor}
            />

            <View style={styles.formDivider} />

            <Text style={[styles.inputLabel, { color: accentColor }]}>Title *</Text>
            <TextInput
              placeholder={getPlaceholder(selectedType)}
              placeholderTextColor={theme.colors.dark.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              style={styles.titleInput}
            />
            <Text style={styles.charCount}>{title.length}/120</Text>

            <View style={styles.formDivider} />

            <Text style={[styles.inputLabel, { color: accentColor }]}>Description</Text>
            <TextInput
              placeholder="Add more details..."
              placeholderTextColor={theme.colors.dark.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={2000}
              style={styles.bodyInput}
            />
            <Text style={styles.charCount}>{body.length}/2000</Text>
          </Animated.View>

          {/* Metadata card */}
          {selectedType && (
            <Animated.View entering={FadeInUp.delay(160).springify()} style={[styles.formCard, { borderColor: accentColor + "20", marginTop: 12 }]}>
              <MetadataFields
                type={selectedType}
                metadata={metadata}
                onChange={handleMetadataChange}
              />
            </Animated.View>
          )}

          {/* Submit */}
          <Animated.View entering={FadeInUp.delay(240).springify()} style={{ marginTop: 16 }}>
            <Pressable onPress={handleSubmit} disabled={!canSubmit}>
              <LinearGradient
                colors={canSubmit ? [accentColor, accentColor + "BB"] : ["#1E1E38", "#1A1A30"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Send color="white" size={18} />
                )}
                <Text style={styles.submitText}>
                  {loading ? "Posting..." : `Post ${selectedConfig!.label}`}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SuccessModal visible={showSuccess} postType={successTypeRef.current} onDone={handleSuccessDone} />
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function getPlaceholder(type: string): string {
  switch (type) {
    case "books": return "Book title & edition";
    case "olx": return "What are you selling?";
    case "teacher_review": return "Which teacher are you reviewing?";
    case "lost_found": return "What did you lose/find?";
    case "ride_share": return "Where are you heading?";
    case "roommate": return "Looking for a roommate?";
    case "event": return "What's the event?";
    case "past_paper": return "Which paper are you sharing?";
    case "freelance": return "What assignment do you need help with?";
    case "job": return "What's the job position?";
    case "memory": return "What's the memory?";
    default: return "Title";
  }
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenEmoji: { fontSize: 32, marginBottom: 6 },
  screenTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    color: theme.colors.dark.textSecondary,
    fontSize: 14,
  },

  // Type Grid
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeCardWrapper: {
    width: "48.5%" as any,
  },
  typeCard: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 14,
    paddingLeft: 18,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeAccentStrip: {
    position: "absolute",
    left: 0, top: 10, bottom: 10,
    width: 3, borderRadius: 2,
  },
  typeEmojiBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  typeDesc: {
    fontSize: 10,
    marginTop: 2,
  },

  // Form card
  formCard: {
    backgroundColor: "#111128",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  formDivider: {
    height: 1,
    backgroundColor: "#1E1E38",
    marginVertical: 14,
  },

  // Form Header
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A30",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A45",
  },
  formTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  formTypeText: {
    fontWeight: "800",
    fontSize: 15,
  },

  // Inputs
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
    color: theme.colors.dark.textSecondary,
  },
  titleInput: {
    backgroundColor: "#0D0D20",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#1E1E38",
  },
  bodyInput: {
    backgroundColor: "#0D0D20",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#1E1E38",
  },
  charCount: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  metaInput: {
    backgroundColor: "#0D0D20",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1E1E38",
  },

  // Picker
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#0D0D20",
    borderWidth: 1,
    borderColor: "#2A2A45",
  },
  pickerPillActive: {
    backgroundColor: theme.colors.primary.DEFAULT + "25",
    borderColor: theme.colors.primary.DEFAULT + "70",
  },
  pickerPillText: {
    color: theme.colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  pickerPillTextActive: {
    color: theme.colors.primary.light,
  },

  // Stars
  starRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  // Images
  imageSection: {
    marginBottom: 16,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imageThumbImg: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: theme.colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageText: {
    color: theme.colors.dark.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  // Submit
  submitBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
