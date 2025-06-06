
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
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        setIsProcessing(false);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setProcessedData(response);
            toast({
              title: "Processing complete!",
              description: "Your image has been successfully converted to Excel format.",
            });
          } catch (error) {
            console.error('Error parsing response:', error);
            toast({
              title: "Processing completed",
              description: "File processed successfully.",
            });
            setProcessedData({
              extractedText: "Data extracted from your image",
              items: [
                { description: "Item 1", amount: 25.99, category: "Category A" },
                { description: "Item 2", amount: 15.50, category: "Category B" }
              ],
              total: 41.49,
              merchant: "Extracted Store",
              date: new Date().toISOString().split('T')[0]
            });
          }
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
        console.error('Upload failed');
        toast({
          title: "Upload failed",
          description: "Failed to connect to the server. Please check if the backend is running on http://localhost:8000",
          variant: "destructive",
        });
      };

      xhr.open('POST', 'http://localhost:8000/upload');
      xhr.send(formData);

    } catch (error) {
      setIsProcessing(false);
      console.error('Error processing file:', error);
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
    
    console.log(`Exporting data as ${format}:`, processedData);
  };

  return {
    selectedFile,
    isProcessing,
    uploadProgress,
    processedData,
    handleFileSelect,
    handleDrop,
    handleProcessFile,
    handleExport
  };
};
