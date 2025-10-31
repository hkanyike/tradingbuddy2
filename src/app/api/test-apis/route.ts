import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (optional - remove if you want to test without auth)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test News API
    try {
      const newsApiKey = process.env.NEWS_API_KEY;
      if (newsApiKey) {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=AAPL&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`,
          { next: { revalidate: 0 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          results.tests.newsApi = {
            status: 'success',
            configured: true,
            message: `Fetched ${data.articles?.length || 0} articles`,
            data: { articleCount: data.articles?.length || 0 }
          };
        } else {
          results.tests.newsApi = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: response.statusText
          };
        }
      } else {
        results.tests.newsApi = {
          status: 'not_configured',
          configured: false,
          message: 'API key not found'
        };
      }
    } catch (error: any) {
      results.tests.newsApi = {
        status: 'error',
        message: error.message
      };
    }

    // Test Benzinga API
    try {
      const benzingaKey = process.env.BENZINGA_API_KEY;
      if (benzingaKey) {
        const response = await fetch(
          `https://api.benzinga.com/api/v2/news?tickers=AAPL&pageSize=5&token=${benzingaKey}`,
          { next: { revalidate: 0 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          results.tests.benzinga = {
            status: 'success',
            configured: true,
            message: `Fetched ${data.length || 0} articles`,
            data: { articleCount: data.length || 0 }
          };
        } else {
          results.tests.benzinga = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: response.statusText
          };
        }
      } else {
        results.tests.benzinga = {
          status: 'not_configured',
          configured: false,
          message: 'API key not found'
        };
      }
    } catch (error: any) {
      results.tests.benzinga = {
        status: 'error',
        message: error.message
      };
    }

    // Test Polygon API
    try {
      const polygonKey = process.env.POLYGON_API_KEY;
      if (polygonKey) {
        const response = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/SPY/prev?adjusted=true&apiKey=${polygonKey}`,
          { next: { revalidate: 0 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0]) {
            results.tests.polygon = {
              status: 'success',
              configured: true,
              message: `SPY: $${data.results[0].c}`,
              data: { symbol: 'SPY', price: data.results[0].c, volume: data.results[0].v }
            };
          } else {
            results.tests.polygon = {
              status: 'error',
              configured: true,
              message: 'No data returned'
            };
          }
        } else {
          const error = await response.json().catch(() => ({}));
          results.tests.polygon = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: error.error || response.statusText
          };
        }
      } else {
        results.tests.polygon = {
          status: 'not_configured',
          configured: false,
          message: 'API key not found'
        };
      }
    } catch (error: any) {
      results.tests.polygon = {
        status: 'error',
        message: error.message
      };
    }

    // Test Alpha Vantage API
    try {
      const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (alphaVantageKey) {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphaVantageKey}`,
          { next: { revalidate: 0 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          const quote = data['Global Quote'];
          if (quote && quote['05. price']) {
            results.tests.alphaVantage = {
              status: 'success',
              configured: true,
              message: `SPY: $${quote['05. price']}`,
              data: { symbol: 'SPY', price: quote['05. price'], change: quote['09. change'] }
            };
          } else if (data.Note) {
            results.tests.alphaVantage = {
              status: 'rate_limited',
              configured: true,
              message: 'Rate limit reached (5/min, 25/day)',
              note: data.Note
            };
          } else {
            results.tests.alphaVantage = {
              status: 'error',
              configured: true,
              message: 'No data returned'
            };
          }
        } else {
          results.tests.alphaVantage = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: response.statusText
          };
        }
      } else {
        results.tests.alphaVantage = {
          status: 'not_configured',
          configured: false,
          message: 'API key not found'
        };
      }
    } catch (error: any) {
      results.tests.alphaVantage = {
        status: 'error',
        message: error.message
      };
    }

    // Test OpenAI API
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${openaiKey}`
          },
          next: { revalidate: 0 }
        });
        
        if (response.ok) {
          const data = await response.json();
          results.tests.openai = {
            status: 'success',
            configured: true,
            message: `${data.data?.length || 0} models available`,
            data: { modelCount: data.data?.length || 0 }
          };
        } else {
          const error = await response.json().catch(() => ({}));
          results.tests.openai = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: error.error?.message || response.statusText
          };
        }
      } else {
        results.tests.openai = {
          status: 'not_configured',
          configured: false,
          message: 'API key not found'
        };
      }
    } catch (error: any) {
      results.tests.openai = {
        status: 'error',
        message: error.message
      };
    }

    // Test Hugging Face API
    try {
      const hfKey = process.env.HUGGINGFACE_API_KEY;
      if (hfKey) {
        const response = await fetch('https://api-inference.huggingface.co/models/ProsusAI/finbert', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: 'Apple stock surges on strong earnings'
          }),
          next: { revalidate: 0 }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data[0]) {
            const topResult = Array.isArray(data[0]) ? data[0][0] : data[0];
            results.tests.huggingface = {
              status: 'success',
              configured: true,
              message: `Sentiment: ${topResult.label}`,
              data: { sentiment: topResult.label, confidence: topResult.score }
            };
          } else {
            results.tests.huggingface = {
              status: 'error',
              configured: true,
              message: 'No data returned'
            };
          }
        } else if (response.status === 503) {
          results.tests.huggingface = {
            status: 'loading',
            configured: true,
            message: 'Model loading (try again in 20s)'
          };
        } else {
          const error = await response.json().catch(() => ({}));
          results.tests.huggingface = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: error.error || response.statusText
          };
        }
      } else {
        results.tests.huggingface = {
          status: 'not_configured',
          configured: false,
          message: 'API key not found'
        };
      }
    } catch (error: any) {
      results.tests.huggingface = {
        status: 'error',
        message: error.message
      };
    }

    // Test Alpaca API
    try {
      const alpacaKey = process.env.ALPACA_API_KEY;
      const alpacaSecret = process.env.ALPACA_API_SECRET;
      
      if (alpacaKey && alpacaSecret) {
        const response = await fetch('https://paper-api.alpaca.markets/v2/account', {
          headers: {
            'APCA-API-KEY-ID': alpacaKey,
            'APCA-API-SECRET-KEY': alpacaSecret
          },
          next: { revalidate: 0 }
        });
        
        if (response.ok) {
          const data = await response.json();
          results.tests.alpaca = {
            status: 'success',
            configured: true,
            message: `Account equity: $${parseFloat(data.equity).toFixed(2)}`,
            data: { equity: data.equity, cash: data.cash }
          };
        } else {
          results.tests.alpaca = {
            status: 'error',
            configured: true,
            message: `HTTP ${response.status}`,
            error: response.statusText
          };
        }
      } else {
        results.tests.alpaca = {
          status: 'not_configured',
          configured: false,
          message: 'API credentials not found'
        };
      }
    } catch (error: any) {
      results.tests.alpaca = {
        status: 'error',
        message: error.message
      };
    }

    // Calculate summary
    const tests = Object.entries(results.tests);
    const successful = tests.filter(([_, t]: [string, any]) => t.status === 'success').length;
    const notConfigured = tests.filter(([_, t]: [string, any]) => t.status === 'not_configured').length;
    const errors = tests.filter(([_, t]: [string, any]) => t.status === 'error').length;

    results.summary = {
      total: tests.length,
      successful,
      notConfigured,
      errors,
      message: successful === tests.length 
        ? '🎉 All APIs working!'
        : successful > 0
        ? `⚠️ ${successful}/${tests.length} APIs working`
        : '❌ No APIs connected'
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('API test error:', error);
    return NextResponse.json(
      { error: 'Failed to test APIs', message: error.message },
      { status: 500 }
    );
  }
}

