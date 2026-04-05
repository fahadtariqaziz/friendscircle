  -- =============================================               
  -- Push Notifications: Token Storage + Auto-Triggers                                                                                                                                                    
  -- =============================================                                                                                                                                                        
                                                                                                                                                                                                          
  -- Add push token column to profiles                                                                                                                                                                    
  ALTER TABLE profiles ADD COLUMN push_token TEXT;                                                                                                                                                      

  -- ─── Trigger: Notify post author on new comment ─────────────────

  CREATE OR REPLACE FUNCTION notify_on_comment()
  RETURNS TRIGGER AS $$
  DECLARE
    v_post_owner_id UUID;
    v_post_title TEXT;
    v_commenter_name TEXT;
  BEGIN
    IF NEW.post_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT user_id, title INTO v_post_owner_id, v_post_title
    FROM posts WHERE id = NEW.post_id;

    IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.user_id THEN
      RETURN NEW;
    END IF;

    SELECT full_name INTO v_commenter_name
    FROM profiles WHERE id = NEW.user_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_post_owner_id,
      'comment',
      COALESCE(v_commenter_name, 'Someone') || ' commented on your post',
      LEFT(NEW.body, 100),
      jsonb_build_object(
        'screen', 'home',
        'post_id', NEW.post_id,
        'comment_id', NEW.id
      )
    );

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_comment_created
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

  -- ─── Trigger: Notify post author on moderation ──────────────────

  CREATE OR REPLACE FUNCTION notify_on_post_moderation()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.status::TEXT = NEW.status::TEXT THEN
      RETURN NEW;
    END IF;

    IF NEW.status::TEXT NOT IN ('approved', 'rejected') THEN
      RETURN NEW;
    END IF;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'moderation',
      CASE
        WHEN NEW.status::TEXT = 'approved' THEN 'Your post was approved!'
        ELSE 'Your post was not approved'
      END,
      CASE
        WHEN NEW.status::TEXT = 'approved' THEN '"' || LEFT(NEW.title, 80) || '" is now live.'
        ELSE '"' || LEFT(NEW.title, 80) || '" did not meet guidelines.'
      END,
      jsonb_build_object(
        'screen', 'home',
        'post_id', NEW.id,
        'action', NEW.status::TEXT
      )
    );

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_post_moderated
    AFTER UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION notify_on_post_moderation();

  -- ─── Trigger: Notify post owner on like ─────────────────────────

  CREATE OR REPLACE FUNCTION notify_on_like()
  RETURNS TRIGGER AS $$
  DECLARE
    v_target_owner_id UUID;
    v_target_title TEXT;
    v_liker_name TEXT;
  BEGIN
    IF NEW.likeable_type::TEXT <> 'post' THEN
      RETURN NEW;
    END IF;

    SELECT user_id, title INTO v_target_owner_id, v_target_title
    FROM posts WHERE id = NEW.likeable_id;

    IF v_target_owner_id IS NULL OR v_target_owner_id = NEW.user_id THEN
      RETURN NEW;
    END IF;

    SELECT full_name INTO v_liker_name
    FROM profiles WHERE id = NEW.user_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_target_owner_id,
      'like',
      COALESCE(v_liker_name, 'Someone') || ' liked your post',
      LEFT(v_target_title, 100),
      jsonb_build_object(
        'screen', 'home',
        'post_id', NEW.likeable_id
      )
    );

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_like_created
    AFTER INSERT ON likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_like();

