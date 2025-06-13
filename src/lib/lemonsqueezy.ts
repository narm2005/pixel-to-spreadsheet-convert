import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: import.meta.env.VITE_LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error('Lemon Squeezy Error:', error),
});

export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID,
  variantIds: {
    premium_monthly: import.meta.env.VITE_LEMONSQUEEZY_PREMIUM_MONTHLY_VARIANT_ID,
    premium_yearly: import.meta.env.VITE_LEMONSQUEEZY_PREMIUM_YEARLY_VARIANT_ID,
  },
  webhookSecret: import.meta.env.VITE_LEMONSQUEEZY_WEBHOOK_SECRET,
};

export interface CheckoutData {
  variantId: string;
  customData?: {
    user_id: string;
    user_email: string;
  };
}

export const createCheckoutUrl = (data: CheckoutData): string => {
  const baseUrl = 'https://slickreceipts.lemonsqueezy.com/checkout/buy';
  const params = new URLSearchParams({
    variant: data.variantId,
    ...(data.customData && {
      'custom[user_id]': data.customData.user_id,
      'custom[user_email]': data.customData.user_email,
    }),
  });
  
  return `${baseUrl}?${params.toString()}`;
};