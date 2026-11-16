import { Link } from "react-router-dom";
import { BUSINESS } from "@/lib/business";

// Small footer with the policy links payment gateways and users look for.
const SiteFooter = () => (
  <footer className="border-t bg-gray-50">
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between md:px-6">
      <p>&copy; {new Date().getFullYear()} {BUSINESS.brand}</p>
      <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-gray-900">Terms of Service</Link>
        <Link to="/refunds" className="hover:text-gray-900">Refunds &amp; Cancellation</Link>
        <Link to="/contact" className="hover:text-gray-900">Contact Us</Link>
      </nav>
    </div>
  </footer>
);

export default SiteFooter;
