
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Crown, Calendar, CreditCard } from "lucide-react";

interface Subscription {
  id: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  stripe_customer_id: string | null;
}

const SubscriptionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheckout = async () => {
    try {
      // This would integrate with Stripe checkout
      // For now, we'll just show a placeholder
      toast({
        title: "Checkout Coming Soon",
        description: "Stripe integration will be implemented here.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      // This would open Stripe customer portal
      toast({
        title: "Management Portal Coming Soon",
        description: "Stripe customer portal will be implemented here.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const isSubscribed = subscription?.subscribed || false;
  const subscriptionEnd = subscription?.subscription_end ? new Date(subscription.subscription_end) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Manage your premium subscription
            </CardDescription>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"} className="flex items-center gap-1">
            {isSubscribed && <Crown className="h-3 w-3" />}
            {isSubscribed ? 'Premium' : 'Free'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSubscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {subscriptionEnd ? (
                `Renews on ${subscriptionEnd.toLocaleDateString()}`
              ) : (
                'Active subscription'
              )}
            </div>
            <Button onClick={handleManageSubscription} variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium for unlimited uploads, advanced features, and priority support.
            </p>
            <Button onClick={handleCreateCheckout} className="w-full">
              Upgrade to Premium
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
