"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Building2,
  MapPin,
  Layers,
  Calendar,
  UserCheck,
  X,
  HardHat,
  Award,
} from "lucide-react";
import {
  cn,
  formatDate,
  QSI_DOMAIN_STYLES,
  QSI_TYPE_STYLES,
  QSI_RESULT_STATUS_STYLES,
} from "@/lib/utils";
import {
  createQualitySafetyRecordAction,
  updateQualitySafetyRecordAction,
} from "@/app/actions/site-operations";

interface QualitySafetyRecordItem {
  id: string;
  recordNumber: string;
  recordDomain: string;
  inspectionOrIncidentType: string;
  title: string;
  locationArea: string;
  inspectionDate: string;
  resultStatus: string;
  severity: string;
  findingsOrDefects: string;
  correctiveAction: string | null;
  complianceScorePct: number;
  closedAt: string | null;
  projectId: string;
  siteId: string | null;
  phaseId: string | null;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
  inspectorOrReporter: { id: string; name: string; role: string } | null;
  responsiblePerson: { id: string; name: string; role: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  sites: { id: string; code: string; name: string }[];
  phases: { id: string; sequenceOrder: number; name: string }[];
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
}

interface InspectionsSafetyClientProps {
  records: QualitySafetyRecordItem[];
  projects: ProjectOption[];
  users: UserOption[];
  initialProjectFilter: string;
  initialDomainFilter: string;
  canRecordInspections: boolean;
}

export function InspectionsSafetyClient({
  records,
  projects,
  users,
  initialProjectFilter,
  initialDomainFilter,
  canRecordInspections,
}: InspectionsSafetyClientProps) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [domainFilter, setDomainFilter] = useState(initialDomainFilter);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedModalProjectId, setSelectedModalProjectId] = useState(
    projects[0]?.id || ""
  );
  const [editingRecord, setEditingRecord] =
    useState<QualitySafetyRecordItem | null>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        rec.recordNumber.toLowerCase().includes(q) ||
        rec.title.toLowerCase().includes(q) ||
        rec.locationArea.toLowerCase().includes(q) ||
        rec.findingsOrDefects.toLowerCase().includes(q) ||
        rec.project.code.toLowerCase().includes(q) ||
        (rec.correctiveAction &&
          rec.correctiveAction.toLowerCase().includes(q));

      const matchesProject =
        projectFilter === "ALL" || rec.projectId === projectFilter;
      const matchesDomain =
        domainFilter === "ALL" || rec.recordDomain === domainFilter;
      const matchesStatus =
        statusFilter === "ALL" || rec.resultStatus === statusFilter;

      return matchesSearch && matchesProject && matchesDomain && matchesStatus;
    });
  }, [records, search, projectFilter, domainFilter, statusFilter]);

  const kpis = useMemo(() => {
    const qualityCount = records.filter(
      (r) => r.recordDomain === "QUALITY_INSPECTION"
    ).length;
    const safetyAuditCount = records.filter(
      (r) => r.recordDomain === "SAFETY_AUDIT"
    ).length;
    const incidentCount = records.filter(
      (r) => r.recordDomain === "SAFETY_INCIDENT"
    ).length;
    const passedCount = records.filter(
      (r) =>
        r.resultStatus === "PASSED" ||
        r.resultStatus === "PASSED_WITH_OBSERVATIONS"
    ).length;
    const avgCompliance =
      records.length > 0
        ? records.reduce((s, r) => s + r.complianceScorePct, 0) / records.length
        : 100;

    return {
      total: records.length,
      qualityCount,
      safetyAuditCount,
      incidentCount,
      passedCount,
      avgCompliance,
    };
  }, [records]);

  const selectedModalProject = useMemo(
    () => projects.find((p) => p.id === selectedModalProjectId),
    [projects, selectedModalProjectId]
  );

  function handleCreateRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await createQualitySafetyRecordAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "QA/QC inspection or HSE safety record logged to project register.",
        });
        setShowNewModal(false);
      }
    });
  }

  function handleUpdateRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await updateQualitySafetyRecordAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Corrective action and inspection sign-off updated.",
        });
        setEditingRecord(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Phase 8 • Quality Control (QA/QC) & HSE Safety Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Engineering Hold-Points, Lab Cube Tests & Site Safety Register
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Manage structural pre-pour rebar sign-offs, 28-day concrete cube crush tests, MEP hydrostatic tests, scaffolding audits, near-miss reports, and corrective actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/operations/site-reports"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            ← Site Reports
          </Link>
          <Link
            href="/operations/issues"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            ← Issues & Snags
          </Link>
          {canRecordInspections && (
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Record QA Inspection / HSE Incident
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between text-xs font-medium",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>QA/QC Engineering Checks</span>
            <ClipboardCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis.qualityCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pre-pour hold points & lab tests
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>HSE Safety Audits</span>
            <HardHat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {kpis.safetyAuditCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Scaffolding, PPE & working at height
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Safety Incidents / Near-Misses</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {kpis.incidentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zero lost-time fatalities (0 LTI)
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mean QA/HSE Compliance Score</span>
            <Award className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis.avgCompliance.toFixed(1)}%
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {kpis.passedCount} passed hold-point sign-offs
          </div>
        </div>
      </div>

      {/* Domain Tabs & Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDomainFilter("ALL")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              domainFilter === "ALL"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            All Records ({records.length})
          </button>
          <button
            onClick={() => setDomainFilter("QUALITY_INSPECTION")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              domainFilter === "QUALITY_INSPECTION"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Quality Inspections ({kpis.qualityCount})
          </button>
          <button
            onClick={() => setDomainFilter("SAFETY_AUDIT")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              domainFilter === "SAFETY_AUDIT"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            HSE Safety Audits ({kpis.safetyAuditCount})
          </button>
          <button
            onClick={() => setDomainFilter("SAFETY_INCIDENT")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              domainFilter === "SAFETY_INCIDENT"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Incidents & Near-Misses ({kpis.incidentCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search QSI/SAF #, location, findings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-brand-500 w-56"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
          >
            <option value="ALL">All Result Statuses</option>
            {Object.entries(QSI_RESULT_STATUS_STYLES).map(([k, val]) => (
              <option key={k} value={k}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((rec) => {
          const domStyle =
            QSI_DOMAIN_STYLES[rec.recordDomain] ||
            QSI_DOMAIN_STYLES.QUALITY_INSPECTION;
          const resStyle =
            QSI_RESULT_STATUS_STYLES[rec.resultStatus] ||
            QSI_RESULT_STATUS_STYLES.PASSED;
          const typeLabel =
            QSI_TYPE_STYLES[rec.inspectionOrIncidentType] ||
            rec.inspectionOrIncidentType;

          return (
            <div
              key={rec.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-brand-400 border border-slate-700">
                    {rec.recordNumber}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded text-[11px] font-mono border",
                      domStyle.badge
                    )}
                  >
                    {domStyle.label}
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {typeLabel}
                  </span>
                  <Link
                    href={`/projects/${rec.project.id}`}
                    className="text-xs font-bold text-white hover:text-brand-400 flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-brand-400" />
                    {rec.project.code} — {rec.project.name}
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                    Score: {rec.complianceScorePct}%
                  </span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-mono font-semibold border",
                      resStyle.badge
                    )}
                  >
                    {resStyle.label}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-brand-300 font-mono mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{rec.locationArea}</span>
                  <span>•</span>
                  <span>{formatDate(rec.inspectionDate)}</span>
                </div>
                <h3 className="text-base font-bold text-white">{rec.title}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
                  <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                    Inspection Findings / Test Measurements / Observation
                  </div>
                  <p className="text-slate-200 mt-1 leading-relaxed">
                    {rec.findingsOrDefects}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    Corrective Action / Sign-Off Disposition
                  </div>
                  <p className="text-slate-200 mt-1 leading-relaxed">
                    {rec.correctiveAction ||
                      "No corrective action required — compliant."}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Inspector / Reporter:{" "}
                    <strong className="text-slate-200">
                      {rec.inspectorOrReporter?.name || "Resident Engineer"}
                    </strong>
                  </span>
                  <span>
                    Site Responsible:{" "}
                    <strong className="text-slate-200">
                      {rec.responsiblePerson?.name || "Site Agent"}
                    </strong>
                  </span>
                  {rec.closedAt && (
                    <span className="text-emerald-400 font-mono">
                      Closed {formatDate(rec.closedAt)}
                    </span>
                  )}
                </div>

                {canRecordInspections && (
                  <button
                    onClick={() => setEditingRecord(rec)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Update Corrective Action / Sign-Off
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: RECORD QA/QC INSPECTION OR SAFETY INCIDENT */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base text-white">
                  Record Quality Inspection (QA/QC) or Safety Audit / Incident
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateRecord}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Record Domain *
                  </label>
                  <select
                    name="recordDomain"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(QSI_DOMAIN_STYLES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Inspection / Incident Type *
                  </label>
                  <select
                    name="inspectionOrIncidentType"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(QSI_TYPE_STYLES).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    value={selectedModalProjectId}
                    onChange={(e) => setSelectedModalProjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Inspection / Incident Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. 9th Floor Column Starter Rebar & Cover Check"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Exact Grid / Floor Location *
                  </label>
                  <input
                    type="text"
                    name="locationArea"
                    required
                    placeholder="e.g. Block A — 9th Floor Grids A1–C6"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Result / Disposition Status
                  </label>
                  <select
                    name="resultStatus"
                    defaultValue="PASSED"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(QSI_RESULT_STATUS_STYLES).map(
                      ([k, val]) => (
                        <option key={k} value={k}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Compliance Score (%)
                  </label>
                  <input
                    type="number"
                    name="complianceScorePct"
                    defaultValue={96}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Responsible Site Person
                  </label>
                  <select
                    name="responsiblePersonId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.jobTitle || u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Inspection Findings / Test Measurements / Incident Details *
                </label>
                <textarea
                  name="findingsOrDefects"
                  rows={2}
                  required
                  placeholder="Record slump/cube results, rebar cover measurements, or safety observations..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Corrective Action / Sign-Off Notes
                </label>
                <textarea
                  name="correctiveAction"
                  rows={2}
                  placeholder="Describe any remedial actions taken or Pour Card release..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save QA/HSE Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE CORRECTIVE ACTION & SIGN-OFF */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-brand-400 font-bold">
                  {editingRecord.recordNumber}
                </div>
                <h3 className="font-bold text-base text-white">
                  {editingRecord.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateRecord}
              className="p-6 space-y-4 text-xs"
            >
              <input type="hidden" name="recordId" value={editingRecord.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Updated Result Status
                  </label>
                  <select
                    name="resultStatus"
                    defaultValue={editingRecord.resultStatus}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(QSI_RESULT_STATUS_STYLES).map(
                      ([k, val]) => (
                        <option key={k} value={k}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Compliance Score (%)
                  </label>
                  <input
                    type="number"
                    name="complianceScorePct"
                    defaultValue={editingRecord.complianceScorePct}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Corrective Action & Final Sign-Off Notes
                </label>
                <textarea
                  name="correctiveAction"
                  rows={3}
                  defaultValue={editingRecord.correctiveAction || ""}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isPending ? "Updating..." : "Update Sign-Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
