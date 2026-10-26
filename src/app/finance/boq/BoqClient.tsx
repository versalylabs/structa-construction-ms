"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calculator,
  Plus,
  Search,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  RefreshCw,
  X,
  Building2,
  ArrowUpRight,
  FileSpreadsheet,
} from "lucide-react";
import {
  createBoqItemAction,
  syncBudgetFromBoqAction,
  updateBoqItemValuationAction,
} from "@/app/actions/boq-budgets";
import {
  BOQ_SECTION_STYLES,
  BUDGET_CATEGORY_STYLES,
  cn,
  formatCurrency,
} from "@/lib/utils";

interface BoqItemRecord {
  id: string;
  projectId: string;
  phaseId: string | null;
  itemCode: string;
  description: string;
  category: string;
  costCategory: string;
  unit: string;
  quantity: number;
  executedQuantity: number;
  unitRate: number;
  totalAmount: number;
  executedAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    code: string;
    name: string;
    contractValue: number;
    budget: number;
  };
  phase: {
    id: string;
    sequenceOrder: number;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  contractValue: number;
  budget: number;
  phases: { id: string; sequenceOrder: number; name: string }[];
}

interface BoqClientProps {
  boqItems: BoqItemRecord[];
  projects: ProjectOption[];
  currency: string;
  canManageBoq: boolean;
  canManageBudgets: boolean;
  initialProjectFilter: string;
  initialCategoryFilter: string;
}

export function BoqClient({
  boqItems,
  projects,
  currency,
  canManageBoq,
  canManageBudgets,
  initialProjectFilter,
  initialCategoryFilter,
}: BoqClientProps) {
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add BOQ Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectId, setNewProjectId] = useState(
    initialProjectFilter !== "ALL"
      ? initialProjectFilter
      : projects[0]?.id || ""
  );
  const [liveQty, setLiveQty] = useState<number>(100);
  const [liveExecQty, setLiveExecQty] = useState<number>(0);
  const [liveRate, setLiveRate] = useState<number>(18500);

  // Edit / QS Valuation Modal State
  const [editingItem, setEditingItem] = useState<BoqItemRecord | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editExecQty, setEditExecQty] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);

  const selectedModalProject = projects.find((p) => p.id === newProjectId);

  const filteredItems = boqItems.filter((item) => {
    const matchesProject =
      projectFilter === "ALL" || item.projectId === projectFilter;
    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.itemCode.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.project.name.toLowerCase().includes(q) ||
      (item.phase?.name.toLowerCase().includes(q) ?? false);
    return matchesProject && matchesCategory && matchesSearch;
  });

  // Portfolio / Filtered BOQ Metrics
  const totalBillValue = filteredItems.reduce(
    (sum, i) => sum + i.totalAmount,
    0
  );
  const totalCertifiedValue = filteredItems.reduce(
    (sum, i) => sum + i.executedAmount,
    0
  );
  const remainingBoqValue = Math.max(0, totalBillValue - totalCertifiedValue);
  const overallValuationPct =
    totalBillValue > 0
      ? Math.round((totalCertifiedValue / totalBillValue) * 1000) / 10
      : 0;

  // Group by category for section summary pills
  const sectionTotals = Object.keys(BOQ_SECTION_STYLES)
    .map((secKey) => {
      const items = filteredItems.filter((i) => i.category === secKey);
      const total = items.reduce((s, i) => s + i.totalAmount, 0);
      const executed = items.reduce((s, i) => s + i.executedAmount, 0);
      return {
        key: secKey,
        label: BOQ_SECTION_STYLES[secKey].label,
        badge: BOQ_SECTION_STYLES[secKey].badge,
        count: items.length,
        total,
        executed,
      };
    })
    .filter((s) => s.count > 0);

  function handleCreateBoqItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createBoqItemAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            "BOQ line item priced and added to the project Bill of Quantities schedule.",
        });
        setShowAddModal(false);
      }
    });
  }

  function openValuationModal(item: BoqItemRecord) {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditExecQty(item.executedQuantity);
    setEditRate(item.unitRate);
  }

  function handleUpdateValuation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingItem) return;
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("itemId", editingItem.id);
    startTransition(async () => {
      const res = await updateBoqItemValuationAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Updated QS measured quantity & valuation for ${editingItem.itemCode}.`,
        });
        setEditingItem(null);
      }
    });
  }

  function handleSyncProjectBudget(targetProjectId: string) {
    setFeedback(null);
    const fd = new FormData();
    fd.set("projectId", targetProjectId);
    startTransition(async () => {
      const res = await syncBudgetFromBoqAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        const targetPrj = projects.find((p) => p.id === targetProjectId);
        setFeedback({
          type: "success",
          message: `Rolled up priced BOQ categories into baseline project budgets for ${targetPrj?.name || "project"}.`,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Phase 4 • Quantity Surveying & Commercial Control</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bills of Quantities (BOQ) Schedule
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Priced construction work schedules (Total = Quantity × Unit Rate), site re-measurement valuations, and budget rollups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/finance/budgets"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Project Budgets</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {canManageBudgets && projectFilter !== "ALL" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSyncProjectBudget(projectFilter)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
              />
              <span>Sync Project Budget from BOQ</span>
            </button>
          )}

          {canManageBoq && (
            <button
              type="button"
              onClick={() => {
                if (projectFilter !== "ALL") setNewProjectId(projectFilter);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Priced BOQ Item</span>
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

      {/* Top Commercial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Priced BOQ Value
            </span>
            <Calculator className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {formatCurrency(totalBillValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Sum of {filteredItems.length} priced BOQ items (Qty × Rate)
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              QS Certified / Measured Value
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-2 font-mono">
            {formatCurrency(totalCertifiedValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Executed Quantity × Unit Rate on site
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Unmeasured / Remaining Bill
            </span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-cyan-300 mt-2 font-mono">
            {formatCurrency(remainingBoqValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Remaining contract works to be executed
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              BOQ Valuation Progress
            </span>
            <span className="text-xs font-mono font-bold text-brand-400">
              {overallValuationPct}%
            </span>
          </div>
          <p className="text-xl font-bold text-white mt-2">
            {overallValuationPct}% Certified
          </p>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
              style={{ width: `${Math.min(100, overallValuationPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOQ Section Summary Strip */}
      {sectionTotals.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              BOQ Trade Section Breakdown
            </h2>
            {categoryFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className="text-xs text-brand-400 hover:underline"
              >
                Show All Sections
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sectionTotals.map((sec) => {
              const pct =
                sec.total > 0
                  ? Math.round((sec.executed / sec.total) * 100)
                  : 0;
              const isSelected = categoryFilter === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() =>
                    setCategoryFilter(isSelected ? "ALL" : sec.key)
                  }
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all",
                    isSelected
                      ? "bg-slate-800/90 border-brand-500/50 ring-1 ring-brand-500/30"
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                        sec.badge
                      )}
                    >
                      {sec.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {sec.count} item{sec.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono mt-2">
                    {formatCurrency(sec.total, currency)}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Certified: {pct}%</span>
                    <span className="font-mono text-emerald-400">
                      {formatCurrency(sec.executed, currency)}
                    </span>
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
              placeholder="Search by BOQ code (e.g. BOQ-RIV-C.01), description, concrete class..."
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
            <option value="ALL">All BOQ Trade Sections</option>
            {Object.entries(BOQ_SECTION_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-semibold">{filteredItems.length}</span> of{" "}
          {boqItems.length} BOQ items
        </div>
      </div>

      {/* Priced BOQ Schedule Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Work Description & Trade Section</th>
                <th className="py-3 px-4">Project & Phase</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Bill Qty</th>
                <th className="py-3 px-4 text-right">Measured Qty</th>
                <th className="py-3 px-4 text-right">Unit Rate ({currency})</th>
                <th className="py-3 px-4 text-right">Total Amount (Qty × Rate)</th>
                <th className="py-3 px-4 text-right">Certified Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No BOQ items match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const secStyle =
                    BOQ_SECTION_STYLES[item.category] ||
                    BOQ_SECTION_STYLES.SUPERSTRUCTURE_CONCRETE;
                  const costStyle =
                    BUDGET_CATEGORY_STYLES[item.costCategory] ||
                    BUDGET_CATEGORY_STYLES.MATERIALS;
                  const execPct =
                    item.quantity > 0
                      ? Math.min(
                          100,
                          Math.round((item.executedQuantity / item.quantity) * 100)
                        )
                      : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono font-semibold text-brand-400">
                          {item.itemCode}
                        </span>
                        <div className="mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                              costStyle.badge
                            )}
                          >
                            {costStyle.label}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-md">
                        <p className="text-slate-100 font-medium leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                              secStyle.badge
                            )}
                          >
                            {secStyle.label}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-slate-400 italic">
                              • {item.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <Link
                          href={`/projects/${item.project.id}`}
                          className="font-medium text-slate-200 hover:text-brand-400 transition-colors flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.project.name}</span>
                        </Link>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.phase
                            ? `Phase ${item.phase.sequenceOrder}: ${item.phase.name}`
                            : "General Project Scope"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono text-slate-300">
                        {item.unit}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-mono text-slate-200">
                        {item.quantity.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <span className="font-mono text-emerald-400 font-medium">
                          {item.executedQuantity.toLocaleString()}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-auto mt-1">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${execPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-mono text-slate-300">
                        {item.unitRate.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-mono font-bold text-white">
                        {formatCurrency(item.totalAmount, currency)}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-mono text-emerald-400">
                        {formatCurrency(item.executedAmount, currency)}
                        <p className="text-[10px] text-slate-400">{execPct}% cert.</p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        {canManageBoq && (
                          <button
                            type="button"
                            onClick={() => openValuationModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-brand-400" />
                            <span>Measure</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-950/90 text-xs font-bold text-white">
                  <td colSpan={7} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-400">
                    Schedule Grand Total ({filteredItems.length} BOQ Line Items):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-brand-400 text-sm">
                    {formatCurrency(totalBillValue, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 text-sm">
                    {formatCurrency(totalCertifiedValue, currency)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Priced BOQ Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Add Priced Bill of Quantities (BOQ) Item
                </h3>
                <p className="text-xs text-slate-400">
                  Total Amount is automatically calculated as Quantity × Unit Rate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBoqItem} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
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
                    Project Phase (Optional)
                  </label>
                  <select
                    name="phaseId"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="">-- General Project Scope --</option>
                    {selectedModalProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase {ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    BOQ Item Code
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    placeholder="Auto (e.g. BOQ-RIV-F.01)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    BOQ Trade Section *
                  </label>
                  <select
                    name="category"
                    defaultValue="SUPERSTRUCTURE_CONCRETE"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {Object.entries(BOQ_SECTION_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Budget Cost Category *
                  </label>
                  <select
                    name="costCategory"
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Item Specification / Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  placeholder="e.g. Vibrated reinforced concrete Class 30/20 in suspended beams and floor slabs..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    defaultValue="m³"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  >
                    <option value="m³">m³ (Cubic Metres)</option>
                    <option value="m²">m² (Square Metres)</option>
                    <option value="m">m (Linear Metres)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="Tonnes">Tonnes</option>
                    <option value="Bags">Bags (50kg)</option>
                    <option value="No.">No. (Number)</option>
                    <option value="Item">Item</option>
                    <option value="Sum">Lump Sum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bill Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    required
                    value={liveQty}
                    onChange={(e) => setLiveQty( Number(e.target.value) || 0 )}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Executed Qty (Site)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="executedQuantity"
                    value={liveExecQty}
                    onChange={(e) => setLiveExecQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit Rate ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitRate"
                    required
                    value={liveRate}
                    onChange={(e) => setLiveRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Live Qty × Rate Calculation Preview Box */}
              <div className="bg-slate-950/90 border border-brand-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  Formula: <span className="font-mono text-slate-200">{liveQty.toLocaleString()}</span> ×{" "}
                  <span className="font-mono text-slate-200">{formatCurrency(liveRate, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 mr-2">
                    Calculated Total Amount:
                  </span>
                  <span className="text-base font-bold font-mono text-brand-400">
                    {formatCurrency(liveQty * liveRate, currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  QS Valuation / Specification Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Optional reference to drawing number or interim valuation certificate..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 disabled:opacity-50"
                >
                  {isPending ? "Saving BOQ Item..." : "Save Priced BOQ Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QS Measurement / Valuation Update Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <span className="text-xs font-mono text-brand-400">
                  {editingItem.itemCode} • {editingItem.project.name}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  QS Site Measurement & Valuation Update
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateValuation} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                {editingItem.description}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bill Qty ({editingItem.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    Executed Qty ({editingItem.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="executedQuantity"
                    required
                    value={editExecQty}
                    onChange={(e) =>
                      setEditExecQty(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit Rate ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitRate"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Updated Bill Total (Qty × Rate):</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(editQty * editRate, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Certified Executed Value:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(editExecQty * editRate, currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Measurement / Valuation Certificate Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingItem.notes || ""}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Save QS Measurement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
