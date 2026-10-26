import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientPortalClient } from "./ClientPortalClient";

export default async function ClientPortalPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [portalUpdates, projects, documentsCount, pendingApprovalsCount] =
    await Promise.all([
      prisma.clientPortalUpdate.findMany({
        where: { organizationId: ctx.organization.id },
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              location: true,
              contractValue: true,
              invoicedAmount: true,
              paidAmount: true,
              progress: true,
            },
          },
          client: {
            select: {
              id: true,
              code: true,
              name: true,
              contactPerson: true,
              email: true,
              phone: true,
            },
          },
          publishedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.findMany({
        where: { organizationId: ctx.organization.id },
        include: {
          client: {
            select: {
              id: true,
              code: true,
              name: true,
              contactPerson: true,
              email: true,
            },
          },
          _count: {
            select: {
              documents: true,
              clientInvoices: true,
              milestones: true,
            },
          },
        },
        orderBy: { code: "asc" },
      }),
      prisma.projectDocument.count({
        where: { organizationId: ctx.organization.id },
      }),
      prisma.approvalWorkflowItem.count({
        where: { organizationId: ctx.organization.id, status: "PENDING" },
      }),
    ]);

  return (
    <AuthenticatedLayout>
      <ClientPortalClient
        portalUpdates={portalUpdates.map((u) => ({
          ...u,
          acknowledgedAt: u.acknowledgedAt
            ? u.acknowledgedAt.toISOString()
            : null,
          createdAt: u.createdAt.toISOString(),
        }))}
        projects={projects.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          location: p.location,
          status: p.status,
          progress: p.progress,
          contractValue: p.contractValue,
          invoicedAmount: p.invoicedAmount,
          paidAmount: p.paidAmount,
          client: p.client,
          counts: p._count,
        }))}
        documentsCount={documentsCount}
        pendingApprovalsCount={pendingApprovalsCount}
        canPublish={
          ctx.can("documents:manage") ||
          ctx.can("projects:manage") ||
          ctx.can("dashboard:view")
        }
      />
    </AuthenticatedLayout>
  );
}
