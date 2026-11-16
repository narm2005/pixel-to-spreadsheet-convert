import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppConfigProvider } from "@/hooks/useAppConfig";
import Admin from "./pages/Admin";
import Index from "./pages/Index";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Feedback from "./pages/Feedback";
import SecureSignIn from "./components/SecureSignIn";
import SecureDashboard from "./components/SecureDashboard";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import Demo from "./pages/Demo";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Refunds from "./pages/legal/Refunds";
import Contact from "./pages/legal/Contact";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppConfigProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/signin" element={<SecureSignIn />} />
            <Route path="/dashboard" element={<SecureDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AppConfigProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;