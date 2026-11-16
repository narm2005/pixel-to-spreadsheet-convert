import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Crown, Camera, ImagePlus } from "lucide-react";
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
          className="border-2 border-dashed rounded-lg p-4 md:p-8 text-center hover:border-blue-400"
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
          {/* On phones this opens the camera directly */}
          <input
            id="camera-capture"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileSelect}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <label htmlFor="camera-capture" className="md:hidden">
              <Button asChild size="lg" className="w-full h-14 text-base">
                <span>
                  <Camera className="h-5 w-5 mr-2" />
                  Take photo
                </span>
              </Button>
            </label>
            <label htmlFor="file-upload">
              <Button asChild size="lg" variant="outline" className="w-full h-14 text-base md:h-11 md:text-sm">
                <span>
                  <ImagePlus className="h-5 w-5 mr-2" />
                  <span className="md:hidden">Choose from gallery</span>
                  <span className="hidden md:inline">Select Files</span>
                </span>
              </Button>
            </label>
          </div>
          <p className="hidden md:block mt-3 text-xs text-gray-500">or drag and drop files here</p>
        </div>

        {selectedFiles.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            {selectedFiles.map((f, i) => (
              <li key={i} className="truncate">📄 {f.name}</li>
            ))}
          </ul>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleProcessWrapper}
              disabled={isProcessing || selectedForProcessing.size === 0}
              className="w-full h-12 text-base"
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
