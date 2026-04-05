"use client";

import { memo, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { FriendCircle } from "@friendscircle/shared";
import { toggleLike } from "@friendscircle/supabase";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";

interface FriendCircleCardProps {
  circle: FriendCircle;
  variant?: "compact" | "full";
  liked?: boolean;
  likesCount?: number;
  onLikeToggled?: () => void;
  onClick?: () => void;
}

export const FriendCircleCard = memo(function FriendCircleCard({
  circle,
  variant = "full",
  liked = false,
  likesCount = 0,
  onLikeToggled,
  onClick,
}: FriendCircleCardProps) {
  const { user } = useAuthStore();
  const [optimisticDelta, setOptimisticDelta] = useState<number | null>(null);

  const displayLiked = optimisticDelta !== null ? (optimisticDelta > 0) : liked;
  const displayLikesCount = optimisticDelta !== null
    ? likesCount + optimisticDelta
    : likesCount;

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(user!.id, "circle", circle.id),
    onMutate: () => {
      setOptimisticDelta(liked ? -1 : 1);
    },
    onSuccess: () => {
      onLikeToggled?.();
    },
    onSettled: () => {
      setOptimisticDelta(null);
    },
  });

  if (variant === "compact") {
    return (
      <button onClick={onClick} className="flex-shrink-0 w-20 flex flex-col items-center gap-1">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
          {circle.photo_url ? (
            <img
              src={circle.photo_url}
              alt={circle.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center text-xl">
              👥
            </div>
          )}
        </div>
        <span className="text-[10px] text-text-secondary truncate w-full text-center">
          {circle.name}
        </span>
      </button>
    );
  }

  return (
    <div className="glass rounded-card p-4 space-y-3">
      {/* Photo */}
      <div className="rounded-xl overflow-hidden h-40">
        {circle.photo_url ? (
          <img
            src={circle.photo_url}
            alt={circle.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <span className="text-6xl">👥</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-text-primary">{circle.name}</h3>
        <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
          <span>{circle.university?.short_name || ""}</span>
          {circle.campus && (
            <>
              <span>·</span>
              <span>{circle.campus.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Members */}
      {circle.members && circle.members.length > 0 && (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {circle.members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full border-2 border-surface gradient-primary flex items-center justify-center text-[10px] text-white font-bold"
              >
                {member.profile?.full_name?.[0] || "?"}
              </div>
            ))}
          </div>
          {circle.members.length > 4 && (
            <span className="ml-2 text-xs text-text-muted">
              +{circle.members.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/30">
        <button
          onClick={() => user && likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1.5 transition-colors group ${
            displayLiked ? "text-accent-coral" : "text-text-muted hover:text-accent-coral"
          }`}
          aria-label={displayLiked ? "Unlike" : "Like"}
        >
          <Heart className={`w-4 h-4 ${displayLiked ? "fill-accent-coral" : "group-hover:fill-accent-coral"}`} />
          <span className="text-xs">{displayLikesCount || 0}</span>
        </button>
        <button className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{circle.comments_count || 0}</span>
        </button>
      </div>
    </div>
  );
});
