
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

interface ResultsSectionProps {
  processedData: any;
  onExport: (format: 'excel' | 'csv' | 'json') => void;
}

const ResultsSection = ({ processedData, onExport }: ResultsSectionProps) => {
  if (!processedData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Results</CardTitle>
        <CardDescription>
          Your document has been processed. Export the data in your preferred format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Extracted Data Preview:</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm mb-2"><strong>Merchant:</strong> {processedData.merchant}</p>
            <p className="text-sm mb-2"><strong>Date:</strong> {processedData.date}</p>
            <p className="text-sm mb-4"><strong>Total:</strong> ${processedData.total}</p>
            
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
                  {processedData.items?.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right py-2">${item.amount}</td>
                      <td className="py-2">{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
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
      </CardContent>
    </Card>
  );
};

export default ResultsSection;
