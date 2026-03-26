"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Clock, Layers } from "lucide-react";
import { useProjectListStore } from "@/store/project-store";
import type { ProjectSummary } from "@/store/project-store";

interface ProjectLandingProps {
  onNewProject: () => void;
  onOpenProject: (id: string) => void;
}

export function ProjectLanding({ onNewProject, onOpenProject }: ProjectLandingProps) {
  const { projects, removeProject } = useProjectListStore();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <motion.div
        className="flex flex-col items-center justify-center pt-24 pb-16 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-center">
          <span className="text-white/60">Think it.</span>{" "}
          <span className="text-white">See it.</span>
        </h1>
        <p className="text-lg text-white/40 max-w-lg mx-auto text-center mb-10">
          Turn messy thinking into living presentations.
          Voice-first. Strategy-led. Scene-based.
        </p>

        <button
          onClick={onNewProject}
          className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all"
        >
          <Plus size={20} />
          New Project
        </button>
      </motion.div>

      {/* Project list */}
      {projects.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-6 pb-24">
          <h2 className="text-sm uppercase tracking-wider text-white/30 mb-6">
            Recent Projects
          </h2>
          <div className="grid gap-4">
            {projects
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onOpen={() => onOpenProject(project.id)}
                  onDelete={() => removeProject(project.id)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
  onDelete,
}: {
  project: ProjectSummary;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const timeAgo = getTimeAgo(project.updatedAt);

  return (
    <motion.div
      className="group flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer"
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Layers size={18} className="text-violet-400/60" />
        </div>
        <div>
          <h3 className="text-white font-medium">{project.name || "Untitled Project"}</h3>
          <div className="flex items-center gap-3 mt-1">
            {project.deckType && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400/50">
                {project.deckType}
              </span>
            )}
            <span className="text-white/30 text-xs capitalize">{project.stage.replace("-", " ")}</span>
            {project.sceneCount > 0 && (
              <span className="text-white/20 text-xs">{project.sceneCount} scenes</span>
            )}
            <span className="text-white/20 text-xs flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 rounded-lg text-white/0 group-hover:text-white/20 hover:!text-rose-400 hover:bg-rose-500/10 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
