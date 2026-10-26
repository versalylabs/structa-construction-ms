"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Printer,
  Landmark,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Search,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FileSpreadsheet,
} from "lucide-react";
import {
  formatKES,
  formatCompactKES,
  PROJECT_STATUS_STYLES,
  BUDGET_CATEGORY_STYLES,
  STOCK_STATUS_STYLES as MATERIAL_STOCK_STATUS_STYLES,
} from "@/lib/utils";

type ReportTab =
  | "FINANCIAL_PL"
  | "SCHEDULE_PROGRESS"
  | "PROCUREMENT_SUPPLIERS"
  | "MATERIALS_WASTAGE"
  | "WORKFORCE_EQUIPMENT"
  | "SITE_QUALITY_SAFETY";

export function ReportsClient({
  organizationName,
  organizationCode,
  projects,
  budgetLines,
  expenses,
  invoices,
  payments,
  variations,
  suppliers,
  purchaseOrders,
  materialRequests,
  materialStocks,
  workers,
  subcontractors,
  equipmentAssets,
  siteReports,
  projectIssues,
  inspections,
}: {
  organizationName: string;
  organizationCode: string;
  projects: {
    id: string;
    code: string;
    name: string;
    projectType: string;
    location: string;
    status: string;
    plannedProgress: number;
    progress: number;
    contractValue: number;
    budget: number;
    committedCost: number;
    actualCost: number;
    invoicedAmount: number;
    paidAmount: number;
    clientName: string;
    pmName: string;
    phases: {
      id: string;
      sequenceOrder: number;
      name: string;
      budget: number;
      actualCost: number;
      plannedProgress: number;
      progress: number;
      status: string;
    }[];
    counts: {
      tasks: number;
      milestones: number;
      boqItems: number;
      siteReports: number;
      projectIssues: number;
      documents: number;
    };
  }[];
  budgetLines: {
    id: string;
    code: string;
    category: string;
    title: string;
    allocatedBudget: number;
    committedCost: number;
    actualCost: number;
    status: string;
    projectId: string;
    projectCode: string;
    projectName: string;
  }[];
  expenses: {
    id: string;
    expenseNumber: string;
    category: string;
    title: string;
    vendorOrPayee: string;
    totalAmount: number;
    status: string;
    expenseDate: string;
    projectId: string;
    projectCode: string;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    title: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    retentionDeducted: number;
    status: string;
    projectId: string;
    projectCode: string;
    clientName: string;
  }[];
  payments: {
    id: string;
    paymentNumber: string;
    direction: string;
    counterpartyName: string;
    amount: number;
    paymentMethod: string;
    projectId: string;
    projectCode: string;
  }[];
  variations: {
    id: string;
    variationNumber: string;
    title: string;
    variationAmount: number;
    timeExtensionDays: number;
    status: string;
    projectId: string;
    projectCode: string;
  }[];
  suppliers: {
    id: string;
    code: string;
    name: string;
    category: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingBalance: number;
    rating: number;
    poCount: number;
    grnCount: number;
  }[];
  purchaseOrders: {
    id: string;
    poNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    projectId: string;
    projectCode: string;
    supplierName: string;
    materialName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unit: string;
  }[];
  materialRequests: {
    id: string;
    requestNumber: string;
    title: string;
    estimatedTotalCost: number;
    status: string;
    priority: string;
    projectId: string;
    projectCode: string;
  }[];
  materialStocks: {
    id: string;
    projectId: string;
    projectCode: string;
    siteName: string;
    materialCode: string;
    materialName: string;
    category: string;
    unit: string;
    requiredQuantity: number;
    receivedQuantity: number;
    usedQuantity: number;
    wastageQuantity: number;
    remainingQuantity: number;
    unitCost: number;
    totalCost: number;
    status: string;
  }[];
  workers: {
    id: string;
    workerCode: string;
    fullName: string;
    workerCategory: string;
    tradeRole: string;
    daysWorked: number;
    overtimeHours: number;
    totalEarned: number;
    totalPaid: number;
    unpaidBalance: number;
    projectId: string;
    projectCode: string;
  }[];
  subcontractors: {
    id: string;
    code: string;
    companyName: string;
    specialization: string;
    contractValue: number;
    certifiedAmount: number;
    paidAmount: number;
    outstandingBalance: number;
    progressPct: number;
    performanceRating: number;
    projectId: string;
    projectCode: string;
  }[];
  equipmentAssets: {
    id: string;
    assetCode: string;
    name: string;
    category: string;
    ownershipType: string;
    availabilityStatus: string;
    totalHoursLogged: number;
    fuelLitresLogged: number;
    totalOperatingCost: number;
    projectId: string | null;
    projectCode: string;
  }[];
  siteReports: {
    id: string;
    reportNumber: string;
    reportDate: string;
    workersPresentCount: number;
    subcontractorWorkersCount: number;
    safetyIncidentsCount: number;
    overallProgressDelta: number;
    projectId: string;
    projectCode: string;
  }[];
  projectIssues: {
    id: string;
    issueCode: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    projectId: string;
    projectCode: string;
  }[];
  inspections: {
    id: string;
    recordNumber: string;
    recordDomain: string;
    title: string;
    resultStatus: string;
    complianceScorePct: number;
    projectId: string;
    projectCode: string;
  }[];
}) {
  const [activeTab, setActiveTab] = useState<ReportTab>("FINANCIAL_PL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [exportBanner, setExportBanner] = useState<string | null>(null);

  const scopedProjects = projects.filter(
    (p) =>
      (projectFilter === "ALL" || p.id === projectFilter) &&
      (!search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const scopedBudgetLines = budgetLines.filter(
    (b) => projectFilter === "ALL" || b.projectId === projectFilter
  );
  const scopedInvoices = invoices.filter(
    (i) => projectFilter === "ALL" || i.projectId === projectFilter
  );
  const scopedVariations = variations.filter(
    (v) => projectFilter === "ALL" || v.projectId === projectFilter
  );
  const scopedPOs = purchaseOrders.filter(
    (po) => projectFilter === "ALL" || po.projectId === projectFilter
  );
  const scopedStocks = materialStocks.filter(
    (ms) => projectFilter === "ALL" || ms.projectId === projectFilter
  );
  const scopedWorkers = workers.filter(
    (w) => projectFilter === "ALL" || w.projectId === projectFilter
  );
  const scopedSubcontractors = subcontractors.filter(
    (sc) => projectFilter === "ALL" || sc.projectId === projectFilter
  );
  const scopedEquipment = equipmentAssets.filter(
    (eq) => projectFilter === "ALL" || eq.projectId === projectFilter
  );
  const scopedIssues = projectIssues.filter(
    (iss) => projectFilter === "ALL" || iss.projectId === projectFilter
  );
  const scopedInspections = inspections.filter(
    (ins) => projectFilter === "ALL" || ins.projectId === projectFilter
  );

  // Portfolio Financial Aggregations (Section 34)
  const totalContractValue = scopedProjects.reduce(
    (s, p) => s + p.contractValue,
    0
  );
  const approvedVariationsSum = scopedVariations
    .filter((v) => v.status === "APPROVED")
    .reduce((s, v) => s + v.variationAmount, 0);
  const revisedContractSum = totalContractValue + approvedVariationsSum;
  const totalBaselineBudget = scopedProjects.reduce((s, p) => s + p.budget, 0);
  const totalCommittedCost = scopedProjects.reduce(
    (s, p) => s + p.committedCost,
    0
  );
  const totalActualCost = scopedProjects.reduce((s, p) => s + p.actualCost, 0);
  const remainingBudget = totalBaselineBudget - totalActualCost;
  const grossProjectProfit = revisedContractSum - totalActualCost;
  const grossProfitMarginPct =
    revisedContractSum > 0
      ? ((grossProjectProfit / revisedContractSum) * 100).toFixed(1)
      : "0.0";

  const totalRevenueInvoiced = scopedProjects.reduce(
    (s, p) => s + p.invoicedAmount,
    0
  );
  const totalPaymentsReceived = scopedProjects.reduce(
    (s, p) => s + p.paidAmount,
    0
  );
  const totalClientReceivables = Math.max(
    0,
    totalRevenueInvoiced - totalPaymentsReceived
  );
  const totalSupplierPayables = suppliers.reduce(
    (s, sup) => s + sup.outstandingBalance,
    0
  );
  const totalSubcontractorPayables = scopedSubcontractors.reduce(
    (s, sc) => s + sc.outstandingBalance,
    0
  );

  // Materials & Wastage Aggregations
  const totalMaterialValue = scopedStocks.reduce((s, m) => s + m.totalCost, 0);
  const totalWastageCost = scopedStocks.reduce(
    (s, m) => s + m.wastageQuantity * m.unitCost,
    0
  );
  const lowStockCount = scopedStocks.filter(
    (m) => m.status === "LOW_STOCK" || m.status === "CRITICAL_SHORTAGE"
  ).length;

  // Workforce & Equipment Aggregations
  const totalLabourEarned = scopedWorkers.reduce(
    (s, w) => s + w.totalEarned,
    0
  );
  const totalLabourUnpaid = scopedWorkers.reduce(
    (s, w) => s + w.unpaidBalance,
    0
  );
  const totalEquipmentCost = scopedEquipment.reduce(
    (s, eq) => s + eq.totalOperatingCost,
    0
  );

  function handleExportCsv() {
    const headers = [
      "Project Code",
      "Project Name",
      "Client",
      "Status",
      "Progress %",
      "Contract Value (KSh)",
      "Baseline Budget (KSh)",
      "Committed Cost (KSh)",
      "Actual Cost (KSh)",
      "Remaining Budget (KSh)",
      "Invoiced Revenue (KSh)",
      "Paid by Client (KSh)",
      "Outstanding Receivables (KSh)",
      "Gross Profit (KSh)",
      "Profit Margin %",
    ];

    const rows = scopedProjects.map((p) => {
      const rem = p.budget - p.actualCost;
      const rec = Math.max(0, p.invoicedAmount - p.paidAmount);
      const prof = p.contractValue - p.actualCost;
      const margin =
        p.contractValue > 0 ? ((prof / p.contractValue) * 100).toFixed(1) : "0";
      return [
        p.code,
        `"${p.name}"`,
        `"${p.clientName}"`,
        p.status,
        p.progress,
        p.contractValue,
        p.budget,
        p.committedCost,
        p.actualCost,
        rem,
        p.invoicedAmount,
        p.paidAmount,
        rec,
        prof,
        margin,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${organizationCode}-Executive-Construction-Report-2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportBanner(
      `Exported ${scopedProjects.length} project financial & operational records to ${organizationCode}-Executive-Construction-Report-2026.csv`
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Executive Reports, Profitability & Operational Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time portfolio P&L, budget vs. actual variance, procurement & supplier exposure, material wastage audits, workforce cost, and site safety scorecards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-sky-400" />
            <span>Print Executive Brief</span>
          </button>
        </div>
      </div>

      {exportBanner && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {exportBanner}
          </span>
          <button
            type="button"
            onClick={() => setExportBanner(null)}
            className="text-emerald-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Executive Summary Equation Banner (Section 34) */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-brand-400 font-semibold">
            SECTION 34 • PORTFOLIO FINANCIAL EQUATION ({organizationName})
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Gross Portfolio Margin: {grossProfitMarginPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <span className="text-[11px] text-slate-400 block">
              Revised Contract Value
            </span>
            <div className="mt-1 text-lg font-bold font-mono text-white">
              {formatCompactKES(revisedContractSum)}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-slate-500">
              Orig: {formatCompactKES(totalContractValue)} (+VOs{" "}
              {formatCompactKES(approvedVariationsSum)})
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <span className="text-[11px] text-slate-400 block">
              Baseline & Committed Cost
            </span>
            <div className="mt-1 text-lg font-bold font-mono text-sky-400">
              {formatCompactKES(totalBaselineBudget)}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-slate-500">
              Committed PO/Sub: {formatCompactKES(totalCommittedCost)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <span className="text-[11px] text-slate-400 block">
              Actual Project Costs Spent
            </span>
            <div className="mt-1 text-lg font-bold font-mono text-amber-400">
              {formatCompactKES(totalActualCost)}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-slate-500">
              Remaining Budget: {formatCompactKES(remainingBudget)}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <span className="text-[11px] text-emerald-300 font-semibold block">
              Gross Project Profit
            </span>
            <div className="mt-1 text-lg font-bold font-mono text-emerald-400">
              {formatCompactKES(grossProjectProfit)}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-emerald-300/80">
              Contract Minus Actual Cost ({grossProfitMarginPct}%)
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <span className="text-[11px] text-slate-400 block">
              Receivables vs. Payables
            </span>
            <div className="mt-1 text-sm font-bold font-mono text-brand-300">
              AR Due: {formatCompactKES(totalClientReceivables)}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-rose-400">
              AP Owed:{" "}
              {formatCompactKES(
                totalSupplierPayables + totalSubcontractorPayables
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Domain Tab Selector Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: "FINANCIAL_PL" as ReportTab,
                label: "1. Financial P&L & Profitability",
                icon: Landmark,
              },
              {
                id: "SCHEDULE_PROGRESS" as ReportTab,
                label: "2. Schedule & Progress",
                icon: TrendingUp,
              },
              {
                id: "PROCUREMENT_SUPPLIERS" as ReportTab,
                label: "3. Procurement & Suppliers",
                icon: ShoppingCart,
              },
              {
                id: "MATERIALS_WASTAGE" as ReportTab,
                label: "4. Materials & Wastage",
                icon: Package,
              },
              {
                id: "WORKFORCE_EQUIPMENT" as ReportTab,
                label: "5. Workforce & Equipment",
                icon: Users,
              },
              {
                id: "SITE_QUALITY_SAFETY" as ReportTab,
                label: "6. Site & HSE Scorecard",
                icon: ShieldCheck,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-500 text-slate-950 font-bold shadow"
                      : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by project or client..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Portfolio Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: FINANCIAL P&L & PROJECT PROFITABILITY */}
      {activeTab === "FINANCIAL_PL" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Project Financial Overview & Gross Profit Matrix (Section 34)
                </h2>
                <p className="text-xs text-slate-400">
                  Contract Value vs. Baseline Budget vs. Committed Cost vs. Actual Cost vs. Certified Revenue & Gross Profit Margin
                </p>
              </div>
              <Link
                href="/finance/budgets"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                <span>Open Cost Control Desk</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3.5 px-4">Project & Client</th>
                    <th className="py-3.5 px-4">Contract Sum</th>
                    <th className="py-3.5 px-4">Baseline Budget</th>
                    <th className="py-3.5 px-4">Committed Cost</th>
                    <th className="py-3.5 px-4">Actual Cost</th>
                    <th className="py-3.5 px-4">Remaining Budget</th>
                    <th className="py-3.5 px-4">Revenue & AR Due</th>
                    <th className="py-3.5 px-4">Gross Profit & Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {scopedProjects.map((p) => {
                    const projVOs = scopedVariations
                      .filter(
                        (v) => v.projectId === p.id && v.status === "APPROVED"
                      )
                      .reduce((s, v) => s + v.variationAmount, 0);
                    const revContract = p.contractValue + projVOs;
                    const remBudget = p.budget - p.actualCost;
                    const grossProfit = revContract - p.actualCost;
                    const marginPct =
                      revContract > 0
                        ? ((grossProfit / revContract) * 100).toFixed(1)
                        : "0.0";
                    const receivable = Math.max(
                      0,
                      p.invoicedAmount - p.paidAmount
                    );

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-mono font-bold text-brand-400 hover:underline"
                          >
                            {p.code}
                          </Link>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.clientName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-white">
                            {formatKES(revContract)}
                          </div>
                          {projVOs !== 0 && (
                            <div className="text-[10px] text-brand-300">
                              Incl. VO: +{formatCompactKES(projVOs)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-200">
                          {formatKES(p.budget)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sky-300">
                          {formatKES(p.committedCost)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                          {formatKES(p.actualCost)}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={
                              remBudget < 0
                                ? "text-red-400 font-bold"
                                : "text-emerald-400"
                            }
                          >
                            {formatKES(remBudget)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-slate-200">
                            Cert: {formatCompactKES(p.invoicedAmount)}
                          </div>
                          <div className="text-[10px] text-emerald-400">
                            Paid: {formatCompactKES(p.paidAmount)}
                          </div>
                          {receivable > 0 && (
                            <div className="text-[10px] text-amber-400">
                              AR Due: {formatCompactKES(receivable)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-emerald-400">
                            {formatKES(grossProfit)}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px]">
                            {marginPct}% Margin
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Category Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Cost Control Breakdown by Budget Line Category
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Line Code</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Allocated Budget</th>
                    <th className="py-3 px-4">Committed Cost</th>
                    <th className="py-3 px-4">Actual Spent</th>
                    <th className="py-3 px-4">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {scopedBudgetLines.map((line) => {
                    const catStyle = BUDGET_CATEGORY_STYLES[line.category] || {
                      label: line.category,
                      badge: "bg-slate-800 text-slate-300 border-slate-700",
                    };
                    const utilPct =
                      line.allocatedBudget > 0
                        ? Math.round(
                            (line.actualCost / line.allocatedBudget) * 100
                          )
                        : 0;
                    return (
                      <tr key={line.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">
                          {line.code}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {line.projectCode}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catStyle.badge}`}
                          >
                            {catStyle.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {formatKES(line.allocatedBudget)}
                        </td>
                        <td className="py-3 px-4 font-mono text-sky-300">
                          {formatKES(line.committedCost)}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-300">
                          {formatKES(line.actualCost)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  utilPct >= 85
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, utilPct)}%` }}
                              />
                            </div>
                            <span className="text-slate-300">{utilPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE & PHYSICAL PROGRESS ANALYTICS */}
      {activeTab === "SCHEDULE_PROGRESS" && (
        <div className="space-y-6">
          {scopedProjects.map((p) => {
            const st =
              PROJECT_STATUS_STYLES[p.status] || PROJECT_STATUS_STYLES.PLANNING;
            const variance = p.progress - p.plannedProgress;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-400">
                        {p.code}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {p.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${st.badge}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Project Manager: {p.pmName} • {p.counts.tasks} Tasks •{" "}
                      {p.counts.milestones} Milestones • {p.counts.boqItems} BOQ
                      Items
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-white">
                      Actual: {p.progress}% vs. Planned: {p.plannedProgress}%
                    </div>
                    <div
                      className={`text-xs ${
                        variance < 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      Schedule Variance: {variance >= 0 ? `+${variance}` : variance}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {p.phases.map((ph) => (
                    <div
                      key={ph.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <span>PHASE {ph.sequenceOrder}</span>
                        <span>{ph.status}</span>
                      </div>
                      <div className="font-bold text-slate-200 mt-1 truncate">
                        {ph.name}
                      </div>
                      <div className="mt-2 flex justify-between font-mono text-[11px]">
                        <span className="text-brand-300">{ph.progress}%</span>
                        <span className="text-slate-500">
                          Plan {ph.plannedProgress}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${ph.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: PROCUREMENT & SUPPLIER SPEND */}
      {activeTab === "PROCUREMENT_SUPPLIERS" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Supplier Spend, Payments & Outstanding Payables Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Total LPO volume, settled payments, and supplier credit exposure across {suppliers.length} accredited vendors.
                </p>
              </div>
              <Link
                href="/procurement/suppliers"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                <span>Open Suppliers Directory</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">POs & GRNs</th>
                    <th className="py-3 px-4">Total Purchased</th>
                    <th className="py-3 px-4">Settled / Paid</th>
                    <th className="py-3 px-4">Outstanding Payable</th>
                    <th className="py-3 px-4">QA Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-brand-400">
                          {sup.code}
                        </div>
                        <div className="font-bold text-white">{sup.name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {sup.category}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {sup.poCount} LPOs • {sup.grnCount} GRNs
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {formatKES(sup.totalPurchased)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {formatKES(sup.totalPaid)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {formatKES(sup.outstandingBalance)}
                      </td>
                      <td className="py-3 px-4 font-mono text-brand-300">
                        ★ {sup.rating.toFixed(1)} / 5.0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MATERIAL CONSUMPTION & WASTAGE AUDIT */}
      {activeTab === "MATERIALS_WASTAGE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Total Site Material Value Received
              </span>
              <div className="mt-1 text-xl font-bold font-mono text-white">
                {formatKES(totalMaterialValue)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Cumulative Material Wastage Loss
              </span>
              <div className="mt-1 text-xl font-bold font-mono text-rose-400">
                {formatKES(totalWastageCost)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Low Stock / Reorder Alerts
              </span>
              <div className="mt-1 text-xl font-bold font-mono text-amber-400">
                {lowStockCount} Site Stock Lines
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Site Material Consumption, Remaining Stock & Wastage Audit
              </h3>
              <Link
                href="/materials/stock"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                <span>Open Site Stock Ledger</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Material & Site</th>
                    <th className="py-3 px-4">BOQ Required</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4">Issued to Works</th>
                    <th className="py-3 px-4">Wastage Qty & Cost</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {scopedStocks.map((ms) => {
                    const stStyle = MATERIAL_STOCK_STATUS_STYLES[ms.status] || {
                      label: ms.status,
                      badge: "bg-slate-800 text-slate-300 border-slate-700",
                    };
                    const wastagePct =
                      ms.receivedQuantity > 0
                        ? (
                            (ms.wastageQuantity / ms.receivedQuantity) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    return (
                      <tr key={ms.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-brand-400">
                            {ms.materialCode} • {ms.projectCode}
                          </div>
                          <div className="font-bold text-white">
                            {ms.materialName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {ms.siteName}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {ms.requiredQuantity.toLocaleString()} {ms.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-white">
                          {ms.receivedQuantity.toLocaleString()} {ms.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-sky-300">
                          {ms.usedQuantity.toLocaleString()} {ms.unit}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="text-rose-400 font-semibold">
                            {ms.wastageQuantity.toLocaleString()} {ms.unit} (
                            {wastagePct}%)
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatKES(ms.wastageQuantity * ms.unitCost)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {ms.remainingQuantity.toLocaleString()} {ms.unit}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stStyle.badge}`}
                          >
                            {stStyle.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WORKFORCE, SUBCONTRACTORS & EQUIPMENT */}
      {activeTab === "WORKFORCE_EQUIPMENT" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Cumulative Direct Labour Payroll
              </span>
              <div className="mt-1 text-xl font-bold font-mono text-white">
                {formatKES(totalLabourEarned)}
              </div>
              <div className="text-[11px] text-amber-400 mt-0.5">
                Unpaid Muster Roll: {formatKES(totalLabourUnpaid)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Subcontractor Outstanding Retentions/IPCs
              </span>
              <div className="mt-1 text-xl font-bold font-mono text-purple-400">
                {formatKES(totalSubcontractorPayables)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Heavy Plant & Equipment Operating Cost
              </span>
              <div className="mt-1 text-xl font-bold font-mono text-sky-400">
                {formatKES(totalEquipmentCost)}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Specialist Subcontractor Packages & Valuation Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Subcontractor</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Contract Value</th>
                    <th className="py-3 px-4">Certified to Date</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {scopedSubcontractors.map((sc) => (
                    <tr key={sc.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-brand-400">
                          {sc.code}
                        </div>
                        <div className="font-bold text-white">
                          {sc.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sc.specialization}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {sc.projectCode}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {formatKES(sc.contractValue)}
                      </td>
                      <td className="py-3 px-4 font-mono text-sky-300">
                        {formatKES(sc.certifiedAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {formatKES(sc.paidAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {formatKES(sc.outstandingBalance)}
                      </td>
                      <td className="py-3 px-4 font-mono text-brand-300">
                        {sc.progressPct}% (★ {sc.performanceRating})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SITE OPERATIONS, QUALITY & HSE SAFETY SCORECARD */}
      {activeTab === "SITE_QUALITY_SAFETY" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Daily Site Reports Logged
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-white">
                {siteReports.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Active Site Issues & Snags
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                {
                  scopedIssues.filter(
                    (i) => i.status !== "RESOLVED" && i.status !== "CLOSED"
                  ).length
                }{" "}
                Open / {scopedIssues.length} Total
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">
                Average QA/QC & HSE Compliance Score
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                {scopedInspections.length > 0
                  ? (
                      scopedInspections.reduce(
                        (s, i) => s + i.complianceScorePct,
                        0
                      ) / scopedInspections.length
                    ).toFixed(1)
                  : "100.0"}
                %
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Quality Hold-Points & OSHA Safety Inspection Register
              </h3>
              <Link
                href="/operations/inspections"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                <span>Open Quality & Safety Desk</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Record #</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Inspection / Audit Title</th>
                    <th className="py-3 px-4">Result Status</th>
                    <th className="py-3 px-4">Compliance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {scopedInspections.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-brand-400">
                        {ins.recordNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {ins.projectCode}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-sky-300">
                        {ins.recordDomain}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {ins.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {ins.resultStatus}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {ins.complianceScorePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
