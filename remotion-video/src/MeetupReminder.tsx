import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

/* ── colour palette ─────────────────────────────────────── */
const DEEP_NAVY = "#0a0e27";
const ELECTRIC_BLUE = "#00d4ff";
const NEON_PURPLE = "#a855f7";
const HOT_PINK = "#ec4899";
const WHITE = "#ffffff";
const SOFT_WHITE = "rgba(255,255,255,0.85)";
const GLASS = "rgba(255,255,255,0.06)";

/* ── event data ─────────────────────────────────────────── */
const EVENT = {
  title: "Runway Meetup",
  city: "Dublin",
  date: "March 16, 2026",
  dayOfWeek: "Monday",
  link: "luma.com/otzkkzt8",
  tagline: "Don't miss it.",
};

/* ── helper: animated glow orb ──────────────────────────── */
const GlowOrb: React.FC<{
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
}> = ({ x, y, size, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(
    Math.sin(((frame - delay) / fps) * 1.2),
    [-1, 1],
    [0.7, 1]
  );
  const drift = Math.sin(((frame - delay) / fps) * 0.4) * 15;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        filter: `blur(${size * 0.3}px)`,
        transform: `scale(${breathe}) translateY(${drift}px)`,
        pointerEvents: "none",
      }}
    />
  );
};

/* ── helper: horizontal scan-line ───────────────────────── */
const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const y = interpolate(frame, [0, durationInFrames], [-5, 105], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: `${y}%`,
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${ELECTRIC_BLUE}44 30%, ${ELECTRIC_BLUE}88 50%, ${ELECTRIC_BLUE}44 70%, transparent 100%)`,
        opacity: 0.35,
        pointerEvents: "none",
      }}
    />
  );
};

/* ── helper: particle grid dots ─────────────────────────── */
const ParticleGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 20; col++) {
      const phase = (row * 20 + col) * 0.15;
      const pulse = interpolate(
        Math.sin((frame / fps) * 2 + phase),
        [-1, 1],
        [0.08, 0.3]
      );
      dots.push(
        <div
          key={`${row}-${col}`}
          style={{
            position: "absolute",
            left: `${col * 5.26 + 1}%`,
            top: `${row * 9.09 + 1}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: ELECTRIC_BLUE,
            opacity: pulse,
          }}
        />
      );
    }
  }
  return <>{dots}</>;
};

/* ══════════════════════════════════════════════════════════ */
/*  MAIN COMPOSITION                                        */
/* ══════════════════════════════════════════════════════════ */
export const MeetupReminder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const sp = (delay: number) =>
    spring({ frame, fps, config: { damping: 14, mass: 0.8 }, delay });

  /* ── fade-out at end ────────────────────────────────── */
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  /* ── intro wipe ─────────────────────────────────────── */
  const introWipe = interpolate(frame, [0, 18], [100, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  /* ── element springs ────────────────────────────────── */
  const badgeIn = sp(8);
  const titleIn = sp(18);
  const dateIn = sp(30);
  const dividerIn = sp(38);
  const cityIn = sp(42);
  const linkIn = sp(54);
  const taglineIn = sp(68);
  const ctaGlow = interpolate(
    Math.sin((frame / fps) * 3),
    [-1, 1],
    [0.6, 1]
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 20%, #131845 0%, ${DEEP_NAVY} 60%, #050714 100%)`,
        overflow: "hidden",
        fontFamily:
          "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        opacity: fadeOut,
      }}
    >
      {/* ── background layers ──────────────────────────── */}
      <ParticleGrid />
      <GlowOrb x="5%" y="10%" size={350} color={NEON_PURPLE} delay={0} />
      <GlowOrb x="60%" y="50%" size={300} color={ELECTRIC_BLUE} delay={20} />
      <GlowOrb x="35%" y="70%" size={250} color={HOT_PINK} delay={40} />
      <ScanLine />

      {/* ── intro wipe overlay ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: DEEP_NAVY,
          transform: `translateX(-${introWipe}%)`,
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* ── content ────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* badge */}
        <div
          style={{
            opacity: badgeIn,
            transform: `translateY(${interpolate(badgeIn, [0, 1], [20, 0])}px)`,
            background: GLASS,
            border: `1px solid ${ELECTRIC_BLUE}44`,
            borderRadius: 40,
            padding: "10px 28px",
            marginBottom: 28,
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: ELECTRIC_BLUE,
            }}
          >
            Event Reminder
          </span>
        </div>

        {/* title */}
        <h1
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px) scale(${interpolate(titleIn, [0, 1], [0.9, 1])})`,
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            textAlign: "center",
            margin: 0,
            background: `linear-gradient(135deg, ${WHITE} 0%, ${ELECTRIC_BLUE} 50%, ${NEON_PURPLE} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -2,
          }}
        >
          {EVENT.title}
        </h1>

        {/* divider */}
        <div
          style={{
            width: interpolate(dividerIn, [0, 1], [0, 220]),
            height: 2,
            background: `linear-gradient(90deg, transparent, ${ELECTRIC_BLUE}, transparent)`,
            margin: "26px 0",
          }}
        />

        {/* date row */}
        <div
          style={{
            opacity: dateIn,
            transform: `translateY(${interpolate(dateIn, [0, 1], [25, 0])}px)`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 28, color: HOT_PINK, fontWeight: 700 }}>
            {EVENT.dayOfWeek}
          </span>
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: WHITE,
              letterSpacing: 1,
            }}
          >
            {EVENT.date}
          </span>
        </div>

        {/* city */}
        <div
          style={{
            opacity: cityIn,
            transform: `translateY(${interpolate(cityIn, [0, 1], [20, 0])}px)`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 36,
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: SOFT_WHITE,
              letterSpacing: 2,
            }}
          >
            Dublin
          </span>
        </div>

        {/* CTA link pill */}
        <div
          style={{
            opacity: linkIn,
            transform: `translateY(${interpolate(linkIn, [0, 1], [30, 0])}px) scale(${interpolate(linkIn, [0, 1], [0.85, 1])})`,
            background: `linear-gradient(135deg, ${ELECTRIC_BLUE}, ${NEON_PURPLE})`,
            borderRadius: 60,
            padding: "18px 48px",
            boxShadow: `0 0 ${30 * ctaGlow}px ${ELECTRIC_BLUE}66, 0 0 ${60 * ctaGlow}px ${NEON_PURPLE}33`,
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: WHITE,
              letterSpacing: 1,
            }}
          >
            RSVP &rarr; {EVENT.link}
          </span>
        </div>

        {/* tagline */}
        <p
          style={{
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [15, 0])}px)`,
            fontSize: 24,
            fontWeight: 500,
            color: SOFT_WHITE,
            letterSpacing: 3,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {EVENT.tagline}
        </p>
      </div>

      {/* ── bottom edge glow ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${ELECTRIC_BLUE}, ${NEON_PURPLE}, ${HOT_PINK}, ${ELECTRIC_BLUE})`,
          backgroundSize: "300% 100%",
          backgroundPosition: `${(frame / durationInFrames) * 200}% 0`,
          zIndex: 20,
        }}
      />
    </AbsoluteFill>
  );
};
