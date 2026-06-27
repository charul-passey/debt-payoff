"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SAMPLE_JD = `We're looking for a rockstar developer who is a digital native. Must have 5+ years experience (recent grads encouraged to apply). Looking for an aggressive self-starter who can hit the ground running. Native English speaker required. Must be able to work long hours when needed. Ideal candidate will have a degree from a top-tier university. Join our young and energetic team!`;

type Severity = "high" | "medium" | "low";

interface Issue {
  phrase: string;
  category: string;
  severity: Severity;
  explanation: string;
  rewrite: string;
}

interface AnalysisResult {
  overallScore: number;
  summary: string;
  issues: Issue[];
  positives: string[];
  topRecommendations: string[];
}

const severityColor: Record<Severity, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

function scoreLabel(score: number) {
  if (score >= 90) return { label: "Inclusive", color: "bg-green-100 text-green-800" };
  if (score >= 75) return { label: "Good", color: "bg-blue-100 text-blue-800" };
  if (score >= 50) return { label: "Needs Work", color: "bg-yellow-100 text-yellow-800" };
  return { label: "High Bias Risk", color: "bg-red-100 text-red-800" };
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }

  const { label: scoreText, color: scoreColor } = result ? scoreLabel(result.overallScore) : { label: "", color: "" };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Listing Bias Detector</h1>
          <p className="text-gray-500 mt-1">Identify language that may discourage qualified candidates from applying</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Job Description</label>
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setJobDescription(SAMPLE_JD)}
                  >
                    Try an example
                  </button>
                </div>
                <textarea
                  className="w-full h-64 p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste your job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{jobDescription.length} characters</span>
                  <Button onClick={analyze} disabled={!jobDescription.trim() || loading}>
                    {loading ? "Analyzing..." : "Analyze for Bias"}
                  </Button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!result && !loading && (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                Results will appear here after analysis
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                Analyzing for bias patterns...
              </div>
            )}
            {result && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-bold text-gray-900">{result.overallScore}</div>
                      <div>
                        <Badge className={scoreColor}>{scoreText}</Badge>
                        <p className="text-sm text-gray-600 mt-2">{result.summary}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.issues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Flagged Language ({result.issues.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.issues.map((issue, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${severityColor[issue.severity]}`}>
                              {issue.severity}
                            </span>
                            <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                            <span className="text-sm font-medium text-gray-900">"{issue.phrase}"</span>
                          </div>
                          <p className="text-xs text-gray-600">{issue.explanation}</p>
                          <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                            Rewrite: {issue.rewrite}
                          </p>
                          {i < result.issues.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.positives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">What Works Well</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {result.positives.map((p, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-green-500">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {result.topRecommendations.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span> {r}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
