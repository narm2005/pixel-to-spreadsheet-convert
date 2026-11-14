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

  const selectedFile = selectedFiles[0] ?? null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(e.target.files ?? []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSelectedFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const handleProcessFile = async (files: File[]) => {
    if (!user || !session) {
      toast({ title: "Please sign in", description: "Sign in to process files.", variant: "destructive" });
      return;
    }

    if (!files || files.length === 0) {
      toast({ title: "No files selected", description: "Please select files to process.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(5);

    try {
      // Step 1: upload each file to the user's own folder and create its record (0-40%).
      const uploaded: { id: string; fileName: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
        if (uploadError) {
          toast({ title: "Upload failed", description: `${file.name}: ${uploadError.message}`, variant: "destructive" });
          continue;
        }

        const { data: dbRecord, error: dbError } = await supabase
          .from("processed_files")
          .insert({
            user_id: user.id,
            file_name: path,
            original_file_name: file.name,
            file_size: file.size,
            status: "processing",
          })
          .select()
          .single();

        if (dbError) {
          await supabase.storage.from("receipts").remove([path]);
          toast({ title: "Upload failed", description: `${file.name}: ${dbError.message}`, variant: "destructive" });
          continue;
        }

        uploaded.push({ id: dbRecord.id, fileName: path });
        setUploadProgress(5 + Math.round(((i + 1) / files.length) * 35));
      }

      if (uploaded.length === 0) {
        throw new Error("No files could be uploaded.");
      }

      // Step 2: process via the edge function (40-100%).
      setUploadProgress(50);
      const { data, error } = await supabase.functions.invoke("process-receipt", {
        body: {
          fileIds: uploaded.map((f) => f.id),
          fileNames: uploaded.map((f) => f.fileName),
        },
      });

      if (error) throw error;
      if (!data) throw new Error("No response from processing service");

      setProcessedData(data.receipts);
      setMergedData(data.mergedData);
      setUploadProgress(100);

      toast({
        title: "Processing complete!",
        description: `Successfully processed ${data.receipts?.length || 0} file(s).`,
      });

      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error?.message || "An unexpected error occurred during processing.",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
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
