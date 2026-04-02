"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

interface AgentNode {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  status: "idle" | "active" | "complete" | "error";
  lastOutput: string | null;
  x: number;
  y: number;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  agent: string;
  action: string;
  detail: string;
  status: "info" | "success" | "error" | "warning";
}

interface BeamConnection {
  id: number;
  from: string;
  to: string;
  label: string;
  active: boolean;
}

const AGENTS: AgentNode[] = [
  { id: "scout", name: "THE SCOUT", emoji: "🔍", color: "#4488ff", description: "Brand perception monitoring", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "card-builder", name: "CARD BUILDER", emoji: "🪪", color: "#00ff88", description: "JSON-LD Brand Data Cards", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "dealer", name: "THE DEALER", emoji: "🤝", color: "#ff8800", description: "A2A negotiation engine", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "seeder", name: "THE SEEDER", emoji: "🌱", color: "#ffcc00", description: "Preference seeding campaigns", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "media", name: "MEDIA AGENT", emoji: "📡", color: "#aa66ff", description: "Agent media landscape", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "trust", name: "TRUST AGENT", emoji: "🛡️", color: "#ff3366", description: "Claims verification & attestation", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "cd-brain", name: "CD BRAIN", emoji: "🧠", color: "#20b2aa", description: "Creative quality scoring", status: "idle", lastOutput: null, x: 0, y: 0 },
  { id: "conductor", name: "CONDUCTOR", emoji: "🎯", color: "#eeeeff", description: "Orchestrator & ARB scoring", status: "idle", lastOutput: null, x: 0, y: 0 },
];

// Position agents in a circle around the conductor
function positionAgents(cx: number, cy: number, radius: number): AgentNode[] {
  const conductor = { ...AGENTS[7], x: cx, y: cy };
  const others = AGENTS.slice(0, 7).map((agent, i) => {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return { ...agent, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
  return [...others, conductor];
}

export default function SwarmMonitorPage() {
  const params = useParams();
  const id = params.id as string;
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [beams, setBeams] = useState<BeamConnection[]>([]);
  const [running, setRunning] = useState(false);
  const [brand, setBrand] = useState<{ name: string; category: string } | null>(null);
  const [phase, setPhase] = useState<string>("idle");
  const [speed, setSpeed] = useState(1);
  const logIdRef = useRef(0);
  const beamIdRef = useRef(0);
  const abortRef = useRef(false);

  useEffect(() => {
    const positioned = positionAgents(400, 300, 200);
    setAgents(positioned);
    fetch(`/api/brands/${id}`)
      .then((r) => r.json())
      .then((d) => setBrand({ name: d.name, category: d.category }))
      .catch(() => {});
  }, [id]);

  const addLog = useCallback((agent: string, action: string, detail: string, status: ActivityLog["status"] = "info") => {
    const entry: ActivityLog = {
      id: ++logIdRef.current,
      timestamp: new Date().toLocaleTimeString(),
      agent,
      action,
      detail,
      status,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  const activateAgent = useCallback((agentId: string) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: "active" } : a)));
  }, []);

  const completeAgent = useCallback((agentId: string, output?: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: "complete", lastOutput: output || a.lastOutput } : a))
    );
  }, []);

  const resetAgents = useCallback(() => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: "idle", lastOutput: null })));
  }, []);

  const addBeam = useCallback((from: string, to: string, label: string) => {
    const beam: BeamConnection = { id: ++beamIdRef.current, from, to, label, active: true };
    setBeams((prev) => [...prev, beam]);
    setTimeout(() => {
      setBeams((prev) => prev.filter((b) => b.id !== beam.id));
    }, 2000 / speed);
    return beam;
  }, [speed]);

  const delay = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms / speed)), [speed]);

  const runFullSwarm = useCallback(async () => {
    if (running) return;
    setRunning(true);
    abortRef.current = false;
    resetAgents();
    setLogs([]);
    setBeams([]);

    const step = async (agentId: string, action: string, detail: string, apiCall?: () => Promise<unknown>) => {
      if (abortRef.current) return null;
      activateAgent(agentId);
      addBeam("conductor", agentId, action);
      addLog(agentId, action, detail);
      setPhase(action);
      await delay(600);

      let result = null;
      if (apiCall) {
        try {
          result = await apiCall();
          completeAgent(agentId, typeof result === "object" ? JSON.stringify(result).slice(0, 100) : String(result));
          addLog(agentId, action, "Completed successfully", "success");
        } catch {
          setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: "error" } : a)));
          addLog(agentId, action, "Failed", "error");
        }
      } else {
        await delay(800);
        completeAgent(agentId, detail);
        addLog(agentId, action, "Completed", "success");
      }
      await delay(400);
      return result;
    };

    // Phase 1: Conductor initiates
    activateAgent("conductor");
    addLog("conductor", "INITIATE", `Starting full swarm analysis for ${brand?.name || "brand"}...`);
    setPhase("Conductor initiating swarm");
    await delay(1000);
    completeAgent("conductor", "Swarm initiated");

    // Phase 2: Scout runs audit
    await step("scout", "BRAND AUDIT", "Scanning AI platforms for brand mentions...", async () => {
      const res = await fetch(`/api/brands/${id}/audit`, { method: "POST" });
      return res.json();
    });

    // Phase 3: Card Builder
    await step("card-builder", "DATA CARD", "Generating JSON-LD Brand Data Card...", async () => {
      const res = await fetch(`/api/brands/${id}/card`, { method: "POST" });
      return res.json();
    });

    // Phase 4: Trust Agent verifies
    await step("trust", "VERIFY CLAIMS", "Verifying trust claims and generating attestation...", async () => {
      const res = await fetch(`/api/brands/${id}/trust`, { method: "POST" });
      return res.json();
    });

    // Phase 5: Create attestation
    await step("trust", "ATTESTATION", "Creating HMAC-SHA256 cryptographic attestation...", async () => {
      const res = await fetch(`/api/brands/${id}/trust/attest`, { method: "POST" });
      return res.json();
    });

    // Phase 6: Dealer runs negotiations
    const consumerAgents = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Poe"];
    for (const ca of consumerAgents) {
      if (abortRef.current) break;
      await step("dealer", `NEGOTIATE → ${ca}`, `Running A2A negotiation with ${ca}...`, async () => {
        const res = await fetch(`/api/brands/${id}/negotiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consumerAgent: ca, inboundQuery: `What's the best option in ${brand?.category || "this category"}?` }),
        });
        return res.json();
      });
    }

    // Phase 7: Media Agent plans
    await step("media", "MEDIA PLAN", "Analyzing agent media landscape...", async () => {
      const res = await fetch(`/api/brands/${id}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budget: 50000 }) });
      return res.json();
    });

    // Phase 8: Seeder generates campaign
    await step("seeder", "SEED CAMPAIGN", "Generating preference seeding content...", async () => {
      const res = await fetch(`/api/brands/${id}/seeder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignType: "social" }) });
      return res.json();
    });

    // Phase 9: CD Brain scores
    await step("cd-brain", "QUALITY SCORE", "Scoring content on Cannes rubric...", async () => {
      const res = await fetch(`/api/brands/${id}/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `Brand campaign for ${brand?.name}`, contentType: "campaign" }) });
      return res.json();
    });

    // Phase 10: Conductor calculates final ARB
    await step("conductor", "ARB SCORE", "Calculating Agent-Ready Branding score...", async () => {
      const res = await fetch(`/api/brands/${id}/conductor`);
      return res.json();
    });

    // Final
    setPhase("SWARM COMPLETE");
    addLog("conductor", "COMPLETE", "All agents finished. Swarm analysis complete.", "success");
    setRunning(false);
  }, [running, brand, id, speed, activateAgent, completeAgent, resetAgents, addLog, addBeam, delay]);

  const stopSwarm = () => {
    abortRef.current = true;
    setRunning(false);
    setPhase("STOPPED");
    addLog("conductor", "ABORT", "Swarm stopped by operator", "warning");
  };

  const getAgentById = (agentId: string) => agents.find((a) => a.id === agentId);

  const statusColor = (status: AgentNode["status"]) => {
    switch (status) {
      case "active": return "#00ff88";
      case "complete": return "#4488ff";
      case "error": return "#ff3366";
      default: return "#444460";
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main SVG Area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
          <div>
            <h1 className="font-syne text-xl font-extrabold text-bright">Agent Swarm Monitor</h1>
            <p className="text-[10px] text-dim uppercase tracking-widest">{brand?.name || "Loading..."} // {phase}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Speed controls */}
            <div className="flex items-center gap-1 border border-border rounded px-2 py-1">
              {[0.5, 1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 text-[10px] rounded ${speed === s ? "bg-accent text-background font-bold" : "text-dim hover:text-accent"}`}
                >
                  {s}x
                </button>
              ))}
            </div>
            {!running ? (
              <button
                onClick={runFullSwarm}
                className="px-4 py-1.5 bg-accent text-background text-xs font-bold rounded hover:bg-accent/90 transition-colors"
              >
                ▶ START SWARM
              </button>
            ) : (
              <button
                onClick={stopSwarm}
                className="px-4 py-1.5 bg-alert text-background text-xs font-bold rounded hover:bg-alert/90 transition-colors"
              >
                ■ STOP
              </button>
            )}
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 relative bg-background">
          <svg viewBox="0 0 800 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Glow filters */}
              {AGENTS.map((a) => (
                <filter key={a.id} id={`glow-${a.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feFlood floodColor={a.color} floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
              <filter id="glow-beam" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#181828" strokeWidth="0.5" />
            </pattern>
            <rect width="800" height="600" fill="url(#grid)" />

            {/* Connection lines (dim, always visible) */}
            {agents.slice(0, 7).map((agent) => {
              const conductor = agents[7];
              if (!conductor) return null;
              return (
                <line
                  key={`line-${agent.id}`}
                  x1={conductor.x}
                  y1={conductor.y}
                  x2={agent.x}
                  y2={agent.y}
                  stroke="#181828"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Active beams */}
            {beams.map((beam) => {
              const fromAgent = getAgentById(beam.from);
              const toAgent = getAgentById(beam.to);
              if (!fromAgent || !toAgent) return null;
              return (
                <g key={beam.id}>
                  <line
                    x1={fromAgent.x}
                    y1={fromAgent.y}
                    x2={toAgent.x}
                    y2={toAgent.y}
                    stroke="#00ff88"
                    strokeWidth="2"
                    filter="url(#glow-beam)"
                    opacity="0.8"
                  >
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.8s" repeatCount="indefinite" />
                  </line>
                  {/* Traveling dot */}
                  <circle r="4" fill="#00ff88" filter="url(#glow-beam)">
                    <animateMotion
                      dur="0.6s"
                      repeatCount="indefinite"
                      path={`M${fromAgent.x},${fromAgent.y} L${toAgent.x},${toAgent.y}`}
                    />
                  </circle>
                  {/* Label */}
                  <text
                    x={(fromAgent.x + toAgent.x) / 2}
                    y={(fromAgent.y + toAgent.y) / 2 - 10}
                    textAnchor="middle"
                    fill="#00ff88"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {beam.label}
                  </text>
                </g>
              );
            })}

            {/* Agent nodes */}
            {agents.map((agent) => {
              const isActive = agent.status === "active";
              const isComplete = agent.status === "complete";
              const isError = agent.status === "error";
              const isConductor = agent.id === "conductor";
              const nodeSize = isConductor ? 45 : 35;

              return (
                <g key={agent.id} filter={isActive ? `url(#glow-${agent.id})` : undefined}>
                  {/* Pulse ring for active */}
                  {isActive && (
                    <circle cx={agent.x} cy={agent.y} r={nodeSize + 5} fill="none" stroke={agent.color} strokeWidth="1.5">
                      <animate attributeName="r" values={`${nodeSize + 5};${nodeSize + 20};${nodeSize + 5}`} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Node background */}
                  <circle
                    cx={agent.x}
                    cy={agent.y}
                    r={nodeSize}
                    fill="#0a0a12"
                    stroke={statusColor(agent.status)}
                    strokeWidth={isActive ? 3 : isComplete ? 2 : 1}
                    opacity={agent.status === "idle" ? 0.5 : 1}
                  />

                  {/* Emoji */}
                  <text x={agent.x} y={agent.y - 4} textAnchor="middle" fontSize={isConductor ? "22" : "18"} dominantBaseline="middle">
                    {agent.emoji}
                  </text>

                  {/* Name */}
                  <text
                    x={agent.x}
                    y={agent.y + nodeSize + 14}
                    textAnchor="middle"
                    fill={statusColor(agent.status)}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {agent.name}
                  </text>

                  {/* Status indicator */}
                  {isActive && (
                    <text x={agent.x} y={agent.y + nodeSize + 24} textAnchor="middle" fill="#00ff88" fontSize="7" fontFamily="JetBrains Mono, monospace">
                      ACTIVE
                    </text>
                  )}
                  {isComplete && (
                    <text x={agent.x} y={agent.y + nodeSize + 24} textAnchor="middle" fill="#4488ff" fontSize="7" fontFamily="JetBrains Mono, monospace">
                      DONE ✓
                    </text>
                  )}
                  {isError && (
                    <text x={agent.x} y={agent.y + nodeSize + 24} textAnchor="middle" fill="#ff3366" fontSize="7" fontFamily="JetBrains Mono, monospace">
                      ERROR ✗
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center label */}
            <text x="400" y="565" textAnchor="middle" fill="#444460" fontSize="8" fontFamily="JetBrains Mono, monospace">
              NAPKIN A2A SWARM MONITOR // {agents.filter((a) => a.status === "complete").length}/{agents.length} AGENTS COMPLETE
            </text>
          </svg>
        </div>
      </div>

      {/* Right panel: Activity Feed */}
      <div className="w-[340px] border-l border-border bg-surface flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-syne text-sm font-extrabold text-bright">Activity Feed</h2>
            <span className="text-[10px] text-dim">{logs.length} events</span>
          </div>
        </div>

        {/* Agent status chips */}
        <div className="px-4 py-2 border-b border-border flex flex-wrap gap-1.5">
          {agents.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] border"
              style={{
                borderColor: statusColor(a.status) + "40",
                color: statusColor(a.status),
                backgroundColor: statusColor(a.status) + "10",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor(a.status) }} />
              {a.emoji} {a.name.split(" ").pop()}
            </div>
          ))}
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-dim text-center px-6">
                Click START SWARM to watch all 8 agents work in real time
              </p>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-2 border-b border-border/50 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] text-dim font-mono">{log.timestamp}</span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color:
                      log.status === "success" ? "#00ff88" : log.status === "error" ? "#ff3366" : log.status === "warning" ? "#ffcc00" : "#4488ff",
                  }}
                >
                  {log.status}
                </span>
              </div>
              <div className="text-[10px] text-bright font-bold">{log.action}</div>
              <div className="text-[10px] text-dim mt-0.5">{log.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes swarm-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
