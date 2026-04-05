"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Copy,
  Check,
  Play,
  FileKey,
  AlertTriangle,
  Search,
  Fingerprint,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Gauge } from "@/components/ui/gauge";

interface Claim {
  id: number;
  brandId: number | null;
  category: string | null;
  statement: string | null;
  fieldPath: string | null;
  claimedValue: string | null;
  evidenceType: string | null;
  evidenceSource: string | null;
  evidenceData: string | null;
  evidenceHash: string | null;
  verificationStatus: string | null;
  trustWeight: number | null;
  lastVerified: string | null;
}

interface Attestation {
  id: number;
  brandId: number | null;
  cardHash: string | null;
  trustScore: number | null;
  claimsTotal: number | null;
  claimsVerified: number | null;
  signature: string | null;
  signedBy: string | null;
  validUntil: string | null;
  createdAt: string | null;
}

interface TrustData {
  trustScore: number;
  claims: Claim[];
  attestations: Attestation[];
  latestAttestation: Attestation | null;
}

interface HallucinationResult {
  type: string;
  claim: string;
  expected: string;
  found: string;
  severity: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  verified: {
    icon: CheckCircle,
    color: "text-accent",
    label: "Verified",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    label: "Pending",
  },
  review_needed: {
    icon: Clock,
    color: "text-warning",
    label: "Review Needed",
  },
  unverified: {
    icon: XCircle,
    color: "text-alert",
    label: "Unverified",
  },
};

const EVIDENCE_COLORS: Record<string, string> = {
  api_verified: "#00ff88",
  certificate: "#4488ff",
  registry: "#aa66ff",
  third_party_audit: "#ffcc00",
  government_data: "#ff8800",
  self_declared: "#ff3366",
  user_reviews: "#c8c8e0",
  media_citation: "#444460",
};

export default function TrustPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credential, setCredential] = useState<Record<string, unknown> | null>(
    null
  );
  const [copiedHash, setCopiedHash] = useState(false);
  const [aiResponseText, setAiResponseText] = useState("");
  const [hallucinationLoading, setHallucinationLoading] = useState(false);
  const [hallucinations, setHallucinations] = useState<
    HallucinationResult[] | null
  >(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${id}/trust`);
      if (res.ok) {
        const trustData = await res.json();
        setData(trustData);
      }
    } catch (err) {
      console.error("Failed to fetch trust data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/brands/${id}/trust`, { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  const createAttestation = async () => {
    setAttesting(true);
    try {
      const res = await fetch(`/api/brands/${id}/trust/attest`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Attestation failed:", err);
    } finally {
      setAttesting(false);
    }
  };

  const generateCredential = async () => {
    setCredentialLoading(true);
    try {
      const res = await fetch(`/api/brands/${id}/trust/credential`, {
        method: "POST",
      });
      if (res.ok) {
        const cred = await res.json();
        setCredential(cred);
      }
    } catch (err) {
      console.error("Credential generation failed:", err);
    } finally {
      setCredentialLoading(false);
    }
  };

  const checkHallucinations = async () => {
    if (!aiResponseText.trim()) return;
    setHallucinationLoading(true);
    setHallucinations(null);
    try {
      const res = await fetch(`/api/brands/${id}/trust/hallucinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiResponse: aiResponseText }),
      });
      if (res.ok) {
        const result = await res.json();
        setHallucinations(result.results ?? []);
      }
    } catch (err) {
      console.error("Hallucination check failed:", err);
    } finally {
      setHallucinationLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-trust animate-spin" />
      </div>
    );
  }

  const trustScore = data?.trustScore ?? 0;
  const claims = data?.claims ?? [];
  const latestAttestation = data?.latestAttestation ?? null;

  // Evidence type breakdown
  const evidenceBreakdown: Record<string, number> = {};
  claims.forEach((c) => {
    const type = c.evidenceType || "self_declared";
    evidenceBreakdown[type] = (evidenceBreakdown[type] || 0) + 1;
  });
  const pieData = Object.entries(evidenceBreakdown).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
    fill: EVIDENCE_COLORS[name] || "#444460",
  }));

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-1">
            Trust Agent
          </div>
          <h2 className="font-syne text-lg font-extrabold text-bright flex items-center gap-2">
            <Shield className="w-5 h-5 text-trust" />
            Trust Verification
          </h2>
        </div>
        <button
          onClick={runVerification}
          disabled={verifying}
          className="flex items-center gap-2 px-5 py-2.5 bg-trust/10 border border-trust/30 text-trust text-xs font-mono rounded hover:bg-trust/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run Verification
        </button>
      </div>

      {/* Trust Score Gauge */}
      <section className="border border-border rounded-lg bg-surface/50 p-8 flex flex-col items-center">
        <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-6">
          Trust Score
        </div>
        <Gauge
          value={Math.round(trustScore)}
          size={180}
          color="#ff8800"
        />
        <div className="mt-4 flex items-center gap-6">
          <div className="text-center">
            <div className="font-syne text-lg font-extrabold text-accent">
              {claims.filter((c) => c.verificationStatus === "verified").length}
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider">
              Verified
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-syne text-lg font-extrabold text-warning">
              {
                claims.filter(
                  (c) =>
                    c.verificationStatus === "pending" ||
                    c.verificationStatus === "review_needed"
                ).length
              }
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider">
              Pending
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-syne text-lg font-extrabold text-alert">
              {
                claims.filter((c) => c.verificationStatus === "unverified")
                  .length
              }
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider">
              Unverified
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-syne text-lg font-extrabold text-bright">
              {claims.length}
            </div>
            <div className="text-[10px] text-dim uppercase tracking-wider">
              Total
            </div>
          </div>
        </div>
      </section>

      {/* Claims List + Evidence Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims List */}
        <section className="lg:col-span-2 border border-border rounded-lg bg-surface/50 p-6">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
            Claims ({claims.length})
          </div>
          {claims.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {claims.map((claim) => {
                const status =
                  STATUS_CONFIG[claim.verificationStatus ?? "pending"] ??
                  STATUS_CONFIG.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={claim.id}
                    className="border border-border rounded-lg bg-background/50 p-3 flex items-start gap-3"
                  >
                    <StatusIcon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${status.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-bright/90 font-mono truncate">
                        {claim.statement}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {claim.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-infra/10 border border-infra/20 text-infra">
                            {claim.category}
                          </span>
                        )}
                        {claim.claimedValue && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-data/10 border border-data/20 text-data">
                            {claim.claimedValue}
                          </span>
                        )}
                        {claim.evidenceType && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-dim">
                            {claim.evidenceType.replace(/_/g, " ")}
                          </span>
                        )}
                        {claim.trustWeight != null && (
                          <span className="text-[10px] text-dim">
                            w:{claim.trustWeight.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] shrink-0 ${status.color} uppercase tracking-wider`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-dim">
              No claims registered yet.
            </div>
          )}
        </section>

        {/* Evidence Type Breakdown */}
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
            Evidence Breakdown
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a12",
                    border: "1px solid #181828",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#c8c8e0",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", color: "#444460" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-xs text-dim">
              No evidence data yet.
            </div>
          )}
        </section>
      </div>

      {/* Attestation Details */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-trust" />
            <span className="text-[10px] text-dim tracking-[0.2em] uppercase">
              Attestation Details
            </span>
          </div>
          <button
            onClick={createAttestation}
            disabled={attesting}
            className="flex items-center gap-2 px-4 py-2 bg-trust/10 border border-trust/30 text-trust text-[10px] font-mono rounded hover:bg-trust/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {attesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Fingerprint className="w-3 h-3" />
            )}
            Create New Attestation
          </button>
        </div>

        {latestAttestation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg bg-background/50 p-4">
              <div className="text-[10px] text-dim uppercase tracking-wider mb-1.5">
                Card Hash
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-data font-mono truncate flex-1">
                  {latestAttestation.cardHash
                    ? `${latestAttestation.cardHash.slice(0, 16)}...${latestAttestation.cardHash.slice(-8)}`
                    : "N/A"}
                </code>
                {latestAttestation.cardHash && (
                  <button
                    onClick={() => copyHash(latestAttestation.cardHash!)}
                    className="text-dim hover:text-data transition-colors shrink-0"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="border border-border rounded-lg bg-background/50 p-4">
              <div className="text-[10px] text-dim uppercase tracking-wider mb-1.5">
                HMAC Signature
              </div>
              <code className="text-xs text-infra font-mono truncate block">
                {latestAttestation.signature
                  ? `${latestAttestation.signature.slice(0, 24)}...`
                  : "N/A"}
              </code>
            </div>
            <div className="border border-border rounded-lg bg-background/50 p-4">
              <div className="text-[10px] text-dim uppercase tracking-wider mb-1.5">
                Signed By
              </div>
              <code className="text-xs text-accent font-mono">
                {latestAttestation.signedBy ?? "N/A"}
              </code>
            </div>
            <div className="border border-border rounded-lg bg-background/50 p-4">
              <div className="text-[10px] text-dim uppercase tracking-wider mb-1.5">
                Valid Until
              </div>
              <code className="text-xs text-warning font-mono">
                {latestAttestation.validUntil
                  ? new Date(latestAttestation.validUntil).toLocaleDateString(
                      "en-IE",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "N/A"}
              </code>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-dim">
            No attestation created yet. Create one to generate a cryptographic
            proof of your brand data.
          </div>
        )}
      </section>

      {/* Generate W3C Credential */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileKey className="w-4 h-4 text-data" />
            <span className="text-[10px] text-dim tracking-[0.2em] uppercase">
              W3C Verifiable Credential
            </span>
          </div>
          <button
            onClick={generateCredential}
            disabled={credentialLoading}
            className="flex items-center gap-2 px-4 py-2 bg-data/10 border border-data/30 text-data text-[10px] font-mono rounded hover:bg-data/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {credentialLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileKey className="w-3 h-3" />
            )}
            Generate W3C Credential
          </button>
        </div>

        {credential ? (
          <pre className="text-xs text-text/70 bg-background border border-border rounded p-4 overflow-x-auto max-h-96 overflow-y-auto font-mono">
            {JSON.stringify(credential, null, 2)}
          </pre>
        ) : (
          <div className="text-center py-6 text-xs text-dim">
            Generate a W3C Verifiable Credential to prove brand trust data to
            third parties.
          </div>
        )}
      </section>

      {/* Hallucination Alerts */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-alert" />
          <span className="text-[10px] text-dim tracking-[0.2em] uppercase">
            Hallucination Detection
          </span>
        </div>

        <div className="space-y-3">
          <textarea
            value={aiResponseText}
            onChange={(e) => setAiResponseText(e.target.value)}
            placeholder="Paste an AI response about this brand to check for hallucinations..."
            className="w-full h-28 bg-background border border-border rounded-lg p-3 text-xs text-text font-mono placeholder:text-dim/50 focus:outline-none focus:border-alert/30 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={checkHallucinations}
              disabled={hallucinationLoading || !aiResponseText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-alert/10 border border-alert/30 text-alert text-[10px] font-mono rounded hover:bg-alert/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hallucinationLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              Check for Hallucinations
            </button>
          </div>

          {hallucinations !== null && (
            <div className="space-y-2 mt-4">
              {hallucinations.length === 0 ? (
                <div className="border border-accent/20 rounded-lg bg-accent/5 p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <div className="text-xs text-accent font-mono font-bold">
                      No Hallucinations Detected
                    </div>
                    <div className="text-[10px] text-dim mt-0.5">
                      The AI response appears consistent with verified brand
                      data.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[10px] text-alert tracking-widest uppercase mb-2">
                    {hallucinations.length} Discrepanc
                    {hallucinations.length === 1 ? "y" : "ies"} Found
                  </div>
                  {hallucinations.map((h, i) => (
                    <div
                      key={i}
                      className="border border-alert/20 rounded-lg bg-alert/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-alert mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-alert font-mono font-bold">
                              {h.type}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                h.severity === "high"
                                  ? "bg-alert/20 text-alert"
                                  : h.severity === "medium"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-dim/20 text-dim"
                              }`}
                            >
                              {h.severity}
                            </span>
                          </div>
                          <p className="text-xs text-text/80 mb-1">
                            {h.claim}
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="text-[10px]">
                              <span className="text-dim">Expected: </span>
                              <span className="text-accent">{h.expected}</span>
                            </div>
                            <div className="text-[10px]">
                              <span className="text-dim">Found: </span>
                              <span className="text-alert">{h.found}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
