import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { contractAnalyzer, type ContractAnalysisRequest } from '@/lib/contract-analyzer';

// POST /api/ai/analyze-contract - Analyze a specific options contract
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol, strikePrice, expirationDate, optionType, contractPrice, quantity } = body;

    // Validate required fields
    if (!symbol || !strikePrice || !expirationDate || !optionType) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: symbol, strikePrice, expirationDate, optionType',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate option type
    if (!['call', 'put'].includes(optionType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Option type must be call or put', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Build analysis request
    const analysisRequest: ContractAnalysisRequest = {
      symbol: symbol.toUpperCase(),
      strikePrice: parseFloat(strikePrice),
      expirationDate,
      optionType: optionType.toLowerCase(),
      contractPrice: contractPrice ? parseFloat(contractPrice) : undefined,
      quantity: quantity ? parseInt(quantity) : 1
    };

    // Execute AI analysis
    console.log(`🔍 Analyzing contract for user ${session.user.email}:`, analysisRequest);
    const result = await contractAnalyzer.analyzeContract(analysisRequest);
    console.log(`✅ Analysis complete for ${symbol} ${strikePrice} ${optionType}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in contract analysis:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

