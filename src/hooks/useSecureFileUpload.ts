import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { shrinkImage } from "@/lib/shrinkImage";
import { useAuth } from "./useAuth";

export const useSecureFileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any>(null);
  const [mergedData, setMergedData] = useState<any>(null);

  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  const selectedFile = selectedFiles[0] ?? null;

  // New picks are added to the list (so you can take several photos one after another).
  const addFiles = (files: File[]) => {
    if (!files.length) return;
    setSelectedFiles((prev) => {
      const key = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
      const seen = new Set(prev.map(key));
      return [...prev, ...files.filter((f) => !seen.has(key(f)))];
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = ""; // lets the same camera/gallery button be used again
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeFile = (index: number) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleProcessFile = async (files: File[]) => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to process files.", variant: "destructive" });
      return;
    }
    if (!files || files.length === 0) {
      toast({ title: "No files selected", description: "Please select files to process.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(20);
    // Reading a receipt takes a few seconds; creep the bar so it doesn't look stuck.
    const timer = setInterval(() => setUploadProgress((p) => (p < 90 ? p + 5 : p)), 800);

    try {
      const ready = await Promise.all(files.map(shrinkImage));
      const form = new FormData();
      ready.forEach((f) => form.append("files", f, f.name));
      const data = await api.upload("/receipts", form);

      setProcessedData(data.receipts);
      setMergedData(data.mergedData);
      setUploadProgress(100);

      for (const f of data.failed ?? []) {
        toast({ title: `Could not read ${f.fileName}`, description: f.error, variant: "destructive" });
      }
      toast({
        title: "Processing complete!",
        description: `Successfully processed ${data.receipts?.length || 0} file(s).`,
      });
      setSelectedFiles([]);
      refreshUser();
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error?.message || "An unexpected error occurred during processing.",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      clearInterval(timer);
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
    removeFile,
  };
};
