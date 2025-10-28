"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Play, Pause, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { toast } from "sonner";

interface Strategy {
  id: number;
  userId: string;
  name: string;
  type: string;
  status: string;
  riskLevel: string;
  capital: number;
  pnl: number;
  createdAt: string;
  lastExecutedAt: string | null;
}

export default function AdminStrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStrategyId, setUpdatingStrategyId] = useState<number | null>(null);

  const fetchStrategies = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/strategies", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStrategies(data);
      } else {
        toast.error("Failed to fetch strategies");
      }
    } catch (error) {
      toast.error("Error loading strategies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const toggleStrategyStatus = async (strategyId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    setUpdatingStrategyId(strategyId);
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Strategy ${newStatus === "active" ? "activated" : "paused"}`);
        fetchStrategies();
      } else {
        toast.error("Failed to update strategy");
      }
    } catch (error) {
      toast.error("Error updating strategy");
    } finally {
      setUpdatingStrategyId(null);
    }
  };

  const filteredStrategies = strategies.filter(
    (strategy) =>
      strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPnL = strategies.reduce((sum, s) => sum + (s.pnl || 0), 0);
  const activeStrategies = strategies.filter((s) => s.status === "active").length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Strategies</CardDescription>
            <CardTitle className="text-3xl">{strategies.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Strategies</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {activeStrategies}
              <Activity className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aggregate P&L</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {formatCurrency(totalPnL)}
              {totalPnL >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Capital</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(strategies.reduce((sum, s) => sum + s.capital, 0))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Strategies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Strategy Oversight</CardTitle>
              <CardDescription>Monitor and control all trading strategies</CardDescription>
            </div>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No strategies found matching your search" : "No strategies yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead>Last Executed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStrategies.map((strategy) => (
                    <TableRow key={strategy.id}>
                      <TableCell className="font-medium">{strategy.name}</TableCell>
                      <TableCell className="capitalize">{strategy.type}</TableCell>
                      <TableCell>
                        {strategy.status === "active" ? (
                          <Badge variant="default" className="gap-1">
                            <Activity className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            strategy.riskLevel === "high"
                              ? "destructive"
                              : strategy.riskLevel === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {strategy.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(strategy.capital)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          strategy.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(strategy.pnl)}
                      </TableCell>
                      <TableCell>{formatDate(strategy.lastExecutedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={strategy.status === "active" ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleStrategyStatus(strategy.id, strategy.status)}
                          disabled={updatingStrategyId === strategy.id}
                          className="gap-2"
                        >
                          {updatingStrategyId === strategy.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : strategy.status === "active" ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
