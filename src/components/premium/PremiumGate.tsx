import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PremiumFeatureGate from './PremiumFeatureGate';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  description?: string;
  fallback?: React.ReactNode;
}

const PremiumGate: React.FC<PremiumGateProps> = ({ 
  children, 
  feature = "Premium Feature",
  description = "This feature is only available to Premium subscribers.",
  fallback 
}) => {
  const { user } = useAuth();
  const [userTier, setUserTier] = useState<'freemium' | 'premium'>('freemium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserTier();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserTier = async () => {
    try {
      console.log('PremiumGate: Fetching user tier for:', user?.id);
      
      if (!user?.id) {
        console.error('PremiumGate: No user ID available');
        setUserTier('freemium');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('PremiumGate: Error fetching user tier:', error);
        if (error.code !== 'PGRST116') {
          throw error;
        }
        // Profile doesn't exist, default to freemium
        console.log('PremiumGate: Profile not found, defaulting to freemium');
        setUserTier('freemium');
        return;
      }
      
      const tier = data?.user_tier;
      console.log('PremiumGate: User tier fetched:', tier);
      if (tier === 'premium' || tier === 'freemium') {
        setUserTier(tier);
      } else {
        console.log('PremiumGate: Invalid tier, defaulting to freemium');
        setUserTier('freemium');
      }
      
      // Also check subscription status for real-time tier verification
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_end')
        .eq('user_id', user.id)
        .eq('subscribed', true)
        .single();
      
      if (subscription) {
        const isActive = !subscription.subscription_end || 
          new Date(subscription.subscription_end) > new Date();
        
        if (isActive && tier !== 'premium') {
          console.log('PremiumGate: Found active subscription, user should be premium');
          setUserTier('premium');
        } else if (!isActive && tier === 'premium') {
          console.log('PremiumGate: Subscription expired, user should be freemium');
          setUserTier('freemium');
        }
      }
    } catch (error: any) {
      console.error('Error fetching user tier:', error);
      setUserTier('freemium');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (userTier === 'premium') {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <PremiumFeatureGate
      userTier={userTier}
      feature={feature}
      description={description}
    />
  );
};

export default PremiumGate;