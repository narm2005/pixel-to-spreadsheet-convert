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

  useEffect(() => {
    // Handle OAuth callback immediately on page load
    const handleOAuthCallback = async () => {
      const currentUrl = window.location.href;
      console.log('Current URL:', currentUrl);
      
      // Check for OAuth callback in hash
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('OAuth callback detected in hash');
        
        try {
          // Extract tokens from hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens...');
            
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
              throw error;
            }
            
            console.log('Session set successfully:', data);
            
            // Clean up URL immediately
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Set user state
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
            
            toast({
              title: "Welcome!",
              description: "Successfully signed in with Google",
            });
            
            return true;
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast({
            title: "Authentication Error",
            description: "Failed to complete Google sign-in. Please try again.",
            variant: "destructive",
          });
          
          // Redirect to sign-in on error
          window.location.href = '/signin';
          return false;
        }
      }
      
      // Check for OAuth callback in query params (fallback)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('code')) {
        console.log('OAuth callback detected in query params');
        
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(urlParams.get('code')!);
          
          if (error) throw error;
          
          console.log('Session exchanged successfully:', data);
          
          // Clean up URL
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);
          
          return true;
        } catch (error) {
          console.error('Code exchange error:', error);
          toast({
            title: "Authentication Error",
            description: "Failed to complete authentication. Please try again.",
            variant: "destructive",
          });
          
          window.location.href = '/signin';
          return false;
        }
      }
      
      return false;
    };

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // First, try to handle OAuth callback
        const wasOAuthCallback = await handleOAuthCallback();
        
        if (!wasOAuthCallback) {
          // If not an OAuth callback, get existing session
          console.log('Getting existing session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
          }
          
          console.log('Existing session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle successful sign in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Create or update user profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
                email: session.user.email,
                picture: session.user.user_metadata?.picture || session.user.user_metadata?.avatar_url,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (profileError) {
              console.error('Error updating profile:', profileError);
            } else {
              console.log('Profile updated successfully');
            }

            // Only show toast if not already shown during OAuth callback
            if (event !== 'TOKEN_REFRESHED') {
              toast({
                title: "Welcome!",
                description: `Successfully signed in as ${session.user.email}`,
              });
            }
          } catch (error) {
            console.error('Error in sign-in handler:', error);
          }
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
          });
        }
       }
    );

    return () => subscription.unsubscribe();
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
    //const session = await supabase.auth.getSession();
    console.log('Signing out user form useAuth:', user?.email);
    console.log('Supabase URL:', supabase?.supabaseUrl);
    console.log('Supabase Key:', supabase?.supabaseKey);

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
      // setUser(null);      // Clear user state immediately
      // setSession(null);   // Clear session state immediately
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