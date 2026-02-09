-- Add payment settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN base_rate numeric DEFAULT NULL,
ADD COLUMN rate_type text DEFAULT NULL,
ADD COLUMN currency text DEFAULT 'USD',
ADD COLUMN open_to_free_collabs boolean DEFAULT false;