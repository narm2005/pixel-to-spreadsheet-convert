import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Database, User, LogOut } from "lucide-react";

interface NavbarProps {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}

// Helper to get initials from name or email
function getInitials(user: { name?: string; email?: string }) {
  if (user.name) {
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (user.email) return user.email[0]?.toUpperCase();
  return "U";
}

const Navbar = ({ isAuthenticated = false, onSignOut }: NavbarProps) => {
  const location = useLocation();

  // Get user info from localStorage if authenticated
  let user: { name?: string; picture?: string } = {};
  if (isAuthenticated) {
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
  }

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
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-sm uppercase">
                    {getInitials(user)}
                  </span>
                )}
                <span>{user.name || "User"}</span>
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