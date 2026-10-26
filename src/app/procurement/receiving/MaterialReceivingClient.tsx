"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShoppingCart,
  X,
  PackageCheck,
} from "lucide-react";
import { recordGoodsReceivedNoteAction } from "@/app/actions/procurement";
import {
  GRN_INSPECTION_STATUS_STYLES,
  MATERIAL_CATEGORY_STYLES,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface GrnItem {
  id: string;
  grnNumber: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  unitCost: number;
  acceptedValue: number;
  deliveryNoteNumber: string;
  vehicleRegNumber: string | null;
  deliveryDate: string;
  inspectionStatus: string;
  notes: string | null;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    orderedQuantity: number;
    receivedQuantity: number;
    status: string;
  };
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  supplier: { id: string; code: string; name: string };
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
  };
  receivedBy: { id: string; name: string; role: string } | null;
}

interface OpenPoOption {
  id: string;
  poNumber: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  expectedDeliveryDate: string;
  status: string;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  supplier: { id: string; code: string; name: string };
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
  };
}

interface MaterialReceivingClientProps {
  grns: GrnItem[];
  openPurchaseOrders: OpenPoOption[];
  projects: { id: string; code: string; name: string }[];
  initialProjectId: string;
  currency: string;
  canReceive: boolean;
}

export function MaterialReceivingClient({
  grns,
  openPurchaseOrders,
  projects,
  initialProjectId,
  currency,
  canReceive,
}: MaterialReceivingClientProps) {
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showLogGrnModal, setShowLogGrnModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string>(
    openPurchaseOrders[0]?.id || ""
  );
  const [rcvdQty, setRcvdQty] = useState<number>(
    openPurchaseOrders[0]
      ? Math.max(
          0,
          openPurchaseOrders[0].orderedQuantity -
            openPurchaseOrders[0].receivedQuantity
        )
      : 0
  );
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [missingQty, setMissingQty] = useState<number>(0);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredGrns = grns.filter((g) => {
    if (selectedProjectId !== "ALL" && g.project.id !== selectedProjectId) {
      return false;
    }
    if (selectedStatus !== "ALL" && g.inspectionStatus !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.grnNumber.toLowerCase().includes(q) ||
        g.deliveryNoteNumber.toLowerCase().includes(q) ||
        g.purchaseOrder.poNumber.toLowerCase().includes(q) ||
        g.supplier.name.toLowerCase().includes(q) ||
        g.material.name.toLowerCase().includes(q) ||
        (g.vehicleRegNumber || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPIs
  const totalGrnsCount = filteredGrns.length;
  const totalAcceptedValue = filteredGrns.reduce(
    (sum, g) => sum + g.acceptedValue,
    0
  );
  const totalDamagedEvents = filteredGrns.filter(
    (g) => g.damagedQuantity > 0
  ).length;
  const pendingOpenPosCount = openPurchaseOrders.length;

  const activePo = openPurchaseOrders.find((p) => p.id === selectedPoId);

  const openReceiveModalForPo = (po: OpenPoOption) => {
    setSelectedPoId(po.id);
    setRcvdQty(Math.max(0, po.orderedQuantity - po.receivedQuantity));
    setDamagedQty(0);
    setMissingQty(0);
    setShowLogGrnModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400">
            <Truck className="h-3.5 w-3.5" />
            <span>Phase 6 • Site Gate Material Receiving & QA Inspection</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Material Receiving & Goods Received Notes (GRNs)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verify supplier deliveries against Purchase Orders, log damaged or
            missing quantities at the gate, and automatically credit Site Store
            Stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/procurement/purchase-orders"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-brand-400" />
            <span>Purchase Orders (LPOs)</span>
          </Link>
          <Link
            href="/materials/stock"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Package className="h-3.5 w-3.5 text-emerald-400" />
            <span>Site Store Stock Ledger</span>
          </Link>
          {canReceive && openPurchaseOrders.length > 0 && (
            <button
              type="button"
              onClick={() => openReceiveModalForPo(openPurchaseOrders[0])}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Log New Site Delivery (GRN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-xs flex items-center justify-between",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          )}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Verified GRNs Logged
          </span>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {totalGrnsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Permanent gate delivery records
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
            Accepted Inventory Value
          </span>
          <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {formatCurrency(totalAcceptedValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Credited to live site store stock
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
            Deliveries with Damaged / Rejected
          </span>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {totalDamagedEvents}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Flagged at gate QA inspection
          </p>
        </div>

        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-brand-300">
            Open LPOs Awaiting Delivery
          </span>
          <p className="text-2xl font-bold font-mono text-brand-300 mt-1">
            {pendingOpenPosCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Ready for site gate check-in
          </p>
        </div>
      </div>

      {/* Pending Site Deliveries Queue (Open LPOs) */}
      {openPurchaseOrders.length > 0 && (
        <div className="rounded-xl border border-brand-500/30 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-brand-400 font-bold">
                Incoming Site Deliveries Queue (Open Purchase Orders)
              </h2>
              <p className="text-xs text-slate-400">
                Click &ldquo;Inspect &amp; Receive at Gate&rdquo; when a supplier
                truck arrives on site.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {openPurchaseOrders.map((po) => {
              const remainingToDeliver = Math.max(
                0,
                po.orderedQuantity - po.receivedQuantity
              );
              return (
                <div
                  key={po.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-brand-400 text-xs">
                        {po.poNumber}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Due {formatDate(po.expectedDeliveryDate)}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-xs mt-1">
                      {po.material.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {po.supplier.name} → {po.project.name}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                    <div className="text-[11px] font-mono">
                      <span className="text-slate-400">Balance Due: </span>
                      <span className="font-bold text-emerald-400">
                        {remainingToDeliver.toLocaleString()} {po.material.unit}
                      </span>
                    </div>
                    {canReceive && (
                      <button
                        type="button"
                        onClick={() => openReceiveModalForPo(po)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 hover:bg-brand-400 px-2.5 py-1 text-[11px] font-bold text-slate-950"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span>Inspect & Receive</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All QA Inspection Statuses</option>
            <option value="ACCEPTED">Accepted (100% QA Pass)</option>
            <option value="PARTIAL_ACCEPTANCE">
              Partial / Shortfall Logged
            </option>
            <option value="REJECTED_DAMAGED">Rejected (Damaged Batch)</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GRN #, Delivery Note #, Truck Reg, Supplier..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* GRN Register Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">GRN # & Delivery Note</th>
                <th className="py-3.5 px-4">Linked LPO & Supplier</th>
                <th className="py-3.5 px-4">Project & Site Store</th>
                <th className="py-3.5 px-4">Material Delivered</th>
                <th className="py-3.5 px-4 text-right">Ordered</th>
                <th className="py-3.5 px-4 text-right">Accepted Into Stock</th>
                <th className="py-3.5 px-4 text-right">Damaged / Missing</th>
                <th className="py-3.5 px-4">Gate QA Status & Receiver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredGrns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No Goods Received Notes match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredGrns.map((g) => {
                  const inspStyle =
                    GRN_INSPECTION_STATUS_STYLES[g.inspectionStatus] ||
                    GRN_INSPECTION_STATUS_STYLES.ACCEPTED;
                  const catStyle =
                    MATERIAL_CATEGORY_STYLES[g.material.category] ||
                    MATERIAL_CATEGORY_STYLES.CEMENT_BINDERS;

                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-brand-400">
                          {g.grnNumber}
                        </div>
                        <div className="text-[11px] font-mono text-white mt-0.5">
                          DN: {g.deliveryNoteNumber}
                        </div>
                        {g.vehicleRegNumber && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Truck: {g.vehicleRegNumber}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {formatDate(g.deliveryDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/procurement/purchase-orders?po=${g.purchaseOrder.poNumber}`}
                          className="font-mono font-bold text-sky-400 hover:underline"
                        >
                          {g.purchaseOrder.poNumber}
                        </Link>
                        <div className="font-semibold text-white mt-0.5">
                          {g.supplier.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${g.project.id}`}
                          className="font-semibold text-slate-100 hover:text-brand-400"
                        >
                          {g.project.name}
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400">
                          {g.site ? g.site.name : g.project.code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">
                            {g.material.code}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] border",
                              catStyle.badge
                            )}
                          >
                            {catStyle.label}
                          </span>
                        </div>
                        <div className="font-semibold text-white mt-1">
                          {g.material.name}
                        </div>
                        {g.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                            {g.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {g.orderedQuantity.toLocaleString()} {g.material.unit}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-emerald-400 text-sm">
                          +{g.receivedQuantity.toLocaleString()}{" "}
                          {g.material.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Val: {formatCurrency(g.acceptedValue, currency)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        {g.damagedQuantity > 0 ? (
                          <div className="text-rose-400 font-semibold">
                            Damaged: {g.damagedQuantity.toLocaleString()}{" "}
                            {g.material.unit}
                          </div>
                        ) : (
                          <div className="text-slate-500">0 Damaged</div>
                        )}
                        {g.missingQuantity > 0 && (
                          <div className="text-amber-300 text-[11px] mt-0.5">
                            Shortfall: {g.missingQuantity.toLocaleString()}{" "}
                            {g.material.unit}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                            inspStyle.badge
                          )}
                        >
                          {inspStyle.label}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Verified by: {g.receivedBy?.name || "Site Storekeeper"}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Log Site Delivery (GRN) */}
      {showLogGrnModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Record Site Material Delivery (GRN)
                </h3>
                <p className="text-xs text-slate-400">
                  Updates Purchase Order delivery progress and credits Site Store
                  Inventory immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogGrnModal(false)}
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
                  const res = await recordGoodsReceivedNoteAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message:
                        "Recorded Goods Received Note and synchronized Site Store Stock.",
                    });
                    setShowLogGrnModal(false);
                  }
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Select Open Purchase Order (LPO) *
                </label>
                <select
                  name="purchaseOrderId"
                  value={selectedPoId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPoId(id);
                    const found = openPurchaseOrders.find((p) => p.id === id);
                    if (found) {
                      setRcvdQty(
                        Math.max(
                          0,
                          found.orderedQuantity - found.receivedQuantity
                        )
                      );
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {openPurchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.material.name} ({po.supplier.name})
                    </option>
                  ))}
                </select>
              </div>

              {activePo && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Project:</span>
                    <span className="text-white">{activePo.project.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ordered vs Received:</span>
                    <span className="text-brand-300">
                      {activePo.receivedQuantity} / {activePo.orderedQuantity}{" "}
                      {activePo.material.unit}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    GRN Number *
                  </label>
                  <input
                    name="grnNumber"
                    required
                    defaultValue={`SBC-GRN-2026-${String(grns.length + 1).padStart(3, "0")}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Supplier Delivery Note # *
                  </label>
                  <input
                    name="deliveryNoteNumber"
                    required
                    placeholder="e.g. DN-99210"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-emerald-300 mb-1">
                    Good Received ({activePo?.material.unit || "Units"}) *
                  </label>
                  <input
                    name="receivedQuantity"
                    type="number"
                    step="0.01"
                    required
                    value={rcvdQty}
                    onChange={(e) => setRcvdQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-rose-300 mb-1">
                    Damaged / Rejected
                  </label>
                  <input
                    name="damagedQuantity"
                    type="number"
                    step="0.01"
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300 mb-1">
                    Missing / Shortfall
                  </label>
                  <input
                    name="missingQuantity"
                    type="number"
                    step="0.01"
                    value={missingQty}
                    onChange={(e) => setMissingQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Truck Registration #
                  </label>
                  <input
                    name="vehicleRegNumber"
                    placeholder="e.g. KDK 442P"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    name="deliveryDate"
                    type="date"
                    required
                    defaultValue="2026-03-18"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Gate Inspection & Offloading Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue="Verified against delivery note and offloaded into site store."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogGrnModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending
                    ? "Logging GRN..."
                    : "Confirm Delivery & Credit Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
