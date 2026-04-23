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
} from "react-native";
import { theme } from "@friendscircle/ui";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import { signIn, signUp, signInWithGoogle } from "@friendscircle/supabase";
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolateColor,
  FadeInUp,
  FadeInDown,
  Easing,
  LayoutAnimationConfig,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Google Logo ─────────────────────────────────────────────────

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

// ─── Animated App Logo ───────────────────────────────────────────

export function AppLogo({ size = 80 }: { size?: number }) {
  const r = size * 0.215;
  const offset = size * 0.146;
  const cx = size / 2;
  const cy = size / 2 + size * 0.02;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="52%" r="15%">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy - offset} r={r} fill="#FF6B6B" opacity={0.7} />
      <Circle cx={cx - offset * 0.87} cy={cy + offset * 0.5} r={r} fill="#00CEC9" opacity={0.7} />
      <Circle cx={cx + offset * 0.87} cy={cy + offset * 0.5} r={r} fill="#55EFC4" opacity={0.7} />
      <Circle cx={cx} cy={cy + size * 0.02} r={r * 0.45} fill="url(#glow)" />
    </Svg>
  );
}

// ─── Floating Orb (Animated Background) ─────────────────────────

function FloatingOrb({ color, size, initialX, initialY, delay }: {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  delay: number;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useState(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 2000 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-20, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value * 0.35,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─── Animated Input ──────────────────────────────────────────────

function AnimatedInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  showToggle,
  delay = 0,
  textContentType,
  autoComplete,
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "words";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  showToggle?: boolean;
  delay?: number;
  textContentType?: "none" | "emailAddress" | "name" | "password" | "newPassword" | "oneTimeCode";
  autoComplete?: "off" | "email" | "name" | "password" | "password-new";
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setFocused(true);
    borderColor.value = withTiming(1, { duration: 200 });
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    borderColor.value = withTiming(0, { duration: 200 });
  }, []);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderColor.value,
      [0, 1],
      [theme.colors.dark.border, theme.colors.primary.DEFAULT],
    ),
  }));

  const isSecure = secureTextEntry && !showPassword;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400).springify()}
      style={[styles.inputWrapper, animatedBorder]}
    >
      <TextInput
        ref={inputRef as any}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.dark.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isSecure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        textContentType={textContentType ?? "none"}
        autoComplete={autoComplete ?? "off"}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.input}
      />
      {showToggle && (
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          hitSlop={8}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={focused ? theme.colors.primary.light : theme.colors.dark.textMuted}
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── Animated Button ─────────────────────────────────────────────

function AnimatedButton({
  onPress,
  loading,
  label,
  loadingLabel,
  style: extraStyle,
  variant = "primary",
  delay = 0,
  icon,
}: {
  onPress: () => void;
  loading?: boolean;
  label: string;
  loadingLabel?: string;
  style?: object;
  variant?: "primary" | "google";
  delay?: number;
  icon?: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const isPrimary = variant === "primary";

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400).springify()}
      style={animatedScale}
    >
      {isPrimary ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          style={{ borderRadius: 14, overflow: "hidden", opacity: loading ? 0.7 : 1 }}
        >
          <LinearGradient
            colors={["#6C5CE7", "#8B7CF6", "#6C5CE7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryButton, extraStyle]}
          >
            {loading ? (
              <Animated.View
                entering={FadeInUp.duration(200)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View style={styles.spinner} />
                <Text style={styles.primaryButtonText}>{loadingLabel || "Please wait..."}</Text>
              </Animated.View>
            ) : (
              <Text style={styles.primaryButtonText}>{label}</Text>
            )}
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.googleButton, extraStyle]}
        >
          {icon}
          <Text style={styles.googleButtonText}>{label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── Password Strength Indicator ─────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
  ];

  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.strengthRow}>
      {checks.map((check) => (
        <View key={check.label} style={styles.strengthItem}>
          <Ionicons
            name={check.met ? "checkmark-circle" : "ellipse-outline"}
            size={12}
            color={check.met ? theme.colors.accent.mint : theme.colors.dark.textMuted}
          />
          <Text
            style={[
              styles.strengthText,
              check.met && { color: theme.colors.accent.mint },
            ]}
          >
            {check.label}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Main Auth Screen ────────────────────────────────────────────

// ─── Inline Toast Banner ─────────────────────────────────────────

function InlineToast({ message, type, onDismiss }: {
  message: string;
  type: "error" | "info";
  onDismiss: () => void;
}) {
  const isError = type === "error";
  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      style={{
        backgroundColor: isError ? "rgba(255, 107, 107, 0.15)" : "rgba(108, 92, 231, 0.15)",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: isError ? "rgba(255, 107, 107, 0.3)" : "rgba(108, 92, 231, 0.3)",
        marginBottom: 10,
      }}
    >
      <Ionicons
        name={isError ? "alert-circle" : "information-circle"}
        size={20}
        color={isError ? theme.colors.accent.coral : theme.colors.primary.light}
      />
      <Text style={{ flex: 1, color: theme.colors.dark.textPrimary, fontSize: 13, lineHeight: 18 }}>
        {message}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={theme.colors.dark.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Email Verification Screen ───────────────────────────────────

function VerificationScreen({ email, onBackToSignIn }: {
  email: string;
  onBackToSignIn: () => void;
}) {
  const checkmarkScale = useSharedValue(0);

  useState(() => {
    checkmarkScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 120 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  });

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <FloatingOrb color="#6C5CE7" size={200} initialX={-40} initialY={-20} delay={0} />
        <FloatingOrb color="#55EFC4" size={180} initialX={SCREEN_WIDTH - 80} initialY={SCREEN_HEIGHT - 300} delay={300} />
      </View>
      {Platform.OS === "ios" && (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <Animated.View style={[{ alignItems: "center", marginBottom: 32 }, checkmarkStyle]}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(85, 239, 196, 0.15)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "rgba(85, 239, 196, 0.3)",
          }}>
            <Ionicons name="mail-outline" size={44} color={theme.colors.accent.mint} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <Text style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#fff",
            textAlign: "center",
            marginBottom: 12,
          }}>
            Check your email
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInUp.delay(500).springify()}>
          <Text style={{
            fontSize: 15,
            color: theme.colors.dark.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 8,
            paddingHorizontal: 16,
          }}>
            We sent a verification link to
          </Text>
          <Text style={{
            fontSize: 16,
            fontWeight: "700",
            color: theme.colors.primary.light,
            textAlign: "center",
            marginBottom: 32,
          }}>
            {email}
          </Text>
        </Animated.View>

        {/* Instructions Card */}
        <Animated.View entering={FadeInUp.delay(600).springify()} style={[styles.card, { marginBottom: 24 }]}>
          {Platform.OS === "ios" && (
            <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
          )}
          <View style={styles.cardContent}>
            {[
              { icon: "mail-open-outline" as const, text: "Open your email inbox" },
              { icon: "link-outline" as const, text: "Click the verification link" },
              { icon: "arrow-back-outline" as const, text: "Come back and sign in" },
            ].map((step, i) => (
              <View key={i} style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 12,
                borderBottomWidth: i < 2 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: theme.colors.dark.border,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(108, 92, 231, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ color: theme.colors.primary.light, fontWeight: "700", fontSize: 14 }}>
                    {i + 1}
                  </Text>
                </View>
                <Ionicons name={step.icon} size={20} color={theme.colors.dark.textSecondary} />
                <Text style={{ color: theme.colors.dark.textPrimary, fontSize: 15, flex: 1 }}>
                  {step.text}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Back to Sign In Button */}
        <Animated.View entering={FadeInUp.delay(700).springify()}>
          <AnimatedButton
            onPress={onBackToSignIn}
            label="Back to Sign In"
            variant="primary"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).springify()}>
          <Text style={{
            textAlign: "center",
            color: theme.colors.dark.textMuted,
            fontSize: 12,
            marginTop: 20,
            lineHeight: 18,
          }}>
            Didn't receive the email? Check your spam folder{"\n"}or try signing up again.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Main Auth Screen ────────────────────────────────────────────

export default function AuthScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "info" } | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const showToast = useCallback((message: string, type: "error" | "info" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSubmit = async () => {
    if (isSignUp && !fullName.trim()) {
      showToast("Please enter your full name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password.");
      return;
    }
    if (isSignUp && password.length < 8) {
      showToast("Password must be at least 8 characters.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      showToast("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    const result = isSignUp
      ? await signUp(email.trim(), password, fullName.trim())
      : await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      if (result.error.message?.includes("rate") || result.error.message?.includes("limit")) {
        showToast("Too many attempts. Please wait a few minutes and try again.");
      } else {
        showToast(result.error.message);
      }
    } else if (isSignUp && !result.data.session) {
      // Email confirmation required — show verification screen
      setShowVerification(true);
    }
    // If session exists (auto-confirmed or sign in), _layout routing handles redirect
  };

  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await signInWithGoogle();
    if (error) {
      showToast(error.message);
    }
  };

  const toggleMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSignUp((prev) => !prev);
    setConfirmPassword("");
    setFullName("");
    setToast(null);
  }, []);

  if (showVerification) {
    return (
      <VerificationScreen
        email={email}
        onBackToSignIn={() => {
          setShowVerification(false);
          setIsSignUp(false);
          setPassword("");
          setConfirmPassword("");
          setFullName("");
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Background Orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <FloatingOrb color="#6C5CE7" size={200} initialX={-40} initialY={-20} delay={0} />
        <FloatingOrb color="#FF6B6B" size={160} initialX={SCREEN_WIDTH - 100} initialY={80} delay={500} />
        <FloatingOrb color="#00CEC9" size={180} initialX={SCREEN_WIDTH / 2 - 90} initialY={SCREEN_HEIGHT - 300} delay={300} />
        <FloatingOrb color="#55EFC4" size={120} initialX={-30} initialY={SCREEN_HEIGHT - 200} delay={700} />
      </View>

      {/* Blur layer over orbs */}
      {Platform.OS === "ios" && (
        <BlurView
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + Branding */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.brandSection}
          >
            <View style={styles.logoGlow}>
              <AppLogo size={100} />
            </View>
            <Text style={styles.appName}>FriendsCircle</Text>
            <Text style={styles.tagline}>
              {isSignUp
                ? "Join thousands of students on campus"
                : "Where campus life actually happens."}
            </Text>
          </Animated.View>

          {/* Social Proof */}
          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <Text style={styles.socialProof}>
              <Text style={{ color: theme.colors.accent.mint, fontWeight: "700" }}>
                2,000+{" "}
              </Text>
              students across 15 universities
            </Text>
          </Animated.View>

          {/* Auth Card */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500).springify()}
            style={styles.card}
          >
            {Platform.OS === "ios" && (
              <BlurView
                intensity={40}
                tint="dark"
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              />
            )}
            <View style={styles.cardContent}>
              {/* Toast */}
              {toast && (
                <InlineToast
                  message={toast.message}
                  type={toast.type}
                  onDismiss={() => setToast(null)}
                />
              )}

              {/* Google Button */}
              <AnimatedButton
                onPress={handleGoogle}
                label="Continue with Google"
                variant="google"
                delay={600}
                icon={<GoogleLogo size={20} />}
              />

              {/* Divider */}
              <Animated.View entering={FadeInUp.delay(650).duration(300)} style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </Animated.View>

              {/* Form Fields */}
              <LayoutAnimationConfig skipEntering>
                {isSignUp && (
                  <AnimatedInput
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    delay={0}
                  />
                )}
              </LayoutAnimationConfig>

              <AnimatedInput
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                inputRef={emailRef}
                delay={700}
              />

              <AnimatedInput
                placeholder={isSignUp ? "Create password" : "Password"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showToggle
                textContentType="oneTimeCode"
                autoComplete="off"
                returnKeyType={isSignUp ? "next" : "done"}
                onSubmitEditing={() =>
                  isSignUp ? confirmPasswordRef.current?.focus() : handleSubmit()
                }
                inputRef={passwordRef}
                delay={750}
              />

              {isSignUp && <PasswordStrength password={password} />}

              <LayoutAnimationConfig skipEntering>
                {isSignUp && (
                  <AnimatedInput
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    showToggle
                    textContentType="oneTimeCode"
                    autoComplete="off"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    inputRef={confirmPasswordRef}
                    delay={0}
                  />
                )}
              </LayoutAnimationConfig>

              {/* Submit Button */}
              <AnimatedButton
                onPress={handleSubmit}
                loading={loading}
                label={isSignUp ? "Create Account" : "Sign In"}
                loadingLabel={isSignUp ? "Creating account..." : "Signing in..."}
                variant="primary"
                delay={800}
                style={{ marginTop: 4 }}
              />
            </View>
          </Animated.View>

          {/* Toggle Sign In / Sign Up */}
          <Animated.View entering={FadeInUp.delay(900).springify()}>
            <Pressable onPress={toggleMode} style={styles.toggleButton}>
              <Text style={styles.toggleText}>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Text style={styles.toggleHighlight}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          {/* Footer — Terms & Privacy */}
          <Animated.View entering={FadeInUp.delay(1000).duration(600)}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/terms")}
              >
                Terms of Service
              </Text>
              {" "}and{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/privacy")}
              >
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Brand
  brandSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoGlow: {
    marginBottom: 16,
    shadowColor: theme.colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    color: theme.colors.dark.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },

  // Social proof
  socialProof: {
    textAlign: "center",
    color: theme.colors.dark.textMuted,
    fontSize: 12,
    marginBottom: 24,
    marginTop: 8,
  },

  // Card
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.15)",
    backgroundColor: Platform.select({
      ios: "transparent",
      android: "rgba(26, 26, 46, 0.85)",
    }),
  },
  cardContent: {
    padding: 20,
    gap: 10,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.dark.border,
  },
  dividerText: {
    color: theme.colors.dark.textMuted,
    paddingHorizontal: 14,
    fontSize: 12,
    fontWeight: "500",
  },

  // Inputs
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 37, 66, 0.7)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  input: {
    flex: 1,
    padding: 15,
    color: theme.colors.dark.textPrimary,
    fontSize: 15,
  },
  eyeButton: {
    paddingRight: 14,
    paddingLeft: 4,
  },

  // Password strength
  strengthRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
    marginTop: -4,
    marginBottom: 2,
  },
  strengthItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  strengthText: {
    fontSize: 11,
    color: theme.colors.dark.textMuted,
  },

  // Buttons
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleButtonText: {
    color: "#1f1f1f",
    fontWeight: "600",
    fontSize: 15,
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
  },

  // Toggle
  toggleButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: theme.colors.dark.textSecondary,
    fontSize: 14,
  },
  toggleHighlight: {
    color: theme.colors.primary.light,
    fontWeight: "700",
  },

  // Terms & Privacy
  termsText: {
    color: "#555577",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: "#6C5CE7",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
