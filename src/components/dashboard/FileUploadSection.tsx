
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Image, FileText } from "lucide-react";

interface FileUploadSectionProps {
  selectedFile: File | null;
  isProcessing: boolean;
  uploadProgress: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent) => void;
  onProcessFile: () => void;
}

const FileUploadSection = ({
  selectedFile,
  isProcessing,
  uploadProgress,
  onFileSelect,
  onDrop,
  onProcessFile
}: FileUploadSectionProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Upload Your Image or PDF</CardTitle>
        <CardDescription>
          Convert images and PDFs with table data into structured Excel, CSV, or JSON files.
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
            Drop your image or PDF here
          </h3>
          <p className="text-gray-600 mb-4">
            Upload an image or PDF with table data to convert to Excel, CSV, or JSON
          </p>
          
          <div className="text-sm text-gray-500 mb-4">
            <p><strong>Images:</strong> PNG, JPG, JPEG, GIF, BMP, WebP</p>
            <p><strong>Documents:</strong> PDF</p>
            <p>Works best with clear, high-contrast table images</p>
          </div>
          
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={onFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <label htmlFor="file-upload">
            <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" disabled={isProcessing}>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </label>
          
          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Selected: {selectedFile.name}
              </p>
              <p className="text-xs text-blue-600">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
        
        {selectedFile && (
          <div className="mt-6 space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
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
                {isProcessing ? "Processing..." : "Process File"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
