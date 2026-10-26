"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Users,
  FileText,
  Landmark,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Edit3,
  HardHat,
  Compass,
  ClipboardCheck,
  Flag,
  GitBranch,
  Ban,
  Calculator,
  RefreshCw,
  Package,
  ShoppingCart,
} from "lucide-react";
import {
  assignProjectMemberAction,
  createProjectDocumentAction,
  createProjectPhaseAction,
  createSiteAction,
  updateProjectPhaseProgressAction,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import { syncBudgetFromBoqAction } from "@/app/actions/boq-budgets";
import { ROLES, UserRole } from "@/lib/rbac";
import {
  BOQ_SECTION_STYLES,
  BUDGET_CATEGORY_STYLES,
  BUDGET_STATUS_STYLES,
  MATERIAL_CATEGORY_STYLES,
  MATERIAL_REQUEST_STATUS_STYLES,
  PROJECT_STATUS_STYLES,
  PURCHASE_ORDER_STATUS_STYLES,
  STOCK_STATUS_STYLES,
  TASK_PRIORITY_STYLES,
  TASK_STATUS_STYLES,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface PhaseItem {
  id: string;
  sequenceOrder: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  plannedProgress: number;
  progress: number;
  status: string;
  leadUser: { id: string; name: string; role: string } | null;
}

interface ProjectTaskItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  priority: string;
  status: string;
  progress: number;
  blockerReason: string | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
  assignedTo: { id: string; name: string; role: string } | null;
  dependsOnTask: { id: string; code: string; name: string; status: string } | null;
}

interface ProjectMilestoneItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  targetDate: string;
  achievedDate: string | null;
  status: string;
  valuationLinkedNote: string | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
  owner: { id: string; name: string; role: string } | null;
}

interface SiteItem {
  id: string;
  code: string;
  name: string;
  location: string;
  county: string;
  gpsCoordinates: string | null;
  status: string;
  notes: string | null;
  siteManager: { id: string; name: string; phone: string | null } | null;
}

interface TeamMemberItem {
  id: string;
  projectRole: string;
  allocationPct: number;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    jobTitle: string | null;
    department: string | null;
    employeeCode: string | null;
  };
}

interface DocumentItem {
  id: string;
  title: string;
  documentNumber: string;
  category: string;
  version: string;
  fileName: string;
  fileSizeLabel: string;
  status: string;
  notes: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string; role: string } | null;
}

interface ProjectBoqItem {
  id: string;
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
  phase: { id: string; sequenceOrder: number; name: string } | null;
}

interface ProjectBudgetLineItem {
  id: string;
  code: string;
  category: string;
  title: string;
  description: string | null;
  allocatedBudget: number;
  committedCost: number;
  actualCost: number;
  alertThresholdPct: number;
  status: string;
  notes: string | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
}

interface ProjectMaterialStockItem {
  id: string;
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
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    standardUnitCost: number;
  };
  site: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface ProjectCommandCenterProps {
  project: {
    id: string;
    code: string;
    name: string;
    projectType: string;
    location: string;
    county: string;
    description: string | null;
    startDate: string;
    expectedCompletionDate: string;
    actualCompletionDate: string | null;
    contractValue: number;
    budget: number;
    committedCost: number;
    actualCost: number;
    invoicedAmount: number;
    paidAmount: number;
    status: string;
    plannedProgress: number;
    progress: number;
    client: {
      id: string;
      code: string;
      name: string;
      contactPerson: string;
      phone: string;
      email: string;
    } | null;
    projectManager: { id: string; name: string; email: string } | null;
    siteManager: { id: string; name: string; email: string } | null;
    quantitySurveyor: { id: string; name: string; email: string } | null;
    phases: PhaseItem[];
    tasks: ProjectTaskItem[];
    milestones: ProjectMilestoneItem[];
    sites: SiteItem[];
    teamMembers: TeamMemberItem[];
    documents: DocumentItem[];
    boqItems: ProjectBoqItem[];
    budgetLines: ProjectBudgetLineItem[];
    projectMaterialStocks: ProjectMaterialStockItem[];
    materialRequests: {
      id: string;
      requestNumber: string;
      title: string;
      requestedQuantity: number;
      approvedQuantity: number;
      estimatedTotalCost: number;
      priority: string;
      requiredByDate: string;
      status: string;
      material: { id: string; code: string; name: string; unit: string };
      requestedBy: { id: string; name: string } | null;
    }[];
    purchaseOrders: {
      id: string;
      poNumber: string;
      orderedQuantity: number;
      receivedQuantity: number;
      totalAmount: number;
      paidAmount: number;
      expectedDeliveryDate: string;
      status: string;
      supplier: { id: string; code: string; name: string };
      material: { id: string; code: string; name: string; unit: string };
    }[];
    siteWorkers: {
      id: string;
      workerCode: string;
      fullName: string;
      workerCategory: string;
      tradeRole: string;
      dailyRate: number;
      daysWorked: number;
      totalEarned: number;
      unpaidBalance: number;
      paymentStatus: string;
    }[];
    subcontractors: {
      id: string;
      code: string;
      companyName: string;
      specialization: string;
      ncaCategory: string | null;
      contractValue: number;
      certifiedAmount: number;
      paidAmount: number;
      outstandingBalance: number;
      progressPct: number;
      status: string;
    }[];
    equipmentAssets: {
      id: string;
      assetCode: string;
      name: string;
      category: string;
      ownershipType: string;
      operatorName: string | null;
      availabilityStatus: string;
      dailyRate: number;
      totalHoursLogged: number;
      totalOperatingCost: number;
    }[];
    siteReports: {
      id: string;
      reportNumber: string;
      reportDate: string;
      reportType: string;
      weatherCondition: string;
      workersPresentCount: number;
      subcontractorWorkersCount: number;
      workCompletedSummary: string;
      overallProgressDelta: number;
      status: string;
    }[];
    projectIssues: {
      id: string;
      issueCode: string;
      title: string;
      category: string;
      severity: string;
      status: string;
      dueDate: string;
    }[];
    qualitySafetyRecords: {
      id: string;
      recordNumber: string;
      recordDomain: string;
      title: string;
      locationArea: string;
      resultStatus: string;
      complianceScorePct: number;
      inspectionDate: string;
    }[];
    projectExpenses: {
      id: string;
      expenseNumber: string;
      category: string;
      title: string;
      vendorOrPayee: string;
      totalAmount: number;
      paymentMethod: string;
      status: string;
      expenseDate: string;
    }[];
    clientInvoices: {
      id: string;
      invoiceNumber: string;
      valuationCertificateRef: string | null;
      title: string;
      totalAmount: number;
      paidAmount: number;
      balanceAmount: number;
      status: string;
      dueDate: string;
    }[];
    financialPayments: {
      id: string;
      paymentNumber: string;
      direction: string;
      counterpartyName: string;
      amount: number;
      paymentMethod: string;
      paymentDate: string;
    }[];
    projectVariations: {
      id: string;
      variationNumber: string;
      title: string;
      reason: string;
      variationAmount: number;
      timeExtensionDays: number;
      status: string;
    }[];
  };
  users: { id: string; name: string; role: string; jobTitle: string | null }[];
  currency: string;
  canManageProject: boolean;
  canManagePlanning: boolean;
  canManageBoq: boolean;
  canManageBudgets: boolean;
  canManageDocs: boolean;
}

const PHASE_STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  IN_PROGRESS: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  DELAYED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  NOT_STARTED: "bg-slate-800 text-slate-400 border-slate-700",
};

export function ProjectCommandCenterClient({
  project,
  users,
  currency,
  canManageProject,
  canManagePlanning,
  canManageBoq,
  canManageBudgets,
  canManageDocs,
}: ProjectCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "phases"
    | "tasks"
    | "boq_budgets"
    | "materials_stock"
    | "sites"
    | "team"
    | "documents"
  >("overview");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseItem | null>(null);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusMeta =
    PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.PLANNING;
  const remainingBudget = project.budget - project.actualCost;
  const projectedGrossProfit = project.contractValue - project.actualCost;
  const budgetUtilization =
    project.budget > 0
      ? Math.round((project.actualCost / project.budget) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Top Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Construction Portfolio</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canManageProject && (
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              <Edit3 className="h-3.5 w-3.5 text-brand-400" />
              <span>Update Status / Progress</span>
            </button>
          )}
          {canManagePlanning && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("phases");
                setShowAddPhaseModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-1.5 text-xs font-bold text-slate-950"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Project Phase</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Command Center Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-brand-400">
                {project.code}
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
                {project.projectType}
              </span>
              <span
                className={cn(
                  "rounded-md border px-2.5 py-0.5 text-xs font-mono font-semibold",
                  statusMeta.badge
                )}
              >
                {statusMeta.label}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white">{project.name}</h1>

            {project.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                {project.location}, {project.county}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {formatDate(project.startDate)} →{" "}
                {formatDate(project.expectedCompletionDate)}
              </span>
              {project.client && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  Client: <strong className="text-slate-200">{project.client.name}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Overall Progress Meter */}
          <div className="w-full lg:w-72 rounded-xl border border-slate-800 bg-slate-950/90 p-4 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                Overall Construction Progress
              </span>
              <span className="font-mono font-bold text-lg text-brand-400">
                {project.progress}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden mt-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  project.status === "DELAYED"
                    ? "bg-amber-500"
                    : project.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : "bg-brand-500"
                )}
                style={{ width: `${Math.min(100, project.progress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
              <span>Planned: {project.plannedProgress}%</span>
              <span>
                {project.phases.filter((p) => p.status === "COMPLETED").length}/
                {project.phases.length} Phases Done
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Operational Command Metrics Strip (Section 9 & 34) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800/80">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[11px] text-slate-400">Contract Value</div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {formatCurrency(project.contractValue, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[11px] text-slate-400">Project Budget</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {formatCurrency(project.budget, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[11px] text-slate-400">Committed Cost</div>
            <div className="text-sm font-bold font-mono text-cyan-400 mt-1">
              {formatCurrency(project.committedCost, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[11px] text-slate-400">
              Actual Cost ({budgetUtilization}%)
            </div>
            <div className="text-sm font-bold font-mono text-brand-400 mt-1">
              {formatCurrency(project.actualCost, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[11px] text-slate-400">Remaining Budget</div>
            <div
              className={cn(
                "text-sm font-bold font-mono mt-1",
                remainingBudget < 0 ? "text-red-400" : "text-emerald-400"
              )}
            >
              {formatCurrency(remainingBudget, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[11px] text-slate-400">
              Gross Margin to Date
            </div>
            <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
              {formatCurrency(projectedGrossProfit, currency)}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-lg border p-3.5 flex items-center justify-between gap-3 text-xs",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Command Center Navigation Tabs */}
      <div className="flex overflow-x-auto sm:flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "overview", label: "Command Overview", icon: Landmark },
          {
            id: "phases",
            label: `Project Phases (${project.phases.length})`,
            icon: Layers,
          },
          {
            id: "tasks",
            label: `Tasks & Milestones (${project.tasks.length})`,
            icon: ClipboardCheck,
          },
          {
            id: "boq_budgets",
            label: `BOQ & Budgets (${project.boqItems.length})`,
            icon: Calculator,
          },
          {
            id: "materials_stock",
            label: `Materials & Stock (${project.projectMaterialStocks.length})`,
            icon: Package,
          },
          {
            id: "sites",
            label: `Construction Sites (${project.sites.length})`,
            icon: Compass,
          },
          {
            id: "team",
            label: `Project Team (${project.teamMembers.length})`,
            icon: Users,
          },
          {
            id: "documents",
            label: `Project Documents (${project.documents.length})`,
            icon: FileText,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
                active
                  ? "bg-brand-500 text-slate-950"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMMAND OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sequential Phases Summary */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Sequential Construction Phases Breakdown
                </h2>
                <p className="text-xs text-slate-400">
                  Click any phase to update progress or actual expenditure
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("phases")}
                className="self-start sm:self-center text-xs font-semibold text-brand-400 hover:underline"
              >
                Manage All Phases →
              </button>
            </div>

            <div className="divide-y divide-slate-800/60">
              {project.phases.map((ph) => (
                <div
                  key={ph.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-400">
                        Phase 0{ph.sequenceOrder}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {ph.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded border",
                          PHASE_STATUS_BADGE[ph.status] ||
                            PHASE_STATUS_BADGE.NOT_STARTED
                        )}
                      >
                        {ph.status}
                      </span>
                    </div>
                    {ph.description && (
                      <p className="text-xs text-slate-400">{ph.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                      <span>
                        Budget: {formatCurrency(ph.budget, currency)}
                      </span>
                      <span className="text-brand-300">
                        Actual: {formatCurrency(ph.actualCost, currency)}
                      </span>
                      <span>
                        {formatDate(ph.startDate)} → {formatDate(ph.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 shrink-0 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-white font-bold">
                          {ph.progress}%
                        </span>
                        <span className="text-slate-500">
                          Plan {ph.plannedProgress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            ph.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : ph.status === "DELAYED"
                                ? "bg-amber-500"
                                : "bg-brand-500"
                          )}
                          style={{ width: `${ph.progress}%` }}
                        />
                      </div>
                    </div>
                    {canManagePlanning && (
                      <button
                        type="button"
                        onClick={() => setEditingPhase(ph)}
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Update Phase Progress"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Key Leadership, Active Sites & Client Summary */}
          <div className="space-y-6">
            {/* Project Leadership Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardHat className="h-4 w-4 text-brand-400" />
                <span>Project Command Leadership</span>
              </h3>
              <div className="space-y-2.5 text-xs pt-1">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-500">
                    Project Manager
                  </div>
                  <div className="font-bold text-white mt-0.5">
                    {project.projectManager?.name || "Unassigned"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-500">
                    Resident Site Manager
                  </div>
                  <div className="font-bold text-white mt-0.5">
                    {project.siteManager?.name || "Unassigned"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-500">
                    Project Quantity Surveyor
                  </div>
                  <div className="font-bold text-white mt-0.5">
                    {project.quantitySurveyor?.name || "Unassigned"}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sites Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Active Construction Sites
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("sites")}
                  className="text-xs text-brand-400 hover:underline"
                >
                  View all ({project.sites.length})
                </button>
              </div>
              <div className="space-y-2.5">
                {project.sites.map((site) => (
                  <div
                    key={site.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-brand-400">
                        {site.code}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        {site.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {site.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {site.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECT PHASES */}
      {activeTab === "phases" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Project Phases & Cost/Progress Rollup
              </h2>
              <p className="text-xs text-slate-400">
                Updating any phase automatically recalculates budget-weighted overall project progress and actual cost.
              </p>
            </div>
            {canManagePlanning && (
              <button
                type="button"
                onClick={() => setShowAddPhaseModal(true)}
                className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-2 text-xs font-bold text-slate-950"
              >
                <Plus className="h-4 w-4" />
                <span>Add Phase</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Phase & Scope</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Phase Budget</th>
                  <th className="py-3.5 px-4">Actual Spent</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {project.phases.map((ph) => (
                  <tr key={ph.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                      0{ph.sequenceOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{ph.name}</div>
                      {ph.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                          {ph.description}
                        </div>
                      )}
                      {ph.leadUser && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Lead: {ph.leadUser.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      <div>{formatDate(ph.startDate)}</div>
                      <div className="text-[11px] text-slate-500">
                        to {formatDate(ph.endDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {formatCurrency(ph.budget, currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-brand-300">
                      {formatCurrency(ph.actualCost, currency)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span className="font-bold text-white">
                          {ph.progress}%
                        </span>
                        <span className="text-slate-500">
                          Plan {ph.plannedProgress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${ph.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border",
                          PHASE_STATUS_BADGE[ph.status] ||
                            PHASE_STATUS_BADGE.NOT_STARTED
                        )}
                      >
                        {ph.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canManagePlanning && (
                        <button
                          type="button"
                          onClick={() => setEditingPhase(ph)}
                          className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200"
                        >
                          Update Progress
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2B: PROJECT TASKS & MILESTONES */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Milestones Strip */}
          {project.milestones.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flag className="h-4 w-4 text-brand-400" />
                  <span>Key Project Milestones ({project.milestones.length})</span>
                </h2>
                <Link
                  href={`/operations/tasks?projectId=${project.id}&view=milestones`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Manage in Planning Hub →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {project.milestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-400">
                        {ms.code}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded border",
                          ms.status === "ACHIEVED"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : ms.status === "DELAYED"
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : "bg-brand-500/15 text-brand-300 border-brand-500/30"
                        )}
                      >
                        {ms.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{ms.title}</div>
                    {ms.valuationLinkedNote && (
                      <div className="text-[11px] text-cyan-300">
                        {ms.valuationLinkedNote}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Target: {formatDate(ms.targetDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Project Tasks, Schedule & Dependencies
                </h2>
                <p className="text-xs text-slate-400">
                  Tasks and prerequisite dependency relationships for {project.code}
                </p>
              </div>
              <Link
                href={`/operations/tasks?projectId=${project.id}`}
                className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-2 text-xs font-bold text-slate-950"
              >
                <Plus className="h-4 w-4" />
                <span>Manage Tasks in Planning Hub</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3.5 px-4">Code & Task</th>
                    <th className="py-3.5 px-4">Phase</th>
                    <th className="py-3.5 px-4">Dependency</th>
                    <th className="py-3.5 px-4">Assignee</th>
                    <th className="py-3.5 px-4">Priority & Due</th>
                    <th className="py-3.5 px-4">Progress & Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {project.tasks.map((t) => {
                    const st =
                      TASK_STATUS_STYLES[t.status] ||
                      TASK_STATUS_STYLES.NOT_STARTED;
                    const prio =
                      TASK_PRIORITY_STYLES[t.priority] ||
                      TASK_PRIORITY_STYLES.MEDIUM;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] font-bold text-brand-400">
                            {t.code}
                          </div>
                          <div className="font-bold text-white mt-0.5">
                            {t.name}
                          </div>
                          {t.status === "BLOCKED" && t.blockerReason && (
                            <div className="mt-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 flex items-center gap-1">
                              <Ban className="h-3 w-3 shrink-0" />
                              <span>{t.blockerReason}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {t.phase
                            ? `Phase 0${t.phase.sequenceOrder}: ${t.phase.name}`
                            : "General"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {t.dependsOnTask ? (
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <GitBranch className="h-3 w-3 text-brand-400" />
                              After {t.dependsOnTask.code}
                            </span>
                          ) : (
                            <span className="text-slate-500">Independent</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-200">
                          {t.assignedTo?.name || "Unassigned"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded text-[10px] font-mono border mb-1",
                              prio
                            )}
                          >
                            {t.priority}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            Due: {formatDate(t.dueDate)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 min-w-[140px]">
                          <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                            <span className="font-bold text-white">
                              {t.progress}%
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] border",
                                st.badge
                              )}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${t.progress}%` }}
                            />
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

      {/* TAB 3: CONSTRUCTION SITES */}
      {activeTab === "sites" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Project Construction Sites
              </h2>
              <p className="text-xs text-slate-400">
                Physical construction sites, coordinates, and resident site managers
              </p>
            </div>
            {canManageProject && (
              <button
                type="button"
                onClick={() => setShowAddSiteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-2 text-xs font-bold text-slate-950"
              >
                <Plus className="h-4 w-4" />
                <span>Register Site</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.sites.map((site) => (
              <div
                key={site.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {site.code}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {site.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{site.name}</h3>
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  <span>
                    {site.location}, {site.county}
                  </span>
                </div>
                {site.gpsCoordinates && (
                  <div className="text-[11px] font-mono text-slate-400">
                    GPS: {site.gpsCoordinates}
                  </div>
                )}
                {site.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    {site.notes}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                  Site Manager:{" "}
                  <strong className="text-slate-200">
                    {site.siteManager?.name || "Unassigned"}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Phase 8: Daily Site Reports, Issues/Snags & QA/Safety Records */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
            {/* 1. Daily Site Reports */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Site Reports ({project.siteReports.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Daily diaries, weather & headcount
                  </p>
                </div>
                <Link
                  href={`/operations/site-reports?projectId=${project.id}`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  All Reports →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-80 overflow-y-auto">
                {project.siteReports.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No daily site reports logged yet.
                  </div>
                ) : (
                  project.siteReports.map((sr) => (
                    <div
                      key={sr.id}
                      className="p-3.5 space-y-1 hover:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-400">
                          {sr.reportNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(sr.reportDate)}
                        </span>
                      </div>
                      <p className="text-slate-200 line-clamp-2">
                        {sr.workCompletedSummary}
                      </p>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        {sr.workersPresentCount + sr.subcontractorWorkersCount}{" "}
                        operatives • +{sr.overallProgressDelta}% progress
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Site Issues & Snags */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Issues & Snags ({project.projectIssues.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    RFIs, delays & site defects
                  </p>
                </div>
                <Link
                  href={`/operations/issues?projectId=${project.id}`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Risk Register →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-80 overflow-y-auto">
                {project.projectIssues.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No active issues or snags on this project.
                  </div>
                ) : (
                  project.projectIssues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-3.5 space-y-1 hover:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-400">
                          {iss.issueCode}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                          {iss.severity} • {iss.status}
                        </span>
                      </div>
                      <div className="font-semibold text-white">
                        {iss.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Due {formatDate(iss.dueDate)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. QA/QC & HSE Safety Records */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    QA/QC & Safety ({project.qualitySafetyRecords.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Hold points, cube tests & HSE audits
                  </p>
                </div>
                <Link
                  href={`/operations/inspections?projectId=${project.id}`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Inspections →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-80 overflow-y-auto">
                {project.qualitySafetyRecords.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No QA/QC or safety inspections logged yet.
                  </div>
                ) : (
                  project.qualitySafetyRecords.map((qsi) => (
                    <div
                      key={qsi.id}
                      className="p-3.5 space-y-1 hover:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-400">
                          {qsi.recordNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                          {qsi.resultStatus} ({qsi.complianceScorePct}%)
                        </span>
                      </div>
                      <div className="font-semibold text-white">
                        {qsi.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {qsi.locationArea}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROJECT TEAM */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Assigned Project Team & Responsibilities
              </h2>
              <p className="text-xs text-slate-400">
                Engineers, managers, quantity surveyors, and site staff allocated to {project.code}
              </p>
            </div>
            {canManageProject && (
              <button
                type="button"
                onClick={() => setShowAssignTeamModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-2 text-xs font-bold text-slate-950"
              >
                <Plus className="h-4 w-4" />
                <span>Assign Team Member</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.teamMembers.map((tm) => {
              const rMeta =
                ROLES[tm.user.role as UserRole] || ROLES.PROJECT_MANAGER;
              return (
                <div
                  key={tm.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded border",
                          rMeta.badgeColor
                        )}
                      >
                        {rMeta.shortLabel}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {tm.allocationPct}% Allocated
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">
                      {tm.user.name}
                    </h3>
                    <div className="text-xs font-semibold text-brand-300 mt-0.5">
                      {tm.projectRole}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {tm.user.jobTitle}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div>{tm.user.email}</div>
                    {tm.user.phone && <div>{tm.user.phone}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phase 7: On-Site Workforce, Subcontractors & Deployed Plant */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
            {/* 1. On-Site Workforce */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Site Workforce ({project.siteWorkers.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Skilled trades & casual operatives
                  </p>
                </div>
                <Link
                  href={`/people/workforce?projectId=${project.id}`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Muster Roll →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-80 overflow-y-auto">
                {project.siteWorkers.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No operatives assigned to this project.
                  </div>
                ) : (
                  project.siteWorkers.map((sw) => (
                    <div
                      key={sw.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {sw.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sw.workerCode} • {sw.tradeRole}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-brand-300 font-semibold">
                          {sw.daysWorked}d • {formatCurrency(sw.dailyRate, currency)}/d
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Unpaid: {formatCurrency(sw.unpaidBalance, currency)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Specialist Subcontractors */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Subcontractors ({project.subcontractors.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    MEP, lifts, facade & specialist packages
                  </p>
                </div>
                <Link
                  href="/people/contractors"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Valuations →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-80 overflow-y-auto">
                {project.subcontractors.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No subcontractor packages awarded on this project.
                  </div>
                ) : (
                  project.subcontractors.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {sc.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sc.specialization} • {sc.progressPct}% complete
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-white font-bold">
                          {formatCurrency(sc.contractValue, currency)}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          Cert: {formatCurrency(sc.certifiedAmount, currency)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Deployed Heavy Plant & Equipment */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Deployed Plant ({project.equipmentAssets.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cranes, excavators, pumps & gensets
                  </p>
                </div>
                <Link
                  href="/equipment"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Fleet Logs →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-80 overflow-y-auto">
                {project.equipmentAssets.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No heavy plant currently deployed on this project.
                  </div>
                ) : (
                  project.equipmentAssets.map((eq) => (
                    <div
                      key={eq.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">{eq.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {eq.assetCode} • Op: {eq.operatorName || "Unassigned"}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-brand-300 font-semibold">
                          {eq.totalHoursLogged} hrs
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatCurrency(eq.totalOperatingCost, currency)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROJECT DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Project Drawings, Contracts & Approvals
              </h2>
              <p className="text-xs text-slate-400">
                Architectural drawings, structural rebar schedules, priced BOQs, and NCA/NEMA permits
              </p>
            </div>
            {canManageDocs && (
              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-2 text-xs font-bold text-slate-950"
              >
                <Plus className="h-4 w-4" />
                <span>Register Document</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-4">Ref Number</th>
                  <th className="py-3.5 px-4">Document Title & File</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Version & Size</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {project.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-brand-400 font-semibold">
                      {doc.documentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{doc.title}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {doc.fileName}
                      </div>
                      {doc.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {doc.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {doc.version} • {doc.fileSizeLabel}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{doc.uploadedBy?.name || "System"}</div>
                      <div className="text-[10px] text-slate-500">
                        {formatDate(doc.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BOQ & BUDGETS (Phase 4) */}
      {activeTab === "boq_budgets" && (
        <div className="space-y-6">
          {/* Commercial & Cost Control Header Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-brand-400">
                Quantity Surveying & Cost Control
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {project.name} — Priced BOQ Schedule & Category Budgets
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Priced Bill of Quantities Value:{" "}
                <strong className="font-mono text-white">
                  {formatCurrency(
                    project.boqItems.reduce((s, i) => s + i.totalAmount, 0),
                    currency
                  )}
                </strong>{" "}
                • QS Certified Executed Value:{" "}
                <strong className="font-mono text-emerald-400">
                  {formatCurrency(
                    project.boqItems.reduce((s, i) => s + i.executedAmount, 0),
                    currency
                  )}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageBudgets && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("projectId", project.id);
                    startTransition(async () => {
                      const res = await syncBudgetFromBoqAction(fd);
                      if (res?.error) {
                        setFeedback({ type: "error", message: res.error });
                      } else {
                        setFeedback({
                          type: "success",
                          message:
                            "Synchronized project budget lines from priced BOQ schedule.",
                        });
                      }
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", isPending && "animate-spin")}
                  />
                  <span>Sync Budget from BOQ</span>
                </button>
              )}
              <Link
                href={`/finance/boq?projectId=${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-1.5 text-xs font-bold text-slate-950"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Open Full BOQ Schedule</span>
              </Link>
              <Link
                href={`/finance/budgets?projectId=${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200"
              >
                <Landmark className="h-3.5 w-3.5 text-brand-400" />
                <span>Manage Project Budgets</span>
              </Link>
            </div>
          </div>

          {/* 1. Structured Project Budget Categories (Budget -> Committed -> Actual -> Remaining) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Project Cost Control Breakdown ({project.budgetLines.length} Categories)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tracks Approved Budget → Committed Cost → Actual Cost → Remaining Budget
                </p>
              </div>
              <Link
                href={`/finance/budgets?projectId=${project.id}`}
                className="text-xs font-semibold text-brand-400 hover:underline"
              >
                Edit Cost Control →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Code & Category</th>
                    <th className="py-3 px-4">Budget Scope</th>
                    <th className="py-3 px-4 text-right">Approved Budget</th>
                    <th className="py-3 px-4 text-right">Committed</th>
                    <th className="py-3 px-4 text-right">Actual Cost</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4">Overrun Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {project.budgetLines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-slate-400"
                      >
                        No structured budget lines established yet for this project.
                      </td>
                    </tr>
                  ) : (
                    project.budgetLines.map((bl) => {
                      const catStyle =
                        BUDGET_CATEGORY_STYLES[bl.category] ||
                        BUDGET_CATEGORY_STYLES.MATERIALS;
                      const stStyle =
                        BUDGET_STATUS_STYLES[bl.status] ||
                        BUDGET_STATUS_STYLES.WITHIN_BUDGET;
                      const rem = bl.allocatedBudget - bl.actualCost;
                      return (
                        <tr key={bl.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-brand-400 block">
                              {bl.code}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border mt-1",
                                catStyle.badge
                              )}
                            >
                              {catStyle.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">
                              {bl.title}
                            </div>
                            {bl.notes && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {bl.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {formatCurrency(bl.allocatedBudget, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-cyan-300">
                            {formatCurrency(bl.committedCost, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-300">
                            {formatCurrency(bl.actualCost, currency)}
                          </td>
                          <td
                            className={cn(
                              "py-3 px-4 text-right font-mono font-bold",
                              rem < 0 ? "text-red-400" : "text-emerald-400"
                            )}
                          >
                            {formatCurrency(rem, currency)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                                stStyle.badge
                              )}
                            >
                              {stStyle.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Priced Bills of Quantities (BOQ) Schedule */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Bill of Quantities (BOQ) Items ({project.boqItems.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Server-calculated Total = Quantity × Unit Rate and QS measured site execution
                </p>
              </div>
              <Link
                href={`/finance/boq?projectId=${project.id}`}
                className="text-xs font-semibold text-brand-400 hover:underline"
              >
                Add / Measure BOQ Items →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Work Description & Trade Section</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Bill Qty</th>
                    <th className="py-3 px-4 text-right">Measured Qty</th>
                    <th className="py-3 px-4 text-right">Rate ({currency})</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Certified Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {project.boqItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        No BOQ items priced yet for this project.
                      </td>
                    </tr>
                  ) : (
                    project.boqItems.map((bi) => {
                      const secStyle =
                        BOQ_SECTION_STYLES[bi.category] ||
                        BOQ_SECTION_STYLES.SUPERSTRUCTURE_CONCRETE;
                      return (
                        <tr key={bi.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-brand-400">
                            {bi.itemCode}
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <div className="text-slate-100 font-medium">
                              {bi.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-medium border",
                                  secStyle.badge
                                )}
                              >
                                {secStyle.label}
                              </span>
                              {bi.phase && (
                                <span className="text-[11px] text-slate-400">
                                  • Phase {bi.phase.sequenceOrder}: {bi.phase.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {bi.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {bi.quantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">
                            {bi.executedQuantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {bi.unitRate.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {formatCurrency(bi.totalAmount, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">
                            {formatCurrency(bi.executedAmount, currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phase 9: Financial Management (Expenses, IPC Invoices, Payments & Variations) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* 1. Direct Site Expenses */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Site Expenses ({project.projectExpenses.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct site expenditure & E-TIMS vouchers
                  </p>
                </div>
                <Link
                  href="/finance/expenses"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  All Expenses →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-72 overflow-y-auto">
                {project.projectExpenses.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No direct site expenses recorded yet.
                  </div>
                ) : (
                  project.projectExpenses.map((pe) => (
                    <div
                      key={pe.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {pe.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {pe.expenseNumber} • {pe.vendorOrPayee} ({pe.category})
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="text-white font-bold">
                          {formatCurrency(pe.totalAmount, currency)}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          {pe.paymentMethod}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Client IPC Valuation Invoices */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Client IPC Invoices ({project.clientInvoices.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Interim Payment Certificates & retention
                  </p>
                </div>
                <Link
                  href="/finance/invoices"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  IPC Billing →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-72 overflow-y-auto">
                {project.clientInvoices.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No client valuation invoices issued yet.
                  </div>
                ) : (
                  project.clientInvoices.map((ci) => (
                    <div
                      key={ci.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {ci.valuationCertificateRef || ci.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ci.invoiceNumber} • Status: {ci.status}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="text-white font-bold">
                          {formatCurrency(ci.totalAmount, currency)}
                        </div>
                        <div className="text-[10px] text-amber-400">
                          Bal: {formatCurrency(ci.balanceAmount, currency)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. M-Pesa & Bank Payments */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    M-Pesa & Bank Cashflow ({project.financialPayments.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Inbound client receipts & outbound payouts
                  </p>
                </div>
                <Link
                  href="/finance/payments"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Treasury Ledger →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-72 overflow-y-auto">
                {project.financialPayments.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  project.financialPayments.map((fp) => (
                    <div
                      key={fp.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {fp.counterpartyName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {fp.paymentNumber} • {fp.paymentMethod}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div
                          className={
                            fp.direction === "INBOUND_CLIENT"
                              ? "text-emerald-400 font-bold"
                              : "text-white font-bold"
                          }
                        >
                          {fp.direction === "INBOUND_CLIENT" ? "+" : "-"}
                          {formatCurrency(fp.amount, currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(fp.paymentDate)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. Project Variations & Change Orders */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Project Variations ({project.projectVariations.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Change orders, contract sum & EOT impact
                  </p>
                </div>
                <Link
                  href="/finance/variations"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Change Orders →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs max-h-72 overflow-y-auto">
                {project.projectVariations.length === 0 ? (
                  <div className="p-5 text-center text-slate-500">
                    No variation orders logged on this project.
                  </div>
                ) : (
                  project.projectVariations.map((pv) => (
                    <div
                      key={pv.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {pv.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {pv.variationNumber} • {pv.status}
                          {pv.timeExtensionDays > 0
                            ? ` • +${pv.timeExtensionDays}d EOT`
                            : ""}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div
                          className={
                            pv.variationAmount < 0
                              ? "text-emerald-400 font-bold"
                              : "text-amber-400 font-bold"
                          }
                        >
                          {pv.variationAmount >= 0 ? "+" : ""}
                          {formatCurrency(pv.variationAmount, currency)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MATERIALS & SITE STOCK (Phase 5) */}
      {activeTab === "materials_stock" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="h-4 w-4 text-brand-400" />
                  Project Material Requirements & Site Store Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time material balance:{" "}
                  <span className="font-mono text-brand-300">
                    Remaining Stock = Received − Used − Wastage
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/materials?projectId=${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
                >
                  Open Materials Catalog →
                </Link>
                <Link
                  href={`/materials/stock?projectId=${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-1.5 text-xs font-bold text-slate-950"
                >
                  Open Live Site Store Ledger →
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Code & Material</th>
                    <th className="py-3 px-4">Site Store</th>
                    <th className="py-3 px-4 text-right">Required</th>
                    <th className="py-3 px-4 text-right">Ordered</th>
                    <th className="py-3 px-4 text-right">Received</th>
                    <th className="py-3 px-4 text-right">Used (Wastage)</th>
                    <th className="py-3 px-4 text-right">Remaining On-Site</th>
                    <th className="py-3 px-4 text-right">Reorder Limit</th>
                    <th className="py-3 px-4 text-center">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {project.projectMaterialStocks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No material stock ledgers assigned to this project yet.
                      </td>
                    </tr>
                  ) : (
                    project.projectMaterialStocks.map((ms) => {
                      const catStyle =
                        MATERIAL_CATEGORY_STYLES[ms.material.category] ||
                        MATERIAL_CATEGORY_STYLES.GENERAL_HARDWARE;
                      const stStyle =
                        STOCK_STATUS_STYLES[ms.status] ||
                        STOCK_STATUS_STYLES.ADEQUATE;
                      return (
                        <tr
                          key={ms.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand-400">
                                {ms.material.code}
                              </span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-medium border",
                                  catStyle.badge
                                )}
                              >
                                {catStyle.label}
                              </span>
                            </div>
                            <div className="font-semibold text-white mt-0.5">
                              {ms.material.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {ms.site ? (
                              <div>
                                <span className="font-medium text-white">
                                  {ms.site.name}
                                </span>
                                <span className="block text-[10px] font-mono text-slate-500">
                                  {ms.site.code}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Central Store</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {ms.requiredQuantity.toLocaleString()} {ms.material.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sky-300">
                            {ms.orderedQuantity.toLocaleString()} {ms.material.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-300 font-semibold">
                            {ms.receivedQuantity.toLocaleString()} {ms.material.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-300">
                            {ms.usedQuantity.toLocaleString()} {ms.material.unit}
                            {ms.wastageQuantity > 0 && (
                              <span className="block text-[10px] text-rose-400">
                                +{ms.wastageQuantity.toLocaleString()} wastage
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {ms.remainingQuantity.toLocaleString()} {ms.material.unit}
                            <span className="block text-[10px] font-normal text-slate-400">
                              Val:{" "}
                              {formatCurrency(
                                ms.remainingQuantity * ms.unitCost,
                                currency
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            {ms.reorderLevel.toLocaleString()} {ms.material.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                                stStyle.badge
                              )}
                            >
                              <span
                                className={cn("h-1.5 w-1.5 rounded-full", stStyle.dot)}
                              />
                              {stStyle.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phase 6 Procurement Activity on this Project */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Material Requests */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-amber-400" />
                    Site Material Requests ({project.materialRequests.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Requisitions submitted by site team for this project
                  </p>
                </div>
                <Link
                  href={`/materials/requests?projectId=${project.id}`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Manage Requisitions →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs">
                {project.materialRequests.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No material requests recorded for this project yet.
                  </div>
                ) : (
                  project.materialRequests.map((mr) => {
                    const mrStyle =
                      MATERIAL_REQUEST_STATUS_STYLES[mr.status] ||
                      MATERIAL_REQUEST_STATUS_STYLES.SUBMITTED;
                    return (
                      <div
                        key={mr.id}
                        className="p-4 flex items-start justify-between gap-3 hover:bg-slate-800/30"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-400">
                              {mr.requestNumber}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-mono border",
                                mrStyle.badge
                              )}
                            >
                              {mrStyle.label}
                            </span>
                          </div>
                          <div className="font-semibold text-white mt-1">
                            {mr.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {mr.material.name} • Req:{" "}
                            {mr.requestedQuantity.toLocaleString()}{" "}
                            {mr.material.unit}
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="font-bold text-white">
                            {formatCurrency(mr.estimatedTotalCost, currency)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Need by {formatDate(mr.requiredByDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Project Purchase Orders (LPOs) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-brand-400" />
                    Supplier Purchase Orders ({project.purchaseOrders.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official LPOs issued to suppliers for this project
                  </p>
                </div>
                <Link
                  href={`/procurement/purchase-orders?projectId=${project.id}`}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Open LPO Register →
                </Link>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs">
                {project.purchaseOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No purchase orders issued for this project yet.
                  </div>
                ) : (
                  project.purchaseOrders.map((po) => {
                    const poStyle =
                      PURCHASE_ORDER_STATUS_STYLES[po.status] ||
                      PURCHASE_ORDER_STATUS_STYLES.APPROVED;
                    return (
                      <div
                        key={po.id}
                        className="p-4 flex items-start justify-between gap-3 hover:bg-slate-800/30"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-400">
                              {po.poNumber}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-mono border",
                                poStyle.badge
                              )}
                            >
                              {poStyle.label}
                            </span>
                          </div>
                          <div className="font-semibold text-white mt-1">
                            {po.supplier.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {po.material.name} • Rcvd:{" "}
                            {po.receivedQuantity.toLocaleString()} /{" "}
                            {po.orderedQuantity.toLocaleString()}{" "}
                            {po.material.unit}
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="font-bold text-white">
                            {formatCurrency(po.totalAmount, currency)}
                          </div>
                          <div className="text-[10px] text-emerald-400">
                            Paid: {formatCurrency(po.paidAmount, currency)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Update Project Status & Progress */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Update Project Status & Progress
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
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
                  const res = await updateProjectStatusAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Updated project status & recorded audit trail.",
                    });
                    setShowStatusModal(false);
                  }
                });
              }}
              className="space-y-4"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Project Status
                </label>
                <select
                  name="status"
                  defaultValue={project.status}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed (100%)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Overall Progress (%)
                </label>
                <input
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={project.progress}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Individual Phase Progress & Actual Cost */}
      {editingPhase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Update Phase 0{editingPhase.sequenceOrder}: {editingPhase.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Recalculates overall project progress & actual cost automatically
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhase(null)}
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
                  const res = await updateProjectPhaseProgressAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: `Updated '${editingPhase.name}' progress and recalculated project rollup.`,
                    });
                    setEditingPhase(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input type="hidden" name="phaseId" value={editingPhase.id} />
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Phase Status
                </label>
                <select
                  name="status"
                  defaultValue={editingPhase.status}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed (100%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Actual Completion Progress (%)
                </label>
                <input
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={editingPhase.progress}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Actual Cost Expended on Phase ({currency})
                </label>
                <input
                  name="actualCost"
                  type="number"
                  min={0}
                  defaultValue={editingPhase.actualCost}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Phase Budget: {formatCurrency(editingPhase.budget, currency)}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPhase(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Save & Recalculate Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Project Phase */}
      {showAddPhaseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Add Sequential Construction Phase
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPhaseModal(false)}
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
                  const res = await createProjectPhaseAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Added new construction phase to project.",
                    });
                    setShowAddPhaseModal(false);
                  }
                });
              }}
              className="space-y-3.5"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Phase Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Solar Microgrid & Backup Power Installation"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Phase Budget ({currency}) *
                </label>
                <input
                  name="budget"
                  type="number"
                  required
                  defaultValue={15000000}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    defaultValue="2027-01-10"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    defaultValue="2027-03-30"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Phase Lead
                </label>
                <select
                  name="leadUserId"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Select Lead --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Scope Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhaseModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Add Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Construction Site */}
      {showAddSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Register Construction Site
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSiteModal(false)}
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
                  const res = await createSiteAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Registered new construction site.",
                    });
                    setShowAddSiteModal(false);
                  }
                });
              }}
              className="space-y-3.5"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">
                    Site Name *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Off-Site Precast Yard"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Site Code
                  </label>
                  <input
                    name="code"
                    placeholder="SITE-03"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Physical Location *
                </label>
                <input
                  name="location"
                  required
                  placeholder="e.g. Gate C Service Road"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Resident Site Manager
                </label>
                <select
                  name="siteManagerId"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Select Site Manager --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Operational Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Save Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Project Team Member */}
      {showAssignTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Assign Personnel to {project.code}
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignTeamModal(false)}
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
                  const res = await assignProjectMemberAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Updated project team assignment.",
                    });
                    setShowAssignTeamModal(false);
                  }
                });
              }}
              className="space-y-3.5"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Select Organization Member *
                </label>
                <select
                  name="userId"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.jobTitle || u.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Project Responsibility / Designation *
                </label>
                <input
                  name="projectRole"
                  required
                  placeholder="e.g. MEP Coordination Engineer"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Time Allocation (%)
                </label>
                <input
                  name="allocationPct"
                  type="number"
                  min={5}
                  max={100}
                  defaultValue={100}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignTeamModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Assign to Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register Project Document */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Register Project Document
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
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
                  const res = await createProjectDocumentAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Document registered in project vault.",
                    });
                    setShowAddDocModal(false);
                  }
                });
              }}
              className="space-y-3.5"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. MEP Fire Suppression Layout Drawings"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue="ARCHITECTURAL_DRAWING"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="CONTRACT">Contract Agreement</option>
                    <option value="ARCHITECTURAL_DRAWING">Architectural Drawing</option>
                    <option value="STRUCTURAL_DRAWING">Structural Drawing</option>
                    <option value="BOQ">Bill of Quantities (BOQ)</option>
                    <option value="PERMIT_APPROVAL">Permit / NCA / NEMA</option>
                    <option value="CERTIFICATE">Valuation / Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Revision / Version
                  </label>
                  <input
                    name="version"
                    defaultValue="Rev A"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  File Name *
                </label>
                <input
                  name="fileName"
                  required
                  placeholder="MEP_Fire_Layout_RevA.pdf"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
