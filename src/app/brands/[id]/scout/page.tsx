"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Play,
  Loader2,
  CheckCircle,
  Star,
  XCircle,
  TrendingUp,
  HelpCircle,
  Terminal,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AuditResult {
  id: number;
  queryText: string | null;
  platform: string | null;
  responseText: string | null;
  brandMentioned: number | null;
  brandRecommended: number | null;
  mentionPosition: number | null;
  sentiment: string | null;
  competitorsMentioned: string | null;
  createdAt: string | null;
}

interface AuditRun {
  id: number;
  brandId: number | null;
  runDate: string | null;
  status: string | null;
  summaryJson: {
    totalQueries: number;
    mentions: number;
    recommendations: number;
    asovScore: number;
    mentionRate: number;
    recommendRate: number;
    avgPosition: number;
  } | null;
  results: AuditResult[];
}

interface AsovDaily {
  id: number;
  date: string | null;
  asovScore: number | null;
  mentionRate: number | null;
  recommendRate: number | null;
  avgPosition: number | null;
  layer1Score: number | null;
  layer2Score: number | null;
  layer3Score: number | null;
  arbScore: number | null;
  competitorScores: string | null;
}

interface LineageResult {
  queryText: string;
  analysis: string;
}

export default function ScoutPage() {
  const params = useParams();
  const id = params.id as string;

  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [asovData, setAsovData] = useState<AsovDaily[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<string[]>([]);
  const [lineageLoading, setLineageLoading] = useState<string | null>(null);
  const [lineageResults, setLineageResults] = useState<
    Record<string, string>
  >({});

  const fetchData = useCallback(async () => {
    try {
      const [runsRes, brandRes] = await Promise.all([
        fetch(`/api/brands/${id}/audit`),
        fetch(`/api/brands/${id}`),
      ]);

      if (runsRes.ok) {
        const runs = await runsRes.json();
        setAuditRuns(runs);
      }

      if (brandRes.ok) {
        const brandData = await brandRes.json();
        // Extract asov daily data if available from brand data
        if (brandData.asovDaily) {
          setAsovData(brandData.asovDaily);
        }
      }
    } catch (err) {
      console.error("Failed to fetch scout data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAudit = async () => {
    setAuditing(true);
    setAuditProgress([
      "> Initializing Scout Agent...",
      "> Connecting to Claude API...",
    ]);

    const progressInterval = setInterval(() => {
      setAuditProgress((prev) => {
        const messages = [
          "> Querying AI models with brand prompts...",
          "> Analyzing mention patterns...",
          "> Extracting competitor signals...",
          "> Calculating sentiment scores...",
          "> Computing ASoV metrics...",
          "> Building recommendation graph...",
          "> Finalizing audit results...",
        ];
        const next = messages[Math.min(prev.length - 2, messages.length - 1)];
        if (prev.includes(next)) return prev;
        return [...prev, next];
      });
    }, 2000);

    try {
      const res = await fetch(`/api/brands/${id}/audit`, { method: "POST" });
      clearInterval(progressInterval);

      if (res.ok) {
        setAuditProgress((prev) => [
          ...prev,
          "> Audit complete. Refreshing data...",
        ]);
        await fetchData();
      } else {
        const err = await res.json();
        setAuditProgress((prev) => [
          ...prev,
          `> ERROR: ${err.error || "Audit failed"}`,
        ]);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setAuditProgress((prev) => [
        ...prev,
        `> ERROR: ${err instanceof Error ? err.message : "Network error"}`,
      ]);
    } finally {
      setAuditing(false);
    }
  };

  const runLineage = async (queryText: string) => {
    setLineageLoading(queryText);
    try {
      const res = await fetch(`/api/brands/${id}/audit/lineage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryText }),
      });
      if (res.ok) {
        const data: LineageResult = await res.json();
        setLineageResults((prev) => ({
          ...prev,
          [queryText]: data.analysis,
        }));
      }
    } catch (err) {
      console.error("Lineage failed:", err);
    } finally {
      setLineageLoading(null);
    }
  };

  // Get the latest audit run
  const latestRun = auditRuns[0] ?? null;
  const results = latestRun?.results ?? [];

  // Build ASoV chart data from asovDaily or audit runs
  const asovChartData =
    asovData.length > 0
      ? asovData.slice(-14).map((d) => ({
          date: d.date?.slice(5) ?? "",
          asov: d.asovScore ?? 0,
          mentions: d.mentionRate ?? 0,
          recommendations: d.recommendRate ?? 0,
        }))
      : auditRuns
          .slice(0, 14)
          .reverse()
          .map((run) => ({
            date: run.runDate?.slice(5, 10) ?? "",
            asov: run.summaryJson?.asovScore ?? 0,
            mentions: run.summaryJson?.mentionRate ?? 0,
            recommendations: run.summaryJson?.recommendRate ?? 0,
          }));

  // Build competitor comparison data
  const competitorMap: Record<string, number> = {};
  results.forEach((r) => {
    if (r.competitorsMentioned) {
      try {
        const comps: string[] = JSON.parse(r.competitorsMentioned);
        comps.forEach((c) => {
          competitorMap[c] = (competitorMap[c] || 0) + 1;
        });
      } catch {
        /* ignore */
      }
    }
  });
  const competitorChartData = Object.entries(competitorMap)
    .map(([name, count]) => ({ name, mentions: count }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-1">
            Scout Agent
          </div>
          <h2 className="font-syne text-lg font-extrabold text-bright flex items-center gap-2">
            <Search className="w-5 h-5 text-data" />
            AI Visibility Audit
          </h2>
        </div>
        <button
          onClick={runAudit}
          disabled={auditing}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 border border-accent/30 text-accent text-xs font-mono rounded hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {auditing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run Live Audit
        </button>
      </div>

      {/* Terminal Animation */}
      {auditing && (
        <section className="border border-accent/20 rounded-lg bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="text-[10px] text-accent tracking-widest uppercase">
              Audit in Progress
            </span>
          </div>
          <div className="font-mono text-xs space-y-1">
            {auditProgress.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.includes("ERROR") ? "text-alert" : "text-accent/80"
                } animate-pulse`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {line}
              </div>
            ))}
            <div className="text-accent animate-pulse">_</div>
          </div>
        </section>
      )}

      {/* Summary Stats */}
      {latestRun?.summaryJson && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border border-border rounded-lg bg-surface/50 p-4">
            <div className="text-[10px] text-dim tracking-widest uppercase mb-2">
              Total Queries
            </div>
            <div className="font-syne text-xl font-extrabold text-bright">
              {latestRun.summaryJson.totalQueries}
            </div>
          </div>
          <div className="border border-border rounded-lg bg-surface/50 p-4">
            <div className="text-[10px] text-dim tracking-widest uppercase mb-2">
              Mentions
            </div>
            <div className="font-syne text-xl font-extrabold text-accent">
              {latestRun.summaryJson.mentions}
            </div>
          </div>
          <div className="border border-border rounded-lg bg-surface/50 p-4">
            <div className="text-[10px] text-dim tracking-widest uppercase mb-2">
              Recommended
            </div>
            <div className="font-syne text-xl font-extrabold text-data">
              {latestRun.summaryJson.recommendations}
            </div>
          </div>
          <div className="border border-border rounded-lg bg-surface/50 p-4">
            <div className="text-[10px] text-dim tracking-widest uppercase mb-2">
              ASoV Score
            </div>
            <div className="font-syne text-xl font-extrabold text-warning">
              {latestRun.summaryJson.asovScore.toFixed(1)}%
            </div>
          </div>
          <div className="border border-border rounded-lg bg-surface/50 p-4">
            <div className="text-[10px] text-dim tracking-widest uppercase mb-2">
              Avg Position
            </div>
            <div className="font-syne text-xl font-extrabold text-infra">
              #{latestRun.summaryJson.avgPosition.toFixed(1)}
            </div>
          </div>
        </section>
      )}

      {/* Audit Results Grid */}
      {results.length > 0 && (
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
            Query Results ({results.length})
          </div>
          <div className="space-y-3">
            {results.map((result) => {
              const mentioned = result.brandMentioned === 1;
              const recommended = result.brandRecommended === 1;
              const missed = !mentioned;
              const sentiment = result.sentiment ?? "neutral";
              const position = result.mentionPosition ?? 0;
              let competitors: string[] = [];
              try {
                competitors = result.competitorsMentioned
                  ? JSON.parse(result.competitorsMentioned)
                  : [];
              } catch {
                /* ignore */
              }

              return (
                <div
                  key={result.id}
                  className="border border-border rounded-lg bg-background/50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-bright font-mono mb-2">
                        {result.queryText}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badges */}
                        {mentioned && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                            <CheckCircle className="w-3 h-3" />
                            MENTIONED
                          </span>
                        )}
                        {recommended && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-data/10 border border-data/20 text-data">
                            <Star className="w-3 h-3" />
                            RECOMMENDED
                          </span>
                        )}
                        {missed && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-alert/10 border border-alert/20 text-alert">
                            <XCircle className="w-3 h-3" />
                            MISSED
                          </span>
                        )}

                        {/* Sentiment */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
                            sentiment === "positive"
                              ? "bg-accent/10 border-accent/20 text-accent"
                              : sentiment === "negative"
                                ? "bg-alert/10 border-alert/20 text-alert"
                                : "bg-warning/10 border-warning/20 text-warning"
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {sentiment.toUpperCase()}
                        </span>

                        {/* Position */}
                        {position > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-infra/10 border border-infra/20 text-infra">
                            Position #{position}
                          </span>
                        )}

                        {/* Competitors */}
                        {competitors.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-dim">
                            <Users className="w-3 h-3" />
                            {competitors.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Decision Lineage Button */}
                    <button
                      onClick={() =>
                        result.queryText && runLineage(result.queryText)
                      }
                      disabled={lineageLoading === result.queryText}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-dim hover:text-infra border border-border hover:border-infra/30 rounded transition-colors disabled:opacity-50 shrink-0"
                    >
                      {lineageLoading === result.queryText ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <HelpCircle className="w-3 h-3" />
                      )}
                      Why?
                    </button>
                  </div>

                  {/* Lineage Analysis */}
                  {result.queryText &&
                    lineageResults[result.queryText] && (
                      <div className="mt-3 p-3 border border-infra/20 rounded bg-infra/5">
                        <div className="text-[10px] text-infra tracking-widest uppercase mb-2">
                          Decision Lineage Analysis
                        </div>
                        <p className="text-xs text-text/80 leading-relaxed whitespace-pre-wrap">
                          {lineageResults[result.queryText]}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ASoV Line Chart */}
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
            ASoV Trend (14 Days)
          </div>
          {asovChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={asovChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#181828" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#444460", fontSize: 10 }}
                  stroke="#181828"
                />
                <YAxis
                  tick={{ fill: "#444460", fontSize: 10 }}
                  stroke="#181828"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a12",
                    border: "1px solid #181828",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#c8c8e0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="asov"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={{ fill: "#00ff88", r: 3 }}
                  name="ASoV %"
                />
                <Line
                  type="monotone"
                  dataKey="mentions"
                  stroke="#4488ff"
                  strokeWidth={1.5}
                  dot={{ fill: "#4488ff", r: 2 }}
                  name="Mention Rate %"
                />
                <Line
                  type="monotone"
                  dataKey="recommendations"
                  stroke="#ffcc00"
                  strokeWidth={1.5}
                  dot={{ fill: "#ffcc00", r: 2 }}
                  name="Recommend Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-xs text-dim">
              No trend data yet. Run an audit to start tracking.
            </div>
          )}
        </section>

        {/* Competitor Comparison */}
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
            Competitor Mentions
          </div>
          {competitorChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={competitorChartData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#181828"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#444460", fontSize: 10 }}
                  stroke="#181828"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#c8c8e0", fontSize: 10 }}
                  stroke="#181828"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a12",
                    border: "1px solid #181828",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#c8c8e0",
                  }}
                />
                <Bar
                  dataKey="mentions"
                  fill="#ff3366"
                  radius={[0, 4, 4, 0]}
                  name="Times Mentioned"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-xs text-dim">
              No competitor data yet.
            </div>
          )}
        </section>
      </div>

      {/* Empty State */}
      {results.length === 0 && !auditing && (
        <section className="border border-border rounded-lg bg-surface/50 p-12 text-center">
          <Search className="w-8 h-8 text-dim mx-auto mb-3" />
          <h3 className="font-syne text-sm font-extrabold text-bright mb-1">
            No Audit Data Yet
          </h3>
          <p className="text-xs text-dim max-w-md mx-auto">
            Run a live audit to see how your brand performs across AI models.
            The Scout agent will query Claude with your configured prompts and
            analyze mention patterns, sentiment, and competitive positioning.
          </p>
        </section>
      )}
    </div>
  );
}
