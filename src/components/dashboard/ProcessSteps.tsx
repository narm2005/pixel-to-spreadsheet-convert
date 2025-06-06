
import { Card, CardContent } from "@/components/ui/card";
import { Image, Database, Download } from "lucide-react";

const ProcessSteps = () => {
  return (
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
  );
};

export default ProcessSteps;
