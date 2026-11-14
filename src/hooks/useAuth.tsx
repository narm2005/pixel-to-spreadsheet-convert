import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { api, getToken, setToken } from "@/lib/api";

// Same field names the app used with Supabase, so components keep working.
export interface AppUser {
  id: string;
  email: string | null;
  user_metadata: { name?: string | null; picture?: string | null };
  tier: "freemium" | "premium";
  files_used: number;
}

interface AuthContextType {
  user: AppUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  signInWithGoogleCredential: (credential: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.get<AppUser>("/auth/me"));
    } catch {
      setUser(null);
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    // api.ts fires this when the backend says the session is no longer valid
    const onSignedOut = () => {
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener("sr-signed-out", onSignedOut);
    return () => window.removeEventListener("sr-signed-out", onSignedOut);
  }, [refreshUser]);

  const signInWithGoogleCredential = async (credential: string) => {
    try {
      const res = await api.post<{ token: string; user: AppUser }>("/auth/google", { credential });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: token ? { access_token: token } : null,
        loading,
        signInWithGoogleCredential,
        signOut,
        refreshUser,
      }}
    >
      {loading ? <div className="p-8 text-center">Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
