import { View, Text, ScrollView, Pressable, Alert, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { LogOut, Moon, Bell, Shield, HelpCircle, ChevronRight, GraduationCap, MapPin, X, Send } from "lucide-react-native";
import { theme } from "@friendscircle/ui";
import { LEVEL_THRESHOLDS, REPORT_CATEGORIES, REPORT_CATEGORY_LABELS, REPORT_CATEGORY_EMOJIS } from "@friendscircle/shared";
import { signOut, getProfile, createReport } from "@friendscircle/supabase";
import * as Notifications from "expo-notifications";
import { registerForPushNotifications } from "../../lib/notifications";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../_layout";
import { useState } from "react";

export default function ProfileScreen() {
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState("bug");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  const profile = profileData?.data as any;
  const university = profile?.universities;
  const campus = profile?.campuses;
  const level = profile?.level || "Freshman";
  const points = profile?.points || 0;
  const thresholds = Object.entries(LEVEL_THRESHOLDS);
  const currentLevelIndex = thresholds.findIndex(([l]) => l === level);
  const nextLevel = thresholds[currentLevelIndex + 1];
  const progress = nextLevel
    ? ((points - (thresholds[currentLevelIndex]?.[1] || 0)) /
        ((nextLevel[1] as number) - (thresholds[currentLevelIndex]?.[1] || 0))) *
      100
    : 100;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleSubmitFeedback = async () => {
    if (!user || !feedbackSubject.trim() || !feedbackDescription.trim()) {
      Alert.alert("Missing fields", "Please fill in both subject and description.");
      return;
    }

    setSubmitting(true);
    const { error } = await createReport({
      user_id: user.id,
      category: feedbackCategory,
      subject: feedbackSubject.trim(),
      description: feedbackDescription.trim(),
    });
    setSubmitting(false);

    if (error) {
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } else {
      Alert.alert("Submitted!", "Thanks for your feedback. We'll review it soon.");
      setFeedbackSubject("");
      setFeedbackDescription("");
      setFeedbackCategory("bug");
      setShowFeedback(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
    >
      {/* Profile Card */}
      <View
        style={{
          backgroundColor: theme.colors.dark.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: theme.colors.dark.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              {profile?.full_name?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.dark.textPrimary,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {profile?.full_name || "Set up your profile"}
            </Text>
            <Text
              style={{
                color: theme.colors.dark.textSecondary,
                fontSize: 14,
                marginTop: 2,
              }}
            >
              {user?.email || ""}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.colors.primary.DEFAULT + "30",
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.primary.light,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {level}
                </Text>
              </View>
              <Text style={{ color: theme.colors.dark.textMuted, fontSize: 11 }}>
                {points} points
              </Text>
            </View>
          </View>
        </View>

        {/* University Info */}
        {university && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: theme.colors.dark.border, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <GraduationCap color={theme.colors.dark.textSecondary} size={16} />
              <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 13 }}>
                {university.name} ({university.short_name})
              </Text>
            </View>
            {campus && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin color={theme.colors.dark.textSecondary} size={16} />
                <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 13 }}>
                  {campus.name}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Level Progress */}
        {nextLevel && (
          <View style={{ marginTop: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ color: theme.colors.dark.textMuted, fontSize: 11 }}>
                {level}
              </Text>
              <Text style={{ color: theme.colors.dark.textMuted, fontSize: 11 }}>
                {nextLevel[0]}
              </Text>
            </View>
            <View
              style={{
                width: "100%",
                height: 6,
                backgroundColor: theme.colors.dark.surfaceLight,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: "100%",
                  backgroundColor: theme.colors.primary.DEFAULT,
                  borderRadius: 999,
                }}
              />
            </View>
            <Text
              style={{
                color: theme.colors.dark.textMuted,
                fontSize: 10,
                marginTop: 4,
              }}
            >
              {(nextLevel[1] as number) - points} points to {nextLevel[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Menu */}
      <View
        style={{
          backgroundColor: theme.colors.dark.surface,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: theme.colors.dark.border,
          marginBottom: 16,
        }}
      >
        {[
          { icon: Moon, label: "Dark Mode", onPress: () => Alert.alert("Theme", "Dark mode is enabled by default.") },
          { icon: Bell, label: "Notifications", onPress: async () => {
            const { status } = await Notifications.getPermissionsAsync();
            if (status === "granted") {
              Alert.alert(
                "Notifications Enabled",
                "You'll receive alerts for comments, likes, and post approvals.",
                [
                  { text: "OK" },
                  {
                    text: "Disable",
                    style: "destructive",
                    onPress: () => Alert.alert("Disable Notifications", "Go to your phone's Settings > FriendsCircle > Notifications to disable."),
                  },
                ]
              );
            } else {
              Alert.alert(
                "Notifications Disabled",
                "Enable push notifications to stay updated on comments, likes, and post approvals.",
                [
                  { text: "Not Now" },
                  {
                    text: "Enable",
                    onPress: async () => {
                      const { status: newStatus } = await Notifications.requestPermissionsAsync();
                      if (newStatus === "granted" && user) {
                        await registerForPushNotifications(user.id);
                        Alert.alert("Success", "Push notifications are now enabled!");
                      } else {
                        Alert.alert("Permission Required", "Please enable notifications in Settings > FriendsCircle > Notifications.");
                      }
                    },
                  },
                ]
              );
            }
          }},
          { icon: Shield, label: "Privacy", onPress: () => Alert.alert("Privacy", "Your profile is visible to students at your university. Your email is never shared.") },
          { icon: HelpCircle, label: "Help & Support", onPress: () => setShowFeedback(true) },
        ].map((item, i) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < 3 ? 0.5 : 0,
              borderBottomColor: theme.colors.dark.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <item.icon color={theme.colors.dark.textSecondary} size={20} />
              <Text
                style={{
                  color: theme.colors.dark.textPrimary,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                {item.label}
              </Text>
            </View>
            <ChevronRight color={theme.colors.dark.textMuted} size={18} />
          </Pressable>
        ))}
      </View>

      {/* Sign Out */}
      <View
        style={{
          backgroundColor: theme.colors.dark.surface,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: theme.colors.dark.border,
        }}
      >
        <Pressable
          onPress={handleSignOut}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <LogOut color={theme.colors.accent.coral} size={20} />
            <Text
              style={{
                color: theme.colors.accent.coral,
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              Sign Out
            </Text>
          </View>
          <ChevronRight color={theme.colors.dark.textMuted} size={18} />
        </Pressable>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedback}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedback(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ color: theme.colors.dark.textPrimary, fontSize: 20, fontWeight: "bold" }}>
                Help & Support
              </Text>
              <Pressable onPress={() => setShowFeedback(false)}>
                <X color={theme.colors.dark.textMuted} size={24} />
              </Pressable>
            </View>

            <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, marginBottom: 20 }}>
              Report a bug, share a suggestion, or let us know how we can help.
            </Text>

            {/* Category Pills */}
            <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12, marginBottom: 8 }}>
              Category
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {REPORT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setFeedbackCategory(cat)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: feedbackCategory === cat
                      ? theme.colors.primary.DEFAULT + "30"
                      : theme.colors.dark.surfaceLight,
                    borderWidth: 1,
                    borderColor: feedbackCategory === cat
                      ? theme.colors.primary.DEFAULT + "60"
                      : theme.colors.dark.border,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{REPORT_CATEGORY_EMOJIS[cat]}</Text>
                  <Text
                    style={{
                      color: feedbackCategory === cat
                        ? theme.colors.primary.light
                        : theme.colors.dark.textSecondary,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {REPORT_CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Subject */}
            <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12, marginBottom: 6 }}>
              Subject
            </Text>
            <TextInput
              placeholder="Brief summary of your issue"
              placeholderTextColor={theme.colors.dark.textMuted}
              value={feedbackSubject}
              onChangeText={setFeedbackSubject}
              maxLength={100}
              style={{
                backgroundColor: theme.colors.dark.surfaceLight,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.dark.textPrimary,
                fontSize: 15,
                borderWidth: 0.5,
                borderColor: theme.colors.dark.border,
                marginBottom: 16,
              }}
            />

            {/* Description */}
            <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12, marginBottom: 6 }}>
              Description
            </Text>
            <TextInput
              placeholder="Tell us more about what happened or what you'd like to see..."
              placeholderTextColor={theme.colors.dark.textMuted}
              value={feedbackDescription}
              onChangeText={setFeedbackDescription}
              multiline
              numberOfLines={5}
              maxLength={1000}
              style={{
                backgroundColor: theme.colors.dark.surfaceLight,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.dark.textPrimary,
                fontSize: 14,
                minHeight: 120,
                textAlignVertical: "top",
                borderWidth: 0.5,
                borderColor: theme.colors.dark.border,
                marginBottom: 4,
              }}
            />
            <Text style={{ color: theme.colors.dark.textMuted, fontSize: 10, textAlign: "right", marginBottom: 20 }}>
              {feedbackDescription.length}/1000
            </Text>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmitFeedback}
              disabled={!feedbackSubject.trim() || !feedbackDescription.trim() || submitting}
              style={{
                backgroundColor: feedbackSubject.trim() && feedbackDescription.trim() && !submitting
                  ? theme.colors.primary.DEFAULT
                  : theme.colors.dark.surfaceLight,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Send color="white" size={18} />
              )}
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
