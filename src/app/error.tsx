"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Production Error Boundary • Safe Recovery
            </span>
            <h1 className="text-lg font-bold text-white mt-1">
              Operational View Interrupted
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Structa intercepted an unexpected runtime condition while rendering this module. All multi-tenant financial, BOQ, and site records remain safely isolated and intact.
        </p>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-brand-400 shrink-0" />
          <span className="truncate">
            Diagnostic Ref: {error.digest || error.message || "STRUCTA-SAFE-GUARD"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Module Load</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium px-4 py-2 text-xs transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to Executive Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
