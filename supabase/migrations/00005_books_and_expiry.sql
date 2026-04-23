-- ─── 00005: Books post type + Post expiry ────────────────────────

-- 1. Add 'books' to the post_type enum
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'books';

-- 2. Add expires_at column to posts (30-day TTL by default)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- 3. Backfill existing posts so they expire 30 days after they were created
UPDATE posts
  SET expires_at = created_at + INTERVAL '30 days'
  WHERE expires_at IS NULL;

-- 4. Index for efficient expiry queries (used in getPosts filter + cleanup function)
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON posts (expires_at);

-- 5. Update the notify_on_like trigger function to keep working with new column
--    (No change needed — triggers don't touch expires_at)
