-- Initial Schema for What Should I Wear App v2

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  display_name TEXT,
  style_vibe TEXT DEFAULT 'Casual',
  preferred_colors TEXT[] DEFAULT '{}',
  location TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Clothing Items Table
CREATE TABLE IF NOT EXISTS public.clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessory')),
  color TEXT NOT NULL,
  image_url TEXT NOT NULL,
  cutout_url TEXT,
  ai_tags JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for Clothing Items
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own clothing items" 
  ON public.clothing_items FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Outfits Table
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  weather_summary TEXT,
  item_ids UUID[] NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
  ai_reasoning TEXT
);

-- Enable RLS for Outfits
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own outfits" 
  ON public.outfits FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
