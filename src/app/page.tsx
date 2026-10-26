import React from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Activity,
  ArrowUpRight,
  Lock,
  Landmark,
  HardHat,
  Bell,
  Clock,
  AlertTriangle,
  Plus,
  Layers,
  BarChart3,
  Wrench,
  ShoppingCart,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/rbac";
import {
  PROJECT_STATUS_STYLES,
  formatCurrency,
  formatCompactKES,
  formatDateTime,
  cn,
} from "@/lib/utils";

export default async function DashboardPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const orgId = ctx.organization.id;
  const currency = ctx.organization.currency;

  const [
    projects,
    clientsCount,
    usersCount,
    auditLogs,
    notifications,
    activeWorkersCount,
    deployedEquipmentCount,
    pendingPOsCount,
    openIssuesCount,
    pendingApprovalsCount,
    suppliersPayableAgg,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        client: { select: { name: true } },
        projectManager: { select: { name: true } },
        _count: { select: { phases: true, sites: true, tasks: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.count({ where: { organizationId: orgId } }),
    prisma.user.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notification.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.siteWorker.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    }),
    prisma.equipmentAsset.count({
      where: { organizationId: orgId, availabilityStatus: "DEPLOYED_ACTIVE" },
    }),
    prisma.purchaseOrder.count({
      where: {
        organizationId: orgId,
        status: { in: ["ISSUED", "APPROVED", "PARTIALLY_DELIVERED"] },
      },
    }),
    prisma.projectIssue.count({
      where: {
        organizationId: orgId,
        status: { in: ["OPEN", "IN_PROGRESS", "ESCALATED"] },
      },
    }),
    prisma.approvalWorkflowItem.count({
      where: { organizationId: orgId, status: "PENDING" },
    }),
    prisma.supplier.aggregate({
      where: { organizationId: orgId },
      _sum: { outstandingBalance: true },
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const delayedProjects = projects.filter((p) => p.status === "DELAYED").length;
  const completedProjects = projects.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  const totalContractValue = projects.reduce(
    (s, p) => s + p.contractValue,
    0
  );
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalActualCost = projects.reduce((s, p) => s + p.actualCost, 0);
  const grossPortfolioProfit = totalContractValue - totalActualCost;
  const grossMarginPct =
    totalContractValue > 0
      ? ((grossPortfolioProfit / totalContractValue) * 100).toFixed(1)
      : "0.0";
  const totalReceivables = projects.reduce(
    (s, p) => s + Math.max(0, p.invoicedAmount - p.paidAmount),
    0
  );
  const totalSupplierPayables =
    suppliersPayableAgg._sum.outstandingBalance || 0;
  const currentUserRoleMeta = ROLES[ctx.user.role] || ROLES.PROJECT_MANAGER;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Top Executive Banner */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/60 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-brand-400">
                <HardHat className="h-3.5 w-3.5" />
                {ctx.organization.code} • EXECUTIVE COMMAND CENTER
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
                <Lock className="h-3 w-3" />
                Tenant Isolated
              </span>
              <span
                className={cn(
                  "text-xs font-mono px-2.5 py-0.5 rounded border",
                  currentUserRoleMeta.badgeColor
                )}
              >
                Operator Role: {currentUserRoleMeta.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {ctx.organization.name}
            </h1>
            <p className="text-xs text-slate-400">
              {ctx.organization.ncaRegistration ||
                "Registered Construction Organization"}{" "}
              • {clientsCount} Active Clients • {usersCount} Construction
              Personnel • {activeWorkersCount} Site Artisans & Operatives
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-brand-500/20"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Executive Reports & P&L</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Plus className="h-4 w-4 text-brand-400" />
              <span>Projects ({projects.length})</span>
            </Link>
            {ctx.can("users:view") && (
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Users className="h-4 w-4 text-sky-400" />
                <span>Team ({usersCount})</span>
              </Link>
            )}
          </div>
        </div>

        {/* Company-Level Construction KPIs (Sections 7 & 34) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Project Portfolio Status
              </span>
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {projects.length}
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  {activeProjects} Active • {completedProjects} Completed
                </span>
              </div>
              {delayedProjects > 0 ? (
                <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  {delayedProjects} Delayed Project Requires Attention
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  All active schedules on track
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Contract Value & Gross Profit
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-white font-mono">
                {formatCurrency(totalContractValue, currency)}
              </div>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">
                Gross Profit: {formatCompactKES(grossPortfolioProfit)} (
                {grossMarginPct}% Margin)
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Actual Project Costs vs Budget
              </span>
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-brand-400 font-mono">
                {formatCurrency(totalActualCost, currency)}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Remaining Budget:{" "}
                {formatCompactKES(totalBudget - totalActualCost)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Client AR vs Supplier AP
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-amber-400 font-mono">
                {formatCurrency(totalReceivables, currency)}
              </div>
              <p className="text-[11px] text-rose-400 font-mono mt-1">
                Supplier Payables: {formatCompactKES(totalSupplierPayables)}
              </p>
            </div>
          </div>
        </div>

        {/* Live Field & Commercial Operations Pulse (All Phases 1-11 Connected) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/people/workforce"
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Site Workforce</span>
              <Users className="h-3.5 w-3.5 text-brand-400" />
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono text-white">
              {activeWorkersCount} Active
            </div>
            <div className="text-[10px] text-slate-500">
              Artisans & gang operatives
            </div>
          </Link>

          <Link
            href="/equipment"
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Heavy Plant Fleet</span>
              <Wrench className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono text-sky-400">
              {deployedEquipmentCount} Deployed
            </div>
            <div className="text-[10px] text-slate-500">
              Cranes, excavators & pumps
            </div>
          </Link>

          <Link
            href="/procurement/purchase-orders"
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active LPOs</span>
              <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono text-emerald-400">
              {pendingPOsCount} Open POs
            </div>
            <div className="text-[10px] text-slate-500">
              In-transit & partial delivery
            </div>
          </Link>

          <Link
            href="/operations/issues"
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Issues & Snags</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono text-amber-400">
              {openIssuesCount} Active
            </div>
            <div className="text-[10px] text-slate-500">
              Site snags & risk items
            </div>
          </Link>

          <Link
            href="/documents/approvals"
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sign-Off Gates</span>
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono text-purple-400">
              {pendingApprovalsCount} Pending
            </div>
            <div className="text-[10px] text-slate-500">
              Drawings, VOs & IPCs
            </div>
          </Link>

          <Link
            href="/documents/client-portal"
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Client Portal</span>
              <ClipboardCheck className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono text-teal-400">
              {clientsCount} Employers
            </div>
            <div className="text-[10px] text-slate-500">
              Executive valuation packs
            </div>
          </Link>
        </div>

        {/* Main Grid: Active Construction Projects Portfolio + Alerts/Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Active Construction Projects Table */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Construction Projects Command Portfolio
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any project to enter its dedicated Project Command Center
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Full P&L Matrix</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
                >
                  <span>All Projects</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Budget vs Actual</th>
                    <th className="py-3 px-4">Gross Profit</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {projects.map((p) => {
                    const st =
                      PROJECT_STATUS_STYLES[p.status] ||
                      PROJECT_STATUS_STYLES.PLANNING;
                    const projProfit = p.contractValue - p.actualCost;
                    const projMargin =
                      p.contractValue > 0
                        ? ((projProfit / p.contractValue) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] font-bold text-brand-400">
                            {p.code}
                          </div>
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-bold text-slate-100 hover:text-brand-300 block mt-0.5"
                          >
                            {p.name}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {p.client?.name} • {p._count.phases} Phases
                          </div>
                        </td>
                        <td className="py-3.5 px-4 min-w-[130px]">
                          <div className="flex justify-between font-mono text-[11px] mb-1">
                            <span className="font-bold text-white">
                              {p.progress}%
                            </span>
                            <span className="text-slate-500">
                              Plan {p.plannedProgress}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                p.status === "DELAYED"
                                  ? "bg-amber-500"
                                  : p.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : "bg-brand-500"
                              )}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-slate-200">
                            {formatCompactKES(p.budget)}
                          </div>
                          <div className="text-[11px] text-brand-300">
                            Spent: {formatCompactKES(p.actualCost)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-emerald-400">
                            {formatCompactKES(projProfit)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {projMargin}% Margin
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border",
                              st.badge
                            )}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-brand-300"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Notifications & Audit Trail */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">
                    Operational Alerts
                  </h3>
                </div>
                <Link
                  href="/notifications"
                  className="text-xs font-medium text-brand-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 space-y-1 hover:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-100">
                        {n.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Audit Log Stream
                  </h3>
                </div>
                {ctx.can("audit:view") && (
                  <Link
                    href="/audit-logs"
                    className="text-xs font-medium text-brand-400 hover:underline"
                  >
                    Full Trail
                  </Link>
                )}
              </div>
              <div className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold text-brand-400">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
