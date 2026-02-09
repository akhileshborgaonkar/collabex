-- Add banner and video URL columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url text DEFAULT ''::text,
ADD COLUMN IF NOT EXISTS video_url text DEFAULT ''::text;

-- Add is_verified column to social_platforms for future verification feature
ALTER TABLE public.social_platforms
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;