"use client";

interface GaugeProps {
  value: number;
  size?: number;
  label?: string;
  color?: string;
}

export function Gauge({ value, size = 80, label, color }: GaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  const resolvedColor =
    color ??
    (clampedValue > 70 ? "#00ff88" : clampedValue >= 40 ? "#ffcc00" : "#ff3366");

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#181828"
          strokeWidth={strokeWidth}
        />
        {/* Value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${resolvedColor}40)` }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={resolvedColor}
          fontSize={size * 0.26}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={600}
          className="transform rotate-90"
          style={{ transformOrigin: "center" }}
        >
          {clampedValue}
        </text>
      </svg>
      {label && (
        <span className="text-[10px] text-dim uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
