
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumFeatureGateProps {
  userTier: 'freemium' | 'premium';
  feature: string;
  description: string;
  children?: React.ReactNode;
  showUpgrade?: boolean;
}

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  userTier,
  feature,
  description,
  children,
  showUpgrade = true
}) => {
  const navigate = useNavigate();

  if (userTier === 'premium') {
    return <>{children}</>;
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Lock className="h-5 w-5 text-gray-400" />
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Premium Feature
          </Badge>
        </div>
        <CardTitle className="text-gray-600">{feature}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {showUpgrade && (
        <CardContent className="text-center">
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-primary hover:bg-primary/90"
          >
            Upgrade to Premium
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default PremiumFeatureGate;
