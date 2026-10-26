"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Clock,
  HardHat,
  CreditCard,
  X,
  CalendarCheck,
  Briefcase,
} from "lucide-react";
import {
  createSiteWorkerAction,
  recordWorkerAttendanceAndPaymentAction,
} from "@/app/actions/workforce-equipment";
import {
  WORKER_CATEGORY_STYLES,
  WORKER_PAYMENT_STATUS_STYLES,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface WorkerItem {
  id: string;
  workerCode: string;
  fullName: string;
  nationalId: string | null;
  phone: string;
  workerCategory: string;
  tradeRole: string;
  dailyRate: number;
  overtimeHourlyRate: number;
  daysWorked: number;
  overtimeHours: number;
  totalEarned: number;
  totalPaid: number;
  unpaidBalance: number;
  paymentStatus: string;
  status: string;
  notes: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
}

interface AttendanceLogItem {
  id: string;
  attendanceDate: string;
  daysCredited: number;
  overtimeHours: number;
  dailyWageAmount: number;
  workAreaOrActivity: string;
  notes: string | null;
  createdAt: string;
  worker: {
    id: string;
    workerCode: string;
    fullName: string;
    tradeRole: string;
  };
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  recordedBy: { id: string; name: string; role: string } | null;
}

interface WorkforceClientProps {
  workers: WorkerItem[];
  attendanceLogs: AttendanceLogItem[];
  projects: {
    id: string;
    code: string;
    name: string;
    sites: { id: string; code: string; name: string }[];
  }[];
  initialProjectId: string;
  initialCategory: string;
  currency: string;
  canManageWorkforce: boolean;
}

export function WorkforceClient({
  workers,
  attendanceLogs,
  projects,
  initialProjectId,
  initialCategory,
  currency,
  canManageWorkforce,
}: WorkforceClientProps) {
  const [activeTab, setActiveTab] = useState<"muster" | "attendance">("muster");
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [activeWorkerForMuster, setActiveWorkerForMuster] =
    useState<WorkerItem | null>(null);

  const [formProjectId, setFormProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [shiftDays, setShiftDays] = useState<number>(1);
  const [shiftOtHours, setShiftOtHours] = useState<number>(0);
  const [shiftPayment, setShiftPayment] = useState<number>(0);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredWorkers = workers.filter((w) => {
    if (selectedProjectId !== "ALL" && w.project.id !== selectedProjectId) {
      return false;
    }
    if (selectedCategory !== "ALL" && w.workerCategory !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.workerCode.toLowerCase().includes(q) ||
        w.fullName.toLowerCase().includes(q) ||
        w.tradeRole.toLowerCase().includes(q) ||
        w.phone.toLowerCase().includes(q) ||
        w.project.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI metrics
  const totalWorkers = filteredWorkers.length;
  const totalManDays = filteredWorkers.reduce(
    (sum, w) => sum + w.daysWorked,
    0
  );
  const totalOtHours = filteredWorkers.reduce(
    (sum, w) => sum + w.overtimeHours,
    0
  );
  const totalLabourEarned = filteredWorkers.reduce(
    (sum, w) => sum + w.totalEarned,
    0
  );
  const totalLabourPaid = filteredWorkers.reduce(
    (sum, w) => sum + w.totalPaid,
    0
  );
  const totalUnpaidMuster = filteredWorkers.reduce(
    (sum, w) => sum + w.unpaidBalance,
    0
  );

  const selectedFormProject = projects.find((p) => p.id === formProjectId);

  const shiftWagePreview = activeWorkerForMuster
    ? shiftDays * activeWorkerForMuster.dailyRate +
      shiftOtHours * activeWorkerForMuster.overtimeHourlyRate
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400">
            <Users className="h-3.5 w-3.5" />
            <span>Phase 7 • Site Workforce, Daily Muster Roll & Labour Costs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Workforce & Daily Muster Roll Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track skilled artisans, foremen, plant operators, and casual labour
            attendance with automatic Project Labour Budget synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/people/contractors"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Briefcase className="h-3.5 w-3.5 text-brand-400" />
            <span>Subcontractors</span>
          </Link>
          {canManageWorkforce && (
            <button
              type="button"
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Enroll Site Worker</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-xs flex items-center justify-between",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          )}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Active Site Workers
          </span>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {totalWorkers}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Enrolled on site muster rolls
          </p>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300">
            Man-Days & Overtime
          </span>
          <p className="text-xl font-bold font-mono text-sky-300 mt-1">
            {totalManDays.toLocaleString()} Days
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            +{totalOtHours.toLocaleString()} Overtime Hrs
          </p>
        </div>

        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-brand-300">
            Total Labour Accrued
          </span>
          <p className="text-xl font-bold font-mono text-brand-300 mt-1">
            {formatCurrency(totalLabourEarned, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Charged to project labour budgets
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
            Wages Disbursed
          </span>
          <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {formatCurrency(totalLabourPaid, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Settled via M-Pesa / Cash Muster
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
            Unpaid Muster Balance
          </span>
          <p className="text-xl font-bold font-mono text-amber-300 mt-1">
            {formatCurrency(totalUnpaidMuster, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Due on Friday muster payout
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("muster")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              activeTab === "muster"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <HardHat className="h-3.5 w-3.5" />
            <span>Workforce & Muster Roll ({filteredWorkers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
              activeTab === "attendance"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Daily Shift Attendance Logs ({attendanceLogs.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">All Worker Categories</option>
            {Object.entries(WORKER_CATEGORY_STYLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worker, trade, phone..."
              className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: WORKFORCE & MUSTER ROLL */}
      {activeTab === "muster" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Worker & M-Pesa Contact</th>
                  <th className="py-3.5 px-4">Category & Trade Role</th>
                  <th className="py-3.5 px-4">Project & Site</th>
                  <th className="py-3.5 px-4 text-right">Daily / OT Rate</th>
                  <th className="py-3.5 px-4 text-right">Days & OT Worked</th>
                  <th className="py-3.5 px-4 text-right">Earned vs Paid</th>
                  <th className="py-3.5 px-4">Muster Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No workers match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((w) => {
                    const catStyle =
                      WORKER_CATEGORY_STYLES[w.workerCategory] ||
                      WORKER_CATEGORY_STYLES.SKILLED_ARTISAN;
                    const payStyle =
                      WORKER_PAYMENT_STATUS_STYLES[w.paymentStatus] ||
                      WORKER_PAYMENT_STATUS_STYLES.PARTIALLY_PAID;

                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-slate-800/30 transition-colors align-top"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-400">
                              {w.workerCode}
                            </span>
                            {w.nationalId && (
                              <span className="text-[10px] font-mono text-slate-500">
                                ID: {w.nationalId}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-white mt-0.5">
                            {w.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                            M-Pesa: {w.phone}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded text-[10px] font-medium border",
                              catStyle.badge
                            )}
                          >
                            {catStyle.label}
                          </span>
                          <div className="font-semibold text-slate-100 mt-1">
                            {w.tradeRole}
                          </div>
                          {w.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                              {w.notes}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            href={`/projects/${w.project.id}`}
                            className="font-semibold text-white hover:text-brand-400"
                          >
                            {w.project.name}
                          </Link>
                          <div className="text-[11px] font-mono text-slate-400">
                            {w.site ? w.site.name : w.project.code}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="text-white font-bold">
                            {formatCurrency(w.dailyRate, currency)} / day
                          </div>
                          <div className="text-[10px] text-slate-400">
                            OT: {formatCurrency(w.overtimeHourlyRate, currency)}{" "}
                            / hr
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="text-slate-200 font-bold">
                            {w.daysWorked} Days
                          </div>
                          <div className="text-[11px] text-sky-400">
                            +{w.overtimeHours} hrs OT
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="font-bold text-white">
                            Earned: {formatCurrency(w.totalEarned, currency)}
                          </div>
                          <div className="text-[11px] text-emerald-400">
                            Paid: {formatCurrency(w.totalPaid, currency)}
                          </div>
                          {w.unpaidBalance > 0 && (
                            <div className="text-[11px] text-amber-300 font-semibold">
                              Due: {formatCurrency(w.unpaidBalance, currency)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                              payStyle.badge
                            )}
                          >
                            {payStyle.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canManageWorkforce && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveWorkerForMuster(w);
                                setShiftDays(1);
                                setShiftOtHours(0);
                                setShiftPayment(0);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 px-2.5 py-1 text-[11px] font-semibold text-brand-300"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>Log Shift / Pay</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE LOGS */}
      {activeTab === "attendance" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Shift Date</th>
                  <th className="py-3.5 px-4">Worker & Trade</th>
                  <th className="py-3.5 px-4">Project & Site</th>
                  <th className="py-3.5 px-4">Work Area / Activity</th>
                  <th className="py-3.5 px-4 text-right">Days Credited</th>
                  <th className="py-3.5 px-4 text-right">Overtime</th>
                  <th className="py-3.5 px-4 text-right">Shift Wage Accrued</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatDate(log.attendanceDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-brand-400 font-bold">
                        {log.worker.workerCode}
                      </span>{" "}
                      <span className="font-semibold text-white">
                        {log.worker.fullName}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {log.worker.tradeRole}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">
                        {log.project.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {log.site?.name || log.project.code}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.workAreaOrActivity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">
                      {log.daysCredited} d
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sky-400">
                      +{log.overtimeHours} hrs
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(log.dailyWageAmount, currency)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.recordedBy?.name || "Site Foreman"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Enroll New Site Worker */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Enroll Worker on Site Muster Roll
                </h3>
                <p className="text-xs text-slate-400">
                  Register artisan, operator, or casual worker with daily &
                  overtime wage rates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
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
                  const res = await createSiteWorkerAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: "Enrolled new site worker onto muster roll.",
                    });
                    setShowEnrollModal(false);
                  }
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Worker Code *
                  </label>
                  <input
                    name="workerCode"
                    required
                    defaultValue={`WRK-0${workers.length + 1}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    name="fullName"
                    required
                    placeholder="e.g. Simon Njuguna Kamau"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    M-Pesa Phone Number *
                  </label>
                  <input
                    name="phone"
                    required
                    placeholder="+254 712 000 000"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    National ID Number
                  </label>
                  <input
                    name="nationalId"
                    placeholder="e.g. 29481022"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Worker Category *
                  </label>
                  <select
                    name="workerCategory"
                    defaultValue="SKILLED_ARTISAN"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {Object.entries(WORKER_CATEGORY_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Trade / Specialization Role *
                  </label>
                  <input
                    name="tradeRole"
                    required
                    placeholder="e.g. Grade I Mason / Steel Fixer"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Assigned Project *
                  </label>
                  <select
                    name="projectId"
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Assigned Site
                  </label>
                  <select
                    name="siteId"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {selectedFormProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Daily Wage Rate ({currency}) *
                  </label>
                  <input
                    name="dailyRate"
                    type="number"
                    required
                    defaultValue={2200}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Overtime Rate / Hr ({currency})
                  </label>
                  <input
                    name="overtimeHourlyRate"
                    type="number"
                    defaultValue={320}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Enrolling..." : "Enroll Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Daily Attendance & Muster Payment */}
      {activeWorkerForMuster && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Log Shift / Pay Muster: {activeWorkerForMuster.fullName}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeWorkerForMuster.workerCode} •{" "}
                  {activeWorkerForMuster.tradeRole}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkerForMuster(null)}
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
                  const res = await recordWorkerAttendanceAndPaymentAction(fd);
                  if (res?.error) {
                    setFeedback({ type: "error", message: res.error });
                  } else {
                    setFeedback({
                      type: "success",
                      message: `Updated muster roll & project labour cost for ${activeWorkerForMuster.fullName}.`,
                    });
                    setActiveWorkerForMuster(null);
                  }
                });
              }}
              className="space-y-4"
            >
              <input
                type="hidden"
                name="workerId"
                value={activeWorkerForMuster.id}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Shift Days Credited
                  </label>
                  <input
                    name="daysCredited"
                    type="number"
                    step="0.5"
                    min="0"
                    value={shiftDays}
                    onChange={(e) => setShiftDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Overtime Hours
                  </label>
                  <input
                    name="overtimeHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={shiftOtHours}
                    onChange={(e) => setShiftOtHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Work Area / Construction Activity
                </label>
                <input
                  name="workAreaOrActivity"
                  defaultValue={`${activeWorkerForMuster.tradeRole} — Site Shift`}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-emerald-300 mb-1">
                  Disburse Muster Wage Payment ({currency})
                </label>
                <input
                  name="wagePaymentAmount"
                  type="number"
                  step="1"
                  min="0"
                  value={shiftPayment}
                  onChange={(e) => setShiftPayment(Number(e.target.value))}
                  className="w-full rounded-lg border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
                <span className="text-[10px] text-slate-400">
                  Current Unpaid Balance:{" "}
                  {formatCurrency(
                    activeWorkerForMuster.unpaidBalance,
                    currency
                  )}
                </span>
              </div>

              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 text-xs font-mono flex justify-between">
                <span className="text-slate-300">Shift Wage Accrued:</span>
                <span className="font-bold text-brand-300">
                  {formatCurrency(shiftWagePreview, currency)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveWorkerForMuster(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  {isPending ? "Saving..." : "Confirm Muster Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
