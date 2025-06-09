
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      features: [
        "Up to 10 receipts per month",
        "Basic OCR extraction",
        "CSV export",
        "Email support",
        "30-day data retention"
      ],
      limitations: [
        "Limited accuracy",
        "No premium features"
      ],
      stripePrice: null,
      buttonText: "Get Started Free"
    },
    {
      name: "Pro",
      description: "For professionals and small businesses",
      monthlyPrice: 29,
      yearlyPrice: 290, // ~17% discount
      popular: true,
      features: [
        "Unlimited receipts",
        "Advanced AI-powered OCR",
        "Excel, CSV, JSON export",
        "Cloud storage & sync",
        "Mobile app access",
        "Category auto-detection",
        "Expense analytics",
        "Priority email support",
        "1-year data retention"
      ],
      stripePrice: {
        monthly: "price_monthly_pro", // Replace with actual Stripe price ID
        yearly: "price_yearly_pro"   // Replace with actual Stripe price ID
      },
      buttonText: "Start Pro Trial"
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large organizations",
      monthlyPrice: null,
      yearlyPrice: null,
      popular: false,
      features: [
        "Everything in Pro",
        "Custom integrations",
        "API access",
        "Advanced analytics & reporting",
        "Multi-user accounts",
        "Custom data retention",
        "Dedicated account manager",
        "24/7 phone support",
        "SLA guarantees",
        "Custom training"
      ],
      stripePrice: null,
      buttonText: "Contact Sales"
    }
  ];

  const handleSubscribe = async (plan: typeof pricingPlans[0]) => {
    if (plan.name === "Free") {
      // Redirect to sign up for free plan
      window.location.href = "/signin";
      return;
    }

    if (plan.name === "Enterprise") {
      // Redirect to contact form or sales
      window.location.href = "mailto:sales@slickreceipts.com";
      return;
    }

    // For Pro plan - integrate with Stripe
    try {
      const priceId = isYearly ? plan.stripePrice?.yearly : plan.stripePrice?.monthly;
      
      // This would be replaced with actual Supabase function call
      // const { data, error } = await supabase.functions.invoke('create-checkout', {
      //   body: { priceId }
      // });
      
      // For now, we'll redirect to signin
      console.log(`Subscribing to ${plan.name} - ${isYearly ? 'Yearly' : 'Monthly'}`);
      console.log(`Price ID: ${priceId}`);
      
      // Placeholder: redirect to signin for now
      window.location.href = "/signin";
      
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the plan that's right for you. Upgrade or downgrade at any time.
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  {plan.monthlyPrice === null ? (
                    <div className="text-3xl font-bold">Custom</div>
                  ) : (
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
                  )}
                  
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
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
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
                Yes, Pro plan includes a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, we use bank-level encryption and comply with SOC 2 Type II standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
