"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Play, Pause, Settings } from "lucide-react";

interface Strategy {
  id: number;
  name: string;
  strategyType: string | null;
  isActive: boolean;
}

interface AIAgentStatusProps {
  executionMode?: string;
  strategies?: Strategy[];
  isLoading?: boolean;
  onModeChange?: (mode: string) => void;
}

export const AIAgentStatus = ({ 
  executionMode = 'manual', 
  strategies = [], 
  isLoading,
  onModeChange 
}: AIAgentStatusProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'automatic':
        return 'default';
      case 'semi-automatic':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'automatic':
        return 'Fully Automated';
      case 'semi-automatic':
        return 'Semi-Automated';
      default:
        return 'Manual';
    }
  };

  const activeStrategies = strategies.filter(s => s.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Execution Mode</p>
            <p className="text-lg font-bold">{getModeLabel(executionMode)}</p>
          </div>
          <Badge variant={getModeColor(executionMode) as any} className="text-sm">
            {executionMode === 'automatic' ? 'Active' : executionMode === 'semi-automatic' ? 'Assisted' : 'Inactive'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Active Strategies</p>
            <Badge variant="outline">{activeStrategies.length} / {strategies.length}</Badge>
          </div>
          <div className="space-y-2">
            {activeStrategies.length > 0 ? (
              activeStrategies.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{strategy.name}</span>
                  </div>
                  {strategy.strategyType && (
                    <Badge variant="secondary" className="text-xs">
                      {strategy.strategyType}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active strategies
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            {executionMode === 'manual' ? (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};