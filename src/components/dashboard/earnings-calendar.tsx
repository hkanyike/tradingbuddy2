"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EarningsEvent {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate?: number;
  epsActual?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  daysUntil: number;
  isUpcoming: boolean;
  impact: "high" | "medium" | "low";
}

interface EarningsCalendarProps {
  symbols?: string[];
  days?: number;
}

export function EarningsCalendar({ symbols, days = 14 }: EarningsCalendarProps) {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        setIsLoading(true);
        setError(null);

        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days);

        const from = today.toISOString().split("T")[0];
        const to = endDate.toISOString().split("T")[0];

        const response = await fetch(
          `/api/news/earnings-calendar?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch earnings calendar");
        }

        const result = await response.json();
        
        let earningsData = result.data || [];

        // Filter by symbols if provided
        if (symbols && symbols.length > 0) {
          earningsData = earningsData.filter((e: EarningsEvent) =>
            symbols.includes(e.symbol)
          );
        }

        // Only show upcoming earnings
        earningsData = earningsData.filter((e: EarningsEvent) => e.isUpcoming);

        setEarnings(earningsData);
      } catch (err: any) {
        console.error("Error fetching earnings:", err);
        setError(err.message || "Failed to load earnings calendar");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEarnings();
    // Refresh every hour
    const interval = setInterval(fetchEarnings, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbols, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Earnings Calendar
          </CardTitle>
          <CardDescription>Upcoming earnings announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Earnings Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Earnings Calendar
        </CardTitle>
        <CardDescription>
          {earnings.length} upcoming earnings in next {days} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming earnings for tracked symbols
            </p>
          ) : (
            earnings.slice(0, 10).map((event, index) => (
              <EarningsEventCard key={index} event={event} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EarningsEventCard({ event }: { event: EarningsEvent }) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTimingColor = (hour: string) => {
    if (hour === "bmo") return "text-blue-600 dark:text-blue-400";
    if (hour === "amc") return "text-purple-600 dark:text-purple-400";
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{event.symbol}</span>
            <Badge variant="outline" className={getImpactColor(event.impact)}>
              {event.impact.toUpperCase()}
            </Badge>
          </div>
          {event.daysUntil === 0 ? (
            <Badge variant="default" className="text-xs">
              TODAY
            </Badge>
          ) : event.daysUntil === 1 ? (
            <Badge variant="secondary" className="text-xs">
              TOMORROW
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {event.daysUntil} days
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={getTimingColor(event.hour)}>
              {event.hour === "bmo"
                ? "Before Open"
                : event.hour === "amc"
                ? "After Close"
                : "During Market"}
            </span>
          </div>
          <span>{new Date(event.date).toLocaleDateString()}</span>
        </div>
        {(event.epsEstimate || event.revenueEstimate) && (
          <div className="mt-2 text-xs space-y-1">
            {event.epsEstimate && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">EPS Est:</span>
                <span className="font-medium">${event.epsEstimate.toFixed(2)}</span>
              </div>
            )}
            {event.revenueEstimate && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rev Est:</span>
                <span className="font-medium">
                  ${(event.revenueEstimate / 1e9).toFixed(2)}B
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}