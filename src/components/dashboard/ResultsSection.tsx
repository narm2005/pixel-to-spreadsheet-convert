
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";

interface ResultsSectionProps {
  processedData: any;
  mergedData?: any;
  onExport: (format: 'excel' | 'csv' | 'json') => void;
}

const ResultsSection = ({ processedData, mergedData, onExport }: ResultsSectionProps) => {
  console.log("ResultsSection processedData:", processedData);
  console.log("ResultsSection mergedData:", mergedData);

  if (!processedData) return null;

  const isMultipleFiles = Array.isArray(processedData) && processedData.length > 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Processing Results
            {isMultipleFiles && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {processedData.length} files processed
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {isMultipleFiles 
              ? "Multiple files have been processed and merged. Export the combined data in your preferred format."
              : "Your document has been processed. Export the data in your preferred format."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mergedData && isMultipleFiles ? (
            // Show merged data summary for multiple files
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Merged Data Summary:</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{mergedData.summary.totalFiles}</div>
                    <div className="text-xs text-gray-600">Files Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${mergedData.summary.totalAmount}</div>
                    <div className="text-xs text-gray-600">Total Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{mergedData.summary.totalItems}</div>
                    <div className="text-xs text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-900">Processed</div>
                    <div className="text-xs text-gray-600">{new Date(mergedData.summary.processedAt).toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <h5 className="font-medium mb-2">Combined Items Preview (first 10):</h5>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">#</th>
                        <th className="text-left py-2">Merchant</th>
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-left py-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergedData.combinedItems.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.receiptNumber}</td>
                          <td className="py-2">{item.merchant}</td>
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">${item.amount}</td>
                          <td className="py-2">{item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mergedData.combinedItems.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... and {mergedData.combinedItems.length - 10} more items
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Show single file data preview
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Extracted Data Preview:</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {Array.isArray(processedData) && processedData.length > 0 ? (
                  <>
                    <p className="text-sm mb-2"><strong>Merchant:</strong> {processedData[0].merchant}</p>
                    <p className="text-sm mb-2"><strong>Date:</strong> {processedData[0].date || "-"}</p>
                    <p className="text-sm mb-4"><strong>Total:</strong> ${processedData[0].total}</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-left py-2">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedData[0].items?.map((item: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{item.description}</td>
                              <td className="text-right py-2">${item.amount}</td>
                              <td className="py-2">{item.category || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p>No receipt data found.</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => onExport('excel')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button 
              onClick={() => onExport('csv')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
            <Button 
              onClick={() => onExport('json')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to JSON
            </Button>
          </div>
          
          {isMultipleFiles && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The exported file contains merged data from all {processedData.length} processed files with a summary section.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsSection;
