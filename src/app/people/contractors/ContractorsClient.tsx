"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Plus,
  Building2,
  ShieldCheck,
  Star,
  DollarSign,
  CheckCircle2,
  X,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Layers,
  Award,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  SUBCONTRACTOR_SPECIALIZATION_STYLES,
  SUBCONTRACTOR_STATUS_STYLES,
} from "@/lib/utils";
import {
  createSubcontractorAction,
  updateSubcontractorValuationAction,
} from "@/app/actions/workforce-equipment";

interface SubcontractorItem {
  id: string;
  code: string;
  companyName: string;
  specialization: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  ncaCategory: string | null;
  taxPin: string | null;
  scopeOfWorks: string;
  contractValue: number;
  certifiedAmount: number;
  paidAmount: number;
  retentionPct: number;
  outstandingBalance: number;
  startDate: string | null;
  endDate: string | null;
  paymentTerms: string;
  performanceRating: number;
  progressPct: number;
  status: string;
  notes: string | null;
  projectId: string | null;
  phaseId: string | null;
  project: { id: string; code: string; name: string } | null;
  phase: { id: string; name: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  phases: { id: string; name: string }[];
}

interface ContractorsClientProps {
  subcontractors: SubcontractorItem[];
  projects: ProjectOption[];
  userRole: string;
}

export function ContractorsClient({
  subcontractors,
  projects,
}: ContractorsClientProps) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [specFilter, setSpecFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedAwardProjectId, setSelectedAwardProjectId] = useState(
    projects[0]?.id || ""
  );
  const [selectedSubcontractorForValuation, setSelectedSubcontractorForValuation] =
    useState<SubcontractorItem | null>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredSubcontractors = useMemo(() => {
    return subcontractors.filter((sc) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        sc.companyName.toLowerCase().includes(q) ||
        sc.code.toLowerCase().includes(q) ||
        sc.scopeOfWorks.toLowerCase().includes(q) ||
        sc.contactPerson.toLowerCase().includes(q) ||
        (sc.ncaCategory && sc.ncaCategory.toLowerCase().includes(q));

      const matchesProject =
        projectFilter === "ALL" || sc.projectId === projectFilter;
      const matchesSpec =
        specFilter === "ALL" || sc.specialization === specFilter;
      const matchesStatus =
        statusFilter === "ALL" || sc.status === statusFilter;

      return matchesSearch && matchesProject && matchesSpec && matchesStatus;
    });
  }, [subcontractors, search, projectFilter, specFilter, statusFilter]);

  const kpis = useMemo(() => {
    const activeCount = subcontractors.filter((s) => s.status === "ACTIVE").length;
    const totalContractValue = subcontractors.reduce(
      (sum, s) => sum + s.contractValue,
      0
    );
    const totalCertified = subcontractors.reduce(
      (sum, s) => sum + s.certifiedAmount,
      0
    );
    const totalPaid = subcontractors.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalRetentionHeld = subcontractors.reduce(
      (sum, s) => sum + s.certifiedAmount * (s.retentionPct / 100),
      0
    );
    const netCertifiedPayable = subcontractors.reduce(
      (sum, s) => sum + s.outstandingBalance,
      0
    );

    return {
      totalPackages: subcontractors.length,
      activeCount,
      totalContractValue,
      totalCertified,
      totalPaid,
      totalRetentionHeld,
      netCertifiedPayable,
    };
  }, [subcontractors]);

  const selectedAwardProject = useMemo(
    () => projects.find((p) => p.id === selectedAwardProjectId),
    [projects, selectedAwardProjectId]
  );

  function handleAwardSubcontract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await createSubcontractorAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Subcontractor package awarded and linked to project command center.",
        });
        setShowAwardModal(false);
      }
    });
  }

  function handleUpdateValuation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await updateSubcontractorValuationAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Interim valuation, retention calculation, and payment ledger updated.",
        });
        setSelectedSubcontractorForValuation(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Phase 7 • Specialist Subcontracts & Valuations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Subcontractor Packages, Interim Certificates & Retention Control
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Manage MEP, lifts, piling, facade, and roofing subcontractors with NCA registration verification, QS interim valuations, 10% retention tracking, and net certified payables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/people/workforce"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Site Workforce →
          </Link>
          <button
            onClick={() => setShowAwardModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Award Subcontract Package
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Subcontract Packages</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {kpis.totalPackages}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">
              {kpis.activeCount} active
            </span>{" "}
            specialist contracts
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Subcontract Value</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(kpis.totalContractValue)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Awarded specialist works
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>QS Certified Value</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(kpis.totalCertified)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {kpis.totalContractValue > 0
              ? ((kpis.totalCertified / kpis.totalContractValue) * 100).toFixed(
                  1
                )
              : 0}
            % of contract sums certified
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Disbursed + Retention</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(kpis.totalPaid)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Retention held: {formatCurrency(kpis.totalRetentionHeld)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Net Certified Payable</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {formatCurrency(kpis.netCertifiedPayable)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Net of retention & payments
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contractor, NCA, scope..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-64"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Specializations</option>
            {Object.entries(SUBCONTRACTOR_SPECIALIZATION_STYLES).map(
              ([k, val]) => (
                <option key={k} value={k}>
                  {val.label}
                </option>
              )
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(SUBCONTRACTOR_STATUS_STYLES).map(([k, val]) => (
              <option key={k} value={k}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing{" "}
          <span className="font-bold text-slate-800">
            {filteredSubcontractors.length}
          </span>{" "}
          of {subcontractors.length} specialist packages
        </div>
      </div>

      {/* Subcontractor Cards / Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredSubcontractors.map((sc) => {
          const specStyle =
            SUBCONTRACTOR_SPECIALIZATION_STYLES[sc.specialization] || {
              label: sc.specialization,
              bg: "bg-slate-100",
              text: "text-slate-700",
            };
          const statusStyle = SUBCONTRACTOR_STATUS_STYLES[sc.status] || {
            label: sc.status,
            bg: "bg-slate-100",
            text: "text-slate-700",
            dot: "bg-slate-400",
          };
          const retentionHeld = sc.certifiedAmount * (sc.retentionPct / 100);

          return (
            <div
              key={sc.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div>
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sc.code}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${specStyle.bg} ${specStyle.text}`}
                      >
                        {specStyle.label}
                      </span>
                      {sc.ncaCategory && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          {sc.ncaCategory}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {sc.companyName}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                    />
                    {statusStyle.label}
                  </span>
                </div>

                {/* Scope & Project Link */}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {sc.scopeOfWorks}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  {sc.project ? (
                    <Link
                      href={`/projects/${sc.project.id}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-amber-600"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {sc.project.code} — {sc.project.name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-slate-400">Multi-project vendor</span>
                  )}
                  {sc.phase && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {sc.phase.name}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">
                      Physical Works Progress
                    </span>
                    <span className="font-bold text-slate-900">
                      {sc.progressPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sc.progressPct >= 90
                          ? "bg-emerald-500"
                          : sc.progressPct >= 50
                          ? "bg-blue-600"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, sc.progressPct)}%` }}
                    />
                  </div>
                </div>

                {/* Financial Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Contract Sum
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {formatCurrency(sc.contractValue)}
                    </div>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      QS Certified
                    </div>
                    <div className="text-xs font-bold text-blue-700 mt-0.5">
                      {formatCurrency(sc.certifiedAmount)}
                    </div>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Paid + Ret ({sc.retentionPct}%)
                    </div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(sc.paidAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ret: {formatCurrency(retentionHeld)}
                    </div>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Net Payable
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        sc.outstandingBalance > 0
                          ? "text-rose-600"
                          : "text-slate-600"
                      }`}
                    >
                      {formatCurrency(sc.outstandingBalance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Contact & Valuation Button */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-500">
                  <span className="font-medium text-slate-700">
                    {sc.contactPerson}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {sc.phone}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {sc.performanceRating.toFixed(1)}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedSubcontractorForValuation(sc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Update Valuation / IPC
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Award Subcontract Package */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  Award Specialist Subcontract Package
                </h3>
              </div>
              <button
                onClick={() => setShowAwardModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAwardSubcontract}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subcontractor Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="e.g. RiftValley Fire & HVAC Systems Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trade Specialization *
                  </label>
                  <select
                    name="specialization"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {Object.entries(SUBCONTRACTOR_SPECIALIZATION_STYLES).map(
                      ([k, val]) => (
                        <option key={k} value={k}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Director / Engineer *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    placeholder="e.g. Eng.David Kiptoo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="+254 722 000 000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NCA Registration Category
                  </label>
                  <input
                    type="text"
                    name="ncaCategory"
                    placeholder="e.g. NCA 2 Mechanical"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Project
                  </label>
                  <select
                    name="projectId"
                    value={selectedAwardProjectId}
                    onChange={(e) => setSelectedAwardProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Multi-Project / General --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Any Phase --</option>
                    {selectedAwardProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Scope of Subcontract Works *
                </label>
                <textarea
                  name="scopeOfWorks"
                  rows={2}
                  required
                  placeholder="Describe technical deliverables, testing & commissioning requirements..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract Sum (KES) *
                  </label>
                  <input
                    type="number"
                    name="contractValue"
                    required
                    min={1}
                    defaultValue={12500000}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Retention Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="retentionPct"
                    step="0.5"
                    defaultValue={10}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    name="paymentTerms"
                    defaultValue="30 Days post-IPC Valuation"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Commencement Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAwardModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Award Subcontract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Update Valuation / IPC Certificate */}
      {selectedSubcontractorForValuation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-400 font-mono font-bold">
                  {selectedSubcontractorForValuation.code} •{" "}
                  {selectedSubcontractorForValuation.ncaCategory || "Subcontract"}
                </div>
                <h3 className="font-bold text-base">
                  {selectedSubcontractorForValuation.companyName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubcontractorForValuation(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateValuation}
              className="p-6 space-y-4 text-xs"
            >
              <input
                type="hidden"
                name="subcontractorId"
                value={selectedSubcontractorForValuation.id}
              />

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-400">Contract Sum</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {formatCurrency(
                      selectedSubcontractorForValuation.contractValue
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Retention Rate</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedSubcontractorForValuation.retentionPct}% Held on
                    IPC
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cumulative QS Certified Value (KES) *
                  </label>
                  <input
                    type="number"
                    name="certifiedAmount"
                    required
                    defaultValue={
                      selectedSubcontractorForValuation.certifiedAmount
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cumulative Amount Paid (KES) *
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    required
                    defaultValue={selectedSubcontractorForValuation.paidAmount}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Physical Progress (%)
                  </label>
                  <input
                    type="number"
                    name="progressPct"
                    min={0}
                    max={100}
                    defaultValue={selectedSubcontractorForValuation.progressPct}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quality Rating (1–5)
                  </label>
                  <input
                    type="number"
                    name="performanceRating"
                    step="0.1"
                    min={1}
                    max={5}
                    defaultValue={
                      selectedSubcontractorForValuation.performanceRating
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Package Status
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedSubcontractorForValuation.status}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {Object.entries(SUBCONTRACTOR_STATUS_STYLES).map(
                      ([k, val]) => (
                        <option key={k} value={k}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubcontractorForValuation(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Save IPC Valuation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
