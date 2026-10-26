"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  ShieldAlert,
  Wallet,
  X,
  ArrowUpRight,
  Landmark,
} from "lucide-react";
import {
  formatKES,
  formatCompactKES,
  formatDate,
  INVOICE_STATUS_STYLES,
  PAYMENT_METHOD_STYLES,
} from "@/lib/utils";
import {
  createClientInvoiceAction,
  recordFinancialPaymentAction,
} from "@/app/actions/finance";

interface InvoicePaymentItem {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  referenceCode: string | null;
  paymentDate: string;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  valuationCertificateRef: string | null;
  title: string;
  description: string | null;
  invoiceDate: string;
  dueDate: string;
  subtotalAmount: number;
  vatRate: number;
  taxAmount: number;
  retentionDeducted: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  notes: string | null;
  project: {
    id: string;
    code: string;
    name: string;
    contractValue: number;
  };
  client: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  } | null;
  phase: { id: string; code: string; name: string } | null;
  createdBy: { id: string; fullName: string; role: string } | null;
  payments: InvoicePaymentItem[];
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  contractValue: number;
  client: { id: string; companyName: string } | null;
  phases: { id: string; code: string; name: string }[];
}

export function InvoicesClient({
  invoices,
  projects,
}: {
  invoices: InvoiceItem[];
  projects: ProjectOption[];
  userRole: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceItem | null>(
    null
  );

  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id || ""
  );
  const [subtotalInput, setSubtotalInput] = useState("");
  const [vatRateInput, setVatRateInput] = useState("16");
  const [retentionPctInput, setRetentionPctInput] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProjectObj = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (projectFilter !== "ALL" && inv.project.id !== projectFilter)
        return false;
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.valuationCertificateRef || "").toLowerCase().includes(q) ||
          inv.title.toLowerCase().includes(q) ||
          inv.project.name.toLowerCase().includes(q) ||
          (inv.client?.companyName || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [invoices, projectFilter, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalReceivable = invoices.reduce((s, i) => s + i.balanceAmount, 0);
    const totalRetentionHeld = invoices.reduce(
      (s, i) => s + i.retentionDeducted,
      0
    );
    const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");
    const overdueAmount = overdueInvoices.reduce(
      (s, i) => s + i.balanceAmount,
      0
    );
    const collectionRatePct =
      totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalCollected,
      totalReceivable,
      totalRetentionHeld,
      overdueCount: overdueInvoices.length,
      overdueAmount,
      collectionRatePct,
    };
  }, [invoices]);

  const previewCalc = useMemo(() => {
    const sub = Math.max(0, Number(subtotalInput || 0));
    const vat = Math.round((sub * Number(vatRateInput || 0)) / 100);
    const ret = Math.round((sub * Number(retentionPctInput || 0)) / 100);
    const netPayable = sub + vat - ret;
    return { sub, vat, ret, netPayable };
  }, [subtotalInput, vatRateInput, retentionPctInput]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Phase 9 • Interim Payment Certificates (IPCs) & Client Billing
            </span>
            <span className="text-xs text-slate-400">
              JBC Valuation Standard • 16% VAT & 10% Retention
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Client Invoicing & IPC Valuations
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Issue Interim Valuation Certificates linked to project phases,
            manage 10% retention deductions and 16% VAT, and track client
            settlement tranches and overdue receivables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            View Payment Receipts
          </Link>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue IPC Invoice
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {metrics.overdueCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-300">
                {metrics.overdueCount} Overdue Client Valuation Certificate(s) —{" "}
                {formatKES(metrics.overdueAmount)} Past Due Date
              </h3>
              <p className="text-xs text-red-200/80 mt-0.5">
                Follow up with client treasury or record incoming RTGS / EFT
                settlement tranche to clear aging receivables.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setStatusFilter(statusFilter === "OVERDUE" ? "ALL" : "OVERDUE")
            }
            className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-semibold shrink-0 cursor-pointer"
          >
            {statusFilter === "OVERDUE"
              ? "Show All Invoices"
              : "Filter Overdue IPCs"}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Certified & Billed
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {formatCompactKES(metrics.totalBilled)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Net payable across {invoices.length} Interim Certificates
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Collected Client Receipts
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {formatCompactKES(metrics.totalCollected)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {metrics.collectionRatePct}% overall IPC collection realization
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Outstanding Receivables
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {formatCompactKES(metrics.totalReceivable)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Includes {formatCompactKES(metrics.overdueAmount)} overdue balance
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Retention Money Held (10%)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-300">
            {formatCompactKES(metrics.totalRetentionHeld)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Releasable at Practical Completion & DLP
          </div>
        </div>
      </div>

      {/* Filter & Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: `All IPCs (${invoices.length})` },
            { id: "PAID", label: "Paid in Full" },
            { id: "PARTIALLY_PAID", label: "Partially Paid" },
            { id: "SENT", label: "Awaiting Payment" },
            { id: "OVERDUE", label: "Overdue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-brand-500 text-slate-950 border-brand-500 font-semibold"
                  : "bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IPC #, client, project..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No client valuation certificates match your selected filters.
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const st = INVOICE_STATUS_STYLES[inv.status] || {
              label: inv.status,
              badge: "bg-slate-800 text-slate-300 border-slate-700",
            };
            const paidPct =
              inv.totalAmount > 0
                ? Math.min(
                    100,
                    Math.round((inv.paidAmount / inv.totalAmount) * 100)
                  )
                : 0;

            return (
              <div
                key={inv.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-brand-400">
                        {inv.invoiceNumber}
                      </span>
                      {inv.valuationCertificateRef && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          {inv.valuationCertificateRef}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.badge}`}
                      >
                        {st.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Issued: {formatDate(inv.invoiceDate)} • Due:{" "}
                        <strong className="text-slate-200">
                          {formatDate(inv.dueDate)}
                        </strong>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {inv.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <Link
                        href={`/projects/${inv.project.id}`}
                        className="inline-flex items-center gap-1.5 text-brand-400 hover:underline font-medium"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {inv.project.code} — {inv.project.name}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      {inv.client && (
                        <span>
                          Client:{" "}
                          <strong className="text-white">
                            {inv.client.companyName}
                          </strong>{" "}
                          ({inv.client.contactPerson})
                        </span>
                      )}
                      {inv.phase && (
                        <span className="text-slate-400">
                          Phase: {inv.phase.name}
                        </span>
                      )}
                    </div>

                    {inv.description && (
                      <p className="text-xs text-slate-400 max-w-3xl">
                        {inv.description}
                      </p>
                    )}
                  </div>

                  {/* Financial Breakdown Box */}
                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 min-w-[290px] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Gross Certified Work:</span>
                      <span className="text-slate-200 font-medium">
                        {formatKES(inv.subtotalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>+ {inv.vatRate}% VAT:</span>
                      <span className="text-slate-300">
                        {formatKES(inv.taxAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-purple-300">
                      <span>Less Retention Held:</span>
                      <span>-{formatKES(inv.retentionDeducted)}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-sm font-bold text-white">
                      <span>Net IPC Payable:</span>
                      <span>{formatKES(inv.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium">
                        Paid: {formatKES(inv.paidAmount)} ({paidPct}%)
                      </span>
                      <span
                        className={
                          inv.balanceAmount > 0
                            ? "text-amber-400 font-semibold"
                            : "text-slate-500"
                        }
                      >
                        Bal: {formatKES(inv.balanceAmount)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>

                    {inv.balanceAmount > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setReceiptInvoice(inv)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Landmark className="w-3.5 h-3.5" />
                          Record Client Receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Payment Receipts Footer */}
                {inv.payments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                      Settlement Tranches:
                    </span>
                    {inv.payments.map((p) => {
                      const pm = PAYMENT_METHOD_STYLES[p.paymentMethod] || {
                        label: p.paymentMethod,
                        badge: "bg-slate-800 text-slate-300 border-slate-700",
                      };
                      return (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <strong className="text-white">
                            {formatKES(p.amount)}
                          </strong>
                          <span className="text-slate-500">•</span>
                          <span>{pm.label}</span>
                          {p.referenceCode && (
                            <span className="font-mono text-[11px] text-brand-300">
                              ({p.referenceCode})
                            </span>
                          )}
                          <span className="text-slate-500 text-[11px]">
                            {formatDate(p.paymentDate)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create New IPC Invoice */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Issue Client IPC Valuation Invoice
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Computes 16% VAT and JBC Retention deduction automatically.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                setIsSubmitting(true);
                try {
                  await createClientInvoiceAction(formData);
                  setShowNewModal(false);
                  setSubtotalInput("");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4 mt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
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
                    Linked Project Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">Overall Project Valuation</option>
                    {selectedProjectObj?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        {ph.code} — {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Interim Certificate Ref *
                  </label>
                  <input
                    type="text"
                    name="valuationCertificateRef"
                    required
                    placeholder="e.g., IPC #05 — 9th Floor Frame & MEP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client Counterparty
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      selectedProjectObj?.client?.companyName ||
                      "Project Client"
                    }
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valuation Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Interim Valuation Certificate #05: Superstructure Floor 9 & Stone Masonry"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Gross Certified Value (KES) *
                    </label>
                    <input
                      type="number"
                      name="subtotalAmount"
                      required
                      min={1}
                      value={subtotalInput}
                      onChange={(e) => setSubtotalInput(e.target.value)}
                      placeholder="e.g., 42000000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      VAT Rate (%)
                    </label>
                    <input
                      type="number"
                      name="vatRate"
                      value={vatRateInput}
                      onChange={(e) => setVatRateInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Retention Deducted (%)
                    </label>
                    <input
                      type="number"
                      name="retentionPct"
                      value={retentionPctInput}
                      onChange={(e) => setRetentionPctInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">
                    +VAT:{" "}
                    <strong className="text-emerald-400">
                      {formatKES(previewCalc.vat)}
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    Less Retention:{" "}
                    <strong className="text-purple-300">
                      -{formatKES(previewCalc.ret)}
                    </strong>
                  </span>
                  <span className="text-sm font-bold text-white">
                    Net Payable IPC: {formatKES(previewCalc.netPayable)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valuation Issue Date *
                  </label>
                  <input
                    type="date"
                    name="invoiceDate"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Due Date (Default 30 Days)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0]
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  QS Measurement Scope & Notes
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Summary of measured BOQ elements certified by Lead Quantity Surveyor..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm shadow-lg shadow-brand-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Issuing IPC..." : "Issue IPC Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Client Payment Receipt against Specific Invoice */}
      {receiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Record Client IPC Receipt
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {receiptInvoice.invoiceNumber} • Balance:{" "}
                  <strong className="text-amber-400">
                    {formatKES(receiptInvoice.balanceAmount)}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setReceiptInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                setIsSubmitting(true);
                try {
                  await recordFinancialPaymentAction(formData);
                  setReceiptInvoice(null);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4 mt-4"
            >
              <input
                type="hidden"
                name="projectId"
                value={receiptInvoice.project.id}
              />
              <input type="hidden" name="direction" value="INBOUND_CLIENT" />
              <input
                type="hidden"
                name="invoiceId"
                value={receiptInvoice.id}
              />
              <input
                type="hidden"
                name="counterpartyName"
                value={
                  receiptInvoice.client?.companyName || "Project Client"
                }
              />

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Receipt Amount (KES) *
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min={1}
                  defaultValue={receiptInvoice.balanceAmount}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Settlement Channel *
                  </label>
                  <select
                    name="paymentMethod"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="BANK_RTGS">Bank RTGS Transfer</option>
                    <option value="BANK_EFT">Bank EFT / Pesalink</option>
                    <option value="MPESA_PAYBILL">M-Pesa Paybill</option>
                    <option value="CHEQUE">Bankers Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    RTGS / M-Pesa Reference *
                  </label>
                  <input
                    type="text"
                    name="referenceCode"
                    required
                    placeholder="e.g., RTGS-SBK-20260322-910"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Settlement Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g., Full settlement of IPC balance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceiptInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm cursor-pointer"
                >
                  {isSubmitting ? "Recording..." : "Confirm Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
