-- =============================================
-- FriendsCircle — Combined Migration (Fresh Start)
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- ─── Step 0: Drop Everything ────────────────

DROP TRIGGER IF EXISTS on_hello_sent ON hellos;
DROP TRIGGER IF EXISTS on_like_created ON likes;
DROP TRIGGER IF EXISTS on_post_moderated ON posts;
DROP TRIGGER IF EXISTS on_comment_created ON comments;
DROP TRIGGER IF EXISTS posts_updated_at ON posts;
DROP TRIGGER IF EXISTS reports_updated_at ON reports;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS notify_on_hello() CASCADE;
DROP FUNCTION IF EXISTS notify_on_like() CASCADE;
DROP FUNCTION IF EXISTS notify_on_post_moderation() CASCADE;
DROP FUNCTION IF EXISTS notify_on_comment() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS rls_auto_enable() CASCADE;

DROP TABLE IF EXISTS hellos CASCADE;
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS friend_circle_invites CASCADE;
DROP TABLE IF EXISTS friend_circle_members CASCADE;
DROP TABLE IF EXISTS friend_circles CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS campuses CASCADE;
DROP TABLE IF EXISTS universities CASCADE;

DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS member_status CASCADE;
DROP TYPE IF EXISTS invite_status CASCADE;
DROP TYPE IF EXISTS user_level CASCADE;
DROP TYPE IF EXISTS likeable_type CASCADE;

-- ─── Step 1: Extensions ─────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Step 2: Enums ──────────────────────────

CREATE TYPE post_type AS ENUM (
  'friend_circle', 'olx', 'books', 'lost_found', 'teacher_review',
  'past_paper', 'roommate', 'ride_share', 'freelance',
  'job', 'event', 'memory'
);

CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE member_status AS ENUM ('invited', 'joined');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE user_level AS ENUM ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Alumni', 'Legend');
CREATE TYPE likeable_type AS ENUM ('post', 'circle', 'comment');

-- ─── Step 3: Universities & Campuses ────────

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

-- ─── Step 4: Profiles ───────────────────────

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
  push_token TEXT,
  vibe TEXT,
  looking_for TEXT[] DEFAULT '{}',
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

-- ─── Step 5: Posts ──────────────────────────

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
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
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
CREATE INDEX idx_posts_expires_at ON posts(expires_at);

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

-- ─── Step 6: Friend Circles ─────────────────

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

-- ─── Step 7: Comments ───────────────────────

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

-- ─── Step 8: Likes ──────────────────────────

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

-- ─── Step 9: Notifications ──────────────────

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

-- ─── Step 10: Admin Actions ─────────────────

CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Step 11: Reports ───────────────────────

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'suggestion', 'complaint', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Step 12: Hellos ────────────────────────

CREATE TABLE hellos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- ─── Step 13: RLS ───────────────────────────

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
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hellos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by everyone" ON universities FOR SELECT USING (true);
CREATE POLICY "Campuses are viewable by everyone" ON campuses FOR SELECT USING (true);

CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Approved posts are viewable" ON posts
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid());
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update posts" ON posts
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Public circles are viewable" ON friend_circles
  FOR SELECT USING (is_public = TRUE OR creator_id = auth.uid());
CREATE POLICY "Authenticated users can create circles" ON friend_circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update circles" ON friend_circles
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete circles" ON friend_circles
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Circle members are viewable" ON friend_circle_members FOR SELECT USING (true);
CREATE POLICY "Circle creators can add members" ON friend_circle_members
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM friend_circles WHERE id = circle_id AND creator_id = auth.uid()));
CREATE POLICY "Members can update own status" ON friend_circle_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Invites viewable by involved parties" ON friend_circle_invites
  FOR SELECT USING (invited_by = auth.uid() OR email = (SELECT auth.jwt()->>'email'));
CREATE POLICY "Users can create invites" ON friend_circle_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invitees can update invite" ON friend_circle_invites
  FOR UPDATE USING (email = (SELECT auth.jwt()->>'email'));

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view actions" ON admin_actions
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can create actions" ON admin_actions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users can send hellos" ON hellos FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can view their hellos" ON hellos
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ─── Step 14: Triggers ──────────────────────

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_commenter_name TEXT;
BEGIN
  IF NEW.post_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id, title INTO v_post_owner_id, v_post_title FROM posts WHERE id = NEW.post_id;
  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT full_name INTO v_commenter_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data) VALUES (
    v_post_owner_id, 'comment',
    COALESCE(v_commenter_name, 'Someone') || ' commented on your post',
    LEFT(NEW.body, 100),
    jsonb_build_object('screen', 'home', 'post_id', NEW.post_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

CREATE OR REPLACE FUNCTION notify_on_post_moderation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status::TEXT = NEW.status::TEXT THEN RETURN NEW; END IF;
  IF NEW.status::TEXT NOT IN ('approved', 'rejected') THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, title, body, data) VALUES (
    NEW.user_id, 'moderation',
    CASE WHEN NEW.status::TEXT = 'approved' THEN 'Your post was approved!' ELSE 'Your post was not approved' END,
    CASE WHEN NEW.status::TEXT = 'approved' THEN '"' || LEFT(NEW.title, 80) || '" is now live.' ELSE '"' || LEFT(NEW.title, 80) || '" did not meet guidelines.' END,
    jsonb_build_object('screen', 'home', 'post_id', NEW.id, 'action', NEW.status::TEXT)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_moderated
  AFTER UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION notify_on_post_moderation();

CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  v_target_owner_id UUID;
  v_target_title TEXT;
  v_liker_name TEXT;
BEGIN
  IF NEW.likeable_type::TEXT <> 'post' THEN RETURN NEW; END IF;
  SELECT user_id, title INTO v_target_owner_id, v_target_title FROM posts WHERE id = NEW.likeable_id;
  IF v_target_owner_id IS NULL OR v_target_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT full_name INTO v_liker_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data) VALUES (
    v_target_owner_id, 'like',
    COALESCE(v_liker_name, 'Someone') || ' liked your post',
    LEFT(v_target_title, 100),
    jsonb_build_object('screen', 'home', 'post_id', NEW.likeable_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes FOR EACH ROW EXECUTE FUNCTION notify_on_like();

CREATE OR REPLACE FUNCTION notify_on_hello()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.from_user_id;
  INSERT INTO notifications (user_id, type, title, body, data) VALUES (
    NEW.to_user_id, 'hello',
    COALESCE(sender_name, 'Someone') || ' said hello! 👋',
    'Tap to view their profile',
    jsonb_build_object('from_id', NEW.from_user_id, 'from_name', COALESCE(sender_name, 'Someone'), 'screen', 'profile')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_hello_sent
  AFTER INSERT ON hellos FOR EACH ROW EXECUTE FUNCTION notify_on_hello();

-- ─── Step 15: Seed Universities ─────────────

INSERT INTO universities (name, short_name, city, country) VALUES
  ('LUMS - Lahore University of Management Sciences', 'LUMS', 'Lahore', 'Pakistan'),
  ('NUST - National University of Sciences & Technology', 'NUST', 'Islamabad', 'Pakistan'),
  ('FAST - Foundation for Advancement of Science and Technology', 'FAST', 'Multiple', 'Pakistan'),
  ('COMSATS University Islamabad', 'COMSATS', 'Multiple', 'Pakistan'),
  ('University of Engineering and Technology', 'UET', 'Lahore', 'Pakistan'),
  ('University of the Punjab', 'PU', 'Lahore', 'Pakistan'),
  ('Quaid-i-Azam University', 'QAU', 'Islamabad', 'Pakistan'),
  ('IBA - Institute of Business Administration', 'IBA', 'Karachi', 'Pakistan'),
  ('GIKI - Ghulam Ishaq Khan Institute', 'GIKI', 'Topi', 'Pakistan'),
  ('Aga Khan University', 'AKU', 'Karachi', 'Pakistan'),
  ('Bahria University', 'BAHRIA', 'Multiple', 'Pakistan'),
  ('Air University', 'AU', 'Islamabad', 'Pakistan'),
  ('University of Karachi', 'KU', 'Karachi', 'Pakistan'),
  ('NED University', 'NED', 'Karachi', 'Pakistan'),
  ('PUCIT - Punjab University College of IT', 'PUCIT', 'Lahore', 'Pakistan');

INSERT INTO campuses (university_id, name, address)
SELECT id, 'Islamabad Campus', 'Faisal Town, Islamabad' FROM universities WHERE short_name = 'FAST' UNION ALL
SELECT id, 'Lahore Campus', 'Block B1, Faisal Town, Lahore' FROM universities WHERE short_name = 'FAST' UNION ALL
SELECT id, 'Karachi Campus', 'ST-4, Shah Latif Town, Karachi' FROM universities WHERE short_name = 'FAST' UNION ALL
SELECT id, 'Peshawar Campus', 'GT Road, Peshawar' FROM universities WHERE short_name = 'FAST' UNION ALL
SELECT id, 'Chiniot-Faisalabad Campus', 'Chiniot, Faisalabad' FROM universities WHERE short_name = 'FAST';

INSERT INTO campuses (university_id, name, address)
SELECT id, 'Islamabad Campus', 'Park Road, Islamabad' FROM universities WHERE short_name = 'COMSATS' UNION ALL
SELECT id, 'Lahore Campus', 'Defence Road, Lahore' FROM universities WHERE short_name = 'COMSATS' UNION ALL
SELECT id, 'Wah Campus', 'GT Road, Wah Cantt' FROM universities WHERE short_name = 'COMSATS' UNION ALL
SELECT id, 'Attock Campus', 'Kamra Road, Attock' FROM universities WHERE short_name = 'COMSATS' UNION ALL
SELECT id, 'Abbottabad Campus', 'University Road, Abbottabad' FROM universities WHERE short_name = 'COMSATS';

INSERT INTO campuses (university_id, name, address)
SELECT id, 'H-12 Main Campus', 'H-12, Islamabad' FROM universities WHERE short_name = 'NUST' UNION ALL
SELECT id, 'SEECS', 'H-12, Islamabad' FROM universities WHERE short_name = 'NUST' UNION ALL
SELECT id, 'SMME', 'H-12, Islamabad' FROM universities WHERE short_name = 'NUST';

INSERT INTO campuses (university_id, name, address)
SELECT id, 'DHA Main Campus', 'DHA Phase V, Lahore' FROM universities WHERE short_name = 'LUMS';

INSERT INTO campuses (university_id, name, address)
SELECT id, 'Main Campus', 'GT Road, Lahore' FROM universities WHERE short_name = 'UET' UNION ALL
SELECT id, 'Main Campus', 'Canal Road, Lahore' FROM universities WHERE short_name = 'PU' UNION ALL
SELECT id, 'Main Campus', 'University Road, Islamabad' FROM universities WHERE short_name = 'QAU' UNION ALL
SELECT id, 'City Campus', 'Garden Road, Karachi' FROM universities WHERE short_name = 'IBA' UNION ALL
SELECT id, 'Main Campus', 'University Road, Karachi' FROM universities WHERE short_name = 'IBA' UNION ALL
SELECT id, 'Main Campus', 'Topi, Swabi, KPK' FROM universities WHERE short_name = 'GIKI' UNION ALL
SELECT id, 'Stadium Road Campus', 'Stadium Road, Karachi' FROM universities WHERE short_name = 'AKU' UNION ALL
SELECT id, 'Islamabad Campus', 'Shangrila Road, Islamabad' FROM universities WHERE short_name = 'BAHRIA' UNION ALL
SELECT id, 'Lahore Campus', 'Near Thokar Niaz Baig, Lahore' FROM universities WHERE short_name = 'BAHRIA' UNION ALL
SELECT id, 'Karachi Campus', 'Karsaz, Karachi' FROM universities WHERE short_name = 'BAHRIA' UNION ALL
SELECT id, 'E-9 Campus', 'E-9, Islamabad' FROM universities WHERE short_name = 'AU' UNION ALL
SELECT id, 'Main Campus', 'University Road, Karachi' FROM universities WHERE short_name = 'KU' UNION ALL
SELECT id, 'Main Campus', 'University Road, Karachi' FROM universities WHERE short_name = 'NED' UNION ALL
SELECT id, 'Main Campus', 'Allama Iqbal Campus, Lahore' FROM universities WHERE short_name = 'PUCIT';

-- =============================================
-- Done! Fresh database with all tables,
-- triggers, RLS policies, and seed data.
-- =============================================
