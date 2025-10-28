"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  id: number;
  assetSymbol?: string;
  positionType: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  strikePrice: number | null;
  expirationDate: string | null;
  unrealizedPnl: number;
  delta: number | null;
  theta: number | null;
  status: string;
}

interface OpenPositionsProps {
  positions?: Position[];
  isLoading?: boolean;
}

export const OpenPositions = ({ positions = [], isLoading }: OpenPositionsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No open positions</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead className="text-right">Theta</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.assetSymbol || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{position.positionType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{position.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${position.entryPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {position.currentPrice ? `$${position.currentPrice.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {position.unrealizedPnl >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-medium">
                        ${Math.abs(position.unrealizedPnl).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {position.delta !== null ? position.delta.toFixed(2) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {position.theta !== null ? position.theta.toFixed(2) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(position.expirationDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
