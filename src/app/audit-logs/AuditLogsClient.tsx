"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  ShieldCheck,
  User,
  Search,
  Download,
  Filter,
  Lock,
} from "lucide-react";

export interface SerializedAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  operatorName: string;
  operatorEmail: string;
  operatorRole: string;
}

interface AuditLogsClientProps {
  organizationName: string;
  organizationCode: string;
  logs: SerializedAuditLog[];
}

export function AuditLogsClient({
  organizationName,
  organizationCode,
  logs,
}: AuditLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  const uniqueEntities = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entity))).sort(),
    [logs]
  );
  const uniqueActions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (entityFilter !== "ALL" && l.entity !== entityFilter) return false;
      if (actionFilter !== "ALL" && l.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.description.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.operatorName.toLowerCase().includes(q) ||
          (l.previousValue || "").toLowerCase().includes(q) ||
          (l.newValue || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, entityFilter, actionFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      "Timestamp (ISO)",
      "Operator",
      "Role",
      "Action",
      "Entity",
      "Entity ID",
      "Description",
      "Previous State",
      "New State",
    ];
    const rows = filteredLogs.map((l) => [
      l.createdAt,
      l.operatorName,
      l.operatorRole,
      l.action,
      l.entity,
      l.entityId || "",
      l.description.replace(/"/g, '""'),
      (l.previousValue || "").replace(/"/g, '""'),
      (l.newValue || "").replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Structa_Audit_Log_${organizationCode}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Immutable Security & Operational Audit Trail
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical financial, RBAC, and operational records for{" "}
            <strong className="text-slate-200">
              {organizationName} ({organizationCode})
            </strong>{" "}
            cannot be silently overwritten or deleted.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-brand-400" />
            <span>Security & Hardening Center</span>
          </Link>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Audit CSV ({filteredLogs.length})</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            {filteredLogs.length} / {logs.length} Events
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit events by operator, LPO/IPC number, action, or state delta..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Entity:</span>
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">All Entities ({uniqueEntities.length})</option>
            {uniqueEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">All Actions ({uniqueActions.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Timestamp (EAT)</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action & Entity</th>
                <th className="py-3.5 px-4">Event Description</th>
                <th className="py-3.5 px-4">State Delta (Prev → New)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{log.operatorName}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {log.operatorRole}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-brand-500/15 text-brand-300 border border-brand-500/30">
                      {log.action}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      Entity: {log.entity}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 max-w-md">
                    {log.description}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 max-w-xs">
                    {log.previousValue && (
                      <div className="truncate text-amber-400/90">
                        Prev: {log.previousValue}
                      </div>
                    )}
                    {log.newValue && (
                      <div className="truncate text-emerald-400/90">
                        New: {log.newValue}
                      </div>
                    )}
                    {!log.previousValue && !log.newValue && <span>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
