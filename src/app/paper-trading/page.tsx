"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComplexOrderForm } from "@/components/complex-order-form";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  History,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";

interface PaperAccount {
  id: number;
  userId: number;
  cashBalance: number;
  initialBalance: number;
  totalEquity: number;
  totalPnl: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Position {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  percentageReturn: number;
}

interface Order {
  id: number;
  symbol: string;
  orderType: string;
  side: string;
  quantity: number;
  filledPrice: number | null;
  status: string;
  createdAt: string;
}

export default function PaperTradingPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({
    symbol: "",
    side: "buy",
    quantity: "0",
    price: "",
    orderType: "market",
    limitPrice: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      loadPaperTradingData();
    }
  }, [session]);

  const loadPaperTradingData = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const userId = (session.user as any).id;

      // Fetch or create paper trading account
      const accountRes = await fetch(`/api/paper-trading/accounts?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let accountData = await accountRes.json();
      
      if (Array.isArray(accountData) && accountData.length === 0) {
        // Initialize new account
        const initRes = await fetch("/api/paper-trading/accounts/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId, initialBalance: 100000 })
        });
        const initData = await initRes.json();
        accountData = initData.account;
      } else if (Array.isArray(accountData)) {
        accountData = accountData[0];
      }

      setAccount(accountData);

      // Fetch portfolio
      const portfolioRes = await fetch(
        `/api/paper-trading/accounts/${accountData.id}/portfolio?accountId=${accountData.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const portfolioData = await portfolioRes.json();
      setPositions(portfolioData.positions || []);

      // Fetch recent orders
      const ordersRes = await fetch(
        `/api/paper-trading/accounts/${accountData.id}/history?accountId=${accountData.id}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ordersData = await ordersRes.json();
      setRecentOrders(ordersData.orders || []);

    } catch (error) {
      console.error("Error loading paper trading data:", error);
      toast.error("Failed to load paper trading data");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!account) return;
    
    // Validate inputs
    if (!orderForm.symbol.trim()) {
      toast.error("Please enter a symbol");
      return;
    }
    
    if (!orderForm.quantity || parseInt(orderForm.quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    if (!orderForm.price || parseFloat(orderForm.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    if (orderForm.orderType === "limit" && (!orderForm.limitPrice || parseFloat(orderForm.limitPrice) <= 0)) {
      toast.error("Please enter a valid limit price");
      return;
    }
    
    try {
      // Find asset by symbol
      const token = localStorage.getItem("bearer_token");
      const assetsRes = await fetch(`/api/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assets = await assetsRes.json();
      const asset = assets.find((a: any) => a.symbol === orderForm.symbol.toUpperCase());
      
      if (!asset) {
        toast.error("Asset not found");
        return;
      }

      const orderData = {
        paperAccountId: account.id,
        assetId: asset.id,
        orderType: orderForm.orderType,
        side: orderForm.side,
        quantity: parseInt(orderForm.quantity),
        marketPrice: parseFloat(orderForm.price),
        limitPrice: orderForm.limitPrice ? parseFloat(orderForm.limitPrice) : undefined
      };

      const res = await fetch("/api/paper-trading/orders/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        toast.success("Order executed successfully!");
        setOrderForm({
          symbol: "",
          side: "buy",
          quantity: "0",
          price: "",
          orderType: "market",
          limitPrice: ""
        });
        loadPaperTradingData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Order execution failed");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    }
  };

  const handleResetAccount = async () => {
    if (!account || !confirm("Are you sure you want to reset your paper trading account? This will delete all positions and orders.")) {
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(
        `/api/paper-trading/accounts/${account.id}/reset?accountId=${account.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        toast.success("Account reset successfully!");
        loadPaperTradingData();
      } else {
        toast.error("Failed to reset account");
      }
    } catch (error) {
      console.error("Error resetting account:", error);
      toast.error("Failed to reset account");
    }
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Paper Trading</h1>
          <p className="text-sm text-muted-foreground">Practice trading with virtual money</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${account?.totalEquity.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${account?.cashBalance.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                (account?.totalPnl || 0) >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                {(account?.totalPnl || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                ${Math.abs(account?.totalPnl || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (account?.totalPnl || 0) >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                {((account?.totalPnl || 0) / (account?.initialBalance || 1) * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Simple Order Entry */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Trade Entry</CardTitle>
              <CardDescription>Enter trades manually with specific prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="SPY, AAPL, etc."
                  value={orderForm.symbol}
                  onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <Label htmlFor="side">Side</Label>
                <select
                  id="side"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={orderForm.side}
                  onChange={(e) => setOrderForm({ ...orderForm, side: e.target.value })}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Number of shares"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="price">Entry Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Price per share"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the price you {orderForm.side === "buy" ? "bought" : "sold"} at
                </p>
              </div>

              <div>
                <Label htmlFor="orderType">Order Type</Label>
                <select
                  id="orderType"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={orderForm.orderType}
                  onChange={(e) => setOrderForm({ ...orderForm, orderType: e.target.value })}
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>

              {orderForm.orderType === "limit" && (
                <div>
                  <Label htmlFor="limitPrice">Limit Price</Label>
                  <Input
                    id="limitPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Limit price"
                    value={orderForm.limitPrice}
                    onChange={(e) => setOrderForm({ ...orderForm, limitPrice: e.target.value })}
                  />
                </div>
              )}

              <Button onClick={handlePlaceOrder} className="w-full">
                Record Trade
              </Button>

              <Button onClick={handleResetAccount} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Account
              </Button>
            </CardContent>
          </Card>

          {/* Positions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>{positions.length} active positions</CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No open positions. Place your first order to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.quantity} shares @ ${position.averageCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${position.marketValue.toFixed(2)}</div>
                        <div className={`text-sm flex items-center justify-end gap-1 ${
                          position.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {position.unrealizedPnl >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          ${Math.abs(position.unrealizedPnl).toFixed(2)} ({position.percentageReturn.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Complex Spread Orders */}
        {account && (
          <div className="mb-6">
            <ComplexOrderForm 
              paperAccountId={account.id} 
              onOrderPlaced={loadPaperTradingData} 
            />
          </div>
        )}

        {/* Recent Orders */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent orders
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border border-border rounded"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        order.side === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {order.side.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{order.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.quantity} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium px-2 py-1 rounded ${
                        order.status === "filled" 
                          ? "bg-green-500/10 text-green-500" 
                          : order.status === "rejected"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {order.status.toUpperCase()}
                      </div>
                      {order.filledPrice && (
                        <div className="text-sm text-muted-foreground mt-1">
                          @ ${order.filledPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

