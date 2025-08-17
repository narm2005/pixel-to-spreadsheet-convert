
-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create analytics table for premium expense tracking
CREATE TABLE public.expense_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  category TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year, category)
);

-- Enable RLS on expense_analytics
ALTER TABLE public.expense_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_analytics
CREATE POLICY "Users can view their own analytics" ON public.expense_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.expense_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON public.expense_analytics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analytics" ON public.expense_analytics
  FOR ALL USING (true);

-- Add category detection to processed_files
ALTER TABLE public.processed_files ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.processed_files ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

-- Create function to update user tier based on subscription
CREATE OR REPLACE FUNCTION public.update_user_tier_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user tier in profiles based on subscription status
  UPDATE public.profiles 
  SET user_tier = CASE 
    WHEN NEW.subscribed = true THEN 'premium'
    ELSE 'freemium'
  END,
  updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user tier when subscription changes
CREATE TRIGGER update_user_tier_trigger
  AFTER INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_tier_from_subscription();

-- Create index for efficient analytics queries
CREATE INDEX idx_expense_analytics_user_month ON public.expense_analytics (user_id, month_year);
CREATE INDEX idx_processed_files_category ON public.processed_files (category);
