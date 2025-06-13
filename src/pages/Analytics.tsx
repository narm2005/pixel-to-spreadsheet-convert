import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import PremiumGate from "@/components/premium/PremiumGate";
import ExpenseAnalytics from "@/components/premium/ExpenseAnalytics";

const Analytics = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
      return;
    }
  }, [user, loading, navigate]);

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

        <PremiumGate
          feature="Expense Analytics Dashboard"
          description="View detailed analytics, charts, and insights about your expenses. Available only for Premium users."
        >
          <ExpenseAnalytics />
        </PremiumGate>
      </div>
    </div>
  );
};

export default Analytics;