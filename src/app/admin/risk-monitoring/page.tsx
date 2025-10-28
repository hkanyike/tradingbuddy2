"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, TrendingDown, Activity, Power } from "lucide-react";
import { toast } from "sonner";

interface RiskMetric {
  id: number;
  userId: string;
  totalExposure: number;
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  maxDrawdown: number;
  sharpeRatio: number;
  createdAt: string;
}

export default function AdminRiskMonitoringPage() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emergencyStop, setEmergencyStop] = useState(false);

  const fetchRiskMetrics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/risk-metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRiskMetrics(data);
      } else {
        toast.error("Failed to fetch risk metrics");
      }
    } catch (error) {
      toast.error("Error loading risk metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskMetrics();
  }, []);

  const totalExposure = riskMetrics.reduce((sum, m) => sum + Math.abs(m.totalExposure), 0);
  const systemDelta = riskMetrics.reduce((sum, m) => sum + m.netDelta, 0);
  const systemGamma = riskMetrics.reduce((sum, m) => sum + m.netGamma, 0);
  const avgSharpe = riskMetrics.length > 0 
    ? riskMetrics.reduce((sum, m) => sum + m.sharpeRatio, 0) / riskMetrics.length 
    : 0;

  const atRiskUsers = riskMetrics.filter(
    (m) => Math.abs(m.netDelta) > 100 || m.maxDrawdown < -0.15
  ).length;

  const handleEmergencyStop = () => {
    if (window.confirm("Are you sure you want to trigger an EMERGENCY STOP? This will halt all trading activity immediately.")) {
      setEmergencyStop(true);
      toast.error("EMERGENCY STOP ACTIVATED - All trading halted");
      // In production, this would call an API to halt all strategies
    }
  };

  const handleResumeTrading = () => {
    if (window.confirm("Are you sure you want to resume trading operations?")) {
      setEmergencyStop(false);
      toast.success("Trading operations resumed");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Emergency Controls */}
      {emergencyStop && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">EMERGENCY STOP ACTIVE</CardTitle>
                  <CardDescription>All trading operations are currently halted</CardDescription>
                </div>
              </div>
              <Button variant="default" onClick={handleResumeTrading} className="gap-2">
                <Activity className="h-4 w-4" />
                Resume Trading
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total System Exposure</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totalExposure)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Net Delta</CardDescription>
            <CardTitle className={`text-3xl ${Math.abs(systemDelta) > 500 ? "text-destructive" : ""}`}>
              {systemDelta.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Net Gamma</CardDescription>
            <CardTitle className="text-3xl">{systemGamma.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Sharpe Ratio</CardDescription>
            <CardTitle className="text-3xl">{avgSharpe.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Risk Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Risk Monitoring</CardTitle>
              <CardDescription>Real-time risk metrics across all accounts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {atRiskUsers} At Risk
              </Badge>
              <Button
                variant="destructive"
                onClick={handleEmergencyStop}
                disabled={emergencyStop}
                className="gap-2"
              >
                <Power className="h-4 w-4" />
                Emergency Stop
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : riskMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No risk data available</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Exposure</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="text-right">Gamma</TableHead>
                    <TableHead className="text-right">Theta</TableHead>
                    <TableHead className="text-right">Vega</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">Sharpe</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskMetrics.map((metric) => {
                    const isDeltaHigh = Math.abs(metric.netDelta) > 100;
                    const isDrawdownHigh = metric.maxDrawdown < -0.15;
                    const isAtRisk = isDeltaHigh || isDrawdownHigh;

                    return (
                      <TableRow key={metric.id}>
                        <TableCell className="font-mono text-sm">{metric.userId.substring(0, 8)}...</TableCell>
                        <TableCell className="text-right">{formatCurrency(metric.totalExposure)}</TableCell>
                        <TableCell className={`text-right ${isDeltaHigh ? "text-destructive font-bold" : ""}`}>
                          {metric.netDelta.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{metric.netGamma.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{metric.netTheta.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{metric.netVega.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${isDrawdownHigh ? "text-destructive font-bold" : ""}`}>
                          {formatPercent(metric.maxDrawdown)}
                        </TableCell>
                        <TableCell className="text-right">{metric.sharpeRatio.toFixed(2)}</TableCell>
                        <TableCell>
                          {isAtRisk ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              At Risk
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
