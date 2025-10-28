"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: number;
  userId: string;
  type: string;
  severity: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        toast.error("Failed to fetch alerts");
      }
    } catch (error) {
      toast.error("Error loading alerts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const dismissAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Alert dismissed");
        fetchAlerts();
      } else {
        toast.error("Failed to dismiss alert");
      }
    } catch (error) {
      toast.error("Error dismissing alert");
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.isRead).length;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const warningAlerts = alerts.filter((a) => a.severity === "warning").length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
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
            <CardDescription>Total Alerts</CardDescription>
            <CardTitle className="text-3xl">{alerts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unread Alerts</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {unreadAlerts}
              <Bell className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Critical Alerts</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {criticalAlerts}
              <AlertCircle className="h-5 w-5 text-destructive" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Warning Alerts</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {warningAlerts}
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Management</CardTitle>
          <CardDescription>System-wide alert monitoring and management</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No alerts yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id} className={!alert.isRead ? "bg-muted/50" : ""}>
                      <TableCell className="font-mono text-sm">{alert.userId.substring(0, 8)}...</TableCell>
                      <TableCell className="capitalize">{alert.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : alert.severity === "warning"
                              ? "default"
                              : "secondary"
                          }
                          className="gap-1"
                        >
                          {getSeverityIcon(alert.severity)}
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                      <TableCell>
                        {alert.isRead ? (
                          <Badge variant="secondary" className="gap-1">
                            <BellOff className="h-3 w-3" />
                            Read
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1">
                            <Bell className="h-3 w-3" />
                            Unread
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(alert.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {!alert.isRead && (
                          <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)}>
                            Dismiss
                          </Button>
                        )}
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
