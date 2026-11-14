import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
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

  // The server is the source of truth for the tier (GET /auth/me); this only decides what to show.
  const fetchUserTier = async () => {
    setUserTier(user?.tier === 'premium' ? 'premium' : 'freemium');
    setLoading(false);
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