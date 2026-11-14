import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "./Navbar";

const SecureSignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signInWithGoogleCredential } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const onGoogleSuccess = async (credential?: string) => {
    if (!credential) return;
    setIsLoading(true);
    const { error } = await signInWithGoogleCredential(credential);
    setIsLoading(false);
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome!", description: "You are now signed in." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">Welcome</CardTitle>
            <CardDescription>Sign in with Google to scan your receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {isLoading ? (
                <p className="text-sm text-gray-600 py-2">Signing in...</p>
              ) : (
                <GoogleLogin
                  onSuccess={(res) => onGoogleSuccess(res.credential)}
                  onError={() =>
                    toast({ title: "Google sign-in failed", description: "Please try again.", variant: "destructive" })
                  }
                  text="continue_with"
                  shape="pill"
                  width="300"
                />
              )}
            </div>
            <p className="mt-6 text-center text-xs text-gray-500">
              We only use your Google name, email and photo to create your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecureSignIn;
