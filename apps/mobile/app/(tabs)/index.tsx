import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPosts, getProfile } from "@friendscircle/supabase";
import { theme } from "@friendscircle/ui";
import { Heart, MessageCircle } from "lucide-react-native";
import { useAuth } from "../_layout";

const FILTERS = ["All", "My Uni", "Trending"];

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  const profile = profileData?.data as any;

  const buildFilters = useCallback(() => {
    const base: Record<string, any> = { page: 1, limit: 20 };
    if (activeFilter === "My Uni" && profile?.university_id) {
      base.university_id = profile.university_id;
    }
    return base;
  }, [activeFilter, profile?.university_id]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", "home", activeFilter, profile?.university_id],
    queryFn: () => getPosts(buildFilters()),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const posts = (data?.data as any[]) || [];

  const renderFilterPills = () => (
    <View style={{ flexDirection: "row", marginBottom: 16, gap: 8 }}>
      {FILTERS.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => setActiveFilter(filter)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: activeFilter === filter ? theme.colors.primary.DEFAULT : theme.colors.dark.surfaceLight,
          }}
        >
          <Text
            style={{
              color: activeFilter === filter ? "white" : theme.colors.dark.textSecondary,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderPost = useCallback(({ item: post }: { item: any }) => (
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
      {/* Author */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
            {post.profiles?.full_name?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.dark.textPrimary, fontWeight: "600", fontSize: 13 }}>
            {post.profiles?.full_name || "Anonymous"}
          </Text>
          <Text style={{ color: theme.colors.dark.textMuted, fontSize: 11 }}>
            {post.universities?.short_name || ""}
          </Text>
        </View>
      </View>

      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
        {post.title}
      </Text>
      {post.body ? (
        <Text
          style={{
            color: theme.colors.dark.textSecondary,
            fontSize: 14,
            marginTop: 4,
          }}
          numberOfLines={3}
        >
          {post.body}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: theme.colors.dark.border }}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Heart color={theme.colors.dark.textMuted} size={18} />
          <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12 }}>
            0
          </Text>
        </Pressable>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MessageCircle color={theme.colors.dark.textMuted} size={18} />
          <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12 }}>
            {(post.comments?.[0]?.count) || 0}
          </Text>
        </Pressable>
      </View>
    </View>
  ), []);

  const renderEmpty = () => {
    if (isError) {
      return (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>
            Something went wrong
          </Text>
          <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 16 }}>
            Failed to load posts. Pull down to try again.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ alignItems: "center", paddingTop: 60 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>
          No posts yet
        </Text>
        <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, textAlign: "center" }}>
          Be the first to post at your university!
        </Text>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            height: 160,
            backgroundColor: theme.colors.dark.surface,
            borderRadius: 16,
          }}
        />
      ))}
    </View>
  );

  if (isLoading && !refreshing) return renderSkeleton();

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
      ListHeaderComponent={renderFilterPills}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
