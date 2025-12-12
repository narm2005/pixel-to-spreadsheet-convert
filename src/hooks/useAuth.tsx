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

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔍 Auth state:', {
      hasUser: !!user,
      hasSession: !!session,
      userEmail: user?.email,
      loading
    });
  }, [user, session, loading]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔑 Checking current session...');

        const isOAuthCallback = window.location.hash.includes('access_token') || 
                                window.location.search.includes('code=');

        if (isOAuthCallback) {
          console.log('📲 OAuth callback detected, handling...');
          const handled = await handleOAuthCallback();
          if (handled && mounted) {
            return;
          }
        }

        console.log('🔄 Getting session with 10s timeout...');
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          'Session check timed out. Please refresh the page.'
        );

        if (!mounted) return;

        if (error) {
          console.error('❌ Session error:', error);
          setSession(null);
          setUser(null);
        } else {
          console.log('✅ Session retrieved:', session?.user?.email || 'no session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error: any) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          
          if (error.message?.includes('timed out')) {
            toast({
              title: "Connection Issue",
              description: "Session check timed out. Please refresh the page.",
              variant: "destructive",
            });
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('✅ Auth initialization complete');
        }
      }
    };

  const handleOAuthCallback = async (): Promise<boolean> => {
  try {
    // Supabase handles BOTH hash and ?code formats automatically
    const { data, error } = await supabase.auth.getSessionFromUrl({
      storeSession: true,
    });

    if (error) throw error;

    if (data?.session) {
      console.log("✅ OAuth session established:", data.session.user.email);

      setSession(data.session);
      setUser(data.session.user);
      setLoading(false);

      toast({
        title: "Welcome!",
        description: "You are now signed in.",
      });

      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
     }
    } catch (error: any) {
    console.error("❌ OAuth callback error:", error);
    toast({
      title: "Authentication Error",
      description: error.message || "OAuth callback failed.",
      variant: "destructive",
    });

    setTimeout(() => {
      window.location.href = "/signin";
    }, 2000);
  }

  return false;
};

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('🔐 Exchanging code for session...');
          const { data, error } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            8000,
            'OAuth code exchange timed out'
          );

          if (error) throw error;

          if (mounted) {
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
          }

          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "Welcome!",
            description: "Successfully signed in",
          });

          return true;
        }
      } catch (error: any) {
        console.error('❌ OAuth callback error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to complete sign-in. Please try again.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      }
      
      return false;
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
                email: session.user.email,
                picture: session.user.user_metadata?.picture || session.user.user_metadata?.avatar_url,
                user_tier: 'freemium',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            const { data: subscription } = await supabase
              .from('subscribers')
              .select('subscribed, subscription_tier')
              .eq('user_id', session.user.id)
              .eq('subscribed', true)
              .maybeSingle();

            if (subscription?.subscribed) {
              await supabase
                .from('profiles')
                .update({ 
                  user_tier: 'premium',
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);
            }

            toast({
              title: "Welcome!",
              description: `Successfully signed in as ${session.user.email}`,
            });
          } catch (error) {
            console.error('Error in sign-in handler:', error);
          }
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        'Sign in timed out. Please check your connection and try again.'
      );
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl }
        }),
        10000,
        'Sign up timed out. Please try again.'
      );
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out:', user?.email);
    
    setUser(null);
    setSession(null);
    setLoading(false);

    try {
      const { error } = await withTimeout(
        supabase.auth.signOut(),
        5000,
        'Sign out timed out, but local session cleared'
      );
      
      if (error && !error.message.includes('timed out')) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Signed out",
        description: "You have been signed out locally.",
      });
      return { error: null };
    }
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    console.log('🔑 Google OAuth redirect:', redirectUrl);

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
