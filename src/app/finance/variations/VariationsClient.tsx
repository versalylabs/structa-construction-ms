"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  GitCompareArrows,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  CalendarClock,
  FileText,
  Building2,
  TrendingUp,
  X,
  ArrowUpRight,
} from "lucide-react";
import {
  formatKES,
  formatCompactKES,
  formatDate,
  VARIATION_REASON_STYLES,
  VARIATION_STATUS_STYLES,
} from "@/lib/utils";
import {
  createProjectVariationAction,
  updateVariationStatusAction,
} from "@/app/actions/finance";

interface VariationItem {
  id: string;
  variationNumber: string;
  title: string;
  description: string;
  reason: string;
  originalContractAmount: number;
  variationAmount: number;
  revisedContractAmount: number;
  costImpactBudget: number;
  timeExtensionDays: number;
  status: string;
  supportingDocRef: string | null;
  requestedDate: string;
  approvedAt: string | null;
  project: {
    id: string;
    code: string;
    name: string;
    contractValue: number;
    budget: number;
  };
  phase: { id: string; code: string; name: string } | null;
  requestedBy: { id: string; fullName: string; role: string } | null;
  approvedBy: { id: string; fullName: string; role: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  contractValue: number;
  budget: number;
  phases: { id: string; code: string; name: string }[];
}

export function VariationsClient({
  variations,
  projects,
}: {
  variations: VariationItem[];
  projects: ProjectOption[];
  userRole: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewModal, setShowNewModal] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id || ""
  );
  const [variationAmountInput, setVariationAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProjectObj = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const filteredVariations = useMemo(() => {
    return variations.filter((v) => {
      if (projectFilter !== "ALL" && v.project.id !== projectFilter)
        return false;
      if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          v.variationNumber.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.project.name.toLowerCase().includes(q) ||
          (v.supportingDocRef || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [variations, projectFilter, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const approved = variations.filter((v) => v.status === "APPROVED");
    const pending = variations.filter(
      (v) => v.status === "PENDING_APPROVAL" || v.status === "UNDER_REVIEW"
    );
    const netApprovedVariationSum = approved.reduce(
      (s, v) => s + v.variationAmount,
      0
    );
    const pendingVariationSum = pending.reduce(
      (s, v) => s + v.variationAmount,
      0
    );
    const totalEotDays = approved.reduce((s, v) => s + v.timeExtensionDays, 0);

    return {
      approvedCount: approved.length,
      netApprovedVariationSum,
      pendingCount: pending.length,
      pendingVariationSum,
      totalEotDays,
    };
  }, [variations]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <GitCompareArrows className="w-3.5 h-3.5" />
              Phase 9 • Variation Orders (VOs), Architect Instructions & EOT
            </span>
            <span className="text-xs text-slate-400">
              Auto-Adjusts Project Contract Sum & Baseline Budget
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Project Variations & Change Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Control scope changes, unforeseen geotechnical conditions,
            architectural redesigns, and value-engineering savings with full
            auditability of Contract Sum adjustments and Extensions of Time
            (EOT).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/projects/budget"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Budget Control
          </Link>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Variation Order (VO)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Approved Variation Sum
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            +{formatCompactKES(metrics.netApprovedVariationSum)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Incorporated across {metrics.approvedCount} signed VOs
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              VOs Under Review / Pending
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {metrics.pendingCount} Change Orders
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Net pending impact:{" "}
            {metrics.pendingVariationSum >= 0 ? "+" : ""}
            {formatKES(metrics.pendingVariationSum)}
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Approved EOT Schedule Impact
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            +{metrics.totalEotDays} Calendar Days
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Certified Extension of Time across portfolio
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Logged VOs
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <GitCompareArrows className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {variations.length} Variations
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Includes Additions & Value Engineering Savings
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: `All VOs (${variations.length})` },
            { id: "APPROVED", label: "Approved & Incorporated" },
            { id: "UNDER_REVIEW", label: "Under QS Review" },
            { id: "PENDING_APPROVAL", label: "Awaiting Client Sign-Off" },
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
              placeholder="Search VO #, Architect Instruction, project..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500"
            />
          </div>

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

      {/* Variations Cards */}
      <div className="space-y-4">
        {filteredVariations.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No variation orders match your selected filters.
          </div>
        ) : (
          filteredVariations.map((vo) => {
            const reasonStyle = VARIATION_REASON_STYLES[vo.reason] || {
              label: vo.reason,
              badge: "bg-slate-800 text-slate-300 border-slate-700",
            };
            const statusStyle = VARIATION_STATUS_STYLES[vo.status] || {
              label: vo.status,
              badge: "bg-slate-800 text-slate-300 border-slate-700",
            };
            const isSaving = vo.variationAmount < 0;

            return (
              <div
                key={vo.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-brand-400">
                        {vo.variationNumber}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${reasonStyle.badge}`}
                      >
                        {reasonStyle.label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.badge}`}
                      >
                        {statusStyle.label}
                      </span>
                      {vo.timeExtensionDays > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <CalendarClock className="w-3 h-3" />+
                          {vo.timeExtensionDays} Days EOT
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {vo.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <Link
                        href={`/projects/${vo.project.id}`}
                        className="inline-flex items-center gap-1.5 text-brand-400 hover:underline font-medium"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {vo.project.code} — {vo.project.name}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      {vo.phase && (
                        <span className="text-slate-400">
                          Phase: {vo.phase.name}
                        </span>
                      )}
                      <span className="text-slate-400">
                        Requested: {formatDate(vo.requestedDate)}
                      </span>
                      {vo.supportingDocRef && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          <FileText className="w-3 h-3 text-brand-400" />
                          {vo.supportingDocRef}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300/90 leading-relaxed max-w-3xl">
                      {vo.description}
                    </p>

                    <div className="text-[11px] text-slate-400 pt-1">
                      Prepared by:{" "}
                      <strong className="text-slate-200">
                        {vo.requestedBy?.fullName || "Project QS"}
                      </strong>
                      {vo.approvedBy && (
                        <>
                          {" "}
                          • Approved & Signed Off by:{" "}
                          <strong className="text-emerald-400">
                            {vo.approvedBy.fullName}
                          </strong>{" "}
                          ({vo.approvedAt ? formatDate(vo.approvedAt) : ""})
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contract Impact Box */}
                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 min-w-[300px] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Prior Contract Sum:</span>
                      <span className="text-slate-200 font-medium">
                        {formatKES(vo.originalContractAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Variation Delta:</span>
                      <span
                        className={`font-bold ${
                          isSaving ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {vo.variationAmount >= 0 ? "+" : ""}
                        {formatKES(vo.variationAmount)}
                      </span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-sm font-bold text-white">
                      <span>Revised Contract Sum:</span>
                      <span>{formatKES(vo.revisedContractAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Direct Cost Budget Impact:</span>
                      <span className="text-slate-300">
                        {vo.costImpactBudget >= 0 ? "+" : ""}
                        {formatKES(vo.costImpactBudget)}
                      </span>
                    </div>

                    {vo.status !== "APPROVED" && vo.status !== "REJECTED" && (
                      <form
                        action={updateVariationStatusAction}
                        className="pt-2 flex items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="variationId"
                          value={vo.id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value="APPROVED"
                        />
                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve & Update Contract Sum
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Log New Variation Order */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Log Project Variation Order (VO)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current Contract Sum for{" "}
                  <strong className="text-white">
                    {selectedProjectObj?.name}
                  </strong>
                  :{" "}
                  <strong className="text-brand-400">
                    {formatKES(selectedProjectObj?.contractValue || 0)}
                  </strong>
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
                  await createProjectVariationAction(formData);
                  setShowNewModal(false);
                  setVariationAmountInput("");
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
                    Variation Reason / Classification *
                  </label>
                  <select
                    name="reason"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {Object.entries(VARIATION_REASON_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Variation Order Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Acoustic Double-Glazing Upgrade on Waiyaki Way Facade"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Technical Justification & QS Measurement Breakdown *
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Detail the Architect Instruction (AI), BOQ rate build-up, and structural/MEP scope impact..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contract Variation Sum (KES) *
                  </label>
                  <input
                    type="number"
                    name="variationAmount"
                    required
                    value={variationAmountInput}
                    onChange={(e) => setVariationAmountInput(e.target.value)}
                    placeholder="Use negative for saving"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Internal Cost Budget Impact (KES)
                  </label>
                  <input
                    type="number"
                    name="costImpactBudget"
                    defaultValue={variationAmountInput}
                    placeholder="Direct construction cost"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Time Extension (EOT Days)
                  </label>
                  <input
                    type="number"
                    name="timeExtensionDays"
                    defaultValue={0}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Architect Instruction / Supporting Doc Ref
                  </label>
                  <input
                    type="text"
                    name="supportingDocRef"
                    placeholder="e.g., Arch-Instruction-AI-019.pdf"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="PENDING_APPROVAL">
                      Awaiting Client Sign-Off
                    </option>
                    <option value="UNDER_REVIEW">Under QS Valuation</option>
                    <option value="APPROVED">
                      Approved Immediately (Updates Contract Sum)
                    </option>
                  </select>
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
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm cursor-pointer"
                >
                  {isSubmitting ? "Saving VO..." : "Submit Variation Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
