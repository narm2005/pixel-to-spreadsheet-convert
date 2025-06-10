
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, DollarSign, Eye, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import FileViewerModal from "./FileViewerModal";

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
  processedData?: any;
}

interface ProcessedFilesListProps {
  files: ProcessedFile[];
  onDownload: (fileId: string, format: 'excel' | 'csv' | 'json') => void;
}

const ProcessedFilesList = ({ files, onDownload }: ProcessedFilesListProps) => {
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openFileViewer = (file: ProcessedFile) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };

  const closeFileViewer = () => {
    setSelectedFile(null);
    setIsViewerOpen(false);
  };

  const getExpirationStatus = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (expirationDate < now) {
      return { type: 'expired', icon: AlertTriangle, color: 'text-red-600' };
    } else if (expirationDate < sevenDaysFromNow) {
      return { type: 'expiring', icon: Clock, color: 'text-yellow-600' };
    }
    return null;
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Processed Files</CardTitle>
          <CardDescription>
            Files you've uploaded and processed will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No files processed yet</p>
            <p className="text-sm text-gray-400">Upload a file above to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Processed Files</CardTitle>
          <CardDescription>
            View and download your processed receipt data. Freemium files expire after 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const expirationStatus = getExpirationStatus(file.expiresAt);
                const isExpired = file.expiresAt && new Date(file.expiresAt) < new Date();
                
                return (
                  <TableRow key={file.id} className={isExpired ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{file.originalFileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{file.merchant || '-'}</TableCell>
                    <TableCell>
                      {file.total ? (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{file.total}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{file.itemCount || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        file.status === 'completed' 
                          ? 'default'
                          : file.status === 'processing'
                          ? 'secondary'
                          : 'destructive'
                      }>
                        {file.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {file.expiresAt ? (
                        <div className="flex items-center space-x-1">
                          {expirationStatus && (
                            <expirationStatus.icon className={`h-3 w-3 ${expirationStatus.color}`} />
                          )}
                          <span className={`text-xs ${expirationStatus?.color || 'text-gray-500'}`}>
                            {isExpired 
                              ? 'Expired'
                              : formatDistanceToNow(new Date(file.expiresAt), { addSuffix: true })
                            }
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No expiry
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openFileViewer(file)}
                          className="h-8 px-2"
                          disabled={isExpired}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {file.status === 'completed' && !isExpired && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownload(file.id, 'excel')}
                              className="h-8 px-2"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Excel
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownload(file.id, 'csv')}
                              className="h-8 px-2"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              CSV
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedFile && (
        <FileViewerModal
          isOpen={isViewerOpen}
          onClose={closeFileViewer}
          file={{
            id: selectedFile.id,
            fileName: selectedFile.fileName,
            originalFileName: selectedFile.originalFileName,
            status: selectedFile.status,
            merchant: selectedFile.merchant,
            total: selectedFile.total,
            itemCount: selectedFile.itemCount,
            createdAt: selectedFile.uploadedAt,
            expiresAt: selectedFile.expiresAt,
            processedData: selectedFile.processedData,
          }}
        />
      )}
    </>
  );
};

export default ProcessedFilesList;
