
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    fileName: string;
    originalFileName: string;
    status: string;
    merchant?: string;
    total?: string;
    itemCount?: number;
    createdAt: string;
    expiresAt?: string;
    processedData?: any;
  };
}

const FileViewerModal = ({ isOpen, onClose, file }: FileViewerModalProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isExpiringSoon = file.expiresAt && new Date(file.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const isExpired = file.expiresAt && new Date(file.expiresAt) < new Date();

  useEffect(() => {
    if (isOpen && file.fileName) {
      generateSignedUrl();
    }
  }, [isOpen, file.fileName]);

  const generateSignedUrl = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(file.fileName, 3600); // 1 hour expiry

      if (error) throw error;
      setFileUrl(data.signedUrl);
    } catch (error: any) {
      toast({
        title: "Error loading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async () => {
    if (!fileUrl) return;
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {file.originalFileName}
          </DialogTitle>
          <DialogDescription>
            View file details and processed data
          </DialogDescription>
        </DialogHeader>

        {/* Expiration Warning */}
        {file.expiresAt && (
          <div className={`p-4 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-2">
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${isExpired ? 'text-red-800' : isExpiringSoon ? 'text-yellow-800' : 'text-blue-800'}`}>
                {isExpired 
                  ? 'File has expired and will be deleted soon'
                  : `Expires ${formatDistanceToNow(new Date(file.expiresAt), { addSuffix: true })}`
                }
              </span>
            </div>
          </div>
        )}

        {/* File Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <Badge variant={file.status === 'completed' ? 'default' : file.status === 'processing' ? 'secondary' : 'destructive'}>
              {file.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Uploaded</p>
            <p className="text-sm">{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</p>
          </div>
          {file.merchant && (
            <div>
              <p className="text-sm font-medium text-gray-500">Merchant</p>
              <p className="text-sm">{file.merchant}</p>
            </div>
          )}
          {file.total && (
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-sm">${file.total}</p>
            </div>
          )}
        </div>

        {/* File Preview */}
        {!isExpired && fileUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">File Preview</h3>
            {file.originalFileName.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={fileUrl}
                className="w-full h-96 border rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <img
                src={fileUrl}
                alt={file.originalFileName}
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: '400px' }}
              />
            )}
          </div>
        )}

        {/* Processed Data */}
        {file.processedData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Processed Data</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(file.processedData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {!isExpired && (
            <Button onClick={downloadFile} disabled={isLoading || !fileUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download Original
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerModal;
