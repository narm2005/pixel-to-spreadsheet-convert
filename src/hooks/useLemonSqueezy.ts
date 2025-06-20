import { useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { createCheckoutUrl, LEMONSQUEEZY_CONFIG } from '@/lib/lemonsqueezy';

export const useLemonSqueezy = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createCheckout = async (plan: 'monthly' | 'yearly') => {
    console.log('Creating checkout for plan:', plan);
    // Validate user authentication
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const variantId = plan === 'monthly' 
        ? LEMONSQUEEZY_CONFIG.variantIds.premium_monthly
        : LEMONSQUEEZY_CONFIG.variantIds.premium_yearly;
        console.log('Selected plan:', LEMONSQUEEZY_CONFIG.variantIds.premium_monthly);
        console.log('Using variant ID:', variantId);
      if (!variantId) {
        throw new Error('Variant ID not configured');
      }
      if (variantId) {
      toast({
        title: "Checkout Will be coming Soon",
        description: "Failed to create checkout session.",
        variant: "destructive",
      });
      }

      const checkoutUrl = createCheckoutUrl({
        variantId,
        customData: {
          user_id: user.id,
          user_email: user.email || '',
        },
      });

      // Redirect to Lemon Squeezy checkout
      window.location.href = checkoutUrl;

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to create checkout session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    isLoading,
  };
};