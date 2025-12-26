// SecureDashboard.tsx
import React, { useEffect, useState, useCallback } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, History, Settings, BarChart3, Crown, User, HelpCircle, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const SecureDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, session, loading } = useAuth();
  const [processedFiles, setProcessedFiles] = useState<any[]>([]);
  const [userTier, setUserTier] = useState<'freemium' | 'premium'>('freemium');
  const [fileCount, setFileCount] = useState(0);
  const [activeSection, setActiveSection] = useState('upload');

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

  /** -----------------------------------------------
   * Fetch user profile and subscription
   * ----------------------------------------------- */
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        if (error.code === 'PGRST116' || error.status === 404) {
          // Create new profile
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            name: user.user_metadata?.name || user.user_metadata?.full_name,
            email: user.email,
            picture: user.user_metadata?.picture || user.user_metadata?.avatar_url,
            user_tier: 'freemium'
          });
          if (!insertError) setUserTier('freemium');
        }
        return;
      }

      setUserTier(data.user_tier === 'premium' ? 'premium' : 'freemium');

    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setUserTier('freemium');
    }
  }, [user]);

  /** -----------------------------------------------
   * Fetch processed files
   * ----------------------------------------------- */
  const fetchProcessedFiles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('processed_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFiles = (data || []).map(file => ({
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
      }));

      setProcessedFiles(formattedFiles);

    } catch (err: any) {
      console.error("Error fetching processed files:", err);
      setProcessedFiles([]);
      toast({
        title: "Error loading files",
        description: err.message || "Failed to load files",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  /** -----------------------------------------------
   * Fetch user file count
   * ----------------------------------------------- */
  const fetchUserFileCount = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_file_count', { user_uuid: user.id });
      if (error) throw error;
      setFileCount(data || 0);
    } catch (err: any) {
      console.error("Error fetching file count:", err);
      setFileCount(0);
    }
  }, [user]);

  /** -----------------------------------------------
   * Handle signout
   * ----------------------------------------------- */
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) window.location.href = "/";
  };

  /** -----------------------------------------------
   * Handle file download
   * ----------------------------------------------- */
  const handleFileDownload = async (fileId: string, format: 'excel' | 'csv' | 'json') => {
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
      if (!fileData?.processed_data) throw new Error("No data available");

      await handleExport(format, fileData.processed_data);

    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /** -----------------------------------------------
   * Effects
   * ----------------------------------------------- */
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) navigate("/signin");
  }, [session, loading, navigate]);

  // Fetch user data when ready
  useEffect(() => {
    if (!loading && session && user) {
      fetchUserProfile();
      fetchProcessedFiles();
      fetchUserFileCount();
    }
  }, [user, session, loading, fetchUserProfile, fetchProcessedFiles, fetchUserFileCount]);

  // Refresh processed files after a new file is processed
  useEffect(() => {
    if (processedData) {
      fetchProcessedFiles();
      fetchUserFileCount();
    }
  }, [processedData, fetchProcessedFiles, fetchUserFileCount]);

  /** -----------------------------------------------
   * Sidebar menu
   * ----------------------------------------------- */
  const menuItems = [
    { id: 'upload', label: 'Upload Files', icon: Upload, description: 'Upload and process new receipts' },
    { id: 'history', label: 'File History', icon: History, description: 'View and manage processed files' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Expense insights and reports', premium: true },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account and preferences' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, description: 'Get help and documentation' },
  ];

  /** -----------------------------------------------
   * Render content
   * ----------------------------------------------- */
  const renderContent = () => {
    switch (activeSection) {
      case 'upload':
        return (
          <div className="space-y-8">
            <ProcessSteps />
            <FileUploadSection
              selectedFile={selectedFile}
              selectedFiles={selectedFiles}
              isProcessing={isProcessing}
              uploadProgress={uploadProgress}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onProcessFile={async (file) => {
                await handleProcessFile(file);
                // Refresh processed files immediately after upload
                fetchProcessedFiles();
                fetchUserFileCount();
              }}
              userTier={userTier}
              fileCount={fileCount}
            />
            <PremiumGate
              feature="Advanced Export Options"
              description="Premium users get access to Excel (.xlsx) and JSON export formats."
              fallback={<ResultsSection processedData={processedData} mergedData={mergedData} onExport={handleExport} userTier={userTier} />}
            >
              <ResultsSection processedData={processedData} mergedData={mergedData} onExport={handleExport} userTier={userTier} />
            </PremiumGate>
          </div>
        );

      case 'history':
        return (
          <ProcessedFilesList files={processedFiles} onDownload={handleFileDownload} userTier={userTier} />
        );

      // ... keep other sections (analytics, settings, help) the same

      default: return null;
    }
  };

  return (
    <DashboardAuth>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          isAuthenticated={true}
          user={{ name: user?.user_metadata?.name || user?.email, picture: user?.user_metadata?.picture }}
          onSignOut={handleSignOut}
        />

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r min-h-screen">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Dashboard</h2>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        {item.premium && userTier === 'freemium' && (
                          <Crown className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <DashboardHeader userTier={userTier} fileCount={fileCount} />
              <PremiumQuickAccess userTier={userTier} />
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </DashboardAuth>
  );
};

export default SecureDashboard;
