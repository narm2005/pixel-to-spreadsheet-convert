// useSecureFileUpload.ts
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSecureFileUpload = () => {
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any>(null);
  const [mergedData, setMergedData] = useState<any>(null);

  /** -----------------------------------------------
   * Select single file
   * ----------------------------------------------- */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  /** -----------------------------------------------
   * Handle drop (multiple files)
   * ----------------------------------------------- */
  const handleDrop = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
  };

  /** -----------------------------------------------
   * Process a single file
   * - Uploads to Supabase Storage
   * - Calls backend to process (OCR)
   * - Stores processed data
   * - Calls optional callback to refresh dashboard
   * ----------------------------------------------- */
  const handleProcessFile = useCallback(async (
    file: File,
    onSuccess?: () => void
  ) => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to Supabase Storage
      const filePath = `uploads/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('receipt-uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from('receipt-uploads').getPublicUrl(filePath).data.publicUrl;

      console.log("File uploaded:", publicUrl);

      setUploadProgress(50);

      // Step 2: Insert record in 'processed_files' table (status=processing)
      const { data: dbData, error: dbError } = await supabase
        .from('processed_files')
        .insert({
          file_name: file.name,
          original_file_name: file.name,
          user_id: supabase.auth.getUser().data.user?.id || null,
          status: 'processing',
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const fileId = dbData.id;

      // Step 3: Call backend API or RPC to process file (OCR/DeepSeek)
      // For demonstration, we mock processing
      const mockProcessedData = {
        fileName: file.name,
        merchant: "Demo Merchant",
        total: "123.45",
        date: new Date().toISOString(),
        items: [
          { description: "Item 1", amount: "45.00", category: "Category A" },
          { description: "Item 2", amount: "78.45", category: "Category B" },
        ],
      };

      setUploadProgress(80);

      // Step 4: Update processed_files row with processed data
      const { error: updateError } = await supabase
        .from('processed_files')
        .update({ processed_data: mockProcessedData, status: 'completed' })
        .eq('id', fileId);

      if (updateError) throw updateError;

      setProcessedData(mockProcessedData);

      // Merge data for advanced exports
      setMergedData((prev: any) => {
        const combinedItems = prev?.combinedItems ? [...prev.combinedItems, ...mockProcessedData.items] : [...mockProcessedData.items];
        return {
          summary: {
            totalFiles: (prev?.summary?.totalFiles || 0) + 1,
            totalAmount: (prev?.summary?.totalAmount || 0) + parseFloat(mockProcessedData.total),
            totalItems: (prev?.summary?.totalItems || 0) + mockProcessedData.items.length,
            processedAt: new Date().toISOString(),
          },
          combinedItems
        };
      });

      setUploadProgress(100);
      toast({ title: "File processed successfully" });

      if (onSuccess) onSuccess(); // refresh dashboard

    } catch (err: any) {
      console.error("Error processing file:", err);
      toast({
        title: "File processing failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [toast]);

  /** -----------------------------------------------
   * Handle export (CSV / Excel / JSON)
   * ----------------------------------------------- */
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'json', data: any) => {
    try {
      // TODO: implement export logic (e.g., SheetJS)
      console.log(`Exporting as ${format}:`, data);
      toast({ title: `Export ${format.toUpperCase()} ready!` });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    }
  }, [toast]);

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
