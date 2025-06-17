import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { 
  Star, 
  Send, 
  Crown, 
  Clock, 
  Download, 
  BarChart3, 
  Shield, 
  Smartphone,
  Bell,
  CheckCircle
} from "lucide-react";

const Feedback = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmittingFeedback(false);
      setFeedbackSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input and will use it to improve our service.",
      });
      
      // Reset form
      setFeedback("");
      setRating(0);
    }, 1000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingEmail(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmittingEmail(false);
      setEmailSubmitted(true);
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Premium features are available.",
      });
      
      // Reset form
      setEmail("");
    }, 1000);
  };

  const premiumFeatures = [
    {
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      title: "Extended Retention",
      description: "Keep your data for 1 year instead of 30 days"
    },
    {
      icon: <Download className="h-5 w-5 text-green-600" />,
      title: "Watermark-Free Exports",
      description: "Clean exports without SlickReceipts branding"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
      title: "Advanced Analytics",
      description: "Detailed spending insights and trend analysis"
    },
    {
      icon: <Shield className="h-5 w-5 text-orange-600" />,
      title: "Priority Support",
      description: "Get help faster with premium support"
    },
    {
      icon: <Smartphone className="h-5 w-5 text-indigo-600" />,
      title: "Mobile App Access",
      description: "Process receipts on-the-go with our mobile app"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        isAuthenticated={!!user}
        user={user ? {
          name: user.user_metadata?.name || user.email,
          picture: user.user_metadata?.picture
        } : undefined}
        onSignOut={handleSignOut}
      />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help Us Improve
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your feedback helps us build better features. Share your experience and get early access to premium features.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Feedback Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Share Your Feedback
              </CardTitle>
              <CardDescription>
                Tell us about your experience with SlickReceipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Thank you!
                  </h3>
                  <p className="text-gray-600">
                    Your feedback has been submitted successfully.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setFeedbackSubmitted(false)}
                  >
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you rate your experience?
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1 transition-colors"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {rating === 5 && "Excellent! 🎉"}
                        {rating === 4 && "Great! 👍"}
                        {rating === 3 && "Good 👌"}
                        {rating === 2 && "Okay 😐"}
                        {rating === 1 && "Needs improvement 😔"}
                      </p>
                    )}
                  </div>

                  {/* Feedback Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tell us more about your experience
                    </label>
                    <Textarea
                      placeholder="What did you like? What could be improved? Any features you'd like to see?"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmittingFeedback}
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Premium Preview Section */}
          <Card className="h-fit border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-blue-600" />
                  Premium – Coming Soon
                </CardTitle>
                <Badge className="bg-blue-600 text-white">
                  Early Access
                </Badge>
              </div>
              <CardDescription>
                Get notified when premium features launch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Preview */}
              <div className="text-center py-4 bg-white rounded-lg border">
                <div className="text-3xl font-bold text-gray-900">$9</div>
                <div className="text-gray-600">/month</div>
                <div className="text-sm text-gray-500 mt-1">
                  Estimated pricing
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Upcoming Premium Features:
                </h4>
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {feature.icon}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {feature.title}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email Signup */}
              {emailSubmitted ? (
                <div className="text-center py-6 bg-white rounded-lg border">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">
                    You're on the list!
                  </h4>
                  <p className="text-sm text-gray-600">
                    We'll email you when Premium is available.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email for early access"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmittingEmail}
                  >
                    {isSubmittingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Notify Me
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="text-xs text-gray-500 text-center">
                No spam, just updates on premium features
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <Card className="bg-gray-100 border-0">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Building the Future of Receipt Processing
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your feedback directly influences our roadmap. We're committed to building 
                the most powerful and user-friendly receipt processing platform.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Feedback;