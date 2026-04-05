import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { theme } from "@friendscircle/ui";
import { getTimeAgo } from "@friendscircle/shared";
import { useQuery } from "@tanstack/react-query";
import { getMyComments } from "@friendscircle/supabase";
import { useAuth } from "../_layout";
import { useMemo, useCallback } from "react";

export default function ThreadsScreen() {
  const { user } = useAuth();

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["myComments", user?.id],
    queryFn: () => getMyComments(user!.id),
    enabled: !!user,
  });

  const comments = (commentsData?.data as any[]) || [];

  // Group comments by post
  const threads = useMemo(() => {
    const grouped = comments.reduce<Record<string, { post: any; comments: any[] }>>(
      (acc, comment) => {
        const postId = comment.post_id;
        if (!postId || !comment.posts) return acc;
        if (!acc[postId]) {
          acc[postId] = { post: comment.posts, comments: [] };
        }
        acc[postId].comments.push(comment);
        return acc;
      },
      {}
    );
    return Object.values(grouped);
  }, [comments]);

  const renderThread = useCallback(({ item }: { item: { post: any; comments: any[] } }) => (
    <View
      style={{
        backgroundColor: theme.colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: theme.colors.dark.border,
      }}
    >
      {/* Post context */}
      <Text style={{ color: theme.colors.dark.textPrimary, fontWeight: "bold", fontSize: 15, marginBottom: 4 }}>
        {item.post.title}
      </Text>
      <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12, marginBottom: 12 }}>
        by {item.post.profiles?.full_name || "Unknown"}
      </Text>

      {/* User's comments */}
      <View style={{ borderLeftWidth: 2, borderLeftColor: theme.colors.primary.DEFAULT + "50", paddingLeft: 12, gap: 8 }}>
        {item.comments.map((comment: any) => (
          <View key={comment.id}>
            <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14 }}>
              {comment.body}
            </Text>
            <Text style={{ color: theme.colors.dark.textMuted, fontSize: 10, marginTop: 2 }}>
              {getTimeAgo(comment.created_at)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  ), []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.dark.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  if (threads.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.dark.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.colors.dark.surfaceLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <MessageCircle color={theme.colors.dark.textMuted} size={32} />
        </View>
        <Text
          style={{
            color: theme.colors.dark.textPrimary,
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          No threads yet
        </Text>
        <Text
          style={{
            color: theme.colors.dark.textSecondary,
            fontSize: 14,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          When you comment on posts or someone replies to you, your conversations
          will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={threads}
      renderItem={renderThread}
      keyExtractor={(item) => item.post.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

