"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  Landmark,
  Building2,
  X,
  TrendingUp,
} from "lucide-react";
import {
  formatKES,
  formatCompactKES,
  formatDate,
  PAYMENT_METHOD_STYLES,
  PAYMENT_DIRECTION_STYLES,
} from "@/lib/utils";
import { recordFinancialPaymentAction } from "@/app/actions/finance";

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  direction: string;
  counterpartyName: string;
  amount: number;
  paymentMethod: string;
  referenceCode: string | null;
  mpesaPhoneOrPaybill: string | null;
  paymentDate: string;
  status: string;
  notes: string | null;
  project: { id: string; code: string; name: string };
  client: { id: string; companyName: string } | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    valuationCertificateRef: string | null;
  } | null;
  recordedBy: { id: string; fullName: string; role: string } | null;
}

export function PaymentsClient({
  payments,
  projects,
  openInvoices,
  suppliers,
  subcontractors,
  purchaseOrders,
}: {
  payments: PaymentRecord[];
  projects: { id: string; code: string; name: string }[];
  openInvoices: {
    id: string;
    projectId: string;
    invoiceNumber: string;
    title: string;
    balanceAmount: number;
    client: { companyName: string } | null;
  }[];
  suppliers: { id: string; code: string; name: string; category: string }[];
  subcontractors: {
    id: string;
    code: string;
    companyName: string;
    specialtyTrade: string;
    contractAmount: number;
    amountPaid: number;
  }[];
  purchaseOrders: {
    id: string;
    poNumber: string;
    projectId: string;
    supplierId: string;
    totalAmount: number;
  }[];
  userRole: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [showNewModal, setShowNewModal] = useState(false);

  const [modalDirection, setModalDirection] = useState("INBOUND_CLIENT");
  const [modalProjectId, setModalProjectId] = useState(projects[0]?.id || "");
  const [modalMethod, setModalMethod] = useState("BANK_RTGS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (directionFilter !== "ALL" && p.direction !== directionFilter)
        return false;
      if (methodFilter !== "ALL") {
        if (
          methodFilter === "MPESA_ALL" &&
          !p.paymentMethod.startsWith("MPESA")
        )
          return false;
        if (
          methodFilter === "BANK_ALL" &&
          !p.paymentMethod.startsWith("BANK") &&
          p.paymentMethod !== "CHEQUE"
        )
          return false;
      }
      if (projectFilter !== "ALL" && p.project.id !== projectFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.paymentNumber.toLowerCase().includes(q) ||
          p.counterpartyName.toLowerCase().includes(q) ||
          (p.referenceCode || "").toLowerCase().includes(q) ||
          (p.mpesaPhoneOrPaybill || "").toLowerCase().includes(q) ||
          p.project.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [payments, directionFilter, methodFilter, projectFilter, searchQuery]);

  const metrics = useMemo(() => {
    const inbound = payments
      .filter((p) => p.direction === "INBOUND_CLIENT")
      .reduce((s, p) => s + p.amount, 0);
    const outbound = payments
      .filter((p) => p.direction !== "INBOUND_CLIENT")
      .reduce((s, p) => s + p.amount, 0);
    const mpesaTotal = payments
      .filter((p) => p.paymentMethod.startsWith("MPESA"))
      .reduce((s, p) => s + p.amount, 0);
    const bankTotal = payments
      .filter(
        (p) =>
          p.paymentMethod.startsWith("BANK") || p.paymentMethod === "CHEQUE"
      )
      .reduce((s, p) => s + p.amount, 0);

    return {
      inbound,
      outbound,
      netCashflow: inbound - outbound,
      mpesaTotal,
      bankTotal,
    };
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-3.5 h-3.5" />
              Phase 9 • Treasury, M-Pesa Paybill/B2C & Bank RTGS Cashflow
            </span>
            <span className="text-xs text-slate-400">
              Real-Time Reconciliation with IPCs, LPOs & Subcontracts
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            M-Pesa, Bank Payments & Cashflow Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Unified construction treasury ledger tracking inbound Client IPC
            receipts alongside outbound Supplier LPO settlements, Subcontractor
            valuations, and M-Pesa Paybill/Till/B2C site disbursements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record M-Pesa / Bank Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Inbound Client Receipts
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {formatCompactKES(metrics.inbound)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {formatKES(metrics.inbound)} collected from IPCs
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Outbound Disbursements
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {formatCompactKES(metrics.outbound)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Suppliers, Subcontractors & Site Expenses
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Project Cashflow
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-bold ${
              metrics.netCashflow >= 0 ? "text-sky-400" : "text-red-400"
            }`}
          >
            {metrics.netCashflow >= 0 ? "+" : ""}
            {formatCompactKES(metrics.netCashflow)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Positive working capital across active sites
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              M-Pesa vs Bank Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-white">
            M-Pesa: {formatCompactKES(metrics.mpesaTotal)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            RTGS / EFT: {formatCompactKES(metrics.bankTotal)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: `All Transactions (${payments.length})` },
            { id: "INBOUND_CLIENT", label: "Inbound Client Receipts" },
            { id: "OUTBOUND_SUPPLIER", label: "Supplier LPO Payouts" },
            { id: "OUTBOUND_CONTRACTOR", label: "Subcontractor IPC Payouts" },
            { id: "OUTBOUND_EXPENSE", label: "Direct Site Expenses" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDirectionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                directionFilter === tab.id
                  ? "bg-brand-500 text-slate-950 border-brand-500 font-semibold"
                  : "bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ref code, M-Pesa, counterparty..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">All Channels (M-Pesa & Bank)</option>
            <option value="MPESA_ALL">M-Pesa (Paybill / Till / B2C)</option>
            <option value="BANK_ALL">Bank (RTGS / EFT / Cheque)</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
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

      {/* Payments Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Voucher & Date</th>
                <th className="py-3.5 px-4">Direction & Stream</th>
                <th className="py-3.5 px-4">Counterparty & Project</th>
                <th className="py-3.5 px-4">M-Pesa / Bank Channel</th>
                <th className="py-3.5 px-4 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    No payment transactions match your selected filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => {
                  const dirStyle = PAYMENT_DIRECTION_STYLES[pay.direction] || {
                    label: pay.direction,
                    badge: "bg-slate-800 text-slate-300 border-slate-700",
                  };
                  const methodStyle = PAYMENT_METHOD_STYLES[
                    pay.paymentMethod
                  ] || {
                    label: pay.paymentMethod,
                    badge: "bg-slate-800 text-slate-300 border-slate-700",
                  };
                  const isInbound = pay.direction === "INBOUND_CLIENT";

                  return (
                    <tr
                      key={pay.id}
                      className="hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-brand-400">
                          {pay.paymentNumber}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatDate(pay.paymentDate)}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${dirStyle.badge}`}
                        >
                          {isInbound ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {dirStyle.label}
                        </span>
                        {pay.invoice && (
                          <div className="text-xs text-sky-400 mt-1.5 font-medium">
                            IPC: {pay.invoice.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">
                          {pay.counterpartyName}
                        </div>
                        <Link
                          href={`/projects/${pay.project.id}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-400 mt-0.5"
                        >
                          <Building2 className="w-3 h-3" />
                          {pay.project.code} — {pay.project.name}
                        </Link>
                        {pay.notes && (
                          <p className="text-xs text-slate-400 mt-1">
                            {pay.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${methodStyle.badge}`}
                        >
                          {pay.paymentMethod.startsWith("MPESA") ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Landmark className="w-3 h-3" />
                          )}
                          {methodStyle.label}
                        </span>
                        {pay.referenceCode && (
                          <div className="font-mono text-xs text-slate-200 mt-1">
                            Ref: {pay.referenceCode}
                          </div>
                        )}
                        {pay.mpesaPhoneOrPaybill && (
                          <div className="text-[11px] text-emerald-400 mt-0.5">
                            {pay.mpesaPhoneOrPaybill}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div
                          className={`text-sm font-bold ${
                            isInbound ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {isInbound ? "+" : "-"}
                          {formatKES(pay.amount)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pay.recordedBy
                            ? `By ${pay.recordedBy.fullName}`
                            : "Confirmed"}
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

      {/* Modal: Record M-Pesa / Bank Transaction */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Record M-Pesa or Bank Transaction
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically updates linked Client IPC balance or
                  Subcontractor Paid Ledger.
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
                  await recordFinancialPaymentAction(formData);
                  setShowNewModal(false);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4 mt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Transaction Stream *
                  </label>
                  <select
                    name="direction"
                    value={modalDirection}
                    onChange={(e) => setModalDirection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="INBOUND_CLIENT">
                      Inbound Client IPC Receipt
                    </option>
                    <option value="OUTBOUND_SUPPLIER">
                      Outbound Supplier LPO Settlement
                    </option>
                    <option value="OUTBOUND_CONTRACTOR">
                      Outbound Subcontractor IPC Payout
                    </option>
                    <option value="OUTBOUND_EXPENSE">
                      Direct Site Disbursement
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {modalDirection === "INBOUND_CLIENT" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Link to Open Client IPC Invoice (Auto-reduces balance)
                  </label>
                  <select
                    name="invoiceId"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">General Client Advance / Unlinked</option>
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.client?.companyName} (Bal:{" "}
                        {formatKES(inv.balanceAmount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalDirection === "OUTBOUND_SUPPLIER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Select Accredited Supplier
                    </label>
                    <select
                      name="supplierId"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Linked Purchase Order (LPO)
                    </label>
                    <select
                      name="purchaseOrderId"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="">General Account Settlement</option>
                      {purchaseOrders.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} ({formatKES(po.totalAmount)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {modalDirection === "OUTBOUND_CONTRACTOR" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Select Subcontractor (Auto-increments Paid Ledger)
                  </label>
                  <select
                    name="subcontractorId"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {subcontractors.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} — {sub.companyName} (Bal:{" "}
                        {formatKES(
                          Math.max(0, sub.contractAmount - sub.amountPaid)
                        )}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Counterparty Name
                  </label>
                  <input
                    type="text"
                    name="counterpartyName"
                    placeholder="Leave blank to auto-fill from selection"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount (KES) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min={1}
                    placeholder="e.g., 3500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Channel *
                  </label>
                  <select
                    name="paymentMethod"
                    value={modalMethod}
                    onChange={(e) => setModalMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {Object.entries(PAYMENT_METHOD_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    M-Pesa Receipt / Bank RTGS Ref *
                  </label>
                  <input
                    type="text"
                    name="referenceCode"
                    required
                    placeholder="e.g., SG94K2M18P or RTGS-EQB-904"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {modalMethod.startsWith("MPESA") && (
                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    M-Pesa Paybill / Till / Phone Details
                  </label>
                  <input
                    type="text"
                    name="mpesaPhoneOrPaybill"
                    placeholder="e.g., Paybill 522522 • Acc: 12849201 or +254 722 000 000"
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Narration / Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g., Settlement of 50% rebar deposit or IPC tranche"
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
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm cursor-pointer"
                >
                  {isSubmitting ? "Recording..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
