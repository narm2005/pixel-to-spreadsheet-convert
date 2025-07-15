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
      console.log('Fetching analytics for user:', user?.id);
      
      const { data, error } = await supabase
        .from('expense_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('month_year', { ascending: false });

      if (error) {
        console.error('Analytics fetch error:', error);
        throw error;
      }
      
      console.log('Analytics data fetched:', data);
      setAnalyticsData(data || []);
      
      // If no analytics data, check if we have processed files to generate analytics from
      if (!data || data.length === 0) {
        console.log('No analytics data found, checking processed files...');
        await generateAnalyticsFromProcessedFiles();
      }
    } catch (error: any) {
      console.error('Error in fetchAnalytics:', error);
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateAnalyticsFromProcessedFiles = async () => {
    try {
      const { data: processedFiles, error } = await supabase
        .from('processed_files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .not('processed_data', 'is', null);

      if (error) {
        console.error('Error fetching processed files:', error);
        return;
      }

      console.log('Processed files for analytics:', processedFiles);

      if (processedFiles && processedFiles.length > 0) {
        // Generate analytics from processed files
        const analyticsMap = new Map();

        processedFiles.forEach(file => {
          const data = file.processed_data;
          if (data && data.total && data.category && data.date) {
            const monthYear = data.date.substring(0, 7); // YYYY-MM format
            const category = data.category || 'uncategorized';
            const amount = parseFloat(data.total) || 0;
            
            const key = `${monthYear}-${category}`;
            
            if (analyticsMap.has(key)) {
              const existing = analyticsMap.get(key);
              existing.total_amount += amount;
              existing.transaction_count += 1;
            } else {
              analyticsMap.set(key, {
                month_year: monthYear,
                category: category,
                total_amount: amount,
                transaction_count: 1
              });
            }
          }
        });

        const generatedAnalytics = Array.from(analyticsMap.values());
        console.log('Generated analytics:', generatedAnalytics);
        
        if (generatedAnalytics.length > 0) {
          setAnalyticsData(generatedAnalytics);
        }
      }
    } catch (error) {
      console.error('Error generating analytics from processed files:', error);
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