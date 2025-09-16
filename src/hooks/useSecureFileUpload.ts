
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useSecureFileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any>(null);
  const [mergedData, setMergedData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Backward compatibility for single file
  const selectedFile = selectedFiles.length > 0 ? selectedFiles[0] : null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('🔍 Files selected:', files.length, files.map(f => f.name));
    handleFilesValidation(files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    console.log('🔍 Files dropped:', files.length, files.map(f => f.name));
    handleFilesValidation(files);
  };

  const handleFilesValidation = (files: File[]) => {
    if (files.length === 0) return;

    console.log('🔍 Validating files:', files.length);
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10; // Maximum files per upload

    if (files.length > maxFiles) {
      console.log('❌ Too many files:', files.length, 'max:', maxFiles);
      toast({
        title: "Too many files",
        description: `Please select no more than ${maxFiles} files at once.`,
        variant: "destructive",
      });
      return;
    }

    const invalidFiles = files.filter(file => 
      !allowedTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      console.log('❌ Invalid files:', invalidFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
      toast({
        title: "Invalid files",
        description: `${invalidFiles.length} file(s) are invalid. Please ensure all files are images (PNG, JPG, JPEG, GIF, BMP, WebP) or PDF files under 10MB.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(files);
    setProcessedData(null);
    setMergedData(null);
    
    console.log('✅ Files validated and set:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    const fileNames = files.map(f => f.name).join(", ");
    const displayText = files.length === 1 
      ? `Selected: ${files[0].name}`
      : `Selected ${files.length} files: ${fileNames.length > 100 ? fileNames.substring(0, 100) + "..." : fileNames}`;
    
    toast({
      title: "Files selected",
      description: displayText,
    });
  };

  const handleProcessFile = async () => {
  setIsProcessing(true);
  console.log("🚀 Starting file processing...");

  try {
    // 🔑 Get current session once
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Session error:", sessionError.message);
      toast({
        title: "Session error",
        description: sessionError.message,
        variant: "destructive",
      });
      return;
    }

    if (!session?.access_token) {
      console.error("❌ No active session found");
      toast({
        title: "Authentication required",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Edge Function call
    console.log("📡 Invoking Edge Function: process-receipt...");
    const { data: functionData, error: functionError } = await supabase.functions
      .invoke("process-receipt", {
        body: {
          fileIds: fileIds,
          fileNames: fileNames,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

    if (functionError) {
      console.error("❌ Function error:", functionError);
      toast({
        title: "Processing failed",
        description: functionError.message,
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Function response:", functionData);
    toast({
      title: "Processing complete",
      description: "Your files have been processed successfully.",
    });

  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    toast({
      title: "Unexpected error",
      description: err.message || "Something went wrong. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};


  const handleExport = async (format: 'excel' | 'csv' | 'json', exportData: any) => {
    console.log('📤 handleExport called:', {
      format,
      hasExportData: !!exportData,
      hasUser: !!user,
      userId: user?.id
    });

    if (!exportData || !user) {
      console.log('❌ Cannot export:', { hasData: !!exportData, hasUser: !!user });
      toast({
        title: "Missing data",
        description: "Please process your files before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📤 Starting export:', {
      format,
      userId: user.id,
      dataType: typeof exportData,
      hasItems: !!exportData?.combinedItems,
      itemCount: exportData?.combinedItems?.length
    });
    
    // Check user tier for premium features
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('user_tier')
      .eq('id', user.id)
      .single();
    
    console.log('👤 User tier for export:', userProfile?.user_tier);
    
    if ((format === 'excel' || format === 'json') && userProfile?.user_tier === 'freemium') {
      console.log('❌ Premium feature blocked for freemium user');
      toast({
        title: "Premium Feature",
        description: "Excel and JSON exports are available for Premium users only.",
        variant: "destructive",
      });
      return;
    }
   
    try {
      console.log('📞 Calling export-merged-data edge function...');
      console.log('📞 Export function URL:', `${supabase.supabaseUrl}/functions/v1/export-merged-data`);
      console.log('📞 Export payload:', {
        format,
        userId: user.id,
        hasData: !!exportData,
        dataKeys: exportData ? Object.keys(exportData) : []
      });
      
      const { data, error } = await supabase.functions.invoke('export-merged-data', {
        body: {
          mergedData: exportData,
          format,
          userId: user.id
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📞 Export function response:', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        dataType: typeof data
      });

      if (error) {
        console.error('❌ Export function error:', error);
        throw new Error(error.message || 'Export failed');
      }


      console.log('✅ Export function completed:', { format, dataReceived: !!data });

      let blob, filename;
    
      if (format === 'excel') {
        console.log('📊 Processing Excel export...');
        // Convert base64 to Blob
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `receipts-${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        console.log('📄 Processing text export:', format);
        // For CSV/JSON
        const content = format === 'csv' ? data : JSON.stringify(data, null, 2);
        blob = new Blob([content], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        filename = `receipts-${new Date().toISOString().split('T')[0]}.${format}`;
      }

      // Trigger download
      console.log('💾 Triggering download:', filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      console.log('✅ Download triggered:', filename);

      toast({
        title: `Exported as ${format.toUpperCase()}`,
        description: 'Download started successfully',
      });

    } catch (error: any) {
      console.error('❌ Export error:', {
        error,
        message: error.message,
        stack: error.stack
      });
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };


  return {
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
  };
};