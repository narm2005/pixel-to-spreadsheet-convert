// Supabase is used only for sign-in (Google or email). All app data goes through the FastAPI backend (src/lib/api.ts).
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sysfetdwfkxnhntwgjvt.supabase.co";
// The anon key is public by design; it only allows what Supabase's own rules allow.
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c2ZldGR3Zmt4bmhudHdnanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Njc3MzEsImV4cCI6MjA2NTE0MzczMX0.iEaytHSsuwiSqc4YHoU1xdJAwNig-Le57W0JUPQkdBg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
