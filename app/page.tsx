"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Debt {
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
}

interface MethodResult {
  monthsToFree: number;
  payoffDate: string;
  totalInterest: number;
  payoffOrder: string[];
}

interface PlanResult {
  avalanche: MethodResult;
  snowball: MethodResult;
  interestSaved: number;
  recommendation: string;
  keyInsight: string;
}

const DEFAULT_DEBTS: Debt[] = [
  { name: "Visa card", balance: "4200", apr: "22.99", minPayment: "84" },
  { name: "Car loan", balance: "8500", apr: "6.9", minPayment: "220" },
  { name: "Personal loan", balance: "2100", apr: "15.99", minPayment: "63" },
];

const verdictColor: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function DebtPayoff() {
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [extraPayment, setExtraPayment] = useState("200");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState("");

  function updateDebt(i: number, field: keyof Debt, value: string) {
    setDebts((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  }

  function addDebt() {
    setDebts((prev) => [...prev, { name: "", balance: "", apr: "", minPayment: "" }]);
  }

  function removeDebt(i: number) {
    setDebts((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debts: debts.map((d) => ({
            name: d.name || "Debt",
            balance: parseFloat(d.balance) || 0,
            apr: parseFloat(d.apr) || 0,
            minPayment: parseFloat(d.minPayment) || 0,
          })),
          extraPayment: parseFloat(extraPayment) || 0,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">Debt Payoff Planner</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debt Payoff Planner</h1>
          <p className="text-gray-500 mt-1">Avalanche vs Snowball — see which method gets you out of debt faster.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-gray-700">Your Debts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_100px_80px_100px_36px] gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
                <span>Debt name</span><span>Balance ($)</span><span>APR (%)</span><span>Min payment ($)</span><span></span>
              </div>
              {debts.map((debt, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_80px_100px_36px] gap-2 items-center">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="e.g. Visa card"
                    value={debt.name}
                    onChange={(e) => updateDebt(i, "name", e.target.value)}
                  />
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="4200"
                    type="number"
                    min="0"
                    value={debt.balance}
                    onChange={(e) => updateDebt(i, "balance", e.target.value)}
                  />
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="19.99"
                    type="number"
                    step="0.01"
                    min="0"
                    value={debt.apr}
                    onChange={(e) => updateDebt(i, "apr", e.target.value)}
                  />
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="84"
                    type="number"
                    min="0"
                    value={debt.minPayment}
                    onChange={(e) => updateDebt(i, "minPayment", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeDebt(i)}
                    disabled={debts.length === 1}
                    className="text-gray-300 hover:text-red-400 disabled:opacity-30 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDebt}
                className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
              >
                + Add another debt
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extra monthly payment
                  </label>
                  <p className="text-xs text-gray-400 mb-2">How much extra can you put toward debt each month, beyond all minimums?</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input
                      className="w-32 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      type="number"
                      min="0"
                      placeholder="200"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(e.target.value)}
                    />
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="shrink-0">
                  {loading ? "Calculating..." : "Compare payoff plans"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mt-6 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm mt-6">
            Running amortization schedules...
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {/* Key insight callout */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
              <p className="text-blue-800 text-sm font-medium">{result.keyInsight}</p>
            </div>

            {/* Side by side comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Avalanche */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-900">Avalanche</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Saves more interest</Badge>
                  </div>
                  <p className="text-xs text-gray-400">Highest APR first</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{result.avalanche.monthsToFree} <span className="text-base font-normal text-gray-500">months</span></p>
                    <p className="text-sm text-gray-500">Debt-free by {result.avalanche.payoffDate}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-1">Total interest paid</p>
                    <p className="text-lg font-semibold text-gray-900">{fmt(result.avalanche.totalInterest)}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-2">Payoff order</p>
                    <ol className="space-y-1">
                      {result.avalanche.payoffOrder.map((name, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400 shrink-0">{i + 1}.</span>{name}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Snowball */}
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-900">Snowball</CardTitle>
                    <Badge className="bg-purple-100 text-purple-800">Faster early wins</Badge>
                  </div>
                  <p className="text-xs text-gray-400">Smallest balance first</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{result.snowball.monthsToFree} <span className="text-base font-normal text-gray-500">months</span></p>
                    <p className="text-sm text-gray-500">Debt-free by {result.snowball.payoffDate}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-1">Total interest paid</p>
                    <p className="text-lg font-semibold text-gray-900">{fmt(result.snowball.totalInterest)}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-2">Payoff order</p>
                    <ol className="space-y-1">
                      {result.snowball.payoffOrder.map((name, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400 shrink-0">{i + 1}.</span>{name}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-gray-700">Which should I choose?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{result.recommendation}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
