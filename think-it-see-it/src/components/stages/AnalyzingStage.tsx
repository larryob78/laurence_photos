"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AnalyzingStage() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles size={48} className="text-violet-400" />
      </motion.div>

      <h2 className="text-3xl font-bold text-white mb-4">Extracting structure</h2>
      <p className="text-white/40 max-w-md text-center">
        Finding the strategy, insights, and tensions in your thinking...
      </p>

      <div className="mt-12 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-400"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
