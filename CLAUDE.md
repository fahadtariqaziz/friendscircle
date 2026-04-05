# FriendsCircle

University social platform — Turborepo monorepo with pnpm workspaces.

## Quick Start

```bash
pnpm install
pnpm dev           # all apps
pnpm dev:web       # web only (port 3000)
pnpm dev:admin     # admin only (port 3001)
pnpm dev:mobile    # expo start
pnpm build         # build all
pnpm lint          # lint all
```

## Architecture

```
apps/
  web/       → Next.js 15 (PWA, mobile-first, port 3000)
  admin/     → Next.js 15 (single-page admin dashboard, port 3001)
  mobile/    → Expo 52 + React Native (expo-router v4)
packages/
  shared/    → Types, Zod schemas, constants, utils (no build step, direct TS imports)
  supabase/  → Supabase client, queries, Cloudinary uploads (no build step)
  ui/        → Cross-platform components + theme (no build step)
  config/    → Shared tsconfig
supabase/
  migrations/ → 3 SQL migrations (schema, reports, push notifications)
  functions/  → Edge Functions (send-push)
```

## Environment Variables

### Web & Admin (`apps/web/.env.local`, `apps/admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

### Edge Functions (set in Supabase Dashboard)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Database (Supabase PostgreSQL)

### Tables
| Table | Purpose |
|-------|---------|
| universities | University records (name, short_name, city) |
| campuses | Campus records per university |
| profiles | User profiles (FK to auth.users, has push_token, is_admin, points, level) |
| posts | All post types (11 types via post_type enum, metadata JSONB) |
| friend_circles | User-created circles |
| friend_circle_members | Circle membership (invited/joined) |
| friend_circle_invites | Email invites with token |
| comments | On posts or circles (supports parent_id threading) |
| likes | Polymorphic (likeable_type: post/circle/comment) |
| notifications | Push notification records (triggers auto-insert) |
| admin_actions | Moderation log |
| reports | User feedback/bug reports (bug/suggestion/complaint/other) |

### Enums
- `post_type`: friend_circle, olx, lost_found, teacher_review, past_paper, roommate, ride_share, freelance, job, event, memory
- `post_status`: pending, approved, rejected
- `user_level`: Freshman, Sophomore, Junior, Senior, Alumni, Legend

### Triggers (auto-insert into notifications)
- `notify_on_comment` — comment on post → notify post author
- `notify_on_post_moderation` — post approved/rejected → notify author
- `notify_on_like` — like on post → notify post owner
- All skip self-notifications, use `SECURITY DEFINER`

### RLS
All tables have RLS enabled. Profiles auto-create via trigger on auth.users INSERT.

## Key Packages

### `@friendscircle/supabase` — Data Layer
All queries return `{ data, error }` pattern. Key exports:
- **Auth**: `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `getSession`, `onAuthStateChange`
- **Profiles**: `getProfile`, `updateProfile`, `updatePushToken`
- **Posts**: `getPosts(filters)`, `getPostById`, `createPost`, `updatePost`, `deletePost`, `getMyPosts`, `getPendingPosts`, `approvePost`, `moderatePost`
- **Circles**: `getFriendCircles`, `createFriendCircle`, `inviteToCircle`, `joinCircle`
- **Comments**: `getComments`, `getCircleComments`, `createComment`, `deleteComment`, `getMyComments`
- **Likes**: `toggleLike`, `getLikesCount`, `isLiked`, `getUserLikedIds` (batch)
- **Notifications**: `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- **Reports**: `createReport`, `getMyReports`, `getReports`, `updateReportStatus`
- **Cloudinary**: `uploadImage`, `getImageUrl`, `getThumbnailUrl`, `getPostImageUrl`, `getAvatarUrl`
- **Client**: `supabase` (raw client for Realtime subscriptions)

### `@friendscircle/shared` — Types & Validation
- **Types**: `Profile`, `Post`, `PostMetadata`, `FriendCircle`, `Comment`, `Like`, `Notification`, etc.
- **Schemas**: Zod schemas for all forms (signUp, createPost, profileSetup, etc.)
- **Constants**: `POST_TYPES`, `POINTS`, `LEVEL_THRESHOLDS`, `REPORT_CATEGORIES`, `CLOUDINARY_UPLOAD_PRESET`
- **Utils**: `getTimeAgo(dateStr)`

### `@friendscircle/ui` — Components
- `Button`, `Card`, `Avatar`, `Badge`, `Chip`, `StarRating`, `PostTypeIcon`, `EmptyState`
- `theme` — colors (primary #6C5CE7), dark mode palette, spacing, font sizes, border radii

## State Management

### Web (Zustand stores in `apps/web/src/store/`)
- `auth.ts` — user, profile, loading, fetchProfile
- `app.ts` — activeTab
- `toast.ts` — addToast, removeToast (auto-dismiss 4s)

### Mobile
- Auth context in `_layout.tsx` via `useAuth()` hook
- React Query for all server state

### Both
- **React Query v5** — staleTime 5min, gcTime 10min, retry 1
- Batch liked-IDs queries via `getUserLikedIds` (avoids N+1)

## Mobile App Routes

```
app/
  _layout.tsx     → Root (AuthProvider + QueryClient + push notifications)
  auth.tsx        → Sign in/up screen
  (tabs)/
    _layout.tsx   → Tab bar (Home, Explore, Create, Threads, Me)
    index.tsx     → Home feed
    explore.tsx   → Search + post type categories
    create.tsx    → Create post form
    threads.tsx   → Comments/discussions
    profile.tsx   → User profile + settings
```

## Push Notifications Pipeline

```
User action → SQL Trigger → INSERT into notifications
  → Supabase Database Webhook → Edge Function (send-push)
    → Expo Push API → Device notification
      → Tap → Deep link via expo-router
```

- Token stored in `profiles.push_token`
- Edge function at `supabase/functions/send-push/index.ts`
- Mobile registration in `apps/mobile/lib/notifications.ts`
- Web uses Supabase Realtime to auto-refresh notification count

## Build & Verify

```bash
pnpm turbo build --filter=web --filter=admin   # verify web+admin build
cd apps/mobile && npx expo export               # verify mobile build
```

## Theme

- **Primary**: #6C5CE7 (purple)
- **Dark BG**: #0F0F1A
- **Surface**: #1A1A2E
- **Accent**: coral #FF6B6B, teal #00CEC9, amber #FDCB6E, mint #55EFC4
- **Border radius**: card 16px, button 12px, pill 999px

## Conventions

- All packages use direct TS source imports (no build step for packages)
- Supabase queries always return `{ data, error }` — always handle errors
- Posts require moderation (`status: pending` → admin approves/rejects)
- Likes are polymorphic via `likeable_type` + `likeable_id`
- Images upload to Cloudinary (max 10MB, JPEG/PNG/WebP/GIF only)
- Search inputs are sanitized before Supabase `.or()` filters
- Mobile uses expo-router file-based routing
- Web is mobile-first responsive design
