import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { GoogleLogin } from '@react-oauth/google'; // <-- Add this import
import axios from "axios"; // <-- Add this import

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (email === "demo@example.com" && password === "password123") {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Sign in failed",
          description: "Invalid email or password. Try demo@example.com / password123",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  // Google SSO handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Send the credential to your backend for verification
      const res = await axios.post("http://localhost:8000/auth/callback", {
        credential: credentialResponse.credential,
      });
 if (res.data.success) {
  localStorage.setItem("token", res.data.token); // Store JWT
  localStorage.setItem("user", JSON.stringify({
    name: res.data.name,
    email: res.data.email,
    picture: res.data.picture,
  }));
  toast({
    title: "Google Sign-In Successful",
    description: `Welcome, ${res.data.name || "user"}!`,
  });
  navigate("/dashboard");
} else {
        toast({
          title: "Google Sign-In Failed",
          description: "Unable to sign in with Google.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Google Sign-In Failed",
        description: "Unable to sign in with Google.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Google Sign-In Failed",
      description: "Unable to sign in with Google.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your data dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {/* <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Demo Credentials:</p>
              <p className="text-sm text-blue-600">Email: demo@example.com</p>
              <p className="text-sm text-blue-600">Password: password123</p>
            </div> */}

            {/* Google SSO Button */}
            <div className="mb-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
              />
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {/* ...existing code... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;