
-- Fix the permissive matches INSERT policy - matches should be created via a function
DROP POLICY "System can insert matches" ON public.matches;

-- Create a function to handle match creation when both users swipe right
CREATE OR REPLACE FUNCTION public.check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for matches on right swipes
  IF NEW.direction = 'right' THEN
    -- Check if the other person also swiped right on us
    IF EXISTS (
      SELECT 1 FROM public.swipe_actions
      WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND direction = 'right'
    ) THEN
      -- Create match (use least/greatest for consistent ordering)
      INSERT INTO public.matches (profile_a, profile_b)
      VALUES (LEAST(NEW.swiper_id, NEW.swiped_id), GREATEST(NEW.swiper_id, NEW.swiped_id))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipe_actions
  FOR EACH ROW EXECUTE FUNCTION public.check_and_create_match();
