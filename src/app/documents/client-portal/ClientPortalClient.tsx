"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  FolderOpen,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  X,
  Building2,
  FileText,
  ArrowUpRight,
  MessageSquare as MessageSquareCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  createClientPortalUpdateAction,
  submitClientPortalFeedbackAction,
} from "@/app/actions/documents-approvals";
import {
  formatDate,
  formatKES,
  formatCompactKES,
  PORTAL_UPDATE_CATEGORY_STYLES,
  PORTAL_SIGNOFF_STATUS_STYLES,
} from "@/lib/utils";

interface PortalUpdateItem {
  id: string;
  portalCode: string;
  updateCategory: string;
  title: string;
  summary: string;
  completionSnapshotPct: number;
  certifiedToDateAmount: number;
  attachmentRefLabel: string | null;
  clientSignOffStatus: string;
  clientFeedbackNotes: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    code: string;
    name: string;
    location: string;
    contractValue: number;
    invoicedAmount: number;
    paidAmount: number;
    progress: number;
  };
  client: {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
  } | null;
  publishedBy: { id: string; name: string; role: string } | null;
}

interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  progress: number;
  contractValue: number;
  invoicedAmount: number;
  paidAmount: number;
  client: {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    email: string;
  } | null;
  counts: {
    documents: number;
    clientInvoices: number;
    milestones: number;
  };
}

export function ClientPortalClient({
  portalUpdates,
  projects,
  documentsCount,
  pendingApprovalsCount,
  canPublish,
}: {
  portalUpdates: PortalUpdateItem[];
  projects: ProjectSummary[];
  documentsCount: number;
  pendingApprovalsCount: number;
  canPublish: boolean;
}) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedUpdateForSignOff, setSelectedUpdateForSignOff] =
    useState<PortalUpdateItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUpdates = portalUpdates.filter((u) => {
    const matchesProject =
      projectFilter === "ALL" || u.project.id === projectFilter;
    const matchesStatus =
      statusFilter === "ALL" || u.clientSignOffStatus === statusFilter;
    const matchesSearch =
      !search.trim() ||
      u.portalCode.toLowerCase().includes(search.toLowerCase()) ||
      u.title.toLowerCase().includes(search.toLowerCase()) ||
      u.summary.toLowerCase().includes(search.toLowerCase()) ||
      (u.client &&
        u.client.name.toLowerCase().includes(search.toLowerCase()));
    return matchesProject && matchesStatus && matchesSearch;
  });

  const acknowledgedCount = portalUpdates.filter(
    (u) => u.clientSignOffStatus === "ACKNOWLEDGED"
  ).length;
  const awaitingClientCount = portalUpdates.filter(
    (u) =>
      u.clientSignOffStatus === "AWAITING_CLIENT_REVIEW" ||
      u.clientSignOffStatus === "CLARIFICATION_REQUESTED"
  ).length;
  const totalContractPortfolio = projects.reduce(
    (s, p) => s + p.contractValue,
    0
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
              {documentsCount}
            </span>
          </Link>
          <Link
            href="/documents/approvals"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Approvals & Sign-Offs</span>
            {pendingApprovalsCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono">
                {pendingApprovalsCount} Pending
              </span>
            )}
          </Link>
          <Link
            href="/documents/client-portal"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500/15 border border-brand-500/40 px-3.5 py-2 text-xs font-bold text-brand-300"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Executive Client Portal</span>
            <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-mono">
              {portalUpdates.length}
            </span>
          </Link>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Employer / Developer Stakeholder Transparency Hub
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Executive Client & Developer Stakeholder Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Curated client progress briefings, IPC valuation packs, finish selection boards, and formal client acknowledgement logs.
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Publish Client Dossier</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Published Client Packs
            </span>
            <Sparkles className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {portalUpdates.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Executive progress & IPC dispatches
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Client Signed Off
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {acknowledgedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Formally acknowledged by employer board
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Awaiting Client Decision
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {awaitingClientCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            IPC releases & finish selections pending
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Active Client Portfolio
            </span>
            <Building2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-sky-400">
            {formatCompactKES(totalContractPortfolio)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Total contracted employer portfolio
          </div>
        </div>
      </div>

      {/* Client Project Transparency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {projects.map((p) => {
          const collectionRate =
            p.invoicedAmount > 0
              ? Math.round((p.paidAmount / p.invoicedAmount) * 100)
              : 0;
          return (
            <div
              key={p.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-brand-400">
                  <span>{p.code}</span>
                  <span className="text-slate-400">{p.progress}% Complete</span>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="mt-1 font-bold text-sm text-white hover:text-brand-300 inline-flex items-center gap-1"
                >
                  <span>{p.name}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Employer: {p.client?.name || "Internal Development"}
                </div>
                {p.client?.contactPerson && (
                  <div className="text-[10px] text-slate-500">
                    Rep: {p.client.contactPerson}
                  </div>
                )}

                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${Math.min(100, p.progress)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Certified IPCs</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatCompactKES(p.invoicedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    Client Settled ({collectionRate}%)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCompactKES(p.paidAmount)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
            placeholder="Search portal dispatch code, client name, or executive summary..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Client Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Client Sign-Off Statuses</option>
            {Object.entries(PORTAL_SIGNOFF_STATUS_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Published Client Portal Dossiers Feed */}
      <div className="space-y-4">
        {filteredUpdates.map((item) => {
          const catStyle = PORTAL_UPDATE_CATEGORY_STYLES[
            item.updateCategory
          ] || {
            label: item.updateCategory,
            badge: "bg-slate-800 text-slate-300 border-slate-700",
          };
          const signOffStyle = PORTAL_SIGNOFF_STATUS_STYLES[
            item.clientSignOffStatus
          ] || {
            label: item.clientSignOffStatus,
            badge: "bg-slate-800 text-slate-300 border-slate-700",
          };

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-400">
                      {item.portalCode}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${catStyle.badge}`}
                    >
                      {catStyle.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${signOffStyle.badge}`}
                    >
                      {signOffStyle.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      • Published {formatDate(item.createdAt)} by{" "}
                      {item.publishedBy?.name || "Project Team"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>

                  {item.attachmentRefLabel && (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-xs font-mono text-sky-300">
                      <FileText className="h-3.5 w-3.5 text-sky-400" />
                      <span>Dossier Attachment: {item.attachmentRefLabel}</span>
                    </div>
                  )}

                  {item.clientFeedbackNotes && (
                    <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                      <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <MessageSquareCheck className="h-3.5 w-3.5" />
                        <span>
                          Employer / Client Representative Feedback (
                          {item.client?.name || "Client"}):
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">
                        “{item.clientFeedbackNotes}”
                      </p>
                      {item.acknowledgedAt && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Signed off on {formatDate(item.acknowledgedAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  <div className="text-left lg:text-right">
                    <div className="text-[11px] font-semibold text-slate-200">
                      {item.project.code} — {item.project.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Client: {item.client?.name || "Employer Board"}
                    </div>
                    <div className="mt-2 flex items-center lg:justify-end gap-3 text-xs font-mono">
                      <span className="rounded bg-slate-800 px-2 py-1 text-brand-300">
                        Snapshot: {item.completionSnapshotPct}%
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-1 text-emerald-300">
                        Certified: {formatKES(item.certifiedToDateAmount)}
                      </span>
                    </div>
                  </div>

                  {canPublish && (
                    <button
                      type="button"
                      onClick={() => setSelectedUpdateForSignOff(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1.5 text-xs font-bold text-sky-300 cursor-pointer"
                    >
                      <MessageSquareCheck className="h-3.5 w-3.5" />
                      <span>Record Client Sign-Off / Feedback</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredUpdates.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-500">
            No client portal dispatches match your current filter criteria.
          </div>
        )}
      </div>

      {/* Publish New Client Portal Update Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">
                  Publish Executive Client Portal Dossier
                </h2>
                <p className="text-xs text-slate-400">
                  Share an executive progress brief, IPC valuation pack, or finish selection request with the project employer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await createClientPortalUpdateAction(formData);
                  setShowPublishModal(false);
                  setFeedback(
                    "Executive client portal dossier published to stakeholder feed."
                  );
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    defaultValue={projects[0]?.id}
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
                    Dispatch Category *
                  </label>
                  <select
                    name="updateCategory"
                    defaultValue="EXECUTIVE_PROGRESS_BRIEF"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {Object.entries(PORTAL_UPDATE_CATEGORY_STYLES).map(
                      ([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Dossier Headline *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. April 2026 Executive Progress Brief & 10th Floor Pour"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Executive Summary & Key Highlights *
                </label>
                <textarea
                  name="summary"
                  required
                  rows={3}
                  placeholder="Summarize physical progress against baseline, quality/cube test milestones, and upcoming client decisions..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Completion %
                  </label>
                  <input
                    type="number"
                    name="completionSnapshotPct"
                    defaultValue={72}
                    min={0}
                    max={100}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Certified Value to Date (KSh)
                  </label>
                  <input
                    type="number"
                    name="certifiedToDateAmount"
                    defaultValue={268880000}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Attached PDF Pack Filename
                </label>
                <input
                  name="attachmentRefLabel"
                  defaultValue="Executive-Client-Progress-Pack-2026.pdf"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 font-bold text-slate-950 cursor-pointer"
                >
                  {isPending ? "Publishing..." : "Publish to Client Portal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Sign-Off & Feedback Modal */}
      {selectedUpdateForSignOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="text-[11px] font-mono text-brand-400">
                  {selectedUpdateForSignOff.portalCode} •{" "}
                  {selectedUpdateForSignOff.client?.name || "Client"}
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Record Client Portal Acknowledgement
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUpdateForSignOff(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await submitClientPortalFeedbackAction(formData);
                  setSelectedUpdateForSignOff(null);
                  setFeedback(
                    `Client sign-off recorded for ${selectedUpdateForSignOff.portalCode}.`
                  );
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <input
                type="hidden"
                name="updateId"
                value={selectedUpdateForSignOff.id}
              />

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="font-bold text-white">
                  {selectedUpdateForSignOff.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Project: {selectedUpdateForSignOff.project.name}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Client Sign-Off Status *
                </label>
                <select
                  name="clientSignOffStatus"
                  defaultValue="ACKNOWLEDGED"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="ACKNOWLEDGED">
                    Client Signed Off & Acknowledged
                  </option>
                  <option value="CLARIFICATION_REQUESTED">
                    Client Clarification / Option Change Requested
                  </option>
                  <option value="AWAITING_CLIENT_REVIEW">
                    Awaiting Client Review
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Client / Employer Board Feedback Notes
                </label>
                <textarea
                  name="clientFeedbackNotes"
                  rows={3}
                  defaultValue={
                    selectedUpdateForSignOff.clientFeedbackNotes || ""
                  }
                  placeholder="Enter client board minutes, finish selection confirmation, or IPC release remarks..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUpdateForSignOff(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 font-bold text-slate-950 cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Client Sign-Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
