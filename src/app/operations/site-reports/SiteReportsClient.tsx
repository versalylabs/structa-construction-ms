"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Camera,
  CloudSun,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Building2,
  MapPin,
  Layers,
  ShieldCheck,
  TrendingUp,
  X,
  Calendar,
  Thermometer,
  Package,
  Wrench,
} from "lucide-react";
import {
  cn,
  formatDate,
  SITE_REPORT_WEATHER_STYLES,
  SITE_REPORT_STATUS_STYLES,
  SITE_PHOTO_CATEGORY_STYLES,
} from "@/lib/utils";
import {
  createSiteReportAction,
  reviewSiteReportAction,
  createSitePhotoAction,
} from "@/app/actions/site-operations";

interface SitePhotoItem {
  id: string;
  photoCode: string;
  category: string;
  title: string;
  caption: string | null;
  locationTag: string;
  imageUrl: string;
  capturedAt: string;
  project?: { id: string; code: string; name: string };
  site?: { id: string; code: string; name: string } | null;
  siteReport?: { id: string; reportNumber: string } | null;
  uploadedBy?: { id: string; name: string; role: string } | null;
}

interface SiteReportItem {
  id: string;
  reportNumber: string;
  reportDate: string;
  reportType: string;
  weatherCondition: string;
  temperatureCelsius: number;
  groundCondition: string;
  workersPresentCount: number;
  subcontractorWorkersCount: number;
  workCompletedSummary: string;
  workPlannedNext: string;
  materialsReceivedNote: string | null;
  equipmentUsedNote: string | null;
  issuesSummaryNote: string | null;
  safetyToolboxTalkTopic: string | null;
  safetyIncidentsCount: number;
  overallProgressDelta: number;
  status: string;
  notes: string | null;
  projectId: string;
  siteId: string | null;
  phaseId: string | null;
  project: { id: string; code: string; name: string };
  site: { id: string; code: true | string; name: string } | null;
  phase: { id: string; sequenceOrder: number; name: string } | null;
  submittedBy: { id: string; name: string; role: string } | null;
  reviewedBy: { id: string; name: string; role: string } | null;
  photos: SitePhotoItem[];
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  sites: { id: string; code: string; name: string }[];
  phases: { id: string; sequenceOrder: number; name: string }[];
}

interface SiteReportsClientProps {
  siteReports: SiteReportItem[];
  sitePhotos: SitePhotoItem[];
  projects: ProjectOption[];
  initialProjectFilter: string;
  initialTab: "reports" | "photos";
  canSubmitReports: boolean;
  canReviewReports: boolean;
}

export function SiteReportsClient({
  siteReports,
  sitePhotos,
  projects,
  initialProjectFilter,
  initialTab,
  canSubmitReports,
  canReviewReports,
}: SiteReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "photos">(initialTab);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [weatherFilter, setWeatherFilter] = useState("ALL");
  const [photoCatFilter, setPhotoCatFilter] = useState("ALL");

  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [selectedReportProjectId, setSelectedReportProjectId] = useState(
    projects[0]?.id || ""
  );
  const [showNewPhotoModal, setShowNewPhotoModal] = useState(false);
  const [selectedPhotoProjectId, setSelectedPhotoProjectId] = useState(
    projects[0]?.id || ""
  );
  const [reviewingReport, setReviewingReport] = useState<SiteReportItem | null>(
    null
  );

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredReports = useMemo(() => {
    return siteReports.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.reportNumber.toLowerCase().includes(q) ||
        r.workCompletedSummary.toLowerCase().includes(q) ||
        r.workPlannedNext.toLowerCase().includes(q) ||
        r.project.name.toLowerCase().includes(q) ||
        r.project.code.toLowerCase().includes(q) ||
        (r.safetyToolboxTalkTopic &&
          r.safetyToolboxTalkTopic.toLowerCase().includes(q));

      const matchesProject =
        projectFilter === "ALL" || r.projectId === projectFilter;
      const matchesWeather =
        weatherFilter === "ALL" || r.weatherCondition === weatherFilter;

      return matchesSearch && matchesProject && matchesWeather;
    });
  }, [siteReports, search, projectFilter, weatherFilter]);

  const filteredPhotos = useMemo(() => {
    return sitePhotos.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.photoCode.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.locationTag.toLowerCase().includes(q) ||
        (p.caption && p.caption.toLowerCase().includes(q));

      const matchesProject =
        projectFilter === "ALL" || p.project?.id === projectFilter;
      const matchesCategory =
        photoCatFilter === "ALL" || p.category === photoCatFilter;

      return matchesSearch && matchesProject && matchesCategory;
    });
  }, [sitePhotos, search, projectFilter, photoCatFilter]);

  const kpis = useMemo(() => {
    const totalReports = siteReports.length;
    const reviewedCount = siteReports.filter(
      (r) => r.status === "REVIEWED"
    ).length;
    const totalManpowerLogged = siteReports.reduce(
      (sum, r) => sum + r.workersPresentCount + r.subcontractorWorkersCount,
      0
    );
    const totalProgressGained = siteReports.reduce(
      (sum, r) => sum + r.overallProgressDelta,
      0
    );
    const totalPhotos = sitePhotos.length;

    return {
      totalReports,
      reviewedCount,
      totalManpowerLogged,
      totalProgressGained,
      totalPhotos,
    };
  }, [siteReports, sitePhotos]);

  const selectedReportProject = useMemo(
    () => projects.find((p) => p.id === selectedReportProjectId),
    [projects, selectedReportProjectId]
  );

  const selectedPhotoProject = useMemo(
    () => projects.find((p) => p.id === selectedPhotoProjectId),
    [projects, selectedPhotoProjectId]
  );

  function handleCreateReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await createSiteReportAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Daily site report logged to permanent project history and progress updated.",
        });
        setShowNewReportModal(false);
      }
    });
  }

  function handleReviewReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await reviewSiteReportAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Site report review status updated.",
        });
        setReviewingReport(null);
      }
    });
  }

  function handleCreatePhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await createSitePhotoAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Site progress/inspection photo added to project evidence gallery.",
        });
        setShowNewPhotoModal(false);
        setActiveTab("photos");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
            <FileText className="w-4 h-4" />
            <span>Phase 8 • Daily Site Operations & Photographic Evidence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Daily Site Reports, Weather Logs & Visual Progress Gallery
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Permanent daily and weekly site diaries capturing weather, direct & subcontractor manpower, completed vs planned works, deliveries, plant usage, toolbox talks, and timestamped site photos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/operations/issues"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Issues & Snags →
          </Link>
          <Link
            href="/operations/inspections"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            QA/QC & Safety →
          </Link>
          {canSubmitReports && (
            <>
              <button
                onClick={() => setShowNewPhotoModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-500/40 bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Add Site Photo
              </button>
              <button
                onClick={() => setShowNewReportModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit Daily Site Report
              </button>
            </>
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
            <span>Site Diaries Logged</span>
            <FileText className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis.totalReports}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {kpis.reviewedCount} verified & signed off by PM/RE
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cumulative Shift Headcount</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis.totalManpowerLogged} man-days
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Direct labour + specialist subcontractors
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Verified Progress Gain</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            +{kpis.totalProgressGained.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Incremental physical works logged
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Site Photo Evidence</span>
            <Camera className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis.totalPhotos} Photos
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rebar, pours, deliveries & snag records
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("reports")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              activeTab === "reports"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Daily & Weekly Site Reports ({siteReports.length})
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              activeTab === "photos"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Site Photo Evidence Gallery ({sitePhotos.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search report #, work, toolbox..."
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

          {activeTab === "reports" ? (
            <select
              value={weatherFilter}
              onChange={(e) => setWeatherFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
            >
              <option value="ALL">All Weather Conditions</option>
              {Object.entries(SITE_REPORT_WEATHER_STYLES).map(([k, val]) => (
                <option key={k} value={k}>
                  {val.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={photoCatFilter}
              onChange={(e) => setPhotoCatFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
            >
              <option value="ALL">All Photo Categories</option>
              {Object.entries(SITE_PHOTO_CATEGORY_STYLES).map(([k, val]) => (
                <option key={k} value={k}>
                  {val.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: SITE REPORTS */}
      {activeTab === "reports" ? (
        <div className="space-y-4">
          {filteredReports.map((r) => {
            const weatherStyle =
              SITE_REPORT_WEATHER_STYLES[r.weatherCondition] ||
              SITE_REPORT_WEATHER_STYLES.SUNNY_CLEAR;
            const statusStyle =
              SITE_REPORT_STATUS_STYLES[r.status] ||
              SITE_REPORT_STATUS_STYLES.SUBMITTED;

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Top Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                      {r.reportNumber}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {r.reportType} REPORT
                    </span>
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(r.reportDate)}
                    </span>
                    <Link
                      href={`/projects/${r.project.id}`}
                      className="text-xs font-bold text-white hover:text-brand-400 flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-brand-400" />
                      {r.project.code} — {r.project.name}
                    </Link>
                    {r.site && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {r.site.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-mono border",
                        weatherStyle.badge
                      )}
                    >
                      {weatherStyle.label} • {r.temperatureCelsius}°C
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border",
                        statusStyle.badge
                      )}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                </div>

                {/* Main Grid: Work Completed vs Planned Next */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-between">
                      <span>Work Executed & Completed Today</span>
                      {r.overallProgressDelta > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                          +{r.overallProgressDelta}% Project Progress
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {r.workCompletedSummary}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                      Work Planned for Next Shift
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {r.workPlannedNext}
                    </p>
                  </div>
                </div>

                {/* Operational Details Strip */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-3">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Site Manpower Present
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 font-mono">
                      {r.workersPresentCount + r.subcontractorWorkersCount} Total
                      Operatives
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.workersPresentCount} Direct •{" "}
                      {r.subcontractorWorkersCount} Subcontractor
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-3">
                    <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Package className="w-3 h-3 text-brand-400" />
                      Materials Received
                    </div>
                    <div className="text-slate-200 mt-0.5 line-clamp-2">
                      {r.materialsReceivedNote || "No bulk deliveries today"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-3">
                    <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-cyan-400" />
                      Plant & Equipment Used
                    </div>
                    <div className="text-slate-200 mt-0.5 line-clamp-2">
                      {r.equipmentUsedNote || "Standard site tools"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-3">
                    <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      HSE Toolbox Talk & Safety
                    </div>
                    <div className="text-slate-200 mt-0.5 line-clamp-2">
                      {r.safetyToolboxTalkTopic || "Daily PPE & site induction"}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] font-mono mt-0.5",
                        r.safetyIncidentsCount > 0
                          ? "text-amber-400 font-bold"
                          : "text-emerald-400"
                      )}
                    >
                      Incidents: {r.safetyIncidentsCount}
                    </div>
                  </div>
                </div>

                {/* Footer: Submitter, Reviewer & Actions */}
                <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>
                      Submitted by:{" "}
                      <strong className="text-slate-200">
                        {r.submittedBy?.name || "Site Agent"}
                      </strong>
                    </span>
                    {r.reviewedBy && (
                      <span>
                        Reviewed by:{" "}
                        <strong className="text-emerald-400">
                          {r.reviewedBy.name}
                        </strong>
                      </span>
                    )}
                    {r.photos.length > 0 && (
                      <button
                        onClick={() => {
                          setProjectFilter(r.projectId);
                          setActiveTab("photos");
                        }}
                        className="text-brand-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {r.photos.length} Attached Photo(s)
                      </button>
                    )}
                  </div>

                  {canReviewReports && (
                    <button
                      onClick={() => setReviewingReport(r)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Review / Sign-Off Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TAB 2: SITE PHOTOS GALLERY */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPhotos.map((photo) => {
            const catStyle =
              SITE_PHOTO_CATEGORY_STYLES[photo.category] ||
              SITE_PHOTO_CATEGORY_STYLES.PROGRESS;

            return (
              <div
                key={photo.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 bg-slate-950 border-b border-slate-800 overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded bg-slate-950/90 text-brand-400 border border-slate-700">
                        {photo.photoCode}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded text-[11px] font-mono font-semibold border backdrop-blur-xs",
                          catStyle.badge
                        )}
                      >
                        {catStyle.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-brand-300 font-semibold">
                        {photo.locationTag}
                      </span>
                      <span>{formatDate(photo.capturedAt)}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {photo.title}
                    </h3>
                    {photo.caption && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div>
                    {photo.project && (
                      <Link
                        href={`/projects/${photo.project.id}`}
                        className="font-semibold text-slate-200 hover:text-brand-400"
                      >
                        {photo.project.code} — {photo.project.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {photo.siteReport && (
                      <span className="font-mono text-[11px] text-sky-400">
                        {photo.siteReport.reportNumber}
                      </span>
                    )}
                    <span>By {photo.uploadedBy?.name || "Site Team"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SUBMIT DAILY / WEEKLY SITE REPORT */}
      {showNewReportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base text-white">
                  Submit Daily / Weekly Site Report
                </h3>
              </div>
              <button
                onClick={() => setShowNewReportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateReport}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    value={selectedReportProjectId}
                    onChange={(e) => setSelectedReportProjectId(e.target.value)}
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
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Site Location
                  </label>
                  <select
                    name="siteId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {selectedReportProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Active Phase
                  </label>
                  <select
                    name="phaseId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {selectedReportProject?.phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        Phase {ph.sequenceOrder}: {ph.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Report Type
                  </label>
                  <select
                    name="reportType"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    <option value="DAILY">Daily Report</option>
                    <option value="WEEKLY">Weekly Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Weather Condition
                  </label>
                  <select
                    name="weatherCondition"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(SITE_REPORT_WEATHER_STYLES).map(
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
                    Direct Workers On Site
                  </label>
                  <input
                    type="number"
                    name="workersPresentCount"
                    defaultValue={48}
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Subcontractor Workers
                  </label>
                  <input
                    type="number"
                    name="subcontractorWorkersCount"
                    defaultValue={14}
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Work Completed Today *
                </label>
                <textarea
                  name="workCompletedSummary"
                  rows={2}
                  required
                  placeholder="Describe structural, masonry, or MEP works completed during this shift..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Work Planned for Next Shift *
                </label>
                <textarea
                  name="workPlannedNext"
                  rows={2}
                  required
                  placeholder="Describe scheduled concrete pours, inspections, or trade activities for tomorrow..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Materials Received Today
                  </label>
                  <input
                    type="text"
                    name="materialsReceivedNote"
                    placeholder="e.g. 200 bags Bamburi 42.5N, 15T Devki T16 Rebar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Equipment & Plant Utilized
                  </label>
                  <input
                    type="text"
                    name="equipmentUsedNote"
                    placeholder="e.g. Tower Crane #1 (8 hrs), Concrete Pump (5 hrs)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Safety Toolbox Talk Topic
                  </label>
                  <input
                    type="text"
                    name="safetyToolboxTalkTopic"
                    defaultValue="Working at Height & PPE Harness Check"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Safety Incidents Count
                  </label>
                  <input
                    type="number"
                    name="safetyIncidentsCount"
                    defaultValue={0}
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Progress Gain Today (%)
                  </label>
                  <input
                    type="number"
                    name="overallProgressDelta"
                    step="0.1"
                    defaultValue={1.0}
                    min={0}
                    max={25}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewReportModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit Site Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW / SIGN-OFF SITE REPORT */}
      {reviewingReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Review {reviewingReport.reportNumber}
              </h3>
              <button
                onClick={() => setReviewingReport(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewReport} className="p-6 space-y-4 text-xs">
              <input
                type="hidden"
                name="reportId"
                value={reviewingReport.id}
              />
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Verification Status
                </label>
                <select
                  name="status"
                  defaultValue={reviewingReport.status}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                >
                  {Object.entries(SITE_REPORT_STATUS_STYLES).map(([k, val]) => (
                    <option key={k} value={k}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Manager / Resident Engineer Sign-Off Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={reviewingReport.notes || ""}
                  placeholder="Add verification remarks..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isPending ? "Saving..." : "Confirm Sign-Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD SITE PHOTO */}
      {showNewPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base text-white">
                  Add Timestamped Site Photo Evidence
                </h3>
              </div>
              <button
                onClick={() => setShowNewPhotoModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    value={selectedPhotoProjectId}
                    onChange={(e) => setSelectedPhotoProjectId(e.target.value)}
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
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Photo Category *
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {Object.entries(SITE_PHOTO_CATEGORY_STYLES).map(
                      ([k, val]) => (
                        <option key={k} value={k}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Site Location
                  </label>
                  <select
                    name="siteId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  >
                    {selectedPhotoProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Grid / Floor Location Tag *
                  </label>
                  <input
                    type="text"
                    name="locationTag"
                    required
                    placeholder="e.g. Block A — 9th Floor Column C4"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Photo Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Pre-pour starter bar lap inspection on Column C4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Engineering Caption / Observation
                </label>
                <textarea
                  name="caption"
                  rows={2}
                  placeholder="Optional technical description..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewPhotoModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Site Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
