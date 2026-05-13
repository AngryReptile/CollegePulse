-- ============================================================
-- CollegePulse — NHCM Community Network
-- Migration 002: Row Level Security (RLS)
-- Run AFTER 001_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps    ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update ANY profile (needed for role management dashboard)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- FORUM THREADS
-- ============================================================
CREATE POLICY "Forum threads viewable by all" ON public.forum_threads
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON public.forum_threads
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their threads" ON public.forum_threads
  FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "Authors and admins can delete threads" ON public.forum_threads
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- ============================================================
-- FORUM COMMENTS
-- ============================================================
CREATE POLICY "Forum comments viewable by all" ON public.forum_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.forum_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their comments" ON public.forum_comments
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- ============================================================
-- POSTS
-- ============================================================
CREATE POLICY "Posts viewable by all" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can update posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "Authors and admins can delete posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- ============================================================
-- POST LIKES
-- ============================================================
CREATE POLICY "Post likes viewable by all" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like/unlike" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- POST COMMENTS
-- ============================================================
CREATE POLICY "Post comments viewable by all" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment on posts" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their post comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- ============================================================
-- CONVERSATIONS (DMs)
-- Only participants can see their conversations
-- ============================================================
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

-- ============================================================
-- MESSAGES
-- Only conversation participants can read/write messages
-- ============================================================
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)
    )
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)
    )
  );

CREATE POLICY "Participants can update messages (read receipts)" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)
    )
  );

-- ============================================================
-- BOARD ITEMS
-- ============================================================
CREATE POLICY "Board items viewable by all" ON public.board_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post board items" ON public.board_items
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update board items" ON public.board_items
  FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "Authors and admins can delete board items" ON public.board_items
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- ============================================================
-- EVENTS
-- ============================================================
CREATE POLICY "Events viewable by all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins can create events" ON public.events
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- EVENT RSVPs
-- ============================================================
CREATE POLICY "Users can view their own RSVPs" ON public.event_rsvps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can RSVP" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their RSVP" ON public.event_rsvps
  FOR DELETE USING (auth.uid() = user_id);
