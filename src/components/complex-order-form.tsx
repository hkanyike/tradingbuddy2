"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ComplexOrderFormProps {
  paperAccountId: number;
  onOrderPlaced: () => void;
}

export function ComplexOrderForm({ paperAccountId, onOrderPlaced }: ComplexOrderFormProps) {
  const [spreadType, setSpreadType] = useState("straddle");
  const [underlyingSymbol, setUnderlyingSymbol] = useState("");
  const [strikePrice, setStrikePrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiration, setExpiration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!underlyingSymbol || !strikePrice || !quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Fetch asset by symbol
      const assetsRes = await fetch(`/api/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assets = await assetsRes.json();
      const asset = assets.find((a: any) => a.symbol === underlyingSymbol.toUpperCase());
      
      if (!asset) {
        toast.error("Asset not found");
        setSubmitting(false);
        return;
      }

      const strike = parseFloat(strikePrice);
      const qty = parseInt(quantity);
      const marketPrice = strike; // Mock market price

      let legs: any[] = [];

      switch (spreadType) {
        case "straddle":
          // Buy call + Buy put at same strike
          legs = [
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "put"
            }
          ];
          break;

        case "strangle":
          // Buy OTM call + Buy OTM put
          legs = [
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike + 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike - 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "put"
            }
          ];
          break;

        case "calendar":
          // Sell near-term + Buy far-term at same strike
          legs = [
            {
              assetId: asset.id,
              side: "sell",
              quantity: qty,
              strikePrice: strike,
              expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike,
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            }
          ];
          break;

        case "iron_condor":
          // Sell call spread + Sell put spread
          legs = [
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike - 10,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "put"
            },
            {
              assetId: asset.id,
              side: "sell",
              quantity: qty,
              strikePrice: strike - 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "put"
            },
            {
              assetId: asset.id,
              side: "sell",
              quantity: qty,
              strikePrice: strike + 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike + 10,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            }
          ];
          break;

        case "butterfly":
          // Buy 1 lower + Sell 2 middle + Buy 1 higher
          legs = [
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike - 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "sell",
              quantity: qty * 2,
              strikePrice: strike,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike + 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            }
          ];
          break;

        case "vertical":
          // Bull call spread: Buy lower + Sell higher
          legs = [
            {
              assetId: asset.id,
              side: "buy",
              quantity: qty,
              strikePrice: strike,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            },
            {
              assetId: asset.id,
              side: "sell",
              quantity: qty,
              strikePrice: strike + 5,
              expirationDate: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              optionType: "call"
            }
          ];
          break;
      }

      const res = await fetch("/api/paper-trading/orders/complex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paperAccountId,
          spreadType,
          underlyingSymbol: underlyingSymbol.toUpperCase(),
          legs,
          marketPrice
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${spreadType.charAt(0).toUpperCase() + spreadType.slice(1)} executed successfully!`);
        setUnderlyingSymbol("");
        setStrikePrice("");
        setQuantity("1");
        onOrderPlaced();
      } else {
        const error = await res.json();
        toast.error(error.error || "Order execution failed");
      }
    } catch (error) {
      console.error("Error placing complex order:", error);
      toast.error("Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complex Spread Orders</CardTitle>
        <CardDescription>Execute multi-leg options strategies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="spreadType">Spread Type</Label>
          <select
            id="spreadType"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={spreadType}
            onChange={(e) => setSpreadType(e.target.value)}
          >
            <option value="straddle">Straddle (Long)</option>
            <option value="strangle">Strangle (Long)</option>
            <option value="calendar">Calendar Spread</option>
            <option value="iron_condor">Iron Condor</option>
            <option value="butterfly">Butterfly</option>
            <option value="vertical">Vertical Spread</option>
          </select>
        </div>

        <div>
          <Label htmlFor="underlyingSymbol">Underlying Symbol</Label>
          <Input
            id="underlyingSymbol"
            placeholder="SPY, AAPL, etc."
            value={underlyingSymbol}
            onChange={(e) => setUnderlyingSymbol(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <Label htmlFor="strikePrice">Strike Price (ATM)</Label>
          <Input
            id="strikePrice"
            type="number"
            step="0.01"
            placeholder="450.00"
            value={strikePrice}
            onChange={(e) => setStrikePrice(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="quantity">Quantity (Contracts)</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="p-3 bg-muted/50 rounded text-xs space-y-1">
          <p className="font-medium">Strategy: {spreadType.charAt(0).toUpperCase() + spreadType.slice(1)}</p>
          {spreadType === "straddle" && <p>• Buy call + put at same strike (neutral volatility play)</p>}
          {spreadType === "strangle" && <p>• Buy OTM call + OTM put (lower cost than straddle)</p>}
          {spreadType === "calendar" && <p>• Sell near-term + buy far-term (theta capture)</p>}
          {spreadType === "iron_condor" && <p>• Sell call spread + put spread (defined risk income)</p>}
          {spreadType === "butterfly" && <p>• Limited risk/reward at middle strike</p>}
          {spreadType === "vertical" && <p>• Directional spread with defined max loss</p>}
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? "Executing..." : "Execute Spread"}
        </Button>
      </CardContent>
    </Card>
  );
}
