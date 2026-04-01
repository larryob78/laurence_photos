"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Sprout,
  Copy,
  Check,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
  ArrowRight,
  Star,
  Sparkles,
} from "lucide-react";

/* ---------- types ---------- */
interface SocialPost {
  platform: string;
  copy: string;
  hashtags?: string[];
  callToAction?: string;
}

interface EmailCampaign {
  subjectLine: string;
  preheader?: string;
  body: string;
  callToAction?: string;
}

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  prompt?: string;
}

interface InAppPrompt {
  trigger: string;
  title: string;
  body: string;
  ctaText?: string;
}

interface CampaignResult {
  campaignType: string;
  brandName?: string;
  qualityScore?: number;
  socialPosts?: SocialPost[];
  email?: EmailCampaign;
  onboardingSteps?: OnboardingStep[];
  inAppPrompts?: InAppPrompt[];
  rawContent?: string;
}

const CAMPAIGN_TYPES = [
  {
    value: "social",
    label: "Social Media",
    icon: MessageSquare,
    color: "#4488ff",
    description: "Generate platform-specific social posts to drive AI agent awareness",
  },
  {
    value: "email",
    label: "Email Campaign",
    icon: Mail,
    color: "#ff8800",
    description: "Create email sequences that educate users about AI agent interactions",
  },
  {
    value: "onboarding",
    label: "Onboarding Flow",
    icon: ArrowRight,
    color: "#00ff88",
    description: "Design step-by-step onboarding that primes users for AI-first experiences",
  },
  {
    value: "in-app",
    label: "In-App Prompts",
    icon: Smartphone,
    color: "#aa66ff",
    description: "Craft contextual prompts that encourage AI agent-mediated discovery",
  },
];

export default function SeederPage() {
  const { id } = useParams<{ id: string }>();

  const [selectedType, setSelectedType] = useState("social");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  const generateCampaign = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`/api/brands/${id}/seeder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignType: selectedType }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error("Failed to generate campaign", e);
    }
    setGenerating(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const selectedCampaign = CAMPAIGN_TYPES.find((c) => c.value === selectedType);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Sprout className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-bright">
            The Seeder
          </h1>
          <p className="text-xs text-dim">
            Generate campaigns to seed AI agent awareness and train user
            behavior
          </p>
        </div>
      </div>

      {/* Campaign Type Selector */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {CAMPAIGN_TYPES.map((type) => {
          const isSelected = selectedType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`relative p-4 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-opacity-50 bg-opacity-5"
                  : "border-border bg-surface/30 hover:bg-surface/50"
              }`}
              style={{
                borderColor: isSelected ? type.color + "80" : undefined,
                backgroundColor: isSelected ? type.color + "0d" : undefined,
              }}
            >
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: type.color + "20",
                    borderWidth: 1,
                    borderColor: type.color + "50",
                  }}
                >
                  <Check className="w-3 h-3" style={{ color: type.color }} />
                </div>
              )}
              <type.icon
                className="w-5 h-5 mb-2"
                style={{ color: type.color }}
              />
              <div
                className="font-syne text-sm font-extrabold mb-1"
                style={{ color: isSelected ? type.color : "#eeeeff" }}
              >
                {type.label}
              </div>
              <p className="text-[10px] text-dim leading-relaxed">
                {type.description}
              </p>
            </button>
          );
        })}
      </section>

      {/* Generate Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={generateCampaign}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-background font-bold text-sm rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating {selectedCampaign?.label}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate {selectedCampaign?.label}
            </>
          )}
        </button>

        {result?.qualityScore != null && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-data/30 bg-data/5">
            <Star className="w-4 h-4 text-data" />
            <span className="text-[10px] text-dim tracking-widest uppercase">
              CD Brain Score
            </span>
            <span className="font-syne text-lg font-extrabold text-data">
              {result.qualityScore}
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Social Posts */}
          {result.socialPosts && result.socialPosts.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-syne text-lg font-extrabold text-bright">
                Social Media Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.socialPosts.map((post, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg bg-surface/50 p-4 hover:border-data/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-data/10 text-data border border-data/20 font-bold uppercase tracking-wider">
                        {post.platform}
                      </span>
                      <button
                        onClick={() => copyToClipboard(post.copy, `social-${i}`)}
                        className="flex items-center gap-1 text-[10px] text-dim hover:text-text transition-colors"
                      >
                        {copiedIdx === `social-${i}` ? (
                          <>
                            <Check className="w-3 h-3 text-accent" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-bright leading-relaxed whitespace-pre-wrap mb-3">
                      {post.copy}
                    </p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.hashtags.map((tag, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-infra/10 text-infra"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {post.callToAction && (
                      <p className="text-[10px] text-accent italic">
                        CTA: {post.callToAction}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Email Campaign */}
          {result.email && (
            <section className="space-y-4">
              <h2 className="font-syne text-lg font-extrabold text-bright">
                Email Campaign
              </h2>
              <div className="border border-border rounded-lg bg-surface/50 overflow-hidden">
                {/* Email preview header */}
                <div className="border-b border-border bg-background/50 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-dim tracking-widest uppercase w-16">
                      Subject
                    </span>
                    <span className="text-sm text-bright font-bold">
                      {result.email.subjectLine}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(result.email!.subjectLine, "email-subject")
                      }
                      className="ml-auto"
                    >
                      {copiedIdx === "email-subject" ? (
                        <Check className="w-3 h-3 text-accent" />
                      ) : (
                        <Copy className="w-3 h-3 text-dim hover:text-text" />
                      )}
                    </button>
                  </div>
                  {result.email.preheader && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-dim tracking-widest uppercase w-16">
                        Preview
                      </span>
                      <span className="text-xs text-dim">
                        {result.email.preheader}
                      </span>
                    </div>
                  )}
                </div>
                {/* Email body */}
                <div className="p-6">
                  <div className="max-w-lg mx-auto">
                    <p className="text-xs text-bright leading-relaxed whitespace-pre-wrap">
                      {result.email.body}
                    </p>
                    {result.email.callToAction && (
                      <div className="mt-6 text-center">
                        <span className="inline-block px-6 py-2.5 bg-accent text-background text-xs font-bold rounded">
                          {result.email.callToAction}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Subject: ${result.email!.subjectLine}\n\n${result.email!.body}`,
                          "email-full"
                        )
                      }
                      className="flex items-center gap-1 text-[10px] text-dim hover:text-text transition-colors"
                    >
                      {copiedIdx === "email-full" ? (
                        <>
                          <Check className="w-3 h-3 text-accent" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Full Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Onboarding Flow */}
          {result.onboardingSteps && result.onboardingSteps.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-syne text-lg font-extrabold text-bright">
                Onboarding Flow
              </h2>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-4 bottom-4 w-px bg-border" />
                <div className="space-y-4">
                  {result.onboardingSteps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      {/* Step number */}
                      <div
                        className="relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: "#00ff88",
                          backgroundColor: "#00ff8810",
                        }}
                      >
                        <span className="font-syne text-sm font-extrabold text-accent">
                          {step.step}
                        </span>
                      </div>
                      {/* Step content */}
                      <div className="flex-1 border border-border rounded-lg bg-surface/50 p-4">
                        <h3 className="font-syne text-sm font-extrabold text-bright mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-dim leading-relaxed">
                          {step.description}
                        </p>
                        {step.prompt && (
                          <div className="mt-3 p-3 rounded bg-background border border-border">
                            <div className="text-[9px] text-dim tracking-widest uppercase mb-1">
                              Suggested Prompt
                            </div>
                            <p className="text-xs text-data italic">
                              &ldquo;{step.prompt}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* In-App Prompts */}
          {result.inAppPrompts && result.inAppPrompts.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-syne text-lg font-extrabold text-bright">
                In-App Prompts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.inAppPrompts.map((prompt, i) => (
                  <div
                    key={i}
                    className="border border-infra/30 rounded-lg bg-infra/5 p-4 hover:border-infra/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone
                        className="w-3.5 h-3.5"
                        style={{ color: "#aa66ff" }}
                      />
                      <span className="text-[10px] px-2 py-0.5 rounded bg-infra/10 text-infra border border-infra/20 font-bold uppercase tracking-wider">
                        {prompt.trigger}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${prompt.title}\n${prompt.body}`,
                            `prompt-${i}`
                          )
                        }
                        className="ml-auto"
                      >
                        {copiedIdx === `prompt-${i}` ? (
                          <Check className="w-3 h-3 text-accent" />
                        ) : (
                          <Copy className="w-3 h-3 text-dim hover:text-text" />
                        )}
                      </button>
                    </div>
                    <h3 className="font-syne text-sm font-extrabold text-bright mb-1.5">
                      {prompt.title}
                    </h3>
                    <p className="text-xs text-dim leading-relaxed">
                      {prompt.body}
                    </p>
                    {prompt.ctaText && (
                      <div className="mt-3">
                        <span className="inline-block px-4 py-1.5 rounded text-[11px] font-bold bg-infra/20 text-infra border border-infra/30">
                          {prompt.ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Raw content fallback */}
          {result.rawContent && !result.socialPosts && !result.email && !result.onboardingSteps && !result.inAppPrompts && (
            <section className="space-y-4">
              <h2 className="font-syne text-lg font-extrabold text-bright">
                Campaign Output
              </h2>
              <div className="border border-border rounded-lg bg-surface/50 p-6">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() =>
                      copyToClipboard(result.rawContent!, "raw")
                    }
                    className="flex items-center gap-1 text-[10px] text-dim hover:text-text transition-colors"
                  >
                    {copiedIdx === "raw" ? (
                      <>
                        <Check className="w-3 h-3 text-accent" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs text-bright leading-relaxed whitespace-pre-wrap font-mono">
                  {result.rawContent}
                </pre>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !generating && (
        <div className="border border-border rounded-lg bg-surface/30 p-12 text-center">
          <Sprout className="w-10 h-10 text-accent/30 mx-auto mb-4" />
          <p className="text-sm text-dim mb-2">
            Select a campaign type and generate
          </p>
          <p className="text-xs text-dim">
            The Seeder will create AI agent awareness campaigns using Claude to
            craft content tailored to your brand.
          </p>
        </div>
      )}
    </div>
  );
}
