import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuditLogsClient, type SerializedAuditLog } from "./AuditLogsClient";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const logsRaw = await prisma.auditLog.findMany({
    where: {
      organizationId: ctx.organization.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const logs: SerializedAuditLog[] = logsRaw.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    description: log.description,
    previousValue: log.previousValue,
    newValue: log.newValue,
    createdAt: log.createdAt.toISOString(),
    operatorName: log.user?.name || "System Watchdog",
    operatorEmail: log.user?.email || "system@structa.co.ke",
    operatorRole: log.user?.role || "SYSTEM",
  }));

  return (
    <AuthenticatedLayout>
      <AuditLogsClient
        organizationName={ctx.organization.name}
        organizationCode={ctx.organization.code}
        logs={logs}
      />
    </AuthenticatedLayout>
  );
}
