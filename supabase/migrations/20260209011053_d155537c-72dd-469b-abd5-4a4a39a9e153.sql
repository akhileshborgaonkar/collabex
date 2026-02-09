-- Create collaborations table to track work lifecycle
CREATE TABLE public.collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_profiles CHECK (profile_a <> profile_b)
);

-- Enable RLS
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

-- Users can view collaborations they're part of
CREATE POLICY "Users can view own collaborations"
ON public.collaborations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE (profiles.id = collaborations.profile_a OR profiles.id = collaborations.profile_b)
    AND profiles.user_id = auth.uid()
  )
);

-- Users can create collaborations
CREATE POLICY "Users can create collaborations"
ON public.collaborations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE (profiles.id = collaborations.profile_a OR profiles.id = collaborations.profile_b)
    AND profiles.user_id = auth.uid()
  )
);

-- Users can update collaborations they're part of
CREATE POLICY "Users can update own collaborations"
ON public.collaborations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE (profiles.id = collaborations.profile_a OR profiles.id = collaborations.profile_b)
    AND profiles.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_collaborations_updated_at
BEFORE UPDATE ON public.collaborations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop existing permissive review insert policy and create restrictive one
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

-- Only allow reviews when there's a completed collaboration between the users
CREATE POLICY "Users can create reviews after completed collab"
ON public.reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = reviews.reviewer_id
    AND profiles.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM collaborations c
    WHERE c.status = 'completed'
    AND (
      (c.profile_a = reviews.reviewer_id AND c.profile_b = reviews.reviewee_id)
      OR (c.profile_b = reviews.reviewer_id AND c.profile_a = reviews.reviewee_id)
    )
  )
);