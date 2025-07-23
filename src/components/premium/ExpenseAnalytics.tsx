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
    console.log('🔍 ExpenseAnalytics mounted, user:', user?.id);
    if (user) {
      fetchAnalytics();
    } else {
      console.log('❌ No user found in ExpenseAnalytics');
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      console.log('📊 Fetching analytics for user:', {
        userId: user?.id,
        userEmail: user?.email,
        hasUser: !!user
      });
      
      if (!user?.id) {
        console.error('❌ No user ID available for analytics');
        setLoading(false);
        return;
      }
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Current session for analytics:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        matchesUser: session?.user?.id === user.id
      });
      
      const { data, error } = await supabase
        .from('expense_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('month_year', { ascending: false });

      if (error) {
        console.error('❌ Analytics fetch error:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Analytics data fetched:', {
        recordCount: data?.length || 0,
        data: data?.slice(0, 3) // Show first 3 records for debugging
      });
      
      setAnalyticsData(data || []);
      
      // If no analytics data, check if we have processed files to generate analytics from
      if (!data || data.length === 0) {
        console.log('📝 No analytics data found, checking processed files...');
        await generateAnalyticsFromProcessedFiles();
      } else {
        console.log('✅ Analytics data loaded successfully:', data.length, 'records');
      }
    } catch (error: any) {
      console.error('❌ Error in fetchAnalytics:', {
        error,
        message: error.message,
        stack: error.stack
      });
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
    if (!user?.id) {
      console.error('❌ No user ID available for generating analytics');
      return;
    }
    
    try {
      console.log('🔄 Generating analytics from processed files for user:', user.id);
      
      const { data: processedFiles, error } = await supabase
        .from('processed_files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .not('processed_data', 'is', null);

      if (error) {
        console.error('❌ Error fetching processed files for analytics:', {
          error,
          message: error.message,
          userId: user.id
        });
        return;
      }

      console.log('📄 Processed files for analytics:', {
        fileCount: processedFiles?.length || 0,
        files: processedFiles?.map(f => ({
          id: f.id,
          status: f.status,
          hasData: !!f.processed_data,
          merchant: f.merchant,
          total: f.total
        }))
      });

      if (processedFiles && processedFiles.length > 0) {
        // Generate analytics from processed files
        const analyticsMap = new Map();

        processedFiles.forEach(file => {
          const data = file.processed_data as any;
          console.log('🔍 Processing file data for analytics:', {
            fileId: file.id,
            hasProcessedData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            merchant: data?.merchant,
            total: data?.total,
            category: data?.category,
            date: data?.date
          });
          
          if (data && data.total && data.category && data.date) {
            const monthYear = data.date.substring(0, 7); // YYYY-MM format
            const category = data.category || 'uncategorized';
            const amount = parseFloat(data.total) || 0;
            
            console.log('✅ Extracted analytics data:', { 
              fileId: file.id,
              monthYear, 
              category, 
              amount 
            });
            
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
          } else {
            console.log('⚠️ Skipping file due to missing data:', {
              fileId: file.id,
              hasTotal: !!data?.total,
              hasCategory: !!data?.category,
              hasDate: !!data?.date,
              actualData: data
            });
          }
        });

        const generatedAnalytics = Array.from(analyticsMap.values());
        console.log('📊 Generated analytics:', {
          recordCount: generatedAnalytics.length,
          analytics: generatedAnalytics
        });
        
        if (generatedAnalytics.length > 0) {
          setAnalyticsData(generatedAnalytics);
          
          // Optionally save generated analytics to database for future use
          try {
            console.log('💾 Saving generated analytics to database...');
            const { error: insertError } = await supabase
              .from('expense_analytics')
              .upsert(
                generatedAnalytics.map(item => ({
                  ...item,
                  user_id: user.id
                })),
                { onConflict: 'user_id,month_year,category' }
              );
            
            if (insertError) {
              console.error('❌ Error saving generated analytics:', insertError);
            } else {
              console.log('✅ Generated analytics saved to database');
            }
          } catch (saveError) {
            console.error('❌ Error saving analytics:', saveError);
          }
        } else {
          console.log('⚠️ No valid data found in processed files for analytics');
        }
      } else {
        console.log('⚠️ No processed files found for analytics generation');
      }
    } catch (error) {
      console.error('❌ Error generating analytics from processed files:', error);
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