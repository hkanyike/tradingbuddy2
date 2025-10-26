"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface Position {
  id: number;
  userId: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  status: string;
}

interface Trade {
  id: number;
  userId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  status: string;
  executedAt: string | null;
  createdAt: string;
}

export default function AdminPositionsTradesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);

  const fetchPositions = async () => {
    setIsLoadingPositions(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/positions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      } else {
        toast.error("Failed to fetch positions");
      }
    } catch (error) {
      toast.error("Error loading positions");
    } finally {
      setIsLoadingPositions(false);
    }
  };

  const fetchTrades = async () => {
    setIsLoadingTrades(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/trades", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      } else {
        toast.error("Failed to fetch trades");
      }
    } catch (error) {
      toast.error("Error loading trades");
    } finally {
      setIsLoadingTrades(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchTrades();
  }, []);

  const openPositions = positions.filter((p) => p.status === "open").length;
  const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const executedTrades = trades.filter((t) => t.status === "filled").length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pending";
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
            <CardDescription>Open Positions</CardDescription>
            <CardTitle className="text-3xl">{openPositions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Positions</CardDescription>
            <CardTitle className="text-3xl">{positions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unrealized P&L</CardDescription>
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
            <CardDescription>Executed Trades</CardDescription>
            <CardTitle className="text-3xl">{executedTrades}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Positions & Trades Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>System-Wide Position & Trade Monitoring</CardTitle>
          <CardDescription>Complete audit trail and compliance reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="positions">
            <TabsList>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="mt-4">
              {isLoadingPositions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No positions yet</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Entry Price</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Unrealized P&L</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-mono text-sm">
                            {position.userId.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">{position.symbol}</TableCell>
                          <TableCell className="text-right">{position.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(position.entryPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(position.currentPrice)}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              position.unrealizedPnL >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatCurrency(position.unrealizedPnL)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={position.status === "open" ? "default" : "secondary"}>
                              {position.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trades" className="mt-4">
              {isLoadingTrades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No trades yet</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Executed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-mono text-sm">{trade.userId.substring(0, 8)}...</TableCell>
                          <TableCell className="font-medium">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={trade.side === "buy" ? "default" : "secondary"}>
                              {trade.side.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{trade.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(trade.price)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                trade.status === "filled"
                                  ? "default"
                                  : trade.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {trade.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(trade.executedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}