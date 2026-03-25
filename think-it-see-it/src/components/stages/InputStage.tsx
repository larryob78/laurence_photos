"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, ArrowRight, Type, Sparkles } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { VoicePulse } from "@/components/voice/VoicePulse";
import { useProjectStore } from "@/store/project-store";
import { analyzeInput } from "@/lib/ai-client";

export function InputStage() {
  const [textInput, setTextInput] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isListening, isSupported, transcript, interimTranscript, startListening, stopListening, resetTranscript } =
    useVoiceInput();

  const { setRawInput, setExtraction, setStage, setStoryShapes } = useProjectStore();

  const currentText = mode === "voice" ? transcript + interimTranscript : textInput;

  const handleSubmit = useCallback(async () => {
    const finalText = mode === "voice" ? transcript : textInput;
    if (!finalText.trim()) return;

    setError(null);
    setIsProcessing(true);

    try {
      setRawInput({
        text: finalText.trim(),
        source: mode,
        timestamp: Date.now(),
      });

      setStage("analyzing");
      const extraction = await analyzeInput(finalText.trim());
      setExtraction(extraction);

      // Immediately fetch story shapes
      const res = await fetch("/api/story-shapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction }),
      });
      const shapes = await res.json();
      setStoryShapes(shapes);
      setStage("story-shapes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("input");
    } finally {
      setIsProcessing(false);
    }
  }, [mode, transcript, textInput, setRawInput, setExtraction, setStage, setStoryShapes]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
          <span className="text-white/60">Think it.</span>{" "}
          <span className="text-white">See it.</span>
        </h1>
        <p className="text-lg text-white/40 max-w-md mx-auto">
          Speak or paste your thinking. We&apos;ll turn it into a living presentation.
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-8 bg-white/5 rounded-full p-1">
        <button
          onClick={() => { setMode("voice"); resetTranscript(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            mode === "voice"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <Mic size={16} /> Voice
        </button>
        <button
          onClick={() => { setMode("text"); stopListening(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            mode === "text"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <Type size={16} /> Text
        </button>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-2xl">
        {mode === "voice" ? (
          <div className="flex flex-col items-center gap-8">
            <div className="relative h-32 flex items-center justify-center">
              <VoicePulse isActive={isListening} />
              {!isListening && (
                <button
                  onClick={startListening}
                  disabled={!isSupported}
                  className="relative z-10 w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Mic size={28} className="text-white/80" />
                </button>
              )}
            </div>

            {isListening && (
              <button
                onClick={stopListening}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-all"
              >
                <MicOff size={16} /> Stop Recording
              </button>
            )}

            {!isSupported && (
              <p className="text-amber-400/60 text-sm">
                Voice input not supported in this browser. Try Chrome or Edge.
              </p>
            )}

            {/* Live Transcript */}
            {(transcript || interimTranscript) && (
              <motion.div
                className="w-full bg-white/5 rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <p className="text-white/70 text-sm mb-2 uppercase tracking-wider">Live transcript</p>
                <p className="text-white/90 leading-relaxed">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-white/40 italic">{interimTranscript}</span>
                  )}
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your brief, brain dump, strategy notes, meeting transcript... anything. The messier the better."
            className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl p-6 text-white/90 placeholder-white/20 resize-none focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-lg leading-relaxed"
          />
        )}

        {/* Submit */}
        {error && (
          <motion.p
            className="text-rose-400 text-sm mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <motion.div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={!currentText.trim() || isProcessing}
            className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Sparkles size={20} className="animate-spin" />
                Extracting structure...
              </>
            ) : (
              <>
                Transform
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
