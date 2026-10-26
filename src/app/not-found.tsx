import React from "react";
import Link from "next/link";
import { Compass, Home, FolderKanban } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
              HTTP 404 • Route Not Found
            </span>
            <h1 className="text-lg font-bold text-white mt-1">
              Construction Coordinate Not Found
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The requested page or project resource does not exist or belongs to an isolated tenant organization outside your current session scope.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold px-4 py-2 text-xs transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Executive Dashboard</span>
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium px-4 py-2 text-xs transition-colors"
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Browse Active Projects</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
