"use client";

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TestAPIsPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setIsTesting(true);
    setResults(null);

    try {
      const response = await fetch('/api/test-apis');
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        
        if (data.summary.successful === data.summary.total) {
          toast.success('All APIs working perfectly!');
        } else if (data.summary.successful > 0) {
          toast.warning(`${data.summary.successful}/${data.summary.total} APIs working`);
        } else {
          toast.error('No APIs connected');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to run tests');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      case 'not_configured':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" /> Not Configured</Badge>;
      case 'rate_limited':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Rate Limited</Badge>;
      case 'loading':
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Loading</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const apiInfo = {
    newsApi: { name: 'News API', cost: 'Free (100/day)', color: 'border-blue-500/20' },
    benzinga: { name: 'Benzinga', cost: 'Paid', color: 'border-purple-500/20' },
    polygon: { name: 'Polygon', cost: 'Free (5/min)', color: 'border-green-500/20' },
    alphaVantage: { name: 'Alpha Vantage', cost: 'Free (25/day)', color: 'border-yellow-500/20' },
    openai: { name: 'OpenAI (GPT-4)', cost: '~$0.01/request', color: 'border-pink-500/20' },
    huggingface: { name: 'Hugging Face', cost: 'Free', color: 'border-orange-500/20' },
    alpaca: { name: 'Alpaca', cost: 'Free (Paper)', color: 'border-cyan-500/20' }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                API Integration Test
              </h1>
              <p className="text-muted-foreground mt-2">
                Test all 7 premium APIs to ensure they're properly configured and working
              </p>
            </div>
            <Button 
              onClick={runTests} 
              disabled={isTesting}
              size="lg"
              className="gap-2"
            >
              {isTesting ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run Tests
                </>
              )}
            </Button>
          </div>

          {/* Summary */}
          {results && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Test Summary
                </CardTitle>
                <CardDescription>
                  Tested at {new Date(results.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-600">{results.summary.successful}</span>
                  </div>
                  <span className="text-muted-foreground">/</span>
                  <span>{results.summary.total}</span>
                  <span className="text-sm font-normal text-muted-foreground">APIs Working</span>
                </div>
                <p className="mt-2 text-muted-foreground">{results.summary.message}</p>
                
                {results.summary.notConfigured > 0 && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {results.summary.notConfigured} API(s) not configured. Add keys in Render environment variables.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(results.tests).map(([key, test]: [string, any]) => {
                const info = apiInfo[key as keyof typeof apiInfo];
                return (
                  <Card key={key} className={info.color}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{info.name}</span>
                        {getStatusBadge(test.status)}
                      </CardTitle>
                      <CardDescription>{info.cost}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">{test.message}</p>
                        
                        {test.configured !== undefined && (
                          <Badge variant={test.configured ? "outline" : "secondary"} className="text-xs">
                            {test.configured ? '✓ Key found' : '✗ Key not found'}
                          </Badge>
                        )}
                        
                        {test.data && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                            <pre>{JSON.stringify(test.data, null, 2)}</pre>
                          </div>
                        )}
                        
                        {test.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Error: {test.error}
                          </p>
                        )}
                        
                        {test.note && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            Note: {test.note}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Instructions */}
          {!results && !isTesting && (
            <Card>
              <CardHeader>
                <CardTitle>How to Test</CardTitle>
                <CardDescription>Follow these steps to test your API integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Ensure API Keys Are Set in Render
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Go to Render Dashboard → Your Service → Environment → Check all API keys are added
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                    Click "Run Tests" Button
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    The test will check all 7 APIs and show their connection status
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    Review Results
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Green = Working, Red = Error, Yellow = Not Configured or Rate Limited
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <Zap className="h-4 w-4 inline mr-1" />
                    <strong>Note:</strong> Some APIs (like Alpha Vantage) have rate limits. If you see "Rate Limited", wait a few minutes and try again.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

