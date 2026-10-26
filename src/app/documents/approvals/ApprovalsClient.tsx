"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FolderOpen,
  Users,
  Plus,
  Search,
  CheckCircle2,
  X,
  Clock,
  AlertTriangle,
  FileText,
  Stamp,
  ArrowUpRight,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  createApprovalWorkflowAction,
  decideApprovalWorkflowAction,
} from "@/app/actions/documents-approvals";
import {
  formatDate,
  formatKES,
  APPROVAL_TYPE_STYLES,
  APPROVAL_STATUS_STYLES,
  APPROVAL_PRIORITY_STYLES,
} from "@/lib/utils";

interface ApprovalItem {
  id: string;
  approvalCode: string;
  approvalType: string;
  title: string;
  description: string | null;
  submittedToRole: string;
  priority: string;
  financialImpactAmount: number;
  dueDate: string | null;
  status: string;
  decisionNotes: string | null;
  digitalSignatureRef: string | null;
  decidedAt: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  phase: { id: string; name: string; sequenceOrder: number } | null;
  document: {
    id: string;
    documentNumber: string;
    title: string;
    version: string;
    fileName: string;
  } | null;
  client: { id: string; name: string } | null;
  requestedBy: { id: string; name: string; role: string } | null;
  decidedBy: { id: string; name: string; role: string } | null;
}

export function ApprovalsClient({
  approvals,
  projects,
  documents,
  portalUpdatesCount,
  canApprove,
}: {
  approvals: ApprovalItem[];
  projects: {
    id: string;
    code: string;
    name: string;
    phases: { id: string; name: true | string; sequenceOrder: number }[];
  }[];
  documents: {
    id: string;
    documentNumber: string;
    title: string;
    version: string;
    projectId: string | null;
  }[];
  portalUpdatesCount: number;
  canApprove: boolean;
}) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(
    projects[0]?.id || ""
  );
  const [decisionTarget, setDecisionTarget] = useState<ApprovalItem | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = approvals.filter((a) => {
    const matchesProject =
      projectFilter === "ALL" || a.project.id === projectFilter;
    const matchesType = typeFilter === "ALL" || a.approvalType === typeFilter;
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      a.approvalCode.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.submittedToRole.toLowerCase().includes(search.toLowerCase()) ||
      (a.description &&
        a.description.toLowerCase().includes(search.toLowerCase()));
    return matchesProject && matchesType && matchesStatus && matchesSearch;
  });

  const pendingItems = approvals.filter((a) => a.status === "PENDING");
  const approvedItems = approvals.filter((a) => a.status === "APPROVED");
  const changesRequestedItems = approvals.filter(
    (a) => a.status === "CHANGES_REQUESTED"
  );
  const totalPendingExposure = pendingItems.reduce(
    (sum, item) => sum + Math.abs(item.financialImpactAmount),
    0
  );

  const activeModalProject = projects.find(
    (p) => p.id === selectedProjectForModal
  );
  const modalDocuments = documents.filter(
    (d) => !d.projectId || d.projectId === selectedProjectForModal
  );

  return (
    <div className="space-y-6">
      {/* Phase 10 Sub-Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
          >
            <FolderOpen className="h-3.5 w-3.5 text-brand-400" />
            <span>Document Vault & Revisions</span>
            <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.5 text-[10px] font-mono">
              {documents.length}
            </span>
          </Link>
          <Link
            href="/documents/approvals"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500/15 border border-brand-500/40 px-3.5 py-2 text-xs font-bold text-brand-300"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Approvals & Sign-Offs</span>
            <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-mono">
              {approvals.length}
            </span>
          </Link>
          <Link
            href="/documents/client-portal"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-sky-400" />
            <span>Executive Client Portal</span>
            <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.5 text-[10px] font-mono">
              {portalUpdatesCount}
            </span>
          </Link>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Digital Sign-Off Governance • AFC Stamps • IPC & VO Gates
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Multi-Stage Technical & Commercial Approval Desk
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structured sign-off workflows for shop drawings, variation orders, IPC valuations, material sample boards, and high-value LPO releases.
          </p>
        </div>

        {canApprove && (
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Approval Request</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pending Sign-Offs</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {pendingItems.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Awaiting consultant / director action
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Signed Off & Stamped
            </span>
            <Stamp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {approvedItems.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Digitally stamped with audit signature
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Amendments Requested
            </span>
            <AlertTriangle className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            {changesRequestedItems.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Returned to site/subcontractor for rework
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Pending Commercial Value
            </span>
            <ShieldCheck className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {formatKES(totalPendingExposure)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Gross value of pending approvals
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {feedback}
          </span>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approval code, submittal title, or reviewer role..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Approval Gates</option>
            {Object.entries(APPROVAL_TYPE_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(APPROVAL_STATUS_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Code & Priority</th>
                <th className="py-3.5 px-4">Submittal & Linked Dossier</th>
                <th className="py-3.5 px-4">Project & Phase</th>
                <th className="py-3.5 px-4">Approval Authority</th>
                <th className="py-3.5 px-4">Financial Impact</th>
                <th className="py-3.5 px-4">Decision & Signature</th>
                {canApprove && (
                  <th className="py-3.5 px-4 text-right">Sign-Off Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.map((item) => {
                const typeStyle = APPROVAL_TYPE_STYLES[item.approvalType] || {
                  label: item.approvalType,
                  badge: "bg-slate-800 text-slate-300 border-slate-700",
                };
                const statusStyle = APPROVAL_STATUS_STYLES[item.status] || {
                  label: item.status,
                  badge: "bg-slate-800 text-slate-300 border-slate-700",
                };
                const priorityStyle = APPROVAL_PRIORITY_STYLES[
                  item.priority
                ] || {
                  label: item.priority,
                  badge: "bg-slate-800 text-slate-300 border-slate-700",
                };

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-brand-400">
                        {item.approvalCode}
                      </div>
                      <span
                        className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityStyle.badge}`}
                      >
                        {priorityStyle.label}
                      </span>
                      {item.dueDate && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          SLA Due: {formatDate(item.dueDate)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-md">
                      <div className="mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${typeStyle.badge}`}
                        >
                          {typeStyle.label}
                        </span>
                      </div>
                      <div className="font-bold text-white">{item.title}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.description}
                        </div>
                      )}
                      {item.document && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded bg-slate-950/80 border border-slate-800 px-2 py-1 text-[10px] font-mono text-sky-300">
                          <FileText className="h-3 w-3 text-sky-400" />
                          <span>
                            {item.document.documentNumber} (
                            {item.document.version}) — {item.document.fileName}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <Link
                        href={`/projects/${item.project.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-slate-200 hover:text-brand-300"
                      >
                        <span className="font-mono text-brand-400">
                          {item.project.code}
                        </span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <div className="text-[11px] text-slate-400">
                        {item.project.name}
                      </div>
                      {item.phase && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Phase {item.phase.sequenceOrder}: {item.phase.name}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-200">
                        {item.submittedToRole}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Requested by: {item.requestedBy?.name || "System"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top font-mono">
                      {item.financialImpactAmount !== 0 ? (
                        <span
                          className={
                            item.financialImpactAmount < 0
                              ? "text-emerald-400 font-bold"
                              : "text-amber-300 font-bold"
                          }
                        >
                          {item.financialImpactAmount > 0 ? "+" : ""}
                          {formatKES(item.financialImpactAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Technical / Zero Cost
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.badge}`}
                      >
                        {statusStyle.label}
                      </span>
                      {item.decisionNotes && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          {item.decisionNotes}
                        </div>
                      )}
                      {item.digitalSignatureRef && (
                        <div className="mt-1 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Stamp className="h-3 w-3" />
                          <span>{item.digitalSignatureRef}</span>
                        </div>
                      )}
                    </td>

                    {canApprove && (
                      <td className="py-3.5 px-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setDecisionTarget(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-500/30 bg-brand-500/15 hover:bg-brand-500/25 px-3 py-1.5 text-[11px] font-bold text-brand-300 cursor-pointer"
                        >
                          <Stamp className="h-3.5 w-3.5" />
                          <span>
                            {item.status === "PENDING"
                              ? "Review & Sign Off"
                              : "Update Decision"}
                          </span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canApprove ? 7 : 6}
                    className="py-12 text-center text-xs text-slate-500"
                  >
                    No approval workflow items match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit New Approval Workflow Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">
                  Submit Multi-Stage Approval Request
                </h2>
                <p className="text-xs text-slate-400">
                  Route a shop drawing, variation order, IPC certificate, or sample submittal for formal sign-off.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await createApprovalWorkflowAction(formData);
                  setShowSubmitModal(false);
                  setFeedback(
                    "Approval request submitted to the designated authority."
                  );
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Submittal Title *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. AFC Sign-Off: 10th Floor Post-Tensioned Tendon Layout"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    value={selectedProjectForModal}
                    onChange={(e) => setSelectedProjectForModal(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="">General Project-Wide</option>
                    {activeModalProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase {ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Approval Gate Type *
                  </label>
                  <select
                    name="approvalType"
                    defaultValue="DRAWING_REVISION"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {Object.entries(APPROVAL_TYPE_STYLES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Linked Vault Document (Optional)
                  </label>
                  <select
                    name="documentId"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="">No Linked Document</option>
                    {modalDocuments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.documentNumber} ({d.version}) — {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Submitted To Authority *
                  </label>
                  <input
                    name="submittedToRole"
                    required
                    defaultValue="Lead Structural Consultant & Project Director"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    defaultValue="HIGH"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="CRITICAL">Critical Path</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Standard SLA (48h)</option>
                    <option value="LOW">Routine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cost Impact (KSh)
                  </label>
                  <input
                    type="number"
                    name="financialImpactAmount"
                    defaultValue={0}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Technical Justification & Submittal Notes
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Provide calculation references, lab test results, or BOQ clause references..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 font-bold text-slate-950 cursor-pointer"
                >
                  {isPending ? "Submitting..." : "Submit for Sign-Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Sign-Off Decision Modal */}
      {decisionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="text-[11px] font-mono text-brand-400">
                  {decisionTarget.approvalCode} •{" "}
                  {decisionTarget.project.code}
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Digital Sign-Off & Stamp
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDecisionTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await decideApprovalWorkflowAction(formData);
                  setDecisionTarget(null);
                  setFeedback(
                    `Decision recorded and digitally stamped for ${decisionTarget.approvalCode}.`
                  );
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <input
                type="hidden"
                name="approvalId"
                value={decisionTarget.id}
              />

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="font-bold text-white">
                  {decisionTarget.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Authority: {decisionTarget.submittedToRole}
                </div>
                {decisionTarget.document && (
                  <div className="text-[11px] font-mono text-sky-400 mt-1">
                    Linked Dossier: {decisionTarget.document.documentNumber} (
                    {decisionTarget.document.version})
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sign-Off Decision *
                </label>
                <select
                  name="status"
                  defaultValue="APPROVED"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="APPROVED">
                    Approve & Stamp AFC / Release
                  </option>
                  <option value="CHANGES_REQUESTED">
                    Request Technical Amendments (Resubmit)
                  </option>
                  <option value="REJECTED">Reject Submittal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Consultant / Director Endorsement Notes
                </label>
                <textarea
                  name="decisionNotes"
                  rows={3}
                  defaultValue={decisionTarget.decisionNotes || ""}
                  placeholder="Enter conditions of approval, structural/QS verification notes, or required amendments..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecisionTarget(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 font-bold text-slate-950 cursor-pointer"
                >
                  <Stamp className="h-4 w-4" />
                  <span>
                    {isPending ? "Stamping..." : "Apply Digital Stamp"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
