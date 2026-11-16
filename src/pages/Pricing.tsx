import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Crown, BarChart3, FileSpreadsheet, Layers, Smartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/hooks/useAuth";

// Prices in rupees. Online payment isn't connected yet, so "Upgrade" opens an email to support.
const PREMIUM_MONTHLY = 199;
const PREMIUM_YEARLY = 1999; // about 2 months free
const SUPPORT_EMAIL = "support@slickreceipts.com";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const upgradeMailto = (email: string | null | undefined, yearly: boolean) => {
  const plan = yearly ? `Yearly (${rupees(PREMIUM_YEARLY)}/year)` : `Monthly (${rupees(PREMIUM_MONTHLY)}/month)`;
  const subject = encodeURIComponent("Upgrade to SlickReceipts Premium");
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to upgrade to Premium.\n\nPlan: ${plan}\nAccount email: ${email || ""}\n\nThanks`
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
};

const freeFeatures = ["10 receipts free", "Photo or PDF upload", "GSTIN, invoice no. and GST amounts read for you", "Edit, search and CSV download"];
const premiumFeatures = [
  "Up to 1,000 receipts a month (100 a day)",
  "Upload up to 20 receipts at once and get one merged file",
  "Excel, CSV and JSON downloads, with a GST summary sheet for your CA",
  "Spending analytics by category and month",
  "Priority email support",
];

const highlights = [
  { icon: <Layers className="h-6 w-6 text-blue-600" />, title: "Merge many bills", text: "Scan a month's bills together and download one combined sheet." },
  { icon: <FileSpreadsheet className="h-6 w-6 text-green-600" />, title: "Excel & JSON", text: "Open straight in Excel or share with your accountant." },
  { icon: <BarChart3 className="h-6 w-6 text-purple-600" />, title: "Spending analytics", text: "See where your money goes, by category and by month." },
  { icon: <Smartphone className="h-6 w-6 text-orange-600" />, title: "Works on your phone", text: "Install it like an app and snap bills with your camera." },
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes. Every account gets 10 receipts free, no card needed." },
  { q: "How do I pay?", a: `Online payment is coming soon. For now, tap Upgrade and email us; we'll send UPI or bank details and switch your account to Premium.` },
  { q: "Can I cancel?", a: "Yes. Premium simply stops at the end of the period you paid for; your receipts stay in your account. New subscribers can get a full refund within 7 days." },
  { q: "Is my data private?", a: "Only you can see your receipts. Photos are read and then discarded; only the extracted data is saved." },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useAuth();
  const isPremium = user?.tier === "premium";

  const navbar = (
    <Navbar
      isAuthenticated={!!user}
      user={user ? { name: user.user_metadata?.name || user.email || undefined, picture: user.user_metadata?.picture || undefined } : undefined}
    />
  );

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background">
        {navbar}
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <Crown className="mx-auto mb-4 h-10 w-10 text-yellow-500" />
          <h1 className="mb-2 text-2xl font-bold">You're on Premium</h1>
          <p className="mb-6 text-muted-foreground">All features are unlocked. Thank you for supporting SlickReceipts!</p>
          <Link to="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            Questions about your plan? <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>
    );
  }

  const premiumPrice = isYearly ? Math.round(PREMIUM_YEARLY / 12) : PREMIUM_MONTHLY;

  return (
    <div className="min-h-screen bg-background">
      {navbar}
      <div className="container mx-auto px-4 py-10 md:px-6 md:py-16">
        <div className="mb-10 text-center md:mb-14">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-5xl">Simple pricing</h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">Start free. Upgrade when you have more bills to scan.</p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Yearly billing" />
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>Yearly</span>
            <Badge variant="secondary">2 months free</Badge>
          </div>
        </div>

        <div className="mx-auto mb-16 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
          <Card>
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-2xl font-bold">Free</CardTitle>
              <CardDescription>Try it with your own bills</CardDescription>
              <div className="mt-4 text-4xl font-bold">₹0</div>
            </CardHeader>
            <CardContent>
              <ul className="mb-8 space-y-3">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={user ? "/dashboard" : "/signin"}>
                <Button variant="outline" className="w-full">{user ? "Go to Dashboard" : "Start free"}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="flex items-center gap-1 bg-primary text-primary-foreground">
                <Star className="h-3 w-3" /> Most popular
              </Badge>
            </div>
            <CardHeader className="pb-4 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
                <Crown className="h-5 w-5" /> Premium
              </CardTitle>
              <CardDescription>For shops and businesses with regular bills</CardDescription>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">{rupees(premiumPrice)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {isYearly && <p className="mt-1 text-sm text-muted-foreground">Billed {rupees(PREMIUM_YEARLY)} per year</p>}
            </CardHeader>
            <CardContent>
              <ul className="mb-8 space-y-3">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={upgradeMailto(user?.email, isYearly)}>
                <Button className="w-full">Upgrade to Premium</Button>
              </a>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Opens an email to us. We'll reply with UPI / bank details. See our{" "}
                <Link to="/refunds" className="underline">refund policy</Link>.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mb-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <Card key={h.title} className="text-center">
              <CardHeader className="pb-2">
                <div className="mb-2 flex justify-center">{h.icon}</div>
                <CardTitle className="text-base">{h.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{h.text}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="mb-1 font-semibold">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Pricing;
