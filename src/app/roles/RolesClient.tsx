"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import {
  PERMISSION_DEFINITIONS,
  PermissionKey,
  ROLES,
  UserRole,
} from "@/lib/rbac";
import { updateRolePermissionsAction } from "@/app/actions/foundation";
import { cn } from "@/lib/utils";

interface RolesClientProps {
  rolePermissionsMap: Record<string, PermissionKey[]>;
  canManageRoles: boolean;
  organizationName: string;
}

export function RolesClient({
  rolePermissionsMap,
  canManageRoles,
  organizationName,
}: RolesClientProps) {
  const configurableRoles: UserRole[] = [
    "ORGANIZATION_OWNER",
    "ADMINISTRATOR",
    "PROJECT_MANAGER",
    "QUANTITY_SURVEYOR",
    "PROCUREMENT_OFFICER",
    "ACCOUNTANT",
    "SITE_MANAGER",
    "SITE_STAFF",
    "CLIENT",
  ];

  const [selectedRole, setSelectedRole] =
    useState<UserRole>("PROJECT_MANAGER");
  const [localPerms, setLocalPerms] = useState<Record<string, PermissionKey[]>>(
    rolePermissionsMap
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPerms = new Set(localPerms[selectedRole] || []);
  const isOwnerRole = selectedRole === "ORGANIZATION_OWNER";

  const togglePerm = (key: PermissionKey) => {
    if (isOwnerRole || !canManageRoles) return;
    setFeedback(null);
    const updated = new Set(currentPerms);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setLocalPerms((prev) => ({
      ...prev,
      [selectedRole]: Array.from(updated),
    }));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData();
    formData.set("role", selectedRole);
    for (const p of currentPerms) {
      formData.append("permissions", p);
    }

    startTransition(async () => {
      const res = await updateRolePermissionsAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Saved ${ROLES[selectedRole].label} permissions to database and recorded audit log.`,
        });
      }
    });
  };

  // Group permissions by module
  const modules = Array.from(
    new Set(PERMISSION_DEFINITIONS.map((p) => p.module))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Configurable Role-Based Access Control (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure granular operational, procurement, and financial capabilities per role for{" "}
            <strong className="text-slate-200">{organizationName}</strong>.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-lg border p-3.5 flex items-center gap-2.5 text-xs",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Construction Roles */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
            Select Construction Role
          </div>
          {configurableRoles.map((roleKey) => {
            const meta = ROLES[roleKey];
            const count = (localPerms[roleKey] || []).length;
            const active = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => {
                  setSelectedRole(roleKey);
                  setFeedback(null);
                }}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-all",
                  active
                    ? "border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/5"
                    : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">
                    {meta.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded border",
                      meta.badgeColor
                    )}
                  >
                    {count} / 34
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Panel: Permission Capabilities Matrix */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {ROLES[selectedRole].label} — Permission Matrix
                  </h2>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded border",
                      ROLES[selectedRole].badgeColor
                    )}
                  >
                    Level {ROLES[selectedRole].level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ROLES[selectedRole].description}
                </p>
              </div>

              {canManageRoles && !isOwnerRole ? (
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{isPending ? "Saving Matrix..." : "Save Role Permissions"}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <Lock className="h-3.5 w-3.5" />
                  {isOwnerRole
                    ? "Organization Owner retains full access"
                    : "Read-only view"}
                </span>
              )}
            </div>

            <div className="p-5 space-y-6">
              {modules.map((mod) => {
                const modPerms = PERMISSION_DEFINITIONS.filter(
                  (p) => p.module === mod
                );
                return (
                  <div key={mod} className="space-y-2.5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-brand-400 border-b border-slate-800 pb-1.5">
                      {mod}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {modPerms.map((perm) => {
                        const checked = currentPerms.has(perm.key);
                        return (
                          <label
                            key={perm.key}
                            onClick={() => togglePerm(perm.key)}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                              checked
                                ? "border-brand-500/30 bg-brand-500/10"
                                : "border-slate-800/80 bg-slate-950/60 hover:border-slate-700"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              disabled={isOwnerRole || !canManageRoles}
                              className="mt-0.5 h-4 w-4 rounded border-slate-700 accent-amber-500"
                            />
                            <div>
                              <div className="text-xs font-semibold text-slate-100">
                                {perm.label}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {perm.description}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 mt-1">
                                {perm.key}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
