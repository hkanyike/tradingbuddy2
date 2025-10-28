"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BrokerConnection {
  id: number;
  userId: string;
  broker: string;
  accountType: string;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

export default function AdminBrokerConnectionsPage() {
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/broker-connections", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      } else {
        toast.error("Failed to fetch broker connections");
      }
    } catch (error) {
      toast.error("Error loading broker connections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const filteredConnections = connections.filter(
    (conn) =>
      conn.broker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.accountType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConnections = connections.filter((c) => c.status === "connected").length;
  const brokerTypes = [...new Set(connections.map((c) => c.broker))].length;

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
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Connections</CardDescription>
            <CardTitle className="text-3xl">{connections.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Connections</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {activeConnections}
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Broker Platforms</CardDescription>
            <CardTitle className="text-3xl">{brokerTypes}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Connections Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Broker Connection Monitoring</CardTitle>
              <CardDescription>View and monitor all broker API connections</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={fetchConnections} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No connections found matching your search" : "No broker connections yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConnections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium capitalize">{connection.broker}</TableCell>
                      <TableCell className="capitalize">{connection.accountType}</TableCell>
                      <TableCell>
                        {connection.status === "connected" ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(connection.lastSyncedAt)}</TableCell>
                      <TableCell>{formatDate(connection.createdAt)}</TableCell>
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
