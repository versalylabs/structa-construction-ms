import React from "react";
import Link from "next/link";
import {
  HardHat,
  Layers,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { STRUCTA_NAVIGATION } from "@/lib/navigation";
import { ROLES } from "@/lib/rbac";

const MODULE_PHASE_DETAILS: Record<
  string,
  {
    title: string;
    phase: string;
    description: string;
    deliverables: string[];
  }
> = {
  projects: {
    title: "Projects, Clients & Project Command Center",
    phase: "Phase 2 — Projects & Project Structure",
    description:
      "Centralized project portfolio management, client records, sequential construction phases (Site Prep → Foundation → Structural → Roofing → MEP → Finishing), and dedicated project command centers.",
    deliverables: [
      "Project Portfolio Directory (Planning, Active, On Hold, Delayed, Completed)",
      "Client Profiles & Contract Value Tracking",
      "Sequential Construction Phases with Budgets & Progress",
      "Project Command Center & Team Assignments",
    ],
  },
  operations: {
    title: "Site Operations, Tasks, Progress & Quality",
    phase: "Phase 3 & Phase 8 — Tasks, Planning & Site Operations",
    description:
      "End-to-end field execution tracking including task schedules, dependencies, daily site reports, site photos, issue/risk registers, and quality/safety inspections.",
    deliverables: [
      "Task Scheduling, Priorities & Dependency Relationships",
      "Daily & Weekly Site Reports with Weather & Workforce Logs",
      "Site Photo Documentation & Defect Tracking",
      "Project Issues, Risk Register & Quality/Safety Inspections",
    ],
  },
  materials: {
    title: "Construction Materials, Requisitions & Site Stock",
    phase: "Phase 5 — Materials & Suppliers",
    description:
      "Per-project and per-site material tracking (Cement, Steel, Sand, Ballast, Timber, Tiles, MEP) from requisition through site inventory, usage, and wastage control.",
    deliverables: [
      "Construction Material Catalog & Unit Standards",
      "Site Material Requests (Draft → Submitted → Approved → Ordered)",
      "Live Site Stock (Requested, Ordered, Received, Used, Remaining, Wastage)",
    ],
  },
  procurement: {
    title: "Suppliers, Purchase Orders & Site Receiving",
    phase: "Phase 6 — Procurement",
    description:
      "Full construction procurement workflow connecting site material requests to supplier quotations, official Purchase Orders (POs), delivery notes, and site receiving verification.",
    deliverables: [
      "Supplier Directory, Payment Terms & Payables Balance",
      "Official Purchase Order (PO) Generation & Approval",
      "Site Material Receiving (Ordered vs Received, Damaged, Delivery Notes)",
    ],
  },
  people: {
    title: "Workforce, Attendance & Subcontractors",
    phase: "Phase 7 — Workforce & Contractors",
    description:
      "Track casual labour, skilled artisans, foremen, daily attendance, labour costs, and specialized electrical, plumbing, roofing, and masonry subcontractors.",
    deliverables: [
      "Worker Registry & Daily Site Attendance Logs",
      "Automated Daily/Weekly Labour Cost Rollups",
      "Subcontractor Contracts, Valuations & Balances",
    ],
  },
  equipment: {
    title: "Construction Equipment Fleet & Maintenance",
    phase: "Phase 7 — Equipment Management",
    description:
      "Track owned and hired machinery (excavators, concrete mixers, cranes, generators, scaffolding), site allocation, operator assignment, and maintenance logs.",
    deliverables: [
      "Equipment Fleet Registry (Owned vs Hired)",
      "Project & Site Equipment Allocation",
      "Equipment Usage Cost & Preventive Maintenance Logs",
    ],
  },
  finance: {
    title: "BOQ, Budgets, Expenses, Invoicing & Payments",
    phase: "Phase 4 & Phase 9 — BOQ, Budgets & Project Financials",
    description:
      "Transaction-safe construction cost control: Bills of Quantities (BOQ), category budgets (Budget → Committed → Actual → Remaining), expenses, client invoices, variations, and M-Pesa/Bank payments.",
    deliverables: [
      "Bills of Quantities (BOQ) Schedule & Rate Calculations",
      "Category Budget Control & Overrun Alerts",
      "Transaction-Safe Project Expenses, Client Invoices & M-Pesa/Bank Payments",
      "Project Variations (Change Orders) & Gross Profit Margin Summary",
    ],
  },
  documents: {
    title: "Centralized Construction Document Vault",
    phase: "Phase 2 & Phase 8 — Project Documents",
    description:
      "Centralized repository for architectural drawings, structural plans, contracts, BOQs, quotations, POs, delivery notes, permits, and certificates.",
    deliverables: [
      "Project-Linked Drawings, Contracts & Permits",
      "Purchase Order, Delivery Note & Valuation Attachments",
      "Role-Scoped Document Access Control",
    ],
  },
  reports: {
    title: "Executive Construction Analytics & Reporting",
    phase: "Phase 11 — Reports & Analytics",
    description:
      "Decision-focused reporting across project progress, budget vs actual variance, supplier spending, material wastage, labour allocation, and company profitability.",
    deliverables: [
      "Project Progress & Profitability Reports",
      "Budget vs Committed vs Actual Cost Analytics",
      "Procurement, Material Usage & Labour Expenditure Exports",
    ],
  },
};

export default async function UpcomingModuleHubPage({
  params,
}: {
  params: Promise<{ module: string[] }>;
}) {
  const ctx = await getSessionContext();
  const resolvedParams = await params;
  const slugParts = resolvedParams.module || [];
  const topSegment = slugParts[0] || "projects";

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const info =
    MODULE_PHASE_DETAILS[topSegment] || MODULE_PHASE_DETAILS.projects;
  const navGroup = STRUCTA_NAVIGATION.find((g) => g.id === topSegment);
  const roleMeta = ROLES[ctx.user.role];

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/15 border border-brand-500/30 px-2.5 py-1 text-xs font-mono font-semibold text-brand-400">
              <Layers className="h-3.5 w-3.5" />
              {info.phase}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-mono text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              RBAC Verified for {roleMeta.shortLabel}
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">{info.title}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {info.description}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              <span>Scheduled Module Deliverables (Scoped to {ctx.organization.name})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {info.deliverables.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs text-slate-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {navGroup?.items && (
            <div className="pt-2">
              <div className="text-xs font-mono uppercase text-slate-400 mb-2">
                Navigation Endpoints Configured in App Shell:
              </div>
              <div className="flex flex-wrap gap-2">
                {navGroup.items.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className="rounded-lg border border-slate-800 bg-slate-950 hover:border-brand-500/40 px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Executive Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <HardHat className="h-4 w-4 text-brand-400" />
              <span>Phase 1 Foundation Active — Ready for Phase 2</span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
