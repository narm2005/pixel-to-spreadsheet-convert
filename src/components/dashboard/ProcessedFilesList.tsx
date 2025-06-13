
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, DollarSign, Package, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ProcessedFile {
  id: string;
  fileName: string;
  originalFileName: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  merchant?: string;
  total?: string;
  itemCount?: number;
  expiresAt?: string;
  category?: string;
  confidenceScore?: number;
}

interface ProcessedFilesListProps {
  files: ProcessedFile[];
  onDownload: (fileId: string, format: 'excel' | 'csv' | 'json') => Promise<void>;
  userTier: 'freemium' | 'premium';
}

const ProcessedFilesList: React.FC<ProcessedFilesListProps> = ({ 
  files, 
  onDownload,
  userTier 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExportOptions = () => {
    if (userTier === 'premium') {
      return [
        { format: 'excel' as const, label: 'Excel (.xlsx)' },
        { format: 'csv' as const, label: 'CSV' },
        { format: 'json' as const, label: 'JSON' }
      ];
    }
    return [{ format: 'csv' as const, label: 'CSV' }];
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Processed Files
          </CardTitle>
          <CardDescription>
            Files you've uploaded and processed will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files processed yet</p>
            <p className="text-sm">Upload your first receipt or document to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your Processed Files ({files.length})
        </CardTitle>
        <CardDescription>
          Download and manage your processed documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files.map((file) => (
            <div key={file.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium truncate">{file.originalFileName}</h3>
                    <Badge className={getStatusColor(file.status)}>
                      {file.status}
                    </Badge>
                    {file.category && (
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
                    </div>
                    {file.merchant && (
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {file.merchant}
                      </div>
                    )}
                    {file.total && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${file.total}
                      </div>
                    )}
                    {file.itemCount && (
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {file.itemCount} items
                      </div>
                    )}
                  </div>

                  {file.expiresAt && userTier === 'freemium' && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
                      <AlertCircle className="h-3 w-3" />
                      Expires: {format(new Date(file.expiresAt), 'MMM d, yyyy')}
                    </div>
                  )}

                  {file.confidenceScore && (
                    <div className="text-xs text-gray-500">
                      Confidence: {(file.confidenceScore * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                {file.status === 'completed' && (
                  <div className="flex gap-2 ml-4">
                    {getExportOptions().map(({ format, label }) => (
                      <Button
                        key={format}
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(file.id, format)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessedFilesList;
