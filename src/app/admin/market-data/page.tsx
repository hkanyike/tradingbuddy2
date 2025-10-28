"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Database } from "lucide-react";
import { toast } from "sonner";

interface DataFetch {
  id: number;
  source: string;
  fetchType: string;
  status: string;
  recordsProcessed: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export default function AdminMarketDataPage() {
  const [dataFetches, setDataFetches] = useState<DataFetch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDataLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/market-data/fetches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDataFetches(data);
      } else {
        toast.error("Failed to fetch data logs");
      }
    } catch (error) {
      toast.error("Error loading data logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataLogs();
  }, []);

  const successfulFetches = dataFetches.filter((f) => f.status === "completed").length;
  const failedFetches = dataFetches.filter((f) => f.status === "failed").length;
  const totalRecords = dataFetches.reduce((sum, f) => sum + f.recordsProcessed, 0);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return "In Progress";
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const seconds = Math.round((end - start) / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Fetches</CardDescription>
            <CardTitle className="text-3xl">{dataFetches.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successful</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {successfulFetches}
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {failedFetches}
              <XCircle className="h-5 w-5 text-red-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Records Processed</CardDescription>
            <CardTitle className="text-3xl">{totalRecords.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Fetches Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Market Data Feed Monitoring</CardTitle>
              <CardDescription>Track data ingestion and processing logs</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchDataLogs} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dataFetches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No data fetch logs yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Fetch Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataFetches.map((fetch) => (
                    <TableRow key={fetch.id}>
                      <TableCell className="font-medium capitalize">{fetch.source}</TableCell>
                      <TableCell className="capitalize">{fetch.fetchType}</TableCell>
                      <TableCell>
                        {fetch.status === "completed" ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </Badge>
                        ) : fetch.status === "failed" ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Running
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{fetch.recordsProcessed.toLocaleString()}</TableCell>
                      <TableCell>{formatDuration(fetch.startedAt, fetch.completedAt)}</TableCell>
                      <TableCell>{formatDate(fetch.startedAt)}</TableCell>
                      <TableCell>{formatDate(fetch.completedAt)}</TableCell>
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
