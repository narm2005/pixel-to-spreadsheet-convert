import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import ProcessSteps from "./dashboard/ProcessSteps";
import FileUploadSection from "./dashboard/FileUploadSection";
import ResultsSection from "./dashboard/ResultsSection";
import ProcessedFilesList from "./dashboard/ProcessedFilesList";
import { useFileUpload } from "@/hooks/useFileUpload";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processedFiles, setProcessedFiles] = useState([]);

  const {
    selectedFile,
    selectedFiles,
    isProcessing,
    uploadProgress,
    processedData,
    handleFileSelect,
    handleDrop,
    handleProcessFile,
    handleExport,
  } = useFileUpload();

  // Authentication and file management logic
  useEffect(() => {
    // Simulate fetching processed files
    const mockFiles = [
      {
        id: "1",
        fileName: "receipt1.jpg",
        originalFileName: "Receipt 1",
        uploadedAt: new Date().toISOString(),
        status: "completed",
      },
      {
        id: "2",
        fileName: "receipt2.pdf",
        originalFileName: "Receipt 2",
        uploadedAt: new Date().toISOString(),
        status: "processing",
      },
    ];
    setProcessedFiles(mockFiles);
  }, []);

  const handleSignOut = () => {
    navigate("/");
    toast({
      title: "Signed out successfully",
      description: "You have been logged out.",
    });
  };

  const handleFileDownload = async (fileId: string, format: 'excel' | 'csv' | 'json') => {
    // For demo purposes - in real app this would download from storage
    await handleExport(format);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} user={null} onSignOut={handleSignOut} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convert Images & PDFs to Excel, CSV, or JSON
          </h1>
          <p className="text-gray-600">
            Upload your images or PDF files with table data and convert them to structured data formats.
          </p>
        </div>

        <ProcessSteps />

        <FileUploadSection
          selectedFile={selectedFile}
          selectedFiles={selectedFiles}
          isProcessing={isProcessing}
          uploadProgress={uploadProgress}
          onFileSelect={handleFileSelect}
          onDrop={handleDrop}
          onProcessFile={handleProcessFile}
          userTier="freemium"
          fileCount={0}
        />

        <ResultsSection
          processedData={processedData}
          onExport={handleExport}
          userTier="freemium"
        />

        <div className="mt-8">
          <ProcessedFilesList
            files={processedFiles}
            onDownload={handleFileDownload}
            userTier="freemium"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
