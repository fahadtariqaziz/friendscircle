import React from "react";
import type { PostType } from "@friendscircle/shared";

const POST_TYPE_CONFIG: Record<
  PostType | "friend_circle",
  { label: string; emoji: string; color: string }
> = {
  friend_circle: { label: "Friends Circle", emoji: "👥", color: "text-primary" },
  olx: { label: "Student OLX", emoji: "🛍️", color: "text-accent-amber" },
  lost_found: { label: "Lost & Found", emoji: "🔎", color: "text-accent-coral" },
  teacher_review: { label: "Teacher Reviews", emoji: "⭐", color: "text-accent-amber" },
  past_paper: { label: "Past Papers", emoji: "📄", color: "text-primary-light" },
  roommate: { label: "Roommate Finder", emoji: "🏠", color: "text-accent-teal" },
  ride_share: { label: "Ride Share", emoji: "🚗", color: "text-accent-mint" },
  freelance: { label: "Freelance Hub", emoji: "💼", color: "text-primary" },
  job: { label: "Jobs", emoji: "💰", color: "text-accent-mint" },
  event: { label: "Events", emoji: "🎉", color: "text-accent-coral" },
  memory: { label: "Uni Memories", emoji: "📸", color: "text-accent-amber" },
};

interface PostTypeIconProps {
  type: PostType | "friend_circle";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function PostTypeIcon({
  type,
  showLabel = false,
  size = "md",
  className = "",
}: PostTypeIconProps) {
  const config = POST_TYPE_CONFIG[type];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={sizeClasses[size]}>{config.emoji}</span>
      {showLabel && (
        <span className={`font-medium ${config.color}`}>{config.label}</span>
      )}
    </div>
  );
}

export function getPostTypeLabel(type: PostType | "friend_circle"): string {
  return POST_TYPE_CONFIG[type]?.label || type;
}
