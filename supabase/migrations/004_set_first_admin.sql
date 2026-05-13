-- ============================================================
-- CollegePulse — Migration 004: Admin Role Management
-- Run in Supabase SQL Editor AFTER the other migrations
-- ============================================================

-- Allow admins to update ANY profile (needed for role toggling)
-- The existing policy only lets users update their own profile.
-- This adds a separate admin policy.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Allow admins to read ALL profiles (already covered by SELECT policy,
-- but stated explicitly for clarity)
-- "Profiles are viewable by everyone" in 002_rls.sql covers this.

-- ============================================================
-- Set the first admin — thilakg895@gmail.com
-- ============================================================
-- Run this AFTER the user has signed up through the app.
-- If the user hasn't signed up yet, sign up first, then run this.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'thilakg895@gmail.com';

-- Verify it worked:
SELECT id, email, username, full_name, role, created_at
FROM public.profiles
WHERE email = 'thilakg895@gmail.com';
