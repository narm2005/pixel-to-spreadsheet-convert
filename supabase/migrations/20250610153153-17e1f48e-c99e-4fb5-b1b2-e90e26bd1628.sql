
-- Add user tier tracking to profiles table
ALTER TABLE public.profiles ADD COLUMN user_tier TEXT DEFAULT 'freemium' CHECK (user_tier IN ('freemium', 'premium'));

-- Add expiration tracking to processed_files table
ALTER TABLE public.processed_files ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to set expiration date based on user tier
CREATE OR REPLACE FUNCTION public.set_file_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user tier
  SELECT user_tier INTO NEW.expires_at
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Set expiration based on tier (30 days for freemium, null for premium)
  IF NEW.expires_at = 'freemium' OR NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '30 days';
  ELSE
    NEW.expires_at := NULL; -- Premium users have no expiration
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expiration on file upload
CREATE TRIGGER set_file_expiration_trigger
  BEFORE INSERT ON public.processed_files
  FOR EACH ROW EXECUTE FUNCTION public.set_file_expiration();

-- Create table for tracking cleanup jobs
CREATE TABLE public.cleanup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL,
  files_deleted INTEGER DEFAULT 0,
  storage_cleaned INTEGER DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT
);

-- Enable RLS on cleanup_jobs (admin only access)
ALTER TABLE public.cleanup_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for cleanup jobs (service role only)
CREATE POLICY "Service role can manage cleanup jobs" ON public.cleanup_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_processed_files_expires_at ON public.processed_files (expires_at) WHERE expires_at IS NOT NULL;

-- Create index for user files queries
CREATE INDEX IF NOT EXISTS idx_processed_files_user_created ON public.processed_files (user_id, created_at DESC);
