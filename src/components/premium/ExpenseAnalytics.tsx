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
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 ExpenseAnalytics mounted, user:', user?.id);
    console.log('🔍 Session state:', {
      hasSession: !!session,
      sessionValid: !!session?.access_token,
      userEmail: user?.email
    });
    
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
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔑 Current session for analytics:', {
        hasSession: !!currentSession,
        sessionUserId: currentSession?.user?.id,
        matchesUser: currentSession?.user?.id === user.id,
        sessionError: sessionError?.message
      });
      
      if (!currentSession) {
        throw new Error('No active session found');
      }
      
      // First, check user tier to ensure they have access
      console.log('👤 Checking user tier for analytics access...');
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user.id)
        .single();
      
      console.log('👤 User profile for analytics:', {
        hasProfile: !!userProfile,
        userTier: userProfile?.user_tier,
        profileError: profileError?.message
      });
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(`Profile fetch error: ${profileError.message}`);
      }
      
      if (!userProfile || userProfile.user_tier !== 'premium') {
        console.log('⚠️ User is not premium, analytics access restricted');
        setAnalyticsData([]);
        setLoading(false);
        return;
      }
      
      console.log('💎 Premium user confirmed, fetching analytics...');
      
      const { data, error } = await supabase
        .from('expense_analytics')
        .select('*')
        .eq('user_id', user.id)
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
        sampleData: data?.slice(0, 2).map(d => ({
          month: d.month_year,
          category: d.category,
          amount: d.total_amount
        }))
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
        .select('id, processed_data, merchant, total, category, created_at')
        .eq('user_id', user.id)
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
        sampleFiles: processedFiles?.slice(0, 2).map(f => ({
          id: f.id,
          hasData: !!f.processed_data,
          merchant: f.merchant,
          total: f.total
        }))
      });

      if (processedFiles && processedFiles.length > 0) {
        // Generate analytics from processed files
        console.log('🔄 Processing files for analytics generation...');
        const analyticsMap = new Map();

        processedFiles.forEach(file => {
          const data = file.processed_data as any;
          
          // Use file data or processed data
          const merchant = data?.merchant || file.merchant;
          const total = data?.total || file.total;
          const category = data?.category || file.category || 'uncategorized';
          const date = data?.date || file.created_at?.split('T')[0];
          
          console.log('🔍 Processing file for analytics:', {
            fileId: file.id,
            merchant,
            total,
            category,
            date
          });
          
          if (total && category && date) {
            const monthYear = date.substring(0, 7); // YYYY-MM format
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
              hasTotal: !!total,
              hasCategory: !!category,
              hasDate: !!date
            });
          }
        });

        const generatedAnalytics = Array.from(analyticsMap.values());
        console.log('📊 Generated analytics:', {
          recordCount: generatedAnalytics.length,
          sampleAnalytics: generatedAnalytics.slice(0, 2)
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