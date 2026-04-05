import { z } from "zod";
import {
  POST_TYPES,
  POST_STATUS,
  LOST_FOUND_TYPE,
  JOB_TYPE,
  FREELANCE_TYPE,
} from "./constants";

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Profile schemas
export const profileSetupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  avatar_url: z.string().url().nullable().optional(),
  university_id: z.string().uuid("Select a university"),
  campus_id: z.string().uuid("Select a campus"),
  year: z.string().min(1, "Select your year"),
  bio: z.string().max(300).optional(),
  interests: z.array(z.string()).optional(),
});

export const profileUpdateSchema = profileSetupSchema.partial();

// Post schemas
const basePostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  body: z.string().max(5000).optional().default(""),
  university_id: z.string().uuid().nullable().optional(),
  campus_id: z.string().uuid().nullable().optional(),
  image_urls: z.array(z.string().url()).max(5).optional().default([]),
});

export const olxPostSchema = basePostSchema.extend({
  post_type: z.literal("olx"),
  metadata: z.object({
    price: z.number().positive("Price must be positive"),
    condition: z.string().min(1, "Condition is required"),
    category: z.string().min(1, "Category is required"),
  }),
});

export const lostFoundPostSchema = basePostSchema.extend({
  post_type: z.literal("lost_found"),
  metadata: z.object({
    type: z.enum(LOST_FOUND_TYPE),
    date_occurred: z.string().min(1, "Date is required"),
    location: z.string().min(1, "Location is required"),
  }),
});

export const teacherReviewSchema = basePostSchema.extend({
  post_type: z.literal("teacher_review"),
  metadata: z.object({
    teacher_name: z.string().min(2, "Teacher name is required"),
    course: z.string().min(1, "Course is required"),
    rating: z.number().min(1).max(5),
    difficulty: z.number().min(1).max(5),
  }),
});

export const pastPaperSchema = basePostSchema.extend({
  post_type: z.literal("past_paper"),
  metadata: z.object({
    course: z.string().min(1, "Course is required"),
    year: z.string().min(1, "Year is required"),
  }),
});

export const roommatePostSchema = basePostSchema.extend({
  post_type: z.literal("roommate"),
  metadata: z.object({
    hostel_name: z.string().min(1, "Hostel name is required"),
    space_for: z.number().min(1).max(10),
    rent_range: z.string().min(1, "Rent range is required"),
  }),
});

export const rideSharePostSchema = basePostSchema.extend({
  post_type: z.literal("ride_share"),
  metadata: z.object({
    from_location: z.string().min(1, "From location is required"),
    to_location: z.string().min(1, "To location is required"),
    date: z.string().min(1, "Date is required"),
    seats_available: z.number().min(1).max(10),
  }),
});

export const freelancePostSchema = basePostSchema.extend({
  post_type: z.literal("freelance"),
  metadata: z.object({
    type: z.enum(FREELANCE_TYPE),
    assignment_type: z.string().min(1, "Assignment type is required"),
    budget_range: z.string().min(1, "Budget range is required"),
    deadline: z.string().min(1, "Deadline is required"),
  }),
});

export const jobPostSchema = basePostSchema.extend({
  post_type: z.literal("job"),
  metadata: z.object({
    company: z.string().min(1, "Company is required"),
    job_type: z.enum(JOB_TYPE),
    salary_range: z.string().optional().default(""),
    location: z.string().min(1, "Location is required"),
  }),
});

export const eventPostSchema = basePostSchema.extend({
  post_type: z.literal("event"),
  metadata: z.object({
    event_date: z.string().min(1, "Event date is required"),
    event_time: z.string().min(1, "Event time is required"),
    venue: z.string().min(1, "Venue is required"),
    rsvp_count: z.number().optional().default(0),
  }),
});

export const memoryPostSchema = basePostSchema.extend({
  post_type: z.literal("memory"),
  metadata: z.object({
    spot_name: z.string().min(1, "Spot name is required"),
    friend_names: z.array(z.string()).optional().default([]),
  }),
});

export const createPostSchema = z.discriminatedUnion("post_type", [
  olxPostSchema,
  lostFoundPostSchema,
  teacherReviewSchema,
  pastPaperSchema,
  roommatePostSchema,
  rideSharePostSchema,
  freelancePostSchema,
  jobPostSchema,
  eventPostSchema,
  memoryPostSchema,
]);

// Comment schema
export const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
  post_id: z.string().uuid().nullable().optional(),
  circle_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

// Friend Circle schemas
export const createFriendCircleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  photo_url: z.string().url().nullable().optional(),
  university_id: z.string().uuid().nullable().optional(),
  campus_id: z.string().uuid().nullable().optional(),
  invite_emails: z
    .array(z.string().email("Invalid email"))
    .min(1, "Invite at least 1 friend")
    .max(20),
});

// Search/Filter schema
export const filterSchema = z.object({
  university_id: z.string().uuid().optional(),
  campus_id: z.string().uuid().optional(),
  post_type: z.enum(POST_TYPES).optional(),
  search: z.string().optional(),
  sort_by: z.enum(["newest", "oldest", "most_liked", "most_commented"]).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(20),
});

// Type exports from schemas
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type CreateFriendCircleInput = z.infer<typeof createFriendCircleSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
