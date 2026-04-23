"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store/app";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  signOut,
  getMyPosts,
  createReport,
  getMyReports,
  updateProfile,
  getProfile,
  getUniversities,
  getCampuses,
  uploadImage,
  getUserLikedIds,
  getBatchLikesCount,
  getPosts,
} from "@friendscircle/supabase";
import { useToastStore } from "@/store/toast";
import {
  LEVEL_THRESHOLDS,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_EMOJIS,
  REPORT_STATUS_LABELS,
} from "@friendscircle/shared";
import { PostCard } from "../PostCard";
import {
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  GraduationCap,
  MapPin,
  X,
  Send,
  Loader2,
  Clock,
  Camera,
  Grid3X3,
  Heart,
  Info,
} from "lucide-react";

const PROFILE_FILTERS = ["Posts", "Liked"];

export function ProfileTab() {
  const { user, profile, setProfile, reset } = useAuthStore();
  const { setActiveTab } = useAppStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showPanel, setShowPanel] = useState<"privacy" | "help" | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Posts");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Refetch profile on mount to get latest points/level
  useEffect(() => {
    if (user) {
      getProfile(user.id).then(({ data }) => {
        if (data) setProfile(data as any);
      });
    }
  }, [user, setProfile]);
  const [showLevelsInfo, setShowLevelsInfo] = useState(false);

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState<string>("bug");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [editYear, setEditYear] = useState(profile?.year || "");
  const [editUniId, setEditUniId] = useState(profile?.university_id || "");
  const [editCampusId, setEditCampusId] = useState(profile?.campus_id || "");
  const [editAvatar, setEditAvatar] = useState<{ file: File; preview: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: myPostsData } = useQuery({
    queryKey: ["posts", "my", user?.id],
    queryFn: () => getMyPosts(user!.id),
    enabled: !!user,
  });

  const myPosts = (myPostsData?.data as any[]) || [];

  // Liked posts - get IDs the user has liked, then we show them from the grid
  const { data: allPostsData } = useQuery({
    queryKey: ["posts", "all-for-liked"],
    queryFn: () => getPosts({ page: 1, limit: 100 }),
    enabled: activeFilter === "Liked",
  });

  const allPosts = (allPostsData?.data as any[]) || [];
  const allPostIds = allPosts.map((p: any) => p.id);

  const { data: likedPostIds } = useQuery({
    queryKey: ["likedIds", "post", allPostIds, user?.id],
    queryFn: () => getUserLikedIds(user!.id, "post", allPostIds),
    enabled: !!user && allPostIds.length > 0 && activeFilter === "Liked",
  });

  const likedPosts = allPosts.filter((p: any) => likedPostIds?.has(p.id));

  const displayPosts = activeFilter === "Posts" ? myPosts : likedPosts;

  // Universities & campuses for edit
  const { data: uniData } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    enabled: showEditProfile,
  });

  const { data: campusData } = useQuery({
    queryKey: ["campuses", editUniId],
    queryFn: () => getCampuses(editUniId),
    enabled: showEditProfile && !!editUniId,
  });

  const universities = (uniData?.data as any[]) || [];
  const campuses = (campusData?.data as any[]) || [];

  const { data: myReportsData, refetch: refetchReports } = useQuery({
    queryKey: ["myReports", user?.id],
    queryFn: () => getMyReports(user!.id),
    enabled: !!user && showPanel === "help",
  });

  const myReports = (myReportsData?.data as any[]) || [];

  const handleSignOut = async () => {
    await signOut();
    addToast("Signed out successfully", "info");
    reset();
  };

  const handleSubmitFeedback = async () => {
    if (!user || !feedbackSubject.trim() || !feedbackDescription.trim()) return;

    setSubmitting(true);
    const { error } = await createReport({
      user_id: user.id,
      category: feedbackCategory,
      subject: feedbackSubject.trim(),
      description: feedbackDescription.trim(),
    });
    setSubmitting(false);

    if (error) {
      addToast("Failed to submit feedback. Please try again.", "error");
    } else {
      addToast("Feedback submitted! We'll review it soon.", "success");
      setFeedbackSubject("");
      setFeedbackDescription("");
      setFeedbackCategory("bug");
      refetchReports();
      setShowMyReports(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    let avatar_url = profile?.avatar_url || null;
    if (editAvatar) {
      try {
        const result = await uploadImage(editAvatar.file, "avatars");
        avatar_url = result.secure_url;
      } catch {
        addToast("Failed to upload photo", "error");
        setSaving(false);
        return;
      }
    }

    const { error } = await updateProfile(user.id, {
      full_name: editName.trim(),
      bio: editBio.trim() || null,
      year: editYear.trim() || null,
      university_id: editUniId || null,
      campus_id: editCampusId || null,
      avatar_url,
    });

    if (error) {
      addToast("Failed to update profile", "error");
    } else {
      // Refetch profile to update store
      const { data } = await getProfile(user.id);
      if (data) setProfile(data as any);
      addToast("Profile updated!", "success");
      if (editAvatar) URL.revokeObjectURL(editAvatar.preview);
      setEditAvatar(null);
      setShowEditProfile(false);
    }
    setSaving(false);
  };

  const openEditProfile = () => {
    setEditName(profile?.full_name || "");
    setEditBio(profile?.bio || "");
    setEditYear(profile?.year || "");
    setEditUniId(profile?.university_id || "");
    setEditCampusId(profile?.campus_id || "");
    setEditAvatar(null);
    setShowEditProfile(true);
  };

  const handleShareProfile = async () => {
    const text = `${profile?.full_name || "User"} on FriendsCircle`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
        addToast("Profile link copied!", "success");
      }
    } catch {
      // cancelled
    }
  };

  const level = profile?.level || "Freshman";
  const points = profile?.points || 0;
  const thresholds = Object.entries(LEVEL_THRESHOLDS);
  const currentLevelIndex = thresholds.findIndex(([l]) => l === level);
  const nextLevel = thresholds[currentLevelIndex + 1];
  const progress = nextLevel
    ? ((points - thresholds[currentLevelIndex][1]) /
        (nextLevel[1] - thresholds[currentLevelIndex][1])) *
      100
    : 100;

  const university = (profile as any)?.universities;
  const campus = (profile as any)?.campuses;
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="flex flex-col">
      {/* Header bar */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{profile?.full_name || "Profile"}</h1>
      </div>

      {/* Instagram-style profile header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.full_name || ""}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-white">
                {profile?.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{myPosts.length}</p>
              <p className="text-[11px] text-text-muted">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{points}</p>
              <p className="text-[11px] text-text-muted">Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{level}</p>
              <p className="text-[11px] text-text-muted">Level</p>
            </div>
          </div>
        </div>

        {/* Name, bio, university */}
        <div className="mt-3 space-y-0.5">
          <p className="font-semibold text-sm text-text-primary">{profile?.full_name}</p>
          {profile?.bio && (
            <p className="text-sm text-text-secondary">{profile.bio}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            {university && (
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {university.short_name}
              </span>
            )}
            {campus && (
              <>
                <span>&middot;</span>
                <span>{campus.name}</span>
              </>
            )}
            {profile?.year && (
              <>
                <span>&middot;</span>
                <span>{profile.year}</span>
              </>
            )}
          </div>
        </div>

        {/* Edit Profile + Share Profile buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={openEditProfile}
            className="flex-1 py-1.5 text-sm font-semibold text-text-primary bg-surface-light rounded-lg hover:bg-surface-light/80 transition-colors"
          >
            Edit profile
          </button>
          <button
            onClick={handleShareProfile}
            className="flex-1 py-1.5 text-sm font-semibold text-text-primary bg-surface-light rounded-lg hover:bg-surface-light/80 transition-colors"
          >
            Share profile
          </button>
        </div>

        {/* Level progress bar */}
        {nextLevel && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[10px] text-text-muted">
                {nextLevel[1] - points} points to {nextLevel[0]}
              </p>
              <button
                onClick={() => setShowLevelsInfo(true)}
                className="flex items-center gap-1 text-[10px] text-primary font-medium"
              >
                <Info className="w-3 h-3" />
                How it works
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-border/30 mt-1">
        {PROFILE_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeFilter === filter
                ? "text-text-primary border-text-primary"
                : "text-text-muted border-transparent"
            }`}
          >
            {filter === "Posts" ? <Grid3X3 className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Posts Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {displayPosts.length > 0 ? (
          displayPosts.map((post: any) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="aspect-square relative overflow-hidden bg-surface-light"
            >
              {post.image_urls?.length > 0 ? (
                <img
                  src={post.image_urls[0]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center p-2">
                  <p className="text-[10px] text-white text-center font-medium line-clamp-3">
                    {post.title}
                  </p>
                </div>
              )}
              {post.image_urls?.length > 1 && (
                <div className="absolute top-1 right-1">
                  <Grid3X3 className="w-3 h-3 text-white drop-shadow" />
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="col-span-3 text-center py-16">
            {activeFilter === "Posts" ? (
              <>
                <Camera className="w-12 h-12 text-text-muted mx-auto mb-3 stroke-1" />
                <p className="text-sm text-text-muted">No posts yet</p>
              </>
            ) : (
              <>
                <Heart className="w-12 h-12 text-text-muted mx-auto mb-3 stroke-1" />
                <p className="text-sm text-text-muted">No liked posts</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Settings Menu */}
      <div className="px-4 py-4 space-y-4">
        <div className="glass rounded-card overflow-hidden divide-y divide-border/50">
          <MenuButton
            icon={Bell}
            label="Notifications"
            onClick={() => setActiveTab("home")}
            subtitle="View in home feed"
          />
          <MenuButton
            icon={Shield}
            label="Privacy"
            onClick={() => setShowPanel("privacy")}
          />
          <MenuButton
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => setShowPanel("help")}
            subtitle="Report a bug or send feedback"
          />
        </div>

        <div className="glass rounded-card overflow-hidden">
          <MenuButton
            icon={LogOut}
            label="Sign Out"
            onClick={() => setShowSignOutConfirm(true)}
            danger
          />
        </div>
      </div>

      {/* Post Detail Bottom Sheet */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl p-4 pb-24 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-light"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
            <PostCard
              post={selectedPost}
              onDeleted={() => {
                setSelectedPost(null);
                queryClient.invalidateQueries({ queryKey: ["posts", "my"] });
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Profile Bottom Sheet */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl p-5 pb-24 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="p-1 rounded-full hover:bg-surface-light">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (editAvatar) URL.revokeObjectURL(editAvatar.preview);
                      setEditAvatar({ file, preview: URL.createObjectURL(file) });
                    }
                  }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group"
                >
                  {editAvatar?.preview || avatarUrl ? (
                    <img
                      src={editAvatar?.preview || avatarUrl!}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-white">
                      {editName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                <span className="text-xs text-primary font-medium">Change photo</span>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Tell people about yourself..."
                  maxLength={300}
                />
                <p className="text-[10px] text-text-muted mt-0.5 text-right">{editBio.length}/300</p>
              </div>

              {/* University */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">University</label>
                <select
                  value={editUniId}
                  onChange={(e) => {
                    setEditUniId(e.target.value);
                    setEditCampusId("");
                  }}
                  className="input-field"
                >
                  <option value="">Select university</option>
                  {universities.map((uni: any) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.short_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Campus */}
              {editUniId && (
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Campus</label>
                  <select
                    value={editCampusId}
                    onChange={(e) => setEditCampusId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select campus</option>
                    {campuses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Year</label>
                <input
                  type="text"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 2026"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSaveProfile}
                disabled={!editName.trim() || saving}
                className="w-full flex items-center justify-center gap-2 gradient-primary text-white font-semibold py-2.5 rounded-button shadow-glow disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSignOutConfirm(false)} />
          <div className="relative glass rounded-card p-5 w-full max-w-xs space-y-4 text-center">
            <LogOut className="w-10 h-10 text-accent-coral mx-auto" />
            <h3 className="text-lg font-bold text-text-primary">Sign out?</h3>
            <p className="text-sm text-text-secondary">You&apos;ll need to sign back in to access your account.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-light rounded-button hover:bg-surface-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-accent-coral rounded-button hover:bg-accent-coral/90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Levels Info */}
      {showLevelsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLevelsInfo(false)} />
          <div className="relative glass rounded-card p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Levels & Points</h3>
              <button onClick={() => setShowLevelsInfo(false)}>
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <p className="text-sm text-text-secondary">
              Earn points by being active on FriendsCircle. The more you contribute, the higher your level!
            </p>
            <div className="space-y-2">
              {Object.entries(LEVEL_THRESHOLDS).map(([lvl, pts]) => (
                <div
                  key={lvl}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                    lvl === level ? "bg-primary/15 border border-primary/30" : "bg-surface-light"
                  }`}
                >
                  <span className={`text-sm font-medium ${lvl === level ? "text-primary-light" : "text-text-primary"}`}>
                    {lvl}
                  </span>
                  <span className="text-xs text-text-muted">{pts} pts</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-xs text-text-muted">
              <p>How to earn points:</p>
              <ul className="space-y-1 ml-3 list-disc">
                <li>Create a post</li>
                <li>Get likes on your posts</li>
                <li>Comment on posts</li>
                <li>Create or join a friend circle</li>
              </ul>
            </div>
            <button
              onClick={() => setShowLevelsInfo(false)}
              className="w-full px-4 py-2.5 text-sm font-medium text-white gradient-primary rounded-button"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Privacy Panel */}
      {showPanel === "privacy" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(null)} />
          <div className="relative glass rounded-card p-5 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Privacy</h3>
              <button onClick={() => setShowPanel(null)}>
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-text-secondary">
              <p>Your profile is visible to other students at your university.</p>
              <p>Posts you create are reviewed before being published. Only approved posts are visible publicly.</p>
              <p>Your email address is never shared with other users.</p>
              <p>Friend circle invites are sent via email and require acceptance.</p>
            </div>
            <button
              onClick={() => setShowPanel(null)}
              className="w-full px-4 py-2.5 text-sm font-medium text-white gradient-primary rounded-button"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Help & Support / Feedback Panel */}
      {showPanel === "help" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(null)} />
          <div className="relative glass rounded-t-3xl sm:rounded-card p-5 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-text-primary">Help & Support</h3>
              </div>
              <button onClick={() => setShowPanel(null)}>
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="mb-3">
              <label className="text-xs text-text-muted mb-2 block">What&apos;s this about?</label>
              <div className="flex gap-2 flex-wrap">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFeedbackCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                      feedbackCategory === cat
                        ? "bg-primary/20 text-primary-light border border-primary/50"
                        : "bg-surface-light text-text-secondary border border-border hover:border-border/80"
                    }`}
                  >
                    <span>{REPORT_CATEGORY_EMOJIS[cat]}</span>
                    {REPORT_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs text-text-muted mb-1 block">Subject</label>
              <input
                type="text"
                placeholder="Brief summary of your issue"
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                className="input-field"
                maxLength={100}
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1 block">Description</label>
              <textarea
                placeholder="Tell us more about what happened or what you'd like to see..."
                value={feedbackDescription}
                onChange={(e) => setFeedbackDescription(e.target.value)}
                rows={4}
                className="input-field resize-none"
                maxLength={1000}
              />
              <p className="text-[10px] text-text-muted mt-1 text-right">
                {feedbackDescription.length}/1000
              </p>
            </div>

            <button
              onClick={handleSubmitFeedback}
              disabled={!feedbackSubject.trim() || !feedbackDescription.trim() || submitting}
              className="w-full flex items-center justify-center gap-2 gradient-primary text-white font-semibold py-2.5 rounded-button shadow-glow disabled:opacity-50 transition-opacity mb-4"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>

            {myReports.length > 0 && (
              <div>
                <button
                  onClick={() => setShowMyReports((v) => !v)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2"
                >
                  <Clock className="w-3 h-3" />
                  {showMyReports ? "Hide" : "Show"} my submissions ({myReports.length})
                </button>
                {showMyReports && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {myReports.map((report: any) => (
                      <div key={report.id} className="bg-surface-light rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-text-primary truncate flex-1">
                            {report.subject}
                          </span>
                          <ReportStatusBadge status={report.status} />
                        </div>
                        <p className="text-[10px] text-text-muted">
                          {new Date(report.created_at).toLocaleDateString()}
                          {" · "}
                          {REPORT_CATEGORY_LABELS[report.category]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-accent-amber/20 text-accent-amber",
    in_progress: "bg-primary/20 text-primary-light",
    resolved: "bg-accent-teal/20 text-accent-teal",
    closed: "bg-surface-light text-text-muted",
  };

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-pill ${styles[status] || styles.open}`}>
      {REPORT_STATUS_LABELS[status] || status}
    </span>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
  subtitle,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
  danger?: boolean;
  subtitle?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-light transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-5 h-5 ${
            danger ? "text-accent-coral" : "text-text-secondary"
          }`}
        />
        <div className="text-left">
          <span
            className={`text-sm font-medium block ${
              danger ? "text-accent-coral" : "text-text-primary"
            }`}
          >
            {label}
          </span>
          {subtitle && <span className="text-[10px] text-text-muted">{subtitle}</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted" />
    </button>
  );
}
