import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { jobDescription } = await req.json();

  if (!jobDescription?.trim()) {
    return NextResponse.json({ error: "Job description is required" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: `You are an expert in inclusive hiring practices. Analyze job descriptions for language that may discourage qualified candidates. Categories: gender-coded language (rockstar, ninja, aggressive, nurturing), age bias (digital native, recent grad), educational gatekeeping, cultural bias (native speaker), ableism, socioeconomic bias.`,
    messages: [
      {
        role: "user",
        content: `Analyze this job description and return ONLY valid JSON (no markdown, no code blocks):
{
  "overallScore": 85,
  "summary": "Brief overall assessment",
  "issues": [
    {
      "phrase": "exact phrase from the text",
      "category": "Gender-coded language",
      "severity": "high",
      "explanation": "Why this is problematic",
      "rewrite": "Suggested alternative phrasing"
    }
  ],
  "positives": ["things the JD does well"],
  "topRecommendations": ["3 most impactful changes"]
}

Severity must be one of: high, medium, low.

Job description:
${jobDescription}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
  }

  const result = JSON.parse(content.text);
  return NextResponse.json(result);
}
