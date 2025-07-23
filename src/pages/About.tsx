import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  Users, 
  Zap, 
  Shield, 
  Award,
  Mail,
  MapPin,
  Globe
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { signOut } = useAuth();
    const { error } = await signOut();
    if (!error) {
      window.location.href = "/";
    }
  };

  const values = [
    {
      icon: <Target className="h-8 w-8 text-blue-600" />,
      title: "Accuracy First",
      description: "We prioritize precision in data extraction, ensuring your receipt information is captured correctly every time."
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Speed & Efficiency",
      description: "Our AI-powered platform processes receipts in seconds, not minutes, saving you valuable time."
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "Security & Privacy",
      description: "Your data is protected with enterprise-grade security. We never share your information with third parties."
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "User-Centric Design",
      description: "Every feature is designed with our users in mind, creating an intuitive and seamless experience."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Receipts Processed" },
    { number: "99.2%", label: "Accuracy Rate" },
    { number: "500+", label: "Happy Users" },
    { number: "24/7", label: "Support Available" }
  ];

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
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About SlickReceipts
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We're on a mission to eliminate manual data entry forever. Our AI-powered platform 
            transforms receipt processing from a tedious chore into an effortless, automated experience.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At SlickReceipts, we believe that technology should simplify your life, not complicate it. 
                We've built a platform that uses cutting-edge AI and OCR technology to extract, organize, 
                and analyze receipt data with unprecedented accuracy and speed.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Whether you're a small business owner tracking expenses, an accountant managing multiple 
                clients, or an individual organizing personal finances, SlickReceipts transforms the way 
                you handle receipt data.
              </p>
              <div className="flex items-center gap-4">
                <Award className="h-12 w-12 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Industry Leading Accuracy</h3>
                  <p className="text-gray-600">99.2% accuracy rate with continuous AI improvements</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Why Choose SlickReceipts?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Advanced AI-powered OCR technology</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Multiple export formats (Excel, CSV, JSON)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Secure cloud storage and processing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Bulk processing capabilities</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Expense analytics and insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Users Worldwide</h2>
            <p className="text-lg text-gray-600">
              Our platform delivers consistent results that users rely on every day
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do, from product development to customer support
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Powered by Advanced Technology</h2>
          <p className="text-lg text-gray-600 mb-12">
            Our platform combines multiple cutting-edge technologies to deliver the best possible results
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-gray-900 mb-2">AI & Machine Learning</h3>
              <p className="text-gray-600 text-sm">
                Advanced neural networks trained on millions of receipts for maximum accuracy
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-gray-900 mb-2">OCR Technology</h3>
              <p className="text-gray-600 text-sm">
                State-of-the-art optical character recognition for precise text extraction
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-gray-900 mb-2">Cloud Infrastructure</h3>
              <p className="text-gray-600 text-sm">
                Scalable, secure cloud processing with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Mail className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm">support@slickreceipts.com</p>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Website</h3>
              <p className="text-gray-600 text-sm">www.slickreceipts.com</p>
            </div>
            <div className="flex flex-col items-center">
              <MapPin className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-600 text-sm">Global Remote Team</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;