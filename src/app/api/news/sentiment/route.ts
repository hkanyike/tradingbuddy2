import { NextRequest, NextResponse } from "next/server";
import Sentiment from "sentiment";

export const dynamic = "force-dynamic";

const sentimentAnalyzer = new Sentiment();

/**
 * GET /api/news/sentiment
 * Fetch news for symbols and perform local sentiment analysis
 * Query params: symbol (single) OR symbols (comma-separated)
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Finnhub API key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const symbols = searchParams.get("symbols");
    
    if (!symbol && !symbols) {
      return NextResponse.json(
        { error: "Symbol or symbols parameter is required" },
        { status: 400 }
      );
    }

    // Handle multiple symbols
    const symbolList = symbols ? symbols.split(",").map(s => s.trim()) : [symbol!];
    
    // Fetch news and analyze sentiment for each symbol
    const sentimentPromises = symbolList.map(async (sym) => {
      try {
        // Fetch company news from Finnhub (free tier)
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 7); // Last 7 days
        
        const response = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}&token=${apiKey}`,
          { next: { revalidate: 600 } } // Cache for 10 minutes
        );

        if (!response.ok) {
          return {
            symbol: sym,
            error: `API error: ${response.statusText}`,
            sentiment: null
          };
        }

        const newsArticles = await response.json();
        
        // Analyze sentiment locally using sentiment package
        const sentimentResults = analyzeNewsSentiment(newsArticles);

        return {
          symbol: sym,
          sentiment: sentimentResults,
          articlesAnalyzed: newsArticles.length,
          timestamp: new Date().toISOString()
        };
      } catch (error: any) {
        return {
          symbol: sym,
          error: error.message,
          sentiment: null
        };
      }
    });

    const results = await Promise.all(sentimentPromises);

    return NextResponse.json({
      success: true,
      symbols: symbolList,
      data: results,
      method: "local_nlp_analysis",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error analyzing news sentiment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze news sentiment" },
      { status: 500 }
    );
  }
}

function analyzeNewsSentiment(articles: any[]) {
  if (!articles || articles.length === 0) {
    return {
      score: 0,
      label: "neutral",
      confidence: 0,
      articlesAnalyzed: 0,
      bullishCount: 0,
      bearishCount: 0,
      neutralCount: 0,
      details: []
    };
  }

  let totalScore = 0;
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;
  const details: any[] = [];

  // Analyze each article
  for (const article of articles.slice(0, 50)) { // Limit to 50 most recent
    const text = `${article.headline || ""} ${article.summary || ""}`;
    const result = sentimentAnalyzer.analyze(text);
    
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, result.score / 10));
    totalScore += normalizedScore;

    if (normalizedScore > 0.1) {
      bullishCount++;
    } else if (normalizedScore < -0.1) {
      bearishCount++;
    } else {
      neutralCount++;
    }

    details.push({
      headline: article.headline,
      score: normalizedScore,
      sentiment: normalizedScore > 0.1 ? "bullish" : normalizedScore < -0.1 ? "bearish" : "neutral",
      datetime: article.datetime,
      source: article.source
    });
  }

  const avgScore = totalScore / articles.length;
  const bullishPercent = (bullishCount / articles.length) * 100;
  const bearishPercent = (bearishCount / articles.length) * 100;
  
  // Determine overall sentiment label
  let label = "neutral";
  if (avgScore > 0.3) label = "bullish";
  else if (avgScore > 0.1) label = "slightly bullish";
  else if (avgScore < -0.3) label = "bearish";
  else if (avgScore < -0.1) label = "slightly bearish";

  // Calculate confidence based on consistency
  const dominantPercent = Math.max(bullishPercent, bearishPercent, (neutralCount / articles.length) * 100);
  const confidence = dominantPercent / 100;

  return {
    score: avgScore,
    label,
    confidence,
    articlesAnalyzed: articles.length,
    bullishCount,
    bearishCount,
    neutralCount,
    bullishPercent: Math.round(bullishPercent),
    bearishPercent: Math.round(bearishPercent),
    neutralPercent: Math.round((neutralCount / articles.length) * 100),
    recentArticles: details.slice(0, 10), // Top 10 most recent
    weeklyTrend: avgScore > 0 ? "positive" : avgScore < 0 ? "negative" : "neutral"
  };
}