export type UserRole =
  | "SUPER_ADMIN"
  | "ORGANIZATION_OWNER"
  | "ADMINISTRATOR"
  | "PROJECT_MANAGER"
  | "SITE_MANAGER"
  | "QUANTITY_SURVEYOR"
  | "PROCUREMENT_OFFICER"
  | "ACCOUNTANT"
  | "SITE_STAFF"
  | "CLIENT";

export type PermissionKey =
  | "dashboard:view"
  | "projects:view"
  | "projects:manage"
  | "planning:manage"
  | "boq:view"
  | "boq:manage"
  | "budgets:view"
  | "budgets:manage"
  | "materials:view"
  | "materials:request"
  | "materials:manage"
  | "procurement:view"
  | "procurement:approve"
  | "procurement:po_manage"
  | "workforce:view"
  | "workforce:manage"
  | "contractors:manage"
  | "equipment:manage"
  | "site_reports:view"
  | "site_reports:submit"
  | "quality_safety:manage"
  | "finance:view"
  | "finance:expenses"
  | "finance:invoices"
  | "finance:payments"
  | "variations:submit"
  | "variations:approve"
  | "documents:view"
  | "documents:manage"
  | "reports:view"
  | "users:view"
  | "users:manage"
  | "settings:manage"
  | "audit:view";

export interface RoleMetadata {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  badgeColor: string;
  level: number;
}

export const ROLES: Record<UserRole, RoleMetadata> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    label: "Super Admin (Versaly)",
    shortLabel: "Super Admin",
    description: "Versaly platform administrator with global multi-tenant oversight.",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    level: 100,
  },
  ORGANIZATION_OWNER: {
    role: "ORGANIZATION_OWNER",
    label: "Organization Owner",
    shortLabel: "Org Owner",
    description: "Full executive & administrative access to the company's Structa account.",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    level: 90,
  },
  ADMINISTRATOR: {
    role: "ADMINISTRATOR",
    label: "Administrator",
    shortLabel: "Admin",
    description: "Manages company operations, users, roles, and system configuration.",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    level: 80,
  },
  PROJECT_MANAGER: {
    role: "PROJECT_MANAGER",
    label: "Project Manager",
    shortLabel: "Project Mgr",
    description: "Manages assigned construction projects, phases, tasks, schedules, and progress.",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    level: 70,
  },
  QUANTITY_SURVEYOR: {
    role: "QUANTITY_SURVEYOR",
    label: "Quantity Surveyor",
    shortLabel: "QS",
    description: "Manages Bills of Quantities (BOQ), project budgets, cost valuations, and variations.",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    level: 65,
  },
  PROCUREMENT_OFFICER: {
    role: "PROCUREMENT_OFFICER",
    label: "Procurement Officer",
    shortLabel: "Procurement",
    description: "Manages suppliers, quotations, material request approvals, and purchase orders.",
    badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    level: 60,
  },
  ACCOUNTANT: {
    role: "ACCOUNTANT",
    label: "Accountant / Finance",
    shortLabel: "Finance",
    description: "Manages project expenses, client invoices, supplier payables, and payment records.",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    level: 60,
  },
  SITE_MANAGER: {
    role: "SITE_MANAGER",
    label: "Site Manager",
    shortLabel: "Site Mgr",
    description: "Manages day-to-day site operations, daily site reports, workforce, and material receiving.",
    badgeColor: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    level: 55,
  },
  SITE_STAFF: {
    role: "SITE_STAFF",
    label: "Site Staff / Foreman",
    shortLabel: "Site Staff",
    description: "Records field activities, material requests, deliveries, and site progress updates.",
    badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    level: 30,
  },
  CLIENT: {
    role: "CLIENT",
    label: "Client Representative",
    shortLabel: "Client",
    description: "Read-only portal access to assigned project progress, documents, invoices, and variations.",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    level: 10,
  },
};

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  module: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: "dashboard:view", label: "View Executive Dashboard", module: "Dashboard", description: "Access company-wide construction KPIs and charts" },
  { key: "projects:view", label: "View Projects & Sites", module: "Projects", description: "View project command centers, phases, and site details" },
  { key: "projects:manage", label: "Create & Edit Projects", module: "Projects", description: "Create projects, update status, and assign project teams" },
  { key: "planning:manage", label: "Manage Phases & Tasks", module: "Planning & Tasks", description: "Create phases, schedule tasks, milestones, and dependencies" },
  { key: "boq:view", label: "View Bills of Quantities", module: "BOQ & Budgets", description: "View project BOQ items, quantities, and unit rates" },
  { key: "boq:manage", label: "Manage BOQ Items", module: "BOQ & Budgets", description: "Create, edit, and price BOQ schedules" },
  { key: "budgets:view", label: "View Project Budgets", module: "BOQ & Budgets", description: "View budget vs committed vs actual cost breakdowns" },
  { key: "budgets:manage", label: "Manage Budgets", module: "BOQ & Budgets", description: "Establish and revise project category budgets" },
  { key: "materials:view", label: "View Materials & Site Stock", module: "Materials", description: "View material catalog, site stock, and usage logs" },
  { key: "materials:request", label: "Submit Material Requests", module: "Materials", description: "Request materials from construction sites" },
  { key: "materials:manage", label: "Manage Material Stock & Receiving", module: "Materials", description: "Record site deliveries, usage, and wastage" },
  { key: "procurement:view", label: "View Suppliers & POs", module: "Procurement", description: "View supplier profiles and purchase orders" },
  { key: "procurement:approve", label: "Approve Material Requests", module: "Procurement", description: "Approve or reject site material requisitions" },
  { key: "procurement:po_manage", label: "Create & Issue Purchase Orders", module: "Procurement", description: "Manage suppliers and issue official Purchase Orders" },
  { key: "workforce:view", label: "View Workforce & Attendance", module: "People & Equipment", description: "View site workers, attendance, and labour allocation" },
  { key: "workforce:manage", label: "Manage Workforce & Attendance", module: "People & Equipment", description: "Register workers and log daily site attendance" },
  { key: "contractors:manage", label: "Manage Subcontractors", module: "People & Equipment", description: "Manage subcontractor contracts, assignments, and valuations" },
  { key: "equipment:manage", label: "Manage Construction Equipment", module: "People & Equipment", description: "Track machinery allocation, usage, and maintenance" },
  { key: "site_reports:view", label: "View Site Reports & Photos", module: "Site Operations", description: "Read daily site reports, progress logs, and site photos" },
  { key: "site_reports:submit", label: "Submit Site Reports & Issues", module: "Site Operations", description: "Create daily site reports, upload photos, and log issues" },
  { key: "quality_safety:manage", label: "Manage Quality & Safety", module: "Site Operations", description: "Record quality inspections, defects, and safety incidents" },
  { key: "finance:view", label: "View Financial Overview", module: "Finance", description: "View project profitability, expenses, invoices, and payments" },
  { key: "finance:expenses", label: "Record Project Expenses", module: "Finance", description: "Log project expenses against budget categories" },
  { key: "finance:invoices", label: "Manage Client Invoices", module: "Finance", description: "Generate and issue client invoices" },
  { key: "finance:payments", label: "Record Payments (Cash/Bank/M-Pesa)", module: "Finance", description: "Record incoming client payments and outgoing supplier payments" },
  { key: "variations:submit", label: "Submit Project Variations", module: "Variations", description: "Propose project scope or cost variations" },
  { key: "variations:approve", label: "Approve Project Variations", module: "Variations", description: "Approve variations that adjust contract value and budget" },
  { key: "documents:view", label: "View Project Documents", module: "Documents", description: "View drawings, contracts, permits, and certificates" },
  { key: "documents:manage", label: "Upload & Manage Documents", module: "Documents", description: "Upload and organize project documentation" },
  { key: "reports:view", label: "Access Analytics & Reports", module: "Reports", description: "Generate and export operational and financial reports" },
  { key: "users:view", label: "View Organization Users", module: "Administration", description: "View staff directory and assigned roles" },
  { key: "users:manage", label: "Manage Users & Roles", module: "Administration", description: "Create users, change roles, and manage permissions" },
  { key: "settings:manage", label: "Manage Organization Settings", module: "Administration", description: "Configure company profile, tax, currency, and numbering" },
  { key: "audit:view", label: "View Security Audit Logs", module: "Administration", description: "Inspect immutable operational and financial audit trails" },
];

const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_DEFINITIONS.map((p) => p.key);

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: ALL_PERMISSION_KEYS,
  ORGANIZATION_OWNER: ALL_PERMISSION_KEYS,
  ADMINISTRATOR: ALL_PERMISSION_KEYS,
  PROJECT_MANAGER: [
    "dashboard:view",
    "projects:view",
    "projects:manage",
    "planning:manage",
    "boq:view",
    "budgets:view",
    "materials:view",
    "materials:request",
    "materials:manage",
    "procurement:view",
    "procurement:approve",
    "workforce:view",
    "workforce:manage",
    "contractors:manage",
    "equipment:manage",
    "site_reports:view",
    "site_reports:submit",
    "quality_safety:manage",
    "finance:view",
    "finance:expenses",
    "variations:submit",
    "documents:view",
    "documents:manage",
    "reports:view",
    "users:view",
  ],
  QUANTITY_SURVEYOR: [
    "dashboard:view",
    "projects:view",
    "boq:view",
    "boq:manage",
    "budgets:view",
    "budgets:manage",
    "materials:view",
    "procurement:view",
    "contractors:manage",
    "site_reports:view",
    "finance:view",
    "variations:submit",
    "variations:approve",
    "documents:view",
    "documents:manage",
    "reports:view",
  ],
  PROCUREMENT_OFFICER: [
    "dashboard:view",
    "projects:view",
    "boq:view",
    "budgets:view",
    "materials:view",
    "materials:manage",
    "procurement:view",
    "procurement:approve",
    "procurement:po_manage",
    "documents:view",
    "documents:manage",
    "reports:view",
  ],
  ACCOUNTANT: [
    "dashboard:view",
    "projects:view",
    "boq:view",
    "budgets:view",
    "procurement:view",
    "workforce:view",
    "finance:view",
    "finance:expenses",
    "finance:invoices",
    "finance:payments",
    "documents:view",
    "reports:view",
    "audit:view",
  ],
  SITE_MANAGER: [
    "dashboard:view",
    "projects:view",
    "planning:manage",
    "boq:view",
    "materials:view",
    "materials:request",
    "materials:manage",
    "procurement:view",
    "workforce:view",
    "workforce:manage",
    "equipment:manage",
    "site_reports:view",
    "site_reports:submit",
    "quality_safety:manage",
    "documents:view",
    "documents:manage",
  ],
  SITE_STAFF: [
    "projects:view",
    "materials:view",
    "materials:request",
    "materials:manage",
    "workforce:view",
    "site_reports:view",
    "site_reports:submit",
    "documents:view",
  ],
  CLIENT: [
    "projects:view",
    "site_reports:view",
    "documents:view",
    "finance:view",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: PermissionKey,
  customPermissions?: PermissionKey[]
): boolean {
  if (role === "SUPER_ADMIN" || role === "ORGANIZATION_OWNER") {
    return true;
  }
  const activePermissions = customPermissions ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  return activePermissions.includes(permission);
}
