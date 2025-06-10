
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

const SecureDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [processedFiles, setProcessedFiles] = useState([]);

  const {
    selectedFile,
    isProcessing,
    uploadProgress,
    processedData,
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
      fetchProcessedFiles();
    }
  }, [user, loading, navigate]);

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
        fileName: file.original_file_name,
        uploadedAt: file.created_at,
        status: file.status as 'processing' | 'completed' | 'failed',
        merchant: file.merchant,
        total: file.total?.toString(),
        itemCount: file.item_count
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
            Convert Images & PDFs to Excel, CSV, or JSON
          </h1>
          <p className="text-gray-600">
            Securely upload your images or PDF files with table data and convert them to structured data formats.
          </p>
        </div>

        <ProcessSteps />

        <FileUploadSection
          selectedFile={selectedFile}
          isProcessing={isProcessing}
          uploadProgress={uploadProgress}
          onFileSelect={handleFileSelect}
          onDrop={handleDrop}
          onProcessFile={handleProcessFile}
        />

        <ResultsSection
          processedData={processedData}
          onExport={handleExport}
        />

        <div className="mt-8">
          <ProcessedFilesList
            files={processedFiles}
            onDownload={handleFileDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default SecureDashboard;
