"use client";

import Link from "next/link";
import { ArrowRight, Zap, Eye, Crown } from "lucide-react";

const gapLayers = [
  {
    layer: 1,
    label: "GET CITED",
    description: "Mentioned in AI responses",
    crowd: "50+ GEO agencies",
    color: "text-data",
    bgColor: "bg-data/10",
    borderColor: "border-data/30",
    icon: Eye,
    density: "CROWDED",
    densityColor: "text-alert",
    bars: 48,
  },
  {
    layer: 2,
    label: "GET CHOSEN",
    description: "Selected when agent compares options",
    crowd: "~0 agencies",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    icon: Zap,
    density: "EMPTY",
    densityColor: "text-warning",
    bars: 2,
  },
  {
    layer: 3,
    label: "GET PREFERRED",
    description: "Default recommendation in agent-to-agent commerce",
    crowd: "0 agencies",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    icon: Crown,
    density: "WE ARE HERE",
    densityColor: "text-accent",
    bars: 0,
  },
];

const stats = [
  {
    value: "$100M",
    label: "OpenAI ad revenue in 6 weeks",
    color: "text-accent",
  },
  {
    value: "$3-5T",
    label: "Agentic commerce by 2030 (McKinsey)",
    color: "text-data",
  },
  {
    value: "0",
    label: "Agencies doing agent-to-agent",
    color: "text-trust",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-20 relative overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Terminal-style header bar */}
        <div className="mb-12 flex items-center gap-2 px-4 py-2 border border-border rounded bg-surface/50">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] text-dim tracking-widest uppercase">
            napkin.ie // agent-to-agent advertising protocol
          </span>
        </div>

        {/* Main headline */}
        <h1 className="font-syne text-5xl md:text-7xl font-extrabold text-center leading-tight max-w-5xl">
          The World&apos;s First{" "}
          <span className="text-accent">Agent-to-Agent</span>
          <br />
          Ad Agency
        </h1>

        <p className="mt-6 text-lg md:text-xl text-dim text-center max-w-2xl leading-relaxed">
          We don&apos;t make ads humans see.{" "}
          <span className="text-bright">
            We make brands agents choose.
          </span>
        </p>

        {/* CTA */}
        <Link
          href="/brands/new"
          className="mt-10 inline-flex items-center gap-3 px-8 py-4 bg-accent text-background font-bold text-base rounded hover:bg-accent/90 transition-all hover:gap-4 group"
        >
          Create Your First Brand Agent
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 w-full max-w-4xl">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center px-6 py-4 border border-border rounded bg-surface/30"
            >
              <div className={`font-syne text-3xl font-extrabold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-dim mt-2 leading-relaxed">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gap Map Section */}
      <section className="px-8 py-20 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] text-dim tracking-[0.2em] uppercase mb-3">
              Market Gap Analysis
            </div>
            <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-bright">
              The 3-Layer Gap Map
            </h2>
            <p className="text-dim mt-3 max-w-lg mx-auto text-sm">
              Most agencies fight for Layer 1. Nobody is building for Layers 2 and 3.
              That&apos;s where the trillion-dollar opportunity lives.
            </p>
          </div>

          <div className="space-y-4">
            {gapLayers.map((layer) => (
              <div
                key={layer.layer}
                className={`border ${layer.borderColor} rounded-lg ${layer.bgColor} p-6 relative overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center ${layer.bgColor} border ${layer.borderColor}`}
                    >
                      <layer.icon className={`w-5 h-5 ${layer.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-dim tracking-widest">
                          LAYER {layer.layer}
                        </span>
                        <h3
                          className={`font-syne text-xl font-extrabold ${layer.color}`}
                        >
                          {layer.label}
                        </h3>
                      </div>
                      <p className="text-sm text-dim mt-1">{layer.description}</p>
                      <p className="text-xs text-dim/60 mt-1">{layer.crowd}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold tracking-widest ${layer.densityColor}`}
                    >
                      {layer.density}
                    </span>
                    {/* Density bars */}
                    <div className="flex gap-[2px] mt-2 justify-end">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-4 rounded-sm ${
                            i < Math.min(layer.bars, 20)
                              ? layer.color.replace("text-", "bg-") + "/60"
                              : "bg-border/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="px-8 py-20 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] text-dim tracking-[0.2em] uppercase mb-3">
              Platform Architecture
            </div>
            <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-bright">
              Full-Stack Agent Commerce
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Brand Data Card",
                desc: "Structured JSON identity that AI agents can parse, verify, and trust.",
                color: "text-accent",
                border: "border-accent/20",
              },
              {
                title: "Visibility Audit",
                desc: "Real-time monitoring of how AI models cite, rank, and recommend your brand.",
                color: "text-data",
                border: "border-data/20",
              },
              {
                title: "Trust & Attestation",
                desc: "Cryptographic proof of claims. Verifiable credentials for every data point.",
                color: "text-infra",
                border: "border-infra/20",
              },
              {
                title: "A2A Negotiation",
                desc: "Automated offer serving and deal negotiation between brand and consumer agents.",
                color: "text-trust",
                border: "border-trust/20",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`border ${item.border} rounded-lg p-5 bg-surface/50 hover:bg-surface transition-colors`}
              >
                <h3 className={`font-syne text-sm font-extrabold ${item.color} mb-2`}>
                  {item.title}
                </h3>
                <p className="text-xs text-dim leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-8 py-20 border-t border-border text-center">
        <h2 className="font-syne text-2xl md:text-3xl font-extrabold text-bright mb-4">
          Ready to make your brand agent-ready?
        </h2>
        <p className="text-dim mb-8 max-w-md mx-auto text-sm">
          Join the zero-competition layer of agentic commerce before everyone else
          figures it out.
        </p>
        <Link
          href="/brands/new"
          className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-background font-bold text-base rounded hover:bg-accent/90 transition-all hover:gap-4 group"
        >
          Create Your First Brand Agent
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[10px] text-dim">
          <span>NAPKIN A2A v0.1.0-alpha // napkin.ie</span>
          <span>The agent-to-agent advertising protocol</span>
        </div>
      </footer>
    </div>
  );
}
