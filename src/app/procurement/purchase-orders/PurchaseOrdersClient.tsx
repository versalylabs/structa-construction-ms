"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  Landmark,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  X,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import {
  createPurchaseOrderAction,
  recordGoodsReceivedNoteAction,
  updatePurchaseOrderPaymentAction,
} from "@/app/actions/procurement";
import {
  MATERIAL_CATEGORY_STYLES,
  PURCHASE_ORDER_STATUS_STYLES,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  quotationReference: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRatePct: number;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentTerms: string;
  expectedDeliveryDate: string;
  status: string;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  supplier: {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    paymentTerms: string;
  };
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
  };
  materialRequest: {
    id: string;
    requestNumber: string;
    title: string;
  } | null;
  createdBy: { id: string; name: string; role: string } | null;
  approvedBy: { id: string; name: string; role: string } | null;
  goodsReceivedNotes: {
    id: string;
    grnNumber: string;
    receivedQuantity: number;
    damagedQuantity: number;
    deliveryDate: string;
    inspectionStatus: string;
  }[];
}

interface PurchaseOrdersClientProps {
  purchaseOrders: PurchaseOrderItem[];
  projects: {
    id: string;
    code: string;
    name: string;
    sites: { id: string; code: string; name: string }[];
  }[];
  suppliers: {
    id: string;
    code: string;
    name: string;
    paymentTerms: string;
    outstandingBalance: number;
  }[];
  materials: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    standardUnitCost: number;
    preferredSupplierId: string | null;
  }[];
  approvedRequests: {
    id: string;
    requestNumber: string;
    title: string;
    projectId: string;
    siteId: string | null;
    materialId: string;
    approvedQuantity: number;
    estimatedUnitCost: number;
  }[];
  initialProjectId: string;
  initialSupplierId: string;
  initialSearch: string;
  currency: string;
  defaultVatRate: number;
  canProcure: boolean;
  canReceive: boolean;
  canPay: boolean;
}

export function PurchaseOrdersClient({
  purchaseOrders,
  projects,
  suppliers,
  materials,
  approvedRequests,
  initialProjectId,
  initialSupplierId,
  initialSearch,
  currency,
  defaultVatRate,
  canProcure,
  canReceive,
  canPay,
}: PurchaseOrdersClientProps) {
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId);
  const [selectedSupplierId, setSelectedSupplierId] =
    useState<string>(initialSupplierId);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [receivingPo, setReceivingPo] = useState<PurchaseOrderItem | null>(
    null
  );
  const [payingPo, setPayingPo] = useState<PurchaseOrderItem | null>(null);

  // Create PO form controlled fields
  const [formMrId, setFormMrId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [formMaterialId, setFormMaterialId] = useState<string>(
    materials[0]?.id || ""
  );
  const [formSupplierId, setFormSupplierId] = useState<string>(
    materials[0]?.preferredSupplierId || suppliers[0]?.id || ""
  );
  const [formQty, setFormQty] = useState<number>(100);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(
    materials[0]?.standardUnitCost || 0
  );
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formVatRate, setFormVatRate] = useState<number>(defaultVatRate);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPos = purchaseOrders.filter((po) => {
    if (selectedProjectId !== "ALL" && po.project.id !== selectedProjectId) {
      return false;
    }
    if (selectedSupplierId !== "ALL" && po.supplier.id !== selectedSupplierId) {
      return false;
    }
    if (selectedStatus !== "ALL" && po.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        po.supplier.name.toLowerCase().includes(q) ||
        po.material.name.toLowerCase().includes(q) ||
        po.project.name.toLowerCase().includes(q) ||
        (po.quotationReference || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPIs
  const totalLposCount = filteredPos.length;
  const totalLpoValue = filteredPos.reduce(
    (sum, po) => sum + po.totalAmount,
    0
  );
  const totalPaidValue = filteredPos.reduce(
    (sum, po) => sum + po.paidAmount,
    0
  );
  const totalOutstandingPayable = Math.max(0, totalLpoValue - totalPaidValue);
  const pendingDeliveryCount = filteredPos.filter((po) =>
    ["ISSUED", "APPROVED", "PARTIALLY_DELIVERED"].includes(po.status)
  ).length;

  const selectedFormProject = projects.find((p) => p.id === formProjectId);
  const selectedFormMaterial = materials.find((m) => m.id === formMaterialId);

  const subtotalPreview = Math.max(0, formQty * formUnitPrice - formDiscount);
  const taxPreview = Math.round(subtotalPreview * (formVatRate / 100));
  const totalPreview = subtotalPreview + taxPreview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Phase 6 • Official Local Purchase Orders (LPOs)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Purchase Orders & Supplier Commitments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage supplier LPOs with automatic 16% VAT & discount computation,
            project budget commitment updates, and gate delivery tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/materials/requests"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ClipboardCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Material Requests ({approvedRequests.length} Approved)</span>
          </Link>
          <Link
            href="/procurement/receiving"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Truck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Goods Receiving (GRN)</span>
          </Link>
          {canProcure && (
            <button
              type="button"
              onClick={() => setShowCreatePoModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Issue New LPO</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Active LPOs Issued
          </span>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {totalLposCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Committed supplier orders
          </p>
        </div>

        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-brand-300">
            Total LPO Value (Inc. VAT)
          </span>
          <p className="text-xl font-bold font-mono text-brand-300 mt-1">
            {formatCurrency(totalLpoValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Gross procurement commitment
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
            Settled / Paid on LPOs
          </span>
          <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {formatCurrency(totalPaidValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Paid via Bank RTGS / M-Pesa
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
            Outstanding LPO Balance
          </span>
          <p className="text-xl font-bold font-mono text-amber-300 mt-1">
            {formatCurrency(totalOutstandingPayable, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Payable under supplier credit terms
          </p>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300">
            Awaiting Site Delivery
          </span>
          <p className="text-2xl font-bold font-mono text-sky-300 mt-1">
            {pendingDeliveryCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Open for GRN receiving at gate
          </p>
        </div>
      </div>

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
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All LPO Statuses</option>
            <option value="APPROVED">Approved & Dispatched</option>
            <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
            <option value="DELIVERED">Delivered in Full</option>
            <option value="PAID">Settled & Paid</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search LPO number, supplier, material, or quotation..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">LPO Number & Linked MR</th>
                <th className="py-3.5 px-4">Supplier & Terms</th>
                <th className="py-3.5 px-4">Project & Site</th>
                <th className="py-3.5 px-4">Material & Delivery Progress</th>
                <th className="py-3.5 px-4 text-right">Subtotal & VAT</th>
                <th className="py-3.5 px-4 text-right">Total & Payment</th>
                <th className="py-3.5 px-4">Status & GRNs</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No Purchase Orders match the current filters.
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => {
                  const stStyle =
                    PURCHASE_ORDER_STATUS_STYLES[po.status] ||
                    PURCHASE_ORDER_STATUS_STYLES.APPROVED;
                  const catStyle =
                    MATERIAL_CATEGORY_STYLES[po.material.category] ||
                    MATERIAL_CATEGORY_STYLES.CEMENT_BINDERS;
                  const deliveryPct =
                    po.orderedQuantity > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (po.receivedQuantity / po.orderedQuantity) * 100
                          )
                        )
                      : 0;
                  const balanceDue = Math.max(0, po.totalAmount - po.paidAmount);

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-brand-400 text-sm">
                          {po.poNumber}
                        </div>
                        {po.quotationReference && (
                          <div className="text-[11px] font-mono text-slate-400">
                            Quote: {po.quotationReference}
                          </div>
                        )}
                        {po.materialRequest && (
                          <Link
                            href="/materials/requests"
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-brand-300"
                          >
                            From {po.materialRequest.requestNumber}
                          </Link>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          Due: {formatDate(po.expectedDeliveryDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href="/procurement/suppliers"
                          className="font-semibold text-white hover:text-brand-400"
                        >
                          {po.supplier.name}
                        </Link>
                        <div className="text-[11px] text-slate-400">
                          {po.supplier.contactPerson} • {po.supplier.phone}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                          Terms: {po.paymentTerms}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${po.project.id}`}
                          className="font-semibold text-slate-100 hover:text-brand-400"
                        >
                          {po.project.name}
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400">
                          {po.project.code}
                          {po.site ? ` • ${po.site.name}` : ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">
                            {po.material.code}
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
                        <div className="font-semibold text-white mt-0.5">
                          {po.material.name}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[11px] font-mono mb-1">
                            <span className="text-slate-300">
                              Rcvd: {po.receivedQuantity.toLocaleString()} /{" "}
                              {po.orderedQuantity.toLocaleString()}{" "}
                              {po.material.unit}
                            </span>
                            <span className="font-bold text-brand-400">
                              {deliveryPct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                deliveryPct >= 100
                                  ? "bg-emerald-500"
                                  : "bg-brand-500"
                              )}
                              style={{ width: `${deliveryPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-slate-200">
                          Sub: {formatCurrency(po.subtotalAmount, currency)}
                        </div>
                        {po.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            Disc: -{formatCurrency(po.discountAmount, currency)}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          VAT ({po.taxRatePct}%):{" "}
                          {formatCurrency(po.taxAmount, currency)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-white text-sm">
                          {formatCurrency(po.totalAmount, currency)}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          Paid: {formatCurrency(po.paidAmount, currency)}
                        </div>
                        {balanceDue > 0 && (
                          <div className="text-[11px] text-amber-300 font-semibold">
                            Bal: {formatCurrency(balanceDue, currency)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                            stStyle.badge
                          )}
                        >
                          {stStyle.label}
                        </span>
                        {po.goodsReceivedNotes.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {po.goodsReceivedNotes.map((g) => (
                              <div
                                key={g.id}
                                className="text-[10px] font-mono text-emerald-300 flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                <span>
                                  {g.grnNumber} ({g.receivedQuantity}{" "}
                                  {po.material.unit})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {canReceive &&
                            po.receivedQuantity < po.orderedQuantity && (
                              <button
                                type="button"
                                onClick={() => setReceivingPo(po)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                <span>Receive Goods (GRN)</span>
                              </button>
                            )}

                          {canPay && (
                            <button
                              type="button"
                              onClick={() => setPayingPo(po)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200"
                            >
                              <CreditCard className="h-3.5 w-3.5 text-brand-400" />
                              <span>Payment / Status</span>
                            </button>
                          )}
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

      {/* MODAL 1: Issue New Purchase Order (LPO) */}
      {showCreatePoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Issue Official Local Purchase Order (LPO)
                </h3>
                <p className="text-xs text-slate-400">
                  Automatically updates Project Committed Budget and Supplier
                  Payables Ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePoModal(false)}
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
                  const res = await createPurchaseOrderAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message:
                        "Issued Purchase Order and updated committed project budget & supplier balance.",
                    });
                    setShowCreatePoModal(false);
                  }
                });
              }}
              className="space-y-4"
            >
              {approvedRequests.length > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">
                    Optional: Pre-fill from an Approved Site Material Request
                  </label>
                  <select
                    name="materialRequestId"
                    value={formMrId}
                    onChange={(e) => {
                      const mrId = e.target.value;
                      setFormMrId(mrId);
                      const foundMr = approvedRequests.find(
                        (r) => r.id === mrId
                      );
                      if (foundMr) {
                        setFormProjectId(foundMr.projectId);
                        setFormMaterialId(foundMr.materialId);
                        setFormQty(foundMr.approvedQuantity);
                        setFormUnitPrice(foundMr.estimatedUnitCost);
                        const mat = materials.find(
                          (m) => m.id === foundMr.materialId
                        );
                        if (mat?.preferredSupplierId) {
                          setFormSupplierId(mat.preferredSupplierId);
                        }
                      }
                    }}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">
                      — Direct Purchase Order (Not linked to MR) —
                    </option>
                    {approvedRequests.map((mr) => (
                      <option key={mr.id} value={mr.id}>
                        {mr.requestNumber}: {mr.title} (Appr Qty:{" "}
                        {mr.approvedQuantity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    LPO Number *
                  </label>
                  <input
                    name="poNumber"
                    required
                    defaultValue={`SBC-LPO-2026-${String(purchaseOrders.length + 1).padStart(3, "0")}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Supplier Quotation Reference
                  </label>
                  <input
                    name="quotationReference"
                    placeholder="e.g. QTN-BAM-2026-510"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
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
                    Delivery Site
                  </label>
                  <select
                    name="siteId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {selectedFormProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Supplier *
                  </label>
                  <select
                    name="supplierId"
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Material *
                </label>
                <select
                  name="materialId"
                  value={formMaterialId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setFormMaterialId(mId);
                    const found = materials.find((m) => m.id === mId);
                    if (found) {
                      setFormUnitPrice(found.standardUnitCost);
                      if (found.preferredSupplierId) {
                        setFormSupplierId(found.preferredSupplierId);
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Order Qty ({selectedFormMaterial?.unit || "Units"}) *
                  </label>
                  <input
                    name="orderedQuantity"
                    type="number"
                    step="0.01"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Unit Price ({currency}) *
                  </label>
                  <input
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    required
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Discount ({currency})
                  </label>
                  <input
                    name="discountAmount"
                    type="number"
                    step="0.01"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    VAT Rate (%)
                  </label>
                  <input
                    name="taxRatePct"
                    type="number"
                    step="0.1"
                    value={formVatRate}
                    onChange={(e) => setFormVatRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Net Subtotal (Committed to Project Budget):</span>
                  <span>{formatCurrency(subtotalPreview, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>VAT ({formVatRate}%):</span>
                  <span>{formatCurrency(taxPreview, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-brand-300 border-t border-slate-800 pt-1">
                  <span>Total LPO Amount (Inc. VAT):</span>
                  <span>{formatCurrency(totalPreview, currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <input
                    name="paymentTerms"
                    defaultValue="Net 30 Days"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Expected Delivery Date *
                  </label>
                  <input
                    name="expectedDeliveryDate"
                    type="date"
                    required
                    defaultValue="2026-03-27"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Delivery & Quality Assurance Instructions
                </label>
                <input
                  name="notes"
                  defaultValue="All deliveries must be accompanied by a valid Delivery Note and KEBS certificate."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Issuing LPO..." : "Issue Official LPO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Receive Goods (GRN) from LPO */}
      {receivingPo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Site Gate Delivery Inspection (GRN)
                </span>
                <h3 className="text-base font-bold text-white">
                  Receive Delivery for {receivingPo.poNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {receivingPo.material.name} • {receivingPo.supplier.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceivingPo(null)}
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
                      message: `Logged Goods Received Note for ${receivingPo.poNumber} and automatically updated Site Store Inventory.`,
                    });
                    setReceivingPo(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="purchaseOrderId"
                value={receivingPo.id}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    GRN Number *
                  </label>
                  <input
                    name="grnNumber"
                    required
                    defaultValue={`SBC-GRN-2026-00${purchaseOrders.length + 2}`}
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
                    placeholder="e.g. DN-88420"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-emerald-300 mb-1">
                    Good Received ({receivingPo.material.unit}) *
                  </label>
                  <input
                    name="receivedQuantity"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={Math.max(
                      0,
                      receivingPo.orderedQuantity - receivingPo.receivedQuantity
                    )}
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
                    defaultValue={0}
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
                    defaultValue={0}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Delivery Truck Registration
                  </label>
                  <input
                    name="vehicleRegNumber"
                    placeholder="e.g. KDK 442P (Trailer)"
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
                  Gate Inspection & Storekeeper Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue="Inspected at site gate and offloaded into project store."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingPo(null)}
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
                    ? "Recording GRN..."
                    : "Confirm GRN & Update Site Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Supplier Payment / Update LPO Status */}
      {payingPo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Update Payment & Status: {payingPo.poNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {payingPo.supplier.name} • Total:{" "}
                  {formatCurrency(payingPo.totalAmount, currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingPo(null)}
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
                  const res = await updatePurchaseOrderPaymentAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: `Updated payment and supplier balance for ${payingPo.poNumber}.`,
                    });
                    setPayingPo(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="purchaseOrderId"
                value={payingPo.id}
              />

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total LPO Amount:</span>
                  <span className="text-white font-bold">
                    {formatCurrency(payingPo.totalAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Already Paid:</span>
                  <span className="text-emerald-400">
                    {formatCurrency(payingPo.paidAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-300">Balance Due:</span>
                  <span className="text-amber-300 font-bold">
                    {formatCurrency(
                      Math.max(0, payingPo.totalAmount - payingPo.paidAmount),
                      currency
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Record Additional Payment ({currency})
                </label>
                <input
                  name="additionalPayment"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={Math.max(
                    0,
                    payingPo.totalAmount - payingPo.paidAmount
                  )}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  LPO Status
                </label>
                <select
                  name="status"
                  defaultValue={payingPo.status}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="ISSUED">Issued to Supplier</option>
                  <option value="APPROVED">Approved & Dispatched</option>
                  <option value="PARTIALLY_DELIVERED">
                    Partially Delivered
                  </option>
                  <option value="DELIVERED">Delivered in Full</option>
                  <option value="INVOICED">Supplier Invoiced</option>
                  <option value="PAID">Settled & Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Payment Reference / Notes
                </label>
                <input
                  name="notes"
                  defaultValue={payingPo.notes || ""}
                  placeholder="e.g. Settled via Stanbic RTGS Ref #992014"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingPo(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Saving..." : "Save Payment & Sync Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
