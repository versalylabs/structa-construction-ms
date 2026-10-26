"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  Truck,
  Search,
  Plus,
  Building2,
  MapPin,
  Gauge,
  Fuel,
  ShieldAlert,
  CheckCircle2,
  Clock,
  X,
  Phone,
  UserCheck,
  Calendar,
  Settings,
  DollarSign,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  EQUIPMENT_CATEGORY_STYLES,
  EQUIPMENT_AVAILABILITY_STYLES,
  MAINTENANCE_TYPE_STYLES,
} from "@/lib/utils";
import {
  createEquipmentAssetAction,
  recordEquipmentMaintenanceOrUsageAction,
} from "@/app/actions/workforce-equipment";

interface EquipmentAssetItem {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  ownershipType: string;
  vendorOrLessor: string | null;
  registrationOrSerial: string | null;
  operatorName: string | null;
  operatorPhone: string | null;
  availabilityStatus: string;
  dailyRate: number;
  totalHoursLogged: number;
  fuelLitresLogged: number;
  totalOperatingCost: number;
  nextServiceDueDate: string | null;
  conditionNotes: string | null;
  projectId: string | null;
  siteId: string | null;
  project: { id: string; code: string; name: string } | null;
  site: { id: string; code: true | string; name: string } | null;
}

interface MaintenanceLogItem {
  id: string;
  logNumber: string;
  equipmentId: string;
  projectId: string | null;
  maintenanceType: string;
  title: string;
  description: string | null;
  serviceDate: string;
  nextDueHoursOrDate: string | null;
  costAmount: number;
  technicianOrWorkshop: string;
  status: string;
  equipment: {
    id: string;
    assetCode: string;
    name: string;
    category: string;
    registrationOrSerial: string | null;
  };
  project: { id: string; code: string; name: string } | null;
  recordedBy: { id: string; name: string; role: string } | null;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  sites: { id: string; code: string; name: string }[];
}

interface EquipmentClientProps {
  equipmentAssets: EquipmentAssetItem[];
  maintenanceLogs: MaintenanceLogItem[];
  projects: ProjectOption[];
  initialTab: "fleet" | "maintenance";
  userRole: string;
}

export function EquipmentClient({
  equipmentAssets,
  maintenanceLogs,
  projects,
  initialTab,
}: EquipmentClientProps) {
  const [activeTab, setActiveTab] = useState<"fleet" | "maintenance">(
    initialTab
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedRegisterProjectId, setSelectedRegisterProjectId] = useState(
    projects[0]?.id || ""
  );
  const [selectedAssetForAction, setSelectedAssetForAction] =
    useState<EquipmentAssetItem | null>(null);
  const [selectedActionProjectId, setSelectedActionProjectId] = useState("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredAssets = useMemo(() => {
    return equipmentAssets.filter((asset) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        asset.name.toLowerCase().includes(q) ||
        asset.assetCode.toLowerCase().includes(q) ||
        (asset.registrationOrSerial &&
          asset.registrationOrSerial.toLowerCase().includes(q)) ||
        (asset.operatorName && asset.operatorName.toLowerCase().includes(q));

      const matchesProject =
        projectFilter === "ALL" || asset.projectId === projectFilter;
      const matchesCategory =
        categoryFilter === "ALL" || asset.category === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" || asset.availabilityStatus === statusFilter;

      return (
        matchesSearch && matchesProject && matchesCategory && matchesStatus
      );
    });
  }, [equipmentAssets, search, projectFilter, categoryFilter, statusFilter]);

  const filteredLogs = useMemo(() => {
    return maintenanceLogs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        log.title.toLowerCase().includes(q) ||
        log.logNumber.toLowerCase().includes(q) ||
        log.equipment.name.toLowerCase().includes(q) ||
        log.equipment.assetCode.toLowerCase().includes(q) ||
        log.technicianOrWorkshop.toLowerCase().includes(q);

      const matchesProject =
        projectFilter === "ALL" || log.projectId === projectFilter;

      return matchesSearch && matchesProject;
    });
  }, [maintenanceLogs, search, projectFilter]);

  const kpis = useMemo(() => {
    const deployedCount = equipmentAssets.filter(
      (a) => a.availabilityStatus === "IN_USE"
    ).length;
    const availableCount = equipmentAssets.filter(
      (a) => a.availabilityStatus === "AVAILABLE"
    ).length;
    const maintenanceCount = equipmentAssets.filter(
      (a) => a.availabilityStatus === "UNDER_MAINTENANCE"
    ).length;
    const totalHours = equipmentAssets.reduce(
      (sum, a) => sum + a.totalHoursLogged,
      0
    );
    const totalFuel = equipmentAssets.reduce(
      (sum, a) => sum + a.fuelLitresLogged,
      0
    );
    const totalOperatingCost = equipmentAssets.reduce(
      (sum, a) => sum + a.totalOperatingCost,
      0
    );

    return {
      totalAssets: equipmentAssets.length,
      deployedCount,
      availableCount,
      maintenanceCount,
      totalHours,
      totalFuel,
      totalOperatingCost,
    };
  }, [equipmentAssets]);

  const selectedRegisterProject = useMemo(
    () => projects.find((p) => p.id === selectedRegisterProjectId),
    [projects, selectedRegisterProjectId]
  );

  const selectedActionProject = useMemo(
    () => projects.find((p) => p.id === selectedActionProjectId),
    [projects, selectedActionProjectId]
  );

  function openAssetActionModal(asset: EquipmentAssetItem) {
    setSelectedAssetForAction(asset);
    setSelectedActionProjectId(asset.projectId || "");
  }

  function handleRegisterAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await createEquipmentAssetAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Plant/Equipment asset registered to fleet inventory.",
        });
        setShowRegisterModal(false);
      }
    });
  }

  function handleAssetActionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);

    startTransition(async () => {
      const res = await recordEquipmentMaintenanceOrUsageAction(formData);
      if (res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: "Equipment deployment, engine hours, fuel consumption, and maintenance log updated.",
        });
        setSelectedAssetForAction(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Wrench className="w-4 h-4" />
            <span>Phase 7 • Heavy Plant, Fleet & DOSHS Compliance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Plant & Equipment Registry, Site Deployment & Service Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Track tower cranes, excavators, concrete batching/pumping units, and generators across active sites with engine hour telemetry, diesel logs, and DOSHS statutory inspections.
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
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Plant / Equipment
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Plant Fleet</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {kpis.totalAssets} Units
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-blue-600 font-semibold">
              {kpis.deployedCount} deployed
            </span>{" "}
            • {kpis.availableCount} yard standby
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Under Maintenance</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {kpis.maintenanceCount} Units
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {maintenanceLogs.length} service & DOSHS logs
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Logged Engine Hours</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {kpis.totalHours.toLocaleString()} hrs
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cumulative telemetry hours
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Diesel Fuel Consumed</span>
            <Fuel className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {kpis.totalFuel.toLocaleString()} L
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Site bowser & card issues
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Plant Operating Cost</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(kpis.totalOperatingCost)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Hire + fuel + service costs
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "fleet"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Equipment Fleet ({equipmentAssets.length})
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "maintenance"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Maintenance & DOSHS Logs ({maintenanceLogs.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset code, crane, operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-56"
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

          {activeTab === "fleet" && (
            <>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Categories</option>
                {Object.entries(EQUIPMENT_CATEGORY_STYLES).map(([k, val]) => (
                  <option key={k} value={k}>
                    {val.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Availability</option>
                {Object.entries(EQUIPMENT_AVAILABILITY_STYLES).map(
                  ([k, val]) => (
                    <option key={k} value={k}>
                      {val.label}
                    </option>
                  )
                )}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Equipment Fleet Table */}
      {activeTab === "fleet" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Asset & Serial</th>
                  <th className="py-3.5 px-4">Category & Ownership</th>
                  <th className="py-3.5 px-4">Site Deployment</th>
                  <th className="py-3.5 px-4">Assigned Operator</th>
                  <th className="py-3.5 px-4 text-right">Engine & Fuel</th>
                  <th className="py-3.5 px-4 text-right">Operating Cost</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredAssets.map((asset) => {
                  const catStyle = EQUIPMENT_CATEGORY_STYLES[asset.category] || {
                    label: asset.category,
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                  };
                  const availStyle =
                    EQUIPMENT_AVAILABILITY_STYLES[asset.availabilityStatus] || {
                      label: asset.availabilityStatus,
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                      dot: "bg-slate-400",
                    };

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-amber-600">
                          {asset.assetCode}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {asset.name}
                        </div>
                        {asset.registrationOrSerial && (
                          <div className="text-slate-400 text-[11px]">
                            Reg/SN: {asset.registrationOrSerial}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${catStyle.bg} ${catStyle.text}`}
                        >
                          {catStyle.label}
                        </span>
                        <div className="text-slate-600 font-medium mt-1">
                          {asset.ownershipType === "OWNED"
                            ? "Company Owned"
                            : `Leased (${asset.vendorOrLessor || "External"})`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Rate: {formatCurrency(asset.dailyRate)}/day
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {asset.project ? (
                          <div>
                            <Link
                              href={`/projects/${asset.project.id}`}
                              className="font-semibold text-slate-800 hover:text-amber-600 flex items-center gap-1"
                            >
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{asset.project.code}</span>
                            </Link>
                            <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                              {asset.project.name}
                            </div>
                            {asset.site && (
                              <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span>{asset.site.name}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Central Plant Yard
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {asset.operatorName ? (
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {asset.operatorName}
                            </div>
                            {asset.operatorPhone && (
                              <div className="text-slate-400 text-[11px]">
                                {asset.operatorPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {asset.totalHoursLogged.toLocaleString()} hrs
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Fuel: {asset.fuelLitresLogged.toLocaleString()} L
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(asset.totalOperatingCost)}
                        </div>
                        {asset.nextServiceDueDate && (
                          <div className="text-[11px] text-slate-400">
                            Next Svc: {formatDate(asset.nextServiceDueDate)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${availStyle.bg} ${availStyle.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${availStyle.dot}`}
                          />
                          {availStyle.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openAssetActionModal(asset)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-amber-400" />
                          Log Hours / Service
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Maintenance & DOSHS Inspection Logs */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Log # & Date</th>
                  <th className="py-3.5 px-4">Equipment Asset</th>
                  <th className="py-3.5 px-4">Service Type</th>
                  <th className="py-3.5 px-4">Maintenance / Inspection Scope</th>
                  <th className="py-3.5 px-4">Workshop / Inspector</th>
                  <th className="py-3.5 px-4 text-right">Service Cost</th>
                  <th className="py-3.5 px-4">Next Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredLogs.map((log) => {
                  const typeStyle =
                    MAINTENANCE_TYPE_STYLES[log.maintenanceType] || {
                      label: log.maintenanceType,
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                    };

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-amber-600">
                          {log.logNumber}
                        </div>
                        <div className="text-slate-600 font-medium">
                          {formatDate(log.serviceDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {log.equipment.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {log.equipment.assetCode}{" "}
                          {log.equipment.registrationOrSerial
                            ? `• ${log.equipment.registrationOrSerial}`
                            : ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${typeStyle.bg} ${typeStyle.text}`}
                        >
                          {typeStyle.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-slate-800">
                          {log.title}
                        </div>
                        {log.description && (
                          <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                            {log.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {log.technicianOrWorkshop}
                        </div>
                        {log.project && (
                          <div className="text-[11px] text-slate-400">
                            Site: {log.project.code}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(log.costAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {log.nextDueHoursOrDate || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Register Plant / Equipment Asset */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  Register Heavy Plant or Equipment Asset
                </h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleRegisterAsset}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Equipment Name / Model *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. JCB 3CX Backhoe Loader"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Plant Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {Object.entries(EQUIPMENT_CATEGORY_STYLES).map(
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
                    Ownership Type
                  </label>
                  <select
                    name="ownershipType"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="OWNED">Company Owned</option>
                    <option value="LEASED">External Hire / Leased</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lessor / Vendor (If Leased)
                  </label>
                  <input
                    type="text"
                    name="vendorOrLessor"
                    placeholder="e.g. Panafrican Equipment"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reg Plate / Serial #
                  </label>
                  <input
                    type="text"
                    name="registrationOrSerial"
                    placeholder="e.g. KHMA 412B"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deploy to Project
                  </label>
                  <select
                    name="projectId"
                    value={selectedRegisterProjectId}
                    onChange={(e) =>
                      setSelectedRegisterProjectId(e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Central Plant Yard (Standby) --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site Location
                  </label>
                  <select
                    name="siteId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Main Site --</option>
                    {selectedRegisterProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Daily Hire/Charge Rate (KES) *
                  </label>
                  <input
                    type="number"
                    name="dailyRate"
                    required
                    defaultValue={28000}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Operator
                  </label>
                  <input
                    type="text"
                    name="operatorName"
                    placeholder="e.g. Simon Kiprop"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Operator Phone
                  </label>
                  <input
                    type="text"
                    name="operatorPhone"
                    placeholder="+254 722 000 000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Registering..." : "Register Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Log Hours, Fuel, Deployment or Maintenance */}
      {selectedAssetForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-400 font-mono font-bold">
                  {selectedAssetForAction.assetCode} •{" "}
                  {selectedAssetForAction.registrationOrSerial || "Plant"}
                </div>
                <h3 className="font-bold text-base">
                  {selectedAssetForAction.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssetForAction(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAssetActionSubmit}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <input
                type="hidden"
                name="equipmentId"
                value={selectedAssetForAction.id}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Availability Status
                  </label>
                  <select
                    name="availabilityStatus"
                    defaultValue={selectedAssetForAction.availabilityStatus}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {Object.entries(EQUIPMENT_AVAILABILITY_STYLES).map(
                      ([k, val]) => (
                        <option key={k} value={k}>
                          {val.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Project
                  </label>
                  <select
                    name="projectId"
                    value={selectedActionProjectId}
                    onChange={(e) => setSelectedActionProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Central Plant Yard --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Site
                  </label>
                  <select
                    name="siteId"
                    defaultValue={selectedAssetForAction.siteId || ""}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Main Site --</option>
                    {selectedActionProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Add Engine Hours Worked
                  </label>
                  <input
                    type="number"
                    name="hoursAdded"
                    step="0.5"
                    defaultValue={8}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Add Diesel Fuel Issued (Litres)
                  </label>
                  <input
                    type="number"
                    name="fuelAdded"
                    defaultValue={45}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="font-bold text-slate-800">
                  Optional: Record Service / DOSHS Inspection Log
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Maintenance Type
                    </label>
                    <select
                      name="maintenanceType"
                      defaultValue="PREVENTIVE"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {Object.entries(MAINTENANCE_TYPE_STYLES).map(
                        ([k, val]) => (
                          <option key={k} value={k}>
                            {val.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Service Cost (KES)
                    </label>
                    <input
                      type="number"
                      name="costAmount"
                      defaultValue={0}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Service / Inspection Title (Leave blank if only logging hours/fuel)
                  </label>
                  <input
                    type="text"
                    name="maintenanceTitle"
                    placeholder="e.g. 250-Hour Hydraulic Filter & Oil Service"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Workshop / Inspector
                    </label>
                    <input
                      type="text"
                      name="technicianOrWorkshop"
                      placeholder="e.g. Mantrac Kenya Field Service"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Next Service Due Note
                    </label>
                    <input
                      type="text"
                      name="nextDueHoursOrDate"
                      placeholder="e.g. Due at 1,500 Engine Hours"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForAction(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Telemetry & Service Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
