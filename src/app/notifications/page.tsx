import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [notifications, automationRules] = await Promise.all([
    prisma.notification.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.automationWatchdogRule.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { ruleCode: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <NotificationsClient
        organizationName={ctx.organization.name}
        notifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
        automationRules={automationRules.map((r) => ({
          ...r,
          lastTriggeredAt: r.lastTriggeredAt
            ? r.lastTriggeredAt.toISOString()
            : null,
          createdAt: r.createdAt.toISOString(),
        }))}
        canManageAutomation={
          ctx.can("settings:manage") || ctx.can("projects:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
