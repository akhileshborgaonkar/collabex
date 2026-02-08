
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  audience_tier TEXT DEFAULT 'nano' CHECK (audience_tier IN ('nano', 'micro', 'mid', 'macro', 'mega')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Social platforms per profile
CREATE TABLE public.social_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  follower_count INTEGER DEFAULT 0,
  url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social platforms" ON public.social_platforms FOR SELECT USING (true);
CREATE POLICY "Users can manage own platforms" ON public.social_platforms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own platforms" ON public.social_platforms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own platforms" ON public.social_platforms FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);

-- Profile niches (many-to-many)
CREATE TABLE public.profile_niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, niche)
);

ALTER TABLE public.profile_niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view niches" ON public.profile_niches FOR SELECT USING (true);
CREATE POLICY "Users can manage own niches" ON public.profile_niches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own niches" ON public.profile_niches FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);

-- Swipe actions & matches
CREATE TABLE public.swipe_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(swiper_id, swiped_id)
);

ALTER TABLE public.swipe_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipes" ON public.swipe_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = swiper_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create swipes" ON public.swipe_actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = swiper_id AND user_id = auth.uid())
);

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_a, profile_b)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON public.matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE (id = profile_a OR id = profile_b) AND user_id = auth.uid())
);
CREATE POLICY "System can insert matches" ON public.matches FOR INSERT WITH CHECK (true);

-- Collaboration posts
CREATE TABLE public.collab_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT DEFAULT '',
  platforms TEXT[] DEFAULT '{}',
  niche TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collab_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collab posts" ON public.collab_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.collab_posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid())
);
CREATE POLICY "Authors can update posts" ON public.collab_posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid())
);
CREATE POLICY "Authors can delete posts" ON public.collab_posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid())
);

-- Applications to collab posts
CREATE TABLE public.collab_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.collab_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, applicant_id)
);

ALTER TABLE public.collab_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post authors and applicants can view" ON public.collab_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = applicant_id AND user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collab_posts cp
    JOIN public.profiles p ON p.id = cp.author_id
    WHERE cp.id = post_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Users can apply" ON public.collab_applications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = applicant_id AND user_id = auth.uid())
);
CREATE POLICY "Post authors can update applications" ON public.collab_applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.collab_posts cp
    JOIN public.profiles p ON p.id = cp.author_id
    WHERE cp.id = post_id AND p.user_id = auth.uid()
  )
);

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE (id = sender_id OR id = receiver_id) AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = sender_id AND user_id = auth.uid())
);
CREATE POLICY "Receivers can update read status" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = receiver_id AND user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, reviewee_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = reviewer_id AND user_id = auth.uid())
);

-- Portfolio images
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Users can manage own portfolio" ON public.portfolio_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own portfolio" ON public.portfolio_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);

-- Storage buckets for avatars and portfolio
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view portfolio" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Users can upload portfolio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete portfolio" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collab_posts_updated_at BEFORE UPDATE ON public.collab_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
