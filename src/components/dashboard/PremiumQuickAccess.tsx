
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface PremiumQuickAccessProps {
  userTier: 'freemium' | 'premium';
}

const PremiumQuickAccess: React.FC<PremiumQuickAccessProps> = ({ userTier }) => {
  const navigate = useNavigate();

  if (userTier !== 'premium') {
    return null;
  }

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/analytics')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            View spending insights and category breakdowns
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumQuickAccess;
