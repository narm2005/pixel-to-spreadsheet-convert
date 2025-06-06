
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Database, User, LogOut } from "lucide-react";

interface NavbarProps {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}

const Navbar = ({ isAuthenticated = false, onSignOut }: NavbarProps) => {
  const location = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Database className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">SlickReceipts.com</span>
        </Link>
        
        {!isAuthenticated && location.pathname === "/" && (
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
            <span className="text-gray-600">Pricing</span>
            <span className="text-gray-600">Testimonials</span>
            <span className="text-gray-600">Contact</span>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>Demo User</span>
              </div>
              <Button variant="outline" onClick={onSignOut} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </>
          ) : (
            <Link to="/signin">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
