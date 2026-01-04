-- ============================================================================
-- CREATE FOCUS AREAS TABLE (SIMPLIFIED VERSION)
-- ============================================================================
-- This is a simplified version without the is_active column initially
-- Run this if the table doesn't exist at all
-- ============================================================================

-- Create focus_areas table (without is_active initially)
CREATE TABLE IF NOT EXISTS public.focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT 'from-purple-500/20 to-pink-500/20 border-purple-400/30',
  priority INTEGER DEFAULT 1,
  reflection_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique focus area names per user
  UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_focus_areas_user_id ON public.focus_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_areas_priority ON public.focus_areas(user_id, priority DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own focus areas
CREATE POLICY "Users can view own focus areas" ON public.focus_areas
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own focus areas
CREATE POLICY "Users can insert own focus areas" ON public.focus_areas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own focus areas
CREATE POLICY "Users can update own focus areas" ON public.focus_areas
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own focus areas
CREATE POLICY "Users can delete own focus areas" ON public.focus_areas
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_focus_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER focus_areas_updated_at
  BEFORE UPDATE ON public.focus_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_focus_areas_updated_at();
