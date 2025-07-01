import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Eye, 
  Settings, 
  FileSpreadsheet, 
  Smartphone, 
  Cloud, 
  BarChart3,
  Upload,
  Brain,
  Edit,
  Download,
  AlertTriangle,
  Shield,
  FileText,
  Scale
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";



const Index = () => {
  const { user, signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        isAuthenticated={!!user}
        user={user ? {
          name: user.user_metadata?.name || user.email,
          picture: user.user_metadata?.picture
        } : undefined}
        onSignOut={handleSignOut}
      />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+Cjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Transform Your Receipts<br />
            into <span className="text-blue-400">Actionable Data</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            SlickReceipts.com uses advanced AI to extract, organize, and analyze 
            your receipt data. Say goodbye to manual data entry forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link to="/signin">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                    Try It Free
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900">
                  View Demo
                </Button>
              </>
            ) : (
              <Link to="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform transforms messy receipts into structured, actionable data
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered OCR</h3>
                <p className="text-gray-600">
                  Advanced optical character recognition extracts text from any receipt with 99% accuracy.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Settings className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Data Extraction</h3>
                <p className="text-gray-600">
                  Automatically identifies merchants, dates, line items, taxes, and totals.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileSpreadsheet className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Export to Excel</h3>
                <p className="text-gray-600">
                  One-click export to Excel, CSV, or Google Sheets for further analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Transforming your receipts into structured data is simple and efficient
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <div className="mb-4">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Receipts</h3>
              <p className="text-gray-600">
                Take a photo or upload receipt images in any format (JPG, PNG, PDF).
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <div className="mb-4">
                <Brain className="h-12 w-12 text-green-600 mx-auto mb-2" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Processing</h3>
              <p className="text-gray-600">
                Our AI extracts text, identifies key data points, and categorizes expenses.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <div className="mb-4">
                <Edit className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Review & Edit</h3>
              <p className="text-gray-600">
                Verify the extracted data with our intuitive interface and make adjustments.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                4
              </div>
              <div className="mb-4">
                <Download className="h-12 w-12 text-orange-600 mx-auto mb-2" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Export & Analyze</h3>
              <p className="text-gray-600">
                Export to Excel or integrate with your accounting software for further analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-gray-600" />
              <h2 className="text-3xl font-bold text-gray-900">Important Disclaimer</h2>
            </div>
            <p className="text-lg text-gray-600">
              Please read and understand these important terms before using our service
            </p>
          </div>

          <Card className="border-2 border-gray-200 shadow-lg">
            <CardContent className="p-8">
              <div className="prose prose-gray max-w-none">
                <div className="flex items-start gap-3 mb-6">
                  <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Disclaimer</h3>
                    <p className="text-gray-700 mb-4">
                      SlickReceipts.com is a micro-SaaS tool designed to extract and convert information from receipts using AI and OCR technologies. While we aim to provide accurate and efficient results, the service is provided "as is" and "as available," without warranties of any kind.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Data Accuracy</h4>
                      <p className="text-gray-700 text-sm">
                        The receipt data extracted and processed by our platform may not always be accurate or complete. It is the user's responsibility to verify the extracted information before relying on it for financial, business, or record-keeping purposes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">No Financial Advice</h4>
                      <p className="text-gray-700 text-sm">
                        We do not provide financial, tax, or accounting advice, and any insights generated should not be treated as such.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Cloud className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Third-Party Services</h4>
                      <p className="text-gray-700 text-sm">
                        The platform may utilize third-party services (such as OCR, AI APIs, and cloud storage) to perform certain tasks. We are not liable for the availability, performance, or output of these external services.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Data Privacy & Security</h4>
                      <p className="text-gray-700 text-sm">
                        Receipt data may contain personal and financial information. While we take reasonable measures to protect your data, users are responsible for ensuring compliance with applicable privacy laws and regulations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h4>
                      <p className="text-gray-700 text-sm">
                        We are not liable for any loss, damage, or legal liability arising from the use or misuse of the data or services provided.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    <strong>By using this service, you acknowledge and agree to the above terms.</strong> Use of this service implies acceptance of this disclaimer, as well as our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              For questions about this disclaimer or our terms, please{" "}
              <Link to="/feedback" className="text-blue-600 hover:text-blue-700 underline">
                contact our support team
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Receipts?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using SlickReceipts to streamline their expense management.
          </p>
          {!user ? (
            <Link to="/signin">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Get Started Free
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">SlickReceipts.com</h3>
              <p className="text-gray-400 mb-4">
                Transform your receipts into actionable data with AI-powered OCR technology.
              </p>
              <p className="text-sm text-gray-500">
                Making expense management effortless for businesses and individuals worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/feedback" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/feedback" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/feedback" className="hover:text-white transition-colors">Contact Support</Link></li>
                <li><a href="mailto:support@slickreceipts.com" className="hover:text-white transition-colors">Email Support</a></li>
                <li><Link to="/feedback" className="hover:text-white transition-colors">Feature Requests</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 SlickReceipts.com. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms
              </a>
              <Link to="/feedback" className="text-gray-400 hover:text-white transition-colors text-sm">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;