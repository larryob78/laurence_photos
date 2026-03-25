"use client";

import { useProjectStore } from "@/store/project-store";
import { ProgressBar } from "@/components/ProgressBar";
import { InputStage } from "@/components/stages/InputStage";
import { AnalyzingStage } from "@/components/stages/AnalyzingStage";
import { StoryShapesStage } from "@/components/stages/StoryShapesStage";
import { CreativeRoutesStage } from "@/components/stages/CreativeRoutesStage";
import { GeneratingDeckStage } from "@/components/stages/GeneratingDeckStage";
import { DeckStage } from "@/components/deck/DeckStage";

export default function Home() {
  const stage = useProjectStore((s) => s.stage);

  return (
    <main className="min-h-screen bg-black text-white">
      <ProgressBar currentStage={stage} />

      <div className={stage !== "input" ? "pt-16" : ""}>
        {stage === "input" && <InputStage />}
        {stage === "analyzing" && <AnalyzingStage />}
        {stage === "story-shapes" && <StoryShapesStage />}
        {stage === "creative-routes" && <CreativeRoutesStage />}
        {stage === "generating-deck" && <GeneratingDeckStage />}
        {stage === "deck" && <DeckStage />}
      </div>
    </main>
  );
}
