import type {
  POST_TYPES,
  POST_STATUS,
  FRIEND_CIRCLE_MEMBER_STATUS,
  INVITE_STATUS,
  LOST_FOUND_TYPE,
  JOB_TYPE,
  FREELANCE_TYPE,
  USER_LEVELS,
} from "./constants";

export type PostType = (typeof POST_TYPES)[number];
export type PostStatus = (typeof POST_STATUS)[number];
export type FriendCircleMemberStatus = (typeof FRIEND_CIRCLE_MEMBER_STATUS)[number];
export type InviteStatus = (typeof INVITE_STATUS)[number];
export type LostFoundType = (typeof LOST_FOUND_TYPE)[number];
export type JobType = (typeof JOB_TYPE)[number];
export type FreelanceType = (typeof FREELANCE_TYPE)[number];
export type UserLevel = (typeof USER_LEVELS)[number];

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  university_id: string | null;
  campus_id: string | null;
  year: string | null;
  bio: string | null;
  points: number;
  level: UserLevel;
  interests: string[];
  push_token?: string | null;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  city: string;
  country: string;
}

export interface Campus {
  id: string;
  university_id: string;
  name: string;
  address: string | null;
}

// JSONB metadata types per post type
export interface OlxMetadata {
  price: number;
  condition: string;
  category: string;
}

export interface LostFoundMetadata {
  type: LostFoundType;
  date_occurred: string;
  location: string;
}

export interface TeacherReviewMetadata {
  teacher_name: string;
  course: string;
  rating: number;
  difficulty: number;
}

export interface PastPaperMetadata {
  course: string;
  year: string;
}

export interface RoommateMetadata {
  hostel_name: string;
  space_for: number;
  rent_range: string;
}

export interface RideShareMetadata {
  from_location: string;
  to_location: string;
  date: string;
  seats_available: number;
}

export interface FreelanceMetadata {
  type: FreelanceType;
  assignment_type: string;
  budget_range: string;
  deadline: string;
}

export interface JobMetadata {
  company: string;
  job_type: JobType;
  salary_range: string;
  location: string;
}

export interface EventMetadata {
  event_date: string;
  event_time: string;
  venue: string;
  rsvp_count: number;
}

export interface MemoryMetadata {
  spot_name: string;
  friend_names: string[];
}

export type PostMetadata =
  | OlxMetadata
  | LostFoundMetadata
  | TeacherReviewMetadata
  | PastPaperMetadata
  | RoommateMetadata
  | RideShareMetadata
  | FreelanceMetadata
  | JobMetadata
  | EventMetadata
  | MemoryMetadata
  | Record<string, unknown>;

export interface Post {
  id: string;
  user_id: string;
  post_type: PostType;
  title: string;
  body: string;
  university_id: string | null;
  campus_id: string | null;
  status: PostStatus;
  metadata: PostMetadata;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  university?: University;
  campus?: Campus;
  comments_count?: number;
  likes_count?: number;
  is_liked?: boolean;
}

export interface FriendCircle {
  id: string;
  creator_id: string;
  name: string;
  photo_url: string | null;
  university_id: string | null;
  campus_id: string | null;
  is_public: boolean;
  created_at: string;
  // Joined
  members?: FriendCircleMember[];
  creator?: Profile;
  university?: University;
  campus?: Campus;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface FriendCircleMember {
  id: string;
  circle_id: string;
  user_id: string | null;
  status: FriendCircleMemberStatus;
  invited_email: string | null;
  joined_at: string | null;
  profile?: Profile;
}

export interface FriendCircleInvite {
  id: string;
  circle_id: string;
  email: string;
  invited_by: string;
  token: string;
  status: InviteStatus;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string | null;
  circle_id: string | null;
  user_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
  replies?: Comment[];
}

export interface Like {
  id: string;
  user_id: string;
  likeable_type: "post" | "circle" | "comment";
  likeable_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  post_id: string;
  action: "approve" | "reject";
  reason: string | null;
  created_at: string;
}
