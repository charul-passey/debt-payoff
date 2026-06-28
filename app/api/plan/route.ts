import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

interface Debt {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

function computeSchedule(debts: Debt[], extraPayment: number, method: "avalanche" | "snowball") {
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const now = new Date();

  // deep copy
  let remaining = debts.map((d) => ({ ...d, paid: false }));
  let totalInterest = 0;
  const payoffOrder: string[] = [];
  let months = 0;

  while (remaining.some((d) => !d.paid) && months < 360) {
    months++;

    // accrue interest and apply minimums
    for (const d of remaining) {
      if (d.paid) continue;
      const interest = (d.balance * (d.apr / 100)) / 12;
      totalInterest += interest;
      d.balance += interest;
      const payment = Math.min(d.minPayment, d.balance);
      d.balance -= payment;
      if (d.balance <= 0.01) {
        d.balance = 0;
        d.paid = true;
        payoffOrder.push(d.name);
      }
    }

    // apply extra payment to priority debt
    let extra = extraPayment;
    while (extra > 0) {
      const active = remaining.filter((d) => !d.paid);
      if (active.length === 0) break;

      const target = method === "avalanche"
        ? active.reduce((a, b) => (b.apr > a.apr ? b : a))
        : active.reduce((a, b) => (b.balance < a.balance ? b : a));

      const pay = Math.min(extra, target.balance);
      target.balance -= pay;
      extra -= pay;

      if (target.balance <= 0.01) {
        target.balance = 0;
        target.paid = true;
        if (!payoffOrder.includes(target.name)) payoffOrder.push(target.name);
      }
    }
  }

  const payoffDate = new Date(now.getFullYear(), now.getMonth() + months);
  return {
    monthsToFree: months,
    payoffDate: `${MONTH_NAMES[payoffDate.getMonth()]} ${payoffDate.getFullYear()}`,
    totalInterest: Math.round(totalInterest),
    payoffOrder,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { debts, extraPayment } = await req.json() as { debts: Debt[]; extraPayment: number };

    if (!debts?.length) {
      return NextResponse.json({ error: "No debts provided" }, { status: 400 });
    }

    const avalanche = computeSchedule(debts, extraPayment, "avalanche");
    const snowball = computeSchedule(debts, extraPayment, "snowball");
    const interestSaved = Math.abs(snowball.totalInterest - avalanche.totalInterest);

    const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
    const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `A user has the following debts (total balance $${totalBalance.toFixed(0)}, total minimum payments $${totalMin}/mo, extra payment $${extraPayment}/mo):
${debts.map((d) => `- ${d.name}: $${d.balance} at ${d.apr}% APR, $${d.minPayment}/mo minimum`).join("\n")}

Avalanche result: ${avalanche.monthsToFree} months, $${avalanche.totalInterest} total interest, payoff order: ${avalanche.payoffOrder.join(", ")}
Snowball result: ${snowball.monthsToFree} months, $${snowball.totalInterest} total interest, payoff order: ${snowball.payoffOrder.join(", ")}
Interest saved by Avalanche: $${interestSaved}

Write a short, honest recommendation (2-3 sentences) for which method suits this person, considering their specific debt profile. Then write a punchy one-sentence "key insight" callout summarizing the most important takeaway.

Respond ONLY with valid JSON (no markdown):
{
  "recommendation": "...",
  "keyInsight": "..."
}`
      }]
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      .replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    const { recommendation, keyInsight } = JSON.parse(raw);

    return NextResponse.json({ avalanche, snowball, interestSaved, recommendation, keyInsight });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
