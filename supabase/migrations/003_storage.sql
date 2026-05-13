-- ============================================================
-- CollegePulse — NHCM Community Network
-- Migration 003: Storage Buckets
-- Run in Supabase SQL Editor OR use the Storage UI
-- ============================================================

-- Create storage buckets (run in SQL editor)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars',       'avatars',       true),
  ('feed-images',   'feed-images',   true),
  ('event-banners', 'event-banners', true),
  ('board-images',  'board-images',  true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- Avatars: anyone can view, authenticated can upload their own
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Feed images: public read, authenticated upload
CREATE POLICY "Feed images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-images');

CREATE POLICY "Authenticated users can upload feed images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feed-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own feed images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feed-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Event banners: public read, admin-only upload
CREATE POLICY "Event banners are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-banners');

CREATE POLICY "Admins can upload event banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-banners' AND public.is_admin());

-- Board images: public read, authenticated upload
CREATE POLICY "Board images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'board-images');

CREATE POLICY "Authenticated users can upload board images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'board-images' AND auth.role() = 'authenticated');

-- ============================================================
-- Useful Views
-- ============================================================

-- Thread comment counts view
CREATE OR REPLACE VIEW public.forum_threads_with_counts AS
SELECT
  t.*,
  COUNT(c.id) AS comment_count
FROM public.forum_threads t
LEFT JOIN public.forum_comments c ON c.thread_id = t.id
GROUP BY t.id;

-- Post stats view
CREATE OR REPLACE VIEW public.posts_with_counts AS
SELECT
  p.*,
  COUNT(pc.id) AS comment_count
FROM public.posts p
LEFT JOIN public.post_comments pc ON pc.post_id = p.id
GROUP BY p.id;
