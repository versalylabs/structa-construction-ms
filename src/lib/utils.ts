import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "KSh"): string {
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

export function formatKES(amount: number): string {
  return formatCurrency(amount, "KSh");
}

export function formatCompactKES(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}KSh ${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}KSh ${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}KSh ${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}KSh ${abs.toLocaleString("en-KE")}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(d);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(d);
}

export const PROJECT_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PLANNING: {
    label: "Planning",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  ACTIVE: {
    label: "Active",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  DELAYED: {
    label: "Delayed",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  ON_HOLD: {
    label: "On Hold",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const TASK_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  BLOCKED: {
    label: "Blocked",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

export const TASK_PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-800 text-slate-400 border-slate-700",
  MEDIUM: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  HIGH: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CRITICAL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export const BOQ_SECTION_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PRELIMINARIES: {
    label: "Preliminaries & General",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  SUBSTRUCTURE: {
    label: "Substructure & Earthworks",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  SUPERSTRUCTURE_CONCRETE: {
    label: "Superstructure RC Works",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  MASONRY_WALLING: {
    label: "Masonry & Walling",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  STEELWORK: {
    label: "Structural Steel & Rebar",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  ROOFING: {
    label: "Roofing & Waterproofing",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  FINISHES: {
    label: "Joinery, Tiling & Finishes",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  MEP_INSTALLATIONS: {
    label: "Electrical, Plumbing & HVAC",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  EXTERNAL_WORKS: {
    label: "External & Civil Works",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

export const BUDGET_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  MATERIALS: {
    label: "Materials",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  LABOUR: {
    label: "Labour & Workforce",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  EQUIPMENT: {
    label: "Equipment & Plant",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  TRANSPORT: {
    label: "Transport & Logistics",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  SUBCONTRACTORS: {
    label: "Subcontractors",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  PROFESSIONAL_FEES: {
    label: "Professional Fees",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  PERMITS: {
    label: "Permits & NCA/NEMA",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  UTILITIES: {
    label: "Site Utilities (Power/Water)",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  MISCELLANEOUS: {
    label: "Contingency & Misc",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const BUDGET_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  WITHIN_BUDGET: {
    label: "Within Budget",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  WATCH: {
    label: "Watch (>75%)",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  OVERRUN_RISK: {
    label: "Overrun Risk",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  EXCEEDED: {
    label: "Budget Exceeded",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export function computeBudgetLineStatus(
  allocatedBudget: number,
  committedCost: number,
  actualCost: number,
  alertThresholdPct = 85
): string {
  if (allocatedBudget <= 0) return "WITHIN_BUDGET";
  const highestExposure = Math.max(committedCost, actualCost);
  const exposurePct = (highestExposure / allocatedBudget) * 100;
  if (actualCost > allocatedBudget || committedCost > allocatedBudget) {
    return "EXCEEDED";
  }
  if (exposurePct >= alertThresholdPct) {
    return "OVERRUN_RISK";
  }
  if (exposurePct >= 75) {
    return "WATCH";
  }
  return "WITHIN_BUDGET";
}

export const MATERIAL_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  CEMENT_BINDERS: {
    label: "Cement & Binders",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  STEEL_REBAR: {
    label: "Structural Steel & Rebar",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  AGGREGATES_SAND: {
    label: "Sand, Ballast & Quarry",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  MASONRY_BLOCKS: {
    label: "Stone, Bricks & Blocks",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  TIMBER_FORMWORK: {
    label: "Timber & Formwork",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  ROOFING_WATERPROOFING: {
    label: "Roofing & Waterproofing",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  TILES_FINISHES: {
    label: "Tiles, Joinery & Finishes",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  PAINTS_COATINGS: {
    label: "Paints & Chemicals",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  },
  PLUMBING_PIPES: {
    label: "Plumbing & Sanitary",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  ELECTRICAL_CABLES: {
    label: "Electrical & Conduits",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
};

export const SUPPLIER_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  CEMENT_CONCRETE: {
    label: "Cement & Ready-Mix",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  STEEL_METALS: {
    label: "Steel Mills & Rebar",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  AGGREGATES_QUARRY: {
    label: "Quarry, Sand & Ballast",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  TIMBER_ROOFING: {
    label: "Timber, Trusses & Roofing",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  TILES_FINISHES: {
    label: "Tiles, Sanitary & Finishes",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  PAINTS_CHEMICALS: {
    label: "Paints & Admixtures",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  },
  ELECTRICAL_MEP: {
    label: "Electrical & Switchgear",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  PLUMBING_WATER: {
    label: "Pipes, Pumps & Water",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  GENERAL_HARDWARE: {
    label: "General Builders Hardware",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const STOCK_STATUS_STYLES: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  FULLY_STOCKED: {
    label: "Fully Stocked",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  ADEQUATE: {
    label: "Adequate Stock",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
  },
  LOW_STOCK: {
    label: "Low Stock (Reorder)",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  CRITICAL_SHORTAGE: {
    label: "Critical Shortage",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
};

export function computeMaterialStockStatus(
  remainingQuantity: number,
  reorderLevel: number,
  requiredQuantity: number,
  receivedQuantity: number
): string {
  if (remainingQuantity <= 0 || remainingQuantity <= reorderLevel * 0.4) {
    return "CRITICAL_SHORTAGE";
  }
  if (remainingQuantity <= reorderLevel) {
    return "LOW_STOCK";
  }
  if (requiredQuantity > 0 && receivedQuantity >= requiredQuantity) {
    return "FULLY_STOCKED";
  }
  return "ADEQUATE";
}

export const MATERIAL_REQUEST_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  DRAFT: {
    label: "Draft",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  SUBMITTED: {
    label: "Pending Approval",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  APPROVED: {
    label: "Approved (Ready for PO)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  ORDERED: {
    label: "PO Issued",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  RECEIVED: {
    label: "Fully Received",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-slate-800 text-slate-500 border-slate-700",
  },
};

export const PURCHASE_ORDER_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  DRAFT: {
    label: "Draft",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  ISSUED: {
    label: "Issued to Supplier",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  APPROVED: {
    label: "Approved & Dispatched",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  PARTIALLY_DELIVERED: {
    label: "Partially Delivered",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  DELIVERED: {
    label: "Delivered in Full",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  INVOICED: {
    label: "Supplier Invoiced",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  PAID: {
    label: "Settled & Paid",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const GRN_INSPECTION_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  ACCEPTED: {
    label: "Accepted (100% QA Pass)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PARTIAL_ACCEPTANCE: {
    label: "Partial / Shortfall Logged",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  REJECTED_DAMAGED: {
    label: "Rejected (Damaged Batch)",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const WORKER_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  FOREMAN_SUPERVISOR: {
    label: "Foreman / Gang Leader",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  SKILLED_ARTISAN: {
    label: "Skilled Artisan",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  PLANT_OPERATOR: {
    label: "Plant / Crane Operator",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  TECHNICIAN_MEP: {
    label: "MEP Technician",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  CASUAL_LABOUR: {
    label: "General Casual Labour",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  SITE_SECURITY_STAFF: {
    label: "Site Support & Security",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const WORKER_PAYMENT_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PAID: {
    label: "Muster Settled",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PARTIALLY_PAID: {
    label: "Current Week Accrued",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  UNPAID_MUSTER: {
    label: "Unpaid Muster Due",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const SUBCONTRACTOR_SPECIALIZATION_STYLES: Record<
  string,
  { label: string; badge: string; bg: string; text: string }
> = {
  ELECTRICAL_SOLAR: {
    label: "Electrical, HV/LV & Solar",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  PLUMBING_MECHANICAL: {
    label: "Plumbing, HVAC & Fire",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
  LIFTS_ESCALATORS: {
    label: "High-Speed Lifts & Hoists",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  ROOFING_WATERPROOFING: {
    label: "Roofing & Waterproofing",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  GLAZING_ALUMINIUM: {
    label: "Curtain Wall & Glazing",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  MASONRY_PLASTERING: {
    label: "Masonry & Plastering",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  PAINTING_DECORATING: {
    label: "Painting & Acoustic Ceilings",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  EARTHWORKS_PILING: {
    label: "Bored Piling & Anchors",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

export const SUBCONTRACTOR_STATUS_STYLES: Record<
  string,
  { label: string; badge: string; bg: string; text: string; dot: string }
> = {
  ACTIVE_ON_SITE: {
    label: "Active On Site",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  ACTIVE: {
    label: "Active On Site",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  MOBILIZING: {
    label: "Mobilizing",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  COMPLETED: {
    label: "Package Completed",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    bg: "bg-teal-50",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
  ON_HOLD: {
    label: "On Hold",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

export const EQUIPMENT_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string; bg: string; text: string }
> = {
  TOWER_MOBILE_CRANE: {
    label: "Tower & Mobile Cranes",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  EXCAVATOR_EARTHMOVING: {
    label: "Excavators & Earthmoving",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  CONCRETE_BATCH_PUMP: {
    label: "Concrete Pumps & Mixers",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  TIPPER_HAULAGE_TRUCK: {
    label: "Tippers & Low-Loaders",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  GENERATOR_COMPRESSOR: {
    label: "Generators & Compressors",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  COMPACTOR_ROLLER: {
    label: "Rollers & Compactors",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
  SCAFFOLDING_FORMWORK: {
    label: "Hoists & Heavy Formwork",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    bg: "bg-slate-100",
    text: "text-slate-700",
  },
};

export const EQUIPMENT_AVAILABILITY_STYLES: Record<
  string,
  { label: string; badge: string; bg: string; text: string; dot: string }
> = {
  DEPLOYED_ACTIVE: {
    label: "Deployed & Operating",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  IN_USE: {
    label: "Deployed & Operating",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  AVAILABLE_YARD: {
    label: "Available at Central Yard",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  AVAILABLE: {
    label: "Available at Central Yard",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  UNDER_MAINTENANCE: {
    label: "In Workshop / Service",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  OFF_HIRE: {
    label: "Returned / Off-Hire",
    badge: "bg-slate-800 text-slate-400 border-slate-700",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
};

export const MAINTENANCE_TYPE_STYLES: Record<
  string,
  { label: string; badge: string; bg: string; text: string }
> = {
  PREVENTIVE_SERVICE: {
    label: "Preventive PM Service",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  DOSHS_STATUTORY_INSPECTION: {
    label: "DOSHS Statutory Plant Cert",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  BREAKDOWN_REPAIR: {
    label: "Breakdown Repair",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
  TYRE_HYDRAULIC_REPLACEMENT: {
    label: "Hydraulics & Wear Parts",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
};

// ============================================================================
// PHASE 8 STYLES: DAILY SITE REPORTS, PHOTOS, ISSUES/SNAGS & QA/SAFETY
// ============================================================================

export const SITE_REPORT_WEATHER_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  SUNNY_CLEAR: {
    label: "Sunny & Clear (Optimal)",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  PARTLY_CLOUDY: {
    label: "Partly Cloudy & Warm",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  OVERCAST_WINDY: {
    label: "Overcast / High Winds",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
  HEAVY_RAIN: {
    label: "Heavy Rain (Pour Suspended)",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
};

export const SITE_REPORT_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  SUBMITTED: {
    label: "Submitted by Site Agent",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  REVIEWED: {
    label: "Verified & Signed Off",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  FLAGGED_DELAY: {
    label: "Delay / Blocker Flagged",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
};

export const SITE_PHOTO_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PROGRESS: {
    label: "Structural Progress",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  COMPLETED_WORK: {
    label: "Completed Element",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  MATERIALS_DELIVERY: {
    label: "Material Delivery Verification",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  DEFECT_SNAG: {
    label: "Defect / Snag Evidence",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  SAFETY_COMPLIANCE: {
    label: "HSE & Scaffolding Audit",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  SITE_CONDITION: {
    label: "General Site Conditions",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const ISSUE_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  MATERIAL_DELAY: {
    label: "Material Delivery Delay",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  LABOUR_SHORTAGE: {
    label: "Skilled Labour Shortage",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  DESIGN_DRAWING_CLASH: {
    label: "Design / MEP Clash (RFI)",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  BUDGET_VARIATION_RISK: {
    label: "Budget / Cost Overrun Risk",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  },
  WEATHER_DISRUPTION: {
    label: "Weather / Ground Disruption",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  QUALITY_DEFECT_SNAG: {
    label: "Quality Defect / Site Snag",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  SUPPLIER_FAILURE: {
    label: "Supplier / Subcontractor Default",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  SAFETY_HAZARD: {
    label: "Site Safety Hazard",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
};

export const ISSUE_SEVERITY_STYLES: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  LOW: {
    label: "Low Impact",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    dot: "bg-slate-400",
  },
  MEDIUM: {
    label: "Medium Severity",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
  },
  HIGH: {
    label: "High Risk",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  CRITICAL: {
    label: "Critical Blocker",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
};

export const ISSUE_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  OPEN: {
    label: "Open (Action Required)",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  IN_PROGRESS: {
    label: "Mitigation In Progress",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  ESCALATED: {
    label: "Escalated to Consultant/PM",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  RESOLVED: {
    label: "Resolved & Verified",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  CLOSED: {
    label: "Closed",
    badge: "bg-slate-800 text-slate-400 border-slate-700",
  },
};

export const QSI_DOMAIN_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  QUALITY_INSPECTION: {
    label: "QA/QC Engineering Inspection",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  SAFETY_AUDIT: {
    label: "HSE Site Safety Audit",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  SAFETY_INCIDENT: {
    label: "Safety Incident / Near-Miss",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const QSI_TYPE_STYLES: Record<string, string> = {
  REBAR_PRE_POUR_CHECK: "Pre-Pour Rebar & Formwork Hold Point",
  CONCRETE_CUBE_SLUMP_TEST: "Concrete Slump & 28-Day Cube Crush Test",
  MEP_PRESSURE_TEST: "MEP Conduit & Hydrostatic Pressure Test",
  WATERPROOFING_FLOOD_TEST: "72-Hour Waterproofing Ponding Test",
  SCAFFOLD_WORKING_AT_HEIGHT: "Perimeter Scaffolding & Harness Audit",
  PPE_TOOLBOX_AUDIT: "Site PPE & Morning Toolbox Compliance",
  NEAR_MISS_INCIDENT: "Near-Miss Lifting / Falling Object Report",
  FIRST_AID_INJURY: "Minor First-Aid Site Incident",
  NCA_STATUTORY_AUDIT: "NCA / DOSHS Statutory Compliance Check",
};

export const QSI_RESULT_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PASSED: {
    label: "Passed (Approved to Proceed)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PASSED_WITH_OBSERVATIONS: {
    label: "Passed with Minor Snags",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  REQUIRES_CORRECTION: {
    label: "Requires Rectification",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  FAILED_HOLD_POINT: {
    label: "Failed Hold Point (Stop Work)",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  INCIDENT_CONTAINED: {
    label: "Incident Contained & Logged",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  UNDER_INVESTIGATION: {
    label: "HSE Investigation Active",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
};

// ============================================================================
// PHASE 9 STYLES: FINANCIAL MANAGEMENT (EXPENSES, INVOICES, PAYMENTS, VARIATIONS)
// ============================================================================

export const EXPENSE_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  MATERIALS: {
    label: "Construction Materials",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  LABOUR: {
    label: "Site Labour & Muster Roll",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  EQUIPMENT: {
    label: "Plant, Crane & Fuel",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  SUBCONTRACTORS: {
    label: "Specialist Subcontractors",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  TRANSPORT: {
    label: "Haulage & Tippers",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  PERMITS: {
    label: "NCA / NEMA / County Permits",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  },
  UTILITIES: {
    label: "KPLC Power & Site Water",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PROFESSIONAL_FEES: {
    label: "Consultants & Lab Testing",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  MISCELLANEOUS: {
    label: "HSE PPE, Security & Petty Cash",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const EXPENSE_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  APPROVED_PAID: {
    label: "Approved & Settled",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  APPROVED_UNPAID: {
    label: "Approved (Payable)",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  PENDING_APPROVAL: {
    label: "Pending QS / PM Sign-Off",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  REJECTED: {
    label: "Disputed / Rejected",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const INVOICE_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  PAID: {
    label: "Paid in Full",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PARTIALLY_PAID: {
    label: "Partially Settled",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  SENT: {
    label: "Issued (Awaiting Payment)",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  OVERDUE: {
    label: "Overdue (>30 Days)",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  DRAFT: {
    label: "Draft Valuation",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const PAYMENT_METHOD_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  MPESA_PAYBILL: {
    label: "M-Pesa Paybill (B2B)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  MPESA_TILL: {
    label: "M-Pesa Buy Goods Till",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  MPESA_B2C: {
    label: "M-Pesa Bulk Wage Payout",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  BANK_RTGS: {
    label: "Bank RTGS Transfer",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  BANK_EFT: {
    label: "Bank EFT / Pesalink",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  CHEQUE: {
    label: "Bankers Cheque",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  PETTY_CASH: {
    label: "Site Petty Cash Float",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
};

export const PAYMENT_DIRECTION_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  INBOUND_CLIENT: {
    label: "Inbound Client Receipt",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  OUTBOUND_SUPPLIER: {
    label: "Supplier LPO Settlement",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  OUTBOUND_CONTRACTOR: {
    label: "Subcontractor IPC Payout",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  OUTBOUND_EXPENSE: {
    label: "Direct Site Disbursement",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
};

export const VARIATION_REASON_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  CLIENT_SCOPE_ADDITION: {
    label: "Client Scope Addition",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  UNFORESEEN_GROUND_CONDITION: {
    label: "Unforeseen Ground / Rock Condition",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  ARCHITECTURAL_REDESIGN: {
    label: "Architectural / Structural Redesign",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  STATUTORY_COMPLIANCE: {
    label: "Statutory / NCA / NEMA Requirement",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  MATERIAL_SPEC_UPGRADE: {
    label: "Material Specification Upgrade",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  },
  VALUE_ENGINEERING_DEDUCTION: {
    label: "Value Engineering Saving (Omission)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

export const VARIATION_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  APPROVED: {
    label: "Approved & Incorporated",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  UNDER_REVIEW: {
    label: "Under QS Valuation",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  PENDING_APPROVAL: {
    label: "Awaiting Client Sign-Off",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  REJECTED: {
    label: "Declined / Withdrawn",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const DOCUMENT_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  CONTRACT: {
    label: "FIDIC / JBC Main Contract",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  ARCHITECTURAL_DRAWING: {
    label: "Architectural Drawing (CAD/BIM)",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  STRUCTURAL_DRAWING: {
    label: "Structural & Rebar Schedule",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  BOQ: {
    label: "Priced Bill of Quantities",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PERMIT_APPROVAL: {
    label: "NCA / NEMA / County Permit",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  SITE_REPORT: {
    label: "Engineering / Geotech Report",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  CERTIFICATE: {
    label: "IPC / Handover Certificate",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  QUOTATION: {
    label: "Tender & Supplier Dossier",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const DOCUMENT_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  APPROVED: {
    label: "Approved for Construction (AFC)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  UNDER_REVIEW: {
    label: "Under Consultant Review",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  DRAFT: {
    label: "Working Draft / WIP",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  SUPERSEDED: {
    label: "Superseded Revision",
    badge: "bg-slate-800 text-slate-400 border-slate-700",
  },
};

export const APPROVAL_TYPE_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  DRAWING_REVISION: {
    label: "Drawing / Shop Drawing Sign-Off",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  VARIATION_ORDER: {
    label: "Variation Order Authorization",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  IPC_VALUATION: {
    label: "Interim Payment Certificate (IPC)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  MATERIAL_SAMPLE: {
    label: "Material Sample & Spec Submittal",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  PURCHASE_REQUISITION: {
    label: "High-Value LPO Authorization",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  STAGE_HANDOVER: {
    label: "Milestone & Practical Handover",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
};

export const APPROVAL_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  APPROVED: {
    label: "Signed Off & Approved",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  PENDING: {
    label: "Pending Sign-Off",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  CHANGES_REQUESTED: {
    label: "Resubmit with Amendments",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  REJECTED: {
    label: "Rejected / Declined",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const APPROVAL_PRIORITY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  CRITICAL: {
    label: "Critical Path Blocker",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  HIGH: {
    label: "High Priority",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  MEDIUM: {
    label: "Standard SLA (48h)",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  LOW: {
    label: "Routine Submittal",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export const PORTAL_UPDATE_CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  EXECUTIVE_PROGRESS_BRIEF: {
    label: "Executive Progress Brief",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  },
  MILESTONE_COMPLETION: {
    label: "Milestone Completion Dispatch",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  FINANCIAL_VALUATION_PACK: {
    label: "IPC & Financial Valuation Pack",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  DESIGN_SELECTION_REQUEST: {
    label: "Client Finish & Spec Selection",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  HANDOVER_DOSSIER: {
    label: "Practical Completion & Handover",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
};

export const PORTAL_SIGNOFF_STATUS_STYLES: Record<
  string,
  { label: string; badge: string }
> = {
  ACKNOWLEDGED: {
    label: "Client Signed Off & Acknowledged",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  AWAITING_CLIENT_REVIEW: {
    label: "Awaiting Client Review",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  CLARIFICATION_REQUESTED: {
    label: "Client Clarification Requested",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
};

