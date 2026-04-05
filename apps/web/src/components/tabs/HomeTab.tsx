"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPosts, getFriendCircles, getNotifications, markNotificationRead, markAllNotificationsRead, createFriendCircle, getUserLikedIds, getBatchLikesCount, uploadImage, awardPoints, supabase } from "@friendscircle/supabase";
import { Chip } from "@friendscircle/ui";
import { PostCard } from "../PostCard";
import { FriendCircleCard } from "../FriendCircleCard";
import { CircleDetailSheet } from "../CircleDetailSheet";
import { Bell, X, Check, Loader2, Users, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";

const FEED_FILTERS = ["All", "My Uni", "Trending"];

export function HomeTab() {
  const { user, profile } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [creatingCircle, setCreatingCircle] = useState(false);
  const [circlePhoto, setCirclePhoto] = useState<{ file: File; preview: string } | null>(null);
  const circlePhotoRef = useRef<HTMLInputElement>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  // Build filters based on active pill
  const buildFilters = () => {
    const base: Record<string, any> = { page: 1, limit: 20 };
    if (activeFilter === "My Uni" && profile?.university_id) {
      base.university_id = profile.university_id;
    }
    if (activeFilter === "Trending") {
      base.sort_by = "likes";
    }
    return base;
  };

  const { data: postsData, isLoading: postsLoading, isError: postsError } = useQuery({
    queryKey: ["posts", "home", activeFilter, profile?.university_id],
    queryFn: () => getPosts(buildFilters()),
  });

  const posts = (postsData?.data as any[]) || [];
  const postIds = useMemo(() => posts.map((p: any) => p.id), [posts]);

  // Batch fetch liked status for all visible posts
  const { data: likedIds, refetch: refetchLikedIds } = useQuery({
    queryKey: ["likedIds", "post", postIds, user?.id],
    queryFn: () => getUserLikedIds(user!.id, "post", postIds),
    enabled: !!user && postIds.length > 0,
  });

  // Batch fetch likes count for all visible posts
  const { data: postLikesMap } = useQuery({
    queryKey: ["likesCount", "post", postIds],
    queryFn: () => getBatchLikesCount("post", postIds),
    enabled: postIds.length > 0,
  });

  const { data: circlesData } = useQuery({
    queryKey: ["circles", "home"],
    queryFn: () => getFriendCircles({ page: 1, limit: 5 }),
  });

  const circles = (circlesData?.data as any[]) || [];
  const circleIds = useMemo(() => circles.map((c: any) => c.id), [circles]);

  // Batch fetch liked status for circles
  const { data: likedCircleIds, refetch: refetchLikedCircleIds } = useQuery({
    queryKey: ["likedIds", "circle", circleIds, user?.id],
    queryFn: () => getUserLikedIds(user!.id, "circle", circleIds),
    enabled: !!user && circleIds.length > 0,
  });

  // Batch fetch likes count for circles
  const { data: circleLikesMap } = useQuery({
    queryKey: ["likesCount", "circle", circleIds],
    queryFn: () => getBatchLikesCount("circle", circleIds),
    enabled: circleIds.length > 0,
  });

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user,
  });

  const notifications = (notifData?.data as any[]) || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // Realtime: auto-refresh when new notifications arrive
  const stableRefetchNotifs = useCallback(() => { refetchNotifs(); }, [refetchNotifs]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => stableRefetchNotifs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, stableRefetchNotifs]);

  const handleLikeToggled = () => {
    refetchLikedIds();
    queryClient.invalidateQueries({ queryKey: ["posts", "home"] });
  };

  const handleCircleLikeToggled = () => {
    refetchLikedCircleIds();
    queryClient.invalidateQueries({ queryKey: ["circles"] });
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    refetchNotifs();
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    refetchNotifs();
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim() || !user) return;
    setCreatingCircle(true);

    let photo_url: string | null = null;
    if (circlePhoto) {
      try {
        const result = await uploadImage(circlePhoto.file, "circles");
        photo_url = result.secure_url;
      } catch {
        addToast("Failed to upload photo", "error");
        setCreatingCircle(false);
        return;
      }
    }

    const { error } = await createFriendCircle({
      name: circleName.trim(),
      creator_id: user.id,
      university_id: profile?.university_id || null,
      campus_id: profile?.campus_id || null,
      is_public: true,
      photo_url,
    });
    setCreatingCircle(false);
    if (error) {
      addToast("Failed to create circle", "error");
    } else {
      if (user) awardPoints(user.id, 15);
      addToast("Friend circle created!", "success");
      setCircleName("");
      if (circlePhoto) URL.revokeObjectURL(circlePhoto.preview);
      setCirclePhoto(null);
      setShowCreateCircle(false);
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gradient">FriendsCircle</h1>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-full hover:bg-surface-light transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-coral rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FEED_FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="mx-4 mt-2 glass rounded-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif: any) => (
                <button
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkRead(notif.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/20 hover:bg-surface-light transition-colors ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <p className="text-sm text-text-primary">{notif.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{notif.body}</p>
                  {!notif.read && (
                    <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mt-1" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Friend Circles Horizontal Scroll */}
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-text-secondary mb-2">
          Friend Circles
        </h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {/* Create Circle CTA */}
          <button
            onClick={() => setShowCreateCircle(true)}
            className="flex-shrink-0 w-20 flex flex-col items-center gap-1"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center">
              <span className="text-primary text-2xl">+</span>
            </div>
            <span className="text-[10px] text-text-muted">Create</span>
          </button>
          {circles.map((circle: any) => (
            <FriendCircleCard
              key={circle.id}
              circle={circle}
              variant="compact"
              liked={likedCircleIds?.has(circle.id) || false}
              likesCount={circleLikesMap?.get(circle.id) || 0}
              onLikeToggled={handleCircleLikeToggled}
              onClick={() => setSelectedCircleId(circle.id)}
            />
          ))}
        </div>
      </div>

      {/* Create Circle Dialog */}
      {showCreateCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateCircle(false)} />
          <div className="relative glass rounded-card p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Create Friend Circle</h3>
            </div>
            <input
              type="text"
              placeholder="Circle name (e.g. Study Squad)"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCircle()}
              className="input-field"
              autoFocus
            />
            {/* Photo upload */}
            <input
              ref={circlePhotoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (circlePhoto) URL.revokeObjectURL(circlePhoto.preview);
                  setCirclePhoto({ file, preview: URL.createObjectURL(file) });
                }
              }}
            />
            {circlePhoto ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={circlePhoto.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => { URL.revokeObjectURL(circlePhoto.preview); setCirclePhoto(null); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => circlePhotoRef.current?.click()}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Add photo (optional)
              </button>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateCircle(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-light rounded-button transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCircle}
                disabled={!circleName.trim() || creatingCircle}
                className="flex items-center gap-2 gradient-primary text-white font-semibold px-4 py-2 rounded-button shadow-glow disabled:opacity-50 text-sm"
              >
                {creatingCircle && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="px-4 space-y-3 pb-4">
        {postsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-card h-40 animate-pulse"
            />
          ))
        ) : postsError ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Failed to load posts. Please try again.
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["posts", "home"] })}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedIds?.has(post.id) || false}
              likesCount={postLikesMap?.get(post.id) || 0}
              commentsCount={(post.comments?.[0]?.count) || 0}
              onLikeToggled={handleLikeToggled}
              onDeleted={() => queryClient.invalidateQueries({ queryKey: ["posts", "home"] })}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📭</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No posts yet
            </h3>
            <p className="text-sm text-text-secondary">
              Be the first to post at your university!
            </p>
          </div>
        )}
      </div>

      {/* Circle Detail Sheet */}
      {selectedCircleId && (
        <CircleDetailSheet
          circleId={selectedCircleId}
          onClose={() => setSelectedCircleId(null)}
        />
      )}
    </div>
  );
}
