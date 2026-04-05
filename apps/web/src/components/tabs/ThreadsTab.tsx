"use client";

import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyComments } from "@friendscircle/supabase";
import { getPostTypeLabel } from "@friendscircle/ui";
import { getTimeAgo } from "@friendscircle/shared";
import { useAuthStore } from "@/store/auth";

export function ThreadsTab() {
  const { user } = useAuthStore();

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["myComments", user?.id],
    queryFn: () => getMyComments(user!.id),
    enabled: !!user,
  });

  const comments = (commentsData?.data as any[]) || [];

  // Group comments by post
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

  const threads = Object.values(grouped);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3">
        <h1 className="text-xl font-bold text-text-primary">Threads</h1>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-3 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-card h-24 animate-pulse" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No threads yet
          </h3>
          <p className="text-sm text-text-secondary text-center max-w-xs">
            When you comment on posts or someone replies to you, your
            conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3 py-4">
          {threads.map(({ post, comments }) => (
            <div key={post.id} className="glass rounded-card p-4 space-y-3">
              {/* Post context */}
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-pill">
                  {getPostTypeLabel(post.post_type)}
                </span>
                <span className="text-sm font-semibold text-text-primary truncate flex-1">
                  {post.title}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                by {post.profiles?.full_name || "Unknown"}
              </p>

              {/* User's comments on this post */}
              <div className="space-y-2 border-l-2 border-primary/30 pl-3">
                {comments.map((comment: any) => (
                  <div key={comment.id}>
                    <p className="text-sm text-text-secondary">{comment.body}</p>
                    <span className="text-[10px] text-text-muted">
                      {getTimeAgo(comment.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

