
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProcessedFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  merchant?: string;
  total?: string;
  itemCount?: number;
}

interface ProcessedFilesListProps {
  files: ProcessedFile[];
  onDownload: (fileId: string, format: 'excel' | 'csv' | 'json') => void;
}

const ProcessedFilesList = ({ files, onDownload }: ProcessedFilesListProps) => {
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
    <Card>
      <CardHeader>
        <CardTitle>Your Processed Files</CardTitle>
        <CardDescription>
          View and download your processed receipt data in various formats.
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{file.fileName}</span>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    file.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : file.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {file.status}
                  </span>
                </TableCell>
                <TableCell>
                  {file.status === 'completed' && (
                    <div className="flex space-x-1">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(file.id, 'json')}
                        className="h-8 px-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        JSON
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProcessedFilesList;
