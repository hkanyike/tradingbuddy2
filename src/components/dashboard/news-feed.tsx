"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
  related?: string;
  image?: string;
}

interface NewsFeedProps {
  symbol?: string;
  category?: string;
  limit?: number;
}

export const NewsFeed = ({ symbol, category = "general", limit = 10 }: NewsFeedProps) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [symbol, category]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = symbol 
        ? `/api/news/company?symbol=${symbol}`
        : `/api/news/market?category=${category}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setNews(data.data.slice(0, limit));
      } else {
        setError(data.error || "Failed to fetch news");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <CardTitle>Market News</CardTitle>
          </div>
          <CardDescription>
            {symbol ? `Latest news for ${symbol}` : "Latest market news and updates"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <CardTitle>Market News</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchNews} variant="outline" size="sm" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <CardTitle>Market News</CardTitle>
          </div>
          <Button onClick={fetchNews} variant="ghost" size="sm">
            Refresh
          </Button>
        </div>
        <CardDescription>
          {symbol ? `Latest news for ${symbol}` : "Latest market news and updates"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.length === 0 ? (
          <p className="text-sm text-muted-foreground">No news available</p>
        ) : (
          news.map((article) => (
            <div
              key={article.id}
              className="border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline line-clamp-2"
                  >
                    {article.headline}
                  </a>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{formatDate(article.datetime)}</span>
                    {article.related && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {article.related}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
