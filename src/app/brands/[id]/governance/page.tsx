"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Scale,
  Plus,
  Shield,
  AlertTriangle,
  FileText,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";

/* ---------- types ---------- */
interface Policy {
  id: number;
  brandId: number;
  policyType: string;
  rule: string;
  enforcement: string;
  isActive: number;
}

interface ComplianceEntry {
  timestamp: string;
  policyViolated: string;
  triggeringContent: string;
  actionTaken: string;
}

const POLICY_TYPES = [
  "pricing",
  "messaging",
  "competitor",
  "data-sharing",
  "tone",
  "sustainability",
  "legal",
];

const ENFORCEMENT_LEVELS = [
  { value: "block", label: "Block", color: "alert", icon: Shield },
  { value: "warn", label: "Warn", color: "warning", icon: AlertTriangle },
  { value: "log", label: "Log", color: "data", icon: FileText },
];

const RISK_LEVELS = [
  {
    value: "conservative",
    label: "Conservative",
    description: "Strict enforcement. Block violations, minimal flexibility.",
    color: "accent",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Balanced approach. Warn on most violations, block critical ones.",
    color: "warning",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Maximum flexibility. Log everything, block only legal issues.",
    color: "alert",
  },
];

export default function GovernancePage() {
  const { id } = useParams<{ id: string }>();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskTolerance, setRiskTolerance] = useState("moderate");

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [policyType, setPolicyType] = useState("pricing");
  const [rule, setRule] = useState("");
  const [enforcement, setEnforcement] = useState("warn");
  const [saving, setSaving] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRule, setEditRule] = useState("");
  const [editEnforcement, setEditEnforcement] = useState("");

  // Compliance log (mock since no dedicated endpoint)
  const [complianceLog] = useState<ComplianceEntry[]>([]);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/brands/${id}/governance`);
      if (res.ok) {
        const data = await res.json();
        setPolicies(data);
      }
    } catch (e) {
      console.error("Failed to fetch policies", e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const addPolicy = async () => {
    if (!rule.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${id}/governance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyType, rule, enforcement }),
      });
      if (res.ok) {
        setRule("");
        setPolicyType("pricing");
        setEnforcement("warn");
        setShowForm(false);
        fetchPolicies();
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const deletePolicy = async (policyId: number) => {
    try {
      await fetch(`/api/brands/${id}/governance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: policyId, isActive: 0 }),
      });
      fetchPolicies();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setEditRule(policy.rule);
    setEditEnforcement(policy.enforcement);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/brands/${id}/governance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          rule: editRule,
          enforcement: editEnforcement,
        }),
      });
      setEditingId(null);
      fetchPolicies();
    } catch (e) {
      console.error(e);
    }
  };

  const getEnforcementStyle = (level: string) => {
    switch (level) {
      case "block":
        return {
          bg: "bg-alert/10",
          border: "border-alert/30",
          text: "text-alert",
        };
      case "warn":
        return {
          bg: "bg-warning/10",
          border: "border-warning/30",
          text: "text-warning",
        };
      case "log":
        return {
          bg: "bg-data/10",
          border: "border-data/30",
          text: "text-data",
        };
      default:
        return {
          bg: "bg-dim/10",
          border: "border-dim/30",
          text: "text-dim",
        };
    }
  };

  const getPolicyTypeEmoji = (type: string) => {
    const map: Record<string, string> = {
      pricing: "\ud83d\udcb0",
      messaging: "\ud83d\udcac",
      competitor: "\u2694\ufe0f",
      "data-sharing": "\ud83d\udd12",
      tone: "\ud83c\udfa8",
      sustainability: "\ud83c\udf3f",
      legal: "\u2696\ufe0f",
    };
    return map[type] || "\ud83d\udccb";
  };

  const activePolicies = policies.filter((p) => p.isActive === 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-infra/10 border border-infra/30 flex items-center justify-center">
          <Scale className="w-5 h-5 text-infra" />
        </div>
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-bright">
            Governance
          </h1>
          <p className="text-xs text-dim">
            Brand policies, compliance rules, and risk management
          </p>
        </div>
        <button
          onClick={fetchPolicies}
          className="ml-auto p-2 border border-border rounded hover:bg-surface transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 text-dim ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Risk Tolerance Selector */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
          Risk Tolerance
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RISK_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setRiskTolerance(level.value)}
              className={`relative p-4 rounded-lg border text-left transition-all ${
                riskTolerance === level.value
                  ? `border-${level.color}/50 bg-${level.color}/5`
                  : "border-border bg-background/50 hover:border-border hover:bg-surface/30"
              }`}
            >
              {riskTolerance === level.value && (
                <div
                  className={`absolute top-3 right-3 w-5 h-5 rounded-full bg-${level.color}/20 border border-${level.color}/50 flex items-center justify-center`}
                >
                  <Check className={`w-3 h-3 text-${level.color}`} />
                </div>
              )}
              <div
                className={`font-syne text-sm font-extrabold mb-1 ${
                  riskTolerance === level.value
                    ? `text-${level.color}`
                    : "text-text"
                }`}
              >
                {level.label}
              </div>
              <p className="text-[11px] text-dim leading-relaxed">
                {level.description}
              </p>
              {/* Visual bar */}
              <div className="mt-3 h-1.5 rounded-full bg-background overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    level.value === "conservative"
                      ? "w-1/3 bg-accent"
                      : level.value === "moderate"
                      ? "w-2/3 bg-warning"
                      : "w-full bg-alert"
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-border rounded-lg bg-surface/50 p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
            Total Policies
          </div>
          <div className="font-syne text-2xl font-extrabold text-bright">
            {activePolicies.length}
          </div>
        </div>
        <div className="border border-alert/20 rounded-lg bg-alert/5 p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
            Block Rules
          </div>
          <div className="font-syne text-2xl font-extrabold text-alert">
            {activePolicies.filter((p) => p.enforcement === "block").length}
          </div>
        </div>
        <div className="border border-warning/20 rounded-lg bg-warning/5 p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
            Warn Rules
          </div>
          <div className="font-syne text-2xl font-extrabold text-warning">
            {activePolicies.filter((p) => p.enforcement === "warn").length}
          </div>
        </div>
        <div className="border border-data/20 rounded-lg bg-data/5 p-4">
          <div className="text-[10px] text-dim tracking-widest uppercase mb-1">
            Log Rules
          </div>
          <div className="font-syne text-2xl font-extrabold text-data">
            {activePolicies.filter((p) => p.enforcement === "log").length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Policy List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne text-lg font-extrabold text-bright">
              Active Policies
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-background font-bold rounded hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Policy
            </button>
          </div>

          {/* Add Policy Form */}
          {showForm && (
            <div className="border border-accent/30 rounded-lg p-4 bg-accent/5 mb-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                      Policy Type
                    </label>
                    <select
                      value={policyType}
                      onChange={(e) => setPolicyType(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-accent/50 outline-none transition-colors"
                    >
                      {POLICY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {getPolicyTypeEmoji(t)}{" "}
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                      Enforcement Level
                    </label>
                    <div className="flex gap-2">
                      {ENFORCEMENT_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setEnforcement(level.value)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded border transition-colors ${
                            enforcement === level.value
                              ? `border-${level.color}/50 bg-${level.color}/10 text-${level.color}`
                              : "border-border text-dim hover:text-text"
                          }`}
                        >
                          <level.icon className="w-3 h-3" />
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-dim tracking-widest uppercase block mb-1">
                    Rule
                  </label>
                  <textarea
                    value={rule}
                    onChange={(e) => setRule(e.target.value)}
                    rows={2}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-accent/50 outline-none transition-colors resize-none"
                    placeholder="Never disclose pricing below MSRP..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 text-xs border border-border rounded text-dim hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addPolicy}
                    disabled={saving || !rule.trim()}
                    className="px-4 py-1.5 text-xs bg-accent text-background font-bold rounded hover:bg-accent/90 transition-colors disabled:opacity-40"
                  >
                    {saving ? "Saving..." : "Save Policy"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Policy cards */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-dim animate-spin" />
            </div>
          ) : activePolicies.length === 0 ? (
            <div className="text-sm text-dim border border-border rounded-lg p-8 text-center">
              No policies configured. Add one to start governing brand agent
              behavior.
            </div>
          ) : (
            <div className="space-y-3">
              {activePolicies.map((policy) => {
                const enfStyle = getEnforcementStyle(policy.enforcement);
                const isEditing = editingId === policy.id;

                return (
                  <div
                    key={policy.id}
                    className={`border rounded-lg p-4 transition-colors ${enfStyle.border} ${enfStyle.bg}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">
                          {getPolicyTypeEmoji(policy.policyType)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-text uppercase tracking-wider font-bold">
                          {policy.policyType}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${enfStyle.bg} ${enfStyle.text} border ${enfStyle.border}`}
                        >
                          {policy.enforcement}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-1.5 rounded hover:bg-accent/10 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 text-accent" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded hover:bg-alert/10 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-alert" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(policy)}
                              className="p-1.5 rounded hover:bg-surface transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-dim hover:text-text" />
                            </button>
                            <button
                              onClick={() => deletePolicy(policy.id)}
                              className="p-1.5 rounded hover:bg-alert/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-dim hover:text-alert" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editRule}
                          onChange={(e) => setEditRule(e.target.value)}
                          rows={2}
                          className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-bright focus:border-accent/50 outline-none transition-colors resize-none"
                        />
                        <div className="flex gap-2">
                          {ENFORCEMENT_LEVELS.map((level) => (
                            <button
                              key={level.value}
                              onClick={() =>
                                setEditEnforcement(level.value)
                              }
                              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-colors ${
                                editEnforcement === level.value
                                  ? `border-${level.color}/50 bg-${level.color}/10 text-${level.color}`
                                  : "border-border text-dim"
                              }`}
                            >
                              <level.icon className="w-2.5 h-2.5" />
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-bright leading-relaxed">
                        {policy.rule}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compliance Log */}
        <div>
          <h2 className="font-syne text-lg font-extrabold text-bright mb-4">
            Compliance Log
          </h2>
          <div className="border border-border rounded-lg bg-surface/50 overflow-hidden">
            {complianceLog.length === 0 ? (
              <div className="p-6 text-center">
                <Shield className="w-8 h-8 text-accent/30 mx-auto mb-3" />
                <p className="text-xs text-dim">
                  No violations flagged yet.
                </p>
                <p className="text-[10px] text-dim mt-1">
                  Compliance events will appear here when the Dealer processes
                  negotiations.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {complianceLog.map((entry, i) => (
                  <div key={i} className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3 h-3 text-warning" />
                      <span className="text-[10px] text-dim">
                        {new Date(entry.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-text mb-1">
                      Policy:{" "}
                      <span className="text-warning">
                        {entry.policyViolated}
                      </span>
                    </p>
                    <p className="text-[10px] text-dim">
                      {entry.triggeringContent}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/10 text-warning mt-1 inline-block">
                      {entry.actionTaken}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policy Type Legend */}
          <div className="mt-6 border border-border rounded-lg bg-surface/50 p-4">
            <div className="text-[10px] text-dim tracking-widest uppercase mb-3">
              Policy Types
            </div>
            <div className="space-y-2">
              {POLICY_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-sm">{getPolicyTypeEmoji(type)}</span>
                  <span className="text-[11px] text-text capitalize">
                    {type}
                  </span>
                  <span className="text-[10px] text-dim ml-auto">
                    {activePolicies.filter((p) => p.policyType === type).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
