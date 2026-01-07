import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useSecureFileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any>(null);
  const [mergedData, setMergedData] = useState<any>(null);

  const { toast } = useToast();
  const { user, session } = useAuth();

  const selectedFile = selectedFiles[0] ?? null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(e.target.files ?? []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSelectedFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const handleProcessFile = async (files: File[]) => {
  console.log("🚀 Starting file processing");

  if (!user || !session) {
    toast({ title: "Please sign in", variant: "destructive" });
    return;
  }

  if (!files || files.length === 0) {
    toast({ title: "No files selected", variant: "destructive" });
    return;
  }

  setIsProcessing(true);
  setUploadProgress(5);

  try {
    const uploaded: { id: string; fileName: string }[] = [];

// const {
//   data: { session },
// } = await supabase.auth.getSession();

if (!session) throw new Error("No active session");

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const ext = file.name.split(".").pop();
  const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
  
  console.log(`🚀 Uploading ${i + 1}/${files.length}: ${file.name} ${path}`);

  const { data, error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, file);

  if (uploadError) {
    console.error("❌ Storage upload error:", uploadError);
    toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
    continue;
  }

  console.log("✅ Upload successful:", path);

  const { data: dbData, error: dbError } = await supabase
    .from("processed_files")
    .insert({
      user_id: session.user.id,
      file_name: path,
      original_file_name: file.name,
      file_size: file.size,
      status: "processing",
    })
    .select()
    .single();

  if (dbError) {
    console.error("❌ DB insert failed:", dbError);
    await supabase.storage.from("receipts").remove([path]);
    continue;
  }

  uploaded.push({ id: dbData.id, fileName: path });

  const progress = 30 + Math.round(((i + 1) / files.length) * 30);
  setUploadProgress(progress);
}


    const { data, error } = await supabase.functions.invoke("process-receipt", {
      body: {
        fileIds: uploaded.map(f => f.id),
        filePaths: uploaded.map(f => f.fileName), // ✅ renamed
      },
      // headers: {
      //   Authorization: `Bearer ${session.access_token}`,
      // },
    });

    if (error) throw error;
    if (!data) throw new Error("Empty Edge Function response");

    if (!user || !session) {
      console.error('❌ No user or session available');
      toast({
        title: "Authentication required",
        description: "Please sign in to process files.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      console.error('❌ No files selected');
      toast({
        title: "No files selected",
        description: "Please select files to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      console.log('🔄 Starting file processing for:', selectedFiles.length, 'files');
      
      // Step 1: Upload files to storage (0-40% progress)
      const uploadedFiles = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = Math.round((i / selectedFiles.length) * 40);
        setUploadProgress(progress);

        console.log(`📤 Uploading file ${i + 1}/${selectedFiles.length}:`, {
          originalName: file.name,
          size: file.size,
          type: file.type
        });

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const storagePath = `${user.id}/${timestamp}-${i}.${fileExtension}`;

        console.log('📁 Storage path:', storagePath);

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error for file:', file.name, uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        console.log('✅ File uploaded successfully:', {
          storagePath,
          uploadPath: uploadData.path
        });

        // Create database record
        const { data: dbRecord, error: dbError } = await supabase
          .from('processed_files')
          .insert({
            user_id: user.id,
            file_name: storagePath,
            original_file_name: file.name,
            file_size: file.size,
            status: 'processing'
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Database error for file:', file.name, dbError);
          throw new Error(`Failed to create record for ${file.name}: ${dbError.message}`);
        }

        console.log('✅ Database record created:', {
          fileId: dbRecord.id,
          fileName: dbRecord.file_name
        });

        uploadedFiles.push({
          id: dbRecord.id,
          fileName: storagePath,
          originalName: file.name
        });
      }

      console.log('✅ All files uploaded successfully:', uploadedFiles.length);
      setUploadProgress(40);

      // Step 2: Process files via edge function (40-100% progress)
      console.log('📞 Preparing to call process-receipt edge function...');
      console.log('📞 Edge function URL:', `${SUPABASE_URL}/functions/v1/process-receipt`);
      console.log('📞 Session token available:', !!session.access_token);
      console.log('📞 User ID:', user.id);

      const fileIds = uploadedFiles.map(f => f.id);
      const fileNames = uploadedFiles.map(f => f.fileName);

      console.log('📞 Edge function payload:', {
        fileIds,
        fileNames,
        fileCount: fileIds.length,
        payloadSize: JSON.stringify({ fileIds, fileNames }).length
      });

      setUploadProgress(50);

      console.log('🔑 Session details for edge function:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        tokenPreview: session?.access_token?.substring(0, 20) + '...',
        userId: user.id
      });

      // Call the edge function with proper authentication
      const { data: functionResponse, error: functionError } = await supabase.functions
        .invoke('process-receipt', {
          body: {
            fileIds: fileIds,
            fileNames: fileNames
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY
          }
        });

      console.log('📞 Edge function response:', {
        hasData: !!functionResponse,
        hasError: !!functionError,
        errorMessage: functionError?.message,
        responseKeys: functionResponse ? Object.keys(functionResponse) : [],
        fullError: functionError ? JSON.stringify(functionError, null, 2) : null,
        fullResponse: functionResponse ? JSON.stringify(functionResponse, null, 2) : null
      });

      if (functionError) {
        console.error('❌ Edge function error:', functionError);
        
        // Handle specific error types
        if (functionError.message?.includes('FunctionsHttpError')) {
          throw new Error(`Edge function error: ${functionError.message}. Please check if the function is deployed.`);
        } else if (functionError.message?.includes('Unauthorized')) {
          throw new Error('Authentication failed. Please sign out and sign in again.');
        } else {
          throw new Error(`Processing failed: ${functionError.message}`);
        }
      }

      if (!functionResponse) {
        console.error('❌ No response from edge function');
        throw new Error('No response from processing service');
      }

      setUploadProgress(90);

      // Handle the response
      const { receipts, mergedData: responseMergedData, summary } = functionResponse;
      
      console.log('✅ Processing completed successfully:', {
        receiptsCount: receipts?.length || 0,
        hasMergedData: !!responseMergedData,
        summaryKeys: summary ? Object.keys(summary) : []
      });

      setProcessedData(receipts);
      setMergedData(responseMergedData);
      setUploadProgress(100);

      toast({
        title: "Processing complete!",
        description: `Successfully processed ${receipts?.length || 0} file(s).`,
      });

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Fatal error in handleProcessFile:', {
        error: error.message,
        stack: error.stack,
        selectedFiles: selectedFiles.length,
        hasUser: !!user,
        hasSession: !!session
      });

      toast({
        title: "Processing failed",
        description: error.message || "An unexpected error occurred during processing.",
        variant: "destructive",
      });

      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

    toast({ title: "Processing complete" });

  } catch (err: any) {
    console.error(err);
    toast({
      title: "Processing failed",
      description: err.message ?? "Unknown error",
      variant: "destructive",
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
      console.log('📞 Export function URL:', `${SUPABASE_URL}/functions/v1/export-merged-data`);
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
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
  };
};
