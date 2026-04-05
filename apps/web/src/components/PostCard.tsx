"use client";

import { useState, memo, useCallback, useRef, useMemo } from "react";
import { Heart, MessageCircle, MoreHorizontal, Share2, MapPin, Clock, DollarSign, Star, Car, Home, Briefcase, CheckCircle, Send, Loader2, Trash2, X, Flag, Link2 } from "lucide-react";
import { getPostTypeLabel } from "@friendscircle/ui";
import { getTimeAgo } from "@friendscircle/shared";
import { approvePost, toggleLike, getComments, createComment, deleteComment, deletePost, getUserLikedIds, getBatchLikesCount, awardPoints } from "@friendscircle/supabase";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PostCardProps {
  post: any;
  liked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  onLikeToggled?: () => void;
  onDeleted?: () => void;
}

export const PostCard = memo(function PostCard({ post, liked = false, likesCount = 0, commentsCount = 0, onLikeToggled, onDeleted }: PostCardProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const profile = post.profiles;
  const university = post.universities;
  const campus = post.campuses;
  const meta = post.metadata as Record<string, any> | null;
  const timeAgo = getTimeAgo(post.created_at);
  const isOwn = user?.id === post.user_id;
  const isPending = post.status === "pending";

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [optimisticDelta, setOptimisticDelta] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [longPressCommentId, setLongPressCommentId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [optimisticCommentLikes, setOptimisticCommentLikes] = useState<Map<string, number>>(new Map());

  const displayLiked = optimisticDelta !== null ? (optimisticDelta > 0) : liked;
  const displayLikesCount = optimisticDelta !== null
    ? likesCount + optimisticDelta
    : likesCount;

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(user!.id, "post", post.id),
    onMutate: () => {
      setOptimisticDelta(liked ? -1 : 1);
    },
    onSuccess: (result) => {
      if (result?.liked && user) awardPoints(user.id, 2);
      onLikeToggled?.();
    },
    onSettled: () => {
      setOptimisticDelta(null);
    },
  });

  const { data: commentsData } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => getComments(post.id),
    enabled: showComments,
  });

  const allComments = (commentsData?.data as any[]) || [];
  const parentComments = allComments.filter((c: any) => !c.parent_id);
  const repliesMap = new Map<string, any[]>();
  for (const c of allComments) {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) || [];
      arr.push(c);
      repliesMap.set(c.parent_id, arr);
    }
  }

  const commentIds = useMemo(() => allComments.map((c: any) => c.id), [allComments]);

  const { data: likedCommentIds } = useQuery({
    queryKey: ["likedIds", "comment", commentIds, user?.id],
    queryFn: () => getUserLikedIds(user!.id, "comment", commentIds),
    enabled: !!user && commentIds.length > 0 && showComments,
  });

  const { data: commentLikesMap } = useQuery({
    queryKey: ["likesCount", "comment", commentIds],
    queryFn: () => getBatchLikesCount("comment", commentIds),
    enabled: commentIds.length > 0 && showComments,
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) => toggleLike(user!.id, "comment", commentId),
    onMutate: (commentId) => {
      const isLiked = likedCommentIds?.has(commentId);
      setOptimisticCommentLikes((prev) => {
        const next = new Map(prev);
        next.set(commentId, isLiked ? -1 : 1);
        return next;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likedIds", "comment"] });
      queryClient.invalidateQueries({ queryKey: ["likesCount", "comment"] });
    },
    onSettled: (_, __, commentId) => {
      setOptimisticCommentLikes((prev) => {
        const next = new Map(prev);
        next.delete(commentId);
        return next;
      });
    },
  });

  const isCommentLiked = (commentId: string) => {
    const delta = optimisticCommentLikes.get(commentId);
    if (delta !== undefined) return delta > 0;
    return likedCommentIds?.has(commentId) || false;
  };

  const getCommentLikes = (commentId: string) => {
    const base = commentLikesMap?.get(commentId) || 0;
    const delta = optimisticCommentLikes.get(commentId);
    if (delta !== undefined) return base + delta;
    return base;
  };

  const handleLongPressStart = (commentId: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressCommentId(commentId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const commentMutation = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string }) =>
      createComment({ post_id: post.id, user_id: user!.id, body, ...(parentId ? { parent_id: parentId } : {}) }),
    onSuccess: () => {
      if (user) awardPoints(user.id, 5);
      setCommentText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
    },
  });

  const handleApprove = useCallback(async () => {
    const { error } = await approvePost(post.id);
    if (error) {
      addToast("Failed to approve post", "error");
    } else {
      addToast("Post approved! Now visible to everyone.", "success");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  }, [post.id, addToast, queryClient]);

  const handleSubmitComment = useCallback(() => {
    if (!commentText.trim() || !user) return;
    commentMutation.mutate({ body: commentText.trim(), parentId: replyingTo?.id });
  }, [commentText, user, commentMutation, replyingTo]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: post.title,
      text: post.body || post.title,
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${post.title}\n${window.location.origin}`);
        addToast("Link copied to clipboard!", "success");
      }
    } catch {
      // User cancelled share dialog
    }
  }, [post.title, post.body, addToast]);

  return (
    <>
      <div className="glass rounded-card overflow-hidden">
        {/* Header - Instagram style */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
            {profile?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary text-sm truncate">
                {profile?.full_name || "Anonymous"}
              </span>
              <span className="text-[10px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded-pill">
                {getPostTypeLabel(post.post_type)}
              </span>
              {post.status === "pending" && (
                <span className="text-[10px] bg-accent-amber/20 text-accent-amber px-2 py-0.5 rounded-pill font-medium">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <span>{university?.short_name || ""}</span>
              {campus && (
                <>
                  <span>&middot;</span>
                  <span>{campus.name}</span>
                </>
              )}
            </div>
          </div>
          {/* Three dots menu */}
          <div className="relative">
            <button
              onClick={() => setShowPostMenu((v) => !v)}
              className="p-2 rounded-full hover:bg-surface-light transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5 text-text-muted" />
            </button>
            {showPostMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPostMenu(false)} />
                <div className="absolute right-0 top-10 z-20 bg-surface rounded-xl shadow-lg border border-border/30 overflow-hidden min-w-[180px]">
                  <button
                    onClick={() => { handleShare(); setShowPostMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-surface-light transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-text-muted" />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}`;
                      navigator.clipboard.writeText(url);
                      addToast("Link copied!", "success");
                      setShowPostMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-surface-light transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-text-muted" />
                    Copy Link
                  </button>
                  {isOwn ? (
                    <button
                      onClick={() => {
                        setShowPostMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-coral hover:bg-surface-light transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        addToast("Post reported", "success");
                        setShowPostMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-coral hover:bg-surface-light transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Image - full width, no padding, Instagram style */}
        {post.image_urls?.length > 0 && (
          <div
            className="relative bg-surface-light cursor-pointer"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={post.image_urls[0]}
              alt={post.title}
              className="w-full max-h-80 object-contain"
              loading="lazy"
            />
            {post.image_urls.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-pill">
                +{post.image_urls.length - 1}
              </span>
            )}
          </div>
        )}

        {/* Actions - Instagram style row */}
        <div className="flex items-center gap-4 px-3 py-2">
          <button
            onClick={() => user && likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 transition-colors group ${
              displayLiked ? "text-accent-coral" : "text-text-muted hover:text-accent-coral"
            }`}
            aria-label={displayLiked ? "Unlike post" : "Like post"}
          >
            <Heart className={`w-5 h-5 ${displayLiked ? "fill-accent-coral" : "group-hover:fill-accent-coral"}`} />
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="text-text-muted hover:text-primary transition-colors"
            aria-label="Open comments"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Likes count */}
        {displayLikesCount > 0 && (
          <p className="px-3 text-xs font-semibold text-text-primary">
            {displayLikesCount} {displayLikesCount === 1 ? "like" : "likes"}
          </p>
        )}

        {/* Content - below actions like Instagram */}
        <div className="px-3 pb-2.5 space-y-1">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{profile?.full_name || "Anonymous"}</span>{" "}
            {post.title}
          </p>
          {post.body && (
            <div>
              <p className={`text-sm text-text-secondary ${!bodyExpanded ? "line-clamp-2" : ""}`}>
                {post.body}
              </p>
              {post.body.length > 120 && !bodyExpanded && (
                <button
                  onClick={() => setBodyExpanded(true)}
                  className="text-xs text-text-muted font-medium"
                >
                  more
                </button>
              )}
            </div>
          )}

          {/* Type-specific metadata */}
          {meta && renderMetadata(post.post_type, meta)}

          {/* Pending banner */}
          {isOwn && isPending && (
            <div className="flex items-center justify-between bg-accent-amber/10 rounded-xl px-3 py-2 mt-1">
              <span className="text-xs text-accent-amber font-medium">Pending approval</span>
              <button
                onClick={handleApprove}
                className="flex items-center gap-1 text-xs font-medium text-accent-teal hover:text-accent-teal/80 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
            </div>
          )}

          {/* View comments link */}
          {commentsCount > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              View all {commentsCount} comments
            </button>
          )}

          {/* Timestamp - long format like Instagram */}
          <p className="text-[10px] text-text-muted uppercase tracking-wide pt-0.5">
            {getTimeAgo(post.created_at, true)}
          </p>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxIndex !== null && post.image_urls?.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>
          {post.image_urls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + post.image_urls.length) % post.image_urls.length); }}
                className="absolute left-4 text-white/80 hover:text-white text-4xl z-10"
                aria-label="Previous"
              >
                &#8249;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % post.image_urls.length); }}
                className="absolute right-4 text-white/80 hover:text-white text-4xl z-10"
                aria-label="Next"
              >
                &#8250;
              </button>
            </>
          )}
          <img
            src={post.image_urls[lightboxIndex]}
            alt={post.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {post.image_urls.length > 1 && (
            <span className="absolute bottom-6 text-white/60 text-sm">
              {lightboxIndex + 1} / {post.image_urls.length}
            </span>
          )}
        </div>
      )}

      {/* Comments Bottom Sheet */}
      {showComments && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowComments(false); setReplyingTo(null); }} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl max-h-[55vh] flex flex-col animate-slide-up">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1" />

            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
              <h3 className="text-sm font-semibold text-text-primary">Comments</h3>
              <button onClick={() => { setShowComments(false); setReplyingTo(null); }} className="p-1 rounded-full hover:bg-surface-light">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {/* Comments list - Instagram style threaded */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {parentComments.length > 0 ? (
                parentComments.map((comment: any) => {
                  const replies = repliesMap.get(comment.id) || [];
                  const isExpanded = expandedReplies.has(comment.id);
                  const visibleReplies = isExpanded ? replies : replies.slice(0, 1);
                  const hiddenCount = replies.length - 1;
                  const cLikes = getCommentLikes(comment.id);
                  const cLiked = isCommentLiked(comment.id);

                  return (
                    <div key={comment.id}>
                      {/* Parent comment */}
                      <div
                        className="flex gap-3 select-none"
                        onTouchStart={() => user?.id === comment.user_id && handleLongPressStart(comment.id)}
                        onTouchEnd={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                        onContextMenu={(e) => {
                          if (user?.id === comment.user_id) {
                            e.preventDefault();
                            setLongPressCommentId(comment.id);
                          }
                        }}
                      >
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {comment.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold text-text-primary">
                              {comment.profiles?.full_name || "Anonymous"}
                            </span>{" "}
                            <span className="text-text-secondary">{comment.body}</span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-text-muted">{getTimeAgo(comment.created_at)}</span>
                            {cLikes > 0 && (
                              <span className="text-[11px] text-text-muted font-medium">
                                {cLikes} {cLikes === 1 ? "like" : "likes"}
                              </span>
                            )}
                            {user && (
                              <button
                                onClick={() => {
                                  setReplyingTo({ id: comment.id, name: comment.profiles?.full_name || "Anonymous" });
                                  setCommentText(`@${comment.profiles?.full_name || "Anonymous"} `);
                                }}
                                className="text-[11px] text-text-muted font-semibold hover:text-primary transition-colors"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Heart icon - right side */}
                        <button
                          onClick={() => user && commentLikeMutation.mutate(comment.id)}
                          className="flex-shrink-0 pt-1"
                        >
                          <Heart className={`w-3 h-3 ${cLiked ? "text-accent-coral fill-accent-coral" : "text-text-muted"}`} />
                        </button>
                      </div>

                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="ml-11 mt-2 space-y-3">
                          {/* View more replies toggle */}
                          {hiddenCount > 0 && !isExpanded && (
                            <button
                              onClick={() => setExpandedReplies((prev) => {
                                const next = new Set(prev);
                                next.add(comment.id);
                                return next;
                              })}
                              className="flex items-center gap-2 text-[11px] text-text-muted font-medium"
                            >
                              <span className="w-6 border-t border-text-muted/40" />
                              View {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
                            </button>
                          )}

                          {visibleReplies.map((reply: any) => {
                            const rLikes = getCommentLikes(reply.id);
                            const rLiked = isCommentLiked(reply.id);
                            return (
                              <div
                                key={reply.id}
                                className="flex gap-2.5 select-none"
                                onTouchStart={() => user?.id === reply.user_id && handleLongPressStart(reply.id)}
                                onTouchEnd={handleLongPressEnd}
                                onTouchCancel={handleLongPressEnd}
                                onContextMenu={(e) => {
                                  if (user?.id === reply.user_id) {
                                    e.preventDefault();
                                    setLongPressCommentId(reply.id);
                                  }
                                }}
                              >
                                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
                                  {reply.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs">
                                    <span className="font-semibold text-text-primary">
                                      {reply.profiles?.full_name || "Anonymous"}
                                    </span>{" "}
                                    <span className="text-text-secondary">{reply.body}</span>
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] text-text-muted">{getTimeAgo(reply.created_at)}</span>
                                    {rLikes > 0 && (
                                      <span className="text-[10px] text-text-muted font-medium">
                                        {rLikes} {rLikes === 1 ? "like" : "likes"}
                                      </span>
                                    )}
                                    {user && (
                                      <button
                                        onClick={() => {
                                          setReplyingTo({ id: comment.id, name: reply.profiles?.full_name || "Anonymous" });
                                          setCommentText(`@${reply.profiles?.full_name || "Anonymous"} `);
                                        }}
                                        className="text-[10px] text-text-muted font-semibold hover:text-primary transition-colors"
                                      >
                                        Reply
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {/* Heart icon - right side */}
                                <button
                                  onClick={() => user && commentLikeMutation.mutate(reply.id)}
                                  className="flex-shrink-0 pt-0.5"
                                >
                                  <Heart className={`w-2.5 h-2.5 ${rLiked ? "text-accent-coral fill-accent-coral" : "text-text-muted"}`} />
                                </button>
                              </div>
                            );
                          })}

                          {/* Collapse button when expanded */}
                          {isExpanded && hiddenCount > 0 && (
                            <button
                              onClick={() => setExpandedReplies((prev) => {
                                const next = new Set(prev);
                                next.delete(comment.id);
                                return next;
                              })}
                              className="flex items-center gap-2 text-[11px] text-text-muted font-medium"
                            >
                              <span className="w-6 border-t border-text-muted/40" />
                              Hide replies
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No comments yet</p>
                  <p className="text-xs text-text-muted">Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Long press delete menu */}
            {longPressCommentId && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setLongPressCommentId(null)} />
                <div className="relative bg-surface rounded-2xl w-64 overflow-hidden shadow-xl">
                  <button
                    onClick={() => {
                      deleteMutation.mutate(longPressCommentId);
                      setLongPressCommentId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-accent-coral hover:bg-surface-light transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Comment</span>
                  </button>
                  <div className="border-t border-border/30" />
                  <button
                    onClick={() => setLongPressCommentId(null)}
                    className="w-full px-4 py-3.5 text-sm text-text-secondary hover:bg-surface-light transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Comment input */}
            {user && (
              <div className="border-t border-border/30">
                {replyingTo && (
                  <div className="flex items-center justify-between px-4 py-1.5 bg-surface-light/50">
                    <span className="text-xs text-text-muted">
                      Replying to <span className="font-semibold text-text-primary">@{replyingTo.name}</span>
                    </span>
                    <button onClick={() => { setReplyingTo(null); setCommentText(""); }} className="text-xs text-text-muted hover:text-text-secondary">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-3 pb-6">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {(user as any)?.email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 flex items-center gap-1 bg-surface-light rounded-full px-3 py-2">
                    <input
                      type="text"
                      placeholder={replyingTo ? `Reply to @${replyingTo.name}...` : "Add a comment..."}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="text-primary font-semibold text-sm disabled:text-text-muted transition-colors"
                    >
                      {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-surface rounded-card p-5 w-full max-w-xs space-y-4 text-center">
            <Trash2 className="w-10 h-10 text-accent-coral mx-auto" />
            <h3 className="text-lg font-bold text-text-primary">Delete post?</h3>
            <p className="text-sm text-text-secondary">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-light rounded-button hover:bg-surface-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  const { error } = await deletePost(post.id);
                  setDeleting(false);
                  if (error) {
                    addToast("Failed to delete post", "error");
                  } else {
                    addToast("Post deleted", "success");
                    setShowDeleteConfirm(false);
                    queryClient.invalidateQueries({ queryKey: ["posts"] });
                    onDeleted?.();
                  }
                }}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 text-sm font-medium text-white bg-accent-coral rounded-button hover:bg-accent-coral/90 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

function renderMetadata(postType: string, meta: Record<string, any>) {
  switch (postType) {
    case "olx":
      return (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base font-bold text-accent-mint">
            Rs. {meta.price?.toLocaleString()}
          </span>
          {meta.condition && (
            <span className="text-[10px] bg-surface-light text-text-muted px-2 py-0.5 rounded-pill capitalize">
              {meta.condition}
            </span>
          )}
        </div>
      );

    case "teacher_review":
      return (
        <div className="bg-surface-light rounded-xl p-2.5 space-y-1 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">{meta.teacher_name}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    s <= (meta.rating || 0)
                      ? "text-accent-amber fill-accent-amber"
                      : "text-text-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          {meta.course && (
            <p className="text-xs text-text-muted">{meta.course}</p>
          )}
          {meta.difficulty && (
            <p className="text-xs text-text-muted">Difficulty: {meta.difficulty}/5</p>
          )}
        </div>
      );

    case "lost_found":
      return (
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-pill ${
              meta.type === "lost"
                ? "bg-accent-coral/20 text-accent-coral"
                : "bg-accent-teal/20 text-accent-teal"
            }`}
          >
            {meta.type === "lost" ? "LOST" : "FOUND"}
          </span>
          {meta.location && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {meta.location}
            </span>
          )}
        </div>
      );

    case "roommate":
      return (
        <div className="bg-surface-light rounded-xl p-2.5 text-sm space-y-1 mt-1">
          {meta.hostel_name && (
            <p className="text-text-primary flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-text-muted" /> {meta.hostel_name}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {meta.space_for && <span>Space for {meta.space_for}</span>}
            {meta.rent_range && <span>Rent: {meta.rent_range}</span>}
          </div>
        </div>
      );

    case "ride_share":
      return (
        <div className="bg-surface-light rounded-xl p-2.5 text-sm space-y-1 mt-1">
          <div className="flex items-center gap-2 text-text-primary">
            <Car className="w-3.5 h-3.5 text-text-muted" />
            <span>{meta.from} → {meta.to}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {meta.date && <span>{meta.date}</span>}
            {meta.seats_available && <span>{meta.seats_available} seats</span>}
          </div>
        </div>
      );

    case "job":
      return (
        <div className="bg-surface-light rounded-xl p-2.5 text-sm space-y-1 mt-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-primary">{meta.company}</span>
            <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-pill capitalize">
              {meta.type?.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {meta.salary_range && <span>{meta.salary_range}</span>}
            {meta.location && <span>{meta.location}</span>}
          </div>
        </div>
      );

    case "event":
      return (
        <div className="bg-surface-light rounded-xl p-2.5 text-sm space-y-1 mt-1">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {meta.date && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {meta.date} {meta.time && `at ${meta.time}`}
              </span>
            )}
          </div>
          {meta.venue && (
            <p className="text-text-primary flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-text-muted" /> {meta.venue}
            </p>
          )}
        </div>
      );

    case "freelance":
      return (
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-pill ${
              meta.type === "need_help"
                ? "bg-primary/20 text-primary-light"
                : "bg-accent-teal/20 text-accent-teal"
            }`}
          >
            {meta.type === "need_help" ? "Need Help" : "Can Help"}
          </span>
          {meta.budget && (
            <span className="text-xs text-text-muted">Budget: {meta.budget}</span>
          )}
          {meta.deadline && (
            <span className="text-xs text-text-muted">Due: {meta.deadline}</span>
          )}
        </div>
      );

    case "memory":
      return meta.spot_name ? (
        <span className="text-xs text-text-muted flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" /> {meta.spot_name}
        </span>
      ) : null;

    default:
      return null;
  }
}
