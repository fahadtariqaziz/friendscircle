import * as Sentry from "@sentry/react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";
import { supabase, getProfile } from "@friendscircle/supabase";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import {
  registerForPushNotifications,
  handleNotificationResponse,
} from "../lib/notifications";
import { ONBOARDING_KEY } from "./onboarding";

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.level === "error") return breadcrumb;
    return null;
  },
});

interface AuthContextType {
  user: { id: string; email: string } | null;
  isLoading: boolean;
  markOnboardingDone: () => void;
  markProfileComplete: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  markOnboardingDone: () => {},
  markProfileComplete: () => {},
});
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // null = loading, true = complete, false = needs setup
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  // null = loading, true = done, false = not done
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  const hasNavigated = useRef(false);
  const hasRouted = useRef<string | null>(null);
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const router = useRouter();

  // Check onboarding completion on mount
  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === "1");
    });
  }, []);

  // Auth subscription
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email || "" });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
      } else {
        setUser(null);
        setProfileComplete(null);
        hasRouted.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile to check if setup is complete — create row if missing
  useEffect(() => {
    if (!user) { setProfileComplete(null); return; }
    getProfile(user.id).then(async ({ data, error }) => {
      if (!data && (error?.code === "PGRST116" || !error)) {
        // Profile row doesn't exist — create it
        await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
        setProfileComplete(false);
        return;
      }
      setProfileComplete(!!(data?.full_name && (data.full_name as string).trim().length > 0 && data?.university_id));
    });
  }, [user?.id]);

  // Routing logic — uses segmentsRef to avoid re-running on every tab switch
  // hasRouted prevents duplicate navigations when multiple deps change rapidly
  useEffect(() => {
    if (isLoading || onboardingDone === null) return;

    const seg0 = segmentsRef.current[0] as string | undefined;
    const inLegal = seg0 === "terms" || seg0 === "privacy";

    // Allow legal screens at any time
    if (inLegal) return;

    // Determine target route
    let target: string | null = null;

    if (!onboardingDone) {
      target = "/onboarding";
    } else if (!user) {
      target = "/auth";
    } else if (profileComplete === null) {
      return; // still loading profile
    } else if (!profileComplete) {
      target = "/setup";
    } else {
      target = "/(tabs)";
    }

    // Only navigate if target changed (prevents repeated replace calls)
    if (target && hasRouted.current !== target) {
      // For tabs, only navigate if coming from auth/setup/onboarding
      if (target === "/(tabs)") {
        const inAuth = seg0 === "auth";
        const inSetup = seg0 === "setup";
        const inOnboarding = seg0 === "onboarding";
        if (!inAuth && !inSetup && !inOnboarding) {
          hasRouted.current = target;
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            setTimeout(() => SplashScreen.hideAsync(), 300);
          }
          return;
        }
      }
      hasRouted.current = target;
      router.replace(target as any);
    }

    if (!hasNavigated.current) {
      hasNavigated.current = true;
      setTimeout(() => SplashScreen.hideAsync(), 300);
    }
  }, [user, isLoading, router, onboardingDone, profileComplete]);

  // Push notification registration + deep link handling
  const notificationResponseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications(user.id);

    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(
          notificationResponseListener.current
        );
      }
    };
  }, [user]);

  const markOnboardingDone = useCallback(() => {
    setOnboardingDone(true);
  }, []);

  const markProfileComplete = useCallback(() => {
    setProfileComplete(true);
  }, []);

  const contextValue = useMemo(
    () => ({ user, isLoading, markOnboardingDone, markProfileComplete }),
    [user, isLoading, markOnboardingDone, markProfileComplete]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Refetch queries when app comes back to foreground
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === "active");
}

function RootLayout() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            retryDelay: 1000,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#0F0F1A" },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { fontWeight: "bold" },
              contentStyle: { backgroundColor: "#0F0F1A" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="setup" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
