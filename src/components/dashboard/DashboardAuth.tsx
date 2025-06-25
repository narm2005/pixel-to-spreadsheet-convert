import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import DashboardLoader from './DashboardLoader';

interface DashboardAuthProps {
  children: React.ReactNode;
}

const DashboardAuth: React.FC<DashboardAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!loading && !user) {
      console.log('No authenticated user, redirecting to sign in');
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  // Show loading while auth state is being determined
  if (loading) {
    return <DashboardLoader />;
  }

  // Show nothing while redirecting
  if (!user) {
    return <DashboardLoader />;
  }

  // User is authenticated, show the dashboard
  return <>{children}</>;
};

export default DashboardAuth;