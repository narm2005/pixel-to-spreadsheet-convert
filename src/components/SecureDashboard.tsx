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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  History, 
  Settings, 
  BarChart3, 
  FileText, 
  Crown,
  User,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";

const SecureDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, session, loading } = useAuth();
  const [processedFiles, setProcessedFiles] = useState([]);
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

  // Handle OAuth redirect on component mount
  useEffect(() => {
    console.log("SecureDashboard mounted");
    console.log("Current URL:", window.location.href);
    console.log("Session:", session);
    console.log("Loading:", loading);
    
    // Check if this is an OAuth callback
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log("OAuth callback detected, auth hook should handle this");
      // The useAuth hook should handle this automatically
    }
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      console.log("No session found, redirecting to signin");
      navigate("/signin");
    }
  }, [session, loading, navigate]);

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

  // Sidebar menu items
  const menuItems = [
    { id: 'upload', label: 'Upload Files', icon: Upload, description: 'Upload and process new receipts' },
    { id: 'history', label: 'File History', icon: History, description: 'View and manage processed files' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Expense insights and reports', premium: true },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account and preferences' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, description: 'Get help and documentation' },
  ];

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
          </div>
        );
      
      case 'history':
        return (
          <ProcessedFilesList
            files={processedFiles}
            onDownload={handleFileDownload}
            userTier={userTier}
          />
        );
      
      case 'analytics':
        if (userTier === 'freemium') {
          return (
            <PremiumGate
              feature="Expense Analytics Dashboard"
              description="View detailed analytics, charts, and insights about your expenses. Available only for Premium users."
            />
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Expense Analytics
              </CardTitle>
              <CardDescription>
                View your spending patterns and expense insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Analytics dashboard coming soon!</p>
                <Link to="/analytics">
                  <Button>View Full Analytics</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences and subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Account Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Name:</strong> {user?.user_metadata?.name || 'Not set'}</p>
                  <p><strong>Plan:</strong> 
                    <Badge className="ml-2" variant={userTier === 'premium' ? 'default' : 'secondary'}>
                      {userTier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                      {userTier === 'premium' ? 'Premium' : 'Freemium'}
                    </Badge>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Usage</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Files processed:</strong> {fileCount} {userTier === 'freemium' ? '/ 10' : '(unlimited)'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link to="/pricing">
                  <Button variant="outline">
                    {userTier === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium'}
                  </Button>
                </Link>
                <Link to="/feedback">
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Give Feedback
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'help':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Support
              </CardTitle>
              <CardDescription>
                Get help with using SlickReceipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Quick Start Guide</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Upload your receipt images or PDF files</li>
                  <li>Wait for AI processing to complete</li>
                  <li>Review and edit the extracted data</li>
                  <li>Export to your preferred format</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Supported File Types</h3>
                <p className="text-sm text-gray-600">
                  Images: PNG, JPG, JPEG, GIF, BMP, WebP<br />
                  Documents: PDF<br />
                  Maximum file size: 10MB per file
                </p>
              </div>

              <div className="flex gap-2">
                <Link to="/feedback">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

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