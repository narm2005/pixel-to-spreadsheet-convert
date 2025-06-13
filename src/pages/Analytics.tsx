
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import PremiumFeatureGate from "@/components/premium/PremiumFeatureGate";
import ExpenseAnalytics from "@/components/premium/ExpenseAnalytics";

const Analytics = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [userTier, setUserTier] = useState<'freemium' | 'premium'>('freemium');

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
      return;
    }

    if (user) {
      fetchUserProfile();
    }
  }, [user, loading, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const tier = data?.user_tier;
      if (tier === 'premium' || tier === 'freemium') {
        setUserTier(tier);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setUserTier('freemium');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        isAuthenticated={true}
        user={{ 
          name: user.user_metadata?.name || user.email,
          picture: user.user_metadata?.picture 
        }}
        onSignOut={handleSignOut}
      />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Expense Analytics
          </h1>
          <p className="text-gray-600">
            Get insights into your spending patterns and expense categories.
          </p>
        </div>

        <PremiumFeatureGate
          userTier={userTier}
          feature="Expense Analytics Dashboard"
          description="View detailed analytics, charts, and insights about your expenses. Available only for Premium users."
        >
          <ExpenseAnalytics />
        </PremiumFeatureGate>
      </div>
    </div>
  );
};

export default Analytics;
