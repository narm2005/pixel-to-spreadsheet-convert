import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ExpenseSummaryCards from "@/components/analytics/ExpenseSummaryCards";
import ExpenseChart from "@/components/analytics/ExpenseChart";

interface AnalyticsData {
  month_year: string;
  category: string;
  total_amount: number;
  transaction_count: number;
}

const ExpenseAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('month_year', { ascending: false });

      if (error) throw error;
      setAnalyticsData(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analyticsData.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600 mb-4">
          Start processing receipts to see your expense analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <ExpenseSummaryCards data={analyticsData} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={analyticsData} type="category" />
        <ExpenseChart data={analyticsData} type="monthly" />
      </div>
    </div>
  );
};

export default ExpenseAnalytics;