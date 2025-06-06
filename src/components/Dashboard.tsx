
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image, FileText, Download, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/");
    toast({
      title: "Signed out successfully",
      description: "You have been logged out.",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File selected",
        description: `Selected: ${file.name}`,
      });
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File uploaded",
        description: `Uploaded: ${file.name}`,
      });
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      const mockData = {
        extractedText: "Sample extracted data from your receipt/document",
        items: [
          { description: "Product A", amount: 25.99, category: "Electronics" },
          { description: "Product B", amount: 15.50, category: "Office Supplies" },
          { description: "Tax", amount: 4.14, category: "Tax" }
        ],
        total: 45.63,
        merchant: "Sample Store",
        date: "2024-01-15"
      };
      
      setProcessedData(mockData);
      setIsProcessing(false);
      
      toast({
        title: "Processing complete!",
        description: "Your document has been successfully processed.",
      });
    }, 3000);
  };

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    if (!processedData) return;
    
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: `Your data is being exported in ${format.toUpperCase()} format.`,
    });
    
    // Here you would integrate with your backend logic
    console.log(`Exporting data as ${format}:`, processedData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} onSignOut={handleSignOut} />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convert Images & PDFs to Excel, CSV, or JSON
          </h1>
          <p className="text-gray-600">
            Upload your images or PDF files with table data and convert them to structured data formats.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Image & PDF Upload</h3>
              <p className="text-sm text-gray-600">
                Upload images (PNG, JPG, etc.) or PDF files containing table data for conversion.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">OCR Processing</h3>
              <p className="text-sm text-gray-600">
                Advanced OCR technology extracts table data from your images and PDFs automatically.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Export Formats</h3>
              <p className="text-sm text-gray-600">
                Export your processed data to Excel (.xlsx), CSV (.csv), or JSON (.json) formats.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
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
              onDrop={handleDrop}
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
                <p><strong>Documents:</strong> PDF (coming soon)</p>
                <p>Works best with clear, high-contrast table images</p>
              </div>
              
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
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
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={handleProcessFile}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Processing..." : "Process File"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {processedData && (
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
                        {processedData.items.map((item: any, index: number) => (
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
                  onClick={() => handleExport('excel')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
                <Button 
                  onClick={() => handleExport('csv')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
                <Button 
                  onClick={() => handleExport('json')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
