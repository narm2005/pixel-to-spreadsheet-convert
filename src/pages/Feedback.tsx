import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { BUSINESS } from "@/lib/business";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { Star, Send, Crown, CheckCircle, Lightbulb, Bug, HelpCircle, Heart, MessageSquare, Mail } from "lucide-react";

const CATEGORIES = [
  { id: "idea", label: "Idea", icon: Lightbulb },
  { id: "bug", label: "Problem", icon: Bug },
  { id: "question", label: "Question", icon: HelpCircle },
  { id: "praise", label: "Praise", icon: Heart },
] as const;

const PLACEHOLDER: Record<string, string> = {
  idea: "What would make SlickReceipts more useful for you or your CA?",
  bug: "What happened, and what did you expect? Which phone or browser?",
  question: "What would you like to know?",
  praise: "What do you like? It helps us know what to keep.",
};

const LABELS = ["", "Poor", "Okay", "Good", "Great", "Excellent"];

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("idea");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3) {
      toast({ title: "Please write a few words", description: "Tell us what's on your mind.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await api.post("/feedback", {
        category,
        rating: rating || null,
        message: message.trim(),
        email: user ? "" : email.trim(),
        page: document.referrer ? new URL(document.referrer).pathname : "",
      });
      setSent(true);
      setMessage("");
      setRating(0);
    } catch (err: any) {
      toast({ title: "Could not send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 text-center md:mb-12">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">Help us improve</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Tell us what works, what doesn't, and what you'd like next. We read every message.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <Card className="h-fit lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send feedback
              </CardTitle>
              <CardDescription>
                {user ? `We'll reply to ${user.email} if needed.` : "Add your email if you'd like a reply."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Thank you!</h3>
                  <p className="text-gray-600">Your message has reached us.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">What is it about?</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Feedback type">
                      {CATEGORIES.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={category === id}
                          onClick={() => setCategory(id)}
                          className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                            category === id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">How is SlickReceipts working for you? (optional)</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          className="p-1"
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(star === rating ? 0 : star)}
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              star <= (hovered || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      {(hovered || rating) > 0 && <span className="ml-2 text-sm text-gray-600">{LABELS[hovered || rating]}</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fb-message">Your message</Label>
                    <Textarea
                      id="fb-message"
                      placeholder={PLACEHOLDER[category]}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      maxLength={4000}
                      className="resize-none"
                    />
                  </div>

                  {!user && (
                    <div className="space-y-2">
                      <Label htmlFor="fb-email">Email (optional)</Label>
                      <Input id="fb-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={sending}>
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? "Sending..." : "Send feedback"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Other ways to reach us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <a className="text-blue-600 underline" href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
                </p>
                <p>
                  We usually reply within 2 working days. For privacy requests or complaints, see our{" "}
                  <Link className="text-blue-600 underline" to="/contact">contact page</Link>.
                </p>
              </CardContent>
            </Card>

            {user?.tier !== "premium" && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-blue-600" />
                    Need more than 10 receipts?
                  </CardTitle>
                  <CardDescription>
                    Premium adds Excel with a GST summary sheet, merged uploads, analytics and up to 1,000 receipts a month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/pricing">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">See Premium plans</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Feedback;
