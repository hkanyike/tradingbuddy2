"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SentimentData {
  symbol: string;
  score: number;
  label: string;
  bullishPercent: number;
  bearishPercent: number;
  articlesInLastWeek: number;
  buzz: number;
}

interface SentimentIndicatorProps {
  symbol: string;
}

export const SentimentIndicator = ({ symbol }: SentimentIndicatorProps) => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentiment();
  }, [symbol]);

  const fetchSentiment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/news/sentiment?symbol=${symbol}`);
      const data = await response.json();
      
      if (data.success && data.aggregateSentiment) {
        setSentiment({
          symbol,
          score: data.aggregateSentiment.score,
          label: data.aggregateSentiment.label,
          bullishPercent: data.aggregateSentiment.bullishPercent,
          bearishPercent: data.aggregateSentiment.bearishPercent,
          articlesInLastWeek: data.aggregateSentiment.articlesInLastWeek,
          buzz: data.aggregateSentiment.buzz,
        });
      } else {
        setError(data.error || "Failed to fetch sentiment");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch sentiment");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return "text-green-500";
    if (score > 0.05) return "text-green-400";
    if (score < -0.2) return "text-red-500";
    if (score < -0.05) return "text-red-400";
    return "text-muted-foreground";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.05) return <TrendingUp className="h-4 w-4" />;
    if (score < -0.05) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getSentimentBadgeVariant = (label: string): "default" | "secondary" | "destructive" => {
    if (label.includes("bullish")) return "default";
    if (label.includes("bearish")) return "destructive";
    return "secondary";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">News Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !sentiment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">News Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to load sentiment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">News Sentiment - {symbol}</CardTitle>
        <CardDescription className="text-xs">
          Based on {sentiment.articlesInLastWeek} articles in the last week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={getSentimentColor(sentiment.score)}>
              {getSentimentIcon(sentiment.score)}
            </div>
            <Badge variant={getSentimentBadgeVariant(sentiment.label)}>
              {sentiment.label}
            </Badge>
          </div>
          <span className={`text-2xl font-bold ${getSentimentColor(sentiment.score)}`}>
            {sentiment.score > 0 ? '+' : ''}{(sentiment.score * 100).toFixed(0)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bullish</span>
            <span className="font-medium text-green-500">{sentiment.bullishPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${sentiment.bullishPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bearish</span>
            <span className="font-medium text-red-500">{sentiment.bearishPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500"
              style={{ width: `${sentiment.bearishPercent}%` }}
            />
          </div>
        </div>

        {sentiment.buzz > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              News buzz: <span className="font-medium">{sentiment.buzz.toFixed(1)}x</span> average
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
