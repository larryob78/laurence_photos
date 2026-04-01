"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Gauge } from "@/components/ui/gauge";
import {
  Shield,
  Eye,
  Handshake,
  BarChart3,
  Bot,
  Users,
  FileJson,
  Loader2,
} from "lucide-react";

interface BrandData {
  id: number;
  name: string;
  category: string;
  description: string | null;
  personality: string | null;
  competitors: string[];
  websiteUrl: string | null;
  latestAsov: {
    asovScore: number | null;
    arbScore: number | null;
    layer1Score: number | null;
    layer2Score: number | null;
    layer3Score: number | null;
  } | null;
  latestAttestation: {
    trustScore: number | null;
    claimsTotal: number | null;
    claimsVerified: number | null;
  } | null;
  claims: Array<{ id: number; statement: string; verificationStatus: string }>;
  auditQueries: Array<{ id: number; queryText: string }>;
  offerRules: Array<{ id: number }>;
  dataCard: {
    cardJson: Record<string, unknown>;
    version: number;
  } | null;
}

export default function BrandOverviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    fetch(`/api/brands/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBrand(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-20 text-dim">Brand not found.</div>
    );
  }

  const trustScore = brand.latestAttestation?.trustScore ?? 0;
  const asov = brand.latestAsov?.asovScore ?? 0;
  const arbScore = brand.latestAsov?.arbScore ?? 0;
  const layer1 = brand.latestAsov?.layer1Score ?? 0;
  const layer2 = brand.latestAsov?.layer2Score ?? 0;
  const layer3 = brand.latestAsov?.layer3Score ?? 0;
  const totalNegotiations = brand.offerRules?.length ?? 0;
  const activeOffers = brand.offerRules?.filter(() => true).length ?? 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Brand Identity */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-2">
              Brand Identity
            </div>
            <h2 className="font-syne text-xl font-extrabold text-bright">
              {brand.name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-infra bg-infra/10 border border-infra/20 px-2 py-0.5 rounded">
                {brand.category}
              </span>
              {brand.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-data hover:underline"
                >
                  {brand.websiteUrl}
                </a>
              )}
            </div>
            {brand.description && (
              <p className="text-sm text-text/70 mt-3 max-w-2xl leading-relaxed">
                {brand.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ARB Score Breakdown */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="text-[10px] text-dim tracking-[0.2em] uppercase mb-4">
          ARB Score Breakdown
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center p-4 border border-border rounded-lg bg-background/50">
            <Gauge value={Math.round(arbScore)} size={100} label="ARB Total" />
          </div>
          <div className="flex flex-col items-center p-4 border border-data/20 rounded-lg bg-data/5">
            <Gauge
              value={Math.round(layer1)}
              size={80}
              label="L1: Cited"
              color="#4488ff"
            />
          </div>
          <div className="flex flex-col items-center p-4 border border-warning/20 rounded-lg bg-warning/5">
            <Gauge
              value={Math.round(layer2)}
              size={80}
              label="L2: Chosen"
              color="#ffcc00"
            />
          </div>
          <div className="flex flex-col items-center p-4 border border-accent/20 rounded-lg bg-accent/5">
            <Gauge
              value={Math.round(layer3)}
              size={80}
              label="L3: Preferred"
              color="#00ff88"
            />
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg bg-surface/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-trust" />
            <span className="text-[10px] text-dim tracking-widest uppercase">
              Trust Score
            </span>
          </div>
          <div className="font-syne text-2xl font-extrabold text-trust">
            {Math.round(trustScore)}
          </div>
        </div>
        <div className="border border-border rounded-lg bg-surface/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-data" />
            <span className="text-[10px] text-dim tracking-widest uppercase">
              ASoV
            </span>
          </div>
          <div className="font-syne text-2xl font-extrabold text-data">
            {asov.toFixed(1)}%
          </div>
        </div>
        <div className="border border-border rounded-lg bg-surface/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Handshake className="w-4 h-4 text-warning" />
            <span className="text-[10px] text-dim tracking-widest uppercase">
              Negotiations
            </span>
          </div>
          <div className="font-syne text-2xl font-extrabold text-warning">
            {totalNegotiations}
          </div>
        </div>
        <div className="border border-border rounded-lg bg-surface/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-[10px] text-dim tracking-widest uppercase">
              Active Offers
            </span>
          </div>
          <div className="font-syne text-2xl font-extrabold text-accent">
            {activeOffers}
          </div>
        </div>
      </section>

      {/* Agent Personality + Competitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Personality */}
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-infra" />
            <span className="text-[10px] text-dim tracking-[0.2em] uppercase">
              Agent Personality
            </span>
          </div>
          {brand.personality ? (
            <p className="text-sm text-text/80 leading-relaxed">
              {brand.personality}
            </p>
          ) : (
            <p className="text-xs text-dim italic">No personality configured.</p>
          )}
        </section>

        {/* Competitors */}
        <section className="border border-border rounded-lg bg-surface/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-alert" />
            <span className="text-[10px] text-dim tracking-[0.2em] uppercase">
              Competitors
            </span>
          </div>
          {brand.competitors && brand.competitors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {brand.competitors.map((comp, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded bg-alert/10 border border-alert/20 text-alert"
                >
                  {comp}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-dim italic">No competitors defined.</p>
          )}
        </section>
      </div>

      {/* Brand Data Card Preview */}
      <section className="border border-border rounded-lg bg-surface/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-accent" />
            <span className="text-[10px] text-dim tracking-[0.2em] uppercase">
              Brand Data Card
            </span>
            {brand.dataCard && (
              <span className="text-[10px] text-dim ml-2">
                v{brand.dataCard.version}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCard(!showCard)}
            className="text-xs text-data hover:text-data/80 transition-colors"
          >
            {showCard ? "Hide JSON" : "Show JSON"}
          </button>
        </div>
        {!brand.dataCard ? (
          <p className="text-xs text-dim italic">
            No data card generated yet.
          </p>
        ) : showCard ? (
          <pre className="text-xs text-text/70 bg-background border border-border rounded p-4 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(brand.dataCard.cardJson, null, 2)}
          </pre>
        ) : (
          <div className="text-xs text-dim">
            Data card available. Click &ldquo;Show JSON&rdquo; to preview.
          </div>
        )}
      </section>
    </div>
  );
}
