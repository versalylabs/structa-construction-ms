"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Clock,
  ArrowUpRight,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Radio,
  Mail,
  MessageSquare,
  Smartphone,
  X,
  Power,
} from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/foundation";
import {
  runAutomatedWatchdogScanAction,
  toggleAutomationRuleAction,
  markSingleNotificationReadAction,
  createBroadcastNotificationAction,
} from "@/app/actions/notifications-automation";
import { cn, formatDateTime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link: string | null;
  isRead: string;
  createdAt: string;
}

interface WatchdogRuleItem {
  id: string;
  ruleCode: string;
  ruleType: string;
  name: string;
  description: string;
  thresholdCondition: string;
  severity: string;
  channelsJson: string;
  targetRoles: string;
  isEnabled: boolean;
  alertsGeneratedCount: number;
  lastTriggeredAt: string | null;
}

export function NotificationsClient({
  organizationName,
  notifications,
  automationRules,
  canManageAutomation,
}: {
  organizationName: string;
  notifications: NotificationItem[];
  automationRules: WatchdogRuleItem[];
  canManageAutomation: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"ALERTS_FEED" | "WATCHDOG_RULES">(
    "ALERTS_FEED"
  );
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => n.isRead === "FALSE").length;
  const criticalCount = notifications.filter(
    (n) => n.type === "CRITICAL"
  ).length;
  const activeRulesCount = automationRules.filter((r) => r.isEnabled).length;
  const totalAutoAlertsTriggered = automationRules.reduce(
    (s, r) => s + r.alertsGeneratedCount,
    0
  );

  const filteredNotifications = notifications.filter((n) => {
    const matchesCat =
      categoryFilter === "ALL" || n.category === categoryFilter;
    const matchesRead =
      readFilter === "ALL" ||
      (readFilter === "UNREAD" && n.isRead === "FALSE") ||
      (readFilter === "CRITICAL" && n.type === "CRITICAL");
    const matchesSearch =
      !search.trim() ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesRead && matchesSearch;
  });

  function handleRunWatchdogScan() {
    startTransition(async () => {
      await runAutomatedWatchdogScanAction();
      setFeedback(
        "Live Automated Watchdog Scan completed across Budgets, Site Stock, Client Invoices, Schedules, and Site Issues."
      );
    });
  }

  function handleToggleRule(ruleId: string, ruleCode: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ruleId", ruleId);
      await toggleAutomationRuleAction(fd);
      setFeedback(`Updated status for watchdog rule ${ruleCode}.`);
    });
  }

  function handleMarkSingleRead(notificationId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("notificationId", notificationId);
      await markSingleNotificationReadAction(fd);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Notifications & Automated Watchdog Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time threshold alerts for budgets, overdue IPC invoices, low site stock, delayed schedules, and multi-channel automation rules for{" "}
            <strong className="text-slate-200">{organizationName}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRunWatchdogScan}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            <span>
              {isPending ? "Scanning..." : "Run Live Watchdog Scan"}
            </span>
          </button>

          {canManageAutomation && (
            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-sky-400" />
              <span>Broadcast Alert</span>
            </button>
          )}

          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-4 w-4 text-emerald-400" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Unread Alerts</span>
            <Bell className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-brand-400">
            {unreadCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Out of {notifications.length} persistent notifications
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Critical Escalations
            </span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {criticalCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Schedule delays, budget risk & overdue IPCs
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Active Watchdog Rules
            </span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {activeRulesCount} / {automationRules.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Automated threshold monitors enabled
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Delivery Gateways Ready
            </span>
            <Radio className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            In-App • Email • WhatsApp
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {totalAutoAlertsTriggered} automated triggers logged
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {feedback}
          </span>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ALERTS_FEED")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "ALERTS_FEED"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Operational Alert Stream ({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("WATCHDOG_RULES")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "WATCHDOG_RULES"
                ? "bg-brand-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>
              Automated Watchdog Rules & Channels ({automationRules.length})
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: OPERATIONAL ALERT STREAM */}
      {activeTab === "ALERTS_FEED" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts by project, material, invoice, or rule code..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Alert States</option>
                <option value="UNREAD">Unread Only ({unreadCount})</option>
                <option value="CRITICAL">
                  Critical Priority Only ({criticalCount})
                </option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Operational Domains</option>
                <option value="PROJECT">Project & Schedule</option>
                <option value="BUDGET">Budget & Cost Control</option>
                <option value="PROCUREMENT">Procurement & Site Stock</option>
                <option value="FINANCE">Invoices & Payments</option>
                <option value="SITE">Site Operations & Safety</option>
                <option value="SYSTEM">System & Governance</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((n) => {
              const isUnread = n.isRead === "FALSE";
              const severityBadge =
                n.type === "CRITICAL"
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  : n.type === "WARNING"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : n.type === "SUCCESS"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-sky-500/15 text-sky-300 border-sky-500/30";

              return (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
                    isUnread
                      ? "border-brand-500/40 bg-brand-500/5"
                      : "border-slate-800 bg-slate-900/50"
                  )}
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${severityBadge}`}
                      >
                        {n.type}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {n.category}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {n.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkSingleRead(n.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
                      >
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Mark Read</span>
                      </button>
                    )}

                    {n.link && (
                      <Link
                        href={n.link}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/15 hover:bg-brand-500/25 px-3 py-1.5 text-xs font-bold text-brand-300"
                      >
                        <span>Inspect Module</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-xs text-slate-500">
                No notifications match your current filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED WATCHDOG RULES & MULTI-CHANNEL CONFIG */}
      {activeTab === "WATCHDOG_RULES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automationRules.map((rule) => {
            let channels: string[] = ["IN_APP"];
            try {
              channels = JSON.parse(rule.channelsJson);
            } catch {}

            const sevStyle =
              rule.severity === "CRITICAL"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : rule.severity === "WARNING"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-sky-500/15 text-sky-300 border-sky-500/30";

            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-xl border p-5 flex flex-col justify-between gap-4 transition-colors",
                  rule.isEnabled
                    ? "border-slate-800 bg-slate-900/70"
                    : "border-slate-800/50 bg-slate-950/60 opacity-70"
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-400">
                        {rule.ruleCode}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${sevStyle}`}
                      >
                        {rule.severity}
                      </span>
                    </div>

                    {canManageAutomation && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleToggleRule(rule.id, rule.ruleCode)
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border cursor-pointer",
                          rule.isEnabled
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        <Power className="h-3 w-3" />
                        <span>{rule.isEnabled ? "Enabled" : "Paused"}</span>
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {rule.description}
                  </p>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] font-mono text-brand-300">
                    Trigger Condition: {rule.thresholdCondition}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">
                      Recipients:{" "}
                      <strong className="text-slate-200">
                        {rule.targetRoles}
                      </strong>
                    </span>
                    <span className="font-mono text-emerald-400">
                      {rule.alertsGeneratedCount} Alerts Fired
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {channels.includes("IN_APP") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-brand-300">
                          <Bell className="h-2.5 w-2.5" /> In-App
                        </span>
                      )}
                      {channels.includes("EMAIL") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                          <Mail className="h-2.5 w-2.5" /> Email
                        </span>
                      )}
                      {channels.includes("SMS") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                          <Smartphone className="h-2.5 w-2.5" /> SMS
                        </span>
                      )}
                      {channels.includes("WHATSAPP") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                          <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
                        </span>
                      )}
                    </div>

                    {rule.lastTriggeredAt && (
                      <span className="text-[10px] font-mono text-slate-500">
                        Last Scan: {formatDateTime(rule.lastTriggeredAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Operational Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">
                  Broadcast Organization Alert
                </h2>
                <p className="text-xs text-slate-400">
                  Dispatch an immediate operational, financial, or site safety notification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await createBroadcastNotificationAction(formData);
                  setShowBroadcastModal(false);
                  setFeedback(
                    "Broadcast alert dispatched across the organization."
                  );
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alert Headline *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Urgent Concrete Pour Stand-Down on Block B"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Severity *
                  </label>
                  <select
                    name="type"
                    defaultValue="WARNING"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="CRITICAL">Critical Escalation</option>
                    <option value="WARNING">Warning / Action Required</option>
                    <option value="INFO">Information</option>
                    <option value="SUCCESS">Milestone / Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Domain Category *
                  </label>
                  <select
                    name="category"
                    defaultValue="SITE"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="SITE">Site Operations & Safety</option>
                    <option value="PROJECT">Project & Schedule</option>
                    <option value="BUDGET">Budget & Cost Control</option>
                    <option value="PROCUREMENT">Procurement & Stock</option>
                    <option value="FINANCE">Invoices & Payments</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Module Link
                </label>
                <select
                  name="link"
                  defaultValue="/operations/site-reports"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="/operations/site-reports">
                    Daily Site Reports (/operations/site-reports)
                  </option>
                  <option value="/operations/issues">
                    Issues & Snags (/operations/issues)
                  </option>
                  <option value="/finance/budgets">
                    Project Budgets (/finance/budgets)
                  </option>
                  <option value="/materials/stock">
                    Site Material Stock (/materials/stock)
                  </option>
                  <option value="/finance/invoices">
                    Client Invoices (/finance/invoices)
                  </option>
                  <option value="/documents/approvals">
                    Approvals Desk (/documents/approvals)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Alert Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={3}
                  placeholder="Provide specific instructions for Project Managers, Site Agents, or QS..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 font-bold text-slate-950 cursor-pointer"
                >
                  {isPending ? "Broadcasting..." : "Dispatch Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
