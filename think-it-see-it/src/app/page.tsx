"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjectStore, useProjectListStore } from "@/store/project-store";
import { ProgressBar } from "@/components/ProgressBar";
import { ProjectLanding } from "@/components/ProjectLanding";
import { InputStage } from "@/components/stages/InputStage";
import { AnalyzingStage } from "@/components/stages/AnalyzingStage";
import { StoryShapesStage } from "@/components/stages/StoryShapesStage";
import { CreativeRoutesStage } from "@/components/stages/CreativeRoutesStage";
import { GeneratingDeckStage } from "@/components/stages/GeneratingDeckStage";
import { DeckStage } from "@/components/deck/DeckStage";

export default function Home() {
  const stage = useProjectStore((s) => s.stage);
  const projectId = useProjectStore((s) => s.id);
  const extraction = useProjectStore((s) => s.extraction);
  const deck = useProjectStore((s) => s.deck);
  const reset = useProjectStore((s) => s.reset);

  const { projects, addProject, updateProject, setActiveProject } =
    useProjectListStore();

  const [showLanding, setShowLanding] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for zustand hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Show landing if no active work
  useEffect(() => {
    if (hydrated && stage === "input" && !extraction && projects.length > 0) {
      setShowLanding(true);
    }
  }, [hydrated, stage, extraction, projects.length]);

  // Sync project state to project list
  useEffect(() => {
    if (!hydrated || !projectId) return;
    const existing = projects.find((p) => p.id === projectId);
    const summary = {
      id: projectId,
      name: extraction?.projectName || extraction?.objective?.slice(0, 50) || "New Project",
      deckType: extraction?.deckType || undefined,
      stage,
      sceneCount: deck?.scenes?.length || 0,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    if (existing) {
      updateProject(projectId, summary);
    } else if (stage !== "input") {
      addProject(summary);
    }
  }, [hydrated, projectId, stage, extraction, deck, projects, addProject, updateProject]);

  const handleNewProject = useCallback(() => {
    reset();
    setShowLanding(false);
  }, [reset]);

  const handleOpenProject = useCallback(
    (id: string) => {
      // For MVP, we only have one active project in the store.
      // If the current project matches, just open it. Otherwise reset.
      if (id === projectId) {
        setShowLanding(false);
      } else {
        // In a full version we'd load from a DB. For now, the persist
        // middleware only stores one project. Show a notice.
        setActiveProject(id);
        setShowLanding(false);
      }
    },
    [projectId, setActiveProject]
  );

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </main>
    );
  }

  if (showLanding) {
    return (
      <ProjectLanding
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
      />
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <ProgressBar currentStage={stage} onHome={() => setShowLanding(true)} />

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
