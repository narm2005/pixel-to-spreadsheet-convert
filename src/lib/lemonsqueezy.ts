// Only public values belong here: anything in a VITE_ variable ships to every visitor's browser.
// The Lemon Squeezy API key and webhook secret live only in the Supabase edge function secrets.
//console.log('Lemon Squeezy PREMIUM Monthly:', import.meta.env.VITE_LEMONSQUEEZY_PREMIUM_MONTHLY_VARIANT_ID);
export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID,
  variantIds: {
    premium_monthly: import.meta.env.VITE_LEMONSQUEEZY_PREMIUM_MONTHLY_VARIANT_ID,
    premium_yearly: import.meta.env.VITE_LEMONSQUEEZY_PREMIUM_YEARLY_VARIANT_ID,
  },
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