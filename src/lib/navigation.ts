import { PermissionKey } from "./rbac";

export interface NavSubItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  href?: string;
  iconName:
    | "LayoutDashboard"
    | "Building2"
    | "ClipboardCheck"
    | "Package"
    | "ShoppingCart"
    | "Users"
    | "Wrench"
    | "Landmark"
    | "FolderOpen"
    | "BarChart3"
    | "Bell"
    | "Settings"
    | "ShieldCheck";
  requiredPermission?: PermissionKey;
  phaseNumber?: number;
  items?: NavSubItem[];
}

export const STRUCTA_NAVIGATION: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    iconName: "LayoutDashboard",
    requiredPermission: "dashboard:view",
    phaseNumber: 1,
  },
  {
    id: "projects",
    label: "Projects",
    iconName: "Building2",
    requiredPermission: "projects:view",
    phaseNumber: 2,
    items: [
      { label: "All Projects", href: "/projects" },
      { label: "Active Projects", href: "/projects?status=ACTIVE" },
      { label: "Completed Projects", href: "/projects?status=COMPLETED" },
      { label: "Clients", href: "/projects?tab=clients" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    iconName: "ClipboardCheck",
    requiredPermission: "projects:view",
    phaseNumber: 3,
    items: [
      { label: "Tasks & Planning", href: "/operations/tasks" },
      { label: "Site Reports", href: "/operations/site-reports" },
      { label: "Progress Tracking", href: "/operations/progress" },
      { label: "Issues & Risks", href: "/operations/issues" },
      { label: "Quality & Safety", href: "/operations/inspections" },
    ],
  },
  {
    id: "materials",
    label: "Materials",
    iconName: "Package",
    requiredPermission: "materials:view",
    phaseNumber: 5,
    items: [
      { label: "Materials Catalog", href: "/materials" },
      { label: "Material Requests", href: "/materials/requests" },
      { label: "Site Stock", href: "/materials/stock" },
    ],
  },
  {
    id: "procurement",
    label: "Procurement",
    iconName: "ShoppingCart",
    requiredPermission: "procurement:view",
    phaseNumber: 6,
    items: [
      { label: "Suppliers", href: "/procurement/suppliers" },
      { label: "Purchase Orders", href: "/procurement/purchase-orders" },
      { label: "Material Receiving", href: "/procurement/receiving" },
    ],
  },
  {
    id: "people",
    label: "People",
    iconName: "Users",
    requiredPermission: "workforce:view",
    phaseNumber: 7,
    items: [
      { label: "Workforce & Labour", href: "/people/workforce" },
      { label: "Contractors", href: "/people/contractors" },
    ],
  },
  {
    id: "equipment",
    label: "Equipment",
    iconName: "Wrench",
    requiredPermission: "projects:view",
    phaseNumber: 7,
    items: [
      { label: "Equipment Fleet", href: "/equipment" },
      { label: "Maintenance Logs", href: "/equipment?tab=maintenance" },
    ],
  },
  {
    id: "finance",
    label: "Finance & BOQ",
    iconName: "Landmark",
    requiredPermission: "boq:view",
    phaseNumber: 4,
    items: [
      { label: "BOQ Management", href: "/finance/boq" },
      { label: "Budgets", href: "/finance/budgets" },
      { label: "Expenses", href: "/finance/expenses" },
      { label: "Invoices", href: "/finance/invoices" },
      { label: "Payments", href: "/finance/payments" },
      { label: "Variations", href: "/finance/variations" },
    ],
  },
  {
    id: "documents",
    label: "Documents & Portal",
    iconName: "FolderOpen",
    requiredPermission: "documents:view",
    phaseNumber: 10,
    items: [
      { label: "Document Vault", href: "/documents" },
      { label: "Approvals & Sign-Offs", href: "/documents/approvals" },
      { label: "Client Portal", href: "/documents/client-portal" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    iconName: "BarChart3",
    requiredPermission: "reports:view",
    phaseNumber: 11,
  },
  {
    id: "notifications",
    label: "Notifications & Alerts",
    href: "/notifications",
    iconName: "Bell",
    phaseNumber: 12,
  },
  {
    id: "administration",
    label: "Administration",
    iconName: "ShieldCheck",
    requiredPermission: "users:view",
    phaseNumber: 15,
    items: [
      { label: "SaaS & Subscriptions", href: "/saas" },
      { label: "Deployment & Ops", href: "/deployment" },
      { label: "Security & Hardening", href: "/security" },
      { label: "Users & Team", href: "/users" },
      { label: "Roles & Permissions", href: "/roles" },
      { label: "Audit Logs", href: "/audit-logs" },
      { label: "Organization Settings", href: "/settings" },
    ],
  },
];
