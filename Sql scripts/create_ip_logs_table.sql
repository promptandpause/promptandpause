-- Create IP Logs Table for User Location Tracking
-- This helps track where users are signing up from and verify country detection accuracy

CREATE TABLE IF NOT EXISTS public.ip_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  country TEXT NULL,
  city TEXT NULL,
  timezone TEXT NULL,
  user_agent TEXT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login', 'age_verification', 'other')),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON public.ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_event_type ON public.ip_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_ip_logs_country ON public.ip_logs(country);
CREATE INDEX IF NOT EXISTS idx_ip_logs_logged_at ON public.ip_logs(logged_at DESC);

-- Add RLS policies
ALTER TABLE public.ip_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own IP logs
CREATE POLICY "Users can view own IP logs"
  ON public.ip_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert IP logs (done via backend)
CREATE POLICY "Service role can insert IP logs"
  ON public.ip_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.ip_logs IS 'Logs user IP addresses and location data for security and analytics';
