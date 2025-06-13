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
      const { data, error } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      const tier = data?.user_tier;
      if (tier === 'premium' || tier === 'freemium') {
        setUserTier(tier);
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