import { Tabs } from "expo-router";
import {
  Home,
  Compass,
  Plus,
  MessageCircle,
  User,
} from "lucide-react-native";
import {
  View,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@friendscircle/ui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_ICONS = {
  index: Home,
  explore: Compass,
  create: Plus,
  threads: MessageCircle,
  profile: User,
} as const;

const TAB_LABELS: Record<string, string> = {
  index: "Home",
  explore: "Explore",
  create: "",
  threads: "Threads",
  profile: "Me",
};

// ─── Animated Create Button ─────────────────────────────────────

function CreateButton({ onPress, isFocused }: { onPress: () => void; isFocused: boolean }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.25);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.2, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[styles.createButton, buttonStyle]}
      accessibilityRole="button"
      accessibilityLabel="Create new post"
    >
      <Animated.View style={[styles.createButtonInner, glowStyle]}>
        <Plus color="white" size={26} strokeWidth={2.5} />
      </Animated.View>
    </AnimatedPressable>
  );
}

// ─── Tab Item ───────────────────────────────────────────────────

function TabItem({
  routeName,
  isFocused,
  onPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const Icon = TAB_ICONS[routeName as keyof typeof TAB_ICONS];
  const label = TAB_LABELS[routeName] || routeName;
  const iconScale = useSharedValue(isFocused ? 1.12 : 1);
  const dotScale = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1.12 : 1, { damping: 15, stiffness: 200 });
    dotScale.value = withSpring(isFocused ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  if (!Icon) return null;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={iconStyle}>
        <Icon
          color={isFocused ? theme.colors.primary.DEFAULT : theme.colors.dark.textMuted}
          size={22}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? theme.colors.primary.DEFAULT : theme.colors.dark.textMuted,
          },
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View style={[styles.activeDot, dotStyle]} />
    </Pressable>
  );
}

// ─── Custom Tab Bar ─────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom - 8, 4) }]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, styles.tabBarOverlay]} />
        </BlurView>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />
      )}

      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const routeName = route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (routeName === "create") {
            return (
              <CreateButton
                key={route.key}
                onPress={onPress}
                isFocused={isFocused}
              />
            );
          }

          return (
            <TabItem
              key={route.key}
              routeName={routeName}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Layout ────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.dark.bg },
        headerTintColor: theme.colors.dark.textPrimary,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", headerShown: false }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: "Explore", headerShown: false }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: "Create", headerShown: false }}
      />
      <Tabs.Screen
        name="threads"
        options={{ title: "Threads", headerShown: false }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Me", headerShown: false }}
      />
    </Tabs>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.dark.border + "60",
  },
  tabBarOverlay: {
    backgroundColor: "rgba(15, 15, 26, 0.4)",
  },
  tabBarAndroid: {
    backgroundColor: "rgba(15, 15, 26, 0.95)",
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary.DEFAULT,
    marginTop: 2,
  },
  createButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  createButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 10,
  },
});
