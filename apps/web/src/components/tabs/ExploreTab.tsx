"use client";

import { useState, useDeferredValue, useMemo } from "react";
import { Search, ArrowLeft, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPosts, getUserLikedIds, getBatchLikesCount } from "@friendscircle/supabase";
import { PostCard } from "../PostCard";
import { useAuthStore } from "@/store/auth";
import type { PostType } from "@friendscircle/shared";

const FEATURES: {
  type: PostType | "friend_circle";
  label: string;
  emoji: string;
  color: string;
  description: string;
}[] = [
  {
    type: "friend_circle",
    label: "Friends Circle",
    emoji: "👥",
    color: "from-primary to-primary-light",
    description: "Create & share your squad",
  },
  {
    type: "olx",
    label: "Student OLX",
    emoji: "🛍️",
    color: "from-accent-amber to-yellow-500",
    description: "Buy & sell on campus",
  },
  {
    type: "lost_found",
    label: "Lost & Found",
    emoji: "🔎",
    color: "from-accent-coral to-red-500",
    description: "Find what you lost",
  },
  {
    type: "teacher_review",
    label: "Teacher Reviews",
    emoji: "⭐",
    color: "from-accent-amber to-orange-500",
    description: "Rate your teachers",
  },
  {
    type: "past_paper",
    label: "Past Papers",
    emoji: "📄",
    color: "from-primary-light to-blue-500",
    description: "Share & find papers",
  },
  {
    type: "roommate",
    label: "Roommate Finder",
    emoji: "🏠",
    color: "from-accent-teal to-cyan-500",
    description: "Find your roommate",
  },
  {
    type: "ride_share",
    label: "Ride Share",
    emoji: "🚗",
    color: "from-accent-mint to-emerald-500",
    description: "Share rides & save",
  },
  {
    type: "freelance",
    label: "Freelance Hub",
    emoji: "💼",
    color: "from-primary to-violet-500",
    description: "Get help or earn",
  },
  {
    type: "job",
    label: "Jobs",
    emoji: "💰",
    color: "from-accent-mint to-green-500",
    description: "Find opportunities",
  },
  {
    type: "event",
    label: "Events",
    emoji: "🎉",
    color: "from-accent-coral to-pink-500",
    description: "Campus happenings",
  },
  {
    type: "memory",
    label: "Uni Memories",
    emoji: "📸",
    color: "from-accent-amber to-amber-500",
    description: "Share your moments",
  },
];

export function ExploreTab() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Search results
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["posts", "search", deferredSearch],
    queryFn: () => getPosts({ search: deferredSearch, page: 1, limit: 30 }),
    enabled: deferredSearch.length >= 2,
  });

  const searchResults = (searchData?.data as any[]) || [];
  const searchPostIds = useMemo(() => searchResults.map((p: any) => p.id), [searchResults]);

  const { data: searchLikedIds, refetch: refetchSearchLikes } = useQuery({
    queryKey: ["likedIds", "post", "search", searchPostIds, user?.id],
    queryFn: () => getUserLikedIds(user!.id, "post", searchPostIds),
    enabled: !!user && searchPostIds.length > 0,
  });

  const { data: searchLikesMap } = useQuery({
    queryKey: ["likesCount", "post", "search", searchPostIds],
    queryFn: () => getBatchLikesCount("post", searchPostIds),
    enabled: searchPostIds.length > 0,
  });

  const queryClient = useQueryClient();
  const handleSearchLikeToggled = () => {
    refetchSearchLikes();
    queryClient.invalidateQueries({ queryKey: ["posts", "search"] });
  };

  if (selectedFeature) {
    return (
      <FeatureView
        type={selectedFeature as PostType}
        onBack={() => setSelectedFeature(null)}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3">
        <h1 className="text-xl font-bold text-text-primary mb-3">Explore</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search posts, teachers, courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-light border border-border rounded-button pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {deferredSearch.length >= 2 ? (
        <div className="px-4 py-3 space-y-3">
          {searchLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-card h-28 animate-pulse" />
            ))
          ) : searchResults.length > 0 ? (
            <>
              <p className="text-xs text-text-muted">{searchResults.length} results for &quot;{deferredSearch}&quot;</p>
              {searchResults.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={searchLikedIds?.has(post.id) || false}
                  likesCount={searchLikesMap?.get(post.id) || 0}
                  commentsCount={(post.comments?.[0]?.count) || 0}
                  onLikeToggled={handleSearchLikeToggled}
                  onDeleted={() => queryClient.invalidateQueries({ queryKey: ["posts"] })}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No results for &quot;{deferredSearch}&quot;</p>
              <p className="text-xs text-text-muted mt-1">Try different keywords</p>
            </div>
          )}
        </div>
      ) : (
        /* Bento Grid */
        <div className="px-4 py-3 grid grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <button
              key={feature.type}
              onClick={() => setSelectedFeature(feature.type)}
              className="glass rounded-card p-4 text-left hover:border-primary/50 transition-all active:scale-[0.97] group"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <span className="text-2xl">{feature.emoji}</span>
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-0.5">
                {feature.label}
              </h3>
              <p className="text-[11px] text-text-muted">{feature.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureView({
  type,
  onBack,
}: {
  type: PostType;
  onBack: () => void;
}) {
  const feature = FEATURES.find((f) => f.type === type);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading, isError } = useQuery({
    queryKey: ["posts", "explore", type],
    queryFn: () => getPosts({ post_type: type as PostType, page: 1, limit: 50 }),
  });

  const posts = (postsData?.data as any[]) || [];
  const postIds = useMemo(() => posts.map((p: any) => p.id), [posts]);

  const { data: likedIds, refetch: refetchLikedIds } = useQuery({
    queryKey: ["likedIds", "post", "explore", type, postIds, user?.id],
    queryFn: () => getUserLikedIds(user!.id, "post", postIds),
    enabled: !!user && postIds.length > 0,
  });

  const { data: featureLikesMap } = useQuery({
    queryKey: ["likesCount", "post", "explore", type, postIds],
    queryFn: () => getBatchLikesCount("post", postIds),
    enabled: postIds.length > 0,
  });

  const handleLikeToggled = () => {
    refetchLikedIds();
    queryClient.invalidateQueries({ queryKey: ["posts", "explore", type] });
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-surface-light transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">
            {feature?.emoji} {feature?.label}
          </h1>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-card h-32 animate-pulse" />
          ))
        ) : isError ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to load</h3>
            <p className="text-sm text-text-secondary">Please go back and try again.</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedIds?.has(post.id) || false}
              likesCount={featureLikesMap?.get(post.id) || 0}
              commentsCount={(post.comments?.[0]?.count) || 0}
              onLikeToggled={handleLikeToggled}
              onDeleted={() => queryClient.invalidateQueries({ queryKey: ["posts"] })}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">{feature?.emoji}</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No {feature?.label?.toLowerCase()} yet
            </h3>
            <p className="text-sm text-text-secondary">
              Be the first to post! Tap the + button.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
