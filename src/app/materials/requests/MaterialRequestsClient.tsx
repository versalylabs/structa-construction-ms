"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
  Building2,
  Package,
  FileText,
} from "lucide-react";
import {
  createMaterialRequestAction,
  createPurchaseOrderAction,
  reviewMaterialRequestAction,
} from "@/app/actions/procurement";
import {
  MATERIAL_CATEGORY_STYLES,
  MATERIAL_REQUEST_STATUS_STYLES,
  TASK_PRIORITY_STYLES,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface MaterialRequestItem {
  id: string;
  requestNumber: string;
  title: string;
  requestedQuantity: number;
  approvedQuantity: number;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  priority: string;
  requiredByDate: string;
  status: string;
  justification: string | null;
  approvalNotes: string | null;
  approvedAt: string | null;
  createdAt: string;
  project: { id: string; code: true | string; name: string };
  site: { id: string; code: string; name: string } | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    standardUnitCost: number;
    preferredSupplierId: string | null;
  };
  requestedBy: { id: string; name: string; role: string } | null;
  approvedBy: { id: string; name: string; role: string } | null;
  purchaseOrders: {
    id: string;
    poNumber: string;
    status: string;
    totalAmount: number;
  }[];
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  sites: { id: string; code: string; name: string }[];
  phases: { id: string; sequenceOrder: number; name: string }[];
}

interface MaterialOption {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  standardUnitCost: number;
  preferredSupplierId: string | null;
}

interface SupplierOption {
  id: string;
  code: string;
  name: string;
  paymentTerms: string;
}

interface MaterialRequestsClientProps {
  requests: MaterialRequestItem[];
  projects: ProjectOption[];
  materials: MaterialOption[];
  suppliers: SupplierOption[];
  initialProjectId: string;
  initialStatus: string;
  currency: string;
  defaultVatRate: number;
  canRequest: boolean;
  canApprove: boolean;
  canProcure: boolean;
}

export function MaterialRequestsClient({
  requests,
  projects,
  materials,
  suppliers,
  initialProjectId,
  initialStatus,
  currency,
  defaultVatRate,
  canRequest,
  canApprove,
  canProcure,
}: MaterialRequestsClientProps) {
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewingRequest, setReviewingRequest] =
    useState<MaterialRequestItem | null>(null);
  const [convertingToPoRequest, setConvertingToPoRequest] =
    useState<MaterialRequestItem | null>(null);

  // Create form controlled fields
  const [formProjectId, setFormProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [formMaterialId, setFormMaterialId] = useState<string>(
    materials[0]?.id || ""
  );
  const [formQty, setFormQty] = useState<number>(100);
  const [formUnitCost, setFormUnitCost] = useState<number>(
    materials[0]?.standardUnitCost || 0
  );

  // Convert-to-PO controlled fields
  const [poSupplierId, setPoSupplierId] = useState<string>("");
  const [poQty, setPoQty] = useState<number>(0);
  const [poUnitPrice, setPoUnitPrice] = useState<number>(0);
  const [poDiscount, setPoDiscount] = useState<number>(0);
  const [poVatRate, setPoVatRate] = useState<number>(defaultVatRate);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRequests = requests.filter((r) => {
    if (selectedProjectId !== "ALL" && r.project.id !== selectedProjectId) {
      return false;
    }
    if (selectedStatus !== "ALL" && r.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requestNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.material.name.toLowerCase().includes(q) ||
        r.material.code.toLowerCase().includes(q) ||
        r.project.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI metrics
  const totalRequests = filteredRequests.length;
  const pendingApprovalCount = filteredRequests.filter(
    (r) => r.status === "SUBMITTED"
  ).length;
  const approvedReadyForPoCount = filteredRequests.filter(
    (r) => r.status === "APPROVED"
  ).length;
  const orderedOrReceivedCount = filteredRequests.filter((r) =>
    ["ORDERED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(r.status)
  ).length;
  const totalEstimatedValue = filteredRequests.reduce(
    (sum, r) => sum + r.estimatedTotalCost,
    0
  );

  const selectedFormProject = projects.find((p) => p.id === formProjectId);
  const selectedFormMaterial = materials.find((m) => m.id === formMaterialId);

  const openConvertToPo = (req: MaterialRequestItem) => {
    setConvertingToPoRequest(req);
    const defaultSup =
      req.material.preferredSupplierId || suppliers[0]?.id || "";
    setPoSupplierId(defaultSup);
    setPoQty(req.approvedQuantity || req.requestedQuantity);
    setPoUnitPrice(req.estimatedUnitCost || req.material.standardUnitCost);
    setPoDiscount(0);
    setPoVatRate(defaultVatRate);
  };

  const poSubtotalPreview = Math.max(0, poQty * poUnitPrice - poDiscount);
  const poTaxPreview = Math.round(poSubtotalPreview * (poVatRate / 100));
  const poTotalPreview = poSubtotalPreview + poTaxPreview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Phase 6 • Site Material Requisitions & Approvals</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Material Requests & Requisition Workflow
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Structured site material requisitions with multi-role PM/QS approval
            and 1-click conversion into Supplier Purchase Orders (LPOs).
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
            href="/procurement/receiving"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Package className="h-3.5 w-3.5 text-emerald-400" />
            <span>Goods Receiving (GRN)</span>
          </Link>
          {canRequest && (
            <button
              type="button"
              onClick={() => {
                const nextNum = `SBC-MR-2026-${String(requests.length + 1).padStart(3, "0")}`;
                setShowCreateModal(true);
                void nextNum;
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Submit Material Request</span>
            </button>
          )}
        </div>
      </div>

      {/* End-to-End Procurement Pipeline Banner (Section 15 & 18) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Structa End-to-End Procurement Control Pipeline
          </span>
          <span className="text-[11px] font-mono text-brand-400">
            Strict Audit Trail & Budget Commitment Sync
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {[
            { step: "01", label: "Site Requisition", sub: "Foreman / Site Mgr", active: true },
            { step: "02", label: "PM / QS Approval", sub: "Quantity & Budget Check", active: true },
            { step: "03", label: "Supplier Selection", sub: "Approved Vendor List", active: false },
            { step: "04", label: "Purchase Order", sub: "Official LPO + VAT", active: false },
            { step: "05", label: "Site Delivery", sub: "Truck & Delivery Note", active: false },
            { step: "06", label: "Goods Receiving", sub: "GRN & Damage Check", active: false },
            { step: "07", label: "Site Store Stock", sub: "Auto-Updated Ledger", active: false },
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                "rounded-lg border p-2.5 flex flex-col justify-between",
                item.active
                  ? "border-brand-500/40 bg-brand-500/10"
                  : "border-slate-800 bg-slate-950/60"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-brand-400">
                  STEP {item.step}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-600" />
              </div>
              <div className="font-bold text-white mt-1">{item.label}</div>
              <div className="text-[10px] text-slate-400">{item.sub}</div>
            </div>
          ))}
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Total Requisitions
          </span>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {totalRequests}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across active construction sites
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
              Pending Approval
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {pendingApprovalCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting PM / Procurement sign-off
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
              Approved (Ready for PO)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {approvedReadyForPoCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Ready for 1-click LPO conversion
          </p>
        </div>

        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-300">
              Ordered / Delivered
            </span>
            <ShoppingCart className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-brand-300 mt-1">
            {orderedOrReceivedCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Linked to active Supplier LPOs
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Estimated Req. Value
          </span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(totalEstimatedValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Benchmark material valuation
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Projects ({projects.length})</option>
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
            <option value="ALL">All Requisition Statuses</option>
            <option value="SUBMITTED">Pending Approval</option>
            <option value="APPROVED">Approved (Ready for PO)</option>
            <option value="ORDERED">PO Issued</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Fully Received</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MR number, material, or project..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Material Requests Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">MR Number & Priority</th>
                <th className="py-3.5 px-4">Project, Site & Phase</th>
                <th className="py-3.5 px-4">Material Requested</th>
                <th className="py-3.5 px-4 text-right">Requested / Approved</th>
                <th className="py-3.5 px-4 text-right">Est. Value</th>
                <th className="py-3.5 px-4">Required By</th>
                <th className="py-3.5 px-4">Status & Linked PO</th>
                <th className="py-3.5 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No material requests match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const statusStyle =
                    MATERIAL_REQUEST_STATUS_STYLES[req.status] ||
                    MATERIAL_REQUEST_STATUS_STYLES.SUBMITTED;
                  const prioStyle =
                    TASK_PRIORITY_STYLES[req.priority] ||
                    TASK_PRIORITY_STYLES.MEDIUM;
                  const catStyle =
                    MATERIAL_CATEGORY_STYLES[req.material.category] ||
                    MATERIAL_CATEGORY_STYLES.CEMENT_BINDERS;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-400">
                            {req.requestNumber}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-semibold border",
                              prioStyle.badge
                            )}
                          >
                            {prioStyle.label}
                          </span>
                        </div>
                        <div className="font-semibold text-white mt-1">
                          {req.title}
                        </div>
                        {req.justification && (
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                            {req.justification}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          By: {req.requestedBy?.name || "Site Engineer"} •{" "}
                          {formatDate(req.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${req.project.id}`}
                          className="font-semibold text-white hover:text-brand-400 transition-colors"
                        >
                          {req.project.name}
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400">
                          {req.project.code}
                          {req.site ? ` • ${req.site.name}` : ""}
                        </div>
                        {req.phase && (
                          <div className="text-[11px] text-brand-300 mt-0.5">
                            Phase 0{req.phase.sequenceOrder}: {req.phase.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-slate-400">
                            {req.material.code}
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
                        <div className="font-semibold text-slate-100 mt-1">
                          {req.material.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-slate-200 font-bold">
                          Req: {req.requestedQuantity.toLocaleString()}{" "}
                          {req.material.unit}
                        </div>
                        {req.approvedQuantity > 0 && (
                          <div className="text-emerald-400 text-[11px] mt-0.5">
                            Appr: {req.approvedQuantity.toLocaleString()}{" "}
                            {req.material.unit}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-white">
                          {formatCurrency(req.estimatedTotalCost, currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @ {formatCurrency(req.estimatedUnitCost, currency)} /{" "}
                          {req.material.unit}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {formatDate(req.requiredByDate)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                            statusStyle.badge
                          )}
                        >
                          {statusStyle.label}
                        </span>
                        {req.approvedBy && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Reviewed by: {req.approvedBy.name}
                          </div>
                        )}
                        {req.approvalNotes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[220px]">
                            &ldquo;{req.approvalNotes}&rdquo;
                          </div>
                        )}
                        {req.purchaseOrders.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {req.purchaseOrders.map((po) => (
                              <Link
                                key={po.id}
                                href={`/procurement/purchase-orders?po=${po.poNumber}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-[10px] font-mono font-bold text-brand-300 hover:bg-brand-500/25"
                              >
                                <FileText className="h-3 w-3" />
                                {po.poNumber}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {req.status === "SUBMITTED" && canApprove && (
                            <button
                              type="button"
                              onClick={() => setReviewingRequest(req)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve / Review</span>
                            </button>
                          )}

                          {req.status === "APPROVED" && canProcure && (
                            <button
                              type="button"
                              onClick={() => openConvertToPo(req)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-2.5 py-1 text-[11px] font-bold text-slate-950 shadow-sm"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span>Issue LPO</span>
                            </button>
                          )}

                          {req.purchaseOrders.length > 0 && (
                            <Link
                              href="/procurement/receiving"
                              className="text-[11px] font-mono text-sky-400 hover:underline"
                            >
                              Log Site Delivery (GRN) →
                            </Link>
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

      {/* MODAL 1: Submit New Material Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Submit Site Material Requisition
                </h3>
                <p className="text-xs text-slate-400">
                  Requisitions update project material demand and route to PM /
                  Procurement for approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
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
                  const res = await createMaterialRequestAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message:
                        "Material Request submitted and routed for approval.",
                    });
                    setShowCreateModal(false);
                  }
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    MR Reference Number *
                  </label>
                  <input
                    name="requestNumber"
                    required
                    defaultValue={`SBC-MR-2026-${String(requests.length + 1).padStart(3, "0")}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Priority Level *
                  </label>
                  <select
                    name="priority"
                    defaultValue="HIGH"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Critical Path)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Requisition Title / Work Package *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Block A 9th Floor Slab Concrete & Rebar Call-Off"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
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
                    Construction Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">General Project Store</option>
                    {selectedFormProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase 0{ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Catalog Material *
                </label>
                <select
                  name="materialId"
                  value={formMaterialId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setFormMaterialId(mId);
                    const found = materials.find((m) => m.id === mId);
                    if (found) {
                      setFormUnitCost(found.standardUnitCost);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} ({m.unit} @{" "}
                      {formatCurrency(m.standardUnitCost, currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Requested Quantity ({selectedFormMaterial?.unit || "Units"}) *
                  </label>
                  <input
                    name="requestedQuantity"
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Est. Unit Rate ({currency})
                  </label>
                  <input
                    name="estimatedUnitCost"
                    type="number"
                    step="0.01"
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Required On-Site By *
                  </label>
                  <input
                    name="requiredByDate"
                    type="date"
                    required
                    defaultValue="2026-03-26"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Estimated Requisition Valuation:
                </span>
                <span className="font-mono font-bold text-brand-400 text-sm">
                  {formatCurrency(formQty * formUnitCost, currency)}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Site Justification / BOQ Reference Notes
                </label>
                <textarea
                  name="justification"
                  rows={2}
                  placeholder="Specify structural drawing / BOQ item or current site store buffer..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Submitting..." : "Submit Material Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Approve or Reject Material Request */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Review Requisition: {reviewingRequest.requestNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {reviewingRequest.material.name} •{" "}
                  {reviewingRequest.project.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
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
                  const res = await reviewMaterialRequestAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: `Updated approval decision for ${reviewingRequest.requestNumber}.`,
                    });
                    setReviewingRequest(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="requestId"
                value={reviewingRequest.id}
              />

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Approval Decision *
                </label>
                <select
                  name="decision"
                  defaultValue="APPROVED"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="APPROVED">
                    Approve Requisition (Authorize Procurement)
                  </option>
                  <option value="REJECTED">
                    Reject Requisition (Return to Site Team)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Approved Quantity ({reviewingRequest.material.unit}) *
                </label>
                <input
                  name="approvedQuantity"
                  type="number"
                  step="0.01"
                  defaultValue={reviewingRequest.requestedQuantity}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
                <span className="text-[10px] text-slate-500">
                  Requested by site:{" "}
                  {reviewingRequest.requestedQuantity.toLocaleString()}{" "}
                  {reviewingRequest.material.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  PM / QS Approval or Rejection Notes
                </label>
                <textarea
                  name="approvalNotes"
                  rows={2}
                  defaultValue="Verified against BOQ allowance and active phase schedule."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Saving..." : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 1-Click Convert Approved MR to Purchase Order (LPO) */}
      {convertingToPoRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400">
                  Convert Approved Requisition → Official LPO
                </span>
                <h3 className="text-base font-bold text-white">
                  Issue Purchase Order for {convertingToPoRequest.requestNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConvertingToPoRequest(null)}
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
                      message: `Issued official Purchase Order for ${convertingToPoRequest.requestNumber} and synced committed budget & supplier balance.`,
                    });
                    setConvertingToPoRequest(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="materialRequestId"
                value={convertingToPoRequest.id}
              />
              <input
                type="hidden"
                name="projectId"
                value={convertingToPoRequest.project.id}
              />
              <input
                type="hidden"
                name="siteId"
                value={convertingToPoRequest.site?.id || ""}
              />
              <input
                type="hidden"
                name="materialId"
                value={convertingToPoRequest.material.id}
              />

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Project & Site:</span>
                  <span className="font-semibold text-white">
                    {convertingToPoRequest.project.name}{" "}
                    {convertingToPoRequest.site
                      ? `(${convertingToPoRequest.site.name})`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span className="font-semibold text-brand-300">
                    {convertingToPoRequest.material.code} —{" "}
                    {convertingToPoRequest.material.name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Purchase Order (LPO) Number *
                  </label>
                  <input
                    name="poNumber"
                    required
                    defaultValue={`SBC-LPO-2026-00${requests.length}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Supplier Quotation Reference
                  </label>
                  <input
                    name="quotationReference"
                    placeholder="e.g. QTN-2026-441"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Select Approved Supplier *
                  </label>
                  <select
                    name="supplierId"
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Expected Delivery Date *
                  </label>
                  <input
                    name="expectedDeliveryDate"
                    type="date"
                    required
                    defaultValue={convertingToPoRequest.requiredByDate.slice(
                      0,
                      10
                    )}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Order Qty ({convertingToPoRequest.material.unit}) *
                  </label>
                  <input
                    name="orderedQuantity"
                    type="number"
                    step="0.01"
                    required
                    value={poQty}
                    onChange={(e) => setPoQty(Number(e.target.value))}
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
                    value={poUnitPrice}
                    onChange={(e) => setPoUnitPrice(Number(e.target.value))}
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
                    value={poDiscount}
                    onChange={(e) => setPoDiscount(Number(e.target.value))}
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
                    value={poVatRate}
                    onChange={(e) => setPoVatRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Net Subtotal (Committed to Project Budget):</span>
                  <span>{formatCurrency(poSubtotalPreview, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>VAT ({poVatRate}%):</span>
                  <span>{formatCurrency(poTaxPreview, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-brand-300 border-t border-slate-800 pt-1">
                  <span>Total LPO Value (Inc. VAT):</span>
                  <span>{formatCurrency(poTotalPreview, currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <input
                    name="paymentTerms"
                    defaultValue={
                      suppliers.find((s) => s.id === poSupplierId)
                        ?.paymentTerms || "Net 30 Days"
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Delivery & Gate Instructions
                  </label>
                  <input
                    name="notes"
                    defaultValue="Deliver with KEBS test certificate and weighbridge ticket."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertingToPoRequest(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Issuing LPO..." : "Issue Official Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
