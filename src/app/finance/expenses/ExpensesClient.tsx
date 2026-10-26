"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  TrendingUp,
  ShieldCheck,
  Wallet,
  X,
  ArrowUpRight,
} from "lucide-react";
import {
  formatKES,
  formatCompactKES,
  formatDate,
  EXPENSE_CATEGORY_STYLES,
  EXPENSE_STATUS_STYLES,
  PAYMENT_METHOD_STYLES,
} from "@/lib/utils";
import {
  createProjectExpenseAction,
  updateExpenseStatusAction,
} from "@/app/actions/finance";

interface ExpenseItem {
  id: string;
  expenseNumber: string;
  category: string;
  title: string;
  description: string | null;
  vendorOrPayee: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  expenseDate: string;
  paymentMethod: string;
  paymentReference: string | null;
  receiptAttachmentLabel: string | null;
  status: string;
  project: {
    id: string;
    code: string;
    name: string;
    budget: number;
    spentAmount: number;
  };
  site: { id: string; code: string; name: string } | null;
  phase: { id: string; code: string; name: string } | null;
  recordedBy: { id: string; fullName: string; role: string } | null;
  approvedBy: { id: string; fullName: string; role: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  sites: { id: string; code: string; name: string }[];
  phases: { id: string; code: string; name: string }[];
}

export function ExpensesClient({
  expenses,
  projects,
}: {
  expenses: ExpenseItem[];
  projects: ProjectOption[];
  userRole: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id || ""
  );
  const [baseAmountInput, setBaseAmountInput] = useState("");
  const [includeVat, setIncludeVat] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProjectObj = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (projectFilter !== "ALL" && e.project.id !== projectFilter)
        return false;
      if (categoryFilter !== "ALL" && e.category !== categoryFilter)
        return false;
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          e.expenseNumber.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.vendorOrPayee.toLowerCase().includes(q) ||
          e.project.name.toLowerCase().includes(q) ||
          (e.paymentReference || "").toLowerCase().includes(q) ||
          (e.receiptAttachmentLabel || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [expenses, projectFilter, categoryFilter, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const approved = expenses.filter(
      (e) => e.status === "APPROVED_PAID" || e.status === "APPROVED_UNPAID"
    );
    const totalApprovedSpend = approved.reduce(
      (sum, e) => sum + e.totalAmount,
      0
    );
    const totalVatClaimable = approved.reduce((sum, e) => sum + e.taxAmount, 0);
    const pendingList = expenses.filter((e) => e.status === "PENDING_APPROVAL");
    const pendingAmount = pendingList.reduce(
      (sum, e) => sum + e.totalAmount,
      0
    );

    const byCategory: Record<string, number> = {};
    for (const e of approved) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.totalAmount;
    }

    return {
      totalApprovedSpend,
      totalVatClaimable,
      pendingCount: pendingList.length,
      pendingAmount,
      byCategory,
    };
  }, [expenses]);

  const computedVat = useMemo(() => {
    const num = Number(baseAmountInput || 0);
    if (!includeVat || num <= 0) return 0;
    return Math.round(num * 0.16);
  }, [baseAmountInput, includeVat]);

  const computedTotal = useMemo(() => {
    const num = Number(baseAmountInput || 0);
    return Math.max(0, num + computedVat);
  }, [baseAmountInput, computedVat]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30">
              <Receipt className="w-3.5 h-3.5" />
              Phase 9 • Site Expenditure & E-TIMS Cost Ledger
            </span>
            <span className="text-xs text-slate-400">
              Auto-Synced with Project Budget Lines & Cashflow
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Project Expenses & Cost Control
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Track direct site disbursements across all 9 construction cost
            heads—materials, muster-roll wages, plant fuel, subcontractor IPCs,
            haulage, and statutory NCA/NEMA permits with KRA E-TIMS VAT tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            M-Pesa & Bank Ledger
          </Link>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Site Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Approved Site Expenditure
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {formatCompactKES(metrics.totalApprovedSpend)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {formatKES(metrics.totalApprovedSpend)} across{" "}
            {expenses.filter((e) => e.status.startsWith("APPROVED")).length}{" "}
            vouchers
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              16% KRA E-TIMS Input VAT
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {formatCompactKES(metrics.totalVatClaimable)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Verified tax invoices eligible for VAT offset
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending QS / PM Approval
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {metrics.pendingCount} Vouchers
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Valued at {formatKES(metrics.pendingAmount)} awaiting sign-off
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Top Cost Category
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-white truncate">
            Subcontractors & Materials
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Synced live with{" "}
            <Link
              href="/projects/budget"
              className="text-brand-400 hover:underline"
            >
              Project Budget Control
            </Link>
          </div>
        </div>
      </div>

      {/* Category Distribution Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            Expenditure Distribution by Construction Cost Head
          </h2>
          <span className="text-xs text-slate-400">
            Click any category pill below to filter
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-brand-500 text-slate-950 border-brand-500 font-semibold"
                : "bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            All Categories ({expenses.length})
          </button>
          {Object.entries(EXPENSE_CATEGORY_STYLES).map(([catKey, style]) => {
            const catTotal = metrics.byCategory[catKey] || 0;
            const active = categoryFilter === catKey;
            return (
              <button
                key={catKey}
                onClick={() =>
                  setCategoryFilter(active ? "ALL" : catKey)
                }
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  active
                    ? "bg-brand-500/20 text-brand-300 border-brand-500/50 ring-1 ring-brand-500/30"
                    : "bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span>{style.label}</span>
                {catTotal > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    • {formatCompactKES(catTotal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher # (EXP-2026-001), vendor, E-TIMS invoice, M-Pesa/RTGS ref..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Project:</span>
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Approval Statuses</option>
            <option value="APPROVED_PAID">Approved & Settled</option>
            <option value="APPROVED_UNPAID">Approved (Payable)</option>
            <option value="PENDING_APPROVAL">Pending QS / PM Sign-Off</option>
            <option value="REJECTED">Disputed / Rejected</option>
          </select>
        </div>
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Voucher & Date</th>
                <th className="py-3.5 px-4">Project & Cost Head</th>
                <th className="py-3.5 px-4">Expense Particulars & Vendor</th>
                <th className="py-3.5 px-4">Payment Channel & Ref</th>
                <th className="py-3.5 px-4 text-right">Net + VAT (KES)</th>
                <th className="py-3.5 px-4">Status & Sign-Off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    No site expense vouchers match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catStyle = EXPENSE_CATEGORY_STYLES[exp.category] || {
                    label: exp.category,
                    badge: "bg-slate-800 text-slate-300 border-slate-700",
                  };
                  const statusStyle = EXPENSE_STATUS_STYLES[exp.status] || {
                    label: exp.status,
                    badge: "bg-slate-800 text-slate-300 border-slate-700",
                  };
                  const payMethodStyle = PAYMENT_METHOD_STYLES[
                    exp.paymentMethod
                  ] || {
                    label: exp.paymentMethod,
                    badge: "bg-slate-800 text-slate-300 border-slate-700",
                  };

                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-brand-400">
                          {exp.expenseNumber}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatDate(exp.expenseDate)}
                        </div>
                        {exp.receiptAttachmentLabel && (
                          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                            <FileText className="w-3 h-3 text-emerald-400" />
                            {exp.receiptAttachmentLabel}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/projects/${exp.project.id}`}
                          className="inline-flex items-center gap-1 font-medium text-white hover:text-brand-400 transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exp.project.name}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${catStyle.badge}`}
                          >
                            {catStyle.label}
                          </span>
                        </div>
                        {exp.phase && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            Phase: {exp.phase.name}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 max-w-md">
                        <div className="font-semibold text-slate-100">
                          {exp.title}
                        </div>
                        <div className="text-xs font-medium text-brand-300 mt-0.5">
                          Payee: {exp.vendorOrPayee}
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {exp.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${payMethodStyle.badge}`}
                        >
                          {payMethodStyle.label}
                        </span>
                        {exp.paymentReference && (
                          <div className="font-mono text-xs text-slate-300 mt-1.5">
                            Ref: {exp.paymentReference}
                          </div>
                        )}
                        {exp.recordedBy && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Logged by {exp.recordedBy.fullName}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-white">
                          {formatKES(exp.totalAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Net: {formatKES(exp.amount)}
                        </div>
                        {exp.taxAmount > 0 && (
                          <div className="text-[11px] text-emerald-400">
                            +16% VAT: {formatKES(exp.taxAmount)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.badge}`}
                        >
                          {statusStyle.label}
                        </span>
                        {exp.approvedBy && (
                          <div className="text-[11px] text-slate-400 mt-1.5">
                            Verified: {exp.approvedBy.fullName}
                          </div>
                        )}
                        {exp.status === "PENDING_APPROVAL" && (
                          <form
                            action={updateExpenseStatusAction}
                            className="mt-2 flex items-center gap-1.5"
                          >
                            <input
                              type="hidden"
                              name="expenseId"
                              value={exp.id}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="APPROVED_PAID"
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve & Pay
                            </button>
                          </form>
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

      {/* Modal: Record Site Expense */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Record Site Expense Voucher
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically updates Project Spend, Budget Category
                  Utilization, and Cashflow Ledger.
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
                  await createProjectExpenseAction(formData);
                  setShowNewModal(false);
                  setBaseAmountInput("");
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
                    Construction Cost Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {Object.entries(EXPENSE_CATEGORY_STYLES).map(
                      ([key, style]) => (
                        <option key={key} value={key}>
                          {style.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Phase (Optional)
                  </label>
                  <select
                    name="phaseId"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">General Project Overhead</option>
                    {selectedProjectObj?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        {ph.code} — {ph.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Site Location (Optional)
                  </label>
                  <select
                    name="siteId"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {selectedProjectObj?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expense Title / Description Header *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., 9th Floor Slab Ready-Mix C35 Concrete & Mobile Pump Hire"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vendor / Payee Name *
                  </label>
                  <input
                    type="text"
                    name="vendorOrPayee"
                    required
                    placeholder="e.g., Bamburi Special Products Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    name="expenseDate"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Net Amount Before Tax (KES) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      required
                      min={1}
                      value={baseAmountInput}
                      onChange={(e) => setBaseAmountInput(e.target.value)}
                      placeholder="e.g., 850000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-semibold"
                    />
                  </div>

                  <div className="flex flex-col justify-center pt-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVat}
                        onChange={(e) => setIncludeVat(e.target.checked)}
                        className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span>Add 16% KRA E-TIMS VAT</span>
                    </label>
                    <input
                      type="hidden"
                      name="includeVat"
                      value={includeVat ? "true" : "false"}
                    />
                    <div className="text-xs text-slate-400 mt-1.5">
                      VAT: <span className="text-emerald-400 font-medium">{formatKES(computedVat)}</span> • Total:{" "}
                      <span className="text-white font-bold">{formatKES(computedTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {Object.entries(PAYMENT_METHOD_STYLES).map(
                      ([key, style]) => (
                        <option key={key} value={key}>
                          {style.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    M-Pesa / RTGS Reference
                  </label>
                  <input
                    type="text"
                    name="paymentReference"
                    placeholder="e.g., SG82K1L99P or RTGS-902"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-TIMS / Receipt Ref
                  </label>
                  <input
                    type="text"
                    name="receiptAttachmentLabel"
                    placeholder="e.g., E-TIMS-INV-9021.pdf"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Approval & Settlement Status
                  </label>
                  <select
                    name="status"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="APPROVED_PAID">
                      Approved & Settled (Syncs Cashflow + Budget)
                    </option>
                    <option value="APPROVED_UNPAID">
                      Approved Payable (Syncs Budget Commitment)
                    </option>
                    <option value="PENDING_APPROVAL">
                      Pending QS / PM Sign-Off
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Additional Notes
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="Optional site measurement or delivery ticket notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
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
                  {isSubmitting ? "Recording..." : "Save Expense Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
