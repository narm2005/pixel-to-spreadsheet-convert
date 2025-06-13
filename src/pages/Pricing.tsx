import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Crown, BarChart3, Cloud, Smartphone, Mail, Calendar, Lock } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useLemonSqueezy } from "@/hooks/useLemonSqueezy";
import LemonSqueezySubscriptionManager from "@/components/premium/LemonSqueezySubscriptionManager";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useAuth();
  const { createCheckout, isLoading } = useLemonSqueezy();

  const pricingPlans = [
    {
      name: "Freemium",
      description: "Perfect for getting started",
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      features: [
        "Up to 10 receipts total",
        "Basic OCR extraction",
        "CSV export only",
        "Email support",
        "30-day data retention"
      ],
      limitations: [
        "Limited accuracy",
        "No premium features",
        "No analytics dashboard",
        "No mobile app access"
      ],
      buttonText: "Get Started Free",
      icon: null
    },
    {
      name: "Premium",
      description: "Unlimited processing with advanced features",
      monthlyPrice: 9,
      yearlyPrice: 90, // ~17% discount
      popular: true,
      features: [
        "Unlimited receipt uploads",
        "Advanced AI-powered OCR",
        "Excel, CSV, JSON export",
        "Expense analytics dashboard",
        "Priority email support",
        "1-year data retention",
        "Advanced table recognition",
        "Category auto-detection"
      ],
      buttonText: "Start Premium",
      icon: <Crown className="h-5 w-5" />
    }
  ];

  const premiumFeatures = [
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      title: "Expense Analytics",
      description: "Visual dashboards with spending insights, category breakdowns, and monthly trends."
    },
    {
      icon: <Cloud className="h-6 w-6 text-green-600" />,
      title: "Cloud Storage & Sync",
      description: "Access your receipts from anywhere with automatic cloud synchronization."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-purple-600" />,
      title: "Mobile App Access",
      description: "Upload and process receipts on-the-go with our mobile application."
    },
    {
      icon: <Mail className="h-6 w-6 text-orange-600" />,
      title: "Priority Support",
      description: "Get faster response times with our priority email support channel."
    },
    {
      icon: <Calendar className="h-6 w-6 text-red-600" />,
      title: "Extended Retention",
      description: "Keep your data for 1 full year vs. 30 days for free users."
    },
    {
      icon: <Lock className="h-6 w-6 text-gray-600" />,
      title: "Advanced Security",
      description: "Enhanced data protection with enterprise-grade security features."
    }
  ];

  const handleSubscribe = async (plan: typeof pricingPlans[0]) => {
    if (plan.name === "Freemium") {
      window.location.href = "/signin";
      return;
    }

    // For Premium plan - use Lemon Squeezy
    try {
      const planType = isYearly ? 'yearly' : 'monthly';
      await createCheckout(planType);
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        isAuthenticated={!!user}
        user={user ? {
          name: user.user_metadata?.name || user.email,
          picture: user.user_metadata?.picture
        } : undefined}
      />
      
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the plan that's right for you. Start free, upgrade when you need more.
          </p>
          
          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="ml-2">
              Save 17%
            </Badge>
          </div>
        </div>

        {/* Subscription Manager for authenticated users */}
        {user && (
          <div className="max-w-md mx-auto mb-12">
            <LemonSqueezySubscriptionManager />
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  {plan.icon}
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">
                      ${isYearly ? 
                        Math.floor((plan.yearlyPrice || 0) / 12) : 
                        plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  
                  {plan.monthlyPrice > 0 && isYearly && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Billed annually (${plan.yearlyPrice}/year)
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Premium Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Unlock the full potential of SlickReceipts with advanced features designed for power users.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans at any time?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you start with our Freemium plan that includes 10 free receipts to try our service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards and PayPal through our secure Lemon Squeezy integration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, we use bank-level encryption and comply with industry security standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;