
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, Code, Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ResultsSectionProps {
  processedData: any;
  mergedData?: any;
  onExport: (format: 'excel' | 'csv' | 'json') => void;
  userTier: 'freemium' | 'premium';
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  processedData,
  mergedData,
  onExport,
  userTier
}) => {
  const navigate = useNavigate();

  if (!processedData) return null;

  const isMultipleFiles = Array.isArray(processedData) && processedData.length > 1;
  const displayData = isMultipleFiles ? mergedData : processedData;

  const exportOptions = [
    {
      format: 'csv' as const,
      label: 'CSV',
      icon: <FileText className="h-4 w-4" />,
      description: 'Comma-separated values',
      premium: false
    },
    {
      format: 'excel' as const,
      label: 'Excel',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      description: 'Microsoft Excel format',
      premium: true
    },
    {
      format: 'json' as const,
      label: 'JSON',
      icon: <Code className="h-4 w-4" />,
      description: 'JavaScript Object Notation',
      premium: true
    }
  ];

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    const option = exportOptions.find(opt => opt.format === format);
    if (option?.premium && userTier === 'freemium') {
      navigate('/pricing');
      return;
    }
    onExport(format);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Processing Results
              {isMultipleFiles && (
                <Badge variant="secondary">
                  {processedData.length} files merged
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isMultipleFiles 
                ? 'Your files have been processed and merged into a single dataset.'
                : 'Your file has been processed successfully.'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayData && (
          <div className="space-y-4">
            {/* Data Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Preview:</h4>
              <div className="space-y-2 text-sm">
                {isMultipleFiles ? (
                  <div>
                    <p><strong>Total Items:</strong> {displayData.items?.length || 0}</p>
                    <p><strong>Total Amount:</strong> ${displayData.totalAmount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Files Processed:</strong> {processedData.length}</p>
                  </div>
                ) : (
                  <div>
                    <p><strong>Merchant:</strong> {displayData.merchant || 'Unknown'}</p>
                    <p><strong>Total:</strong> ${displayData.total || '0.00'}</p>
                    <p><strong>Items:</strong> {displayData.items?.length || 0}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Export Options:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exportOptions.map((option) => (
                  <div key={option.format} className="relative">
                    <Button
                      variant="outline"
                      className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${
                        option.premium && userTier === 'freemium' 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleExport(option.format)}
                      disabled={option.premium && userTier === 'freemium' && false}
                    >
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                        {option.premium && userTier === 'freemium' && (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{option.description}</span>
                      {option.premium && userTier === 'freemium' && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Crown className="h-2 w-2" />
                          Premium
                        </Badge>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {userTier === 'freemium' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">Upgrade for More Export Options</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Get access to Excel and JSON export formats, plus advanced features like merged data from multiple files.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/pricing')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsSection;
