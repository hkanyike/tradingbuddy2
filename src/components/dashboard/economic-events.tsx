"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EconomicEvent {
  event: string;
  country: string;
  date: string;
  actual?: number | null;
  estimate?: number | null;
  previous?: number | null;
  impact: "high" | "medium" | "low";
  unit?: string;
}

interface EconomicEventsProps {
  days?: number;
}

export function EconomicEvents({ days = 7 }: EconomicEventsProps) {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true);
        setError(null);

        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days);

        const from = today.toISOString().split("T")[0];
        const to = endDate.toISOString().split("T")[0];

        const response = await fetch(
          `/api/news/economic-calendar?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch economic calendar");
        }

        const result = await response.json();
        setEvents(result.data || []);
      } catch (err: any) {
        console.error("Error fetching economic events:", err);
        setError(err.message || "Failed to load economic calendar");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
    // Refresh every 2 hours
    const interval = setInterval(fetchEvents, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Economic Events
          </CardTitle>
          <CardDescription>Upcoming market-moving events</CardDescription>
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
            <Globe className="h-5 w-5" />
            Economic Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter high impact events for US
  const highImpactEvents = events.filter(
    (e) => e.impact === "high" && e.country === "US"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Economic Events
        </CardTitle>
        <CardDescription>
          {highImpactEvents.length} high-impact events in next {days} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {highImpactEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No major economic events scheduled
            </p>
          ) : (
            highImpactEvents.slice(0, 8).map((event, index) => (
              <EconomicEventCard key={index} event={event} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EconomicEventCard({ event }: { event: EconomicEvent }) {
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

  const formatValue = (value?: number | null, unit?: string) => {
    if (value === undefined || value === null) return "N/A";
    if (unit === "%") return `${value}%`;
    if (unit === "K") return `${value}K`;
    if (unit === "M") return `${value}M`;
    if (unit === "B") return `${value}B`;
    return value.toFixed(2);
  };

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntil(event.date);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{event.event}</span>
            <Badge variant="outline" className={getImpactColor(event.impact)}>
              {event.impact.toUpperCase()}
            </Badge>
          </div>
          {daysUntil === 0 ? (
            <Badge variant="default" className="text-xs">
              TODAY
            </Badge>
          ) : daysUntil === 1 ? (
            <Badge variant="secondary" className="text-xs">
              TOMORROW
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">{daysUntil} days</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-medium">{event.country}</span>
          <span>•</span>
          <span>{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Previous</div>
            <div className="font-medium">{formatValue(event.previous, event.unit)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Estimate</div>
            <div className="font-medium">{formatValue(event.estimate, event.unit)}</div>
          </div>
          {event.actual !== undefined && (
            <div>
              <div className="text-muted-foreground">Actual</div>
              <div className="font-medium text-primary">
                {formatValue(event.actual, event.unit)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
