import { View, Text, ScrollView, FlatList, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Search, ArrowLeft } from "lucide-react-native";
import { theme } from "@friendscircle/ui";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "@friendscircle/supabase";

const FEATURES = [
  { type: "friend_circle", label: "Friends Circle", emoji: "\u{1F465}", color: "#6C5CE7" },
  { type: "olx", label: "Student OLX", emoji: "\u{1F6CD}\uFE0F", color: "#FDCB6E" },
  { type: "lost_found", label: "Lost & Found", emoji: "\u{1F50E}", color: "#FF6B6B" },
  { type: "teacher_review", label: "Teacher Reviews", emoji: "\u2B50", color: "#FDCB6E" },
  { type: "past_paper", label: "Past Papers", emoji: "\u{1F4C4}", color: "#A29BFE" },
  { type: "roommate", label: "Roommate Finder", emoji: "\u{1F3E0}", color: "#00CEC9" },
  { type: "ride_share", label: "Ride Share", emoji: "\u{1F697}", color: "#55EFC4" },
  { type: "freelance", label: "Freelance Hub", emoji: "\u{1F4BC}", color: "#6C5CE7" },
  { type: "job", label: "Jobs", emoji: "\u{1F4B0}", color: "#55EFC4" },
  { type: "event", label: "Events", emoji: "\u{1F389}", color: "#FF6B6B" },
  { type: "memory", label: "Uni Memories", emoji: "\u{1F4F8}", color: "#FDCB6E" },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  // Search query (debounced)
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["posts", "search", debouncedSearch],
    queryFn: () => getPosts({ search: debouncedSearch, page: 1, limit: 20 }),
    enabled: debouncedSearch.length >= 2,
  });

  // Category query
  const { data: categoryData, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ["posts", "explore", selectedType],
    queryFn: () => getPosts({ post_type: selectedType as any, page: 1, limit: 50 }),
    enabled: !!selectedType && selectedType !== "friend_circle",
  });

  const searchResults = (searchData?.data as any[]) || [];
  const categoryPosts = (categoryData?.data as any[]) || [];

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
      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>{post.title}</Text>
      {post.body ? (
        <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, marginTop: 4 }} numberOfLines={3}>
          {post.body}
        </Text>
      ) : null}
    </View>
  ), []);

  // Category detail view
  if (selectedType) {
    const feature = FEATURES.find((f) => f.type === selectedType);

    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}>
        <Pressable
          onPress={() => setSelectedType(null)}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingBottom: 8 }}
        >
          <ArrowLeft color={theme.colors.dark.textSecondary} size={20} />
          <Text style={{ color: theme.colors.dark.textPrimary, fontSize: 18, fontWeight: "bold" }}>
            {feature?.emoji} {feature?.label}
          </Text>
        </Pressable>

        {categoryLoading ? (
          <ActivityIndicator color={theme.colors.primary.DEFAULT} style={{ marginTop: 40 }} />
        ) : categoryError ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Failed to load</Text>
            <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, marginTop: 4 }}>
              Please go back and try again.
            </Text>
          </View>
        ) : categoryPosts.length > 0 ? (
          <FlatList
            data={categoryPosts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        ) : (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{feature?.emoji}</Text>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
              No {feature?.label?.toLowerCase()} yet
            </Text>
            <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, marginTop: 4 }}>
              Be the first to post!
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.dark.surfaceLight,
          borderRadius: 12,
          paddingHorizontal: 12,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: theme.colors.dark.border,
        }}
      >
        <Search color={theme.colors.dark.textMuted} size={18} />
        <TextInput
          placeholder="Search posts, teachers, courses..."
          placeholderTextColor={theme.colors.dark.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            color: theme.colors.dark.textPrimary,
            fontSize: 14,
          }}
        />
      </View>

      {/* Search Results */}
      {debouncedSearch.length >= 2 ? (
        searchLoading ? (
          <ActivityIndicator color={theme.colors.primary.DEFAULT} style={{ marginTop: 40 }} />
        ) : searchResults.length > 0 ? (
          <>
            <Text style={{ color: theme.colors.dark.textMuted, fontSize: 12, marginBottom: 12 }}>
              {searchResults.length} results for &quot;{search}&quot;
            </Text>
            {searchResults.map((post: any) => (
              <View
                key={post.id}
                style={{
                  backgroundColor: theme.colors.dark.surface,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 0.5,
                  borderColor: theme.colors.dark.border,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>{post.title}</Text>
                {post.body ? (
                  <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14, marginTop: 4 }} numberOfLines={2}>
                    {post.body}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        ) : (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14 }}>
              No results for &quot;{search}&quot;
            </Text>
          </View>
        )
      ) : (
        /* Bento Grid */
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {FEATURES.map((feature) => (
            <Pressable
              key={feature.type}
              onPress={() => setSelectedType(feature.type)}
              style={{
                width: "48%",
                backgroundColor: theme.colors.dark.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.colors.dark.border,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: feature.color + "20",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>{feature.emoji}</Text>
              </View>
              <Text
                style={{
                  color: theme.colors.dark.textPrimary,
                  fontWeight: "bold",
                  fontSize: 14,
                  marginBottom: 2,
                }}
              >
                {feature.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
