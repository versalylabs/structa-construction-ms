"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Truck,
  ArrowUpRight,
  X,
  ClipboardList,
} from "lucide-react";
import {
  assignProjectMaterialRequirementAction,
  createMaterialCatalogItemAction,
} from "@/app/actions/materials-suppliers";
import {
  MATERIAL_CATEGORY_STYLES,
  STOCK_STATUS_STYLES,
  cn,
  formatCurrency,
} from "@/lib/utils";

interface MaterialCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  standardUnitCost: number;
  minimumReorderLevel: number;
  specification: string | null;
  status: string;
  preferredSupplier: {
    id: string;
    code: string;
    name: string;
    phone: string;
  } | null;
  projectStocks: {
    id: string;
    projectId: string;
    requiredQuantity: number;
    receivedQuantity: number;
    usedQuantity: number;
    wastageQuantity: number;
    remainingQuantity: number;
    totalCost: number;
    status: string;
    project: { id: string; code: true | string; name: string };
  }[];
}

interface ProjectRequirementItem {
  id: string;
  projectId: string;
  siteId: string | null;
  materialId: string;
  requiredQuantity: number;
  requestedQuantity: number;
  orderedQuantity: number;
  receivedQuantity: number;
  usedQuantity: number;
  wastageQuantity: number;
  remainingQuantity: number;
  reorderLevel: number;
  unitCost: number;
  totalCost: number;
  status: string;
  notes: string | null;
  project: { id: string; code: string; name: string };
  site: { id: string; code: string; name: string } | null;
  material: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    standardUnitCost: number;
  };
}

interface MaterialsClientProps {
  materials: MaterialCatalogItem[];
  suppliers: { id: string; code: string; name: string; category: string }[];
  projects: {
    id: string;
    code: string;
    name: string;
    sites: { id: string; code: string; name: string }[];
  }[];
  projectStocks: ProjectRequirementItem[];
  currency: string;
  canManageMaterials: boolean;
  initialCategoryFilter: string;
  initialTab: "catalog" | "requirements";
}

export function MaterialsClient({
  materials,
  suppliers,
  projects,
  projectStocks,
  currency,
  canManageMaterials,
  initialCategoryFilter,
  initialTab,
}: MaterialsClientProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "requirements">(
    initialTab
  );
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [showAssignReqModal, setShowAssignReqModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id || ""
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    materials[0]?.id || ""
  );
  const [unitCostInput, setUnitCostInput] = useState<number>(
    materials[0]?.standardUnitCost || 780
  );

  const filteredMaterials = materials.filter((m) => {
    const matchesCat =
      categoryFilter === "ALL" || m.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.specification?.toLowerCase().includes(q) ?? false) ||
      (m.preferredSupplier?.name.toLowerCase().includes(q) ?? false);
    return matchesCat && matchesSearch;
  });

  const filteredRequirements = projectStocks.filter((ps) => {
    const matchesProject =
      projectFilter === "ALL" || ps.projectId === projectFilter;
    const matchesCat =
      categoryFilter === "ALL" || ps.material.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ps.material.code.toLowerCase().includes(q) ||
      ps.material.name.toLowerCase().includes(q) ||
      ps.project.name.toLowerCase().includes(q);
    return matchesProject && matchesCat && matchesSearch;
  });

  // Top KPIs
  const totalDeliveredValue = projectStocks.reduce(
    (s, ps) => s + ps.totalCost,
    0
  );
  const totalPlannedRequirementValue = projectStocks.reduce(
    (s, ps) => s + ps.requiredQuantity * ps.unitCost,
    0
  );
  const lowOrCriticalCount = projectStocks.filter(
    (ps) => ps.status === "LOW_STOCK" || ps.status === "CRITICAL_SHORTAGE"
  ).length;

  function handleCreateMaterial(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createMaterialCatalogItemAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: "Added construction material to the master catalog.",
        });
        setShowAddCatalogModal(false);
      }
    });
  }

  function handleAssignRequirement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await assignProjectMaterialRequirementAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            "Updated project material requirement and synchronized site stock ledger.",
        });
        setShowAssignReqModal(false);
      }
    });
  }

  const activeModalProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Phase 5 • Construction Materials & Requirements</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Materials Catalog & Project Requirements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Standardized construction materials catalog, KEBS specifications, preferred suppliers, and project material requirement schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/materials/stock"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Site Stock & Consumption Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/procurement/suppliers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suppliers ({suppliers.length})</span>
          </Link>

          {canManageMaterials && (
            <>
              <button
                type="button"
                onClick={() => setShowAssignReqModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Assign Project Requirement</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddCatalogModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors shadow-lg shadow-brand-500/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Catalog Material</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Master Catalog Items
            </span>
            <Package className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {materials.length} Materials
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {Object.keys(MATERIAL_CATEGORY_STYLES).length} standardized trade categories
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Material Requirements
            </span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {formatCurrency(totalPlannedRequirementValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Planned material value across {projectStocks.length} site allocations
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Materials Delivered to Sites
            </span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-2 font-mono">
            {formatCurrency(totalDeliveredValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Received Quantity × Unit Rate across active sites
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Reorder & Shortage Alerts
            </span>
            <AlertTriangle
              className={cn(
                "w-4 h-4",
                lowOrCriticalCount > 0 ? "text-amber-400" : "text-emerald-400"
              )}
            />
          </div>
          <p
            className={cn(
              "text-2xl font-bold mt-2",
              lowOrCriticalCount > 0 ? "text-amber-400" : "text-emerald-400"
            )}
          >
            {lowOrCriticalCount} Site Alert{lowOrCriticalCount === 1 ? "" : "s"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            <Link
              href="/materials/stock?status=LOW_STOCK"
              className="text-brand-400 hover:underline"
            >
              Inspect low/critical site stock →
            </Link>
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs + Filter Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-colors",
              activeTab === "catalog"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            Master Materials Catalog ({materials.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requirements")}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-colors",
              activeTab === "requirements"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            Project Material Requirements ({projectStocks.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search material code, cement/steel spec, supplier, or project..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {activeTab === "requirements" && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="ALL">All Material Categories</option>
            {Object.entries(MATERIAL_CATEGORY_STYLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: MASTER MATERIALS CATALOG */}
      {activeTab === "catalog" && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Material Code</th>
                  <th className="py-3 px-4">Material Name & Specification</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Benchmark Rate</th>
                  <th className="py-3 px-4">Preferred Supplier</th>
                  <th className="py-3 px-4 text-right">Active Projects</th>
                  <th className="py-3 px-4 text-right">Total Site Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No construction materials match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((mat) => {
                    const catStyle =
                      MATERIAL_CATEGORY_STYLES[mat.category] ||
                      MATERIAL_CATEGORY_STYLES.CEMENT_BINDERS;
                    const totalRemainingAcrossSites = mat.projectStocks.reduce(
                      (s, ps) => s + ps.remainingQuantity,
                      0
                    );
                    const totalRequiredAcrossSites = mat.projectStocks.reduce(
                      (s, ps) => s + ps.requiredQuantity,
                      0
                    );

                    return (
                      <tr
                        key={mat.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                          {mat.code}
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="font-semibold text-white">
                            {mat.name}
                          </div>
                          {mat.specification && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {mat.specification}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                              catStyle.badge
                            )}
                          >
                            {catStyle.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {mat.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {formatCurrency(mat.standardUnitCost, currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          {mat.preferredSupplier ? (
                            <div>
                              <Link
                                href="/procurement/suppliers"
                                className="font-medium text-cyan-300 hover:underline"
                              >
                                {mat.preferredSupplier.name}
                              </Link>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {mat.preferredSupplier.code} •{" "}
                                {mat.preferredSupplier.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-semibold text-slate-200">
                            {mat.projectStocks.length} Project
                            {mat.projectStocks.length === 1 ? "" : "s"}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Req: {totalRequiredAcrossSites.toLocaleString()}{" "}
                            {mat.unit}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-emerald-400">
                            {totalRemainingAcrossSites.toLocaleString()}{" "}
                            {mat.unit}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Min Reorder: {mat.minimumReorderLevel} {mat.unit}
                          </div>
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

      {/* TAB 2: PROJECT MATERIAL REQUIREMENTS MATRIX (Section 14) */}
      {activeTab === "requirements" && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Material & Spec</th>
                  <th className="py-3 px-4">Project & Site</th>
                  <th className="py-3 px-4 text-right">Required Qty</th>
                  <th className="py-3 px-4 text-right">Requested</th>
                  <th className="py-3 px-4 text-right">Ordered</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Used / Wastage</th>
                  <th className="py-3 px-4 text-right">Remaining Stock</th>
                  <th className="py-3 px-4 text-right">Delivered Cost</th>
                  <th className="py-3 px-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredRequirements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No project material requirements match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredRequirements.map((ps) => {
                    const stStyle =
                      STOCK_STATUS_STYLES[ps.status] ||
                      STOCK_STATUS_STYLES.ADEQUATE;
                    const catStyle =
                      MATERIAL_CATEGORY_STYLES[ps.material.category] ||
                      MATERIAL_CATEGORY_STYLES.CEMENT_BINDERS;

                    return (
                      <tr
                        key={ps.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-mono text-[11px] font-bold text-brand-400">
                            {ps.material.code}
                          </span>
                          <div className="font-semibold text-white">
                            {ps.material.name}
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1",
                              catStyle.badge
                            )}
                          >
                            {catStyle.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            href={`/projects/${ps.project.id}`}
                            className="font-medium text-slate-200 hover:text-brand-400 flex items-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ps.project.name}</span>
                          </Link>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {ps.site ? ps.site.name : ps.project.code}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {ps.requiredQuantity.toLocaleString()} {ps.material.unit}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {ps.requestedQuantity.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-cyan-300">
                          {ps.orderedQuantity.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-emerald-300 font-semibold">
                          {ps.receivedQuantity.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className="text-amber-300">
                            {ps.usedQuantity.toLocaleString()}
                          </span>
                          {ps.wastageQuantity > 0 && (
                            <span className="block text-[10px] text-rose-400">
                              +{ps.wastageQuantity.toLocaleString()} waste
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {ps.remainingQuantity.toLocaleString()} {ps.material.unit}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                          {formatCurrency(ps.totalCost, currency)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                              stStyle.badge
                            )}
                          >
                            {stStyle.label}
                          </span>
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

      {/* MODAL: Add Catalog Material */}
      {showAddCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Add Construction Material to Catalog
                </h3>
                <p className="text-xs text-slate-400">
                  Register standardized item rate, unit, and preferred supplier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCatalogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Material Code
                  </label>
                  <input
                    name="code"
                    placeholder="Auto (MAT-CEM-004)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Material Category *
                  </label>
                  <select
                    name="category"
                    defaultValue="CEMENT_BINDERS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {Object.entries(MATERIAL_CATEGORY_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Material Name & Grade *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Simba Cement 32.5R (50kg Bag) or BRC Mesh A142"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    defaultValue="Bags"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Tonnes">Tonnes</option>
                    <option value="kg">kg</option>
                    <option value="m³">m³</option>
                    <option value="m²">m²</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Lengths">Lengths</option>
                    <option value="Litres">Litres</option>
                    <option value="Rolls">Rolls</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Standard Rate ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="standardUnitCost"
                    required
                    defaultValue={800}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Default Reorder Level
                  </label>
                  <input
                    type="number"
                    name="minimumReorderLevel"
                    defaultValue={100}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preferred Supplier
                </label>
                <select
                  name="preferredSupplierId"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                >
                  <option value="">-- Select Preferred Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  KEBS / Engineering Specification
                </label>
                <input
                  name="specification"
                  placeholder="e.g. KEBS KS EAS 18-1 Certified"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCatalogModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950"
                >
                  {isPending ? "Saving..." : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Project Material Requirement */}
      {showAssignReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Assign Project Material Requirement & Initial Stock
                </h3>
                <p className="text-xs text-slate-400">
                  Link a catalog material to a project/site with required, received, and consumed quantities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignReqModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignRequirement} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    name="projectId"
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
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
                    Construction Site
                  </label>
                  <select
                    name="siteId"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {activeModalProject?.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catalog Material *
                </label>
                <select
                  name="materialId"
                  required
                  value={selectedMaterialId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setSelectedMaterialId(mId);
                    const found = materials.find((m) => m.id === mId);
                    if (found) setUnitCostInput(found.standardUnitCost);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} ({formatCurrency(m.standardUnitCost, currency)}/{m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Required Qty *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="requiredQuantity"
                    required
                    defaultValue={1000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Requested Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="requestedQuantity"
                    defaultValue={500}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ordered Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="orderedQuantity"
                    defaultValue={500}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-300 mb-1">
                    Received at Site
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="receivedQuantity"
                    defaultValue={400}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Used Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="usedQuantity"
                    defaultValue={150}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit Rate ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitCost"
                    required
                    value={unitCostInput}
                    onChange={(e) =>
                      setUnitCostInput(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Site Store Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    defaultValue={50}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Site Store Notes
                  </label>
                  <input
                    name="notes"
                    placeholder="Storage bay or call-off schedule..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignReqModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950"
                >
                  {isPending ? "Saving..." : "Save Project Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
