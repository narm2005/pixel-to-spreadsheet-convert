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

  // Debug session state
  useEffect(() => {
    console.log('🔍 Auth state debug:', {
      hasUser: !!user,
      hasSession: !!session,
      userEmail: user?.email,
      sessionValid: !!session?.access_token,
      loading
    });
  }, [user, session, loading]);
  
  useEffect(() => {
  let mounted = true;

  const initAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
    } catch (err) {
      console.error("Auth init error:", err);
      setSession(null);
      setUser(null);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  initAuth();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!mounted) return;

    console.log("Auth event:", event, session?.user?.email);

    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);

    if (event === "SIGNED_IN" && session?.user) {
      try {
        await supabase.from("profiles").upsert(
          {
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name,
            email: session.user.email,
            picture:
              session.user.user_metadata?.picture ||
              session.user.user_metadata?.avatar_url,
            user_tier: "freemium",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.error("Profile upsert failed:", err);
      }
    }

    if (event === "SIGNED_OUT") {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [toast]);


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out user from useAuth:', user?.email);

    // Clear local state immediately to prevent UI issues
    setUser(null);
    setSession(null);
    setLoading(false);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } else {
      console.log('Supabase signOut succeeded');
      // State already cleared above
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      return { error: null };
    }
  };

  const signInWithGoogle = async () => {
    // Use the current origin for redirect URL to support custom domains
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    console.log('Google OAuth redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
