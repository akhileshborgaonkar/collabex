-- Feature 6: Brand/Influencer Separation
-- Add account type and brand-specific columns to profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'influencer',
ADD COLUMN IF NOT EXISTS company_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS website_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS industry text DEFAULT '';

-- Add check constraint for valid account types
ALTER TABLE public.profiles
ADD CONSTRAINT valid_account_type CHECK (account_type IN ('influencer', 'brand'));

-- Create index for filtering by account type
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);