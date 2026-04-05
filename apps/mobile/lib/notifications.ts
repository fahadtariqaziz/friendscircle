import * as Sentry from "@sentry/react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { updatePushToken } from "@friendscircle/supabase";
import { router } from "expo-router";

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permission, get Expo push token, and store it.
 * Call after user is authenticated.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  // Push tokens only work on physical devices
  if (!Device.isDevice) {
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Setup Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "FriendsCircle",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C5CE7",
    });
  }

  // Get Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId as string,
  });

  const token = tokenData.data;

  // Store in Supabase
  try {
    await updatePushToken(userId, token);
  } catch (err) {
    Sentry.captureException(err);
    console.error("Failed to store push token:", err);
  }

  return token;
}

/**
 * Handle notification tap — navigate to the relevant screen.
 * The `data` field contains routing info set by our SQL triggers.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse
) {
  const data = response.notification.request.content.data;
  if (!data?.screen) return;

  switch (data.screen) {
    case "home":
      router.push("/(tabs)");
      break;
    case "threads":
      router.push("/(tabs)/threads");
      break;
    case "profile":
      router.push("/(tabs)/profile");
      break;
    case "explore":
      router.push("/(tabs)/explore");
      break;
    default:
      router.push("/(tabs)");
      break;
  }
}
