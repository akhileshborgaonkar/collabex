-- Fix notifications table RLS policy to prevent unrestricted message injection
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive INSERT policy
-- Only allow the service role to insert notifications (edge functions use service role)
-- Regular users cannot directly insert notifications - they must go through the edge function
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- This will be false for all regular users (anon and authenticated)
  -- Only service role bypasses RLS entirely
  false
);

-- Note: The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- So the function can still insert notifications, but direct client calls cannot