"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Search,
  Building2,
  MapPin,
  Layers,
  Calendar,
  UserCheck,
  X,
  Wrench,
} from "lucide-react";
import {
  cn,
  formatDate,
  ISSUE_CATEGORY_STYLES,
  ISSUE_SEVERITY_STYLES,
  ISSUE_STATUS_STYLES,
} from "@/lib/utils";
import {
  createProjectIssueAction,
  updateProjectIssueStatusAction,
} from "@/app/actions/site-operations";

interface ProjectIssueItem {
  id: string;
  issueCode: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  impactSummary: string | null;
  resolutionPlan: string | null;
  dueDate: string;
  resolvedAt: string | null;
  projectId: string;
  siteId: string | null;
  phaseId: string | null;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
  reportedBy: { id: string; name: string; role: string } | null;
  assignedTo: { id: string; name: string; role: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  sites: { id: string; code: string; name: string }[];
  phases: { id: string; sequenceOrder: number; name: string }[];
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
}

interface IssuesClientProps {
  issues: ProjectIssueItem[];
  projects: ProjectOption[];
  users: UserOption[];
  initialProjectFilter: string;
  initialSeverityFilter: string;
  canManageIssues: boolean;
}

export function IssuesClient({
  issues,
  projects,
  users,
  initialProjectFilter,
  initialSeverityFilter,
  canManageIssues,
}: IssuesClientProps) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState(initialSeverityFilter);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [selectedModalProjectId, setSelectedModalProjectId] = useState(
    projects[0]?.id || ""
  );
  const [editingIssue, setEditingIssue] = useState<ProjectIssueItem | null>(
    null
  );

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        iss.issueCode.toLowerCase().includes(q) ||
        iss.title.toLowerCase().includes(q) ||
        iss.description.toLowerCase().includes(q) ||
        iss.project.code.toLowerCase().includes(q) ||
        iss.project.name.toLowerCase().includes(q) ||
        (iss.resolutionPlan && iss.resolutionPlan.toLowerCase().includes(q));

      const matchesProject =
        projectFilter === "ALL" || iss.projectId === projectFilter;
      const matchesCategory =
        categoryFilter === "ALL" || iss.category === categoryFilter;
      const matchesSeverity =
        severityFilter === "ALL" || iss.severity === severityFilter;
      const matchesStatus =
        statusFilter === "ALL" || iss.status === statusFilter;

      return (
        matchesSearch &&
        matchesProject &&
        matchesCategory &&
        matchesSeverity &&
        matchesStatus
      );
    });
  }, [
    issues,
    search,
    projectFilter,
    categoryFilter,
    severityFilter,
    statusFilter,
  ]);

  const kpis = useMemo(() => {
    const openOrActive = issues.filter(
      (i) =>
        i.status === "OPEN" ||
        i.status === "IN_PROGRESS" ||
        i.status === "ESCALATED"
    ).length;
    const criticalOrHigh = issues.filter(
      (i) =>
        (i.severity === "CRITICAL" || i.severity === "HIGH") &&
        i.status !== "RESOLVED" &&
        i.status !== "CLOSED"
    ).length;
    const escalatedCount = issues.filter(
      (i) => i.status === "ESCALATED"
    ).length;
    const resolvedCount = issues.filter(
      (i) => i.status === "RESOLVED" || i.status === "CLOSED"
    ).length;

    return {
      total: issues.length,
      openOrActive,
      criticalOrHigh,
      escalatedCount,
      resolvedCount,
    };
  }, [issues]);

  const selectedModalProject = useMemo(
    () => projects.find((p) => p.id === selectedModalProjectId),
    [projects, selectedModalProjectId]
  );

  function handleCreateIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await createProjectIssueAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Site issue / risk logged to register and assigned for mitigation.",
        });
        setShowNewIssueModal(false);
      }
    });
  }

  function handleUpdateIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await updateProjectIssueStatusAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Issue status and resolution plan updated.",
        });
        setEditingIssue(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Phase 8 • Site Issues, Snags & Risk Register</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Construction Issues, RFIs, Site Snags & Risk Mitigation
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Track material delays, MEP design clashes, expansive soil variations, quality defects, and weather disruptions with severity escalation and resolution sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/operations/site-reports"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            ← Site Reports
          </Link>
          <Link
            href="/operations/inspections"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            QA/QC & Safety →
          </Link>
          {canManageIssues && (
            <button
              onClick={() => setShowNewIssueModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Site Issue / Snag
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between text-xs font-medium",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Logged Issues</span>
            <AlertTriangle className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {kpis.openOrActive} active • {kpis.resolvedCount} resolved
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical / High Risks</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {kpis.criticalOrHigh}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Requires urgent PM / QS action
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Escalated to Consultants</span>
            <Wrench className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {kpis.escalatedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            RFIs, customs & design variations
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Resolved & Closed Snags</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {kpis.resolvedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rectified and verified on site
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search issue #, snag, RFI, resolution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-brand-500 w-64"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(ISSUE_CATEGORY_STYLES).map(([k, val]) => (
              <option key={k} value={k}>
                {val.label}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
          >
            <option value="ALL">All Severities</option>
            {Object.entries(ISSUE_SEVERITY_STYLES).map(([k, val]) => (
              <option key={k} value={k}>
                {val.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(ISSUE_STATUS_STYLES).map(([k, val]) => (
              <option key={k} value={k}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredIssues.length} of {issues.length} records
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((iss) => {
          const catStyle =
            ISSUE_CATEGORY_STYLES[iss.category] ||
            ISSUE_CATEGORY_STYLES.QUALITY_DEFECT_SNAG;
          const sevStyle =
            ISSUE_SEVERITY_STYLES[iss.severity] || ISSUE_SEVERITY_STYLES.MEDIUM;
          const stStyle =
            ISSUE_STATUS_STYLES[iss.status] || ISSUE_STATUS_STYLES.OPEN;

          return (
            <div
              key={iss.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-3.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-brand-400 border border-slate-700">
                    {iss.issueCode}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded text-[11px] font-mono border",
                      catStyle.badge
                    )}
                  >
                    {catStyle.label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border",
                      sevStyle.badge
                    )}
                  >
                    <span
                      className={cn("w-1.5 h-1.5 rounded-full", sevStyle.dot)}
                    />
                    {sevStyle.label}
                  </span>
                  <Link
                    href={`/projects/${iss.project.id}`}
                    className="text-xs font-bold text-slate-200 hover:text-brand-400 flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-brand-400" />
                    {iss.project.code} — {iss.project.name}
                  </Link>
                </div>

                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-mono font-semibold border self-start lg:self-auto",
                    stStyle.badge
                  )}
                >
                  {stStyle.label}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{iss.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {iss.description}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                {iss.impactSummary && (
                  <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                    <div className="text-[10px] font-mono uppercase text-red-400 font-bold">
                      Schedule / Cost Impact Assessment
                    </div>
                    <p className="text-slate-200 mt-0.5">{iss.impactSummary}</p>
                  </div>
                )}

                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    Engineering Resolution & Mitigation Plan
                  </div>
                  <p className="text-slate-200 mt-0.5">
                    {iss.resolutionPlan || "Mitigation plan pending assignment."}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                    Responsible:{" "}
                    <strong className="text-slate-200">
                      {iss.assignedTo?.name || "Unassigned"}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Target Resolution:{" "}
                    <strong className="text-slate-200">
                      {formatDate(iss.dueDate)}
                    </strong>
                  </span>
                  {iss.phase && (
                    <span className="inline-flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      {iss.phase.name}
                    </span>
                  )}
                </div>

                {canManageIssues && (
                  <button
                    onClick={() => setEditingIssue(iss)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Update Resolution / Status
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: LOG SITE ISSUE / SNAG */}
      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base text-white">
                  Log Site Issue, Snag or Risk
                </h3>
              </div>
              <button
                onClick={() => setShowNewIssueModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateIssue}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    value={selectedModalProjectId}
                    onChange={(e) => setSelectedModalProjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {selectedModalProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase {ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Issue Category *
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(ISSUE_CATEGORY_STYLES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Severity *
                  </label>
                  <select
                    name="severity"
                    defaultValue="HIGH"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(ISSUE_SEVERITY_STYLES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Issue / Snag Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Core wall plumbness deviation on Lift Shaft #2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  rows={2}
                  required
                  placeholder="Describe the site condition, snag, or risk..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Schedule / Cost Impact Summary
                </label>
                <input
                  type="text"
                  name="impactSummary"
                  placeholder="e.g. 2-day hold on lift guide-rail bracket fixing"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Proposed Resolution Plan
                </label>
                <textarea
                  name="resolutionPlan"
                  rows={2}
                  placeholder="Describe corrective action or RFI escalation..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assign Responsible Person
                  </label>
                  <select
                    name="assignedToId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.jobTitle || u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    defaultValue="2026-03-26"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewIssueModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isPending ? "Logging..." : "Log Issue / Risk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE ISSUE STATUS & RESOLUTION */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-brand-400 font-bold">
                  {editingIssue.issueCode}
                </div>
                <h3 className="font-bold text-base text-white">
                  {editingIssue.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingIssue(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateIssue} className="p-6 space-y-4 text-xs">
              <input type="hidden" name="issueId" value={editingIssue.id} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Resolution Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingIssue.status}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(ISSUE_STATUS_STYLES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Severity Level
                  </label>
                  <select
                    name="severity"
                    defaultValue={editingIssue.severity}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(ISSUE_SEVERITY_STYLES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Responsible Owner
                </label>
                <select
                  name="assignedToId"
                  defaultValue={editingIssue.assignedTo?.id || ""}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.jobTitle || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Resolution / Corrective Action Taken
                </label>
                <textarea
                  name="resolutionPlan"
                  rows={3}
                  defaultValue={editingIssue.resolutionPlan || ""}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
