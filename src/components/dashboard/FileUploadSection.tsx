import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FileUploadSectionProps {
  selectedFile: File | null;
  selectedFiles: File[];
  isProcessing: boolean;
  uploadProgress: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent) => void;
  onProcessFile: (files: File[]) => Promise<void>;
  userTier: "freemium" | "premium";
  fileCount: number;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  selectedFiles,
  isProcessing,
  uploadProgress,
  onFileSelect,
  onDrop,
  onProcessFile,
  userTier,
  fileCount,
}) => {
  const navigate = useNavigate();
  const [selectedForProcessing, setSelectedForProcessing] = React.useState<Set<number>>(new Set());

  const remainingFiles = userTier === "premium" ? "unlimited" : Math.max(0, 10 - fileCount);
  const wouldExceedLimit = userTier === "freemium" && fileCount + selectedFiles.length > 10;

  // Auto-select all files when selection changes
  React.useEffect(() => {
    const all = new Set<number>();
    selectedFiles.forEach((_, i) => all.add(i));
    setSelectedForProcessing(all);
  }, [selectedFiles]);

  const handleProcessWrapper = async () => {
    if (isProcessing) return;
    if (wouldExceedLimit) return;
    if (selectedForProcessing.size === 0) return;

    const filesToProcess = selectedFiles.filter((_, i) =>
      selectedForProcessing.has(i)
    );

    if (!filesToProcess.length) return;

    console.log("🚀 Processing files:", filesToProcess);

    try {
      await onProcessFile(filesToProcess);
    } catch (err) {
      console.error("❌ Processing failed", err);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Files
          {userTier === "premium" && (
            <Badge className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Unlimited
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {userTier === "premium"
            ? "Upload unlimited images or PDFs."
            : `Upload images or PDFs. ${remainingFiles} files remaining.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <input
            id="file-upload"
            type="file"
            multiple={userTier === "premium"}
            accept="image/*,.pdf"
            onChange={onFileSelect}
            className="hidden"
          />

          <label htmlFor="file-upload">
            <Button asChild>
              <span>Select Files</span>
            </Button>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleProcessWrapper}
              disabled={isProcessing || selectedForProcessing.size === 0}
              className="w-full"
            >
              {isProcessing ? "Processing..." : "Process Files"}
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4">
            <Progress value={uploadProgress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
