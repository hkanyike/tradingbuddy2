import { NextRequest, NextResponse } from 'next/server';
import { getHuggingFaceService } from '@/lib/huggingface-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, text, texts, article, commentary } = body;

    const hf = getHuggingFaceService();

    switch (action) {
      case 'analyze_sentiment':
        if (!text) {
          return NextResponse.json(
            { error: 'Missing text' },
            { status: 400 }
          );
        }
        const sentiment = await hf.analyzeSentiment(text);
        return NextResponse.json(sentiment);

      case 'analyze_batch':
        if (!texts || !Array.isArray(texts)) {
          return NextResponse.json(
            { error: 'Missing texts array' },
            { status: 400 }
          );
        }
        const batchResults = await hf.analyzeSentimentBatch(texts);
        return NextResponse.json({ results: batchResults });

      case 'classify_tone':
        if (!text) {
          return NextResponse.json(
            { error: 'Missing text' },
            { status: 400 }
          );
        }
        const tone = await hf.classifyTone(text);
        return NextResponse.json({ tone });

      case 'analyze_article':
        if (!article || !article.title || !article.content) {
          return NextResponse.json(
            { error: 'Missing article data' },
            { status: 400 }
          );
        }
        const articleAnalysis = await hf.analyzeNewsArticle(article);
        return NextResponse.json(articleAnalysis);

      case 'analyze_commentary':
        if (!commentary) {
          return NextResponse.json(
            { error: 'Missing commentary' },
            { status: 400 }
          );
        }
        const commentaryAnalysis = await hf.analyzeMarketCommentary(commentary);
        return NextResponse.json(commentaryAnalysis);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}

