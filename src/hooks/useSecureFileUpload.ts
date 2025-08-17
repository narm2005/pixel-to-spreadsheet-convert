
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
    console.log('🚀 handleProcessFile called');
    console.log('📊 Current state:', {
      selectedFilesCount: selectedFiles.length,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isProcessing
    });

    if (selectedFiles.length === 0 || !user) {
      console.log('❌ Cannot process files:', { 
        filesCount: selectedFiles.length, 
        hasUser: !!user,
        userId: user?.id 
      });
      toast({
        title: "Authentication required",
        description: "Please sign in to process files.",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing) {
      console.log('⚠️ Already processing files, ignoring duplicate request');
      return;
    }
    console.log('🚀 Starting file processing:', {
      fileCount: selectedFiles.length,
      userId: user.id,
      userEmail: user.email,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Check current session first
      console.log('🔑 Checking current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔑 Current session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionError: sessionError?.message
      });

      if (!session || !session.access_token) {
        console.error('❌ No valid session found');
        throw new Error('No valid session found. Please sign in again.');
      }

      console.log('✅ Session validated, proceeding with file upload...');
      const fileIds = [];
      const fileNames = [];

      // Upload all files first
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
        
        console.log(`📤 Uploading file ${i + 1}/${selectedFiles.length}:`, {
          originalName: file.name,
          storagePath: fileName,
          size: file.size,
          type: file.type
        });
        
        setUploadProgress(((i) / selectedFiles.length) * 40); // 0-40% for uploads

        // Upload with proper error handling
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error for file:', file.name, uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        console.log('✅ File uploaded successfully:', {
          originalName: file.name,
          storagePath: uploadData.path,
          fullPath: uploadData.fullPath,
          id: uploadData.id
        });
        
        // Create database record
        console.log('💾 Creating database record for:', fileName);
        const { data: fileRecord, error: dbError } = await supabase
          .from('processed_files')
          .insert({
            user_id: user.id,
            file_name: fileName,
            original_file_name: file.name,
            file_size: file.size,
            status: 'processing'
          })
          .select('*')
          .single();

        if (dbError || !fileRecord) {
          console.error('❌ Database error for file:', file.name, dbError);
          throw new Error(`Failed to create file record for ${file.name}`);
        }

        console.log('✅ Database record created:', {
          fileId: fileRecord.id,
          fileName: fileRecord.file_name,
          status: fileRecord.status
        });
        
        fileIds.push(fileRecord.id);
        fileNames.push(fileName);

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 50);
      }

      console.log('✅ All files uploaded, starting processing...', {
        fileIds,
        fileNames,
        totalFiles: fileIds.length
      });
      setUploadProgress(50);

      // Call Edge Function for processing (bulk)
      console.log('📞 Preparing to call process-receipt edge function...');
      console.log('📞 Supabase URL:', supabase.supabaseUrl);
      console.log('📞 Edge function URL:', `${supabase.supabaseUrl}/functions/v1/process-receipt`);
      console.log('📞 Request payload:', { 
        fileIds, 
        fileNames,
        fileIdsType: typeof fileIds,
        fileNamesType: typeof fileNames,
        fileIdsLength: fileIds.length,
        fileNamesLength: fileNames.length
      });
      console.log('📞 Auth token (first 20 chars):', session.access_token.substring(0, 20) + '...');
      
      setUploadProgress(60);
      
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('process-receipt', {
          body: { 
            fileIds: fileIds,
            fileNames: fileNames
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });

      setUploadProgress(80);

      console.log('📞 Edge function response:', {
        hasData: !!functionData,
        hasError: !!functionError,
        errorDetails: functionError ? {
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code
        } : null,
        dataKeys: functionData ? Object.keys(functionData) : []
      });

      if (functionError) {
        console.error('❌ Edge function error:', {
          error: functionError,
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code
        });
        
        // Check if it's a usage limit error
        if (functionError.message && functionError.message.includes('USAGE_LIMIT_EXCEEDED')) {
          toast({
            title: "Usage Limit Reached",
            description: "You have reached your upload limit. Please upgrade to Premium for unlimited uploads.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(`Edge function failed: ${functionError.message || 'Unknown error'}`);
      }

      if (!functionData) {
        console.error('❌ No data returned from edge function');
        throw new Error('No data returned from processing function');
      }

      console.log('✅ Processing completed successfully:', {
        receiptsCount: functionData?.receipts?.length,
        hasMergedData: !!functionData?.mergedData,
        summary: functionData?.summary
      });
      
      setUploadProgress(100);
      setProcessedData(functionData.receipts);
      setMergedData(functionData.mergedData);
      
      const fileText = selectedFiles.length === 1 ? "file" : "files";
      toast({
        title: "Processing complete!",
        description: `Your ${selectedFiles.length} ${fileText} have been processed successfully.`,
      });

    } catch (error: any) {
      console.error('❌ File processing error:', {
        error: error,
        message: error.message,
        stack: error.stack,
        name: error.name,
        fileIds: fileIds || [],
        selectedFilesCount: selectedFiles.length
      });
      
      // Update failed file records
      if (fileIds && fileIds.length > 0) {
        console.log('🔄 Updating failed file records...');
        const { error: updateError } = await supabase
          .from('processed_files')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .in('id', fileIds);
        
        if (updateError) {
          console.error('❌ Error updating failed file records:', updateError);
        } else {
          console.log('✅ Failed file records updated');
        }
      }
      
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred while processing the files.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 File processing completed, resetting state');
      setIsProcessing(false);
      setUploadProgress(0);
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