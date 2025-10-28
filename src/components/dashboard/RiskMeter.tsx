"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RiskMeterProps {
  portfolioHeat?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  isLoading?: boolean;
}

export const RiskMeter = ({ portfolioHeat = 0, maxDrawdown = 0, sharpeRatio = 0, isLoading }: RiskMeterProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getHeatColor = (heat: number) => {
    if (heat < 0.4) return "bg-green-500";
    if (heat < 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getHeatStatus = (heat: number) => {
    if (heat < 0.4) return { text: "Low Risk", icon: Shield, color: "text-green-600" };
    if (heat < 0.7) return { text: "Moderate Risk", icon: AlertTriangle, color: "text-yellow-600" };
    return { text: "High Risk", icon: AlertTriangle, color: "text-red-600" };
  };

  const heatStatus = getHeatStatus(portfolioHeat);
  const HeatIcon = heatStatus.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeatIcon className={`h-5 w-5 ${heatStatus.color}`} />
          Risk Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Portfolio Heat</span>
            <span className={`font-bold ${heatStatus.color}`}>
              {(portfolioHeat * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={portfolioHeat * 100} className="h-2" indicatorClassName={getHeatColor(portfolioHeat)} />
          <p className={`text-xs ${heatStatus.color}`}>{heatStatus.text}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Max Drawdown</span>
            <span className="font-bold text-red-600">
              {(maxDrawdown * 100).toFixed(2)}%
            </span>
          </div>
          <Progress 
            value={Math.abs(maxDrawdown) * 100} 
            className="h-2" 
            indicatorClassName="bg-red-500" 
          />
          <p className="text-xs text-muted-foreground">Peak to trough decline</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Sharpe Ratio</span>
            <span className={`font-bold ${sharpeRatio >= 1 ? 'text-green-600' : sharpeRatio >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {sharpeRatio.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>
              {sharpeRatio >= 2 ? 'Excellent' : sharpeRatio >= 1 ? 'Good' : sharpeRatio >= 0 ? 'Fair' : 'Poor'} risk-adjusted returns
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
