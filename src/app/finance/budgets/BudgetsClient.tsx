"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Landmark,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Edit3,
  RefreshCw,
  X,
  Building2,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import {
  createBudgetLineAction,
  syncBudgetFromBoqAction,
  updateBudgetLineCostAction,
} from "@/app/actions/boq-budgets";
import {
  BUDGET_CATEGORY_STYLES,
  BUDGET_STATUS_STYLES,
  cn,
  computeBudgetLineStatus,
  formatCurrency,
} from "@/lib/utils";

interface BudgetLineRecord {
  id: string;
  projectId: string;
  phaseId: string | null;
  code: string;
  category: string;
  title: string;
  description: string | null;
  allocatedBudget: number;
  committedCost: number;
  actualCost: number;
  alertThresholdPct: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    code: string;
    name: string;
    contractValue: number;
    budget: number;
    committedCost: number;
    actualCost: number;
    status: string;
  };
  phase: {
    id: string;
    sequenceOrder: number;
    name: string;
  } | null;
  updatedBy: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  contractValue: number;
  budget: number;
  committedCost: number;
  actualCost: number;
  status: string;
  phases: { id: string; sequenceOrder: number; name: string }[];
  boqCount: number;
  boqTotal: number;
}

interface BudgetsClientProps {
  budgetLines: BudgetLineRecord[];
  projects: ProjectSummary[];
  currency: string;
  canManageBudgets: boolean;
  initialProjectFilter: string;
  initialCategoryFilter: string;
  initialStatusFilter: string;
}

export function BudgetsClient({
  budgetLines,
  projects,
  currency,
  canManageBudgets,
  initialProjectFilter,
  initialCategoryFilter,
  initialStatusFilter,
}: BudgetsClientProps) {
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create Budget Line Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState(
    initialProjectFilter !== "ALL"
      ? initialProjectFilter
      : projects[0]?.id || ""
  );

  // Edit Cost / Budget Modal
  const [editingLine, setEditingLine] = useState<BudgetLineRecord | null>(null);
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editCommitted, setEditCommitted] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(85);

  const filteredLines = budgetLines.filter((line) => {
    const matchesProject =
      projectFilter === "ALL" || line.projectId === projectFilter;
    const matchesCategory =
      categoryFilter === "ALL" || line.category === categoryFilter;
    const matchesStatus =
      statusFilter === "ALL" || line.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      line.code.toLowerCase().includes(q) ||
      line.title.toLowerCase().includes(q) ||
      line.project.name.toLowerCase().includes(q) ||
      (line.description?.toLowerCase().includes(q) ?? false);
    return matchesProject && matchesCategory && matchesStatus && matchesSearch;
  });

  // Aggregate Budget -> Committed -> Actual -> Remaining (Section 13)
  const totalAllocatedBudget = filteredLines.reduce(
    (sum, l) => sum + l.allocatedBudget,
    0
  );
  const totalCommittedCost = filteredLines.reduce(
    (sum, l) => sum + l.committedCost,
    0
  );
  const totalActualCost = filteredLines.reduce(
    (sum, l) => sum + l.actualCost,
    0
  );
  const totalRemainingBudget = totalAllocatedBudget - totalActualCost;
  const totalUncommittedBudget = totalAllocatedBudget - totalCommittedCost;

  const committedUtilizationPct =
    totalAllocatedBudget > 0
      ? Math.round((totalCommittedCost / totalAllocatedBudget) * 1000) / 10
      : 0;
  const actualSpendPct =
    totalAllocatedBudget > 0
      ? Math.round((totalActualCost / totalAllocatedBudget) * 1000) / 10
      : 0;

  // Overrun & Watchlist lines
  const flaggedLines = filteredLines.filter(
    (l) => l.status === "EXCEEDED" || l.status === "OVERRUN_RISK"
  );

  // Category Breakdown across all 9 construction cost categories
  const categoryBreakdown = Object.keys(BUDGET_CATEGORY_STYLES)
    .map((catKey) => {
      const lines = filteredLines.filter((l) => l.category === catKey);
      const allocated = lines.reduce((s, l) => s + l.allocatedBudget, 0);
      const committed = lines.reduce((s, l) => s + l.committedCost, 0);
      const actual = lines.reduce((s, l) => s + l.actualCost, 0);
      return {
        key: catKey,
        label: BUDGET_CATEGORY_STYLES[catKey].label,
        badge: BUDGET_CATEGORY_STYLES[catKey].badge,
        count: lines.length,
        allocated,
        committed,
        actual,
        remaining: allocated - actual,
      };
    })
    .filter((c) => c.count > 0);

  function handleCreateBudgetLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createBudgetLineAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            "Budget line established and rolled up into project financial controls.",
        });
        setShowCreateModal(false);
      }
    });
  }

  function openEditModal(line: BudgetLineRecord) {
    setEditingLine(line);
    setEditAllocated(line.allocatedBudget);
    setEditCommitted(line.committedCost);
    setEditActual(line.actualCost);
    setEditThreshold(line.alertThresholdPct);
  }

  function handleUpdateBudgetLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingLine) return;
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("budgetLineId", editingLine.id);
    startTransition(async () => {
      const res = await updateBudgetLineCostAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Updated cost control figures for ${editingLine.code}.`,
        });
        setEditingLine(null);
      }
    });
  }

  function handleSyncFromBoq(targetProjectId: string) {
    setFeedback(null);
    const fd = new FormData();
    fd.set("projectId", targetProjectId);
    startTransition(async () => {
      const res = await syncBudgetFromBoqAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            "Successfully synchronized project budget allocations from priced BOQ items.",
        });
      }
    });
  }

  const selectedModalProject = projects.find((p) => p.id === modalProjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400 mb-1">
            <Landmark className="w-3.5 h-3.5" />
            <span>Phase 4 • Cost Engineering & Budget Control</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Project Budgets & Cost Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Structured 9-category cost control tracking{" "}
            <span className="text-slate-200 font-medium">
              Budget → Committed Cost → Actual Cost → Remaining Budget
            </span>{" "}
            with automated overrun flagging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/finance/boq"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>View Priced BOQ Schedule</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {canManageBudgets && projectFilter !== "ALL" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSyncFromBoq(projectFilter)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
              />
              <span>Sync from BOQ</span>
            </button>
          )}

          {canManageBudgets && (
            <button
              type="button"
              onClick={() => {
                if (projectFilter !== "ALL") setModalProjectId(projectFilter);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Establish Budget Line</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Stage Cost Control Waterfall KPIs (Budget -> Committed -> Actual -> Remaining) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              1. Approved Budget
            </span>
            <Landmark className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {formatCurrency(totalAllocatedBudget, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Baseline across {filteredLines.length} cost control line(s)
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              2. Committed Cost
            </span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-cyan-300 mt-2 font-mono">
            {formatCurrency(totalCommittedCost, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {committedUtilizationPct}% committed • Uncommitted:{" "}
            {formatCurrency(totalUncommittedBudget, currency)}
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              3. Actual Expenditure
            </span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-300 mt-2 font-mono">
            {formatCurrency(totalActualCost, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {actualSpendPct}% of total approved budget spent to date
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              4. Remaining Budget
            </span>
            <ShieldAlert
              className={cn(
                "w-4 h-4",
                flaggedLines.length > 0 ? "text-amber-400" : "text-emerald-400"
              )}
            />
          </div>
          <p
            className={cn(
              "text-xl font-bold mt-2 font-mono",
              totalRemainingBudget < 0 ? "text-red-400" : "text-emerald-400"
            )}
          >
            {formatCurrency(totalRemainingBudget, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {flaggedLines.length > 0
              ? `${flaggedLines.length} budget line(s) flagged for overrun risk`
              : "All active lines within safe threshold"}
          </p>
        </div>
      </div>

      {/* Overrun Watchlist Banner (Section 13: "The system should flag potential overruns") */}
      {flaggedLines.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Automated Cost Overrun & Threshold Watchlist ({flaggedLines.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === "OVERRUN_RISK" ? "ALL" : "OVERRUN_RISK"
                )
              }
              className="text-xs text-amber-300 hover:underline"
            >
              {statusFilter === "ALL" ? "Filter Flagged Only" : "Show All Lines"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {flaggedLines.map((fl) => {
              const exposure = Math.max(fl.committedCost, fl.actualCost);
              const pct =
                fl.allocatedBudget > 0
                  ? Math.round((exposure / fl.allocatedBudget) * 1000) / 10
                  : 0;
              const st =
                BUDGET_STATUS_STYLES[fl.status] ||
                BUDGET_STATUS_STYLES.OVERRUN_RISK;
              return (
                <div
                  key={fl.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {fl.code}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border",
                          st.badge
                        )}
                      >
                        {st.label} ({pct}%)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {fl.project.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium mt-1">
                      {fl.title}
                    </p>
                    {fl.notes && (
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        {fl.notes}
                      </p>
                    )}
                  </div>
                  {canManageBudgets && (
                    <button
                      type="button"
                      onClick={() => openEditModal(fl)}
                      className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                    >
                      Review
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9-Category Budget Breakdown Strip */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Budget Allocation & Utilization by Cost Category
            </h2>
            {categoryFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className="text-xs text-brand-400 hover:underline"
              >
                Reset Category Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat) => {
              const commPct =
                cat.allocated > 0
                  ? Math.min(100, Math.round((cat.committed / cat.allocated) * 100))
                  : 0;
              const actPct =
                cat.allocated > 0
                  ? Math.min(100, Math.round((cat.actual / cat.allocated) * 100))
                  : 0;
              const isSelected = categoryFilter === cat.key;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    setCategoryFilter(isSelected ? "ALL" : cat.key)
                  }
                  className={cn(
                    "text-left p-3.5 rounded-lg border transition-all",
                    isSelected
                      ? "bg-slate-800/90 border-brand-500/50 ring-1 ring-brand-500/30"
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                        cat.badge
                      )}
                    >
                      {cat.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {cat.count} line{cat.count === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2.5 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Budget</span>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(cat.allocated, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Committed</span>
                      <span className="font-mono font-semibold text-cyan-300">
                        {formatCurrency(cat.committed, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Actual</span>
                      <span className="font-mono font-semibold text-amber-300">
                        {formatCurrency(cat.actual, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2.5 flex">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${actPct}%` }}
                      title={`Actual: ${actPct}%`}
                    />
                    <div
                      className="h-full bg-cyan-400/60"
                      style={{ width: `${Math.max(0, commPct - actPct)}%` }}
                      title={`Committed: ${commPct}%`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search budget code, category title, or project..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All 9 Cost Categories</option>
            {Object.entries(BUDGET_CATEGORY_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Cost Statuses</option>
            {Object.entries(BUDGET_STATUS_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-semibold">{filteredLines.length}</span> of{" "}
          {budgetLines.length} budget lines
        </div>
      </div>

      {/* Structured Budget Lines Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Budget Code & Category</th>
                <th className="py-3 px-4">Cost Control Scope & Notes</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-right">Approved Budget</th>
                <th className="py-3 px-4 text-right">Committed Cost</th>
                <th className="py-3 px-4 text-right">Actual Cost</th>
                <th className="py-3 px-4 text-right">Remaining (Budget - Actual)</th>
                <th className="py-3 px-4">Cost Utilization & Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No project budget lines match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => {
                  const catStyle =
                    BUDGET_CATEGORY_STYLES[line.category] ||
                    BUDGET_CATEGORY_STYLES.MATERIALS;
                  const statusStyle =
                    BUDGET_STATUS_STYLES[line.status] ||
                    BUDGET_STATUS_STYLES.WITHIN_BUDGET;

                  const remainingActual = line.allocatedBudget - line.actualCost;
                  const uncommitted = line.allocatedBudget - line.committedCost;
                  const commPct =
                    line.allocatedBudget > 0
                      ? Math.round(
                          (line.committedCost / line.allocatedBudget) * 1000
                        ) / 10
                      : 0;
                  const actPct =
                    line.allocatedBudget > 0
                      ? Math.round(
                          (line.actualCost / line.allocatedBudget) * 1000
                        ) / 10
                      : 0;

                  return (
                    <tr
                      key={line.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono font-semibold text-brand-400 block">
                          {line.code}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border mt-1",
                            catStyle.badge
                          )}
                        >
                          {catStyle.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-md">
                        <p className="text-slate-100 font-semibold">
                          {line.title}
                        </p>
                        {line.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {line.description}
                          </p>
                        )}
                        {line.notes && (
                          <p
                            className={cn(
                              "text-[11px] mt-1 font-medium",
                              line.status === "EXCEEDED"
                                ? "text-red-400"
                                : line.status === "OVERRUN_RISK"
                                ? "text-amber-300"
                                : "text-slate-400 italic"
                            )}
                          >
                            • {line.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <Link
                          href={`/projects/${line.project.id}`}
                          className="font-medium text-slate-200 hover:text-brand-400 transition-colors flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{line.project.name}</span>
                        </Link>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {line.project.code}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-mono font-bold text-white">
                        {formatCurrency(line.allocatedBudget, currency)}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <span className="font-mono font-semibold text-cyan-300">
                          {formatCurrency(line.committedCost, currency)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {commPct}% committed
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <span className="font-mono font-semibold text-amber-300">
                          {formatCurrency(line.actualCost, currency)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {actPct}% spent
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <span
                          className={cn(
                            "font-mono font-bold",
                            remainingActual < 0
                              ? "text-red-400"
                              : "text-emerald-400"
                          )}
                        >
                          {formatCurrency(remainingActual, currency)}
                        </span>
                        <p
                          className={cn(
                            "text-[10px] font-mono",
                            uncommitted < 0 ? "text-red-400" : "text-slate-400"
                          )}
                        >
                          Uncomm: {formatCurrency(uncommitted, currency)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top min-w-[170px]">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                              statusStyle.badge
                            )}
                          >
                            {statusStyle.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Alert @{line.alertThresholdPct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            className={cn(
                              "h-full",
                              line.status === "EXCEEDED"
                                ? "bg-red-500"
                                : "bg-amber-400"
                            )}
                            style={{ width: `${Math.min(100, actPct)}%` }}
                          />
                          <div
                            className="h-full bg-cyan-400/60"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, commPct) - Math.min(100, actPct)
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        {canManageBudgets && (
                          <button
                            type="button"
                            onClick={() => openEditModal(line)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-brand-400" />
                            <span>Control</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredLines.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-950/90 text-xs font-bold text-white">
                  <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-400">
                    Total Cost Control Rollup ({filteredLines.length} Budget Lines):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-white">
                    {formatCurrency(totalAllocatedBudget, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-cyan-300">
                    {formatCurrency(totalCommittedCost, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                    {formatCurrency(totalActualCost, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                    {formatCurrency(totalRemainingBudget, currency)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Establish Budget Line Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Establish Project Budget Line
                </h3>
                <p className="text-xs text-slate-400">
                  Allocate baseline budget and configure cost overrun threshold alerts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudgetLine} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
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
                    Budget Category (Section 13) *
                  </label>
                  <select
                    name="category"
                    defaultValue="MATERIALS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {Object.entries(BUDGET_CATEGORY_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Budget Line Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    placeholder="Auto (e.g. BDG-RIV-MAT-02)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Linked Phase (Optional)
                  </label>
                  <select
                    name="phaseId"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="">-- Whole Project Budget --</option>
                    {selectedModalProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase {ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Budget Line Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Structural Steel, Cement & Aggregates Package"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Scope Notes
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Scope covered by this budget allocation..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Allocated Budget *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    name="allocatedBudget"
                    required
                    defaultValue={15000000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Committed Cost
                  </label>
                  <input
                    type="number"
                    step="1000"
                    name="committedCost"
                    defaultValue={0}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Actual Cost
                  </label>
                  <input
                    type="number"
                    step="1000"
                    name="actualCost"
                    defaultValue={0}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alert Threshold %
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    name="alertThresholdPct"
                    defaultValue={85}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Commercial Control Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Optional cost control remarks..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Establish Budget Line"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Budget / Cost Control Modal */}
      {editingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <span className="text-xs font-mono text-brand-400">
                  {editingLine.code} • {editingLine.project.name}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Update Budget, Commitments & Actual Expenditure
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLine(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudgetLine} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                {editingLine.title}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Approved Budget ({currency})
                  </label>
                  <input
                    type="number"
                    step="1000"
                    name="allocatedBudget"
                    required
                    value={editAllocated}
                    onChange={(e) =>
                      setEditAllocated(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-cyan-300 mb-1">
                    Committed Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="1000"
                    name="committedCost"
                    required
                    value={editCommitted}
                    onChange={(e) =>
                      setEditCommitted(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Actual Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="1000"
                    name="actualCost"
                    required
                    value={editActual}
                    onChange={(e) => setEditActual(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Overrun Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    name="alertThresholdPct"
                    required
                    value={editThreshold}
                    onChange={(e) =>
                      setEditThreshold(Number(e.target.value) || 85)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Live Cost Control Status Preview */}
              {(() => {
                const previewStatus = computeBudgetLineStatus(
                  editAllocated,
                  editCommitted,
                  editActual,
                  editThreshold
                );
                const st =
                  BUDGET_STATUS_STYLES[previewStatus] ||
                  BUDGET_STATUS_STYLES.WITHIN_BUDGET;
                const rem = editAllocated - editActual;
                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        Remaining Budget (Budget - Actual):
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          rem < 0 ? "text-red-400" : "text-emerald-400"
                        )}
                      >
                        {formatCurrency(rem, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        Computed Overrun Status:
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border",
                          st.badge
                        )}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cost Variance / Revision Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingLine.notes || ""}
                  placeholder="Reason for commitment/actual cost adjustment..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLine(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Save Cost Control Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
