"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, SearchCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Analysis = {
  jobTitle: string;
  seniority: string;
  skillsRequired: string[];
  skillsPreferred: string[];
  responsibilities: string[];
  keywords: string[];
  redFlags: string[];
  suggestedResumeFocus: string[];
};

export default function AtsAnalyzerPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setAnalysis(null);
    try {
      setAnalysis(await api.post<Analysis>("/tools/analyze-jd", { jobDescription }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job description analyzer</h1>
          <p className="text-sm text-muted-foreground">Extract the skills, keywords and resume focus from a real role.</p>
        </div>
        <Link href="/dashboard/career?tab=Alignment" className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline">
          Continue to Alignment <ArrowRight className="size-4" />
        </Link>
      </div>
      <Card>
        <CardContent className="p-5">
          <form onSubmit={analyze} className="space-y-4">
            <textarea
              aria-label="Job description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              minLength={50}
              maxLength={20_000}
              required
              placeholder="Paste the complete job description…"
              className="min-h-64 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button disabled={loading || jobDescription.length < 50}>
              <SearchCheck className="mr-2 size-4" />
              {loading ? "Analyzing…" : "Analyze role"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {analysis && (
        <div className="grid gap-4 md:grid-cols-2">
          <Result title={`${analysis.jobTitle} · ${analysis.seniority}`} items={analysis.responsibilities} />
          <Result title="Required skills" items={analysis.skillsRequired} />
          <Result title="ATS keywords" items={analysis.keywords} />
          <Result title="Resume focus" items={analysis.suggestedResumeFocus} />
          {analysis.redFlags.length > 0 && <Result title="Potential red flags" items={analysis.redFlags} />}
        </div>
      )}
    </div>
  );
}

function Result({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => <li key={item}>• {item}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
