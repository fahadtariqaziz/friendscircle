export const POST_TYPES = [
  "friend_circle",
  "olx",
  "lost_found",
  "teacher_review",
  "past_paper",
  "roommate",
  "ride_share",
  "freelance",
  "job",
  "event",
  "memory",
] as const;

export const POST_STATUS = ["pending", "approved", "rejected"] as const;

export const FRIEND_CIRCLE_MEMBER_STATUS = ["invited", "joined"] as const;

export const INVITE_STATUS = ["pending", "accepted", "expired"] as const;

export const LOST_FOUND_TYPE = ["lost", "found"] as const;

export const JOB_TYPE = ["full_time", "part_time", "internship", "remote"] as const;

export const FREELANCE_TYPE = ["need_help", "can_help"] as const;

export const USER_LEVELS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Alumni",
  "Legend",
] as const;

export const POINTS = {
  POST_CREATE: 10,
  COMMENT: 5,
  LIKE_RECEIVED: 2,
  PROFILE_COMPLETE: 50,
  FRIEND_CIRCLE_CREATE: 20,
  REFERRAL: 30,
} as const;

export const LEVEL_THRESHOLDS = {
  Freshman: 0,
  Sophomore: 100,
  Junior: 300,
  Senior: 600,
  Alumni: 1000,
  Legend: 2000,
} as const;

export const CLOUDINARY_UPLOAD_PRESET = "friendscircle_uploads";

export const MAX_IMAGES_PER_POST = 5;
export const MAX_NOTIFICATIONS_PER_DAY = 2;

// ─── Reports / Helpdesk ───────────────────────
export const REPORT_CATEGORIES = ["bug", "suggestion", "complaint", "other"] as const;

export const REPORT_CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  suggestion: "Suggestion",
  complaint: "Complaint",
  other: "Other",
};

export const REPORT_CATEGORY_EMOJIS: Record<string, string> = {
  bug: "🐛",
  suggestion: "💡",
  complaint: "⚠️",
  other: "📝",
};

export const REPORT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export const REPORT_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};
