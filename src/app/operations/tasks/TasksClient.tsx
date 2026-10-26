"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  GitBranch,
  LayoutGrid,
  ListFilter,
  Edit3,
  X,
  ArrowUpRight,
  Ban,
} from "lucide-react";
import {
  createMilestoneAction,
  createTaskAction,
  updateMilestoneStatusAction,
  updateTaskStatusAndProgressAction,
} from "@/app/actions/tasks";
import { cn, formatDate } from "@/lib/utils";

export interface TaskRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  priority: string;
  status: string;
  progress: number;
  notes: string | null;
  blockerReason: string | null;
  project: { id: string; code: string; name: string };
  phase: { id: string; sequenceOrder: number; name: string } | null;
  site: { id: string; code: string; name: string } | null;
  assignedTo: {
    id: string;
    name: string;
    role: string;
    jobTitle: string | null;
  } | null;
  dependsOnTask: {
    id: string;
    code: string;
    name: string;
    status: string;
    progress: number;
  } | null;
}

export interface MilestoneRecord {
  id: string;
  code: string;
  title: string;
  description: string | null;
  targetDate: string;
  achievedDate: string | null;
  status: string;
  valuationLinkedNote: string | null;
  project: { id: string; code: string; name: string };
  phase: { id: string; sequenceOrder: number; name: string } | null;
  owner: { id: string; name: string; role: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  phases: { id: string; sequenceOrder: number; name: string }[];
  sites: { id: string; code: string; name: string }[];
}

interface TasksClientProps {
  tasks: TaskRecord[];
  milestones: MilestoneRecord[];
  projects: ProjectOption[];
  users: { id: string; name: string; role: string; jobTitle: string | null }[];
  canManagePlanning: boolean;
  initialProjectFilter: string;
  initialStatusFilter: string;
  initialView: "table" | "board" | "milestones";
}

export const TASK_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  BLOCKED: {
    label: "Blocked",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

export const TASK_PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-800 text-slate-400 border-slate-700",
  MEDIUM: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  HIGH: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CRITICAL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function TasksClient({
  tasks,
  milestones,
  projects,
  users,
  canManagePlanning,
  initialProjectFilter,
  initialStatusFilter,
  initialView,
}: TasksClientProps) {
  const [view, setView] = useState<"table" | "board" | "milestones">(
    initialView
  );
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] =
    useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [modalProjectId, setModalProjectId] = useState(
    projects[0]?.id || ""
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTasks = tasks.filter((t) => {
    const matchesProject =
      projectFilter === "ALL" || t.project.id === projectFilter;
    const matchesStatus =
      statusFilter === "ALL" || t.status === statusFilter;
    const matchesPriority =
      priorityFilter === "ALL" || t.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "ALL" || t.assignedTo?.id === assigneeFilter;
    const matchesSearch =
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.project.code.toLowerCase().includes(search.toLowerCase()) ||
      (t.phase?.name || "").toLowerCase().includes(search.toLowerCase());

    return (
      matchesProject &&
      matchesStatus &&
      matchesPriority &&
      matchesAssignee &&
      matchesSearch
    );
  });

  const filteredMilestones = milestones.filter((m) => {
    const matchesProject =
      projectFilter === "ALL" || m.project.id === projectFilter;
    const matchesSearch =
      !search.trim() ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    return matchesProject && matchesSearch;
  });

  // KPI metrics
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const achievedMilestones = milestones.filter(
    (m) => m.status === "ACHIEVED"
  ).length;

  const selectedModalProject =
    projects.find((p) => p.id === modalProjectId) || projects[0];
  const candidateDependencies = tasks.filter(
    (t) => t.project.id === selectedModalProject?.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Tasks, Dependencies, Milestones & Project Planning
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Schedule construction activities, enforce prerequisite task dependencies, manage site blockers, and track valuation milestones.
          </p>
        </div>

        {canManagePlanning && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setShowCreateMilestoneModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Flag className="h-4 w-4 text-brand-400" />
              <span>New Milestone</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setShowCreateTaskModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Construction Task</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Scheduled Tasks</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {tasks.length}
            </span>
            <span className="text-xs text-brand-400 font-medium">
              {inProgressCount} In Progress
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {projects.length} construction projects
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Completed Activities</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-400">
              {completedCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% of total)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Verified against phase schedules
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Blocked / Critical Tasks</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={cn(
                "text-2xl font-bold",
                blockedCount > 0 ? "text-red-400" : "text-slate-200"
              )}
            >
              {blockedCount}
            </span>
            <span className="text-xs text-amber-400">
              {tasks.filter((t) => t.priority === "CRITICAL" && t.status !== "COMPLETED").length}{" "}
              Critical open
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dependency & customs/site blockers tracked
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Project Milestones</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {achievedMilestones} / {milestones.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              Achieved
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Linked to interim QS valuations
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-lg border p-3.5 flex items-center justify-between gap-3 text-xs",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* View Switcher & Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              view === "table"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>Schedule & Dependencies ({filteredTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setView("board")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              view === "board"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban Status Board</span>
          </button>

          <button
            type="button"
            onClick={() => setView("milestones")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              view === "milestones"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Milestones ({filteredMilestones.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task code, activity, phase..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name.split("—")[0]}
              </option>
            ))}
          </select>

          {view !== "milestones" && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: SCHEDULE & DEPENDENCIES TABLE */}
      {view === "table" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-4">Task & Activity</th>
                  <th className="py-3.5 px-4">Project & Phase</th>
                  <th className="py-3.5 px-4">Dependency</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Schedule & Priority</th>
                  <th className="py-3.5 px-4">Progress & Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredTasks.map((t) => {
                  const st =
                    TASK_STATUS_STYLES[t.status] ||
                    TASK_STATUS_STYLES.NOT_STARTED;
                  const prioBadge =
                    TASK_PRIORITY_STYLES[t.priority] ||
                    TASK_PRIORITY_STYLES.MEDIUM;
                  const isPrerequisiteIncomplete =
                    t.dependsOnTask && t.dependsOnTask.status !== "COMPLETED";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-4 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-brand-400">
                            {t.code}
                          </span>
                          {t.site && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {t.site.code}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-sm text-white mt-1">
                          {t.name}
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        {t.status === "BLOCKED" && t.blockerReason && (
                          <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300 flex items-start gap-1.5">
                            <Ban className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Blocker:</strong> {t.blockerReason}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/projects/${t.project.id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-brand-400 hover:underline"
                        >
                          <span>{t.project.code}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <div className="text-slate-200 font-medium text-xs mt-0.5">
                          {t.phase
                            ? `Phase 0${t.phase.sequenceOrder}: ${t.phase.name}`
                            : "General Project Scope"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {t.dependsOnTask ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-300">
                              <GitBranch className="h-3 w-3 text-brand-400" />
                              <span>After {t.dependsOnTask.code}</span>
                            </div>
                            <div
                              className={cn(
                                "text-[10px] font-mono",
                                isPrerequisiteIncomplete
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              )}
                            >
                              {isPrerequisiteIncomplete
                                ? `Prereq: ${t.dependsOnTask.progress}% (${t.dependsOnTask.status})`
                                : "✓ Prerequisite Met"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Independent
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">
                          {t.assignedTo?.name || "Unassigned"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.assignedTo?.jobTitle || t.assignedTo?.role || ""}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border mb-1.5",
                            prioBadge
                          )}
                        >
                          {t.priority}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>Due: {formatDate(t.dueDate)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Start: {formatDate(t.startDate)}
                        </div>
                      </td>

                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="font-bold text-white">
                            {t.progress}%
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] border",
                              st.badge
                            )}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mt-1.5">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              t.status === "COMPLETED"
                                ? "bg-emerald-500"
                                : t.status === "BLOCKED"
                                  ? "bg-red-500"
                                  : "bg-brand-500"
                            )}
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {canManagePlanning && (
                          <button
                            type="button"
                            onClick={() => setEditingTask(t)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-brand-400" />
                            <span>Update</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      No construction tasks match your active filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN EXECUTION BOARD */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"] as const
          ).map((colStatus) => {
            const colTasks = filteredTasks.filter(
              (t) => t.status === colStatus
            );
            const st = TASK_STATUS_STYLES[colStatus];
            return (
              <div
                key={colStatus}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded text-xs font-mono font-bold border",
                      st.badge
                    )}
                  >
                    {st.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-brand-400">
                          {t.code}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                            TASK_PRIORITY_STYLES[t.priority]
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white leading-snug">
                        {t.name}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">
                          {t.project.code}
                        </strong>{" "}
                        {t.phase && `• ${t.phase.name}`}
                      </div>

                      {t.dependsOnTask && (
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-brand-400" />
                          <span>
                            Depends on {t.dependsOnTask.code} (
                            {t.dependsOnTask.status})
                          </span>
                        </div>
                      )}

                      {t.status === "BLOCKED" && t.blockerReason && (
                        <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">
                          {t.blockerReason}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[130px]">
                          {t.assignedTo?.name || "Unassigned"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-400">
                            {t.progress}%
                          </span>
                          {canManagePlanning && (
                            <button
                              type="button"
                              onClick={() => setEditingTask(t)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No tasks in {st.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: PROJECT MILESTONES REGISTER */}
      {view === "milestones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMilestones.map((ms) => {
            const isAchieved = ms.status === "ACHIEVED";
            const isDelayed = ms.status === "DELAYED";

            return (
              <div
                key={ms.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-400">
                        {ms.code}
                      </span>
                      <Link
                        href={`/projects/${ms.project.id}`}
                        className="text-xs font-mono text-slate-300 hover:text-brand-300 underline"
                      >
                        {ms.project.code}
                      </Link>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2.5 py-0.5 rounded border font-semibold",
                        isAchieved
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : isDelayed
                            ? "bg-red-500/15 text-red-300 border-red-500/30"
                            : "bg-brand-500/15 text-brand-300 border-brand-500/30"
                      )}
                    >
                      {ms.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{ms.title}</h3>
                  {ms.description && (
                    <p className="text-xs text-slate-400">{ms.description}</p>
                  )}

                  {ms.valuationLinkedNote && (
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 font-medium">
                      {ms.valuationLinkedNote}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5 text-slate-400">
                    <div>
                      Target Deadline:{" "}
                      <strong className="text-slate-200">
                        {formatDate(ms.targetDate)}
                      </strong>
                    </div>
                    {ms.achievedDate && (
                      <div className="text-emerald-400">
                        Achieved: {formatDate(ms.achievedDate)}
                      </div>
                    )}
                  </div>

                  {canManagePlanning && !isAchieved && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("milestoneId", ms.id);
                        fd.set("status", "ACHIEVED");
                        startTransition(async () => {
                          await updateMilestoneStatusAction(fd);
                          setFeedback({
                            type: "success",
                            message: `Marked milestone ${ms.code} as ACHIEVED.`,
                          });
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Certify Achieved</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Schedule Construction Task */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Schedule Construction Task & Dependency
                </h2>
                <p className="text-xs text-slate-400">
                  Assign field or engineering activities linked to a project phase
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await createTaskAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: `Scheduled task ${res.task?.code} ('${res.task?.name}').`,
                    });
                    setShowCreateTaskModal(false);
                  }
                });
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Select Phase --</option>
                    {selectedModalProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase 0{ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Task / Activity Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. 11th Floor Lift Core Wall Rebar & Shuttering Inspection"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Operator
                  </label>
                  <select
                    name="assignedToId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Assign User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="HIGH"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Site
                  </label>
                  <select
                    name="siteId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Primary Site --</option>
                    {selectedModalProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    defaultValue="2026-10-05"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Due Date / Deadline *
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    defaultValue="2026-10-25"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prerequisite Task Dependency (Optional)
                </label>
                <select
                  name="dependsOnTaskId"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- No Prerequisite Task (Independent) --</option>
                  {candidateDependencies.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.code} — {dt.name} [{dt.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Technical Instructions / Notes
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Specification references, concrete grade, or inspection requirements..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Scheduling..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Update Task Status, Progress & Blocker */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Update {editingTask.code}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {editingTask.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editingTask.dependsOnTask &&
              editingTask.dependsOnTask.status !== "COMPLETED" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <strong>Dependency Notice:</strong> This task depends on{" "}
                  <span className="font-mono font-bold">
                    {editingTask.dependsOnTask.code}
                  </span>{" "}
                  ({editingTask.dependsOnTask.status}). It cannot be marked
                  COMPLETED until the prerequisite task is completed.
                </div>
              )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await updateTaskStatusAndProgressAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: `Updated ${editingTask.code} status and progress.`,
                    });
                  }
                  setEditingTask(null);
                });
              }}
              className="space-y-4"
            >
              <input type="hidden" name="taskId" value={editingTask.id} />

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Execution Status
                </label>
                <select
                  name="status"
                  defaultValue={editingTask.status}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="NOT_STARTED">Not Started (0%)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked on Site</option>
                  <option value="COMPLETED">Completed (100%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Completion Progress (%)
                </label>
                <input
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={editingTask.progress}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Blocker Reason (If Blocked)
                </label>
                <input
                  name="blockerReason"
                  defaultValue={editingTask.blockerReason || ""}
                  placeholder="e.g. Awaiting structural engineer rebar sign-off"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Field Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingTask.notes || ""}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Save Task Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Project Milestone */}
      {showCreateMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Create Project Milestone
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateMilestoneModal(false)}
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
                  const res = await createMilestoneAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Created new project milestone.",
                    });
                    setShowCreateMilestoneModal(false);
                  }
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Project *
                </label>
                <select
                  name="projectId"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Milestone Title *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. MEP First-Fix & Pressure Test Sign-off"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Target Completion Date *
                </label>
                <input
                  name="targetDate"
                  type="date"
                  required
                  defaultValue="2026-11-30"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Valuation / Payment Certificate Trigger Note
                </label>
                <input
                  name="valuationLinkedNote"
                  placeholder="e.g. Triggers Interim Valuation Certificate #6 (KSh 45M)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMilestoneModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
