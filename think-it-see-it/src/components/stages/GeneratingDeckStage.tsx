"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export function GeneratingDeckStage() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <Layers size={48} className="text-amber-400" />
      </motion.div>

      <h2 className="text-3xl font-bold text-white mb-4">Building your living deck</h2>
      <p className="text-white/40 max-w-md text-center">
        Crafting scenes, writing headlines, setting the visual direction...
      </p>

      <div className="mt-12 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-400"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
