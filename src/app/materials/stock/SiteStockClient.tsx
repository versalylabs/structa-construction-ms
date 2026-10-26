"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Flame,
  Building2,
  History,
  X,
  Plus,
} from "lucide-react";
import { recordSiteMaterialMovementAction } from "@/app/actions/materials-suppliers";
import {
  MATERIAL_CATEGORY_STYLES,
  STOCK_STATUS_STYLES,
  cn,
  formatCurrency,
  formatDateTime,
} from "@/lib/utils";

interface SiteStockRecord {
  id: string;
  projectId: string;
  siteId: string | null;
  materialId: string;
  requiredQuantity: number;
  requestedQuantity: number;
  orderedQuantity: number;
  receivedQuantity: number;
  usedQuantity: number;
  wastageQuantity: number;
  remainingQuantity: number;
  reorderLevel: number;
  unitCost: number;
  totalCost: number;
  status: string;
  notes: string | null;
  updatedAt: string;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string; location: string } | null;
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    preferredSupplier: {
      id: string;
      code: string;
      name: string;
      phone: string;
    } | null;
  };
  lastUpdatedBy: { id: string; name: string; role: string } | null;
}

interface UsageLogRecord {
  id: string;
  transactionType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  workAreaOrPhase: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  material: { id: string; code: string; name: string; unit: string };
  recordedBy: { id: string; name: string; role: string } | null;
}

interface SiteStockClientProps {
  stocks: SiteStockRecord[];
  usageLogs: UsageLogRecord[];
  projects: { id: string; code: string; name: string }[];
  currency: string;
  canManageStock: boolean;
  initialProjectFilter: string;
  initialStatusFilter: string;
}

export function SiteStockClient({
  stocks,
  usageLogs,
  projects,
  currency,
  canManageStock,
  initialProjectFilter,
  initialStatusFilter,
}: SiteStockClientProps) {
  const [activeView, setActiveView] = useState<"stock" | "history">("stock");
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Movement Modal State
  const [activeStock, setActiveStock] = useState<SiteStockRecord | null>(null);
  const [movementType, setMovementType] = useState<
    "ISSUE_TO_WORKS" | "DELIVERY_RECEIVED" | "WASTAGE_LOGGED"
  >("ISSUE_TO_WORKS");
  const [movementQty, setMovementQty] = useState<number>(10);

  const filteredStocks = stocks.filter((st) => {
    const matchesProject =
      projectFilter === "ALL" || st.projectId === projectFilter;
    const matchesStatus =
      statusFilter === "ALL" || st.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      st.material.code.toLowerCase().includes(q) ||
      st.material.name.toLowerCase().includes(q) ||
      st.project.name.toLowerCase().includes(q) ||
      (st.site?.name.toLowerCase().includes(q) ?? false);
    return matchesProject && matchesStatus && matchesSearch;
  });

  const filteredLogs = usageLogs.filter((log) => {
    const matchesProject =
      projectFilter === "ALL" || log.project.id === projectFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.material.name.toLowerCase().includes(q) ||
      log.project.name.toLowerCase().includes(q) ||
      (log.referenceNumber?.toLowerCase().includes(q) ?? false) ||
      (log.workAreaOrPhase?.toLowerCase().includes(q) ?? false);
    return matchesProject && matchesSearch;
  });

  // Aggregate Site Store Metrics (Section 14)
  const totalReceivedValue = filteredStocks.reduce(
    (s, st) => s + st.receivedQuantity * st.unitCost,
    0
  );
  const totalUsedValue = filteredStocks.reduce(
    (s, st) => s + st.usedQuantity * st.unitCost,
    0
  );
  const totalWastageValue = filteredStocks.reduce(
    (s, st) => s + st.wastageQuantity * st.unitCost,
    0
  );
  const totalRemainingStoreValue = filteredStocks.reduce(
    (s, st) => s + st.remainingQuantity * st.unitCost,
    0
  );
  const overallWastagePct =
    totalReceivedValue > 0
      ? Math.round((totalWastageValue / totalReceivedValue) * 1000) / 10
      : 0;

  const alertStocks = filteredStocks.filter(
    (st) => st.status === "CRITICAL_SHORTAGE" || st.status === "LOW_STOCK"
  );

  function openMovementModal(
    stock: SiteStockRecord,
    txType: "ISSUE_TO_WORKS" | "DELIVERY_RECEIVED" | "WASTAGE_LOGGED"
  ) {
    setActiveStock(stock);
    setMovementType(txType);
    setMovementQty(
      txType === "DELIVERY_RECEIVED"
        ? Math.max(10, stock.reorderLevel)
        : Math.min(20, Math.max(1, stock.remainingQuantity))
    );
  }

  function handleRecordMovement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeStock) return;
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    fd.set("stockId", activeStock.id);
    fd.set("transactionType", movementType);

    startTransition(async () => {
      const res = await recordSiteMaterialMovementAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Recorded ${movementType.replace(/_/g, " ")} for ${activeStock.material.name} (${activeStock.project.name}).`,
        });
        setActiveStock(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Phase 5 • Site Stores, Consumption & Wastage Control</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Site Stock & Material Tracking Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time site store inventory tracking{" "}
            <span className="text-slate-200 font-medium">
              Required → Ordered → Received → Used → Wastage → Remaining Balance
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/materials"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Materials Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/procurement/suppliers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Suppliers Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
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

      {/* 4-Stage Material Cost & Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Delivered to Site Stores
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {formatCurrency(totalReceivedValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cumulative received value across {filteredStocks.length} site stock lines
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Issued & Used in Works
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-300 mt-2 font-mono">
            {formatCurrency(totalUsedValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Consumed directly into active construction phases
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Material Wastage & Loss
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 mt-2 font-mono">
            {formatCurrency(totalWastageValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {overallWastagePct}% wastage rate across received deliveries
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Current Stock on Hand
            </span>
            <Package className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-2 font-mono">
            {formatCurrency(totalRemainingStoreValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Verified physical balance in site store yards
          </p>
        </div>
      </div>

      {/* Reorder & Shortage Alert Banner */}
      {alertStocks.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Site Store Reorder & Critical Shortage Alerts ({alertStocks.length})
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alertStocks.map((st) => {
              const stBadge =
                STOCK_STATUS_STYLES[st.status] || STOCK_STATUS_STYLES.LOW_STOCK;
              return (
                <div
                  key={st.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-400">
                        {st.material.code}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border",
                          stBadge.badge
                        )}
                      >
                        {stBadge.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {st.project.name}
                      </span>
                    </div>
                    <p className="text-xs text-white font-semibold mt-1">
                      {st.material.name} —{" "}
                      <span className="font-mono text-amber-300">
                        {st.remainingQuantity} {st.material.unit} left
                      </span>{" "}
                      (Reorder @ {st.reorderLevel} {st.material.unit})
                    </p>
                    {st.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {st.notes}
                      </p>
                    )}
                  </div>
                  {canManageStock && (
                    <button
                      type="button"
                      onClick={() =>
                        openMovementModal(st, "DELIVERY_RECEIVED")
                      }
                      className="px-2.5 py-1.5 rounded text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shrink-0"
                    >
                      + Receive Delivery
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Switcher & Filters */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView("stock")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors",
              activeView === "stock"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Live Site Store Inventory ({filteredStocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("history")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors",
              activeView === "history"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Store Issue & Delivery Logs ({filteredLogs.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search material, site, delivery note (DN-...), or work area..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          {activeView === "stock" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option value="ALL">All Stock Statuses</option>
              {Object.entries(STOCK_STATUS_STYLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: LIVE SITE STORE INVENTORY TABLE */}
      {activeView === "stock" && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Material & Supplier</th>
                  <th className="py-3 px-4">Project & Site Store</th>
                  <th className="py-3 px-4 text-right">Required</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Used</th>
                  <th className="py-3 px-4 text-right">Wastage</th>
                  <th className="py-3 px-4 text-right">Remaining Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Site Store Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No site stock items match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((st) => {
                    const stBadge =
                      STOCK_STATUS_STYLES[st.status] ||
                      STOCK_STATUS_STYLES.ADEQUATE;
                    const catBadge =
                      MATERIAL_CATEGORY_STYLES[st.material.category] ||
                      MATERIAL_CATEGORY_STYLES.CEMENT_BINDERS;

                    return (
                      <tr
                        key={st.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-400">
                              {st.material.code}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                catBadge.badge
                              )}
                            >
                              {catBadge.label}
                            </span>
                          </div>
                          <p className="font-semibold text-white mt-1">
                            {st.material.name}
                          </p>
                          {st.material.preferredSupplier && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Supplier: {st.material.preferredSupplier.name}
                            </p>
                          )}
                          {st.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              • {st.notes}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <Link
                            href={`/projects/${st.project.id}`}
                            className="font-medium text-slate-200 hover:text-brand-400 flex items-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{st.project.name}</span>
                          </Link>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {st.site ? `${st.site.code} — ${st.site.name}` : st.project.code}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 align-top text-right font-mono text-slate-300">
                          {st.requiredQuantity.toLocaleString()} {st.material.unit}
                          <p className="text-[10px] text-slate-500">
                            Ord: {st.orderedQuantity.toLocaleString()}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 align-top text-right font-mono font-semibold text-emerald-300">
                          {st.receivedQuantity.toLocaleString()} {st.material.unit}
                          <p className="text-[10px] text-slate-400">
                            {formatCurrency(st.totalCost, currency)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 align-top text-right font-mono font-semibold text-amber-300">
                          {st.usedQuantity.toLocaleString()} {st.material.unit}
                        </td>

                        <td className="py-3.5 px-4 align-top text-right font-mono text-rose-400">
                          {st.wastageQuantity.toLocaleString()} {st.material.unit}
                        </td>

                        <td className="py-3.5 px-4 align-top text-right">
                          <span
                            className={cn(
                              "font-mono font-bold text-sm",
                              st.status === "CRITICAL_SHORTAGE"
                                ? "text-red-400"
                                : st.status === "LOW_STOCK"
                                ? "text-amber-300"
                                : "text-emerald-400"
                            )}
                          >
                            {st.remainingQuantity.toLocaleString()} {st.material.unit}
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Reorder @ {st.reorderLevel} {st.material.unit}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                              stBadge.badge
                            )}
                          >
                            {stBadge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 align-top text-right">
                          {canManageStock && (
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openMovementModal(st, "ISSUE_TO_WORKS")
                                }
                                className="px-2 py-1 rounded text-[11px] font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                                title="Issue material from site store to construction works"
                              >
                                Issue Use
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openMovementModal(st, "DELIVERY_RECEIVED")
                                }
                                className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                                title="Record supplier delivery received at site gate"
                              >
                                + Receive
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openMovementModal(st, "WASTAGE_LOGGED")
                                }
                                className="px-2 py-1 rounded text-[11px] font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                                title="Log damaged or wasted material"
                              >
                                Wastage
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: SITE STORE MOVEMENT & CONSUMPTION LOGS */}
      {activeView === "history" && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Date & Reference</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Project & Work Area</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Value ({currency})</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No site store transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-brand-400 block">
                          {log.referenceNumber || "STR-LOG"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-semibold border",
                            log.transactionType === "DELIVERY_RECEIVED"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : log.transactionType === "WASTAGE_LOGGED"
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          )}
                        >
                          {log.transactionType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {log.material.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {log.material.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">
                          {log.project.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {log.workAreaOrPhase || "Site Store"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {log.transactionType === "DELIVERY_RECEIVED" ? "+" : "-"}
                        {log.quantity.toLocaleString()} {log.material.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(log.totalCost, currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.recordedBy?.name || "Storekeeper"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Record Site Material Movement */}
      {activeStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <span className="text-xs font-mono text-brand-400">
                  {activeStock.material.code} • {activeStock.project.name}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {movementType === "ISSUE_TO_WORKS"
                    ? "Issue Site Stock to Construction Works"
                    : movementType === "DELIVERY_RECEIVED"
                    ? "Receive Supplier Delivery into Site Store"
                    : "Record Damaged / Wasted Material"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveStock(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="p-6 space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="font-semibold text-white">
                  {activeStock.material.name}
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Current Site Store Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {activeStock.remainingQuantity.toLocaleString()}{" "}
                    {activeStock.material.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "ISSUE_TO_WORKS", label: "Issue to Works" },
                    { id: "DELIVERY_RECEIVED", label: "Receive Delivery" },
                    { id: "WASTAGE_LOGGED", label: "Log Wastage" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMovementType(opt.id)}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-semibold border transition-colors",
                      movementType === opt.id
                        ? "bg-brand-500/20 border-brand-500 text-brand-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quantity ({activeStock.material.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    required
                    value={movementQty}
                    onChange={(e) =>
                      setMovementQty(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Voucher / Delivery Note #
                  </label>
                  <input
                    name="referenceNumber"
                    placeholder={
                      movementType === "DELIVERY_RECEIVED"
                        ? "e.g. DN-89420"
                        : "e.g. SIN-RIV-044"
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Area / Phase / Store Location *
                </label>
                <input
                  name="workAreaOrPhase"
                  required
                  defaultValue={
                    movementType === "DELIVERY_RECEIVED"
                      ? "Main Site Store Yard"
                      : "Block A — Superstructure Slab / Walling"
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Storekeeper / Foreman Remarks
                </label>
                <input
                  name="notes"
                  placeholder="Optional inspection or gang issue note..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStock(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950"
                >
                  {isPending ? "Recording..." : "Post Store Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
