import React, { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import ProcessSteps from "./dashboard/ProcessSteps";
import FileUploadSection from "./dashboard/FileUploadSection";
import ResultsSection from "./dashboard/ResultsSection";
import { useFileUpload } from "@/hooks/useFileUpload";
  // Redirect if not authenticated
import { jwtDecode } from "jwt-decode";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Inside Dashboard component
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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


useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast({
      title: "Authentication required",
      description: "Please sign in with Google.",
      variant: "destructive",
    });
    navigate("/signin");
    return;
  }
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      // Token expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast({
        title: "Session expired",
        description: "Please sign in again.",
        variant: "destructive",
      });
      navigate("/signin");
    }
  } catch {
    // Invalid token
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({
      title: "Authentication error",
      description: "Please sign in again.",
      variant: "destructive",
    });
    navigate("/signin");
  }
}, [navigate, toast]);

  const handleSignOut = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
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