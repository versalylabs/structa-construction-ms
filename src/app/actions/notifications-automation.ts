"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { formatKES } from "@/lib/utils";

export async function runAutomatedWatchdogScanAction() {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;
  const orgId = organization.id;

  const [
    enabledRules,
    budgetLines,
    lowStocks,
    unpaidInvoices,
    projects,
    criticalTasks,
    openIssues,
    existingUnread,
  ] = await Promise.all([
    prisma.automationWatchdogRule.findMany({
      where: { organizationId: orgId, isEnabled: true },
    }),
    prisma.projectBudgetLine.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { code: true, name: true } } },
    }),
    prisma.projectMaterialStock.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["LOW_STOCK", "CRITICAL_SHORTAGE"] },
      },
      include: {
        project: { select: { code: true, name: true } },
        material: { select: { name: true, unit: true } },
      },
    }),
    prisma.clientInvoice.findMany({
      where: {
        organizationId: orgId,
        balanceAmount: { gt: 0 },
      },
      include: { project: { select: { code: true, name: true } } },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
    }),
    prisma.projectTask.findMany({
      where: {
        organizationId: orgId,
        status: { not: "COMPLETED" },
        priority: { in: ["CRITICAL", "HIGH"] },
      },
      include: { project: { select: { code: true } } },
    }),
    prisma.projectIssue.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["OPEN", "ESCALATED"] },
        severity: { in: ["CRITICAL", "HIGH"] },
      },
      include: { project: { select: { code: true } } },
    }),
    prisma.notification.findMany({
      where: { organizationId: orgId, isRead: "FALSE" },
      select: { title: true },
    }),
  ]);

  const existingTitles = new Set(existingUnread.map((n) => n.title));
  const candidateNotifications: {
    title: string;
    message: string;
    type: string;
    category: string;
    link: string;
    ruleType: string;
  }[] = [];

  // 1. Budget Threshold Watchdog
  const riskyBudgets = budgetLines.filter((b) => {
    if (b.allocatedBudget <= 0) return false;
    const exposurePct =
      (Math.max(b.committedCost, b.actualCost) / b.allocatedBudget) * 100;
    return exposurePct >= b.alertThresholdPct;
  });
  if (riskyBudgets.length > 0) {
    const top = riskyBudgets[0];
    candidateNotifications.push({
      ruleType: "BUDGET_THRESHOLD_EXCEEDED",
      title: `[Watchdog] ${riskyBudgets.length} Budget Lines Above Threshold (${top.project.code})`,
      message: `Budget line ${top.code} (${top.title}) on ${top.project.name} has committed/actual exposure of ${formatKES(Math.max(top.committedCost, top.actualCost))} against ${formatKES(top.allocatedBudget)} allocation.`,
      type: "WARNING",
      category: "BUDGET",
      link: "/finance/budgets",
    });
  }

  // 2. Low Material Stock Watchdog
  if (lowStocks.length > 0) {
    const first = lowStocks[0];
    candidateNotifications.push({
      ruleType: "LOW_MATERIAL_STOCK_REORDER",
      title: `[Watchdog] ${lowStocks.length} Site Store Items Below Reorder Level`,
      message: `${first.material.name} at ${first.project.code} has ${first.remainingQuantity} ${first.material.unit} remaining (Reorder threshold: ${first.reorderLevel} ${first.material.unit}).`,
      type: "WARNING",
      category: "PROCUREMENT",
      link: "/materials/stock",
    });
  }

  // 3. Unpaid / Overdue Client Invoices Watchdog
  if (unpaidInvoices.length > 0) {
    const totalDue = unpaidInvoices.reduce((s, i) => s + i.balanceAmount, 0);
    candidateNotifications.push({
      ruleType: "OVERDUE_CLIENT_INVOICE",
      title: `[Watchdog] Outstanding IPC Receivables: ${formatKES(totalDue)}`,
      message: `${unpaidInvoices.length} certified client valuation invoice(s) have an unpaid balance totaling ${formatKES(totalDue)}. Follow up with client finance teams.`,
      type: "CRITICAL",
      category: "FINANCE",
      link: "/finance/invoices",
    });
  }

  // 4. Delayed Projects Watchdog
  const delayedProjs = projects.filter(
    (p) => p.status === "DELAYED" || p.progress < p.plannedProgress - 5
  );
  if (delayedProjs.length > 0) {
    const dp = delayedProjs[0];
    candidateNotifications.push({
      ruleType: "PROJECT_SCHEDULE_DELAY",
      title: `[Watchdog] Schedule Slippage Detected on ${dp.code} (${dp.name})`,
      message: `${dp.name} is at ${dp.progress}% actual completion vs. ${dp.plannedProgress}% baseline target. Review critical path recovery tasks.`,
      type: "CRITICAL",
      category: "PROJECT",
      link: "/operations/progress",
    });
  }

  // 5. Critical Path Task Deadlines Watchdog
  if (criticalTasks.length > 0) {
    candidateNotifications.push({
      ruleType: "APPROACHING_TASK_DEADLINE",
      title: `[Watchdog] ${criticalTasks.length} Critical/High Priority Site Tasks Active`,
      message: `${criticalTasks.length} high-priority engineering tasks across active sites require weekly progress sign-off.`,
      type: "INFO",
      category: "PROJECT",
      link: "/operations/tasks",
    });
  }

  // 6. Site Issues & Hold-Point Watchdog
  if (openIssues.length > 0) {
    const topIss = openIssues[0];
    candidateNotifications.push({
      ruleType: "QUALITY_SAFETY_HOLD_POINT",
      title: `[Watchdog] ${openIssues.length} High/Critical Site Issues Require Action`,
      message: `Issue ${topIss.issueCode} ("${topIss.title}") on ${topIss.project.code} remains ${topIss.status}.`,
      type: "CRITICAL",
      category: "SITE",
      link: "/operations/issues",
    });
  }

  const enabledRuleTypes = new Set(enabledRules.map((r) => r.ruleType));
  const toInsert = candidateNotifications.filter(
    (c) => enabledRuleTypes.has(c.ruleType) && !existingTitles.has(c.title)
  );

  await prisma.$transaction(async (tx) => {
    for (const item of toInsert) {
      await tx.notification.create({
        data: {
          organizationId: orgId,
          userId: currentUser.id,
          title: item.title,
          message: item.message,
          type: item.type,
          category: item.category,
          link: item.link,
          isRead: "FALSE",
        },
      });
    }

    for (const rule of enabledRules) {
      const matched = toInsert.filter((i) => i.ruleType === rule.ruleType).length;
      await tx.automationWatchdogRule.update({
        where: { id: rule.id },
        data: {
          lastTriggeredAt: new Date(),
          ...(matched > 0
            ? { alertsGeneratedCount: { increment: matched } }
            : {}),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: orgId,
        userId: currentUser.id,
        action: "AUTOMATION_WATCHDOG_SCAN",
        entity: "AutomationWatchdogRule",
        entityId: "WATCHDOG-ENGINE",
        description: `Executed automated watchdog scan across ${enabledRules.length} active rules (${toInsert.length} new alerts generated).`,
      },
    });
  });

  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function toggleAutomationRuleAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const ruleId = String(formData.get("ruleId") || "").trim();
  if (!ruleId) return;

  const existing = await prisma.automationWatchdogRule.findFirst({
    where: { id: ruleId, organizationId: organization.id },
  });
  if (!existing) return;

  const nextEnabled = !existing.isEnabled;

  await prisma.$transaction(async (tx) => {
    await tx.automationWatchdogRule.update({
      where: { id: ruleId },
      data: { isEnabled: nextEnabled },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "AUTOMATION_RULE_TOGGLED",
        entity: "AutomationWatchdogRule",
        entityId: existing.ruleCode,
        description: `${nextEnabled ? "Enabled" : "Paused"} automation rule ${existing.ruleCode} (${existing.name})`,
      },
    });
  });

  revalidatePath("/notifications");
}

export async function markSingleNotificationReadAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;

  const notificationId = String(formData.get("notificationId") || "").trim();
  if (!notificationId) return;

  await prisma.notification.updateMany({
    where: { id: notificationId, organizationId: ctx.organization.id },
    data: { isRead: "TRUE" },
  });

  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function createBroadcastNotificationAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const type = String(formData.get("type") || "INFO").trim();
  const category = String(formData.get("category") || "SYSTEM").trim();
  const link = String(formData.get("link") || "/projects").trim();

  if (!title || !message) return;

  await prisma.$transaction(async (tx) => {
    await tx.notification.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        title,
        message,
        type,
        category,
        link,
        isRead: "FALSE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "NOTIFICATION_BROADCAST",
        entity: "Notification",
        entityId: category,
        description: `Broadcasted ${type} alert [${category}]: "${title}"`,
      },
    });
  });

  revalidatePath("/notifications");
  revalidatePath("/");
}
