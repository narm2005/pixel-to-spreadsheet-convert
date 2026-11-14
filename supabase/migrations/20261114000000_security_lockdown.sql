-- Security lockdown (2026-11-14). Safe to run more than once.
-- Run in the Supabase dashboard: SQL Editor -> paste -> Run.

-- 1. Anyone (even signed-out visitors) could insert or update rows in `subscribers`,
--    and a trigger copies `subscribed = true` into profiles.user_tier = 'premium'.
--    The webhook uses the service role, which bypasses RLS, so these policies are not needed.
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- 2. Users could insert their own upload_logs rows (e.g. a negative file_count) to reset
--    their free quota. Only the process-receipt edge function (service role) writes these.
DROP POLICY IF EXISTS "Users can insert their own upload logs" ON public.upload_logs;

-- 3. "Users can update own profile" let a signed-in user set user_tier = 'premium' from the
--    browser. Keep that policy (name/picture edits) but block tier changes by end users.
CREATE OR REPLACE FUNCTION public.protect_user_tier()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.user_tier := 'freemium';
    ELSIF NEW.user_tier IS DISTINCT FROM OLD.user_tier THEN
      RAISE EXCEPTION 'user_tier can only be changed by the server';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_tier_trigger ON public.profiles;
CREATE TRIGGER protect_user_tier_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_tier();
