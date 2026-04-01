"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Zap,
  ChevronDown,
  ChevronUp,
  Swords,
  RefreshCw,
} from "lucide-react";

/* ---------- types ---------- */
interface BrandData {
  id: number;
  name: string;
  category: string;
  auditQueries: { id: number; queryText: string }[];
}

interface NegotiationResult {
  id: string;
  consumerAgent: string;
  query: string;
  matchedIntent?: string;
  offerServed?: string;
  agentResponse?: string;
  accepted?: boolean;
  revenueAttributed?: number;
  error?: string;
  timestamp: number;
  animState: "query" | "processing" | "response" | "done";
}

const CONSUMER_AGENTS = [
  { name: "ChatGPT", color: "#10a37f", emoji: "\ud83d\udfe2", y: 0 },
  { name: "Claude", color: "#d97706", emoji: "\ud83d\udfe1", y: 1 },
  { name: "Gemini", color: "#4285f4", emoji: "\ud83d\udd35", y: 2 },
  { name: "Perplexity", color: "#20b2aa", emoji: "\ud83d\udfe2", y: 3 },
  { name: "Poe", color: "#8b5cf6", emoji: "\ud83d\udfe3", y: 4 },
];

const DEFAULT_QUERIES = [
  "What's the best option in this category?",
  "Compare top brands for me",
  "Which one offers the best value?",
  "I need a recommendation for quality and price",
  "What are the alternatives?",
  "Which brand should I trust?",
  "Give me the top 3 picks",
  "What's the most affordable premium option?",
  "Who has the best customer reviews?",
  "What's the industry leader here?",
];

let idCounter = 0;

export default function BattlefieldPage() {
  const { id } = useParams<{ id: string }>();

  const [brand, setBrand] = useState<BrandData | null>(null);
  const [negotiations, setNegotiations] = useState<NegotiationResult[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);

  // Keep refs in sync
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Fetch brand data
  useEffect(() => {
    fetch(`/api/brands/${id}`)
      .then((r) => r.json())
      .then((data) =>
        setBrand({
          id: data.id,
          name: data.name,
          category: data.category,
          auditQueries: data.auditQueries || [],
        })
      )
      .catch(() => {});
  }, [id]);

  const getQueries = useCallback((): string[] => {
    const brandQueries = brand?.auditQueries?.map((q) => q.queryText) || [];
    return brandQueries.length > 0 ? brandQueries : DEFAULT_QUERIES;
  }, [brand]);

  const fireNegotiation = useCallback(async () => {
    if (!runningRef.current || pausedRef.current) return;

    const queries = getQueries();
    const query = queries[Math.floor(Math.random() * queries.length)];
    const agent =
      CONSUMER_AGENTS[Math.floor(Math.random() * CONSUMER_AGENTS.length)];
    const negId = `neg-${++idCounter}-${Date.now()}`;

    const neg: NegotiationResult = {
      id: negId,
      consumerAgent: agent.name,
      query,
      timestamp: Date.now(),
      animState: "query",
    };

    setNegotiations((prev) => [neg, ...prev].slice(0, 100));

    // Animate to processing
    setTimeout(() => {
      setNegotiations((prev) =>
        prev.map((n) =>
          n.id === negId ? { ...n, animState: "processing" } : n
        )
      );
    }, 600);

    try {
      const res = await fetch(`/api/brands/${id}/battlefield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: [{ consumerAgent: agent.name, query }],
        }),
      });
      const data = await res.json();
      const result = data.results?.[0];

      setNegotiations((prev) =>
        prev.map((n) =>
          n.id === negId
            ? {
                ...n,
                matchedIntent: result?.matchedIntent,
                offerServed: result?.offerServed,
                agentResponse: result?.agentResponse,
                accepted: result?.accepted,
                revenueAttributed: result?.revenueAttributed,
                error: result?.error,
                animState: "response",
              }
            : n
        )
      );

      // Done after beam animation
      setTimeout(() => {
        setNegotiations((prev) =>
          prev.map((n) =>
            n.id === negId ? { ...n, animState: "done" } : n
          )
        );
      }, 1500);
    } catch {
      setNegotiations((prev) =>
        prev.map((n) =>
          n.id === negId
            ? { ...n, error: "Request failed", animState: "done" }
            : n
        )
      );
    }
  }, [id, getQueries]);

  const startBattle = () => {
    setRunning(true);
    setPaused(false);
    runningRef.current = true;
    pausedRef.current = false;
    // Fire immediately
    fireNegotiation();
  };

  const pauseBattle = () => {
    setPaused(true);
    pausedRef.current = true;
  };

  const resumeBattle = () => {
    setPaused(false);
    pausedRef.current = false;
  };

  const stopBattle = () => {
    setRunning(false);
    setPaused(false);
    runningRef.current = false;
    pausedRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Interval management
  useEffect(() => {
    if (running && !paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const delay = Math.max(1500, 5000 / speed);
      intervalRef.current = setInterval(() => {
        if (runningRef.current && !pausedRef.current) {
          fireNegotiation();
        }
      }, delay);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, paused, speed, fireNegotiation]);

  /* --- computed stats --- */
  const completedNegs = negotiations.filter((n) => n.animState === "done");
  const totalAccepted = completedNegs.filter((n) => n.accepted === true).length;
  const totalDeclined = completedNegs.filter(
    (n) => n.accepted === false
  ).length;
  const totalPending = negotiations.filter(
    (n) => n.animState !== "done"
  ).length;
  const totalRevenue = completedNegs.reduce(
    (s, n) => s + (n.revenueAttributed || 0),
    0
  );
  const acceptanceRate =
    completedNegs.length > 0
      ? Math.round((totalAccepted / completedNegs.length) * 100)
      : 0;

  /* --- SVG layout --- */
  const svgWidth = 800;
  const svgHeight = 500;
  const brandX = 200;
  const brandY = svgHeight / 2;
  const consumerX = 620;

  const getAgentY = (agentName: string) => {
    const idx = CONSUMER_AGENTS.findIndex((a) => a.name === agentName);
    const spacing = (svgHeight - 100) / (CONSUMER_AGENTS.length - 1);
    return 50 + idx * spacing;
  };

  const getAgentColor = (agentName: string) => {
    return CONSUMER_AGENTS.find((a) => a.name === agentName)?.color || "#444";
  };

  // Active beams (in-flight negotiations)
  const activeNegs = negotiations.filter((n) => n.animState !== "done").slice(0, 8);
  const hasGlow = activeNegs.some((n) => n.animState === "processing");

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes dashFlow {
          to {
            stroke-dashoffset: -40;
          }
        }
        @keyframes beamTravel {
          0% {
            offset-distance: 0%;
            opacity: 1;
          }
          100% {
            offset-distance: 100%;
            opacity: 0.3;
          }
        }
        @keyframes beamTravelReverse {
          0% {
            offset-distance: 100%;
            opacity: 1;
          }
          100% {
            offset-distance: 0%;
            opacity: 0.3;
          }
        }
        @keyframes nodeGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 4px #00ff88);
          }
          50% {
            filter: drop-shadow(0 0 20px #00ff88) drop-shadow(0 0 40px #00ff8844);
          }
        }
        @keyframes pulseRing {
          0% {
            r: 30;
            opacity: 0.6;
          }
          100% {
            r: 55;
            opacity: 0;
          }
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .feed-item {
          animation: fadeSlideIn 0.3s ease-out;
        }
        @keyframes dotTravel {
          0% {
            offset-distance: 0%;
          }
          100% {
            offset-distance: 100%;
          }
        }
      `}</style>

      {/* Stats Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-2 mr-4">
          <Swords className="w-5 h-5 text-alert" />
          <h1 className="font-syne text-lg font-extrabold text-bright">
            Battlefield
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs flex-1">
          <div className="px-3 py-1.5 rounded bg-surface border border-border">
            <span className="text-dim">Negotiations </span>
            <span className="font-syne font-extrabold text-bright">
              {completedNegs.length}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-accent/5 border border-accent/20">
            <span className="text-dim">Accepted </span>
            <span className="font-syne font-extrabold text-accent">
              {totalAccepted}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-alert/5 border border-alert/20">
            <span className="text-dim">Declined </span>
            <span className="font-syne font-extrabold text-alert">
              {totalDeclined}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-data/5 border border-data/20">
            <span className="text-dim">Rate </span>
            <span className="font-syne font-extrabold text-data">
              {acceptanceRate}%
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-accent/5 border border-accent/20">
            <span className="text-dim">Revenue </span>
            <span className="font-syne font-extrabold text-accent">
              ${totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-warning/5 border border-warning/20">
            <span className="text-dim">Pending </span>
            <span className="font-syne font-extrabold text-warning">
              {totalPending}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background shrink-0">
        {!running ? (
          <button
            onClick={startBattle}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-background font-bold text-xs rounded hover:bg-accent/90 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            START
          </button>
        ) : (
          <>
            {paused ? (
              <button
                onClick={resumeBattle}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-background font-bold text-xs rounded hover:bg-accent/90 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                RESUME
              </button>
            ) : (
              <button
                onClick={pauseBattle}
                className="flex items-center gap-2 px-4 py-2 bg-warning text-background font-bold text-xs rounded hover:bg-warning/90 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                PAUSE
              </button>
            )}
            <button
              onClick={stopBattle}
              className="flex items-center gap-2 px-4 py-2 bg-alert text-background font-bold text-xs rounded hover:bg-alert/90 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              STOP
            </button>
          </>
        )}

        <div className="ml-4 flex items-center gap-1">
          <span className="text-[10px] text-dim tracking-widest uppercase mr-2">
            Speed
          </span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                speed === s
                  ? "border-data/50 bg-data/10 text-bright"
                  : "border-border text-dim hover:text-text"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {running && !paused && (
          <div className="ml-auto flex items-center gap-2 text-xs text-accent">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* SVG Canvas */}
        <div className="flex-1 relative overflow-hidden bg-background">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Glow filter */}
              <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowAccepted" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowDeclined" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Grid pattern */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#181828"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            {/* Background grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

            {/* Labels */}
            <text
              x={brandX}
              y={20}
              textAnchor="middle"
              className="fill-dim"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="0.15em"
            >
              BRAND AGENT
            </text>
            <text
              x={consumerX}
              y={20}
              textAnchor="middle"
              className="fill-dim"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="0.15em"
            >
              CONSUMER AI
            </text>

            {/* Active beams */}
            {activeNegs.map((neg) => {
              const agentY = getAgentY(neg.consumerAgent);
              const agentColor = getAgentColor(neg.consumerAgent);
              const beamColor =
                neg.animState === "response"
                  ? neg.accepted
                    ? "#00ff88"
                    : "#ff3366"
                  : agentColor;

              return (
                <g key={neg.id}>
                  {/* Query beam: consumer -> brand */}
                  {(neg.animState === "query" ||
                    neg.animState === "processing") && (
                    <>
                      <line
                        x1={consumerX - 60}
                        y1={agentY}
                        x2={brandX + 70}
                        y2={brandY}
                        stroke={agentColor}
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                        opacity={0.6}
                        style={{
                          animation: "dashFlow 1s linear infinite",
                        }}
                      />
                      {/* Traveling dot */}
                      <circle r="4" fill={agentColor} opacity={0.9}>
                        <animateMotion
                          dur={`${1.2 / speedRef.current}s`}
                          repeatCount="indefinite"
                          path={`M${consumerX - 60},${agentY} L${brandX + 70},${brandY}`}
                        />
                      </circle>
                      {/* Query text along beam */}
                      <text
                        x={(consumerX - 60 + brandX + 70) / 2}
                        y={
                          (agentY + brandY) / 2 - 8
                        }
                        textAnchor="middle"
                        fill={agentColor}
                        fontSize="7"
                        fontFamily="monospace"
                        opacity={0.7}
                      >
                        {neg.query.length > 30
                          ? neg.query.slice(0, 30) + "..."
                          : neg.query}
                      </text>
                    </>
                  )}

                  {/* Response beam: brand -> consumer */}
                  {neg.animState === "response" && (
                    <>
                      <line
                        x1={brandX + 70}
                        y1={brandY}
                        x2={consumerX - 60}
                        y2={agentY}
                        stroke={beamColor}
                        strokeWidth="2.5"
                        opacity={0.8}
                        filter={
                          neg.accepted
                            ? "url(#glowAccepted)"
                            : "url(#glowDeclined)"
                        }
                      />
                      {/* Traveling dot */}
                      <circle r="5" fill={beamColor} opacity={1}>
                        <animateMotion
                          dur={`${1 / speedRef.current}s`}
                          repeatCount="indefinite"
                          path={`M${brandX + 70},${brandY} L${consumerX - 60},${agentY}`}
                        />
                      </circle>
                      {/* Status label */}
                      <text
                        x={(consumerX - 60 + brandX + 70) / 2}
                        y={(agentY + brandY) / 2 + 12}
                        textAnchor="middle"
                        fill={beamColor}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {neg.accepted ? "ACCEPTED" : "DECLINED"}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Brand Agent Node */}
            <g
              style={
                hasGlow
                  ? { animation: "nodeGlow 1.5s ease-in-out infinite" }
                  : {}
              }
            >
              <rect
                x={brandX - 60}
                y={brandY - 35}
                width={120}
                height={70}
                rx={12}
                fill="#0a0a12"
                stroke="#00ff88"
                strokeWidth={hasGlow ? 2.5 : 1.5}
                opacity={hasGlow ? 1 : 0.8}
              />
              {/* Pulse ring when processing */}
              {hasGlow && (
                <circle cx={brandX} cy={brandY} fill="none" stroke="#00ff88" strokeWidth="1">
                  <animate
                    attributeName="r"
                    from="30"
                    to="55"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <text
                x={brandX}
                y={brandY - 10}
                textAnchor="middle"
                fontSize="18"
              >
                {brand?.category?.includes("Ferry") || brand?.category?.includes("Transport") ? "⛴️" : brand?.category?.includes("Grocery") || brand?.category?.includes("Retail") ? "🛒" : brand?.category?.includes("Tourism") || brand?.category?.includes("Travel") ? "🌍" : brand?.category?.includes("Tech") || brand?.category?.includes("SaaS") ? "💻" : brand?.category?.includes("Finance") ? "💰" : brand?.category?.includes("Health") ? "🏥" : "🏢"}
              </text>
              <text
                x={brandX}
                y={brandY + 8}
                textAnchor="middle"
                fill="#eeeeff"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {brand?.name || "Brand"}
              </text>
              <text
                x={brandX}
                y={brandY + 22}
                textAnchor="middle"
                fill="#444460"
                fontSize="8"
                fontFamily="monospace"
              >
                {brand?.category || ""}
              </text>
            </g>

            {/* Consumer Agent Nodes */}
            {CONSUMER_AGENTS.map((agent) => {
              const agentY = getAgentY(agent.name);
              const hasActive = activeNegs.some(
                (n) =>
                  n.consumerAgent === agent.name && n.animState !== "done"
              );
              return (
                <g key={agent.name}>
                  <rect
                    x={consumerX - 55}
                    y={agentY - 25}
                    width={110}
                    height={50}
                    rx={10}
                    fill="#0a0a12"
                    stroke={agent.color}
                    strokeWidth={hasActive ? 2 : 1}
                    opacity={hasActive ? 1 : 0.6}
                  />
                  {hasActive && (
                    <rect
                      x={consumerX - 55}
                      y={agentY - 25}
                      width={110}
                      height={50}
                      rx={10}
                      fill="none"
                      stroke={agent.color}
                      strokeWidth={1}
                      opacity={0.3}
                      style={{
                        filter: `drop-shadow(0 0 8px ${agent.color})`,
                      }}
                    />
                  )}
                  <text x={consumerX - 30} y={agentY + 2} fontSize="16">
                    {agent.emoji}
                  </text>
                  <text
                    x={consumerX + 0}
                    y={agentY - 2}
                    fill={agent.color}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {agent.name}
                  </text>
                  <text
                    x={consumerX + 0}
                    y={agentY + 12}
                    fill="#444460"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    Consumer AI
                  </text>
                </g>
              );
            })}

            {/* Empty state */}
            {negotiations.length === 0 && (
              <text
                x={svgWidth / 2}
                y={svgHeight / 2 + 90}
                textAnchor="middle"
                fill="#444460"
                fontSize="12"
                fontFamily="monospace"
              >
                Press START to begin the negotiation battlefield
              </text>
            )}
          </svg>
        </div>

        {/* Live Feed Panel */}
        <div className="w-[300px] border-l border-border bg-surface/30 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-[10px] text-dim tracking-widest uppercase">
              Live Feed
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {negotiations.length === 0 && (
              <div className="text-xs text-dim text-center py-8">
                No negotiations yet
              </div>
            )}
            {negotiations.slice(0, 50).map((neg) => {
              const agent = CONSUMER_AGENTS.find(
                (a) => a.name === neg.consumerAgent
              );
              const isExpanded = expandedId === neg.id;
              return (
                <div
                  key={neg.id}
                  className="feed-item border-b border-border/50 px-3 py-2 hover:bg-surface/50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : neg.id)
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: agent?.color || "#444" }}
                    />
                    <span className="text-[11px] text-text truncate flex-1">
                      {neg.consumerAgent}
                    </span>
                    {neg.animState === "done" && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                          neg.accepted
                            ? "bg-accent/20 text-accent"
                            : neg.error
                            ? "bg-dim/20 text-dim"
                            : "bg-alert/20 text-alert"
                        }`}
                      >
                        {neg.error
                          ? "ERROR"
                          : neg.accepted
                          ? "ACCEPTED"
                          : "DECLINED"}
                      </span>
                    )}
                    {neg.animState !== "done" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold tracking-wider">
                        {neg.animState === "query"
                          ? "SENDING"
                          : neg.animState === "processing"
                          ? "PROCESSING"
                          : "RESPONDING"}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-dim shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-dim shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-dim truncate">
                    {neg.query}
                  </p>
                  {neg.offerServed && (
                    <p className="text-[10px] text-data truncate mt-0.5">
                      Offer: {neg.offerServed}
                    </p>
                  )}
                  {isExpanded && neg.animState === "done" && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      {neg.matchedIntent && (
                        <p className="text-[10px] text-dim">
                          <span className="text-text">Intent: </span>
                          {neg.matchedIntent}
                        </p>
                      )}
                      {neg.offerServed && (
                        <p className="text-[10px] text-dim">
                          <span className="text-text">Offer: </span>
                          {neg.offerServed}
                        </p>
                      )}
                      {neg.agentResponse && (
                        <div className="mt-1">
                          <p className="text-[9px] text-dim tracking-widest uppercase mb-0.5">
                            Response
                          </p>
                          <p className="text-[10px] text-bright leading-relaxed whitespace-pre-wrap">
                            {neg.agentResponse}
                          </p>
                        </div>
                      )}
                      {neg.revenueAttributed != null &&
                        neg.revenueAttributed > 0 && (
                          <p className="text-[10px] text-accent">
                            Revenue: ${neg.revenueAttributed}
                          </p>
                        )}
                      {neg.error && (
                        <p className="text-[10px] text-alert">
                          {neg.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
