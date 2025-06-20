
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
    handleFilesValidation(files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    handleFilesValidation(files);
  };

  const handleFilesValidation = (files: File[]) => {
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10; // Maximum files per upload

    if (files.length > maxFiles) {
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
    if (selectedFiles.length === 0 || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to process files.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const fileIds = [];
      const fileNames = [];

      // Upload all files first
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Create database record
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
          throw new Error(`Failed to create file record for ${file.name}`);
        }

        fileIds.push(fileRecord.id);
        fileNames.push(fileName);

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 50);
      }

      console.log('All files uploaded, starting processing...');
      setUploadProgress(60);

      // Call Edge Function for processing (bulk)
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('process-receipt', {
          body: { 
            fileIds: fileIds,
            fileNames: fileNames
          }
        });

      if (functionError) {
        // Check if it's a usage limit error
        if (functionError.message?.includes('USAGE_LIMIT_EXCEEDED')) {
          const errorData = JSON.parse(functionError.message);
          toast({
            title: "Usage Limit Reached",
            description: errorData.message,
            variant: "destructive",
          });
          return;
        }
        throw functionError;
      }

      setUploadProgress(100);
      setProcessedData(functionData.receipts);
      setMergedData(functionData.mergedData);
      
      const fileText = selectedFiles.length === 1 ? "file" : "files";
      toast({
        title: "Processing complete!",
        description: `Your ${selectedFiles.length} ${fileText} have been processed successfully.`,
      });

    } catch (error: any) {
      console.error('File processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred while processing the files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'json', exportData: any) => {
    if (!exportData || !user) {
      toast({
        title: "Missing data",
        description: "Please process your files before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('export-merged-data', {
        body: {
          mergedData: exportData,
          format,
          userId: user.id
        }
      });

      if (error) throw error;

      const blob = new Blob([data.content], { type: data.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: `Exported as ${format.toUpperCase()}`,
        description: `Your data has been exported successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "An error occurred while exporting.",
        variant: "destructive",
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
