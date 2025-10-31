import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIService } from '@/lib/openai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, symbol, contractDetails, concept, context } = body;

    const openAI = getOpenAIService();

    switch (action) {
      case 'trade_insight':
        if (!symbol || !contractDetails) {
          return NextResponse.json(
            { error: 'Missing symbol or contractDetails' },
            { status: 400 }
          );
        }
        const insight = await openAI.getTradeInsight(symbol, contractDetails);
        return NextResponse.json(insight);

      case 'explain_concept':
        if (!concept) {
          return NextResponse.json(
            { error: 'Missing concept' },
            { status: 400 }
          );
        }
        const explanation = await openAI.explainConcept(concept, context);
        return NextResponse.json(explanation);

      case 'explain_strategy':
        if (!body.strategyName || !body.userContext) {
          return NextResponse.json(
            { error: 'Missing strategyName or userContext' },
            { status: 400 }
          );
        }
        const strategyExplanation = await openAI.explainStrategy(
          body.strategyName,
          body.userContext
        );
        return NextResponse.json({ explanation: strategyExplanation });

      case 'analyze_news':
        if (!body.articles) {
          return NextResponse.json(
            { error: 'Missing articles' },
            { status: 400 }
          );
        }
        const sentiment = await openAI.analyzeNewsSentiment(body.articles);
        return NextResponse.json(sentiment);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('OpenAI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI insights' },
      { status: 500 }
    );
  }
}

