-- ============================================================
-- CollegePulse — NHCM Community Network
-- Migration 001: Full Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         TEXT,
  username      TEXT UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  department    TEXT,
  year          INT CHECK (year BETWEEN 1 AND 6),
  skills        TEXT[] DEFAULT '{}',
  github_url    TEXT,
  linkedin_url  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on sign-up (all users default to 'student')
-- Role is upgraded manually by an admin via the Admin Dashboard.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    'student'   -- always student; promote via Admin Dashboard
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FORUM THREADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  category    TEXT DEFAULT 'General',
  tags        TEXT[] DEFAULT '{}',
  views       INT  NOT NULL DEFAULT 0,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_threads_author_idx  ON public.forum_threads(author_id);
CREATE INDEX IF NOT EXISTS forum_threads_category_idx ON public.forum_threads(category);
CREATE INDEX IF NOT EXISTS forum_threads_created_idx  ON public.forum_threads(created_at DESC);

-- ============================================================
-- FORUM COMMENTS (nested)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_comments_thread_idx ON public.forum_comments(thread_id);
CREATE INDEX IF NOT EXISTS forum_comments_parent_idx ON public.forum_comments(parent_id);

-- ============================================================
-- POSTS (Media Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  caption      TEXT,
  image_url    TEXT,
  likes_count  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_author_idx  ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts(created_at DESC);

-- ============================================================
-- POST LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id   UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================================
-- POST COMMENTS (nested)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id  UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON public.post_comments(post_id);

-- ============================================================
-- CONVERSATIONS (DMs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids  UUID[] NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_participants_idx ON public.conversations USING GIN(participant_ids);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body             TEXT NOT NULL,
  read             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_idx      ON public.messages(created_at ASC);

-- ============================================================
-- BOARD ITEMS (Teammate Finder + Lost & Found)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.board_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('teammate', 'lost', 'found')),
  title        TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  tags         TEXT[] DEFAULT '{}',
  is_resolved  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS board_items_category_idx ON public.board_items(category);
CREATE INDEX IF NOT EXISTS board_items_author_idx   ON public.board_items(author_id);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  event_date     TIMESTAMPTZ NOT NULL,
  venue          TEXT,
  banner_url     TEXT,
  qr_code_data   TEXT,
  max_attendees  INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(event_date ASC);

-- ============================================================
-- EVENT RSVPs + QR TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id     UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ticket_code  TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ============================================================
-- REALTIME — enable on all relevant tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_items;
