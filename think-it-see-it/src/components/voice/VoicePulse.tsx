"use client";

import { motion } from "framer-motion";

interface VoicePulseProps {
  isActive: boolean;
}

export function VoicePulse({ isActive }: VoicePulseProps) {
  if (!isActive) return null;

  return (
    <div className="relative flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-rose-400/40"
          initial={{ width: 40, height: 40, opacity: 0.6 }}
          animate={{
            width: [40, 80 + i * 30],
            height: [40, 80 + i * 30],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        className="relative z-10 w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <div className="flex gap-[3px] items-center h-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-[2px] bg-white rounded-full"
              animate={{ height: ["4px", "16px", "4px"] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
