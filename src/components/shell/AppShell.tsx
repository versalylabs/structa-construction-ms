"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  Landmark,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  HardHat,
  LogOut,
  Menu,
  X,
  Search,
  Lock,
  CheckCircle2,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import { STRUCTA_NAVIGATION, NavGroup } from "@/lib/navigation";
import { PermissionKey, ROLES, UserRole } from "@/lib/rbac";
import { logoutAction, quickSwitchUserAction } from "@/app/actions/foundation";
import { StructaLogoIcon } from "@/components/ui/StructaLogo";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  Landmark,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
};

export interface DemoUserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
}

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    jobTitle: string | null;
    department: string | null;
    employeeCode: string | null;
  };
  organization: {
    id: string;
    name: string;
    code: string;
    city: string | null;
    currency: string;
    ncaRegistration: string | null;
    plan: string;
  };
  permissions: PermissionKey[];
  unreadNotificationsCount: number;
  demoUsers: DemoUserOption[];
  children: React.ReactNode;
}

export function AppShell({
  user,
  organization,
  permissions,
  unreadNotificationsCount,
  demoUsers,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const quickJumpModules = [
    { label: "Executive Dashboard", href: "/", tag: "Command Center" },
    { label: "All Projects & Clients", href: "/projects", tag: "Projects" },
    { label: "Tasks & Planning", href: "/operations/tasks", tag: "Operations" },
    { label: "Daily Site Reports", href: "/operations/site-reports", tag: "Operations" },
    { label: "Progress & Milestones", href: "/operations/progress", tag: "Operations" },
    { label: "Issues, Snags & Risks", href: "/operations/issues", tag: "Operations" },
    { label: "Quality & OSHA Safety", href: "/operations/inspections", tag: "Operations" },
    { label: "Materials Catalog", href: "/materials", tag: "Materials" },
    { label: "Material Requests (MR)", href: "/materials/requests", tag: "Materials" },
    { label: "Site Stock & Wastage", href: "/materials/stock", tag: "Materials" },
    { label: "Suppliers Directory", href: "/procurement/suppliers", tag: "Procurement" },
    { label: "Purchase Orders (LPO)", href: "/procurement/purchase-orders", tag: "Procurement" },
    { label: "Material Receiving (GRN)", href: "/procurement/receiving", tag: "Procurement" },
    { label: "Workforce & Muster Roll", href: "/people/workforce", tag: "People" },
    { label: "Subcontractors & IPCs", href: "/people/contractors", tag: "People" },
    { label: "Heavy Equipment Fleet", href: "/equipment", tag: "Equipment" },
    { label: "BOQ Management", href: "/finance/boq", tag: "Finance" },
    { label: "Project Budgets", href: "/finance/budgets", tag: "Finance" },
    { label: "Project Expenses", href: "/finance/expenses", tag: "Finance" },
    { label: "Client Invoices (IPC)", href: "/finance/invoices", tag: "Finance" },
    { label: "M-Pesa & Bank Payments", href: "/finance/payments", tag: "Finance" },
    { label: "Variations & Change Orders", href: "/finance/variations", tag: "Finance" },
    { label: "Document Vault & Revisions", href: "/documents", tag: "Documents" },
    { label: "Approvals & Digital Sign-Offs", href: "/documents/approvals", tag: "Documents" },
    { label: "Executive Client Portal", href: "/documents/client-portal", tag: "Portal" },
    { label: "Executive Reports & P&L Analytics", href: "/reports", tag: "Analytics" },
    { label: "Notifications & Watchdog Rules", href: "/notifications", tag: "Automation" },
    { label: "SaaS Plans, Billing & Onboarding", href: "/saas", tag: "SaaS" },
    { label: "Deployment, Backups & Telemetry", href: "/deployment", tag: "Deployment" },
    { label: "Security & Production Hardening", href: "/security", tag: "Security" },
    { label: "Audit Logs", href: "/audit-logs", tag: "Admin" },
  ];

  // Determine which navigation group owns the current route
  const activeGroupForRoute =
    STRUCTA_NAVIGATION.find((g) =>
      g.items?.some((item) => pathname === item.href.split("?")[0])
    )?.id ?? null;

  // Keep only the active/clicked sidebar dropdown open so opening one never opens others
  const [openGroupId, setOpenGroupId] = useState<string | null>(
    activeGroupForRoute
  );

  const toggleGroup = (id: string) => {
    setOpenGroupId((prev) => (prev === id ? null : id));
  };

  const canAccess = (perm?: PermissionKey) => {
    if (!perm) return true;
    if (user.role === "SUPER_ADMIN" || user.role === "ORGANIZATION_OWNER") return true;
    return permissions.includes(perm);
  };

  const roleMeta = ROLES[user.role] || ROLES.PROJECT_MANAGER;

  const handleQuickSwitch = (targetUserId: string) => {
    setSwitcherOpen(false);
    startTransition(async () => {
      await quickSwitchUserAction(targetUserId);
      router.refresh();
    });
  };

  const renderNavGroup = (group: NavGroup) => {
    const Icon = ICON_MAP[group.iconName] || Building2;
    const permitted = canAccess(group.requiredPermission);

    if (!permitted) {
      return null;
    }

    const isDirectActive = group.href
      ? pathname === group.href
      : group.items?.some((item) => pathname === item.href.split("?")[0]);

    const isExpanded = openGroupId === group.id;

    if (group.href && !group.items) {
      return (
        <Link
          key={group.id}
          href={group.href}
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isDirectActive
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
          )}
        >
          <span className="flex items-center gap-3">
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isDirectActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"
              )}
            />
            <span>{group.label}</span>
          </span>
          {group.id === "notifications" && unreadNotificationsCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-slate-950">
              {unreadNotificationsCount}
            </span>
          )}
        </Link>
      );
    }

    return (
      <div key={group.id} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
            isDirectActive
              ? "text-slate-100 bg-slate-900/90"
              : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
          )}
        >
          <span className="flex items-center gap-3">
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isDirectActive ? "text-brand-400" : "text-slate-500"
              )}
            />
            <span>{group.label}</span>
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          )}
        </button>

        {isExpanded && group.items && (
          <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5">
            {group.items.map((sub) => {
              const cleanHref = sub.href.split("?")[0];
              const isSubActive = pathname === cleanHref;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isSubActive
                      ? "bg-brand-500/10 text-brand-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  )}
                >
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation — Fixed viewport height with independent scroll */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[84vw] max-w-72 sm:w-68 h-screen shrink-0 overflow-hidden bg-slate-925 border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 shrink-0 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <StructaLogoIcon size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base text-white group-hover:text-brand-300 transition-colors">
                  STRUCTA
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  OS
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                by Versaly
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Active Tenant / Organization Card */}
        <div className="shrink-0 p-3 border-b border-slate-800/80 bg-slate-900/40">
          <Link
            href="/saas"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg border border-slate-800 hover:border-brand-500/40 bg-slate-900/90 p-2.5 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400 font-semibold truncate">
                {organization.code} • {organization.plan}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                {organization.currency}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100 truncate mt-1">
              {organization.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {organization.ncaRegistration || `${organization.city || "Nairobi"}, Kenya`}
            </p>
          </Link>
        </div>

        {/* Independently Scrollable Navigation Tree */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Construction Operations
          </div>
          {STRUCTA_NAVIGATION.map(renderNavGroup)}
        </nav>

        {/* Bottom User Profile & Sign Out */}
        <div className="shrink-0 p-3 border-t border-slate-800/80 bg-slate-900/30 space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user.jobTitle || roleMeta.label}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border",
                roleMeta.badgeColor
              )}
            >
              {roleMeta.shortLabel}
            </span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area — Scrolls independently from Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Top Command Header */}
        <header className="sticky top-0 z-30 h-16 shrink-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile / Tablet Header Logo Emblem */}
            <Link href="/" className="lg:hidden flex items-center gap-2 mr-1">
              <StructaLogoIcon size="sm" />
              <div className="flex items-center gap-1">
                <span className="font-bold tracking-tight text-sm text-white">STRUCTA</span>
                <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">OS</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="sm:hidden p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              aria-label="Quick Search Modules"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Quick Global Search Bar with Instant Module Jump Palette (Tablet & Desktop) */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/reports`);
                    setSearchQuery("");
                  }
                }}
                placeholder="Quick jump: Projects, BOQ, LPOs, M-Pesa, Reports, Deployment..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              {searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {quickJumpModules
                    .filter(
                      (item) =>
                        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.tag.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          router.push(item.href);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-200 cursor-pointer"
                      >
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-brand-400">
                          {item.tag}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Interactive Role & Tenant Switcher for Testing RBAC & Isolation */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSwitcherOpen(!switcherOpen)}
                disabled={isPending}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/15 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-brand-300 transition-colors"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span className="hidden md:inline">Switch Role / Tenant:</span>
                <span className="font-semibold text-white truncate max-w-24 sm:max-w-none">
                  {roleMeta.shortLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              </button>

              {switcherOpen && (
                <div className="fixed sm:absolute right-3 left-3 sm:left-auto sm:right-0 mt-2 sm:w-84 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 p-2 z-50">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Instant RBAC & Tenant Switcher
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 mt-1">
                    {demoUsers.map((du) => {
                      const duRole = ROLES[du.role as UserRole] || ROLES.PROJECT_MANAGER;
                      const isCurrent = du.id === user.id;
                      return (
                        <button
                          key={du.id}
                          type="button"
                          onClick={() => handleQuickSwitch(du.id)}
                          className={cn(
                            "w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 transition-colors",
                            isCurrent
                              ? "bg-brand-500/15 border border-brand-500/30"
                              : "hover:bg-slate-800/70"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-100 truncate">
                                {du.name}
                              </span>
                              {isCurrent && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {du.organizationName} ({du.organizationCode})
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border",
                              duRole.badgeColor
                            )}
                          >
                            {duRole.shortLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-brand-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Settings Shortcut */}
            {canAccess("settings:manage") && (
              <Link
                href="/settings"
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                title="Organization Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>
        </header>

        {/* Collapsible Mobile Quick-Jump Search Bar */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-3 py-2.5 bg-slate-900/95 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any Structa module..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
            {searchQuery.trim().length > 0 && (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-slate-950 p-1">
                {quickJumpModules
                  .filter(
                    (item) =>
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.tag.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        setSearchQuery("");
                        setMobileSearchOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-md flex items-center justify-between text-xs text-slate-200"
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-brand-400">
                        {item.tag}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {children}
        </main>

        {/* Subtle Footer */}
        <footer className="px-4 sm:px-6 py-3 border-t border-slate-900 text-[11px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>
              Tenant Isolation Active:{" "}
              <strong className="text-slate-300">{organization.name}</strong> ({organization.code} • {organization.plan})
            </span>
          </div>
          <div>
            <span>STRUCTA Construction OS • Built by Versaly • All Phases 1–15 Complete & Commercial SaaS Ready</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
