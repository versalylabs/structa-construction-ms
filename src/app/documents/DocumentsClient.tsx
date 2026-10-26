"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  X,
  FileCheck2,
  GitBranch,
  Clock,
  ShieldCheck,
  Users,
  Layers,
} from "lucide-react";
import {
  registerDocumentOrRevisionAction,
  updateDocumentStatusAction,
} from "@/app/actions/documents-approvals";
import {
  formatDate,
  DOCUMENT_CATEGORY_STYLES,
  DOCUMENT_STATUS_STYLES,
} from "@/lib/utils";

interface DocRecord {
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
  project: { id: string; code: string; name: string } | null;
  client: { id: string; name: string } | null;
  uploadedBy: { id: string; name: string; role: string } | null;
  approvalWorkflows: {
    id: string;
    approvalCode: string;
    status: string;
    digitalSignatureRef: string | null;
  }[];
}

export function DocumentsClient({
  documents,
  projects,
  pendingApprovalsCount,
  portalUpdatesCount,
  canManageDocs,
}: {
  documents: DocRecord[];
  projects: { id: string; code: string; name: string }[];
  pendingApprovalsCount: number;
  portalUpdatesCount: number;
  canManageDocs: boolean;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [revisionBaseDoc, setRevisionBaseDoc] = useState<DocRecord | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = documents.filter((d) => {
    const matchesCat =
      categoryFilter === "ALL" || d.category === categoryFilter;
    const matchesProj =
      projectFilter === "ALL" || d.project?.id === projectFilter;
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (d.notes && d.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesProj && matchesStatus && matchesSearch;
  });

  const totalDocs = documents.length;
  const approvedDocsCount = documents.filter(
    (d) => d.status === "APPROVED"
  ).length;
  const underReviewCount = documents.filter(
    (d) => d.status === "UNDER_REVIEW" || d.status === "DRAFT"
  ).length;
  const supersededCount = documents.filter(
    (d) => d.status === "SUPERSEDED"
  ).length;

  function openNewRevisionModal(doc: DocRecord) {
    setRevisionBaseDoc(doc);
    setShowModal(true);
  }

  function handleQuickStatusUpdate(documentId: string, nextStatus: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("documentId", documentId);
      fd.set("status", nextStatus);
      await updateDocumentStatusAction(fd);
      setFeedback(`Document status updated to ${nextStatus}.`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Phase 10 Sub-Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500/15 border border-brand-500/40 px-3.5 py-2 text-xs font-bold text-brand-300"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Document Vault & Revisions</span>
            <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-mono">
              {totalDocs}
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
          ISO 19650 Common Data Environment (CDE) • AFC Revision Control
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Engineering Document Vault & Revision Control
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            FIDIC/JBC contracts, architectural & structural CAD/BIM drawings, priced BOQs, NCA/NEMA permits, and revision superseding lineage.
          </p>
        </div>

        {canManageDocs && (
          <button
            type="button"
            onClick={() => {
              setRevisionBaseDoc(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Register Document / Drawing</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Vault Dossiers</span>
            <Layers className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {totalDocs}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across {projects.length} active construction sites
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Approved for Construction (AFC)
            </span>
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {approvedDocsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Signed off & active for site execution
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Under Consultant Review
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {underReviewCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Awaiting Structural / Architect AFC stamp
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Superseded Revisions
            </span>
            <GitBranch className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            {supersededCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Archived historical drawing versions
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
            placeholder="Search doc number, drawing title, filename, or revision notes..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Document Categories</option>
            {Object.entries(DOCUMENT_CATEGORY_STYLES).map(([key, val]) => (
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
            <option value="ALL">All Revision Statuses</option>
            {Object.entries(DOCUMENT_STATUS_STYLES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Doc Number & Rev</th>
                <th className="py-3.5 px-4">Document Title & File</th>
                <th className="py-3.5 px-4">Project & Client</th>
                <th className="py-3.5 px-4">Discipline Category</th>
                <th className="py-3.5 px-4">CDE Status</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                {canManageDocs && (
                  <th className="py-3.5 px-4 text-right">Revision Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.map((doc) => {
                const catStyle = DOCUMENT_CATEGORY_STYLES[doc.category] || {
                  label: doc.category,
                  badge: "bg-slate-800 text-slate-300 border-slate-700",
                };
                const statusStyle = DOCUMENT_STATUS_STYLES[doc.status] || {
                  label: doc.status,
                  badge: "bg-slate-800 text-slate-300 border-slate-700",
                };
                const linkedApproval = doc.approvalWorkflows?.[0];

                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-800/40 ${
                      doc.status === "SUPERSEDED" ? "opacity-65" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-brand-400">
                        {doc.documentNumber}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                        <GitBranch className="h-2.5 w-2.5 text-sky-400" />
                        <span>{doc.version}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {doc.fileSizeLabel}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-md">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {doc.fileName}
                      </div>
                      {doc.notes && (
                        <div className="text-[11px] text-slate-400 mt-1 bg-slate-950/60 rounded px-2 py-1 border border-slate-800/80">
                          {doc.notes}
                        </div>
                      )}
                      {linkedApproval && (
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-emerald-300">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" />
                          <Link
                            href="/documents/approvals"
                            className="underline hover:text-emerald-200"
                          >
                            Workflow {linkedApproval.approvalCode} (
                            {linkedApproval.status})
                          </Link>
                          {linkedApproval.digitalSignatureRef && (
                            <span className="text-slate-500">
                              • {linkedApproval.digitalSignatureRef}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      {doc.project ? (
                        <div>
                          <Link
                            href={`/projects/${doc.project.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-slate-200 hover:text-brand-300"
                          >
                            <span className="font-mono text-brand-400">
                              {doc.project.code}
                            </span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {doc.project.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          Organization-wide
                        </span>
                      )}
                      {doc.client && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Client: {doc.client.name}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${catStyle.badge}`}
                      >
                        {catStyle.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.badge}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top text-slate-300">
                      <div className="font-medium">
                        {doc.uploadedBy?.name || "System"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDate(doc.createdAt)}
                      </div>
                    </td>

                    {canManageDocs && (
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {doc.status !== "SUPERSEDED" && (
                            <button
                              type="button"
                              onClick={() => openNewRevisionModal(doc)}
                              className="inline-flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 text-[10px] font-semibold text-sky-300 cursor-pointer"
                            >
                              <GitBranch className="h-3 w-3" />
                              <span>Issue New Revision</span>
                            </button>
                          )}

                          {doc.status === "UNDER_REVIEW" && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleQuickStatusUpdate(doc.id, "APPROVED")
                              }
                              className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 cursor-pointer"
                            >
                              <FileCheck2 className="h-3 w-3" />
                              <span>Stamp AFC Approved</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canManageDocs ? 7 : 6}
                    className="py-12 text-center text-xs text-slate-500"
                  >
                    No documents match your current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Document or Issue Revision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">
                  {revisionBaseDoc
                    ? `Issue Superseding Revision for ${revisionBaseDoc.documentNumber}`
                    : "Register Project Document or Drawing"}
                </h2>
                <p className="text-xs text-slate-400">
                  {revisionBaseDoc
                    ? `Prior version (${revisionBaseDoc.version}) will automatically be marked as SUPERSEDED.`
                    : "Catalog a new contract, CAD/BIM drawing, priced BOQ, or statutory permit."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setRevisionBaseDoc(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await registerDocumentOrRevisionAction(formData);
                  setShowModal(false);
                  setRevisionBaseDoc(null);
                  setFeedback(
                    revisionBaseDoc
                      ? `New revision registered for ${revisionBaseDoc.documentNumber}; prior revision marked SUPERSEDED.`
                      : "Document registered in the central vault."
                  );
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <input
                type="hidden"
                name="supersedePrior"
                value={revisionBaseDoc ? "true" : "false"}
              />

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Document / Drawing Title *
                </label>
                <input
                  name="title"
                  required
                  defaultValue={revisionBaseDoc?.title || ""}
                  placeholder="e.g. Block A & B 10th Floor Post-Tensioned Slab Profile"
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
                    defaultValue={
                      revisionBaseDoc?.project?.id || projects[0]?.id
                    }
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
                    Discipline Category *
                  </label>
                  <select
                    name="category"
                    defaultValue={
                      revisionBaseDoc?.category || "STRUCTURAL_DRAWING"
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {Object.entries(DOCUMENT_CATEGORY_STYLES).map(
                      ([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Document Number
                  </label>
                  <input
                    name="documentNumber"
                    defaultValue={revisionBaseDoc?.documentNumber || ""}
                    placeholder="Auto (e.g. DOC-RIV-008)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Revision Version *
                  </label>
                  <input
                    name="version"
                    required
                    defaultValue={revisionBaseDoc ? "v4.0" : "v1.0"}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    CDE Status *
                  </label>
                  <select
                    name="status"
                    defaultValue="APPROVED"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="APPROVED">Approved (AFC)</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="DRAFT">Working Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    File Name *
                  </label>
                  <input
                    name="fileName"
                    required
                    defaultValue={
                      revisionBaseDoc
                        ? revisionBaseDoc.fileName.replace(
                            /(\.[a-zA-Z0-9]+)$/,
                            "-Rev4$1"
                          )
                        : ""
                    }
                    placeholder="e.g. RIV-STR-SLAB-10F-Rev4.pdf"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    File Size Label
                  </label>
                  <input
                    name="fileSizeLabel"
                    defaultValue="14.2 MB"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Revision Notes / Consultant Instruction Reference
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Summarize structural, architectural, or commercial changes in this revision..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setRevisionBaseDoc(null);
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 font-bold text-slate-950 cursor-pointer"
                >
                  {isPending
                    ? "Saving..."
                    : revisionBaseDoc
                    ? "Publish Superseding Revision"
                    : "Register Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
