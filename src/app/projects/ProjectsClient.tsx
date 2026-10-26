"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  ArrowUpRight,
  Users,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Briefcase,
  Phone,
  Mail,
} from "lucide-react";
import {
  createClientAction,
  createProjectAction,
} from "@/app/actions/projects";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface ProjectItem {
  id: string;
  code: string;
  name: string;
  projectType: string;
  location: string;
  county: string;
  description: string | null;
  startDate: string;
  expectedCompletionDate: string;
  contractValue: number;
  budget: number;
  committedCost: number;
  actualCost: number;
  invoicedAmount: number;
  paidAmount: number;
  status: string;
  plannedProgress: number;
  progress: number;
  client: { id: string; name: string; code: string } | null;
  projectManager: { id: string; name: string; role: string } | null;
  siteManager: { id: string; name: string; role: string } | null;
  quantitySurveyor: { id: string; name: string; role: string } | null;
  _count: {
    phases: number;
    sites: number;
    teamMembers: number;
    documents: number;
  };
}

interface ClientItem {
  id: string;
  code: string;
  name: string;
  clientType: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  taxPin: string | null;
  notes: string | null;
  status: string;
  projects: {
    id: string;
    code: string;
    name: string;
    contractValue: number;
    paidAmount: number;
    status: string;
  }[];
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
}

interface ProjectsClientProps {
  projects: ProjectItem[];
  clients: ClientItem[];
  users: UserOption[];
  currency: string;
  projectPrefix: string;
  canManageProjects: boolean;
  initialStatusFilter: string;
  initialTab: "projects" | "clients";
  initialSearch: string;
}

export const PROJECT_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PLANNING: {
    label: "Planning",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  ACTIVE: {
    label: "Active",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  DELAYED: {
    label: "Delayed",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  ON_HOLD: {
    label: "On Hold",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export function ProjectsClient({
  projects,
  clients,
  users,
  currency,
  projectPrefix,
  canManageProjects,
  initialStatusFilter,
  initialTab,
  initialSearch,
}: ProjectsClientProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "clients">(
    initialTab
  );
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState(initialSearch);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    const matchesType =
      typeFilter === "ALL" || p.projectType === typeFilter;
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.name || "").toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Portfolio KPIs
  const totalContractValue = projects.reduce(
    (s, p) => s + p.contractValue,
    0
  );
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalActualCost = projects.reduce((s, p) => s + p.actualCost, 0);
  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const delayedCount = projects.filter((p) => p.status === "DELAYED").length;
  const completedCount = projects.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createProjectAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            "Created new construction project, initialized main site & 7 phases, and logged audit event.",
        });
        setShowProjectModal(false);
      }
    });
  };

  const handleCreateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createClientAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Registered client ${res.client?.name} (${res.client?.code}).`,
        });
        setShowClientModal(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Construction Projects, Phases & Clients Portfolio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized command over active construction projects, client contracts, sequential project phases, and site teams.
          </p>
        </div>

        {canManageProjects && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setShowClientModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Briefcase className="h-4 w-4 text-brand-400" />
              <span>New Client</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setShowProjectModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Construction Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Portfolio KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Portfolio Status Breakdown</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {projects.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              {activeCount} Active • {completedCount} Completed
            </span>
          </div>
          {delayedCount > 0 && (
            <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" />
              <span>{delayedCount} project(s) flagged Delayed</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Total Contract Value</div>
          <div className="text-xl font-bold text-white font-mono mt-2">
            {formatCurrency(totalContractValue, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {clients.length} active client accounts
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Total Project Budgets</div>
          <div className="text-xl font-bold text-white font-mono mt-2">
            {formatCurrency(totalBudget, currency)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Projected Gross Margin:{" "}
            {formatCurrency(totalContractValue - totalBudget, currency)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-xs text-slate-400">Cumulative Actual Cost</div>
          <div className="text-xl font-bold text-brand-400 font-mono mt-2">
            {formatCurrency(totalActualCost, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Remaining Budget:{" "}
            {formatCurrency(totalBudget - totalActualCost, currency)}
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

      {/* Tabs + Search & Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={cn(
              "rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              activeTab === "projects"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            Construction Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={cn(
              "rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              activeTab === "clients"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            Clients Directory ({clients.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "projects"
                  ? "Search project code, name, location, or client..."
                  : "Search client name, code, or contact person..."
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {activeTab === "projects" && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PLANNING">Planning</option>
                <option value="DELAYED">Delayed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Project Types</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="CIVIL_INFRASTRUCTURE">Civil Infrastructure</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Projects Portfolio Table & Command Cards */}
      {activeTab === "projects" ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-4">Code & Project</th>
                  <th className="py-3.5 px-4">Client & Location</th>
                  <th className="py-3.5 px-4">Progress & Structure</th>
                  <th className="py-3.5 px-4">Contract & Budget</th>
                  <th className="py-3.5 px-4">Project Leadership</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Command Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProjects.map((p) => {
                  const st =
                    PROJECT_STATUS_STYLES[p.status] ||
                    PROJECT_STATUS_STYLES.PLANNING;
                  const budgetUtilPct =
                    p.budget > 0
                      ? Math.round((p.actualCost / p.budget) * 100)
                      : 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-brand-400">
                            {p.code}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p.projectType}
                          </span>
                        </div>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-sm text-white hover:text-brand-300 block mt-1"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>
                            {formatDate(p.startDate)} →{" "}
                            {formatDate(p.expectedCompletionDate)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">
                          {p.client?.name || "Internal Development"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {p.location}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 min-w-[180px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-white">
                            {p.progress}% Complete
                          </span>
                          <span className="text-slate-400 font-mono">
                            Plan: {p.plannedProgress}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              p.status === "DELAYED"
                                ? "bg-amber-500"
                                : p.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : "bg-brand-500"
                            )}
                            style={{ width: `${Math.min(100, p.progress)}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-brand-400" />
                            {p._count.phases} Phases
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-slate-500" />
                            {p._count.documents} Docs
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <div className="text-slate-100 font-bold">
                          {formatCurrency(p.contractValue, currency)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Budget: {formatCurrency(p.budget, currency)}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          Spent: {formatCurrency(p.actualCost, currency)} (
                          {budgetUtilPct}%)
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-200">
                          <span className="text-slate-500">PM:</span>{" "}
                          {p.projectManager?.name || "Unassigned"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <span className="text-slate-500">Site:</span>{" "}
                          {p.siteManager?.name || "Unassigned"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <span className="text-slate-500">Team:</span>{" "}
                          {p._count.teamMembers} assigned
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono border",
                            st.badge
                          )}
                        >
                          {st.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-300 hover:text-slate-950 border border-brand-500/30 px-3 py-1.5 text-xs font-bold transition-colors"
                        >
                          <span>Command Center</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      No construction projects match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Clients Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const clientContractTotal = client.projects.reduce(
              (s, p) => s + p.contractValue,
              0
            );
            const clientPaidTotal = client.projects.reduce(
              (s, p) => s + p.paidAmount,
              0
            );
            const balance = clientContractTotal - clientPaidTotal;

            return (
              <div
                key={client.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-brand-400">
                      {client.code} • {client.clientType}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {client.projects.length} Project(s)
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1.5">
                    {client.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Primary Contact:{" "}
                    <strong className="text-slate-200">
                      {client.contactPerson}
                    </strong>{" "}
                    {client.taxPin && `• PIN: ${client.taxPin}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      {client.phone}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {client.email}
                    </span>
                  </div>

                  {client.projects.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] font-mono uppercase text-slate-500">
                        Linked Construction Projects:
                      </div>
                      {client.projects.map((prj) => (
                        <Link
                          key={prj.id}
                          href={`/projects/${prj.id}`}
                          className="flex items-center justify-between rounded-lg bg-slate-950/70 hover:bg-slate-950 px-3 py-1.5 text-xs border border-slate-800/80"
                        >
                          <span className="font-medium text-slate-200 truncate">
                            <strong className="font-mono text-brand-400">
                              {prj.code}
                            </strong>{" "}
                            — {prj.name}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500">
                      Contract Value
                    </div>
                    <div className="font-bold text-white">
                      {formatCurrency(clientContractTotal, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">
                      Payments Received
                    </div>
                    <div className="font-bold text-emerald-400">
                      {formatCurrency(clientPaidTotal, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">
                      Outstanding
                    </div>
                    <div className="font-bold text-amber-400">
                      {formatCurrency(balance, currency)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create New Construction Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Create New Construction Project
                </h2>
                <p className="text-xs text-slate-400">
                  Initialize project command center, site, team, and sequential phases
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Lavington Heights 12-Storey Residency"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Code (Auto if blank)
                  </label>
                  <input
                    name="code"
                    placeholder={`${projectPrefix}006`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client
                  </label>
                  <select
                    name="clientId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Type
                  </label>
                  <select
                    name="projectType"
                    defaultValue="RESIDENTIAL"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial & Warehouse</option>
                    <option value="CIVIL_INFRASTRUCTURE">Civil & Infrastructure</option>
                    <option value="MIXED_USE">Mixed-Use Development</option>
                    <option value="RENOVATION">Fit-Out & Renovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    defaultValue="ACTIVE"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Site Location / Plot LR Number *
                  </label>
                  <input
                    name="location"
                    required
                    placeholder="e.g. James Gichuru Road, Plot LR 330/412, Lavington"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    County / City
                  </label>
                  <input
                    name="county"
                    defaultValue="Nairobi"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contract Value ({currency}) *
                  </label>
                  <input
                    name="contractValue"
                    type="number"
                    required
                    defaultValue={250000000}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Baseline Project Budget ({currency}) *
                  </label>
                  <input
                    name="budget"
                    type="number"
                    required
                    defaultValue={210000000}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Commencement / Start Date *
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    defaultValue="2026-10-15"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Completion Date *
                  </label>
                  <input
                    name="expectedCompletionDate"
                    type="date"
                    required
                    defaultValue="2027-12-15"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Manager
                  </label>
                  <select
                    name="projectManagerId"
                    defaultValue={
                      users.find((u) => u.role === "PROJECT_MANAGER")?.id || ""
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Assign PM --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Site Manager
                  </label>
                  <select
                    name="siteManagerId"
                    defaultValue={
                      users.find((u) => u.role === "SITE_MANAGER")?.id || ""
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Assign Site Mgr --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quantity Surveyor
                  </label>
                  <select
                    name="quantitySurveyorId"
                    defaultValue={
                      users.find((u) => u.role === "QUANTITY_SURVEYOR")?.id || ""
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Assign QS --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Scope of Works & Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Brief summary of structural works, floors, basements, and key deliverables..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 flex items-center justify-between">
                <span className="text-xs text-brand-200">
                  Auto-generate standard 7 construction phases (Site Prep → Foundation → Structural → Roofing → MEP → Finishing → Completion)
                </span>
                <select
                  name="autoCreatePhases"
                  defaultValue="TRUE"
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  <option value="TRUE">Yes (Recommended)</option>
                  <option value="FALSE">No, I will add manually</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Initializing Project..." : "Create Project & Site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New Client */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Register Construction Client
                </h2>
                <p className="text-xs text-slate-400">
                  Add a property developer, corporate client, or project sponsor
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client / Organization Name *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Kilimani Heights Developers Ltd."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client Category
                  </label>
                  <select
                    name="clientType"
                    defaultValue="PRIVATE_DEVELOPER"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="PRIVATE_DEVELOPER">Private Developer</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="GOVERNMENT">Government / Public</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Primary Contact Person *
                  </label>
                  <input
                    name="contactPerson"
                    required
                    placeholder="e.g. Arch. James Kariuki"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    KRA Tax PIN
                  </label>
                  <input
                    name="taxPin"
                    placeholder="P051..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    name="phone"
                    required
                    placeholder="+254 722 000 000"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="client@developer.co.ke"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Office Address
                </label>
                <input
                  name="address"
                  placeholder="e.g. Mirage Towers, Westlands, Nairobi"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Saving..." : "Register Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
