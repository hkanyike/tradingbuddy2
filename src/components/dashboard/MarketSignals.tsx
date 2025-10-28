"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertCircle, Target } from "lucide-react";

interface MarketSignal {
  id: number;
  assetSymbol?: string;
  signalType: string;
  strategyType: string | null;
  confidenceScore: number | null;
  recommendedAction: string | null;
  ivPremium: number | null;
  riskRewardRatio: number | null;
  createdAt: string;
}

interface MarketSignalsProps {
  signals?: MarketSignal[];
  isLoading?: boolean;
}

export const MarketSignals = ({ signals = [], isLoading }: MarketSignalsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Market Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Market Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No active signals</p>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'entry':
        return 'default';
      case 'exit':
        return 'secondary';
      case 'hedge':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          AI Market Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signals.slice(0, 4).map((signal) => (
            <div key={signal.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{signal.assetSymbol || 'Unknown'}</span>
                    <Badge variant={getSignalColor(signal.signalType) as any}>
                      {signal.signalType}
                    </Badge>
                    {signal.strategyType && (
                      <Badge variant="outline" className="text-xs">
                        {signal.strategyType}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {signal.recommendedAction || 'No action specified'}
                  </p>
                </div>
                {signal.confidenceScore !== null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className={`text-lg font-bold ${getConfidenceColor(signal.confidenceScore)}`}>
                      {(signal.confidenceScore * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                {signal.ivPremium !== null && (
                  <div>
                    <span className="text-muted-foreground">IV Premium: </span>
                    <span className="font-medium">{(signal.ivPremium * 100).toFixed(1)}%</span>
                  </div>
                )}
                {signal.riskRewardRatio !== null && (
                  <div>
                    <span className="text-muted-foreground">R:R </span>
                    <span className="font-medium">{signal.riskRewardRatio.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Execute Trade
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
