import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SaasClient } from "./SaasClient";

export const dynamic = "force-dynamic";

export default async function SaasCommercializationPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const orgId = ctx.organization.id;

  const [
    activeProjectsCount,
    teamUsersCount,
    documentsCount,
    sitePhotosCount,
    poCount,
    invoicesCount,
    auditLogsRaw,
    allOrganizationsRaw,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        organizationId: orgId,
        status: { in: ["ACTIVE", "PLANNING", "DELAYED"] },
      },
    }),
    prisma.user.count({ where: { organizationId: orgId } }),
    prisma.projectDocument.count({ where: { organizationId: orgId } }),
    prisma.sitePhoto.count({ where: { organizationId: orgId } }),
    prisma.purchaseOrder.count({ where: { organizationId: orgId } }),
    prisma.clientInvoice.count({ where: { organizationId: orgId } }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.organization.findMany({
      include: {
        _count: {
          select: {
            projects: true,
            users: true,
          },
        },
        users: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const estimatedStorageGb = Number(
    ((documentsCount * 1.45 + sitePhotosCount * 0.42) + 4.8).toFixed(1)
  );

  const billingLogs = auditLogsRaw
    .filter(
      (l) =>
        l.action.includes("SAAS") ||
        l.action.includes("ONBOARD") ||
        l.action.includes("SETTINGS") ||
        l.action.includes("PAYMENT")
    )
    .slice(0, 12)
    .map((l) => ({
      id: l.id,
      action: l.action,
      invoiceRef: l.entityId || "VSL-SUB-2026",
      description: l.description,
      stateDelta: l.newValue || "VERIFIED",
      createdAt: l.createdAt.toISOString(),
      operatorName: l.user?.name || "Versaly Billing Engine",
    }));

  // Ensure at least one initial billing record is displayed if no custom SaaS logs exist yet
  if (billingLogs.length === 0) {
    billingLogs.push({
      id: "default-saas-inv-001",
      action: "SAAS_SUBSCRIPTION_ACTIVE",
      invoiceRef: "VSL-INV-2026-0101",
      description: `Initial Structa ${ctx.organization.plan} Commercial Subscription for ${ctx.organization.name}.`,
      stateDelta: `${ctx.organization.plan} | ACTIVE`,
      createdAt: ctx.organization.createdAt.toISOString(),
      operatorName: ctx.user.name,
    });
  }

  const tenantDirectory = allOrganizationsRaw.map((o) => ({
    id: o.id,
    name: o.name,
    code: o.code,
    city: o.city || "Nairobi",
    ncaRegistration: o.ncaRegistration || "NCA1 — Building & Civil Works",
    plan: o.plan,
    status: o.status,
    projectsCount: o._count.projects,
    usersCount: o._count.users,
    primaryOwnerId: o.users[0]?.id || null,
    primaryOwnerName: o.users[0]?.name || "Organization Admin",
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <AuthenticatedLayout>
      <SaasClient
        organization={{
          id: ctx.organization.id,
          name: ctx.organization.name,
          code: ctx.organization.code,
          plan: ctx.organization.plan,
          status: ctx.organization.status,
          taxPin: ctx.organization.taxPin,
          ncaRegistration: ctx.organization.ncaRegistration,
          city: ctx.organization.city,
        }}
        usageMetrics={{
          activeProjectsCount,
          teamUsersCount,
          documentsCount,
          estimatedStorageGb,
          monthlyTransactionsCount: poCount + invoicesCount,
        }}
        billingLogs={billingLogs}
        tenantDirectory={tenantDirectory}
      />
    </AuthenticatedLayout>
  );
}
