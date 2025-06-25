import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import ProcessSteps from "./dashboard/ProcessSteps";
import FileUploadSection from "./dashboard/FileUploadSection";
import ResultsSection from "./dashboard/ResultsSection";
import ProcessedFilesList from "./dashboard/ProcessedFilesList";
import DashboardHeader from "./dashboard/DashboardHeader";
import PremiumQuickAccess from "./dashboard/PremiumQuickAccess";
import DashboardAuth from "./dashboard/DashboardAuth";
import PremiumGate from "./premium/PremiumGate";
import { useSecureFileUpload } from "@/hooks/useSecureFileUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fi } from "date-fns/locale";

const SecureDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
    console.log("SecureDashboard mounted");
  // Handle Supabase OAuth redirect with hash fragment
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).then(() => {
        // Remove hash and reload to clean up URL and trigger auth state
        window.location.hash = '';
        window.location.reload();
      });
    }
  }
}, []);

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
    // Check if user has premium access for non-CSV formats
    if ((format === 'excel' || format === 'json') && userTier === 'freemium') {
      toast({
        title: "Premium Feature",
        description: "Excel and JSON exports are available for Premium users only.",
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }

    try {
      const { data: fileData, error } = await supabase
        .from('processed_files')
        .select('processed_data')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      if (fileData && fileData.processed_data) {
      const receipt = fileData.processed_data;

      const convertedMergedData = {
        summary: {
          totalFiles: 1,
          totalAmount: parseFloat(receipt.total),
          totalItems: receipt.items.length,
          processedAt: receipt.date || new Date().toISOString()
        },
        combinedItems: receipt.items.map((item, index) => ({
          receiptNumber: 1,
          merchant: receipt.merchant,
          date: receipt.date,
          description: item.description,
          amount: item.amount,
          category: item.category || '',
          fileName: receipt.fileName || 'receipt'
        }))
      };

      await handleExport(format, convertedMergedData);
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
    if (user) {
      fetchUserProfile();
      fetchProcessedFiles();
      fetchUserFileCount();
    }
  }, [user]);

  useEffect(() => {
    if (processedData) {
      fetchProcessedFiles();
      fetchUserFileCount();
    }
  }, [processedData]);

  return (
    <DashboardAuth>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          isAuthenticated={true}
          user={{ 
            name: user?.user_metadata?.name || user?.email,
            picture: user?.user_metadata?.picture 
          }}
          onSignOut={handleSignOut}
        />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <DashboardHeader userTier={userTier} fileCount={fileCount} />
          
          <PremiumQuickAccess userTier={userTier} />

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

          <PremiumGate
            feature="Advanced Export Options"
            description="Premium users get access to Excel (.xlsx) and JSON export formats, plus merged data from multiple files."
            fallback={
              <ResultsSection
                processedData={processedData}
                mergedData={mergedData}
                onExport={handleExport}
                userTier={userTier}
              />
            }
          >
            <ResultsSection
              processedData={processedData}
              mergedData={mergedData}
              onExport={handleExport}
              userTier={userTier}
            />
          </PremiumGate>

          <div className="mt-8">
            <ProcessedFilesList
              files={processedFiles}
              onDownload={handleFileDownload}
              userTier={userTier}
            />
          </div>
        </div>
      </div>
    </DashboardAuth>
  );
};

export default SecureDashboard;