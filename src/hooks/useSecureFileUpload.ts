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
  const { user, session } = useAuth();

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

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Please select no more than ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }

    const invalid = files.filter((f) => !allowedTypes.includes(f.type) || f.size > maxSize);
    if (invalid.length > 0) {
      toast({
        title: "Invalid files",
        description: `${invalid.length} file(s) are invalid.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(files);
    setProcessedData(null);
    setMergedData(null);

    toast({
      title: "Files selected",
      description: files.map((f) => f.name).join(", "),
    });
  };

  const handleProcessFile = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to process files.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Select files to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = [];

      // Upload files to Supabase Storage
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const timestamp = Date.now();
        const ext = file.name.split(".").pop();
        const storagePath = `${user.id}/${timestamp}-${i}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const { data: dbRecord, error: dbErr } = await supabase
          .from("processed_files")
          .insert({
            user_id: user.id,
            file_name: storagePath,
            original_file_name: file.name,
            file_size: file.size,
            status: "processing",
          })
          .select()
          .single();

        if (dbErr) throw dbErr;

        uploadedFiles.push({
          id: dbRecord.id,
          fileName: storagePath,
        });

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 40));
      }

      // Call Edge Function
      const fileIds = uploadedFiles.map((f) => f.id);
      const fileNames = uploadedFiles.map((f) => f.fileName);

      const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
        "process-receipt",
        {
          body: JSON.stringify({ fileIds, fileNames }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabase.supabaseKey,
          },
        }
      );

      if (functionError) throw functionError;
      if (!functionResponse) throw new Error("No response from function");

      setUploadProgress(90);

      const { receipts, mergedData: merged } = functionResponse;

      setProcessedData(receipts);
      setMergedData(merged);
      setUploadProgress(100);

      toast({
        title: "Processing complete",
        description: `Processed ${receipts?.length || 0} files.`,
      });
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export files (Excel / CSV / JSON)
  const handleExport = async (format: "excel" | "csv" | "json", exportData: any) => {
    if (!exportData || !user) {
      toast({
        title: "Missing data",
        description: "Process your files before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("export-merged-data", {
        body: JSON.stringify({ mergedData: exportData, format, userId: user.id }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      let blob: Blob;
      if (format === "excel") {
        const byteChars = atob(data);
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      } else {
        blob = new Blob([format === "csv" ? data : JSON.stringify(data, null, 2)], {
          type: format === "csv" ? "text/csv" : "application/json",
        });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipts-${Date.now()}.${format === "excel" ? "xlsx" : format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export complete", description: "Download started." });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
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
