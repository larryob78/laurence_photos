"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge } from "@/components/ui/gauge";
import { Sparkline } from "@/components/ui/sparkline";
import {
  Activity,
  PlusCircle,
  Zap,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Brand {
  id: number;
  name: string;
  category: string;
  description: string | null;
  latestArbScore: number | null;
  latestAsovScore: number | null;
  trustScore: number | null;
  competitors: string[];
  createdAt: string;
  sparklineData: number[];
  negotiationCount: number;
}

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditingBrand, setAuditingBrand] = useState<number | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Failed to fetch brands");
      const data = await res.json();
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const runAudit = async (brandId: number) => {
    setAuditingBrand(brandId);
    try {
      const res = await fetch(`/api/brands/${brandId}/audit`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Audit failed");
      // Refresh brand data after audit
      await fetchBrands();
    } catch (err) {
      console.error("Audit error:", err);
    } finally {
      setAuditingBrand(null);
    }
  };

  const systemOnline = !error;
  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return (
    <div className="p-6 lg:p-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne text-3xl font-extrabold tracking-tight text-bright">
            Command Center
          </h1>
          <p className="text-xs text-dim mt-1 font-mono">{timestamp}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchBrands}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-dim hover:text-accent border border-border hover:border-accent/30 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded">
            <span
              className={`w-2 h-2 rounded-full ${
                systemOnline
                  ? "bg-accent animate-pulse"
                  : "bg-alert"
              }`}
            />
            <span className="text-xs text-dim uppercase tracking-wider">
              {systemOnline ? "All Systems Online" : "System Error"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Active Brands",
            value: brands.length,
            icon: Zap,
            color: "text-accent",
          },
          {
            label: "Avg ARB Score",
            value:
              brands.length > 0
                ? Math.round(
                    brands.reduce(
                      (sum, b) => sum + (b.latestArbScore ?? 0),
                      0
                    ) / brands.length
                  )
                : "---",
            icon: Activity,
            color: "text-data",
          },
          {
            label: "Avg Trust Score",
            value:
              brands.length > 0
                ? Math.round(
                    brands.reduce(
                      (sum, b) => sum + (b.trustScore ?? 0),
                      0
                    ) / brands.length
                  )
                : "---",
            icon: Eye,
            color: "text-trust",
          },
          {
            label: "Competitors Tracked",
            value: brands.reduce(
              (sum, b) => sum + (b.competitors?.length ?? 0),
              0
            ),
            icon: AlertTriangle,
            color: "text-warning",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-[10px] text-dim uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className={`text-2xl font-syne font-extrabold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-dim">Loading brand agents...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-alert/10 border border-alert/30 rounded-lg p-4 mb-6">
          <span className="text-sm text-alert">{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg">
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-dim" />
          </div>
          <h2 className="font-syne text-xl font-extrabold text-bright mb-2">
            No Brand Agents Deployed
          </h2>
          <p className="text-sm text-dim mb-6 max-w-md text-center">
            Create your first brand agent to start monitoring AI visibility,
            trust scores, and competitive positioning.
          </p>
          <Link
            href="/brands/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-background font-semibold text-sm rounded hover:bg-accent/90 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create Brand Agent
          </Link>
        </div>
      )}

      {/* Brand cards grid */}
      {!loading && brands.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {brands.map((brand) => {
            const arbScore = brand.latestArbScore ?? 0;
            const trustScoreVal = brand.trustScore ?? 0;
            const sparkData = brand.sparklineData?.length > 0 ? brand.sparklineData : [0];
            const isAuditing = auditingBrand === brand.id;

            return (
              <div
                key={brand.id}
                className="bg-surface border border-border rounded-lg p-5 hover:border-accent/20 transition-colors group"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-syne text-lg font-extrabold text-bright group-hover:text-accent transition-colors">
                      {brand.name}
                    </h3>
                    <span className="text-[10px] text-dim uppercase tracking-wider">
                      {brand.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-dim bg-background px-2 py-0.5 rounded border border-border">
                    ID:{brand.id}
                  </span>
                </div>

                {/* Scores row */}
                <div className="flex items-center gap-5 mb-4">
                  <Gauge
                    value={arbScore}
                    size={72}
                    label="ARB"
                  />
                  <Gauge
                    value={trustScoreVal}
                    size={56}
                    label="Trust"
                    color="#ff8800"
                  />
                  <div className="flex-1 flex flex-col items-end">
                    <span className="text-[10px] text-dim uppercase tracking-wider mb-1">
                      ASoV Trend (14d)
                    </span>
                    <Sparkline
                      data={sparkData}
                      color="#4488ff"
                      width={110}
                      height={28}
                    />
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-border">
                  <div className="flex-1">
                    <span className="text-[10px] text-dim uppercase tracking-wider block">
                      Competitors
                    </span>
                    <span className="text-sm text-text">
                      {brand.competitors?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-dim uppercase tracking-wider block">
                      ASoV
                    </span>
                    <span className="text-sm text-data">
                      {brand.latestAsovScore != null
                        ? `${brand.latestAsovScore}%`
                        : "---"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-dim uppercase tracking-wider block">
                      Negotiations
                    </span>
                    <span className="text-sm text-infra">{brand.negotiationCount}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runAudit(brand.id)}
                    disabled={isAuditing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-accent/30 text-accent rounded hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isAuditing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Activity className="w-3 h-3" />
                        Run Audit
                      </>
                    )}
                  </button>
                  <Link
                    href={`/brands/${brand.id}/battlefield`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-data/30 text-data rounded hover:bg-data/10 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View Battlefield
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add new brand card */}
          <Link
            href="/brands/new"
            className="bg-surface border border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center min-h-[280px] hover:border-accent/40 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full border border-border group-hover:border-accent/30 flex items-center justify-center mb-3 transition-colors">
              <PlusCircle className="w-5 h-5 text-dim group-hover:text-accent transition-colors" />
            </div>
            <span className="text-sm text-dim group-hover:text-accent transition-colors">
              Deploy New Brand Agent
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
