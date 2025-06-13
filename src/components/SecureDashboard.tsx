
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import ProcessSteps from "./dashboard/ProcessSteps";
import FileUploadSection from "./dashboard/FileUploadSection";
import ResultsSection from "./dashboard/ResultsSection";
import ProcessedFilesList from "./dashboard/ProcessedFilesList";
import { useSecureFileUpload } from "@/hooks/useSecureFileUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PremiumFeatureGate from "./premium/PremiumFeatureGate";

const SecureDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [processedFiles, setProcessedFiles] = useState([]);
  const [userTier, setUserTier] = useState<'freemium' | 'premium'>('freemium');
  const [fileCount, setFileCount] = useState(0);

  const {
    selectedFile,
    selectedFiles,
    isProcessing,
    uploadProgress,
    processedData,
    mergedData,
    handleFileSelect,
    handleDrop,
    handleProcessFile,
    handleExport,
  } = useSecureFileUpload();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
      return;
    }

    if (user) {
      fetchUserProfile();
      fetchProcessedFiles();
      fetchUserFileCount();
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
      } else {
        setUserTier('freemium');
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setUserTier('freemium');
    }
  };

  const fetchUserFileCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_file_count', { user_uuid: user.id });

      if (error) throw error;
      setFileCount(data || 0);
    } catch (error: any) {
      console.error('Error fetching file count:', error);
    }
  };

  const fetchProcessedFiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('processed_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFiles = data?.map(file => ({
        id: file.id,
        fileName: file.file_name,
        originalFileName: file.original_file_name,
        uploadedAt: file.created_at,
        status: file.status as 'processing' | 'completed' | 'failed',
        merchant: file.merchant,
        total: file.total?.toString(),
        itemCount: file.item_count,
        expiresAt: file.expires_at,
        processedData: file.processed_data,
        category: file.category,
        confidenceScore: file.confidence_score
      })) || [];

      setProcessedFiles(formattedFiles);
    } catch (error: any) {
      toast({
        title: "Error loading files",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({
      title: "Signed out successfully",
      description: "You have been logged out.",
    });
  };

  const handleFileDownload = async (fileId: string, format: 'excel' | 'csv' | 'json') => {
    try {
      const { data: fileData, error } = await supabase
        .from('processed_files')
        .select('processed_data')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      if (fileData?.processed_data) {
        await handleExport(format);
      } else {
        toast({
          title: "No data available",
          description: "This file hasn't been processed yet or has no data.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (processedData) {
      fetchProcessedFiles();
      fetchUserFileCount();
    }
  }, [processedData]);

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

  const remainingFiles = userTier === 'premium' ? 'Unlimited' : Math.max(0, 10 - fileCount);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Convert Images & PDFs to Excel, CSV, or JSON
              </h1>
              <p className="text-gray-600">
                Securely upload your images or PDF files with table data and convert them to structured data formats.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Files used</p>
                <p className="text-lg font-semibold">
                  {userTier === 'premium' ? 'Unlimited' : `${fileCount}/10`}
                </p>
              </div>
              <Badge variant={userTier === 'premium' ? 'default' : 'secondary'} className="flex items-center gap-1">
                {userTier === 'premium' ? (
                  <Crown className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {userTier === 'premium' ? 'Premium' : 'Freemium'}
              </Badge>
            </div>
          </div>
          
          {/* Usage Warning for Free Users */}
          {userTier === 'freemium' && fileCount >= 8 && (
            <Card className="mt-4 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-orange-800">
                      You have {remainingFiles} files remaining in your free plan.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/pricing')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Premium Features Quick Access */}
        {userTier === 'premium' && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/analytics')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  View spending insights and category breakdowns
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}

        <ProcessSteps />

        <FileUploadSection
          selectedFile={selectedFile}
          selectedFiles={selectedFiles}
          isProcessing={isProcessing}
          uploadProgress={uploadProgress}
          onFileSelect={handleFileSelect}
          onDrop={handleDrop}
          onProcessFile={handleProcessFile}
          userTier={userTier}
          fileCount={fileCount}
        />

        <PremiumFeatureGate
          userTier={userTier}
          feature="Advanced Export Options"
          description="Premium users get access to Excel (.xlsx) and JSON export formats, plus merged data from multiple files."
          showUpgrade={false}
        >
          <ResultsSection
            processedData={processedData}
            mergedData={mergedData}
            onExport={handleExport}
            userTier={userTier}
          />
        </PremiumFeatureGate>

        <div className="mt-8">
          <ProcessedFilesList
            files={processedFiles}
            onDownload={handleFileDownload}
            userTier={userTier}
          />
        </div>
      </div>
    </div>
  );
};

export default SecureDashboard;
