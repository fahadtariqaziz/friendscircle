import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { theme } from "@friendscircle/ui";
import { useState } from "react";
import { createPost } from "@friendscircle/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../_layout";

const POST_TYPES = [
  { type: "olx", label: "Student OLX", emoji: "\u{1F6CD}\uFE0F" },
  { type: "lost_found", label: "Lost & Found", emoji: "\u{1F50E}" },
  { type: "teacher_review", label: "Teacher Review", emoji: "\u2B50" },
  { type: "past_paper", label: "Past Paper", emoji: "\u{1F4C4}" },
  { type: "roommate", label: "Roommate", emoji: "\u{1F3E0}" },
  { type: "ride_share", label: "Ride Share", emoji: "\u{1F697}" },
  { type: "freelance", label: "Freelance", emoji: "\u{1F4BC}" },
  { type: "job", label: "Job", emoji: "\u{1F4B0}" },
  { type: "event", label: "Event", emoji: "\u{1F389}" },
  { type: "memory", label: "Memory", emoji: "\u{1F4F8}" },
];

export default function CreateScreen() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!title.trim() || !selectedType) return;

    if (!user) {
      Alert.alert("Error", "You must be logged in to post.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await createPost({
        user_id: user.id,
        post_type: selectedType,
        title: title.trim(),
        body: body.trim() || null,
        status: "approved", // TODO: change back to "pending" when admin approval is needed
        metadata: null,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Post submitted! It will appear after approval.");
        setTitle("");
        setBody("");
        setSelectedType(null);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: theme.colors.dark.textPrimary,
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          Create Post
        </Text>

        {!selectedType ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {POST_TYPES.map((pt) => (
              <Pressable
                key={pt.type}
                onPress={() => setSelectedType(pt.type)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: theme.colors.dark.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 0.5,
                  borderColor: theme.colors.dark.border,
                  width: "48%",
                }}
              >
                <Text style={{ fontSize: 20 }}>{pt.emoji}</Text>
                <Text
                  style={{
                    color: theme.colors.dark.textPrimary,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Pressable onPress={() => setSelectedType(null)}>
              <Text style={{ color: theme.colors.primary.DEFAULT, fontSize: 14 }}>
                ← Change type
              </Text>
            </Pressable>

            <TextInput
              placeholder="Title"
              placeholderTextColor={theme.colors.dark.textMuted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              style={{
                backgroundColor: theme.colors.dark.surfaceLight,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.dark.textPrimary,
                fontSize: 16,
                borderWidth: 0.5,
                borderColor: theme.colors.dark.border,
              }}
            />

            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.dark.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: theme.colors.dark.surfaceLight,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.dark.textPrimary,
                fontSize: 14,
                minHeight: 100,
                textAlignVertical: "top",
                borderWidth: 0.5,
                borderColor: theme.colors.dark.border,
              }}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
              style={{
                backgroundColor: title.trim() && !loading
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
              {loading && <ActivityIndicator color="white" size="small" />}
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                {loading ? "Posting..." : "Post"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
