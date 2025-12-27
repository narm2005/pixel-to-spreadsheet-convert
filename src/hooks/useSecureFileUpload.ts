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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${user.id}/${Date.now()}-${file.name}`;

      console.log(`🚀 Uploading ${i + 1}/${files.length}: ${file.name}`);

      const { data, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: false });

      if (uploadError) {
        console.error("❌ Storage upload error:", uploadError);
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue; // skip this file
      }
      console.log("✅ Upload successful:", path);

      const { data: dbData, error: dbError } = await supabase
      .from("processed_files")
      .insert({
        user_id: user.id,
        file_name: path,
        original_file_name: file.name,
        file_size: file.size,
        merchant: null,
        total: null,
        item_count: null,
        processed_data: null,
        confidence_score: null,
        status: "processing",
      })
      .select()
      .single();

      if (dbError) {
        console.error("❌ DB insert failed:", dbError);
      } else {
        console.log("✅ DB insert successful:", dbData.id);
      }
      uploaded.push({ id: data.id, fileName: path });

      const progress = 30 + Math.round(((i + 1) / files.length) * 30);
      setUploadProgress(progress);
    }

    const { data, error } = await supabase.functions.invoke("process-receipt", {
      body: {
        fileIds: uploaded.map(f => f.id),
        fileNames: uploaded.map(f => f.fileName),
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (!data) throw new Error("Empty Edge Function response");

    setProcessedData(data.receipts);
    setMergedData(data.mergedData);
    setUploadProgress(100);

    toast({ title: "Processing complete" });

  } catch (err: any) {
    console.error(err);
    toast({
      title: "Processing failed",
      description: err.message ?? "Unknown error",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};


  //     const { data, error } = await supabase.functions.invoke(
  //       "process-receipt",
  //       {
  //         body: {
  //           fileIds: uploaded.map((f) => f.id),
  //           fileNames: uploaded.map((f) => f.fileName),
  //         },
  //         headers: {
  //           Authorization: `Bearer ${session.access_token}`,
  //         },
  //       }
  //     );

  //     if (error) throw error;
  //     if (!data) throw new Error("Empty Edge Function response");

  //     setProcessedData(data.receipts);
  //     setMergedData(data.mergedData);
  //     setUploadProgress(100);

  //     toast({ title: "Processing complete" });
  //   } catch (err: any) {
  //     console.error(err);
  //     toast({
  //       title: "Processing failed",
  //       description: err.message ?? "Unknown error",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

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
