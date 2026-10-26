import React from "react";
import { cn } from "@/lib/utils";

interface StructaLogoIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-14 w-14",
};

export function StructaLogoIcon({ className, size = "md" }: StructaLogoIconProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-brand-500/40 shadow-md shadow-brand-500/10 overflow-hidden",
        SIZE_MAP[size],
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <defs>
          <linearGradient id="logoAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="logoFlame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Structural grid line */}
        <path d="M12 48L52 48" stroke="#334155" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Construction Hard Hat / Structural Crown */}
        <g filter="url(#logoGlow)">
          {/* Dome */}
          <path
            d="M18 36C18 24.9543 24.268 18 32 18C39.732 18 46 24.9543 46 36H18Z"
            fill="url(#logoAmber)"
          />
          {/* Top Rib */}
          <path d="M30 17H34V35H30V17Z" fill="#fef3c7" opacity="0.95" />
          {/* Accent Ridges */}
          <path d="M24 23C25 21 27 20 27 20L27 34H24V23Z" fill="#fbbf24" opacity="0.75" />
          <path d="M40 23C39 21 37 20 37 20L37 34H40V23Z" fill="#d97706" opacity="0.75" />
          {/* Brim */}
          <path
            d="M13 36C13 35.4477 13.4477 35 14 35H50C50.5523 35 51 35.4477 51 36C51 38.5 48.5 40 45 40H19C15.5 40 13 38.5 13 36Z"
            fill="url(#logoFlame)"
          />
          <path d="M14 36H50" stroke="#fef3c7" strokeWidth="1" opacity="0.5" />
        </g>

        {/* Steel Pedestal / Foundation Beam */}
        <rect x="16" y="44" width="32" height="6" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
        <circle cx="21" cy="47" r="1.3" fill="#fbbf24" />
        <circle cx="32" cy="47" r="1.3" fill="#fbbf24" />
        <circle cx="43" cy="47" r="1.3" fill="#fbbf24" />
      </svg>
    </div>
  );
}

interface StructaLogoProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export function StructaLogo({
  className,
  iconSize = "md",
  showTagline = true,
}: StructaLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <StructaLogoIcon size={iconSize} />
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-tight text-base sm:text-lg text-white">
            STRUCTA
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
            OS
          </span>
        </div>
        {showTagline && (
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
            by Versaly
          </p>
        )}
      </div>
    </div>
  );
}
