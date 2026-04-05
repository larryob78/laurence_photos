"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Loader2,
  Terminal,
  Check,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface OfferRule {
  triggerWhen: string;
  triggerKeywords: string[];
  offerText: string;
  offerType: string;
}

interface TrustClaim {
  category: string;
  statement: string;
  claimedValue: string;
  trustWeight: number;
}

interface GovernancePolicy {
  policyType: string;
  rule: string;
  enforcement: string;
}

interface FormState {
  brandName: string;
  category: string;
  description: string;
  personality: string;
  competitors: string[];
  auditQueries: string[];
  offerRules: OfferRule[];
  trustClaims: TrustClaim[];
  governancePolicies: GovernancePolicy[];
  brandDataCard: Record<string, unknown> | null;
}

const CATEGORIES = [
  "Ferry Transport",
  "Grocery Retail",
  "Tourism",
  "SaaS",
  "Finance",
  "Healthcare",
  "E-Commerce",
  "Travel",
];

const INITIAL_STATE: FormState = {
  brandName: "",
  category: "",
  description: "",
  personality: "",
  competitors: [],
  auditQueries: [],
  offerRules: [],
  trustClaims: [],
  governancePolicies: [],
  brandDataCard: null,
};

/* ------------------------------------------------------------------ */
/* Terminal loading animation lines                                    */
/* ------------------------------------------------------------------ */

const LOADING_LINES = [
  "> Initializing brand intelligence engine...",
  "> Scanning competitive landscape...",
  "> Analyzing market positioning...",
  "> Generating audit query matrix...",
  "> Building offer rule set...",
  "> Compiling trust claims...",
  "> Defining governance policies...",
  "> Assembling brand data card...",
  "> Finalizing agent configuration...",
];

/* ------------------------------------------------------------------ */
/* Collapsible Section                                                 */
/* ------------------------------------------------------------------ */

function Section({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-dim" />
          ) : (
            <ChevronRight className="w-4 h-4 text-dim" />
          )}
          <span className="text-sm font-semibold text-bright">{title}</span>
        </div>
        {count !== undefined && (
          <span className="text-[10px] text-dim bg-background px-2 py-0.5 rounded border border-border">
            {count} items
          </span>
        )}
      </button>
      {open && <div className="p-4 border-t border-border">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editable Tag List                                                   */
/* ------------------------------------------------------------------ */

function TagList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const val = input.trim();
    if (val && !items.includes(val)) {
      onChange([...items, val]);
      setInput("");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded text-text"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-dim hover:text-alert transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs text-text placeholder:text-dim focus:outline-none focus:border-accent/40 transition-colors"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-2 py-1.5 text-xs border border-border rounded text-dim hover:text-accent hover:border-accent/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function CreateBrandPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [generating, setGenerating] = useState(false);
  const [generatingLine, setGeneratingLine] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- helpers ---- */

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateOfferRule = (index: number, field: keyof OfferRule, value: string | string[]) => {
    setForm((prev) => {
      const rules = [...prev.offerRules];
      rules[index] = { ...rules[index], [field]: value };
      return { ...prev, offerRules: rules };
    });
  };

  const updateTrustClaim = (index: number, field: keyof TrustClaim, value: string | number) => {
    setForm((prev) => {
      const claims = [...prev.trustClaims];
      claims[index] = { ...claims[index], [field]: value };
      return { ...prev, trustClaims: claims };
    });
  };

  const updatePolicy = (index: number, field: keyof GovernancePolicy, value: string) => {
    setForm((prev) => {
      const policies = [...prev.governancePolicies];
      policies[index] = { ...policies[index], [field]: value };
      return { ...prev, governancePolicies: policies };
    });
  };

  const updateQuery = (index: number, value: string) => {
    setForm((prev) => {
      const queries = [...prev.auditQueries];
      queries[index] = value;
      return { ...prev, auditQueries: queries };
    });
  };

  /* ---- AI autocomplete ---- */

  const autoGenerate = async () => {
    if (!form.brandName.trim() || !form.category.trim()) {
      setError("Brand name and category are required to auto-generate.");
      return;
    }
    setError(null);
    setGenerating(true);
    setGeneratingLine(0);

    // Animate loading lines
    const interval = setInterval(() => {
      setGeneratingLine((prev) => {
        if (prev < LOADING_LINES.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      const res = await fetch("/api/brands/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: form.brandName.trim(),
          category: form.category.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Auto-generate failed");
      }

      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        description: data.description || "",
        personality: data.personality || "",
        competitors: Array.isArray(data.competitors) ? data.competitors : [],
        auditQueries: Array.isArray(data.auditQueries) ? data.auditQueries : [],
        offerRules: Array.isArray(data.offerRules) ? data.offerRules : [],
        trustClaims: Array.isArray(data.trustClaims) ? data.trustClaims : [],
        governancePolicies: Array.isArray(data.governancePolicies)
          ? data.governancePolicies
          : [],
        brandDataCard: data.brandDataCard || null,
      }));
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-generate failed");
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  /* ---- save brand ---- */

  const saveBrand = async () => {
    if (!form.brandName.trim() || !form.category.trim()) {
      setError("Brand name and category are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.brandName.trim(),
          category: form.category.trim(),
          description: form.description || undefined,
          personality: form.personality || undefined,
          competitors: form.competitors.length > 0 ? form.competitors : undefined,
          auditQueries:
            form.auditQueries.length > 0 ? form.auditQueries : undefined,
          offerRules: form.offerRules.length > 0 ? form.offerRules : undefined,
          trustClaims: form.trustClaims.length > 0 ? form.trustClaims : undefined,
          governancePolicies:
            form.governancePolicies.length > 0
              ? form.governancePolicies
              : undefined,
          brandDataCard: form.brandDataCard || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create brand");
      }

      const data = await res.json();
      router.push(`/brands/${data.brand.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setSaving(false);
    }
  };

  /* ---- input classes ---- */

  const inputClass =
    "w-full bg-background border border-border rounded px-3 py-2 text-sm text-text placeholder:text-dim focus:outline-none focus:border-accent/40 transition-colors font-mono";
  const labelClass =
    "block text-[10px] text-dim uppercase tracking-wider mb-1.5";

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-8 h-8 rounded border border-border text-dim hover:text-accent hover:border-accent/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-syne text-2xl font-extrabold tracking-tight text-bright">
            Deploy Brand Agent
          </h1>
          <p className="text-xs text-dim mt-0.5">
            Enter name + category, then let AI build your entire agent config
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-alert/10 border border-alert/30 rounded-lg px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-alert shrink-0" />
          <span className="text-sm text-alert">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-alert/60 hover:text-alert transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top inputs + generate button */}
      <div className="bg-surface border border-border rounded-lg p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelClass}>Brand Name</label>
            <input
              type="text"
              value={form.brandName}
              onChange={(e) => update("brandName", e.target.value)}
              placeholder="e.g. Fjord Line"
              className={inputClass}
              disabled={generating}
            />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer pr-8`}
                disabled={generating}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={autoGenerate}
          disabled={generating || !form.brandName.trim() || !form.category.trim()}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent text-background font-bold text-sm rounded hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Brand Intelligence...
            </>
          ) : generated ? (
            <>
              <Check className="w-4 h-4" />
              Re-Generate with AI
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Auto-Generate with AI
            </>
          )}
        </button>
      </div>

      {/* Terminal loading animation */}
      {generating && (
        <div className="bg-background border border-accent/20 rounded-lg p-4 mb-6 font-mono text-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent text-[10px] uppercase tracking-wider">
              napkin agent builder
            </span>
          </div>
          <div className="space-y-1">
            {LOADING_LINES.slice(0, generatingLine + 1).map((line, i) => (
              <div
                key={i}
                className={`${
                  i === generatingLine
                    ? "text-accent"
                    : "text-dim"
                } transition-colors`}
              >
                {line}
                {i === generatingLine && (
                  <span className="inline-block w-1.5 h-3 bg-accent ml-1 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated form sections */}
      {(generated || form.description) && !generating && (
        <div className="space-y-4">
          {/* Description */}
          <Section title="Description" defaultOpen>
            <label className={labelClass}>Brand Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder="Describe the brand..."
            />
          </Section>

          {/* Agent Personality */}
          <Section title="Agent Personality" defaultOpen>
            <label className={labelClass}>AI Agent Personality Prompt</label>
            <textarea
              value={form.personality}
              onChange={(e) => update("personality", e.target.value)}
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder='You are the brand agent for...'
            />
          </Section>

          {/* Competitors */}
          <Section
            title="Competitors"
            count={form.competitors.length}
            defaultOpen
          >
            <TagList
              items={form.competitors}
              onChange={(items) => update("competitors", items)}
              placeholder="Add competitor..."
            />
          </Section>

          {/* Audit Queries */}
          <Section
            title="Audit Queries"
            count={form.auditQueries.length}
          >
            <div className="space-y-2">
              {form.auditQueries.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-dim w-5 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateQuery(i, e.target.value)}
                    className={`${inputClass} text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "auditQueries",
                        form.auditQueries.filter((_, idx) => idx !== i)
                      )
                    }
                    className="text-dim hover:text-alert transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update("auditQueries", [...form.auditQueries, ""])
                }
                className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors mt-2"
              >
                <Plus className="w-3 h-3" />
                Add query
              </button>
            </div>
          </Section>

          {/* Offer Rules */}
          <Section
            title="Offer Rules"
            count={form.offerRules.length}
          >
            <div className="space-y-4">
              {form.offerRules.map((rule, i) => (
                <div
                  key={i}
                  className="bg-background border border-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-dim uppercase tracking-wider">
                      Rule {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "offerRules",
                          form.offerRules.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-dim hover:text-alert transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Trigger</label>
                      <input
                        type="text"
                        value={rule.triggerWhen}
                        onChange={(e) =>
                          updateOfferRule(i, "triggerWhen", e.target.value)
                        }
                        className={`${inputClass} text-xs`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select
                        value={rule.offerType}
                        onChange={(e) =>
                          updateOfferRule(i, "offerType", e.target.value)
                        }
                        className={`${inputClass} text-xs appearance-none`}
                      >
                        <option value="discount">Discount</option>
                        <option value="bundle">Bundle</option>
                        <option value="trial">Trial</option>
                        <option value="loyalty">Loyalty</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Keywords</label>
                    <TagList
                      items={
                        Array.isArray(rule.triggerKeywords)
                          ? rule.triggerKeywords
                          : []
                      }
                      onChange={(items) =>
                        updateOfferRule(i, "triggerKeywords", items)
                      }
                      placeholder="Add keyword..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Offer Text</label>
                    <input
                      type="text"
                      value={rule.offerText}
                      onChange={(e) =>
                        updateOfferRule(i, "offerText", e.target.value)
                      }
                      className={`${inputClass} text-xs`}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update("offerRules", [
                    ...form.offerRules,
                    {
                      triggerWhen: "",
                      triggerKeywords: [],
                      offerText: "",
                      offerType: "discount",
                    },
                  ])
                }
                className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add rule
              </button>
            </div>
          </Section>

          {/* Trust Claims */}
          <Section
            title="Trust Claims"
            count={form.trustClaims.length}
          >
            <div className="space-y-3">
              {form.trustClaims.map((claim, i) => (
                <div
                  key={i}
                  className="bg-background border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-dim uppercase tracking-wider">
                      Claim {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "trustClaims",
                          form.trustClaims.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-dim hover:text-alert transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className={labelClass}>Category</label>
                      <select
                        value={claim.category}
                        onChange={(e) =>
                          updateTrustClaim(i, "category", e.target.value)
                        }
                        className={`${inputClass} text-xs appearance-none`}
                      >
                        {[
                          "product",
                          "service",
                          "sustainability",
                          "pricing",
                          "quality",
                          "safety",
                          "privacy",
                          "accessibility",
                          "awards",
                          "certifications",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className={labelClass}>Statement</label>
                      <input
                        type="text"
                        value={claim.statement}
                        onChange={(e) =>
                          updateTrustClaim(i, "statement", e.target.value)
                        }
                        className={`${inputClass} text-xs`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Value</label>
                      <input
                        type="text"
                        value={claim.claimedValue}
                        onChange={(e) =>
                          updateTrustClaim(i, "claimedValue", e.target.value)
                        }
                        className={`${inputClass} text-xs`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Weight</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="2.0"
                        value={claim.trustWeight}
                        onChange={(e) =>
                          updateTrustClaim(
                            i,
                            "trustWeight",
                            parseFloat(e.target.value) || 1.0
                          )
                        }
                        className={`${inputClass} text-xs`}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update("trustClaims", [
                    ...form.trustClaims,
                    {
                      category: "product",
                      statement: "",
                      claimedValue: "",
                      trustWeight: 1.0,
                    },
                  ])
                }
                className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add claim
              </button>
            </div>
          </Section>

          {/* Governance Policies */}
          <Section
            title="Governance Policies"
            count={form.governancePolicies.length}
          >
            <div className="space-y-3">
              {form.governancePolicies.map((policy, i) => (
                <div
                  key={i}
                  className="bg-background border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-dim uppercase tracking-wider">
                      Policy {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "governancePolicies",
                          form.governancePolicies.filter(
                            (_, idx) => idx !== i
                          )
                        )
                      }
                      className="text-dim hover:text-alert transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Type</label>
                      <select
                        value={policy.policyType}
                        onChange={(e) =>
                          updatePolicy(i, "policyType", e.target.value)
                        }
                        className={`${inputClass} text-xs appearance-none`}
                      >
                        {["tone", "claims", "pricing", "competitor", "legal"].map(
                          (t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Rule</label>
                      <input
                        type="text"
                        value={policy.rule}
                        onChange={(e) =>
                          updatePolicy(i, "rule", e.target.value)
                        }
                        className={`${inputClass} text-xs`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Enforcement</label>
                      <select
                        value={policy.enforcement}
                        onChange={(e) =>
                          updatePolicy(i, "enforcement", e.target.value)
                        }
                        className={`${inputClass} text-xs appearance-none`}
                      >
                        <option value="block">Block</option>
                        <option value="warn">Warn</option>
                        <option value="flag">Flag</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update("governancePolicies", [
                    ...form.governancePolicies,
                    { policyType: "tone", rule: "", enforcement: "warn" },
                  ])
                }
                className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add policy
              </button>
            </div>
          </Section>

          {/* Brand Data Card Preview */}
          {form.brandDataCard && (
            <Section title="Brand Data Card (JSON-LD)" defaultOpen>
              <pre className="bg-background border border-border rounded-lg p-4 text-xs text-data overflow-x-auto max-h-80 overflow-y-auto font-mono">
                {JSON.stringify(form.brandDataCard, null, 2)}
              </pre>
            </Section>
          )}

          {/* Submit */}
          <div className="pt-4 pb-8">
            <button
              type="button"
              onClick={saveBrand}
              disabled={saving || !form.brandName.trim() || !form.category.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-background font-bold text-sm rounded-lg hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying Brand Agent...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Brand Agent
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
