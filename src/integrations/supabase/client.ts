import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sysfetdwfkxnhntwgjvt.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c2ZldGR3Zmt4bmhudHdnanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Njc3MzEsImV4cCI6MjA2NTE0MzczMX0.iEaytHSsuwiSqc4YHoU1xdJAwNig-Le57W0JUPQkdBg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);