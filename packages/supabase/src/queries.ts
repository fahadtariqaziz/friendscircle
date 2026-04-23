import { supabase } from "./client";
import type { FilterInput } from "@friendscircle/shared";

// ─── Auth ───────────────────────────────────────────────────────

export async function signUp(email: string, password: string, fullName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ─── Profiles ───────────────────────────────────────────────────

export async function getProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("*, universities:university_id(*), campuses:campus_id(*)")
    .eq("id", userId)
    .single();
}

export async function updateProfile(userId: string, data: Record<string, unknown>) {
  return supabase.from("profiles").update(data).eq("id", userId);
}

const LEVEL_ORDER: [string, number][] = [
  ["Freshman", 0],
  ["Sophomore", 100],
  ["Junior", 300],
  ["Senior", 600],
  ["Alumni", 1000],
  ["Legend", 2000],
];

export async function awardPoints(userId: string, amount: number) {
  // Get current points
  const { data: profile } = await supabase
    .from("profiles")
    .select("points, level")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const newPoints = (profile.points || 0) + amount;

  // Calculate new level
  let newLevel = "Freshman";
  for (const [lvl, threshold] of LEVEL_ORDER) {
    if (newPoints >= threshold) newLevel = lvl;
  }

  await supabase
    .from("profiles")
    .update({ points: newPoints, level: newLevel })
    .eq("id", userId);
}

export async function updatePushToken(userId: string, pushToken: string) {
  return supabase
    .from("profiles")
    .update({ push_token: pushToken })
    .eq("id", userId);
}

// ─── New Members & Hellos ───────────────────────────────────────

export async function getNewMembers(currentUserId: string, universityId?: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("profiles")
    .select("*, universities:university_id(name, short_name, city)")
    .neq("id", currentUserId)
    .not("vibe", "is", null)
    .not("full_name", "is", null)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(10);
  if (universityId) query = (query as any).eq("university_id", universityId);
  return query;
}

export async function sendHello(fromUserId: string, toUserId: string) {
  return supabase
    .from("hellos" as any)
    .insert({ from_user_id: fromUserId, to_user_id: toUserId });
}

export async function getSentHellos(fromUserId: string) {
  return supabase
    .from("hellos" as any)
    .select("to_user_id")
    .eq("from_user_id", fromUserId);
}

// ─── Universities & Campuses ────────────────────────────────────

export async function getUniversities() {
  return supabase.from("universities").select("*").order("name");
}

export async function getCampuses(universityId: string) {
  return supabase
    .from("campuses")
    .select("*")
    .eq("university_id", universityId)
    .order("name");
}

// ─── Posts ───────────────────────────────────────────────────────

export async function getPosts(filters: Partial<FilterInput> & { user_id?: string } = {}) {
  let query = supabase
    .from("posts")
    .select(
      "*, profiles:user_id(id, full_name, avatar_url, level), universities:university_id(id, name, short_name), campuses:campus_id(id, name), comments(count)",
      { count: "exact" }
    )
    .eq("status", "approved")
    // Only return non-expired posts (expires_at NULL means no expiry set on old rows)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (filters.post_type) {
    query = query.eq("post_type", filters.post_type);
  }
  if (filters.university_id) {
    query = query.eq("university_id", filters.university_id);
  }
  if (filters.campus_id) {
    query = query.eq("campus_id", filters.campus_id);
  }
  if (filters.search) {
    const sanitized = filters.search.replace(/[%_\\]/g, "");
    if (sanitized) {
      query = query.or(
        `title.ilike.%${sanitized}%,body.ilike.%${sanitized}%`
      );
    }
  }

  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  return query;
}

export async function getPostById(postId: string) {
  return supabase
    .from("posts")
    .select(
      "*, profiles:user_id(*), universities:university_id(*), campuses:campus_id(*)"
    )
    .eq("id", postId)
    .single();
}

export async function createPost(data: Record<string, unknown>) {
  return supabase.from("posts").insert(data).select().single();
}

export async function updatePost(postId: string, data: Record<string, unknown>) {
  return supabase.from("posts").update(data).eq("id", postId);
}

export async function deletePost(postId: string) {
  return supabase.from("posts").delete().eq("id", postId);
}

// Get user's own posts (all statuses)
export async function getMyPosts(userId: string, limit = 50) {
  return supabase
    .from("posts")
    .select("*, profiles:user_id(*), universities:university_id(*), campuses:campus_id(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

// Admin: get pending posts
export async function getPendingPosts(limit = 50) {
  return supabase
    .from("posts")
    .select("*, profiles:user_id(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
}

// Quick approve own post (for development / self-moderation)
export async function approvePost(postId: string) {
  return supabase.from("posts").update({ status: "approved" }).eq("id", postId);
}

export async function moderatePost(
  postId: string,
  action: "approve" | "reject",
  adminId: string,
  reason?: string
) {
  const status = action === "approve" ? "approved" : "rejected";

  const [postResult, actionResult] = await Promise.all([
    supabase.from("posts").update({ status }).eq("id", postId),
    supabase.from("admin_actions").insert({
      admin_id: adminId,
      post_id: postId,
      action,
      reason: reason || null,
    }),
  ]);

  return { postResult, actionResult };
}

// ─── Friend Circles ─────────────────────────────────────────────

export async function getFriendCircles(filters: FilterInput) {
  let query = supabase
    .from("friend_circles")
    .select(
      "*, profiles:creator_id(*), universities:university_id(*), campuses:campus_id(*), friend_circle_members(*), comments(count)",
      { count: "exact" }
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (filters.university_id) {
    query = query.eq("university_id", filters.university_id);
  }
  if (filters.campus_id) {
    query = query.eq("campus_id", filters.campus_id);
  }

  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  return query;
}

export async function getCircleById(circleId: string) {
  return supabase
    .from("friend_circles")
    .select(
      "*, profiles:creator_id(*), universities:university_id(*), campuses:campus_id(*), friend_circle_members(*, profiles:user_id(*))"
    )
    .eq("id", circleId)
    .single();
}

export async function createFriendCircle(data: Record<string, unknown>) {
  return supabase.from("friend_circles").insert(data).select().single();
}

export async function inviteToCircle(
  circleId: string,
  email: string,
  invitedBy: string
) {
  return supabase
    .from("friend_circle_invites")
    .insert({
      circle_id: circleId,
      email,
      invited_by: invitedBy,
      status: "pending",
    })
    .select()
    .single();
}

export async function joinCircle(circleId: string, userId: string, email: string) {
  // Update member status
  const { error: memberError } = await supabase
    .from("friend_circle_members")
    .update({ user_id: userId, status: "joined", joined_at: new Date().toISOString() })
    .eq("circle_id", circleId)
    .eq("invited_email", email);

  if (memberError) return { error: memberError };

  // Update invite status
  await supabase
    .from("friend_circle_invites")
    .update({ status: "accepted" })
    .eq("circle_id", circleId)
    .eq("email", email);

  // Check if all members have joined → make circle public
  const { data: members } = await supabase
    .from("friend_circle_members")
    .select("status")
    .eq("circle_id", circleId);

  const allJoined = members?.every((m) => m.status === "joined");
  if (allJoined) {
    await supabase
      .from("friend_circles")
      .update({ is_public: true })
      .eq("id", circleId);
  }

  return { error: null };
}

// ─── Comments ───────────────────────────────────────────────────

export async function getComments(postId: string, limit = 50) {
  return supabase
    .from("comments")
    .select("*, profiles:user_id(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);
}

export async function getCircleComments(circleId: string, limit = 50) {
  return supabase
    .from("comments")
    .select("*, profiles:user_id(*)")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: true })
    .limit(limit);
}

export async function createComment(data: Record<string, unknown>) {
  return supabase.from("comments").insert(data).select("*, profiles:user_id(*)").single();
}

export async function deleteComment(commentId: string) {
  return supabase.from("comments").delete().eq("id", commentId);
}

// Get user's own comments with their associated posts
export async function getMyComments(userId: string) {
  return supabase
    .from("comments")
    .select("*, profiles:user_id(*), posts:post_id(id, title, post_type, user_id, profiles:user_id(full_name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
}

// ─── Likes ──────────────────────────────────────────────────────

export async function toggleLike(
  userId: string,
  likeableType: string,
  likeableId: string
) {
  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("likeable_type", likeableType)
    .eq("likeable_id", likeableId)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return { liked: false };
  } else {
    await supabase.from("likes").insert({
      user_id: userId,
      likeable_type: likeableType,
      likeable_id: likeableId,
    });
    return { liked: true };
  }
}

export async function getLikesCount(likeableType: string, likeableId: string) {
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("likeable_type", likeableType)
    .eq("likeable_id", likeableId);

  return count || 0;
}

export async function isLiked(userId: string, likeableType: string, likeableId: string) {
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("likeable_type", likeableType)
    .eq("likeable_id", likeableId)
    .single();

  return !!data;
}

// Batch: get liked IDs for a user (avoids N+1)
export async function getUserLikedIds(
  userId: string,
  likeableType: string,
  likeableIds: string[]
) {
  if (!likeableIds.length) return new Set<string>();
  const { data } = await supabase
    .from("likes")
    .select("likeable_id")
    .eq("user_id", userId)
    .eq("likeable_type", likeableType)
    .in("likeable_id", likeableIds);

  return new Set((data || []).map((d) => d.likeable_id));
}

// Batch: get likes counts for multiple items (avoids N+1)
// Only fetches likeable_id column and caps at 1000 rows to limit payload
export async function getBatchLikesCount(
  likeableType: string,
  likeableIds: string[]
): Promise<Map<string, number>> {
  if (!likeableIds.length) return new Map();
  const { data } = await supabase
    .from("likes")
    .select("likeable_id")
    .eq("likeable_type", likeableType)
    .in("likeable_id", likeableIds)
    .limit(1000);

  const counts = new Map<string, number>();
  for (const row of data || []) {
    counts.set(row.likeable_id, (counts.get(row.likeable_id) || 0) + 1);
  }
  return counts;
}

// ─── Notifications ──────────────────────────────────────────────

export async function getNotifications(userId: string) {
  return supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
}

export async function markNotificationRead(notificationId: string) {
  return supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  return supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

// ─── Reports / Helpdesk ────────────────────────────────────────

export async function createReport(data: {
  user_id: string;
  category: string;
  subject: string;
  description: string;
}) {
  return supabase.from("reports").insert(data).select().single();
}

export async function getMyReports(userId: string) {
  return supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
}

export async function getReports() {
  return supabase
    .from("reports")
    .select("*, profiles:user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  adminNotes?: string
) {
  const update: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    update.admin_notes = adminNotes;
  }
  return supabase.from("reports").update(update).eq("id", reportId);
}
