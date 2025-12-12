import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 🚀 NEW — Handles OAuth redirects using official Supabase helper
  const handleOAuthCallback = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSessionFromUrl({
        storeSession: true,
      });

      if (error) throw error;
      if (!data?.session) return false;

      console.log("✅ OAuth session established:", data.session.user.email);

      setSession(data.session);
      setUser(data.session.user);
      setLoading(false);

      // Clean up URL (...?code=xxx → /dashboard)
      window.history.replaceState({}, document.title, window.location.pathname);

      toast({
        title: "Welcome!",
        description: "You are now signed in.",
      });

      return true;
    } catch (err: any) {
      console.error("❌ OAuth callback error:", err);

      toast({
        title: "Authentication Error",
        description: err.message || "OAuth callback failed.",
        variant: "destructive",
      });

      // Redirect safely
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1500);

      return false;
    }
  };

  // 🚀 Initialization
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        console.log("🔑 Initializing auth...");

        // 1️⃣ First handle OAuth redirect if present
        if (
          window.location.hash.includes("access_token") ||
          window.location.search.includes("code=")
        ) {
          console.log("🔐 OAuth callback detected");
          const handled = await handleOAuthCallback();
          if (handled && mounted) return; // stop here — user is signed in
        }

        // 2️⃣ Otherwise, load existing session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("❌ Auth init error:", err);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // 3️⃣ Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔄 Auth state changed:", event);

        setSession(session);
        setUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🚀 LOGIN
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // 🚀 SIGNUP
  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // 🚀 LOGOUT
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // 🚀 GOOGLE LOGIN
  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {/* Prevent UI from flashing during auth load */}
      {loading ? <div className="p-8 text-center">Loading...</div> : children}
    </AuthContext.Provider>
  );
};

// Hook export
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
