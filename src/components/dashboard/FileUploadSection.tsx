import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Crown, Camera, ImagePlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FileUploadSectionProps {
  selectedFile: File | null;
  selectedFiles: File[];
  isProcessing: boolean;
  uploadProgress: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent) => void;
  onRemoveFile?: (index: number) => void;
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
  onRemoveFile,
  onProcessFile,
  userTier,
  fileCount,
}) => {
  const navigate = useNavigate();
  const [selectedForProcessing, setSelectedForProcessing] = React.useState<Set<number>>(new Set());

  const remainingFiles = userTier === "premium" ? "unlimited" : Math.max(0, 10 - fileCount);
  const MAX_PER_UPLOAD = 10;
  const wouldExceedLimit = userTier === "freemium" && fileCount + selectedFiles.length > 10;
  const tooManyAtOnce = selectedFiles.length > MAX_PER_UPLOAD;

  // Auto-select all files when selection changes
  React.useEffect(() => {
    const all = new Set<number>();
    selectedFiles.forEach((_, i) => all.add(i));
    setSelectedForProcessing(all);
  }, [selectedFiles]);

  const handleProcessWrapper = async () => {
    if (isProcessing) return;
    if (wouldExceedLimit || tooManyAtOnce) return;
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
            multiple
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
                  {selectedFiles.length ? "Take another photo" : "Take photo"}
                </span>
              </Button>
            </label>
            <label htmlFor="file-upload">
              <Button asChild size="lg" variant="outline" className="w-full h-14 text-base md:h-11 md:text-sm">
                <span>
                  <ImagePlus className="h-5 w-5 mr-2" />
                  <span className="md:hidden">{selectedFiles.length ? "Add from gallery" : "Choose from gallery"}</span>
                  <span className="hidden md:inline">{selectedFiles.length ? "Add more files" : "Select Files"}</span>
                </span>
              </Button>
            </label>
          </div>
          <p className="hidden md:block mt-3 text-xs text-gray-500">or drag and drop files here</p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-1">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} ready
            </p>
            <ul className="divide-y rounded-md border text-sm text-gray-700">
              {selectedFiles.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-2">
                  <span className="flex-1 truncate">📄 {f.name}</span>
                  {onRemoveFile && !isProcessing && (
                    <button
                      type="button"
                      onClick={() => onRemoveFile(i)}
                      className="p-2 -m-2 text-gray-400 hover:text-red-600"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {tooManyAtOnce && (
              <p className="mt-2 text-sm text-red-600">You can process up to {MAX_PER_UPLOAD} files at a time. Remove a few.</p>
            )}
            {!tooManyAtOnce && wouldExceedLimit && (
              <p className="mt-2 text-sm text-red-600">
                Your free plan has {remainingFiles} file{remainingFiles === 1 ? "" : "s"} left. Remove some files or{" "}
                <button type="button" className="underline" onClick={() => navigate("/pricing")}>upgrade to Premium</button>.
              </p>
            )}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleProcessWrapper}
              disabled={isProcessing || selectedForProcessing.size === 0 || wouldExceedLimit || tooManyAtOnce}
              className="w-full h-12 text-base"
            >
              {isProcessing
                ? "Processing..."
                : selectedFiles.length > 1
                  ? `Process ${selectedFiles.length} Files`
                  : "Process Files"}
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
