
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardHeaderProps {
  userTier: 'freemium' | 'premium';
  fileCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userTier, fileCount }) => {
  const navigate = useNavigate();
  const remainingFiles = userTier === 'premium' ? 'Unlimited' : Math.max(0, 10 - fileCount);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convert Images & PDFs to Excel, CSV, or JSON
          </h1>
          <p className="text-gray-600">
            Securely upload your images or PDF files with table data and convert them to structured data formats.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Files used</p>
            <p className="text-lg font-semibold">
              {userTier === 'premium' ? 'Unlimited' : `${fileCount}/10`}
            </p>
          </div>
          <Badge variant={userTier === 'premium' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {userTier === 'premium' ? (
              <Crown className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {userTier === 'premium' ? 'Premium' : 'Freemium'}
          </Badge>
        </div>
      </div>
      
      {/* Usage Warning for Free Users */}
      {userTier === 'freemium' && fileCount >= 8 && (
        <Card className="mt-4 border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-orange-800">
                  You have {remainingFiles} files remaining in your free plan.
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/pricing')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHeader;
