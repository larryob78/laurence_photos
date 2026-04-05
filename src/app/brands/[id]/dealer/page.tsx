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
} from "recharts";
import {
  Plus,
  Zap,
  Tag,
  ToggleLeft,
  ToggleRight,
  Send,
  Clock,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from "lucide-react";

/* ---------- types ---------- */
interface OfferRule {
  id: number;
  triggerWhen: string | null;
  triggerKeywords: string[];
  offerText: string | null;
  offerType: string | null;
  isActive: number;
}

interface Negotiation {
  id: number;
  consumerAgent: string;
  inboundQuery: string;
  matchedIntent: string | null;
  offerServed: string | null;
  agentResponse: string | null;
  accepted: number | null;
  revenueAttributed: number | null;
  createdAt: string;
}

interface NegotiateResult {
  matchedIntent?: string;
  offerServed?: string;
  agentResponse?: string;
  accepted?: boolean;
  revenueAttributed?: number;
  error?: string;
}

const CONSUMER_AGENTS = [
  { name: "ChatGPT", color: "#10a37f", emoji: "\ud83d\udfe2" },
  { name: "Claude", color: "#d97706", emoji: "\ud83d\udfe1" },
  { name: "Gemini", color: "#4285f4", emoji: "\ud83d\udd35" },
  { name: "Perplexity", color: "#20b2aa", emoji: "\ud83d\udfe2" },
  { name: "Poe", color: "#8b5cf6", emoji: "\ud83d\udfe3" },
];

const OFFER_TYPES = ["discount", "upgrade", "bundle", "loyalty", "seasonal"];

export default function DealerPage() {
  const { id } = useParams<{ id: string }>();

  /* --- state --- */
  const [rules, setRules] = useState<OfferRule[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  // add form
  const [triggerWhen, setTriggerWhen] = useState("");
  const [keywords, setKeywords] = useState("");
  const [offerText, setOfferText] = useState("");
  const [offerType, setOfferType] = useState("discount");
  const [saving, setSaving] = useState(false);

  // test negotiation
  const [testAgent, setTestAgent] = useState("ChatGPT");
  const [testQuery, setTestQuery] = useState("");
  const [negotiating, setNegotiating] = useState(false);
  const [testResult, setTestResult] = useState<NegotiateResult | null>(null);

  /* --- fetch --- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, negRes] = await Promise.all([
        fetch(`/api/brands/${id}/offers`),
        fetch(`/api/brands/${id}/negotiate`),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (negRes.ok) setNegotiations(await negRes.json());
    } catch (e) {
      console.error("Fetch failed", e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* --- handlers --- */
  const addRule = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggerWhen,
          triggerKeywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          offerText,
          offerType,
        }),
      });
      if (res.ok) {
        setTriggerWhen("");
        setKeywords("");
        setOfferText("");
        setOfferType("discount");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const toggleRule = async (rule: OfferRule) => {
    try {
      await fetch(`/api/brands/${id}/offers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: rule.isActive ? 0 : 1 }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const runNegotiation = async () => {
    if (!testQuery.trim()) return;
    setNegotiating(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/brands/${id}/negotiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumerAgent: testAgent, inboundQuery: testQuery }),
      });
      const data = await res.json();
      setTestResult(data);
      fetchData();
    } catch (e) {
      console.error(e);
      setTestResult({ error: "Negotiation request failed" });
    }
    setNegotiating(false);
  };

  /* --- computed --- */
  const acceptanceByAgent = CONSUMER_AGENTS.map((a) => {
    const agentNegs = negotiations.filter((n) => n.consumerAgent === a.name);
    const accepted = agentNegs.filter((n) => n.accepted === 1).length;
    return {
      name: a.name,
      total: agentNegs.length,
      accepted,
      rate: agentNegs.length > 0 ? Math.round((accepted / agentNegs.length) * 100) : 0,
      color: a.color,
    };
  });

  const totalRevenue = negotiations.reduce(
    (s, n) => s + (n.revenueAttributed || 0),
    0
  );
  const totalAccepted = negotiations.filter((n) => n.accepted === 1).length;

  /* ============================================================ */
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded bg-trust/10 border border-trust/30 flex items-center justify-center">
          <Zap className="w-5 h-5 text-trust" />
        </div>
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-bright">The Dealer</h1>
          <p className="text-xs text-dim">Offer rules, negotiation testing, and deal analytics</p>
        </div>
        <button
          onClick={fetchData}
          className="ml-auto p-2 border border-border rounded hover:bg-surface transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-dim ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Revenue banner */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-accent/20 bg-accent/5 rounded-lg p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">Revenue Attributed</div>
          <div className="font-syne text-2xl font-extrabold text-accent">
            ${totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="border border-accent/20 bg-accent/5 rounded-lg p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">Negotiations</div>
          <div className="font-syne text-2xl font-extrabold text-bright">{negotiations.length}</div>
        </div>
        <div className="border border-accent/20 bg-accent/5 rounded-lg p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">Acceptance Rate</div>
          <div className="font-syne text-2xl font-extrabold text-accent">
            {negotiations.length > 0
              ? Math.round((totalAccepted / negotiations.length) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========== LEFT: Offer Rules ========== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-trust" />
            <h2 className="font-syne text-lg font-extrabold text-bright">Offer Rules</h2>
            <span className="text-xs text-dim ml-auto">{rules.length} rules</span>
          </div>

          {/* Existing rules */}
          <div className="space-y-3 mb-6 max-h-[360px] overflow-y-auto pr-1">
            {rules.length === 0 && !loading && (
              <div className="text-sm text-dim border border-border rounded-lg p-6 text-center">
                No offer rules yet. Add one below.
              </div>
            )}
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 transition-colors ${
                  rule.isActive
                    ? "border-trust/30 bg-trust/5"
                    : "border-border bg-surface/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-trust/20 text-trust uppercase tracking-wider font-bold">
                      {rule.offerType || "discount"}
                    </span>
                    {rule.triggerKeywords?.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-data/10 text-data border border-data/20"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => toggleRule(rule)} className="shrink-0 ml-2">
                    {rule.isActive ? (
                      <ToggleRight className="w-5 h-5 text-accent" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-dim" />
                    )}
                  </button>
                </div>
                {rule.triggerWhen && (
                  <p className="text-xs text-dim mb-1">
                    <span className="text-text">When:</span> {rule.triggerWhen}
                  </p>
                )}
                {rule.offerText && (
                  <p className="text-xs text-bright">{rule.offerText}</p>
                )}
              </div>
            ))}
          </div>

          {/* Add form */}
          <div className="border border-border rounded-lg p-4 bg-surface/50">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-bright uppercase tracking-wider">
                Add Offer Rule
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                  When agent asks about
                </label>
                <input
                  value={triggerWhen}
                  onChange={(e) => setTriggerWhen(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-trust/50 outline-none transition-colors"
                  placeholder="e.g. pricing, alternatives, best option..."
                />
              </div>
              <div>
                <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-trust/50 outline-none transition-colors"
                  placeholder="cheap, affordable, best, compare..."
                />
              </div>
              <div>
                <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                  Serve this offer
                </label>
                <textarea
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-trust/50 outline-none transition-colors resize-none"
                  placeholder="20% discount for new customers..."
                />
              </div>
              <div>
                <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                  Offer Type
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-trust/50 outline-none transition-colors"
                >
                  {OFFER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addRule}
                disabled={saving || !triggerWhen.trim()}
                className="w-full py-2 bg-trust text-background font-bold text-xs rounded hover:bg-trust/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Offer Rule"}
              </button>
            </div>
          </div>
        </div>

        {/* ========== RIGHT: Test Negotiation + Chart ========== */}
        <div>
          {/* Test Section */}
          <div className="border border-border rounded-lg p-4 bg-surface/50 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-data" />
              <h2 className="font-syne text-lg font-extrabold text-bright">Test Negotiation</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                  Consumer Agent
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CONSUMER_AGENTS.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => setTestAgent(a.name)}
                      className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                        testAgent === a.name
                          ? "border-data/50 bg-data/10 text-bright"
                          : "border-border text-dim hover:text-text"
                      }`}
                    >
                      {a.emoji} {a.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                  Query
                </label>
                <input
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runNegotiation()}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-data/50 outline-none transition-colors"
                  placeholder="What's the best option for..."
                />
              </div>
              <button
                onClick={runNegotiation}
                disabled={negotiating || !testQuery.trim()}
                className="w-full py-2 bg-data text-background font-bold text-xs rounded hover:bg-data/90 transition-colors disabled:opacity-40"
              >
                {negotiating ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Negotiating...
                  </span>
                ) : (
                  "Negotiate"
                )}
              </button>
            </div>

            {/* result */}
            {testResult && (
              <div className="mt-4 border border-border rounded-lg p-4 bg-background/50">
                {testResult.error ? (
                  <p className="text-xs text-alert">{testResult.error}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          testResult.accepted
                            ? "bg-accent/20 text-accent"
                            : "bg-alert/20 text-alert"
                        }`}
                      >
                        {testResult.accepted ? "ACCEPTED" : "DECLINED"}
                      </span>
                      {testResult.revenueAttributed != null && testResult.revenueAttributed > 0 && (
                        <span className="text-[10px] text-accent flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {testResult.revenueAttributed}
                        </span>
                      )}
                    </div>
                    {testResult.matchedIntent && (
                      <p className="text-[11px] text-dim">
                        <span className="text-text">Intent:</span> {testResult.matchedIntent}
                      </p>
                    )}
                    {testResult.offerServed && (
                      <p className="text-[11px] text-dim">
                        <span className="text-text">Offer:</span> {testResult.offerServed}
                      </p>
                    )}
                    {testResult.agentResponse && (
                      <div className="mt-2 border-t border-border pt-2">
                        <p className="text-[10px] text-dim tracking-widest uppercase mb-1">
                          Agent Response
                        </p>
                        <p className="text-xs text-bright leading-relaxed whitespace-pre-wrap">
                          {testResult.agentResponse}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Acceptance Rate Chart */}
          <div className="border border-border rounded-lg p-4 bg-surface/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-accent" />
              <h2 className="font-syne text-sm font-extrabold text-bright">
                Acceptance Rate by Agent
              </h2>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={acceptanceByAgent} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181828" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#444460", fontSize: 10 }}
                    axisLine={{ stroke: "#181828" }}
                  />
                  <YAxis
                    tick={{ fill: "#444460", fontSize: 10 }}
                    axisLine={{ stroke: "#181828" }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a12",
                      border: "1px solid #181828",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#c8c8e0",
                    }}
                    formatter={(value) => [`${Number(value)}%`, "Rate"]}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {acceptanceByAgent.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Negotiation Log ========== */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-dim" />
          <h2 className="font-syne text-lg font-extrabold text-bright">Negotiation Log</h2>
          <span className="text-xs text-dim ml-2">Last 50</span>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Timestamp
                  </th>
                  <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Agent
                  </th>
                  <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Query
                  </th>
                  <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Offer Served
                  </th>
                  <th className="text-left py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Status
                  </th>
                  <th className="text-right py-2.5 px-4 text-[10px] text-dim tracking-widest uppercase font-normal">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {negotiations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-dim text-sm">
                      No negotiations yet.
                    </td>
                  </tr>
                )}
                {negotiations.map((n) => {
                  const agent = CONSUMER_AGENTS.find((a) => a.name === n.consumerAgent);
                  return (
                    <tr
                      key={n.id}
                      className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                    >
                      <td className="py-2 px-4 text-dim whitespace-nowrap">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="py-2 px-4">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: agent?.color || "#444" }}
                          />
                          <span className="text-text">{n.consumerAgent}</span>
                        </span>
                      </td>
                      <td className="py-2 px-4 text-dim max-w-[200px] truncate">
                        {n.inboundQuery}
                      </td>
                      <td className="py-2 px-4 text-dim max-w-[200px] truncate">
                        {n.offerServed || "-"}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            n.accepted === 1
                              ? "bg-accent/20 text-accent"
                              : n.accepted === 0
                              ? "bg-alert/20 text-alert"
                              : "bg-dim/20 text-dim"
                          }`}
                        >
                          {n.accepted === 1 ? "ACCEPTED" : n.accepted === 0 ? "DECLINED" : "PENDING"}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right text-accent">
                        {n.revenueAttributed ? `$${n.revenueAttributed}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
