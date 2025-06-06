import React from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import ProcessSteps from "./dashboard/ProcessSteps";
import FileUploadSection from "./dashboard/FileUploadSection";
import ResultsSection from "./dashboard/ResultsSection";
import { useFileUpload } from "@/hooks/useFileUpload";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    selectedFile,
    isProcessing,
    uploadProgress,
    processedData,
    handleFileSelect,
    handleDrop,
    handleProcessFile,
    handleExport,
  } = useFileUpload();

  const handleSignOut = () => {
    navigate("/");
    toast({
      title: "Signed out successfully",
      description: "You have been logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} onSignOut={handleSignOut} />

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
      </div>
    </div>
  );
};

export default Dashboard;