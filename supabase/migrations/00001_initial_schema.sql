-- =============================================
-- FriendsCircle Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────

CREATE TYPE post_type AS ENUM (
  'friend_circle', 'olx', 'lost_found', 'teacher_review',
  'past_paper', 'roommate', 'ride_share', 'freelance',
  'job', 'event', 'memory'
);

CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE member_status AS ENUM ('invited', 'joined');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE user_level AS ENUM ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Alumni', 'Legend');
CREATE TYPE likeable_type AS ENUM ('post', 'circle', 'comment');

-- ─── Universities & Campuses ────────────────

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Pakistan',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campuses_university ON campuses(university_id);

-- ─── Profiles ───────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  university_id UUID REFERENCES universities(id),
  campus_id UUID REFERENCES campuses(id),
  year TEXT,
  bio TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  level user_level NOT NULL DEFAULT 'Freshman',
  interests TEXT[] DEFAULT '{}',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_university ON profiles(university_id);
CREATE INDEX idx_profiles_campus ON profiles(campus_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Posts (Polymorphic) ────────────────────

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_type post_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  university_id UUID REFERENCES universities(id),
  campus_id UUID REFERENCES campuses(id),
  status post_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(post_type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_university ON posts(university_id);
CREATE INDEX idx_posts_campus ON posts(campus_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_type_status ON posts(post_type, status);
CREATE INDEX idx_posts_metadata ON posts USING GIN (metadata);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Friend Circles ─────────────────────────

CREATE TABLE friend_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  university_id UUID REFERENCES universities(id),
  campus_id UUID REFERENCES campuses(id),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_circles_creator ON friend_circles(creator_id);
CREATE INDEX idx_circles_university ON friend_circles(university_id);
CREATE INDEX idx_circles_public ON friend_circles(is_public);

CREATE TABLE friend_circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status member_status NOT NULL DEFAULT 'invited',
  invited_email TEXT,
  joined_at TIMESTAMPTZ
);

CREATE INDEX idx_circle_members_circle ON friend_circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON friend_circle_members(user_id);

CREATE TABLE friend_circle_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  status invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_circle_invites_email ON friend_circle_invites(email);
CREATE INDEX idx_circle_invites_token ON friend_circle_invites(token);

-- ─── Comments / Threads ─────────────────────

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES friend_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT comment_target CHECK (
    (post_id IS NOT NULL AND circle_id IS NULL) OR
    (post_id IS NULL AND circle_id IS NOT NULL)
  )
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_circle ON comments(circle_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ─── Likes ──────────────────────────────────

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  likeable_type likeable_type NOT NULL,
  likeable_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_like UNIQUE (user_id, likeable_type, likeable_id)
);

CREATE INDEX idx_likes_target ON likes(likeable_type, likeable_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- ─── Notifications ──────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ─── Admin Actions ──────────────────────────

CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS Policies ───────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circle_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Universities & Campuses: public read
CREATE POLICY "Universities are viewable by everyone" ON universities FOR SELECT USING (true);
CREATE POLICY "Campuses are viewable by everyone" ON campuses FOR SELECT USING (true);

-- Profiles: public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: approved are public, own CRUD
CREATE POLICY "Approved posts are viewable" ON posts
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid());
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
-- Admin can update any post (for approval)
CREATE POLICY "Admins can update posts" ON posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Friend Circles
CREATE POLICY "Public circles are viewable" ON friend_circles
  FOR SELECT USING (is_public = TRUE OR creator_id = auth.uid());
CREATE POLICY "Authenticated users can create circles" ON friend_circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update circles" ON friend_circles
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete circles" ON friend_circles
  FOR DELETE USING (auth.uid() = creator_id);

-- Friend Circle Members
CREATE POLICY "Circle members are viewable" ON friend_circle_members
  FOR SELECT USING (true);
CREATE POLICY "Circle creators can add members" ON friend_circle_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM friend_circles WHERE id = circle_id AND creator_id = auth.uid())
  );
CREATE POLICY "Members can update own status" ON friend_circle_members
  FOR UPDATE USING (user_id = auth.uid());

-- Friend Circle Invites
CREATE POLICY "Invites viewable by involved parties" ON friend_circle_invites
  FOR SELECT USING (invited_by = auth.uid() OR email = (SELECT auth.jwt()->>'email'));
CREATE POLICY "Users can create invites" ON friend_circle_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invitees can update invite" ON friend_circle_invites
  FOR UPDATE USING (email = (SELECT auth.jwt()->>'email'));

-- Comments: public read, authenticated write
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes: public read, authenticated write
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin actions: admins only
CREATE POLICY "Admins can view actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "Admins can create actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
