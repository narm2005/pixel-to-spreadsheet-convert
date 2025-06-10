import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useSecureFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image (PNG, JPG, JPEG, GIF, BMP, WebP) or PDF file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setProcessedData(null);
      toast({
        title: "File selected",
        description: `Selected: ${file.name}`,
      });
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Validate file directly instead of creating synthetic event
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image (PNG, JPG, JPEG, GIF, BMP, WebP) or PDF file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setProcessedData(null);
      toast({
        title: "File selected",
        description: `Selected: ${file.name}`,
      });
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !user) {
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
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload without onUploadProgress callback since it's not supported
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(50); // Manual progress update

      // Create database record - the trigger will automatically set expiration
      const { data: fileRecord, error: dbError } = await supabase
        .from('processed_files')
        .insert({
          user_id: user.id,
          file_name: fileName,
          original_file_name: selectedFile.name,
          file_size: selectedFile.size,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setUploadProgress(75);

      // Call Edge Function for processing
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('process-receipt', {
          body: { 
            fileId: fileRecord.id,
            fileName: fileName 
          }
        });

      if (functionError) {
        throw functionError;
      }

      setUploadProgress(100);
      setProcessedData(functionData.receipts);
      
      toast({
        title: "Processing complete!",
        description: "Your file has been processed successfully.",
      });

    } catch (error: any) {
      console.error('File processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    if (!processedData || !user) return;

    try {
      const { data, error } = await supabase.functions
        .invoke('export-data', {
          body: { 
            data: processedData,
            format,
            userId: user.id
          }
        });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data.content], { 
        type: data.contentType 
      });
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
    isProcessing,
    uploadProgress,
    processedData,
    handleFileSelect,
    handleDrop,
    handleProcessFile,
    handleExport,
  };
};
