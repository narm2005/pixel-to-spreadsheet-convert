
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Image, FileText, X } from "lucide-react";

interface FileUploadSectionProps {
  selectedFile: File | null;
  selectedFiles?: File[];
  isProcessing: boolean;
  uploadProgress: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent) => void;
  onProcessFile: () => void;
}

const FileUploadSection = ({
  selectedFile,
  selectedFiles = [],
  isProcessing,
  uploadProgress,
  onFileSelect,
  onDrop,
  onProcessFile,
}: FileUploadSectionProps) => {
  const filesToDisplay = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Upload Your Images or PDFs</CardTitle>
        <CardDescription>
          Convert images and PDFs with table data into structured Excel, CSV, or JSON files. 
          You can upload multiple files at once for bulk processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex justify-center space-x-4 mb-4">
            <Image className="h-12 w-12 text-gray-400" />
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop your files here or click to select
          </h3>
          <p className="text-gray-600 mb-4">
            Upload one or multiple images/PDFs with table data to convert to Excel, CSV, or JSON
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p><strong>Images:</strong> PNG, JPG, JPEG, GIF, BMP, WebP</p>
            <p><strong>Documents:</strong> PDF</p>
            <p><strong>Bulk Upload:</strong> Select up to 10 files at once</p>
            <p>Works best with clear, high-contrast table images</p>
          </div>
          <input
           type="file"
           accept="image/*,.pdf"
           onChange={onFileSelect}
           style={{ display: "none" }}
            id="file-upload"
           disabled={isProcessing}
           multiple
          />
          <label htmlFor="file-upload">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 cursor-pointer" disabled={isProcessing}>
              <span>
                 <Upload className="h-4 w-4 mr-2" />
                  Choose Files
               </span>
            </Button>
          </label>
          
          {filesToDisplay.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-gray-900">
                Selected Files ({filesToDisplay.length}):
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {filesToDisplay.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">{file.name}</span>
                      <span className="text-blue-600">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                Total size: {(filesToDisplay.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}
        </div>
        
        {filesToDisplay.length > 0 && (
          <div className="mt-6 space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Processing {filesToDisplay.length} file(s)...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
            <div className="flex justify-center">
              <Button
                onClick={onProcessFile}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Processing..." : `Process ${filesToDisplay.length} File${filesToDisplay.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
