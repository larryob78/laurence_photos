"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Megaphone,
  DollarSign,
  Zap,
  TrendingUp,
  RefreshCw,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";

/* ---------- types ---------- */
interface PlatformInfo {
  hasAds: boolean;
  reach: string;
  model: string;
}

interface PlatformMatrix {
  [platform: string]: PlatformInfo;
}

interface MediaPlanAllocation {
  platform: string;
  channel: "paid" | "organic";
  budgetAllocation: number;
  estimatedAgentCPM: number;
  strategy: string;
  priority: "high" | "medium" | "low";
}

interface MediaPlan {
  totalBudget: number;
  paidBudget: number;
  organicBudget: number;
  agentCPM: number;
  allocations: MediaPlanAllocation[];
  recommendations: string[];
}

const PLATFORM_COLORS: Record<string, string> = {
  ChatGPT: "#10a37f",
  Claude: "#d97706",
  Gemini: "#4285f4",
  Perplexity: "#20b2aa",
  Poe: "#8b5cf6",
  Copilot: "#ff8800",
};

const PLATFORM_EMOJIS: Record<string, string> = {
  ChatGPT: "\ud83d\udfe2",
  Claude: "\ud83d\udfe1",
  Gemini: "\ud83d\udd35",
  Perplexity: "\ud83d\udfe2",
  Poe: "\ud83d\udfe3",
  Copilot: "\ud83d\udfe0",
};

const STRATEGY_MAP: Record<string, string> = {
  ChatGPT: "Paid placement + organic optimization",
  Claude: "Organic only - high trust factor",
  Gemini: "AI Overviews ads + search integration",
  Perplexity: "Organic citation optimization",
  Poe: "Bot creator partnerships",
  Copilot: "Testing phase - monitor",
};

export default function MediaPage() {
  const { id } = useParams<{ id: string }>();

  const [platformMatrix, setPlatformMatrix] = useState<PlatformMatrix>({});
  const [loading, setLoading] = useState(true);

  // Budget
  const [budget, setBudget] = useState<string>("10000");
  const [generating, setGenerating] = useState(false);
  const [mediaPlan, setMediaPlan] = useState<MediaPlan | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/brands/${id}/media`);
      if (res.ok) {
        const data = await res.json();
        setPlatformMatrix(data.platformMatrix || {});
      }
    } catch (e) {
      console.error("Failed to fetch media data", e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generatePlan = async () => {
    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum <= 0) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/brands/${id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: budgetNum }),
      });
      if (res.ok) {
        const data = await res.json();
        setMediaPlan(data);
      }
    } catch (e) {
      console.error("Failed to generate media plan", e);
    }
    setGenerating(false);
  };

  const platformEntries = Object.entries(platformMatrix);

  // Chart data from media plan
  const allocationChartData =
    mediaPlan?.allocations?.map((a) => ({
      name: a.platform,
      budget: a.budgetAllocation,
      color: PLATFORM_COLORS[a.platform] || "#444460",
      channel: a.channel,
    })) || [];

  const paidTotal = mediaPlan?.paidBudget || 0;
  const organicTotal = mediaPlan?.organicBudget || 0;
  const pieData = [
    { name: "Paid", value: paidTotal, fill: "#ff8800" },
    { name: "Organic", value: organicTotal, fill: "#00ff88" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-accent";
      case "medium":
        return "text-warning";
      case "low":
        return "text-dim";
      default:
        return "text-dim";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-trust/10 border border-trust/30 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-trust" />
        </div>
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-bright">
            Media Planner
          </h1>
          <p className="text-xs text-dim">
            Platform trust matrix, budget allocation, and media strategy
          </p>
        </div>
        <button
          onClick={fetchData}
          className="ml-auto p-2 border border-border rounded hover:bg-surface transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 text-dim ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Platform Trust & Reach Matrix */}
      <section className="border border-border rounded-lg bg-surface/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase">
            Platform Trust & Reach Matrix
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-dim animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left py-3 px-6 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Platform
                  </th>
                  <th className="text-center py-3 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Has Ads
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Reach
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Model
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Our Strategy
                  </th>
                </tr>
              </thead>
              <tbody>
                {platformEntries.map(([name, info]) => {
                  const color = PLATFORM_COLORS[name] || "#444";
                  return (
                    <tr
                      key={name}
                      className="border-b border-border/30 hover:bg-surface/30 transition-colors"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: color,
                        borderLeftStyle: "solid",
                      }}
                    >
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {PLATFORM_EMOJIS[name] || ""}
                          </span>
                          <span
                            className="font-bold text-bright"
                            style={{ color }}
                          >
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {info.hasAds ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-bold">
                            YES
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-dim/10 text-dim border border-dim/20">
                            NO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text">{info.reach}</td>
                      <td className="py-3 px-4 text-dim">{info.model}</td>
                      <td className="py-3 px-4">
                        <span className="text-data">
                          {STRATEGY_MAP[name] || "Monitor"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Budget Allocation Interface */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-4 h-4 text-accent" />
          <h2 className="font-syne text-lg font-extrabold text-bright">
            Budget Allocation
          </h2>
        </div>

        <div className="flex items-end gap-4 mb-8">
          <div className="flex-1 max-w-xs">
            <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
              Total Monthly Budget ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim text-sm">
                $
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-background border border-border rounded pl-7 pr-3 py-2.5 text-sm text-bright font-syne font-extrabold focus:border-accent/50 outline-none transition-colors"
                placeholder="10000"
                min={0}
              />
            </div>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating || !budget || parseFloat(budget) <= 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-background font-bold text-xs rounded hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Media Plan
              </>
            )}
          </button>
        </div>

        {mediaPlan && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="border border-border rounded-lg bg-background/50 p-4">
                <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
                  Total Budget
                </div>
                <div className="font-syne text-xl font-extrabold text-bright">
                  ${mediaPlan.totalBudget?.toLocaleString()}
                </div>
              </div>
              <div className="border border-trust/20 rounded-lg bg-trust/5 p-4">
                <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
                  Paid Channels
                </div>
                <div className="font-syne text-xl font-extrabold text-trust">
                  ${mediaPlan.paidBudget?.toLocaleString()}
                </div>
              </div>
              <div className="border border-accent/20 rounded-lg bg-accent/5 p-4">
                <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
                  Organic Channels
                </div>
                <div className="font-syne text-xl font-extrabold text-accent">
                  ${mediaPlan.organicBudget?.toLocaleString()}
                </div>
              </div>
              <div className="border border-data/20 rounded-lg bg-data/5 p-4">
                <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
                  Agent CPM
                </div>
                <div className="font-syne text-xl font-extrabold text-data">
                  ${mediaPlan.agentCPM?.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Allocation bar chart */}
              <div className="lg:col-span-2 border border-border rounded-lg bg-background/50 p-4">
                <div className="text-[10px] text-dim tracking-widest uppercase mb-3">
                  Per-Platform Allocation
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allocationChartData} barSize={36}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#181828"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#444460", fontSize: 10 }}
                        axisLine={{ stroke: "#181828" }}
                      />
                      <YAxis
                        tick={{ fill: "#444460", fontSize: 10 }}
                        axisLine={{ stroke: "#181828" }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0a0a12",
                          border: "1px solid #181828",
                          borderRadius: 8,
                          fontSize: 11,
                          color: "#c8c8e0",
                        }}
                        formatter={(value) => [
                          `$${Number(value).toLocaleString()}`,
                          "Budget",
                        ]}
                      />
                      <Bar dataKey="budget" radius={[4, 4, 0, 0]}>
                        {allocationChartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.color}
                            fillOpacity={0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Paid vs Organic pie */}
              <div className="border border-border rounded-lg bg-background/50 p-4">
                <div className="text-[10px] text-dim tracking-widest uppercase mb-3">
                  Paid vs Organic
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0a0a12",
                          border: "1px solid #181828",
                          borderRadius: 8,
                          fontSize: 11,
                          color: "#c8c8e0",
                        }}
                        formatter={(value: number) => [
                          `$${value.toLocaleString()}`,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full bg-[#ff8800]" />
                    <span className="text-dim">Paid</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-dim">Organic</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation detail table */}
            {mediaPlan.allocations && mediaPlan.allocations.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                        Platform
                      </th>
                      <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                        Channel
                      </th>
                      <th className="text-right py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                        Budget
                      </th>
                      <th className="text-right py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                        Agent CPM
                      </th>
                      <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                        Strategy
                      </th>
                      <th className="text-center py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediaPlan.allocations.map((alloc, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/30 hover:bg-surface/30 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <span
                            className="font-bold"
                            style={{
                              color:
                                PLATFORM_COLORS[alloc.platform] || "#c8c8e0",
                            }}
                          >
                            {PLATFORM_EMOJIS[alloc.platform] || ""}{" "}
                            {alloc.platform}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              alloc.channel === "paid"
                                ? "bg-trust/10 text-trust border border-trust/20"
                                : "bg-accent/10 text-accent border border-accent/20"
                            }`}
                          >
                            {alloc.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-bright font-bold">
                          ${alloc.budgetAllocation?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-data">
                          ${alloc.estimatedAgentCPM?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-dim max-w-[250px]">
                          {alloc.strategy}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(
                              alloc.priority
                            )}`}
                          >
                            {alloc.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Unified Report / Recommendations */}
      {mediaPlan && mediaPlan.recommendations && (
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-data" />
            <h2 className="font-syne text-lg font-extrabold text-bright">
              Unified Report & Recommendations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="border border-border rounded-lg bg-background/50 p-4">
              <div className="text-[10px] text-dim tracking-widest uppercase mb-3">
                Combined Presence Summary
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-3.5 h-3.5 text-trust" />
                  <div>
                    <div className="text-xs text-text">Paid Platforms</div>
                    <div className="text-[10px] text-dim">
                      {mediaPlan.allocations
                        ?.filter((a) => a.channel === "paid")
                        .map((a) => a.platform)
                        .join(", ") || "None"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-3.5 h-3.5 text-accent" />
                  <div>
                    <div className="text-xs text-text">
                      Organic Platforms
                    </div>
                    <div className="text-[10px] text-dim">
                      {mediaPlan.allocations
                        ?.filter((a) => a.channel === "organic")
                        .map((a) => a.platform)
                        .join(", ") || "None"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-3.5 h-3.5 text-warning" />
                  <div>
                    <div className="text-xs text-text">
                      Estimated Monthly Reach
                    </div>
                    <div className="text-[10px] text-dim">
                      ~{((mediaPlan.totalBudget / mediaPlan.agentCPM) * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                      AI-mediated interactions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="border border-border rounded-lg bg-background/50 p-4">
              <div className="text-[10px] text-dim tracking-widest uppercase mb-3">
                AI Recommendations
              </div>
              <div className="space-y-2">
                {mediaPlan.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5 text-xs shrink-0">
                      {i + 1}.
                    </span>
                    <p className="text-[11px] text-text leading-relaxed">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
