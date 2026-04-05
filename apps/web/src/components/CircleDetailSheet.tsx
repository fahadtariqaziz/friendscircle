"use client";

import { useState, useRef } from "react";
import { X, Heart, Send, Loader2, UserPlus, Users, Camera } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCircleById, inviteToCircle, toggleLike, getBatchLikesCount, uploadImage, supabase } from "@friendscircle/supabase";
import { getTimeAgo } from "@friendscircle/shared";

interface CircleDetailSheetProps {
  circleId: string;
  onClose: () => void;
}

export function CircleDetailSheet({ circleId, onClose }: CircleDetailSheetProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: circleData, isLoading } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => getCircleById(circleId),
  });

  const circle = circleData?.data as any;

  const { data: likesMap } = useQuery({
    queryKey: ["likesCount", "circle", circleId],
    queryFn: () => getBatchLikesCount("circle", [circleId]),
    enabled: !!circleId,
  });

  const likesCount = likesMap?.get(circleId) || 0;

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(user!.id, "circle", circleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likesCount", "circle"] });
      queryClient.invalidateQueries({ queryKey: ["likedIds", "circle"] });
    },
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setInviting(true);
    const { error } = await inviteToCircle(circleId, inviteEmail.trim(), user.id);
    setInviting(false);
    if (error) {
      addToast("Failed to send invite", "error");
    } else {
      addToast(`Invite sent to ${inviteEmail}`, "success");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
    }
  };

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadImage(file, "circles");
      await supabase.from("friend_circles").update({ photo_url: result.secure_url }).eq("id", circleId);
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      addToast("Photo updated!", "success");
    } catch {
      addToast("Failed to update photo", "error");
    }
    setUploadingPhoto(false);
  };

  const members = (circle?.friend_circle_members as any[]) || [];
  const joinedMembers = members.filter((m: any) => m.status === "joined");
  const creator = circle?.profiles;
  const isCreator = user?.id === circle?.creator_id;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl p-5 pb-24 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Circle Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-light transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : circle ? (
          <div className="space-y-4">
            {/* Photo */}
            <div className="relative rounded-xl overflow-hidden h-44 group">
              {circle.photo_url ? (
                <img src={circle.photo_url} alt={circle.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <Users className="w-16 h-16 text-white/60" />
                </div>
              )}
              {isCreator && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpdate}
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-6 h-6 text-white" />
                        <span className="text-xs text-white font-medium">Change Photo</span>
                      </div>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Info */}
            <div>
              <h3 className="text-xl font-bold text-text-primary">{circle.name}</h3>
              <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                {circle.universities?.short_name && <span>{circle.universities.short_name}</span>}
                {circle.campuses?.name && (
                  <>
                    <span>&middot;</span>
                    <span>{circle.campuses.name}</span>
                  </>
                )}
                <span>&middot;</span>
                <span>{getTimeAgo(circle.created_at)}</span>
              </div>
            </div>

            {/* Creator */}
            {creator && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white">
                  {creator.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{creator.full_name}</p>
                  <p className="text-xs text-text-muted">Creator</p>
                </div>
              </div>
            )}

            {/* Like */}
            <button
              onClick={() => user && likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-surface-light hover:bg-surface-light/80 transition-colors"
            >
              <Heart className="w-4 h-4 text-accent-coral" />
              <span className="text-sm text-text-primary">{likesCount} likes</span>
            </button>

            {/* Members */}
            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-2">
                Members ({joinedMembers.length})
              </h4>
              {joinedMembers.length > 0 ? (
                <div className="space-y-2">
                  {joinedMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white">
                        {member.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm text-text-primary">
                        {member.profiles?.full_name || member.invited_email || "Unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No members yet. Invite your friends!</p>
              )}
            </div>

            {/* Invite */}
            {user && (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary mb-2">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Invite a Friend
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    className="flex-1 input-field"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || inviting}
                    className="flex items-center gap-1 gradient-primary text-white font-semibold px-4 py-2.5 rounded-button shadow-glow disabled:opacity-50 text-sm"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Invite
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-text-muted py-8">Circle not found</p>
        )}
      </div>
    </div>
  );
}
