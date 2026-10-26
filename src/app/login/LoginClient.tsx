"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Lock,
  Building2,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import {
  loginAction,
  quickSwitchUserAction,
  registerOrganizationAction,
} from "@/app/actions/foundation";
import { ROLES, UserRole } from "@/lib/rbac";
import { StructaLogoIcon } from "@/components/ui/StructaLogo";
import { cn } from "@/lib/utils";

interface LoginDemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  department: string | null;
  organization: {
    id: string;
    name: string;
    code: string;
    ncaRegistration: string | null;
    city: string | null;
  };
}

export function LoginClient({ demoUsers }: { demoUsers: LoginDemoUser[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerOrganizationAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleQuickDemoLogin = (userId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await quickSwitchUserAction(userId);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  const summitUsers = demoUsers.filter(
    (u) => u.organization.code === "SBC-KE"
  );
  const otherTenantUsers = demoUsers.filter(
    (u) => u.organization.code !== "SBC-KE"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Left Column — Brand & Authentication Form */}
      <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-925 p-6 sm:p-10 flex flex-col justify-between">
        <div>
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <StructaLogoIcon size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  STRUCTA
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  VERSALY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The Operating System for Construction Companies
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mt-8 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={cn(
                "rounded-lg py-2 text-xs font-semibold transition-all",
                mode === "login"
                  ? "bg-brand-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Operator Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={cn(
                "rounded-lg py-2 text-xs font-semibold transition-all",
                mode === "register"
                  ? "bg-brand-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              New Construction Firm
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Corporate Work Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue="david.kamau@summitbuild.co.ke"
                  placeholder="name@company.co.ke"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] font-mono text-brand-400">
                    Demo: Structa@2026
                  </span>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  defaultValue="Structa@2026"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors"
              >
                <span>{isPending ? "Authenticating..." : "Sign In to Command Center"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Construction Company Name
                  </label>
                  <input
                    name="companyName"
                    required
                    placeholder="e.g. Apex Builders Kenya Ltd"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Short Code
                  </label>
                  <input
                    name="code"
                    required
                    placeholder="ABK"
                    maxLength={10}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono uppercase text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    NCA Registration Class
                  </label>
                  <input
                    name="ncaRegistration"
                    defaultValue="NCA-1 Building & Civil"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    KRA Tax PIN
                  </label>
                  <input
                    name="taxPin"
                    placeholder="P051..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono uppercase text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Headquarters City
                  </label>
                  <input
                    name="city"
                    required
                    defaultValue="Nairobi"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Company Phone
                  </label>
                  <input
                    name="phone"
                    required
                    placeholder="+254 7..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization Owner Name
                </label>
                <input
                  name="ownerName"
                  required
                  placeholder="Eng. Jane Muthoni"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Owner Email
                  </label>
                  <input
                    name="ownerEmail"
                    type="email"
                    required
                    placeholder="jane@apexbuilders.co.ke"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    defaultValue="Structa@2026"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors"
              >
                <span>{isPending ? "Provisioning Workspace..." : "Create Isolated Organization"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Security Assurance Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Mandatory Multi-Tenant Isolation & Server-Side RBAC Enforcement</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-400 shrink-0" />
            <span>Plan projects • Control costs • Manage sites • Build better</span>
          </div>
        </div>
      </div>

      {/* Right Column — Instant Multi-Role & Multi-Tenant Demo Selector */}
      <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 px-3 py-1 text-xs font-medium text-brand-300">
              <UserCheck className="h-3.5 w-3.5" />
              Interactive Role & Tenant Launchpad
            </span>
            <h1 className="text-2xl font-bold text-white mt-3">
              One-Click Role Sign-In — Summit Build Contractors Ltd.
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Click any pre-configured construction operator below to sign in immediately with that role&apos;s exact permissions, navigation visibility, and tenant scope.
            </p>
          </div>

          {/* Primary Tenant: Summit Build Contractors Ltd. */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-brand-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Summit Build Contractors Ltd. (Primary Demo Tenant)
                  </h2>
                  <p className="text-xs text-slate-400">
                    NCA-1 Registered • Currency: KSh • Nairobi, Kenya
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                9 Roles Provisioned
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {summitUsers.map((u) => {
                const roleMeta = ROLES[u.role as UserRole] || ROLES.PROJECT_MANAGER;
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleQuickDemoLogin(u.id)}
                    className="group text-left rounded-xl border border-slate-800 bg-slate-900/90 hover:border-brand-500/50 hover:bg-slate-900 p-3.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded border",
                            roleMeta.badgeColor
                          )}
                        >
                          {roleMeta.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-brand-400 transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-slate-100 mt-2.5 group-hover:text-brand-300">
                        {u.name}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {u.jobTitle}
                      </p>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 truncate mt-3 pt-2 border-t border-slate-800/80">
                      {u.email}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Tenant: Multi-Tenant Isolation Proof */}
          {otherTenantUsers.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Multi-Tenant Isolation Verification Tenant
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sign in as a separate construction company to verify strict tenant data isolation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {otherTenantUsers.map((u) => {
                  const roleMeta = ROLES[u.role as UserRole] || ROLES.ORGANIZATION_OWNER;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickDemoLogin(u.id)}
                      className="group text-left rounded-xl border border-slate-800 bg-slate-900 hover:border-amber-500/50 p-3.5 transition-all flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {u.organization.name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded border",
                              roleMeta.badgeColor
                            )}
                          >
                            {roleMeta.shortLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          {u.name} — {u.jobTitle}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {u.email}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
