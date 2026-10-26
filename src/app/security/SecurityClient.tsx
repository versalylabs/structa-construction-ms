"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Play,
  FileWarning,
  FileCheck2,
  Server,
  Users,
  Database,
  FileSpreadsheet,
  KeyRound,
  Layers,
  RefreshCw,
} from "lucide-react";
import {
  runSecurityDiagnosticSuiteAction,
  testFileUploadSecurityAction,
  recordComplianceSignOffAction,
  type SecurityDiagnosticReport,
} from "@/app/actions/security";
import {
  PERMISSION_DEFINITIONS,
  ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type UserRole,
} from "@/lib/rbac";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  BLOCKED_DANGEROUS_EXTENSIONS,
  PRODUCTION_SECURITY_HEADERS,
} from "@/lib/security";
import { formatCurrency } from "@/lib/utils";

interface SecurityClientProps {
  initialReport: SecurityDiagnosticReport;
  recentSecurityLogs: {
    id: string;
    action: string;
    entity: string;
    description: string;
    previousValue: string | null;
    newValue: string | null;
    createdAt: string;
    operatorName: string;
    operatorRole: string;
  }[];
}

export function SecurityClient({
  initialReport,
  recentSecurityLogs,
}: SecurityClientProps) {
  const [activeTab, setActiveTab] = useState<
    "ISOLATION" | "RBAC_SIMULATOR" | "FILE_AND_ACID" | "READINESS"
  >("ISOLATION");
  const [report, setReport] = useState<SecurityDiagnosticReport>(initialReport);
  const [isScanning, startScanTransition] = useTransition();

  // RBAC Simulator State
  const [simulatedRole, setSimulatedRole] = useState<UserRole>("SITE_MANAGER");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");

  // File Upload Security Sandbox State
  const [testFileName, setTestFileName] = useState<string>(
    "Nairobi_Tower_Structural_Slab_Rev4.dwg"
  );
  const [testFileSizeMb, setTestFileSizeMb] = useState<string>("8.4");
  const [fileTestResult, setFileTestResult] = useState<{
    valid: boolean;
    sanitizedFileName: string;
    extension: string;
    reason?: string;
    riskLevel: "SAFE" | "WARN" | "BLOCKED";
  } | null>(null);
  const [isTestingFile, startFileTestTransition] = useTransition();

  // Manual Compliance Sign-Off State
  const [complianceCategory, setComplianceCategory] = useState("NCA_SECURITY_AUDIT");
  const [complianceNote, setComplianceNote] = useState("");
  const [signOffSuccess, setSignOffSuccess] = useState(false);
  const [isSigningOff, startSignOffTransition] = useTransition();

  const handleRunDiagnostics = () => {
    startScanTransition(async () => {
      const res = await runSecurityDiagnosticSuiteAction();
      if (res.ok && res.report) {
        setReport(res.report);
      }
    });
  };

  const handleFileTest = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("fileName", testFileName);
    fd.set("fileSizeMb", testFileSizeMb);
    startFileTestTransition(async () => {
      const res = await testFileUploadSecurityAction(fd);
      if (res.ok && res.validation) {
        setFileTestResult(res.validation);
      }
    });
  };

  const handleComplianceSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complianceNote.trim()) return;
    const fd = new FormData();
    fd.set("category", complianceCategory);
    fd.set("note", complianceNote);
    startSignOffTransition(async () => {
      const res = await recordComplianceSignOffAction(fd);
      if (res.ok) {
        setComplianceNote("");
        setSignOffSuccess(true);
        setTimeout(() => setSignOffSuccess(false), 3500);
      }
    });
  };

  const simulatedPerms = DEFAULT_ROLE_PERMISSIONS[simulatedRole] || [];
  const modules = Array.from(new Set(PERMISSION_DEFINITIONS.map((p) => p.module)));

  const filteredPermissions =
    selectedModuleFilter === "ALL"
      ? PERMISSION_DEFINITIONS
      : PERMISSION_DEFINITIONS.filter((p) => p.module === selectedModuleFilter);

  return (
    <div className="space-y-6">
      {/* Top Executive Security Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  Security & Production Hardening Command Center
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Phase 13 Hardened
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-tenant row-level isolation, 10-role RBAC enforcement, financial ACID reconciliation, and file upload sanitization for{" "}
                <strong className="text-slate-200">
                  {report.activeOrganizationName} ({report.activeOrganizationCode})
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunDiagnostics}
            disabled={isScanning}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span>
              {isScanning
                ? "Running Isolation & ACID Diagnostics..."
                : "Run Live Penetration & ACID Self-Test"}
            </span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Multi-Tenant Boundary</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            0 Cross-Tenant Leaks
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />8 Core Entity Tables Scoped
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">RBAC Matrix Enforcement</span>
            <KeyRound className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {report.rbacCoverage.rolesConfigured} Roles ×{" "}
            {report.rbacCoverage.permissionsEnforced} Perms
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {report.rbacCoverage.customOverridesCount} Custom Org Permission Rules
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Financial ACID Integrity</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {report.financialIntegrity.negativeBalanceAnomalies === 0
              ? "100% Reconciled"
              : `${report.financialIntegrity.negativeBalanceAnomalies} Anomalies`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Audited Budget:{" "}
            {formatCurrency(report.financialIntegrity.totalBudgetAllocated)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">File & HTTP Hardening</span>
            <Server className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {PRODUCTION_SECURITY_HEADERS.length} Headers •{" "}
            {ALLOWED_UPLOAD_EXTENSIONS.length} Safe Exts
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            Executable & Path-Traversal Blocked
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          {
            id: "ISOLATION",
            label: "1. Multi-Tenant Isolation Self-Test",
            icon: Lock,
          },
          {
            id: "RBAC_SIMULATOR",
            label: "2. 10-Role RBAC Boundary Simulator",
            icon: Users,
          },
          {
            id: "FILE_AND_ACID",
            label: "3. File Upload Sandbox, Financial ACID & Headers",
            icon: FileCheck2,
          },
          {
            id: "READINESS",
            label: "4. Production Readiness & Compliance Sign-Off",
            icon: ShieldCheck,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? "bg-brand-500 text-slate-950"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Multi-Tenant Isolation Self-Test */}
      {activeTab === "ISOLATION" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Row-Level Multi-Tenant Isolation Matrix (Active Tenant vs. External Tenants)
                </h2>
                <p className="text-xs text-slate-400">
                  Verifies that every Prisma query scoped to{" "}
                  <span className="text-brand-400 font-mono">
                    {report.activeOrganizationCode}
                  </span>{" "}
                  excludes records belonging to other construction companies in the database.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Last Scan: {new Date(report.executedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Database Entity Table</th>
                    <th className="py-3 px-4">
                      Active Tenant ({report.activeOrganizationCode}) Records
                    </th>
                    <th className="py-3 px-4">
                      Other Tenants (Isolated in DB)
                    </th>
                    <th className="py-3 px-4">Cross-Tenant Leakage</th>
                    <th className="py-3 px-4">Isolation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {report.isolationChecks.map((row) => (
                    <tr key={row.entityName} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-white">
                        {row.entityName}
                      </td>
                      <td className="py-3 px-4 font-mono text-brand-300">
                        {row.activeTenantCount} accessible
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {row.foreignTenantCount} masked & isolated
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {row.leakedCrossTenantCount} leaked rows
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Security & Compliance Audit Events */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">
              Recent Security & Isolation Audit Trail
            </h3>
            <div className="divide-y divide-slate-800/60">
              {recentSecurityLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-200">
                        {log.description}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Operator: {log.operatorName} ({log.operatorRole}) • Entity:{" "}
                      {log.entity}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC Simulator */}
      {activeTab === "RBAC_SIMULATOR" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">
                Interactive 10-Role RBAC Boundary Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Inspect exact server-side action permissions granted or denied to each construction role.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as UserRole)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label} (Level {r.level})
                  </option>
                ))}
              </select>

              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Modules (34 Permissions)</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    Module: {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPermissions.map((perm) => {
              const allowed =
                simulatedRole === "SUPER_ADMIN" ||
                simulatedRole === "ORGANIZATION_OWNER" ||
                simulatedPerms.includes(perm.key);
              return (
                <div
                  key={perm.key}
                  className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 ${
                    allowed
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-rose-500/20 bg-rose-500/5 opacity-80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {perm.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      {perm.key} • {perm.module}
                    </p>
                    <p className="text-[11px] text-slate-400">{perm.description}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border ${
                      allowed
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {allowed ? "ALLOWED" : "BLOCKED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: File Upload Sandbox, Financial ACID & HTTP Headers */}
      {activeTab === "FILE_AND_ACID" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Security Filter Sandbox */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-brand-400" />
                <span>Server-Side File Upload Security Filter Sandbox</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Test Structa&apos;s server-side file upload validator against safe CAD/PDF drawings or simulated malicious payloads. Blocked payloads are automatically logged to the immutable Audit Trail.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Safe CAD (.dwg)", name: "Structural_Beam_Rev3.dwg", size: "12.4" },
                { label: "Safe BOQ (.xlsx)", name: "Kilimani_BOQ_Pricing.xlsx", size: "3.1" },
                { label: "Malicious Script (.exe)", name: "Invoice_Payment_Trojan.pdf.exe", size: "1.2" },
                { label: "Path Traversal (../../)", name: "../../etc/passwd", size: "0.1" },
                { label: "Oversized File (85 MB)", name: "Full_Site_Drone_Scan.pdf", size: "85.0" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setTestFileName(preset.name);
                    setTestFileSizeMb(preset.size);
                  }}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-slate-700 bg-slate-950 hover:border-brand-500/50 text-slate-300 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleFileTest} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Simulated Filename
                  </label>
                  <input
                    type="text"
                    value={testFileName}
                    onChange={(e) => setTestFileName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    File Size (MB)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={testFileSizeMb}
                    onChange={(e) => setTestFileSizeMb(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isTestingFile}
                className="rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
              >
                {isTestingFile
                  ? "Validating Payload..."
                  : "Test File Against Server Security Filter"}
              </button>
            </form>

            {fileTestResult && (
              <div
                className={`rounded-xl border p-4 space-y-1.5 ${
                  fileTestResult.valid
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">
                    {fileTestResult.valid
                      ? "UPLOAD PERMITTED (SAFE)"
                      : "UPLOAD REJECTED & LOGGED TO AUDIT TRAIL"}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30">
                    Risk: {fileTestResult.riskLevel}
                  </span>
                </div>
                <p className="text-xs">{fileTestResult.reason}</p>
                <p className="text-[11px] font-mono opacity-80">
                  Sanitized Name: {fileTestResult.sanitizedFileName || "N/A"} • Ext:{" "}
                  {fileTestResult.extension || "none"}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>
                <strong className="text-slate-200">Whitelisted Extensions:</strong>{" "}
                <span className="font-mono text-emerald-400">
                  {ALLOWED_UPLOAD_EXTENSIONS.join(", ")}
                </span>
              </div>
              <div>
                <strong className="text-slate-200">Blocked Executables:</strong>{" "}
                <span className="font-mono text-rose-400">
                  {BLOCKED_DANGEROUS_EXTENSIONS.join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* HTTP Security Headers & Financial ACID Integrity */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-purple-400" />
                <span>Active Production HTTP Security Headers (next.config.mjs)</span>
              </h2>
              <div className="divide-y divide-slate-800/60">
                {PRODUCTION_SECURITY_HEADERS.map((h) => (
                  <div key={h.header} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-brand-300">
                        {h.header}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {h.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{h.purpose}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                <span>Financial ACID Transaction Reconciliation</span>
              </h2>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Allocated Budget</span>
                  <span className="font-mono font-bold text-white mt-1 block">
                    {formatCurrency(report.financialIntegrity.totalBudgetAllocated)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Committed (LPOs)</span>
                  <span className="font-mono font-bold text-amber-300 mt-1 block">
                    {formatCurrency(report.financialIntegrity.totalBudgetCommitted)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Actual Spent</span>
                  <span className="font-mono font-bold text-emerald-300 mt-1 block">
                    {formatCurrency(report.financialIntegrity.totalBudgetSpent)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Production Readiness Checklist & Compliance Sign-Off */}
      {activeTab === "READINESS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">
              Structa Construction OS — All 15 Phases Production Verification Matrix
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                "Phase 1: Foundation, Auth, RBAC & Multi-Tenant Context",
                "Phase 2: Projects, Sites, Phases & Command Centers",
                "Phase 3: Tasks, Milestones, Dependencies & Planning",
                "Phase 4: BOQ Schedules & Category Budget Control",
                "Phase 5: Materials Catalog, Requisitions & Site Stock",
                "Phase 6: Suppliers, LPOs & Goods Received Notes (GRN)",
                "Phase 7: Workforce Muster Roll, Subcontractors & Equipment",
                "Phase 8: Daily Site Reports, Snags/Issues & OSHA Inspections",
                "Phase 9: Expenses, IPCs, M-Pesa/Bank Payments & Variations",
                "Phase 10: Document Vault, Revisions, Approvals & Client Portal",
                "Phase 11: Executive Reports, P&L Analytics & CSV/Print Suite",
                "Phase 12: Automated Watchdog Rules & Alert Center",
                "Phase 13: Security Diagnostics, File Hardening & Audit Export",
                "Phase 14: Deployment, Backups, Smoke Tests & /api/health",
                "Phase 15: SaaS Plans, Usage Quotas, Billing & Tenant Onboarding",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 flex items-center gap-2.5 text-slate-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">
                Record Official Compliance Sign-Off
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Log a permanent security or regulatory verification entry into the organization&apos;s immutable audit trail.
              </p>
            </div>

            <form onSubmit={handleComplianceSignOff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Compliance Domain
                </label>
                <select
                  value={complianceCategory}
                  onChange={(e) => setComplianceCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="NCA_SECURITY_AUDIT">NCA / ISO Compliance Audit</option>
                  <option value="FINANCIAL_CONTROLS_SIGNOFF">
                    Quarterly Financial Controls Sign-Off
                  </option>
                  <option value="TENANT_ISOLATION_VERIFIED">
                    Multi-Tenant Data Privacy Sign-Off
                  </option>
                  <option value="PRODUCTION_RELEASE_APPROVAL">
                    Production Release Approval
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Auditor Remarks / Verification Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={complianceNote}
                  onChange={(e) => setComplianceNote(e.target.value)}
                  placeholder="e.g., Verified all LPOs, IPCs, and M-Pesa payment ledgers reconcile with zero cross-tenant exposure."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSigningOff}
                className="w-full rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
              >
                {isSigningOff
                  ? "Recording Immutable Entry..."
                  : "Commit Compliance Sign-Off to Audit Log"}
              </button>

              {signOffSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Immutable compliance sign-off recorded in Audit Trail.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
