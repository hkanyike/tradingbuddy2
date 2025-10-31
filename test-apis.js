// API Integration Test Script
// Run with: node test-apis.js

const testResults = {
  newsApi: { status: '⏳', message: 'Testing...' },
  benzinga: { status: '⏳', message: 'Testing...' },
  polygon: { status: '⏳', message: 'Testing...' },
  alphaVantage: { status: '⏳', message: 'Testing...' },
  openai: { status: '⏳', message: 'Testing...' },
  huggingface: { status: '⏳', message: 'Testing...' },
  alpaca: { status: '⏳', message: 'Testing...' }
};

// Test News API
async function testNewsAPI() {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    testResults.newsApi = { status: '⚠️', message: 'API key not found in environment' };
    return;
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=AAPL&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.articles && data.articles.length > 0) {
        testResults.newsApi = { 
          status: '✅', 
          message: `Connected! Fetched ${data.articles.length} articles` 
        };
      } else {
        testResults.newsApi = { 
          status: '⚠️', 
          message: 'Connected but no articles returned' 
        };
      }
    } else {
      testResults.newsApi = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    testResults.newsApi = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Test Benzinga API
async function testBenzinga() {
  const apiKey = process.env.BENZINGA_API_KEY;
  
  if (!apiKey) {
    testResults.benzinga = { status: '⚠️', message: 'API key not found in environment' };
    return;
  }

  try {
    const response = await fetch(
      `https://api.benzinga.com/api/v2/news?tickers=AAPL&pageSize=5&token=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        testResults.benzinga = { 
          status: '✅', 
          message: `Connected! Fetched ${data.length} articles` 
        };
      } else {
        testResults.benzinga = { 
          status: '⚠️', 
          message: 'Connected but no data returned' 
        };
      }
    } else {
      testResults.benzinga = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    testResults.benzinga = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Test Polygon API
async function testPolygon() {
  const apiKey = process.env.POLYGON_API_KEY;
  
  if (!apiKey) {
    testResults.polygon = { status: '⚠️', message: 'API key not found in environment' };
    return;
  }

  try {
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/SPY/prev?adjusted=true&apiKey=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results[0]) {
        const result = data.results[0];
        testResults.polygon = { 
          status: '✅', 
          message: `Connected! SPY: $${result.c} (Vol: ${result.v.toLocaleString()})` 
        };
      } else {
        testResults.polygon = { 
          status: '⚠️', 
          message: 'Connected but no data returned' 
        };
      }
    } else {
      const error = await response.json().catch(() => ({}));
      testResults.polygon = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${error.error || response.statusText}` 
      };
    }
  } catch (error) {
    testResults.polygon = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Test Alpha Vantage API
async function testAlphaVantage() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    testResults.alphaVantage = { status: '⚠️', message: 'API key not found in environment' };
    return;
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const quote = data['Global Quote'];
      if (quote && quote['05. price']) {
        testResults.alphaVantage = { 
          status: '✅', 
          message: `Connected! SPY: $${quote['05. price']} (Change: ${quote['09. change']})` 
        };
      } else if (data.Note) {
        testResults.alphaVantage = { 
          status: '⚠️', 
          message: 'Rate limit reached (5 calls/min, 25/day)' 
        };
      } else {
        testResults.alphaVantage = { 
          status: '⚠️', 
          message: 'Connected but no data returned' 
        };
      }
    } else {
      testResults.alphaVantage = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    testResults.alphaVantage = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Test OpenAI API
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    testResults.openai = { status: '⚠️', message: 'API key not found in environment' };
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'user', content: 'Say "API test successful" if you can read this.' }
        ],
        max_tokens: 20
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        testResults.openai = { 
          status: '✅', 
          message: `Connected! Model: ${data.model}` 
        };
      } else {
        testResults.openai = { 
          status: '⚠️', 
          message: 'Connected but no response' 
        };
      }
    } else {
      const error = await response.json().catch(() => ({}));
      testResults.openai = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${error.error?.message || response.statusText}` 
      };
    }
  } catch (error) {
    testResults.openai = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Test Hugging Face API
async function testHuggingFace() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    testResults.huggingface = { status: '⚠️', message: 'API key not found in environment' };
    return;
  }

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/ProsusAI/finbert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Apple stock surges on strong earnings report'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]) {
        const topResult = Array.isArray(data[0]) ? data[0][0] : data[0];
        testResults.huggingface = { 
          status: '✅', 
          message: `Connected! Sentiment: ${topResult.label} (${(topResult.score * 100).toFixed(0)}%)` 
        };
      } else {
        testResults.huggingface = { 
          status: '⚠️', 
          message: 'Connected but no data returned' 
        };
      }
    } else if (response.status === 503) {
      testResults.huggingface = { 
        status: '⚠️', 
        message: 'Model loading (try again in 20s)' 
      };
    } else {
      const error = await response.json().catch(() => ({}));
      testResults.huggingface = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${error.error || response.statusText}` 
      };
    }
  } catch (error) {
    testResults.huggingface = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Test Alpaca API
async function testAlpaca() {
  const apiKey = process.env.ALPACA_API_KEY;
  const apiSecret = process.env.ALPACA_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    testResults.alpaca = { status: '⚠️', message: 'API credentials not found in environment' };
    return;
  }

  try {
    const response = await fetch('https://paper-api.alpaca.markets/v2/account', {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      testResults.alpaca = { 
        status: '✅', 
        message: `Connected! Account: $${parseFloat(data.equity).toFixed(2)}` 
      };
    } else {
      testResults.alpaca = { 
        status: '❌', 
        message: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    testResults.alpaca = { 
      status: '❌', 
      message: `Error: ${error.message}` 
    };
  }
}

// Print results in a nice table
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 API INTEGRATION TEST RESULTS');
  console.log('='.repeat(80) + '\n');
  
  const apis = [
    { name: 'News API', key: 'newsApi', cost: 'Free (100/day)' },
    { name: 'Benzinga', key: 'benzinga', cost: 'Paid' },
    { name: 'Polygon', key: 'polygon', cost: 'Free (5/min)' },
    { name: 'Alpha Vantage', key: 'alphaVantage', cost: 'Free (25/day)' },
    { name: 'OpenAI', key: 'openai', cost: '~$0.01/request' },
    { name: 'Hugging Face', key: 'huggingface', cost: 'Free' },
    { name: 'Alpaca', key: 'alpaca', cost: 'Free (Paper)' }
  ];

  apis.forEach(api => {
    const result = testResults[api.key];
    console.log(`${result.status} ${api.name.padEnd(20)} | ${result.message}`);
    console.log(`   Cost: ${api.cost}`);
    console.log('-'.repeat(80));
  });

  // Summary
  const connected = Object.values(testResults).filter(r => r.status === '✅').length;
  const total = Object.keys(testResults).length;
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 SUMMARY: ${connected}/${total} APIs Connected Successfully`);
  console.log('='.repeat(80) + '\n');

  if (connected === total) {
    console.log('🎉 ALL APIs are working perfectly!\n');
  } else if (connected > 0) {
    console.log('⚠️  Some APIs need attention. Check the results above.\n');
  } else {
    console.log('❌ No APIs connected. Please check your environment variables.\n');
  }
}

// Run all tests
async function runTests() {
  console.log('\n🚀 Starting API tests...\n');
  console.log('This will test all 7 APIs with your keys from environment variables.\n');
  console.log('⏳ Testing (this may take 10-15 seconds)...\n');

  await Promise.all([
    testNewsAPI(),
    testBenzinga(),
    testPolygon(),
    testAlphaVantage(),
    testOpenAI(),
    testHuggingFace(),
    testAlpaca()
  ]);

  printResults();
}

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('❌ Error: This script requires Node.js 18+ with fetch support');
  console.log('Install Node.js 18+ or run: npm install node-fetch');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});

