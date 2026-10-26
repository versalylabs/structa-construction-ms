"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Flag,
  Edit3,
  X,
} from "lucide-react";
import { updateProjectPhaseProgressAction } from "@/app/actions/projects";
import {
  PROJECT_STATUS_STYLES,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface PhaseProgressItem {
  id: string;
  sequenceOrder: number;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  plannedProgress: number;
  progress: number;
  status: string;
  tasks: {
    id: string;
    code: string;
    name: string;
    status: string;
    progress: number;
  }[];
}

interface ProjectProgressItem {
  id: string;
  code: string;
  name: string;
  status: string;
  plannedProgress: number;
  progress: number;
  budget: number;
  actualCost: number;
  startDate: string;
  expectedCompletionDate: string;
  client: { name: string } | null;
  projectManager: { name: string } | null;
  phases: PhaseProgressItem[];
  milestones: {
    id: string;
    code: string;
    title: string;
    targetDate: string;
    achievedDate: string | null;
    status: string;
  }[];
}

export function ProgressClient({
  projects,
  currency,
  canManageProgress,
}: {
  projects: ProjectProgressItem[];
  currency: string;
  canManageProgress: boolean;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [editingPhase, setEditingPhase] = useState<PhaseProgressItem | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayedProjects =
    selectedProjectId === "ALL"
      ? projects
      : projects.filter((p) => p.id === selectedProjectId);

  const behindScheduleProjects = projects.filter(
    (p) => p.plannedProgress - p.progress >= 5 || p.status === "DELAYED"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Construction Progress & Planned vs. Actual Variance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitor overall project progress, phase completion vs baseline targets, task rollups, and schedule variance alerts.
          </p>
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white"
        >
          <option value="ALL">All Portfolio Projects ({projects.length})</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Variance Alert Banner */}
      {behindScheduleProjects.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Schedule Variance Warning — {behindScheduleProjects.length} Project(s) Falling Behind Planned Baseline
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {behindScheduleProjects
                  .map(
                    (p) =>
                      `${p.code} (Planned: ${p.plannedProgress}% vs Actual: ${p.progress}%)`
                  )
                  .join(" • ")}
              </p>
            </div>
          </div>
          <Link
            href="/operations/tasks?status=BLOCKED"
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950"
          >
            Inspect Blocked Tasks
          </Link>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {feedback}
          </span>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Project-by-Project Planned vs Actual Breakdown */}
      <div className="space-y-6">
        {displayedProjects.map((project) => {
          const variance = project.progress - project.plannedProgress;
          const isBehind = variance < 0;
          const st =
            PROJECT_STATUS_STYLES[project.status] ||
            PROJECT_STATUS_STYLES.PLANNING;

          return (
            <div
              key={project.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
            >
              {/* Project Header Bar */}
              <div className="p-5 border-b border-slate-800 bg-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-400">
                      {project.code}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded border",
                        st.badge
                      )}
                    >
                      {st.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded border",
                        variance < -5
                          ? "bg-red-500/15 text-red-300 border-red-500/30"
                          : variance < 0
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      )}
                    >
                      Schedule Variance: {variance >= 0 ? `+${variance}%` : `${variance}%`}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-lg font-bold text-white hover:text-brand-300 inline-flex items-center gap-1.5"
                  >
                    <span>{project.name}</span>
                    <ArrowUpRight className="h-4 w-4 text-brand-400" />
                  </Link>
                  <div className="text-xs text-slate-400">
                    Client: {project.client?.name} • PM:{" "}
                    {project.projectManager?.name} • Target Handover:{" "}
                    {formatDate(project.expectedCompletionDate)}
                  </div>
                </div>

                {/* Dual Progress Bars: Planned vs Actual */}
                <div className="w-full lg:w-80 rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Planned Schedule</span>
                      <span className="text-slate-200 font-bold">
                        {project.plannedProgress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full"
                        style={{ width: `${project.plannedProgress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-brand-300 font-semibold">
                        Actual Certified Progress
                      </span>
                      <span className="text-brand-400 font-bold">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isBehind ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase-by-Phase Planned vs Actual Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                      <th className="py-3 px-4">Phase</th>
                      <th className="py-3 px-4">Planned %</th>
                      <th className="py-3 px-4">Actual %</th>
                      <th className="py-3 px-4">Variance</th>
                      <th className="py-3 px-4">Linked Tasks</th>
                      <th className="py-3 px-4">Budget vs Actual</th>
                      <th className="py-3 px-4 text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {project.phases.map((ph) => {
                      const phVar = ph.progress - ph.plannedProgress;
                      const doneTasks = ph.tasks.filter(
                        (t) => t.status === "COMPLETED"
                      ).length;
                      return (
                        <tr key={ph.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">
                              <span className="font-mono text-brand-400 mr-1.5">
                                0{ph.sequenceOrder}
                              </span>
                              {ph.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {formatDate(ph.startDate)} →{" "}
                              {formatDate(ph.endDate)}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {ph.plannedProgress}%
                          </td>
                          <td className="py-3 px-4 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white w-9">
                                {ph.progress}%
                              </span>
                              <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    ph.status === "COMPLETED"
                                      ? "bg-emerald-500"
                                      : phVar < 0
                                        ? "bg-amber-500"
                                        : "bg-brand-500"
                                  )}
                                  style={{ width: `${ph.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px]",
                                phVar < 0
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-emerald-500/15 text-emerald-300"
                              )}
                            >
                              {phVar >= 0 ? `+${phVar}%` : `${phVar}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ph.tasks.length > 0 ? (
                              <span className="font-mono text-slate-300">
                                {doneTasks}/{ph.tasks.length} Tasks Done
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="text-slate-300">
                              B: {formatCurrency(ph.budget, currency)}
                            </div>
                            <div className="text-brand-300">
                              A: {formatCurrency(ph.actualCost, currency)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {canManageProgress && (
                              <button
                                type="button"
                                onClick={() => setEditingPhase(ph)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-200"
                              >
                                <Edit3 className="h-3 w-3 text-brand-400" />
                                <span>Record</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Record Phase Progress */}
      {editingPhase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Record Progress: {editingPhase.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Planned Target: {editingPhase.plannedProgress}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhase(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await updateProjectPhaseProgressAction(fd);
                  if (!res?.error) {
                    setFeedback(
                      `Updated '${editingPhase.name}' progress and recalculated parent project rollup.`
                    );
                    setEditingPhase(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input type="hidden" name="phaseId" value={editingPhase.id} />
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Phase Status
                </label>
                <select
                  name="status"
                  defaultValue={editingPhase.status}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed (100%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Actual Certified Progress (%)
                </label>
                <input
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={editingPhase.progress}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Actual Cost Expended ({currency})
                </label>
                <input
                  name="actualCost"
                  type="number"
                  min={0}
                  defaultValue={editingPhase.actualCost}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPhase(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Save Progress Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
