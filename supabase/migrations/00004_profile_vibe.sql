-- ─── Profile vibe + goals ────────────────────────────────────────
-- Adds personality vibe and looking_for goals to user profiles
-- Creates hellos table for the "Say Hello" social feature

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vibe TEXT,
  ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}';

-- ─── Hellos table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hellos (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

ALTER TABLE public.hellos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send hellos"
  ON public.hellos FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view their hellos"
  ON public.hellos FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ─── Trigger: notify on hello ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_hello()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.from_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.to_user_id,
    'hello',
    COALESCE(sender_name, 'Someone') || ' said hello! 👋',
    'Tap to view their profile',
    jsonb_build_object(
      'from_id',   NEW.from_user_id,
      'from_name', COALESCE(sender_name, 'Someone'),
      'screen',    'profile'
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_hello_sent ON public.hellos;
CREATE TRIGGER on_hello_sent
  AFTER INSERT ON public.hellos
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_hello();
