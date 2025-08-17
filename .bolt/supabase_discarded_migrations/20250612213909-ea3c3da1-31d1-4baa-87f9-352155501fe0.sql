
-- Create table to track file upload usage per user
CREATE TABLE public.upload_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on upload_logs
ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for upload_logs
CREATE POLICY "Users can view their own upload logs" ON public.upload_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own upload logs" ON public.upload_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage upload logs" ON public.upload_logs
  FOR ALL USING (true);

-- Create function to get user's total file count
CREATE OR REPLACE FUNCTION public.get_user_file_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(file_count), 0) INTO total_count
  FROM public.upload_logs
  WHERE user_id = user_uuid;
  
  RETURN total_count;
END;
$$;

-- Create function to check if user can upload files
CREATE OR REPLACE FUNCTION public.can_user_upload(user_uuid UUID, new_file_count INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  user_tier_value TEXT;
  max_files INTEGER;
BEGIN
  -- Get user tier
  SELECT user_tier INTO user_tier_value
  FROM public.profiles 
  WHERE id = user_uuid;
  
  -- Set max files based on tier
  IF user_tier_value = 'premium' THEN
    max_files := -1; -- Unlimited for premium
  ELSE
    max_files := 10; -- Free tier limit
  END IF;
  
  -- If premium user, always allow
  IF max_files = -1 THEN
    RETURN true;
  END IF;
  
  -- Get current file count
  SELECT public.get_user_file_count(user_uuid) INTO current_count;
  
  -- Check if new upload would exceed limit
  RETURN (current_count + new_file_count) <= max_files;
END;
$$;

-- Create index for efficient queries
CREATE INDEX idx_upload_logs_user_created ON public.upload_logs (user_id, created_at DESC);
