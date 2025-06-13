
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertTriangle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FileUploadSectionProps {
  selectedFile: File | null;
  selectedFiles: File[];
  isProcessing: boolean;
  uploadProgress: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent) => void;
  onProcessFile: () => void;
  userTier: 'freemium' | 'premium';
  fileCount: number;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  selectedFile,
  selectedFiles,
  isProcessing,
  uploadProgress,
  onFileSelect,
  onDrop,
  onProcessFile,
  userTier,
  fileCount
}) => {
  const navigate = useNavigate();
  const remainingFiles = userTier === 'premium' ? 'unlimited' : Math.max(0, 10 - fileCount);
  const canUpload = userTier === 'premium' || fileCount < 10;
  const wouldExceedLimit = userTier === 'freemium' && (fileCount + selectedFiles.length) > 10;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload && !wouldExceedLimit) {
      onDrop(e);
    }
  };

  const handleFileSelectWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (canUpload) {
      onFileSelect(e);
    }
  };

  const handleProcessWrapper = () => {
    if (wouldExceedLimit) {
      return;
    }
    onProcessFile();
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Files
          {userTier === 'premium' && (
            <Badge className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Unlimited
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {userTier === 'premium' 
            ? "Upload unlimited images or PDF files with table data (supports bulk upload)."
            : `Upload images or PDF files with table data. ${remainingFiles} files remaining.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Usage Limit Warning */}
        {!canUpload && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Upload limit reached</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              You've used all 10 files in your free plan. Upgrade to Premium for unlimited uploads.
            </p>
            <Button 
              size="sm" 
              className="mt-2 bg-red-600 hover:bg-red-700"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Premium
            </Button>
          </div>
        )}

        {/* Bulk Upload Limit Warning */}
        {wouldExceedLimit && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Upload would exceed limit</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Uploading {selectedFiles.length} files would exceed your remaining {remainingFiles} file limit. Please reduce the number of files or upgrade to Premium.
            </p>
            <Button 
              size="sm" 
              className="mt-2 bg-orange-600 hover:bg-orange-700"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Premium
            </Button>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            canUpload && !wouldExceedLimit
              ? "border-gray-300 hover:border-blue-400 cursor-pointer"
              : "border-gray-200 bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileText className={`mx-auto h-12 w-12 mb-4 ${canUpload ? 'text-gray-400' : 'text-gray-300'}`} />
          {canUpload && !wouldExceedLimit ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userTier === 'premium' ? 'Drop files here or click to upload' : 'Drop your files here or click to upload'}
              </h3>
              <p className="text-gray-600 mb-4">
                {userTier === 'premium' 
                  ? 'Supports images (PNG, JPG, JPEG, GIF, BMP, WebP) and PDF files up to 10MB each. Upload multiple files at once!'
                  : 'Supports images (PNG, JPG, JPEG, GIF, BMP, WebP) and PDF files up to 10MB each.'
                }
              </p>
              <input
                type="file"
                multiple={userTier === 'premium'}
                accept="image/*,.pdf"
                onChange={handleFileSelectWrapper}
                className="hidden"
                id="file-upload"
                disabled={!canUpload}
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </>
          ) : (
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">File upload unavailable</h3>
              <p>Please upgrade to continue uploading files.</p>
            </div>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Selected Files ({selectedFiles.length}):
            </h4>
            <div className="space-y-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-4 flex gap-4">
            <Button 
              onClick={handleProcessWrapper} 
              disabled={isProcessing || wouldExceedLimit}
              className="flex-1"
            >
              {isProcessing ? "Processing..." : `Process ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Processing files...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
