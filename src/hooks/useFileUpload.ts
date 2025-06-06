import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      setSelectedFile(file);
      setProcessedData(null);
      toast({
        title: "File uploaded",
        description: `Uploaded: ${file.name}`,
      });
    }
  };

  const handleProcessFile = async () => {
  if (!selectedFile) {
    toast({
      title: "No file selected",
      description: "Please select a file to process.",
      variant: "destructive",
    });
    return;
  }

  setIsProcessing(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append("files", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      setIsProcessing(false);
      console.log("COming Here");
      console.log("UPLOD RESPONSE:", xhr.responseText);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log("UPLOD RESPONSEL:",data);
        setProcessedData(data.receipts);
        toast({
          title: "Processing complete!",
          description: "Your file has been processed successfully.",
        });
      } else {
        toast({
          title: "Processing failed",
          description: `Server error: ${xhr.status}`,
          variant: "destructive",
        });
      }
    };

    xhr.onerror = () => {
      setIsProcessing(false);
      toast({
        title: "Processing failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      });
    };

    xhr.open("POST", "http://localhost:8000/upload");
    xhr.send(formData);
  } catch (error) {
    setIsProcessing(false);
    toast({
      title: "Processing failed",
      description: "An error occurred while processing the file.",
      variant: "destructive",
    });
  }
};

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    if (!processedData) return;

    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: `Your data is being exported in ${format.toUpperCase()} format.`,
    });

    // Implement export logic as needed
    if (format === "excel") {
      window.open("http://localhost:8000/download", "_blank");
    }
      // Add CSV/JSON export logic if needed
    if (format === "excel") {
    window.open("http://localhost:8000/download", "_blank");
    } else if (format === "csv") {
    window.open("http://localhost:8000/export/csv", "_blank");
    } else if (format === "json") {
    window.open("http://localhost:8000/export/json", "_blank");
  }
    else {
      toast({
        title: "Export failed",
        description: "Unsupported format selected.",
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